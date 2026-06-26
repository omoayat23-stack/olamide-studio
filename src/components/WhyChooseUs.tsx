/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Sparkles, Image, Shield, Hourglass, HelpCircle, Star, Sparkle } from 'lucide-react';
import { WHY_CHOOSE_US } from '../data';

const iconMap = [Sparkles, Image, Shield, Hourglass, Star, Sparkle];

export default function WhyChooseUs() {
  return (
    <section id="why-choose" className="py-24 bg-[#080808] border-t border-white/5 relative">
      <div className="absolute left-1/2 top-1/4 -translate-x-1/2 w-96 h-96 bg-gold/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-mono font-medium tracking-[0.3em] text-gold uppercase">
            UNCOMPROMISING STANDARDS
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light tracking-tight text-white leading-tight">
            Why Olamide <span className="text-gold italic font-normal">Visuals</span>
          </h2>
          <div className="h-[1px] w-16 bg-gold mx-auto mt-4" />
          <p className="text-sm md:text-base text-zinc-400 font-light max-w-xl mx-auto leading-relaxed">
            We don’t just record frames; we architect memories. Discover the meticulous workflows that make our brand Edo State’s premier choice.
          </p>
        </div>

        {/* Bento/Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_CHOOSE_US.map((strength, idx) => {
            const Icon = iconMap[idx] || Sparkles;
            return (
              <motion.div
                key={strength.id}
                className="group p-8 bg-[#0A0A0A]/40 border border-white/5 hover:border-gold/30 transition-all duration-300 relative flex flex-col justify-between"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
              >
                {/* Visual grid numbers on top-right */}
                <span className="absolute top-6 right-8 text-[11px] font-mono text-zinc-700 group-hover:text-gold/40 transition-colors">
                  0{idx + 1}
                </span>

                <div className="space-y-6">
                  {/* Icon container */}
                  <div className="w-10 h-10 border border-white/5 bg-[#080808] flex items-center justify-center text-gold group-hover:border-gold/30 transition-all">
                    <Icon className="w-4 h-4 text-gold" />
                  </div>

                  {/* Text panel */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-sans font-bold text-white uppercase tracking-wider group-hover:text-gold transition-colors">
                      {strength.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-light leading-relaxed">
                      {strength.description}
                    </p>
                  </div>
                </div>

                {/* Subtle bottom indicator */}
                <div className="h-[1px] bg-white/5 group-hover:bg-gold/25 transition-colors mt-6 w-full" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
