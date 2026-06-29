/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Sparkles, Eye, Camera } from 'lucide-react';
import { IMAGES } from '../data';

interface FeaturedStory {
  id: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  imageUrl: string;
  technicalSpecs: string;
}

export default function FeaturedShowcase() {
  const [activeStory, setActiveStory] = useState(0);
  const [stories, setStories] = useState<FeaturedStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchSpotlights = async () => {
      try {
        const res = await fetch('/api/supabase/fetch?table=spotlight');
        if (!res.ok) {
          throw new Error(`Failed to fetch spotlight from Supabase: ${res.statusText}`);
        }
        const result = await res.json();
        if (result.success && active) {
          const items = (result.data || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            category: item.category || 'Spotlight',
            tagline: item.tagline || '',
            description: item.description || '',
            imageUrl: item.imageUrl || item.url,
            technicalSpecs: item.technicalSpecs || ''
          }));
          // Prevent redundant state updates if data remains unchanged to preserve auto-transition timers
          setStories((prevStories) => {
            if (prevStories.length !== items.length) return items;
            const isDifferent = items.some((story: any, index: number) => {
              const prev = prevStories[index];
              return (
                !prev ||
                prev.id !== story.id ||
                prev.title !== story.title ||
                prev.category !== story.category ||
                prev.tagline !== story.tagline ||
                prev.description !== story.description ||
                prev.imageUrl !== story.imageUrl ||
                prev.technicalSpecs !== story.technicalSpecs
              );
            });
            return isDifferent ? items : prevStories;
          });
        }
      } catch (err) {
        console.error("Failed to load spotlights from Supabase:", err);
        if (active) {
          setStories((prev) => (prev.length > 0 ? prev : []));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    
    fetchSpotlights();
    
    // Regular polling for real-time synchronization across devices and browsers
    const interval = setInterval(fetchSpotlights, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (stories.length === 0) return;
    const interval = setInterval(() => {
      setActiveStory((prev) => (prev + 1) % stories.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [stories]);

  const current = stories[activeStory];

  return (
    <section id="featured-showcase" className="py-24 bg-[#0A0A0A] border-t border-white/5 relative overflow-hidden">
      {/* Visual camera crop markings in background */}
      <div className="absolute top-10 left-10 w-20 h-[1px] bg-white/5" />
      <div className="absolute top-10 left-10 h-20 w-[1px] bg-white/5" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-mono font-medium tracking-[0.3em] text-gold uppercase">
            CINEMATIC SPOTLIGHT
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light tracking-tight text-white uppercase leading-tight">
            Storytelling <span className="text-gold italic font-normal lowercase">Showcase</span>
          </h2>
          <div className="h-[1px] w-16 bg-gold mx-auto mt-4" />
          <p className="text-sm md:text-base text-zinc-400 font-light max-w-xl mx-auto leading-relaxed">
            A deeper dive into our favorite editorial series. Click below to explore the technical choices and creative philosophies behind each masterwork.
          </p>
        </div>

        {stories.length > 0 ? (
          /* Cinematic split panel */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Large image frame on left */}
            <div className="lg:col-span-7 relative">
              <div className="relative aspect-[16/10] overflow-hidden bg-[#080808] border border-white/5">
                
                <AnimatePresence mode="wait">
                  {current && (
                    <motion.div
                      key={current.id}
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 1.2, ease: 'easeInOut' }}
                    >
                      <img
                        src={current.imageUrl}
                        alt={current.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Luxury flare overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Viewfinder framing borders */}
                <div className="absolute inset-4 border border-white/5 pointer-events-none" />
                {current?.technicalSpecs && (
                  <div className="absolute bottom-6 left-6 flex items-center space-x-2 text-zinc-400 text-[10px] font-mono tracking-wider bg-black/80 px-2 py-1 border border-white/5">
                    <Camera className="w-3 h-3 text-gold animate-pulse" />
                    <span>{current.technicalSpecs}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Captions and selection controls on right */}
            <div className="lg:col-span-5 space-y-8 lg:pl-4">
              
              <AnimatePresence mode="wait">
                {current && (
                  <motion.div
                    key={current.id}
                    className="space-y-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="inline-flex items-center space-x-2 text-gold">
                      <Sparkles className="w-4 h-4 text-gold" />
                      <span className="text-xs font-mono tracking-widest uppercase font-bold">
                        {current.category}
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-serif font-light text-white uppercase tracking-tight">
                      {current.title}
                    </h3>

                    {current.tagline && (
                      <p className="text-sm font-mono tracking-wide text-zinc-400 font-medium italic border-l-2 border-gold pl-4 py-1">
                        "{current.tagline}"
                      </p>
                    )}

                    <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed pt-2">
                      {current.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Manual Story Selection Toggles */}
              <div className="flex flex-col space-y-3 pt-6 border-t border-white/5">
                {stories.map((story, idx) => (
                  <button
                    key={story.id}
                    onClick={() => setActiveStory(idx)}
                    className={`flex items-center justify-between text-left px-5 py-4 border rounded-none transition-all duration-300 cursor-pointer ${
                      idx === activeStory
                        ? 'bg-[#080808] border-gold text-white'
                        : 'border-white/5 text-zinc-500 hover:border-gold/30 hover:text-zinc-300 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="font-mono text-xs text-gold">0{idx + 1}</span>
                      <span className="text-xs font-sans font-bold uppercase tracking-wider">
                        {story.title}
                      </span>
                    </div>
                    <Eye className={`w-3.5 h-3.5 transition-transform duration-300 ${
                      idx === activeStory ? 'text-gold scale-110' : 'text-zinc-700'
                    }`} />
                  </button>
                ))}
              </div>

            </div>

          </div>
        ) : (
          /* Empty state */
          <div className="max-w-2xl mx-auto py-20 px-6 border border-dashed border-white/5 rounded-none bg-black/40 text-center space-y-6">
            <div className="w-12 h-12 rounded-full border border-gold/20 flex items-center justify-center mx-auto bg-gold/5">
              <Camera className="w-5 h-5 text-gold animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-medium text-white uppercase font-mono tracking-wider">Spotlight Reel Suspended</h3>
              <p className="text-xs text-zinc-400 font-light max-w-sm mx-auto leading-relaxed">
                The Cinematic Showcase has been cleared of standard sample files. Head to the administrative portal to construct, upload, and direct your bespoke stories.
              </p>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
