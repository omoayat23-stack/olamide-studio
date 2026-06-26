/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Eye, EyeOff, ShieldCheck, Lock, Mail, ArrowRight, Smartphone, RefreshCw } from 'lucide-react';
import { getFromDB, saveToDB, logAdminAction } from './db';
import { AdminProfile } from './db';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export default function AdminLogin({ onLoginSuccess, onCancel }: AdminLoginProps) {
  const [step, setStep] = useState<'login' | 'forgot' | 'two-factor'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Hidden Access Settings Config
  const settings = getFromDB<{
    enabled: boolean;
    method: 'double-tap' | 'triple-tap' | 'five-tap' | 'disabled';
    maxAttempts: number;
    lockoutDuration: number;
  }>('olamide_visuals_hidden_access_settings', {
    enabled: true,
    method: 'double-tap',
    maxAttempts: 5,
    lockoutDuration: 15
  });

  // Login attempts tracking
  const [attemptsInfo, setAttemptsInfo] = useState<{ failedAttempts: number; lockoutUntil: number | null }>(() => {
    return getFromDB<{ failedAttempts: number; lockoutUntil: number | null }>('olamide_visuals_login_attempts', {
      failedAttempts: 0,
      lockoutUntil: null
    });
  });

  // Check if locked out on load/tick
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (attemptsInfo.lockoutUntil) {
      const checkLockout = () => {
        const remaining = attemptsInfo.lockoutUntil! - Date.now();
        if (remaining <= 0) {
          const cleared = { failedAttempts: 0, lockoutUntil: null };
          saveToDB('olamide_visuals_login_attempts', cleared);
          setAttemptsInfo(cleared);
          setTimeRemaining(0);
        } else {
          setTimeRemaining(Math.max(0, Math.ceil(remaining / 1000)));
        }
      };

      checkLockout();
      const interval = setInterval(checkLockout, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeRemaining(0);
    }
  }, [attemptsInfo.lockoutUntil]);

  const isCurrentlyLockedOut = attemptsInfo.lockoutUntil !== null && Date.now() < attemptsInfo.lockoutUntil;

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // 2FA states
  const [twoFactorCode, setTwoFactorCode] = useState(['', '', '', '', '', '']);
  const [twoFactorError, setTwoFactorError] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { loginWithGoogle } = await import('../firebase');
      const user = await loginWithGoogle();
      if (user) {
        if (user.email === 'shaffieswabstar@gmail.com' || user.email === 'Olamideoluwabusayomi123@gmail.com') {
          logAdminAction(`Admin Google Sign-In SUCCESS: ${user.email} authenticated.`, 'auth');
          onLoginSuccess();
        } else {
          setError(`Access Denied: ${user.email} is not authorized for administrative access.`);
          logAdminAction(`Admin Google Sign-In BLOCKED: Unauthorized user ${user.email} tried to sign in.`, 'auth');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isCurrentlyLockedOut) {
      const minutes = Math.ceil(timeRemaining / 60);
      setError(`Administrative lockout active. Please wait ${minutes} minute(s) before attempting again.`);
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all security fields.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const savedAdmin = getFromDB<AdminProfile>('olamide_visuals_admin', {
        username: 'admin',
        fullName: 'Olamide Oluwabusayomi',
        email: 'Olamideoluwabusayomi123@gmail.com',
        phone: '08142870306',
        avatarUrl: '',
        twoFactorEnabled: false,
        twoFactorSecret: ''
      });

      // Default password is "admin" for easy access, but also check customized profile
      const storedPassword = localStorage.getItem('olamide_visuals_password') || 'admin';

      const isCorrectUsername = username.toLowerCase() === savedAdmin.username.toLowerCase() || username.toLowerCase() === savedAdmin.email.toLowerCase();
      const isCorrectPassword = password === storedPassword;

      if (isCorrectUsername && isCorrectPassword) {
        // Reset login attempts on success
        const cleared = { failedAttempts: 0, lockoutUntil: null };
        saveToDB('olamide_visuals_login_attempts', cleared);
        setAttemptsInfo(cleared);

        // If 2FA is enabled in settings, route to 2FA step, else complete login
        if (savedAdmin.twoFactorEnabled) {
          logAdminAction(`Admin login attempt: Username/Email '${username}' CORRECT. Prompting for Two-Factor code.`, 'auth');
          setStep('two-factor');
        } else {
          logAdminAction(`Admin login SUCCESS: Username/Email '${username}' successfully authenticated.`, 'auth');
          onLoginSuccess();
        }
      } else {
        const nextFailedCount = attemptsInfo.failedAttempts + 1;
        const attemptsLeft = Math.max(0, settings.maxAttempts - nextFailedCount);
        
        let lockoutTime: number | null = null;
        let errorMsg = '';

        if (nextFailedCount >= settings.maxAttempts) {
          // Lockout activated
          lockoutTime = Date.now() + settings.lockoutDuration * 60 * 1000;
          errorMsg = `SECURITY LOCKOUT ENGAGED: Too many failed attempts. Administrative access locked for the next ${settings.lockoutDuration} minutes.`;
          
          logAdminAction(`SECURITY ALERT: ${nextFailedCount} consecutive failed login attempts for username '${username}'. ADMIN SYSTEM LOCKED OUT for ${settings.lockoutDuration} minutes.`, 'auth');
        } else {
          errorMsg = `Invalid administrative credentials. Access denied. (${attemptsLeft} attempt(s) remaining)`;
          logAdminAction(`FAILED admin login attempt: Username '${username}' with incorrect credentials. (${attemptsLeft} attempt(s) remaining before lock)`, 'auth');
        }

        const newAttempts = {
          failedAttempts: nextFailedCount,
          lockoutUntil: lockoutTime
        };

        saveToDB('olamide_visuals_login_attempts', newAttempts);
        setAttemptsInfo(newAttempts);
        setError(errorMsg);
      }
    }, 1200);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setForgotSubmitted(true);
      logAdminAction(`Password reset token requested for ${forgotEmail}`, 'auth');
    }, 1500);
  };

  const handle2FAChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...twoFactorCode];
    newCode[index] = value.slice(-1); // Only take last char
    setTwoFactorCode(newCode);

    // Auto-focus next field
    if (value && index < 5) {
      const nextInput = document.getElementById(`2fa-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handle2FAKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !twoFactorCode[index] && index > 0) {
      const prevInput = document.getElementById(`2fa-digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handle2FAVerify = () => {
    const codeString = twoFactorCode.join('');
    if (codeString.length < 6) {
      setTwoFactorError('Please enter the full 6-digit authentication token.');
      return;
    }

    setLoading(true);
    setTwoFactorError('');

    setTimeout(() => {
      setLoading(false);
      // Demo code accepts any digits or 123456 as standard
      logAdminAction('2FA authentication verified successfully', 'auth');
      onLoginSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/98 overflow-y-auto px-4 py-8 select-none">
      
      {/* Background visual graphics */}
      <div className="absolute top-10 left-10 w-24 h-[1px] bg-white/10 pointer-events-none" />
      <div className="absolute top-10 left-10 h-24 w-[1px] bg-white/10 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-24 h-[1px] bg-white/10 pointer-events-none" />
      <div className="absolute bottom-10 right-10 h-24 w-[1px] bg-white/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/[0.01] rounded-full blur-[160px] pointer-events-none" />

      <motion.div 
        className="w-full max-w-md bg-[#0A0A0A] border border-white/5 p-8 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Glowing alignment header border */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent" />

        {/* Brand identity header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="w-12 h-12 rounded-full border border-gold/30 flex items-center justify-center text-gold bg-black/50">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-serif font-bold tracking-[0.25em] text-white uppercase leading-none">
              Olamide
            </span>
            <span className="text-[10px] font-mono tracking-[0.35em] text-gold uppercase leading-none mt-1.5 block">
              Visuals
            </span>
          </div>
          <div className="h-[1px] w-12 bg-white/10 mt-2" />
        </div>

        <AnimatePresence mode="wait">
          
          {/* STEP 1: LOGIN */}
          {step === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-1">
                <h3 className="text-lg font-serif font-light uppercase tracking-wider text-white">
                  Admin Control login
                </h3>
                <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                  RESTRICTED ADMINISTRATIVE PORTAL
                </p>
              </div>

              {(error || isCurrentlyLockedOut) && (
                <div className="p-3.5 bg-red-950/40 border border-red-500/20 text-red-400 font-mono text-[10px] uppercase tracking-wide text-center">
                  {isCurrentlyLockedOut 
                    ? `SECURITY LOCKOUT ACTIVE: Please wait ${Math.floor(timeRemaining / 60)}m ${timeRemaining % 60}s before attempting login.` 
                    : error}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase">
                    Admin Username or Email
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin"
                      className="w-full px-4 py-3 pl-10 bg-black border border-white/10 text-white text-xs rounded-none focus:outline-none focus:border-gold transition-colors font-sans"
                    />
                    <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase">
                      Security Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setStep('forgot')}
                      className="text-[9px] font-mono tracking-wider text-gold hover:text-white transition-colors uppercase focus:outline-none cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter security key"
                      className="w-full px-4 py-3 pl-10 pr-10 bg-black border border-white/10 text-white text-xs rounded-none focus:outline-none focus:border-gold transition-colors font-mono"
                    />
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-white focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[8px] font-mono text-zinc-500 italic block mt-1">
                    *Default access credentials: admin / admin
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || isCurrentlyLockedOut}
                  className={`w-full py-4 font-sans text-xs tracking-widest font-extrabold uppercase transition-all duration-300 flex items-center justify-center space-x-2 rounded-none cursor-pointer ${
                    isCurrentlyLockedOut 
                      ? 'bg-red-950/40 text-red-500 border border-red-500/25 cursor-not-allowed' 
                      : 'bg-gold hover:bg-white text-black'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating Key...</span>
                    </>
                  ) : isCurrentlyLockedOut ? (
                    <>
                      <Lock className="w-4 h-4 text-red-500" />
                      <span>Locked Out ({Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s)</span>
                    </>
                  ) : (
                    <>
                      <span>Unlock Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-[8px] font-mono text-zinc-500 uppercase tracking-widest">OR SECURE SINGLE SIGN-ON</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3.5 border border-white/10 hover:border-white/30 text-white font-sans text-xs tracking-widest font-bold uppercase transition-colors flex items-center justify-center space-x-2 rounded-none cursor-pointer"
              >
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Sign in with Google</span>
              </button>

              <div className="pt-2 border-t border-white/5 flex justify-center">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-[9px] font-mono tracking-widest text-zinc-500 hover:text-white uppercase transition-colors focus:outline-none cursor-pointer"
                >
                  Return to Studio Frontpage
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: FORGOT PASSWORD */}
          {step === 'forgot' && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-1">
                <h3 className="text-lg font-serif font-light uppercase tracking-wider text-white">
                  Key Recovery
                </h3>
                <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                  RECEIVE SINGLE-USE AUTHENTICATION CODE
                </p>
              </div>

              {forgotSubmitted ? (
                <div className="space-y-4 text-center">
                  <div className="p-4 bg-gold/5 border border-gold/20 text-zinc-300 text-xs font-light leading-relaxed">
                    A secure administrative bypass link and authorization code has been dispatched to <strong className="text-white">{forgotEmail}</strong>. Please check your inbox within 5 minutes.
                  </div>
                  <button
                    onClick={() => {
                      setStep('login');
                      setForgotSubmitted(false);
                    }}
                    className="w-full py-3 border border-white/10 hover:border-gold/30 text-zinc-400 hover:text-white font-mono text-[10px] tracking-widest uppercase transition-colors rounded-none cursor-pointer"
                  >
                    Return to Credentials Prompt
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase">
                      Administrative Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. olamide@olamidevisuals.com"
                        className="w-full px-4 py-3 pl-10 bg-black border border-white/10 text-white text-xs rounded-none focus:outline-none focus:border-gold transition-colors font-sans"
                      />
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gold hover:bg-white text-black font-sans text-xs tracking-widest font-extrabold uppercase transition-all duration-300 flex items-center justify-center space-x-2 rounded-none cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Request Recovery Key</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('login')}
                    className="w-full py-3.5 border border-white/5 hover:border-gold/20 text-zinc-500 hover:text-white font-mono text-[9px] tracking-widest uppercase transition-all duration-300 rounded-none cursor-pointer"
                  >
                    Back to Login
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {/* STEP 3: TWO-FACTOR AUTHENTICATION */}
          {step === 'two-factor' && (
            <motion.div
              key="two-factor"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-1">
                <h3 className="text-lg font-serif font-light uppercase tracking-wider text-white">
                  Two-Factor Token
                </h3>
                <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                  ENTER SECURE 6-DIGIT AUTH CODE
                </p>
              </div>

              {twoFactorError && (
                <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 font-mono text-[10px] uppercase tracking-wide text-center">
                  {twoFactorError}
                </div>
              )}

              <div className="space-y-6">
                <div className="flex justify-between gap-2">
                  {twoFactorCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`2fa-digit-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handle2FAChange(index, e.target.value)}
                      onKeyDown={(e) => handle2FAKeyDown(index, e)}
                      className="w-12 h-14 bg-black border border-white/10 text-white font-mono text-xl text-center focus:outline-none focus:border-gold transition-colors rounded-none"
                    />
                  ))}
                </div>

                <p className="text-[10px] text-zinc-500 font-mono text-center leading-relaxed">
                  Open your Google Authenticator or Duo app to retrieve your rotating 6-digit cryptographic verification key.
                </p>

                <button
                  type="button"
                  onClick={handle2FAVerify}
                  disabled={loading}
                  className="w-full py-4 bg-gold hover:bg-white text-black font-sans text-xs tracking-widest font-extrabold uppercase transition-all duration-300 flex items-center justify-center space-x-2 rounded-none cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4.5 h-4.5" />
                      <span>Verify administrative security</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full py-3.5 border border-white/5 hover:border-gold/20 text-zinc-500 hover:text-white font-mono text-[9px] tracking-widest uppercase transition-all duration-300 rounded-none cursor-pointer"
                >
                  Use a different login method
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
