/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Instagram, Heart, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { INSTAGRAM_POSTS } from '../data';

export default function InstagramFeed() {
  const [posts, setPosts] = useState<{ id: string; imageUrl: string; likes: string; comments: string }[]>(() => {
    const stored = localStorage.getItem('olamide_visuals_instagram_posts');
    return stored ? JSON.parse(stored) : INSTAGRAM_POSTS;
  });

  useEffect(() => {
    const syncFeed = () => {
      const stored = localStorage.getItem('olamide_visuals_instagram_posts');
      setPosts(stored ? JSON.parse(stored) : INSTAGRAM_POSTS);
    };

    window.addEventListener('storage', syncFeed);
    const interval = setInterval(syncFeed, 2000);

    return () => {
      window.removeEventListener('storage', syncFeed);
      clearInterval(interval);
    };
  }, []);

  return (
    <section id="instagram-feed" className="py-24 bg-[#0A0A0A] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6">
          <div className="space-y-4 text-center md:text-left">
            <span className="text-xs font-mono font-medium tracking-[0.3em] text-gold uppercase">
              INSTANT CURATIONS
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-light tracking-tight text-white uppercase leading-tight">
              Follow Our <span className="text-gold italic font-normal lowercase">Journal</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-lg leading-relaxed">
              We frequently share behind-the-scenes footage, lighting blueprints, and fresh shoots on Instagram.
            </p>
          </div>

          <div className="shrink-0 flex justify-center">
            <a
              href="https://www.instagram.com/olamide_visuals"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gold text-black hover:bg-white font-sans text-xs tracking-widest font-bold uppercase flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Instagram className="w-4 h-4 fill-current" />
              <span>Follow @olamide_visuals</span>
            </a>
          </div>
        </div>

        {/* Instaradio Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {posts.map((post, idx) => (
              <motion.a
                key={post.id}
                href="https://www.instagram.com/olamide_visuals"
                target="_blank"
                rel="noopener noreferrer"
                className="group aspect-square relative bg-[#080808] border border-white/5 overflow-hidden cursor-pointer"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <img
                  src={post.imageUrl}
                  alt={`Instagram Post ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Glass overlay on hover */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4 text-white">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4 text-red-500 fill-current" />
                    <span className="text-xs font-mono font-semibold">{post.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4 text-gold fill-current" />
                    <span className="text-xs font-mono font-semibold">{post.comments}</span>
                  </div>
                </div>

                {/* Instagram tag decoration */}
                <div className="absolute top-3 right-3 p-1 rounded bg-black/40 text-white/50 group-hover:text-white transition-colors duration-300 pointer-events-none">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
              </motion.a>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-lg bg-zinc-900/30 flex flex-col items-center justify-center space-y-3">
            <ImageIcon className="w-10 h-10 text-zinc-600 animate-pulse" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-400 font-sans uppercase tracking-wider">No journal posts uploaded yet</p>
              <p className="text-xs text-zinc-600 max-w-sm">Use the administrator panel to publish curated portraits to our official web journal.</p>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
