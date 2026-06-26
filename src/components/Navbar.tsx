/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Camera, Phone } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onPageChange: (pageId: string) => void;
  onBookClick: () => void;
  onLogoClick?: () => void;
}

export default function Navbar({ currentPage, onPageChange, onBookClick, onLogoClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'About', id: 'about' },
    { name: 'Services', id: 'services' },
    { name: 'Portfolio', id: 'portfolio' },
    { name: 'Why Us', id: 'why-us' },
    { name: 'Reviews', id: 'testimonials' },
    { name: 'Contact', id: 'contact' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, pageId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onPageChange(pageId);
  };

  return (
    <>
      <motion.nav
        id="navbar"
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300 bg-[#060606]/95 backdrop-blur-md border-b border-white/5 py-4.5 shadow-2xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Adjusted Logo with background badge framing to ensure beautiful alignment */}
            <a
              href="#home"
              onClick={(e) => {
                if (onLogoClick) {
                  e.preventDefault();
                  onLogoClick();
                } else {
                  handleLinkClick(e, 'home');
                }
              }}
              className="flex items-center space-x-3 px-3 py-1.5 bg-black border border-white/10 rounded-none group hover:border-gold/40 transition-all duration-300 shadow-md"
            >
              <div className="relative flex items-center justify-center w-8 h-8 rounded-none border border-gold/30 bg-[#0C0C0C] group-hover:border-gold transition-colors duration-300">
                <Camera className="w-4 h-4 text-gold" />
                <span className="absolute -inset-1 border border-dashed border-gold/0 group-hover:border-gold/30 transition-all duration-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-sans font-extrabold tracking-[0.2em] text-white uppercase leading-none">
                  Olamide
                </span>
                <span className="text-[8px] font-mono font-medium tracking-[0.3em] text-gold uppercase leading-none mt-1">
                  Visuals
                </span>
              </div>
            </a>

            {/* Desktop Navigation with refined active gold underline indicator */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={`#${link.id}`}
                  onClick={(e) => handleLinkClick(e, link.id)}
                  className={`relative text-xs font-sans font-medium tracking-widest uppercase transition-colors duration-200 py-1.5 ${
                    currentPage === link.id ? 'text-gold' : 'text-zinc-300 hover:text-gold'
                  }`}
                >
                  <span>{link.name}</span>
                  {currentPage === link.id && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-0 right-0 bottom-0 h-[1.5px] bg-gold"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </a>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden md:flex items-center space-x-4">
              <a
                href="tel:08142870306"
                className="flex items-center space-x-2 text-xs text-zinc-400 hover:text-white transition-colors font-mono tracking-wider mr-2"
              >
                <Phone className="w-3.5 h-3.5 text-gold" />
                <span>08142870306</span>
              </a>
              <motion.button
                onClick={onBookClick}
                className="px-6 py-2.5 rounded-none border border-gold text-gold hover:bg-gold hover:text-black font-sans text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Book Session
              </motion.button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-zinc-300 hover:text-gold p-2 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-nav-panel"
              className="md:hidden bg-[#0A0A0A] border-b border-white/5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 pt-2 pb-6 space-y-4">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={`#${link.id}`}
                    onClick={(e) => handleLinkClick(e, link.id)}
                    className={`block text-sm font-sans font-medium tracking-widest uppercase transition-colors py-2 border-b border-white/5 ${
                      currentPage === link.id ? 'text-gold font-bold' : 'text-zinc-300 hover:text-gold'
                    }`}
                  >
                    {link.name}
                  </a>
                ))}
                <div className="pt-4 flex flex-col space-y-3">
                  <a
                    href="tel:08142870306"
                    className="flex items-center space-x-2 text-xs text-zinc-400 font-mono tracking-wider"
                  >
                    <Phone className="w-4.5 h-4.5 text-gold" />
                    <span>08142870306</span>
                  </a>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onBookClick();
                    }}
                    className="w-full text-center py-3 bg-gold text-black font-sans text-xs tracking-widest uppercase transition-colors font-semibold"
                  >
                    Book Session
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
