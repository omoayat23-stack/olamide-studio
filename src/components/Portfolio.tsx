/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, MapPin, Calendar, X, Play, Pause } from 'lucide-react';
import { PortfolioItem } from '../types';

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [isAutoplay, setIsAutoplay] = useState(true);

  const categories = ['All', 'Portraits', 'Weddings', 'Events', 'Fashion', 'Lifestyle', 'Commercial', 'Graduation', 'Behind The Scenes'];

  const [portfolioList, setPortfolioList] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchPortfolio = async () => {
      try {
        const res = await fetch('/api/supabase/fetch?table=portfolio');
        if (!res.ok) {
          throw new Error(`Failed to fetch from Supabase: ${res.statusText}`);
        }
        const result = await res.json();
        if (result.success && active) {
          // Map properties safely from table schema if needed
          const items = (result.data || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            category: item.category || 'All',
            imageUrl: item.imageUrl || item.url, // Handle both imageUrl and url keys
            description: item.description || '',
            aspect: item.aspect || 'portrait',
            location: item.location || 'Ekpoma Studio',
            year: item.year || '2026',
            tags: item.tags || []
          }));
          
          // Prevent redundant state updates if data remains unchanged to preserve lightbox transitions and grid stability
          setPortfolioList((prevList) => {
            if (prevList.length !== items.length) return items;
            const isDifferent = items.some((item: any, index: number) => {
              const prev = prevList[index];
              return (
                !prev ||
                prev.id !== item.id ||
                prev.title !== item.title ||
                prev.category !== item.category ||
                prev.imageUrl !== item.imageUrl ||
                prev.description !== item.description ||
                prev.aspect !== item.aspect ||
                prev.location !== item.location ||
                prev.year !== item.year
              );
            });
            return isDifferent ? items : prevList;
          });
          setError(null);
        } else if (active) {
          throw new Error(result.error || 'Failed to fetch');
        }
      } catch (err: any) {
        console.error("Error loading portfolio from Supabase:", err);
        if (active) {
          setPortfolioList((prev) => {
            if (prev.length > 0) {
              // We already have cached data. Keep it and don't overwrite with a blocking error
              return prev;
            } else {
              // No data yet, safe to show the error
              setError(err.message || 'Error loading portfolio.');
              return [];
            }
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchPortfolio();

    // Regular polling for real-time synchronization across devices and browsers
    const pollInterval = setInterval(fetchPortfolio, 5000);

    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, []);

  // Filter items based on selected category
  const filteredItems = activeCategory === 'All'
    ? portfolioList
    : portfolioList.filter((item) => item.category.toLowerCase() === activeCategory.toLowerCase());

  // Auto-transition logic for fullscreen lightbox carousel
  useEffect(() => {
    if (selectedItemIndex === null || filteredItems.length <= 1 || !isAutoplay) return;

    const interval = setInterval(() => {
      setSelectedItemIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
    }, 6000); // cycle every 6s

    return () => clearInterval(interval);
  }, [selectedItemIndex, filteredItems.length, isAutoplay]);

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
        {filteredItems.length > 0 ? (
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
        ) : (
          <div className="max-w-2xl mx-auto py-20 px-6 border border-dashed border-white/5 bg-black/40 text-center space-y-6">
            <div className="w-12 h-12 rounded-full border border-gold/20 flex items-center justify-center mx-auto bg-gold/5">
              <span className="text-gold text-sm font-mono">!</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-widest">No Masterpieces Found</h3>
              <p className="text-xs text-zinc-400 font-light max-w-sm mx-auto leading-relaxed">
                {loading 
                  ? 'Initiating deep connection to Supabase storage to load visual curated assets...' 
                  : error 
                    ? `Supabase synchronization error: ${error}. Demo fallbacks have been fully disabled.` 
                    : 'The Administrative Portal has successfully removed standard demo items. Upload and publish your works to display them here.'}
              </p>
            </div>
          </div>
        )}

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
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsAutoplay(prev => !prev)}
                    className={`flex items-center space-x-2 transition-colors border px-4 py-2 text-xs font-mono tracking-widest uppercase cursor-pointer ${
                      isAutoplay 
                        ? 'border-gold/20 text-gold bg-gold/5 hover:bg-gold/10' 
                        : 'border-white/5 text-zinc-400 hover:text-white hover:border-gold/20'
                    }`}
                    title={isAutoplay ? "Pause slideshow cycling" : "Start slideshow cycling"}
                  >
                    {isAutoplay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{isAutoplay ? 'Pause Slideshow' : 'Play Slideshow'}</span>
                    <span className="inline sm:hidden">{isAutoplay ? 'Pause' : 'Play'}</span>
                  </button>
                  <button
                    onClick={() => setSelectedItemIndex(null)}
                    className="flex items-center space-x-2 text-zinc-400 hover:text-gold transition-colors border border-white/5 hover:border-gold/20 px-4 py-2 text-xs font-mono tracking-widest uppercase cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Close</span>
                  </button>
                </div>
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
