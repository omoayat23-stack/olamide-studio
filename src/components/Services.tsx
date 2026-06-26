/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, User, Sparkles, GraduationCap, Camera, Cake, Briefcase, Compass, ArrowRight, Check } from 'lucide-react';
import { SERVICES } from '../data';
import { Service } from '../types';

interface ServicesProps {
  onSelectServiceForBooking: (serviceName: string) => void;
}

const iconMap: Record<string, any> = {
  Heart: Heart,
  User: User,
  Sparkles: Sparkles,
  GraduationCap: GraduationCap,
  Camera: Camera,
  Cake: Cake,
  Briefcase: Briefcase,
  Compass: Compass,
};

export default function Services({ onSelectServiceForBooking }: ServicesProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  return (
    <section id="services" className="py-24 bg-[#0A0A0A] border-t border-white/5 relative">
      {/* Dynamic blurred ambient light */}
      <div className="absolute left-10 top-1/2 w-80 h-80 bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-mono font-medium tracking-[0.3em] text-gold uppercase">
            OUR CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light tracking-tight text-white leading-tight">
            Artistic <span className="text-gold italic font-normal">Specializations</span>
          </h2>
          <div className="h-[1px] w-16 bg-gold mx-auto mt-4" />
          <p className="text-sm md:text-base text-zinc-400 font-light max-w-xl mx-auto leading-relaxed">
            From glamorous private studio portrait sessions to high-society events and weddings, we bring technical perfection and luxurious creative vision to every frame.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service, index) => {
            const IconComponent = iconMap[service.icon] || Camera;
            return (
              <motion.div
                key={service.id}
                className="group relative h-96 overflow-hidden border border-white/5 bg-[#080808] flex flex-col justify-between p-6 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                {/* Background Image of Card with deep opacity blend */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-500 grayscale group-hover:scale-110 transform duration-700 pointer-events-none"
                  style={{ backgroundImage: `url(${service.imageUrl})` }}
                />

                {/* Card Top Border highlights */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent group-hover:via-gold/50 transition-all duration-500" />

                {/* Service Header: Icon & Title */}
                <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 rounded-none border border-gold/30 bg-[#0A0A0A]/80 flex items-center justify-center text-gold group-hover:border-gold group-hover:bg-gold group-hover:text-black transition-all duration-500">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-sans font-extrabold tracking-wide text-white uppercase group-hover:text-gold transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-xs text-zinc-400 font-light leading-relaxed group-hover:text-zinc-300 transition-colors duration-300">
                    {service.description}
                  </p>
                </div>

                {/* Service Bottom: pricing estimate and quick details buttons */}
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-500">ESTIMATE:</span>
                    <span className="text-gold font-semibold">{service.priceEstimate}</span>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => setSelectedService(service)}
                      className="flex-1 py-2 border border-white/5 hover:border-gold/40 text-center text-zinc-400 hover:text-gold font-sans text-[10px] tracking-widest uppercase transition-colors cursor-pointer"
                    >
                      Key Features
                    </button>
                    <button
                      onClick={() => onSelectServiceForBooking(service.title)}
                      className="p-2 border border-gold/30 text-gold hover:bg-gold hover:text-black transition-all duration-300 cursor-pointer"
                      title="Direct Book"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dynamic Details Modal (Key Features) */}
        <AnimatePresence>
          {selectedService && (
            <motion.div
              id="service-modal-backdrop"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                id="service-modal"
                className="bg-[#0A0A0A] border border-white/10 w-full max-w-lg p-6 md:p-8 relative"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedService(null)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-gold text-xs font-mono tracking-widest uppercase border border-white/5 px-3 py-1.5 hover:border-gold/30 transition-colors cursor-pointer"
                >
                  Close
                </button>

                {/* Service Details Inside Modal */}
                <div className="space-y-6 mt-4">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-gold uppercase">
                      SERVICE HIGHLIGHTS
                    </span>
                    <h3 className="text-xl md:text-2xl font-serif font-light text-white uppercase mt-1">
                      {selectedService.title}
                    </h3>
                  </div>

                  <p className="text-sm text-zinc-400 font-light leading-relaxed">
                    {selectedService.description}
                  </p>

                  <div className="h-[1px] bg-white/5" />

                  {/* Feature Bullets */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono tracking-wider text-zinc-400 uppercase">What is Included:</h4>
                    <ul className="space-y-2.5">
                      {selectedService.features.map((feat) => (
                        <li key={feat} className="flex items-start text-xs text-zinc-300 leading-relaxed">
                          <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5 mr-2" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="h-[1px] bg-white/5" />

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase">Starting From</p>
                      <p className="text-lg font-sans font-bold text-gold">{selectedService.priceEstimate}</p>
                    </div>
                    <button
                      onClick={() => {
                        const title = selectedService.title;
                        setSelectedService(null);
                        onSelectServiceForBooking(title);
                      }}
                      className="px-6 py-3 bg-gold text-black hover:bg-white font-sans text-xs tracking-[0.15em] uppercase font-bold transition-colors cursor-pointer"
                    >
                      Book This Service
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
