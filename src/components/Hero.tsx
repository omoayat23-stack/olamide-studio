/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Play, Compass, Aperture } from 'lucide-react';
import { HERO_SLIDES } from '../data';
import { getFromDB } from '../admin/db';

interface HeroProps {
  onExploreClick: () => void;
  onBookClick: () => void;
}

export default function Hero({ onExploreClick, onBookClick }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<any[]>(() => {
    const localSpotlights = getFromDB<any[]>('olamide_visuals_spotlight', []);
    if (localSpotlights && localSpotlights.length > 0) {
      return localSpotlights.map((item: any) => ({
        id: item.id,
        title: item.title,
        subtitle: item.tagline || item.description || '',
        image: item.imageUrl || item.url,
        tag: item.category ? item.category.toUpperCase() : 'FEATURED STORY',
        isDynamic: true
      }));
    }
    return HERO_SLIDES;
  });

  useEffect(() => {
    let active = true;
    const fetchSpotlights = async () => {
      try {
        const res = await fetch('/api/supabase/fetch?table=spotlight');
        if (!res.ok) {
          throw new Error(`Failed to fetch spotlights: ${res.statusText}`);
        }
        const result = await res.json();
        if (result.success && result.data && result.data.length > 0 && active) {
          const mapped = result.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            subtitle: item.tagline || item.description || '',
            image: item.imageUrl || item.url,
            tag: item.category ? item.category.toUpperCase() : 'FEATURED STORY',
            isDynamic: true
          }));
          // Prevent redundant state updates if data remains unchanged to preserve auto-transition timers
          setSlides((prevSlides) => {
            if (prevSlides.length !== mapped.length) return mapped;
            const isDifferent = mapped.some((slide, index) => {
              const prev = prevSlides[index];
              return (
                !prev ||
                prev.id !== slide.id ||
                prev.title !== slide.title ||
                prev.subtitle !== slide.subtitle ||
                prev.image !== slide.image ||
                prev.tag !== slide.tag
              );
            });
            return isDifferent ? mapped : prevSlides;
          });
        }
      } catch (err) {
        console.warn("Failed to fetch spotlight slides from Supabase:", err);
      }
    };

    fetchSpotlights();
    const interval = setInterval(fetchSpotlights, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6500); // Rotate slides every 6.5s
    return () => clearInterval(timer);
  }, [slides]);

  const handleNext = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const renderSlideTitle = (slide: any) => {
    if (slide.id === 'slide1') {
      return (
        <>
          <span className="italic block font-normal">Capturing</span>{' '}
          <span className="text-gold font-normal">Moments.</span><br />
          Timeless Stories.
        </>
      );
    }
    if (slide.id === 'slide2') {
      return (
        <>
          <span className="italic block font-normal text-gold">Uncompromising</span><br />
          Editorial Artistry.
        </>
      );
    }
    if (slide.id === 'slide3') {
      return (
        <>
          <span className="italic block font-normal">Celebrating</span>{' '}
          <span className="text-gold font-normal">Academic</span> Excellence.
        </>
      );
    }

    // Dynamic titles
    const words = (slide.title || '').split(' ');
    if (words.length <= 1) {
      return <span className="italic block font-normal">{slide.title}</span>;
    }
    const first = words[0];
    const second = words[1];
    const rest = words.slice(2).join(' ');
    return (
      <>
        <span className="italic block font-normal">{first}</span>{' '}
        <span className="text-gold font-normal">{second}</span>{rest ? <><br />{rest}</> : null}
      </>
    );
  };

  return (
    <section id="home" className="relative h-screen w-full bg-[#0A0A0A] overflow-hidden">
      {/* Viewfinder Camera HUD Overlay for luxury feeling */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 md:p-8">
        {/* HUD Top row */}
        <div className="flex justify-between items-center text-zinc-500 font-mono text-[9px] md:text-xs tracking-wider">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>REC 4K HDR</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>ISO 100</span>
            <span>f/1.2</span>
            <span>1/200s</span>
          </div>
        </div>

        {/* HUD Center framing lines */}
        <div className="absolute inset-x-12 inset-y-20 border border-white/5 flex items-center justify-center">
          <div className="w-6 h-6 border-t border-l border-gold/30 absolute top-0 left-0" />
          <div className="w-6 h-6 border-t border-r border-gold/30 absolute top-0 right-0" />
          <div className="w-6 h-6 border-b border-l border-gold/30 absolute bottom-0 left-0" />
          <div className="w-6 h-6 border-b border-r border-gold/30 absolute bottom-0 right-0" />
          <div className="w-3 h-3 border-t border-white/10" />
          <div className="h-3 w-[1px] bg-white/10 absolute" />
          <div className="w-3 h-[1px] bg-white/10 absolute" />
        </div>

        {/* HUD Bottom row */}
        <div className="flex justify-between items-end text-zinc-500 font-mono text-[9px] md:text-xs tracking-wider">
          <div>
            <span>MF 35mm</span>
          </div>
          <div className="flex items-center space-x-2">
            <Aperture className="w-3.5 h-3.5 text-zinc-500 animate-spin-slow" />
            <span>RAW 14-BIT</span>
          </div>
        </div>
      </div>

      {/* Hero Slideshow Backgrounds */}
      <AnimatePresence mode="wait">
        {slides.map((slide, index) => {
          if (index !== currentSlide) return null;
          return (
            <motion.div
              key={slide.id}
              className="absolute inset-0 w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            >
              {/* Ken Burns zoom animation */}
              <motion.div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.image})` }}
                initial={{ scale: 1.1, y: 10 }}
                animate={{ scale: 1.02, y: 0 }}
                transition={{ duration: 7, ease: 'easeOut' }}
              />
              {/* Soft luxurious dark vignette gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-[#0A0A0A]/60" />
              <div className="absolute inset-0 bg-black/20" />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Content Container */}
      <div className="absolute inset-0 flex items-center z-30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto md:mx-0 w-full text-center md:text-left mt-16 md:mt-0">
          <AnimatePresence mode="wait">
            {slides.map((slide, index) => {
              if (index !== currentSlide) return null;
              return (
                <div key={`content-${slide.id}`} className="space-y-6">
                  {/* Category Tag */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-none backdrop-blur-sm"
                  >
                    <Compass className="w-3.5 h-3.5 text-gold animate-pulse" />
                    <span className="text-[10px] md:text-xs font-mono tracking-[0.25em] text-gold font-semibold uppercase">
                      {slide.tag}
                    </span>
                  </motion.div>

                  {/* Main Title - Serif Typography from Design HTML */}
                  <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-4xl sm:text-5xl md:text-7xl font-serif font-light tracking-tight text-white leading-[1.1]"
                  >
                    {renderSlideTitle(slide)}
                  </motion.h1>

                  {/* Subtitle */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="text-sm sm:text-base md:text-lg text-zinc-300 max-w-xl font-light tracking-wide leading-relaxed"
                  >
                    {slide.subtitle}
                  </motion.p>

                  {/* Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className="pt-6 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4"
                  >
                    <button
                      onClick={onExploreClick}
                      className="w-full sm:w-auto px-8 py-4 rounded-none bg-gold text-black font-sans text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Explore Portfolio</span>
                    </button>
                    <button
                      onClick={onBookClick}
                      className="w-full sm:w-auto px-8 py-4 rounded-none border border-gold text-gold hover:bg-gold hover:text-black font-sans text-[10px] tracking-[0.2em] uppercase font-bold transition-all duration-300"
                    >
                      Book a Session
                    </button>
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Left/Right Controls */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full border border-white/10 bg-black/30 backdrop-blur-sm text-white hover:bg-gold hover:text-black hover:border-gold transition-all duration-300 hidden md:block"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full border border-white/10 bg-black/30 backdrop-blur-sm text-white hover:bg-gold hover:text-black hover:border-gold transition-all duration-300 hidden md:block"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Progress Slide indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 md:left-auto md:right-12 md:translate-x-0 z-30 flex items-center space-x-4">
        {slides.map((slide, index) => (
          <button
            key={`indicator-${slide.id}`}
            onClick={() => setCurrentSlide(index)}
            className="group flex flex-col items-start space-y-1 focus:outline-none"
          >
            <span className="text-[9px] font-mono font-medium tracking-widest text-zinc-500 group-hover:text-gold transition-colors">
              0{index + 1}
            </span>
            <div className="w-12 h-[2px] bg-zinc-800 relative overflow-hidden">
              <div
                className={`absolute inset-0 bg-gold transition-transform duration-[6500ms] origin-left ${
                  index === currentSlide ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
