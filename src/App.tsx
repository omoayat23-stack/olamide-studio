/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Portfolio from './components/Portfolio';
import Stats from './components/Stats';
import WhyChooseUs from './components/WhyChooseUs';
import Testimonials from './components/Testimonials';
import FeaturedShowcase from './components/FeaturedShowcase';
import InstagramFeed from './components/InstagramFeed';
import Contact from './components/Contact';
import BookingForm from './components/BookingForm';
import Footer from './components/Footer';

// Admin Panel Integration
import { initDB, getFromDB } from './admin/db';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import { auth, startFirebaseSync, logoutUser } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [preselectedService, setPreselectedService] = useState('');

  // Administrative Control States
  const [adminState, setAdminState] = useState<'client' | 'admin-login' | 'admin-dashboard'>('client');
  const [logoClicks, setLogoClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Initialize DB, restore sessions, and handle hash routing on mount
  useEffect(() => {
    initDB();
    const activeSession = localStorage.getItem('olamide_visuals_admin_session');
    if (activeSession === 'true') {
      setAdminState('admin-dashboard');
    }

    // Direct url secure query bypass for testing & admins
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setAdminState('admin-login');
    }

    // Dynamic hash routing handler
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validPages = ['home', 'about', 'services', 'portfolio', 'why-us', 'testimonials', 'contact'];
      if (validPages.includes(hash)) {
        setCurrentPage(hash);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (!hash) {
        setCurrentPage('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initialize current hash status on mount
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Synchronize authentication and start Firestore sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      const isAdmin = user && (
        user.email === 'shaffieswabstar@gmail.com' || 
        user.email === 'Olamideoluwabusayomi123@gmail.com'
      );
      if (isAdmin) {
        setAdminState('admin-dashboard');
        localStorage.setItem('olamide_visuals_admin_session', 'true');
      }
      startFirebaseSync(!!isAdmin);
    });

    return () => unsubscribeAuth();
  }, []);

  const handlePageChange = (pageId: string) => {
    window.location.hash = pageId;
  };

  // Handle Logo Click counts to reveal login portal
  const handleLogoClick = () => {
    // Read dynamic settings
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

    if (!settings.enabled || settings.method === 'disabled') {
      return; // Logo tapping is disabled by owner
    }

    const requiredTaps = settings.method === 'double-tap' ? 2 
                       : settings.method === 'triple-tap' ? 3 
                       : settings.method === 'five-tap' ? 5 
                       : 2;

    const now = Date.now();
    // Allow up to 2 seconds between taps to register consecutive tap sequence
    if (now - lastClickTime < 2000) {
      const clicks = logoClicks + 1;
      setLogoClicks(clicks);
      if (clicks >= requiredTaps) {
        setLogoClicks(0);
        setAdminState('admin-login');
      }
    } else {
      setLogoClicks(1);
    }
    setLastClickTime(now);
  };

  const handleLoginSuccess = () => {
    localStorage.setItem('olamide_visuals_admin_session', 'true');
    setAdminState('admin-dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('olamide_visuals_admin_session');
    logoutUser().catch(() => {});
    setAdminState('client');
  };

  // Handle smooth scroll directly to booking section
  const handleScrollToBooking = (serviceName?: string) => {
    if (serviceName) {
      setPreselectedService(serviceName);
    }
    // Set URL hash to services page first
    window.location.hash = 'services';

    // Wait slightly for mounting transition, then execute smooth focal scroll
    setTimeout(() => {
      const element = document.querySelector('#booking');
      if (element) {
        const offset = 80; // Offset for navbar
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }, 200);
  };

  // Admin Dashboard takes fullscreen priority over client view
  if (adminState === 'admin-dashboard') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <>
      {/* 1. Shutter camera aperture preloader */}
      <Preloader onComplete={() => setIsLoading(false)} />

      {!isLoading && (
        <div className="bg-zinc-950 min-h-screen text-white select-text antialiased flex flex-col justify-between">
          
          <div>
            {/* 2. Glassmorphic Sticky Header - framed badge logo & always solid to avoid clashing with backgrounds */}
            <Navbar 
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onBookClick={() => handleScrollToBooking('')} 
              onLogoClick={handleLogoClick}
            />

            {/* 3. Screen content container with elegant fade-slide animations */}
            <div className="pt-24">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  {currentPage === 'home' && (
                    <>
                      <Hero
                        onExploreClick={() => handlePageChange('portfolio')}
                        onBookClick={() => handleScrollToBooking('')}
                      />
                      <Stats />
                      <FeaturedShowcase />
                      <InstagramFeed />
                    </>
                  )}

                  {currentPage === 'about' && (
                    <div className="py-8">
                      <About />
                    </div>
                  )}

                  {currentPage === 'services' && (
                    <div className="py-8">
                      <Services onSelectServiceForBooking={handleScrollToBooking} />
                      <BookingForm
                        preselectedService={preselectedService}
                        onClearPreselected={() => setPreselectedService('')}
                      />
                    </div>
                  )}

                  {currentPage === 'portfolio' && (
                    <div className="py-8">
                      <Portfolio />
                    </div>
                  )}

                  {currentPage === 'why-us' && (
                    <div className="py-8">
                      <WhyChooseUs />
                    </div>
                  )}

                  {currentPage === 'testimonials' && (
                    <div className="py-8">
                      <Testimonials />
                    </div>
                  )}

                  {currentPage === 'contact' && (
                    <div className="py-8">
                      <Contact />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* 4. Quick Action Footer & Floating WhatsApp Chat bubble */}
          <Footer onQuickContactClick={() => handleScrollToBooking('')} />

          {/* Admin Login Overlaid Dialog */}
          <AnimatePresence>
            {adminState === 'admin-login' && (
              <AdminLogin 
                onLoginSuccess={handleLoginSuccess}
                onCancel={() => setAdminState('client')}
              />
            )}
          </AnimatePresence>

        </div>
      )}
    </>
  );
}
