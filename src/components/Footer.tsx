/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Camera, Phone, Mail, Instagram, MapPin, MessageSquare, ArrowUp } from 'lucide-react';

interface FooterProps {
  onQuickContactClick: () => void;
}

export default function Footer({ onQuickContactClick }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="bg-black border-t border-white/5 pt-16 pb-12 relative overflow-hidden text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-white/5">
            
            {/* Column 1: Brand & Bio */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center text-gold bg-black">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-serif font-bold tracking-[0.2em] text-white uppercase leading-none">
                    Olamide
                  </span>
                  <span className="text-[9px] font-mono tracking-[0.3em] text-gold uppercase leading-none mt-0.5">
                    Visuals
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 font-light leading-relaxed pt-2">
                Edo State's premier creative studio crafting luxury visual legacies. We preserve raw human smiles, academic triumphs, and traditional romances.
              </p>
            </div>

            {/* Column 2: Quick Directories */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono tracking-widest text-white uppercase font-bold">Directories</h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a href="#home" className="hover:text-gold transition-colors">Home Base</a>
                </li>
                <li>
                  <a href="#about" className="hover:text-gold transition-colors">The Artist</a>
                </li>
                <li>
                  <a href="#services" className="hover:text-gold transition-colors">Our Specialities</a>
                </li>
                <li>
                  <a href="#portfolio" className="hover:text-gold transition-colors">Masterpieces Grid</a>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact Index */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono tracking-widest text-white uppercase font-bold">Studio Index</h4>
              <ul className="space-y-3 text-xs">
                <li className="flex items-center space-x-2.5">
                  <Phone className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>08142870306</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <Mail className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span className="break-all">Olamideoluwabusayomi123@gmail.com</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>Ekpoma, Edo State, Nigeria</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Quick Action Desk */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono tracking-widest text-white uppercase font-bold">Action Desk</h4>
              <p className="text-xs text-zinc-500 font-light leading-relaxed">
                Have a sudden wedding slot or commercial campaign to check? Let's talk immediately.
              </p>
              <button
                onClick={onQuickContactClick}
                className="w-full py-3 bg-black hover:bg-gold text-zinc-300 hover:text-black border border-white/5 hover:border-gold font-sans text-[10px] tracking-widest uppercase transition-colors font-bold cursor-pointer"
              >
                Quick Booking Request
              </button>
            </div>

          </div>

          {/* Bottom copyright notice rows */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono tracking-wider text-zinc-500">
            <div>
              <span>© {currentYear} OLAMIDE VISUALS. ALL INTELLECTUAL CODES PRESERVED.</span>
            </div>
            <div className="flex items-center space-x-6">
              <a
                href="https://www.instagram.com/olamide_visuals"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold transition-colors uppercase"
              >
                Instagram
              </a>
              <span>•</span>
              <button
                onClick={scrollToTop}
                className="flex items-center space-x-1.5 hover:text-gold transition-colors uppercase focus:outline-none cursor-pointer"
              >
                <span>Scroll to Top</span>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* Floating WhatsApp chat bubble */}
      <motion.a
        href="https://wa.me/2348142870306?text=Hello%20Olamide%20Visuals%2C%20I%20would%20like%20to%20consult%20about%20booking%20a%20photography%20session!"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-green-600 hover:bg-green-500 text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer group"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: 'spring', stiffness: 260, damping: 20 }}
        title="Consult via WhatsApp"
      >
        <MessageSquare className="w-6 h-6 fill-current" />
        {/* Hover tip bubble */}
        <span className="absolute right-14 bg-zinc-950 border border-white/5 text-gold text-[10px] font-mono py-1 px-3 shadow-2xl tracking-widest uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-none">
          CHANCE CHAT
        </span>
      </motion.a>
    </>
  );
}
