/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Award, Zap, Heart } from 'lucide-react';
import { getFromDB } from '../admin/db';

const DEFAULT_BIOGRAPHY = `Olamide Visuals is a luxury, elite creative studio born in Ekpoma, Edo State, Nigeria. Founded on the belief that photography is a sublime medium of preservation, we specialize in illuminating raw emotional narratives and transforming brief human intersections into museum-quality masterpieces.

Olamide approaches every frame with an artist’s meticulous precision. Whether directing vibrant traditional weddings, styling avant-garde editorial runway layouts, or framing academic triumphs, our dedication to immaculate composition and elite color-grading delivers visuals that resonate across continents.`;

const DEFAULT_PROFILE_IMAGE = '/src/assets/images/photographer_portrait_1782327683000.jpg';

export default function About() {
  const [aboutData, setAboutData] = useState(() => {
    const content = getFromDB<any>('olamide_visuals_content', null);
    return {
      biography: content?.about?.biography || DEFAULT_BIOGRAPHY,
      profileImage: content?.about?.profileImage || DEFAULT_PROFILE_IMAGE
    };
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const content = getFromDB<any>('olamide_visuals_content', null);
      if (content?.about) {
        setAboutData({
          biography: content.about.biography || DEFAULT_BIOGRAPHY,
          profileImage: content.about.profileImage || DEFAULT_PROFILE_IMAGE
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const values = [
    {
      icon: Award,
      title: 'Artistic Excellence',
      text: 'Treating photography not as documentation, but as timeless digital paintings.'
    },
    {
      icon: Zap,
      title: 'Attention to Detail',
      text: 'Obsessing over lighting symmetry, clean skin tones, and rich compositions.'
    },
    {
      icon: Heart,
      title: 'Authentic Emotion',
      text: 'Guiding you patiently to capture real laughter, pure pride, and quiet glances.'
    },
  ];

  const paragraphs = aboutData.biography.split(/\n+/).filter((p: string) => p.trim().length > 0);

  return (
    <section id="about" className="py-24 bg-[#0A0A0A] border-t border-white/5 overflow-hidden relative">
      {/* Decorative ambient gold glow */}
      <div className="absolute right-0 top-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Portrait Visual Wrapper */}
          <div className="lg:col-span-5 relative flex justify-center">
            <motion.div
              id="about-image-container"
              className="relative w-full max-w-sm aspect-[4/5]"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              {/* Gold borders representing camera viewfinder frames */}
              <div className="absolute -inset-3 border border-gold/20 z-0 pointer-events-none" />
              <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-gold z-10" />
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-gold z-10" />

              {/* Real portrait photo (Generated) */}
              <div className="w-full h-full overflow-hidden bg-[#080808] border border-white/5 relative z-10 group">
                <img
                  src={aboutData.profileImage}
                  alt="Olamide, Lead Photographer"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
                {/* Visual lens reflection element */}
                <div className="absolute inset-0 bg-gradient-to-tr from-gold/0 via-gold/5 to-transparent pointer-events-none" />
              </div>

            </motion.div>
          </div>

          {/* Biography text content */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4 text-center lg:text-left">
              <span className="text-xs font-mono font-medium tracking-[0.3em] text-gold uppercase">
                MEET THE ARTIST
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light tracking-tight text-white leading-tight">
                Olamide <span className="text-gold italic font-normal">Oluwabusayomi</span>
              </h2>
              <div className="h-[1px] w-16 bg-gold mx-auto lg:mx-0 mt-4" />
            </div>

            <div className="space-y-6 text-zinc-300 font-light text-base leading-relaxed text-center lg:text-left">
              {paragraphs.map((para: string, idx: number) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {/* Core Values / Strengths Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {values.map((val, idx) => {
                const Icon = val.icon;
                return (
                  <motion.div
                    key={val.title}
                    className="bg-[#080808] border border-white/5 p-5 hover:border-gold/30 transition-all duration-300 group"
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <div className="p-2.5 bg-gold/5 border border-gold/10 inline-flex rounded-none group-hover:bg-gold group-hover:text-black transition-colors duration-300">
                      <Icon className="w-5 h-5 text-gold group-hover:text-black" />
                    </div>
                    <h3 className="text-sm font-sans font-bold text-white uppercase tracking-wider mt-4">
                      {val.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-2 font-light leading-relaxed">
                      {val.text}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
