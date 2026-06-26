/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, MapPin, Calendar, X } from 'lucide-react';
import { PORTFOLIO_ITEMS } from '../data';
import { PortfolioItem } from '../types';

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  const categories = ['All', 'Portraits', 'Weddings', 'Events', 'Fashion', 'Lifestyle', 'Commercial', 'Graduation', 'Behind The Scenes'];

  const [portfolioList, setPortfolioList] = useState<PortfolioItem[]>(() => {
    const localPortfolio = localStorage.getItem('olamide_visuals_portfolio_items');
    const portfolio: PortfolioItem[] = localPortfolio ? JSON.parse(localPortfolio) : PORTFOLIO_ITEMS;

    const localMedia = localStorage.getItem('olamide_visuals_media');
    const mediaItems = localMedia ? JSON.parse(localMedia) : [];

    const merged = [...portfolio];
    mediaItems.forEach((m: any) => {
      if (!merged.some(p => p.imageUrl === m.url)) {
        merged.push({
          id: m.id,
          title: m.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
          category: m.folder,
          imageUrl: m.url,
          description: `Behind-the-scenes masterwork.`,
          aspect: 'portrait',
          location: 'Ekpoma Studio',
          year: '2026'
        });
      }
    });
    return merged;
  });

  useEffect(() => {
    const syncDatabase = () => {
      const localPortfolio = localStorage.getItem('olamide_visuals_portfolio_items');
      const portfolio: PortfolioItem[] = localPortfolio ? JSON.parse(localPortfolio) : PORTFOLIO_ITEMS;

      const localMedia = localStorage.getItem('olamide_visuals_media');
      const mediaItems = localMedia ? JSON.parse(localMedia) : [];

      const merged = [...portfolio];
      mediaItems.forEach((m: any) => {
        if (!merged.some(p => p.imageUrl === m.url)) {
          merged.push({
            id: m.id,
            title: m.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
            category: m.folder,
            imageUrl: m.url,
            description: `Behind-the-scenes masterwork.`,
            aspect: 'portrait',
            location: 'Ekpoma Studio',
            year: '2026'
          });
        }
      });
      setPortfolioList(merged);
    };

    window.addEventListener('storage', syncDatabase);
    const pollInterval = setInterval(syncDatabase, 2000);

    return () => {
      window.removeEventListener('storage', syncDatabase);
      clearInterval(pollInterval);
    };
  }, []);

  // Filter items based on selected category
  const filteredItems = activeCategory === 'All'
    ? portfolioList
    : portfolioList.filter((item) => item.category.toLowerCase() === activeCategory.toLowerCase());

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedItemIndex === null) return;
    setSelectedItemIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedItemIndex === null) return;
    setSelectedItemIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
  };

  const selectedItem: PortfolioItem | null = selectedItemIndex !== null ? filteredItems[selectedItemIndex] : null;

  return (
    <section id="portfolio" className="py-24 bg-[#0A0A0A] border-t border-white/5 relative">
      {/* Accent glow lights */}
      <div className="absolute right-0 top-1/2 w-80 h-80 bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-mono font-medium tracking-[0.3em] text-gold uppercase">
            SELECTED MASTERPIECES
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light tracking-tight text-white leading-tight">
            Our Fine-Art <span className="text-gold italic font-normal">Gallery</span>
          </h2>
          <div className="h-[1px] w-16 bg-gold mx-auto mt-4" />
          <p className="text-sm md:text-base text-zinc-400 font-light max-w-xl mx-auto leading-relaxed">
            Every frame we compose tells a unique narrative. Filter our selected projects below to experience our diverse creative specializations.
          </p>
        </div>

        {/* Filter Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSelectedItemIndex(null);
              }}
              className={`px-5 py-2 text-xs font-sans font-medium tracking-widest uppercase transition-all duration-300 rounded-none border cursor-pointer ${
                activeCategory === cat
                  ? 'bg-gold border-gold text-black font-semibold'
                  : 'border-white/5 bg-[#080808] text-zinc-400 hover:text-white hover:border-gold/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* CSS Masonry Gallery Grid */}
        <motion.div
          id="portfolio-gallery-grid"
          layout
          className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 [column-fill:_balance]"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                id={`portfolio-item-${item.id}`}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="break-inside-avoid bg-[#080808] border border-white/5 overflow-hidden relative group cursor-pointer"
                onClick={() => setSelectedItemIndex(index)}
              >
                {/* Image element with premium styling */}
                <div className="w-full relative overflow-hidden bg-[#0A0A0A]">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full object-cover group-hover:scale-105 transition-all duration-700 ease-out brightness-90 group-hover:brightness-100"
                    style={{
                      aspectRatio: item.aspect === 'portrait' ? '3/4' : item.aspect === 'landscape' ? '4/3' : '1/1',
                    }}
                  />
                  
                  {/* Subtle vignette layer */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Overlaid details on Hover */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                  {/* Top tags */}
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono tracking-widest text-gold bg-black/90 px-2.5 py-1 uppercase">
                      {item.category}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-black/90 border border-white/10 flex items-center justify-center text-white">
                      <Maximize2 className="w-3.5 h-3.5 text-gold" />
                    </div>
                  </div>

                  {/* Bottom Captions */}
                  <div className="space-y-1 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-base font-sans font-bold text-white uppercase tracking-wider">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-300 font-light line-clamp-1">
                      {item.description}
                    </p>
                    <div className="flex items-center space-x-3 text-zinc-400 text-[10px] font-mono pt-1">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-gold" />
                        <span>{item.location}</span>
                      </span>
                      <span>•</span>
                      <span>{item.year}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Fullscreen Lightbox Preview Overlay */}
        <AnimatePresence>
          {selectedItemIndex !== null && selectedItem && (
            <motion.div
              id="portfolio-lightbox"
              className="fixed inset-0 z-50 flex flex-col justify-between bg-black/98 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Lightbox Top Header controls */}
              <div className="flex justify-between items-center px-4 md:px-8 py-5 z-20 bg-black/40 border-b border-white/5">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono tracking-[0.2em] text-gold uppercase bg-gold/10 px-3 py-1.5 border border-gold/20">
                    {selectedItem.category}
                  </span>
                  <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                    {selectedItemIndex + 1} / {filteredItems.length}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedItemIndex(null)}
                  className="flex items-center space-x-2 text-zinc-400 hover:text-gold transition-colors border border-white/5 hover:border-gold/20 px-4 py-2 text-xs font-mono tracking-widest uppercase cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>

              {/* Centered Image Showcase */}
              <div className="relative flex-1 flex items-center justify-center p-4">
                {/* Navigation Left */}
                <button
                  onClick={handlePrev}
                  className="absolute left-4 p-3 rounded-full border border-white/5 bg-[#0A0A0A]/85 text-zinc-400 hover:text-gold hover:border-gold/30 transition-all z-20 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Animated Image */}
                <motion.div
                  key={selectedItem.id}
                  className="max-h-[70vh] max-w-[90vw] md:max-w-4xl relative"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    referrerPolicy="no-referrer"
                    className="max-h-[70vh] object-contain border border-white/5 bg-[#0A0A0A] shadow-2xl"
                  />
                </motion.div>

                {/* Navigation Right */}
                <button
                  onClick={handleNext}
                  className="absolute right-4 p-3 rounded-full border border-white/5 bg-[#0A0A0A]/85 text-zinc-400 hover:text-gold hover:border-gold/30 transition-all z-20 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Lightbox Footer text panel */}
              <div className="bg-[#0A0A0A] border-t border-white/5 p-6 md:p-8 z-10 flex flex-col md:flex-row md:items-center md:justify-between max-w-7xl mx-auto w-full gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <h3 className="text-xl font-sans font-extrabold text-white uppercase tracking-wider">
                    {selectedItem.title}
                  </h3>
                  <p className="text-sm text-zinc-400 font-light leading-relaxed">
                    {selectedItem.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 shrink-0 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-gold" />
                    <span className="text-zinc-200">{selectedItem.location}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-gold" />
                    <span className="text-zinc-200">{selectedItem.year}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
