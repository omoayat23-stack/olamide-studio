/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';
import { TESTIMONIALS } from '../data';

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-[#0A0A0A] border-t border-white/5 relative">
      <div className="absolute right-10 top-1/2 w-72 h-72 bg-gold/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-mono font-medium tracking-[0.3em] text-gold uppercase">
            CLIENT VOUCHERS
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light tracking-tight text-white leading-tight">
            Words From Our <span className="text-gold italic font-normal">Patrons</span>
          </h2>
          <div className="h-[1px] w-16 bg-gold mx-auto mt-4" />
          <p className="text-sm md:text-base text-zinc-400 font-light max-w-xl mx-auto leading-relaxed">
            Discover how Olamide Visuals has elevated weddings, commercial campaigns, and personal milestones across Nigeria.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, idx) => (
            <motion.div
              key={testimonial.id}
              className="bg-[#080808] border border-white/5 p-8 hover:border-gold/30 transition-all duration-500 relative flex flex-col justify-between"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              {/* Giant quote mark on background */}
              <Quote className="absolute right-6 top-6 w-12 h-12 text-white/5 pointer-events-none" />

              <div className="space-y-6">
                {/* Five star rating */}
                <div className="flex space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-gold fill-current" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-xs md:text-sm text-zinc-300 font-light leading-relaxed italic">
                  "{testimonial.text}"
                </p>
              </div>

              {/* Author Row */}
              <div className="flex items-center space-x-4 pt-6 border-t border-white/5 mt-8">
                {/* User Portrait */}
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/5 shrink-0">
                  <img
                    src={testimonial.imageUrl}
                    alt={testimonial.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-sans font-bold text-white uppercase tracking-wider">
                    {testimonial.name}
                  </h4>
                  <p className="text-[10px] font-mono text-gold/80 uppercase tracking-widest mt-0.5">
                    {testimonial.role}
                  </p>
                </div>
              </div>

            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
