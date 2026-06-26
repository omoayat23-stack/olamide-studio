/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera } from 'lucide-react';

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(onComplete, 1000); // Allow exit animations to complete
          }, 400);
          return 100;
        }
        // Accelerate near the end
        const increment = prev < 30 ? 3 : prev < 70 ? 5 : 8;
        return Math.min(prev + increment, 100);
      });
    }, 60);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          id="preloader-container"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-white select-none"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* Top/Bottom Shutter Blades */}
          <motion.div
            id="shutter-blade-top"
            className="absolute top-0 left-0 right-0 h-1/2 bg-[#080808] border-b border-gold/10 z-10 flex items-end justify-center"
            initial={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
          />
          <motion.div
            id="shutter-blade-bottom"
            className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#080808] border-t border-gold/10 z-10 flex items-start justify-center"
            initial={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
          />

          {/* Shutter Camera Core */}
          <div className="relative z-20 flex flex-col items-center">
            {/* Shutter Blade Circle Animation */}
            <motion.div
              id="shutter-ring"
              className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border border-gold/20 flex items-center justify-center bg-[#0A0A0A] overflow-hidden"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {/* Spinning aperture blade guides */}
              <motion.div
                id="aperture-rotor"
                className="absolute inset-2 rounded-full border border-dashed border-gold/40"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />

              <Camera className="w-10 h-10 md:w-14 md:h-14 text-gold" />
            </motion.div>

            {/* Title / Identity */}
            <motion.div
              id="preloader-text"
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <h1 className="text-2xl md:text-3xl font-serif tracking-[0.15em] text-white">
                Olamide <span className="text-gold italic font-normal">Visuals</span>
              </h1>
              <p className="text-[10px] tracking-[0.4em] text-zinc-500 uppercase mt-2 font-mono">
                Artistic Photography • Ekpoma
              </p>
            </motion.div>

            {/* Loading Indicator */}
            <div className="mt-12 w-48 h-[2px] bg-zinc-800 rounded-full overflow-hidden relative">
              <motion.div
                id="preloader-bar"
                className="absolute top-0 left-0 bottom-0 bg-gold"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="mt-3 text-sm tracking-widest text-gold/80 font-mono">
              {progress}%
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
