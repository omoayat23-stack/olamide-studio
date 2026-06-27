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
                  <a
                    href="https://wa.me/2348142870306?text=Hello%20Olamide%20Visuals%2C%20I'm%20interested%20in%20your%20services%20and%20would%20like%20to%20discuss%20pricing."
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="flex items-center justify-center space-x-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] uppercase font-bold tracking-wider transition-all"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.023-5.101-2.883-6.963C16.528 1.932 14.061.907 11.432.908c-5.44 0-9.866 4.418-9.87 9.852 0 1.774.462 3.514 1.342 5.044L1.87 21.657l6.096-1.597-1.32-.906zm11.368-7.394c-.299-.149-1.762-.869-2.036-.968-.273-.099-.472-.149-.671.149-.199.3-.77.968-.944 1.168-.173.199-.347.224-.646.074-.3-.15-1.264-.465-2.409-1.486-.89-.794-1.49-1.775-1.665-2.074-.173-.3-.018-.462.13-.61.135-.133.298-.348.448-.522.151-.174.199-.298.298-.497.099-.198.05-.373-.025-.522-.075-.149-.671-1.616-.92-2.213-.242-.582-.488-.503-.671-.512-.173-.008-.371-.01-.57-.01-.198 0-.522.074-.794.372-.272.298-1.043 1.018-1.043 2.484 0 1.466 1.067 2.883 1.216 3.082.149.199 2.099 3.205 5.084 4.495.71.307 1.264.49 1.696.627.713.227 1.361.195 1.872.119.571-.085 1.762-.719 2.011-1.416.249-.696.249-1.293.174-1.417-.075-.124-.272-.198-.57-.347z"/>
                    </svg>
                    <span>Message for price or negotiation</span>
                  </a>

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
                    <a
                      href="https://wa.me/2348142870306?text=Hello%20Olamide%20Visuals%2C%20I'm%20interested%20in%20your%20services%20and%20would%20like%20to%20discuss%20pricing."
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="flex-1 mr-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] uppercase font-bold tracking-wider transition-all flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.023-5.101-2.883-6.963C16.528 1.932 14.061.907 11.432.908c-5.44 0-9.866 4.418-9.87 9.852 0 1.774.462 3.514 1.342 5.044L1.87 21.657l6.096-1.597-1.32-.906zm11.368-7.394c-.299-.149-1.762-.869-2.036-.968-.273-.099-.472-.149-.671.149-.199.3-.77.968-.944 1.168-.173.199-.347.224-.646.074-.3-.15-1.264-.465-2.409-1.486-.89-.794-1.49-1.775-1.665-2.074-.173-.3-.018-.462.13-.61.135-.133.298-.348.448-.522.151-.174.199-.298.298-.497.099-.198.05-.373-.025-.522-.075-.149-.671-1.616-.92-2.213-.242-.582-.488-.503-.671-.512-.173-.008-.371-.01-.57-.01-.198 0-.522.074-.794.372-.272.298-1.043 1.018-1.043 2.484 0 1.466 1.067 2.883 1.216 3.082.149.199 2.099 3.205 5.084 4.495.71.307 1.264.49 1.696.627.713.227 1.361.195 1.872.119.571-.085 1.762-.719 2.011-1.416.249-.696.249-1.293.174-1.417-.075-.124-.272-.198-.57-.347z"/>
                      </svg>
                      <span>Message for price</span>
                    </a>
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
