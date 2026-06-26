/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { CheckCircle, Heart, Camera, Calendar } from 'lucide-react';
import { STATS } from '../data';

// Dynamic individual counter component
function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(elementRef, { once: true, amount: 0.3 });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const duration = 2000; // 2 seconds animation

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const rate = Math.min(progress / duration, 1);
      
      // Quadratic out easing for smooth deceleration near the end
      const easeRate = 1 - (1 - rate) * (1 - rate);
      
      setCount(Math.floor(easeRate * value));

      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value]);

  return (
    <span ref={elementRef} className="text-3xl sm:text-4xl md:text-5xl font-serif font-light text-white tracking-tight">
      {count}
      <span className="text-gold font-light">{suffix}</span>
    </span>
  );
}

const iconMap: Record<string, any> = {
  CheckCircle: CheckCircle,
  Heart: Heart,
  Camera: Camera,
  Calendar: Calendar,
};

export default function Stats() {
  return (
    <section id="stats" className="py-20 bg-[#080808] border-t border-white/5 relative">
      {/* Visual camera lens grid line overlays */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] flex items-center justify-around">
        <div className="w-[1px] h-full bg-white" />
        <div className="w-[1px] h-full bg-white" />
        <div className="w-[1px] h-full bg-white" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat) => {
            const IconComponent = iconMap[stat.icon] || Camera;
            return (
              <div
                key={stat.id}
                className="flex flex-col items-center justify-center text-center p-6 bg-[#0A0A0A]/40 border border-white/5 rounded-none relative group hover:border-gold/30 transition-all duration-300"
              >
                {/* Gold Top corner accent */}
                <div className="absolute top-0 left-0 w-2 h-[1px] bg-gold opacity-30 group-hover:opacity-100 group-hover:w-6 transition-all duration-300" />
                <div className="absolute top-0 left-0 h-2 w-[1px] bg-gold opacity-30 group-hover:opacity-100 group-hover:h-6 transition-all duration-300" />

                {/* Stat Icon */}
                <div className="p-3 bg-[#0A0A0A] border border-white/5 rounded-none mb-4 group-hover:text-gold group-hover:border-gold/30 transition-all duration-300 text-zinc-500">
                  <IconComponent className="w-5 h-5 text-gold" />
                </div>

                {/* Count Up value */}
                <Counter value={stat.value} suffix={stat.suffix} />

                {/* Label text */}
                <span className="mt-2 text-[10px] md:text-xs font-mono tracking-widest text-zinc-400 uppercase">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
