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

  const stories: FeaturedStory[] = [
    {
      id: 'story1',
      title: 'The Grace of Melanin',
      category: 'EDITORIAL PORTRAIT',
      tagline: 'Illuminating raw tones and textured structural shadow lines.',
      description: 'Shot in Benin City, this series represents our creative signature. By balancing high-contrast shadows with gold metallic body ornamentation, we elevated standard portrait photography into a rich visual painting.',
      imageUrl: IMAGES.fashionEditorial,
      technicalSpecs: 'Sony α7R V • 85mm f/1.2 GM • ISO 100 • f/1.4 • 1/250s'
    },
    {
      id: 'story2',
      title: 'Edo State Royal Vows',
      category: 'LUXURY WEDDINGS',
      tagline: 'Preserving laughter and cultural heritage during traditional unions.',
      description: 'Captured during the golden hour in Ekpoma, this piece captures the deep embrace of a newlywed couple surrounded by vibrant traditional royal fabrics. The soft back-lighting symbolizes their timeless romance.',
      imageUrl: IMAGES.weddingCinematic,
      technicalSpecs: 'Sony α7R V • 50mm f/1.2 GM • ISO 160 • f/1.2 • 1/400s'
    },
    {
      id: 'story3',
      title: 'The Scholar’s Ascent',
      category: 'ACADEMIC MILESTONES',
      tagline: 'Commemorating hard work, ultimate pride, and academic triumph.',
      description: 'A close-up studio portrait capturing the pride of an Ambrose Alli University (AAU) graduate. By using clean key lighting, we highlighted the fine stitching of the gown and the raw emotion of victory.',
      imageUrl: IMAGES.graduationPortrait,
      technicalSpecs: 'Sony α7R V • 135mm f/1.8 GM • ISO 100 • f/2.0 • 1/200s'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStory((prev) => (prev + 1) % stories.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

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

        {/* Cinematic split panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Large image frame on left */}
          <div className="lg:col-span-7 relative">
            <div className="relative aspect-[16/10] overflow-hidden bg-[#080808] border border-white/5">
              
              <AnimatePresence mode="wait">
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
              </AnimatePresence>

              {/* Viewfinder framing borders */}
              <div className="absolute inset-4 border border-white/5 pointer-events-none" />
              <div className="absolute bottom-6 left-6 flex items-center space-x-2 text-zinc-400 text-[10px] font-mono tracking-wider bg-black/80 px-2 py-1 border border-white/5">
                <Camera className="w-3 h-3 text-gold animate-pulse" />
                <span>{current.technicalSpecs}</span>
              </div>
            </div>
          </div>

          {/* Captions and selection controls on right */}
          <div className="lg:col-span-5 space-y-8 lg:pl-4">
            
            <AnimatePresence mode="wait">
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

                <p className="text-sm font-mono tracking-wide text-zinc-400 font-medium italic border-l-2 border-gold pl-4 py-1">
                  "{current.tagline}"
                </p>

                <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed pt-2">
                  {current.description}
                </p>
              </motion.div>
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

      </div>
    </section>
  );
}
