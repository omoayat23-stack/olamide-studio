/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Phone, Mail, User, FileText, CheckCircle, Send, MessageSquare } from 'lucide-react';
import { BookingData } from '../types';
import { saveToDB } from '../admin/db';

interface BookingFormProps {
  preselectedService: string;
  onClearPreselected: () => void;
}

export default function BookingForm({ preselectedService, onClearPreselected }: BookingFormProps) {
  const [formData, setFormData] = useState<Omit<BookingData, 'id' | 'createdAt' | 'status'>>({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    preferredDate: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedBooking, setLastSubmittedBooking] = useState<BookingData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync preselected service from Services component clicks
  useEffect(() => {
    if (preselectedService) {
      setFormData((prev) => ({ ...prev, eventType: preselectedService }));
    }
  }, [preselectedService]);

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!formData.name.trim()) tempErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Invalid email address';
    }
    if (!formData.phone.trim()) {
      tempErrors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/[^0-9]/g, '').length < 8) {
      tempErrors.phone = 'Invalid phone number';
    }
    if (!formData.eventType) tempErrors.eventType = 'Please select a service type';
    if (!formData.preferredDate) tempErrors.preferredDate = 'Please select a preferred date';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate luxury API response lag
    setTimeout(() => {
      const newBooking: BookingData = {
        ...formData,
        id: `OB-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      // Save to localStorage and trigger cloud sync
      try {
        const existingRaw = localStorage.getItem('olamide_visuals_bookings');
        const existing: BookingData[] = existingRaw ? JSON.parse(existingRaw) : [];
        existing.push(newBooking);
        saveToDB('olamide_visuals_bookings', existing);
      } catch (error) {
        console.error('Failed to write local booking storage', error);
      }

      setLastSubmittedBooking(newBooking);
      setIsSubmitting(false);
      onClearPreselected();

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        eventType: '',
        preferredDate: '',
        message: ''
      });
    }, 1500);
  };

  // Auto-compose WhatsApp booking serialization
  const generateWhatsAppLink = (booking: BookingData) => {
    const text = `Hello Olamide Visuals, I would like to book a photography session!
*Booking Reference:* ${booking.id}
*Name:* ${booking.name}
*Service:* ${booking.eventType}
*Preferred Date:* ${booking.preferredDate}
*Phone:* ${booking.phone}
*Message:* ${booking.message || 'No additional details.'}

Please confirm my session details. Thank you!`;
    
    return `https://wa.me/2348142870306?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="booking" className="py-24 bg-[#0A0A0A] border-t border-white/5 relative">
      {/* Visual background lens grid */}
      <div className="absolute right-0 bottom-0 w-96 h-96 bg-gold/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Left panel: Info & instructions */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="text-xs font-mono font-medium tracking-[0.3em] text-gold uppercase">
                RESERVE YOUR SESSION
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light tracking-tight text-white uppercase leading-tight">
                Secure the <span className="text-gold italic font-normal lowercase">Aperture</span>
              </h2>
              <div className="h-[1px] w-16 bg-gold mt-4" />
            </div>

            <div className="space-y-6 text-zinc-300 font-light text-sm md:text-base leading-relaxed">
              <p>
                Our shooting calendar fills up rapidly, especially for weekends, traditional Edo festivals, and university graduation milestones. 
                Fill out our secure booking form to pitch your preferred slot.
              </p>
              <p>
                Once received, Olamide will reach out personally in 24 hours to conduct a visual styling brief, review locations, and lock in your session timeline.
              </p>
            </div>

            {/* Quick trust metrics */}
            <div className="space-y-4 border-t border-white/5 pt-8">
              <div className="flex items-center space-x-3 text-xs font-mono text-zinc-400">
                <CheckCircle className="w-4.5 h-4.5 text-gold shrink-0" />
                <span>Zero hidden fees or surprise charges</span>
              </div>
              <div className="flex items-center space-x-3 text-xs font-mono text-zinc-400">
                <CheckCircle className="w-4.5 h-4.5 text-gold shrink-0" />
                <span>Complementary poses & expression briefing</span>
              </div>
              <div className="flex items-center space-x-3 text-xs font-mono text-zinc-400">
                <CheckCircle className="w-4.5 h-4.5 text-gold shrink-0" />
                <span>Express delivery & backup security included</span>
              </div>
            </div>
          </div>

          {/* Right panel: Scheduling Form */}
          <div className="lg:col-span-7 bg-[#080808] border border-white/5 p-6 md:p-10 relative">
            
            {/* Viewfinder corner lines */}
            <div className="absolute top-0 left-0 w-4 h-[1px] bg-gold/30" />
            <div className="absolute top-0 left-0 h-4 w-[1px] bg-gold/30" />
            <div className="absolute bottom-0 right-0 w-4 h-[1px] bg-gold/30" />
            <div className="absolute bottom-0 right-0 h-4 w-[1px] bg-gold/30" />

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase flex items-center space-x-2">
                  <User className="w-3.5 h-3.5 text-gold" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-[#0A0A0A] border text-white text-xs font-sans rounded-none focus:outline-none focus:border-gold transition-colors ${
                    errors.name ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder="e.g. Osas Osaro"
                />
                {errors.name && <p className="text-[10px] text-red-500 font-mono">{errors.name}</p>}
              </div>

              {/* Email & Phone side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-gold" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-[#0A0A0A] border text-white text-xs font-sans rounded-none focus:outline-none focus:border-gold transition-colors ${
                      errors.email ? 'border-red-500/50' : 'border-white/10'
                    }`}
                    placeholder="e.g. osas@gmail.com"
                  />
                  {errors.email && <p className="text-[10px] text-red-500 font-mono">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-gold" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-[#0A0A0A] border text-white text-xs font-sans rounded-none focus:outline-none focus:border-gold transition-colors ${
                      errors.phone ? 'border-red-500/50' : 'border-white/10'
                    }`}
                    placeholder="e.g. 08142870306"
                  />
                  {errors.phone && <p className="text-[10px] text-red-500 font-mono">{errors.phone}</p>}
                </div>
              </div>

              {/* Event Type & Preferred Date side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Event Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase flex items-center space-x-2">
                    <FileText className="w-3.5 h-3.5 text-gold" />
                    <span>Service Category</span>
                  </label>
                  <select
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-[#0A0A0A] border text-zinc-300 text-xs font-sans rounded-none focus:outline-none focus:border-gold transition-colors appearance-none ${
                      errors.eventType ? 'border-red-500/50' : 'border-white/10'
                    }`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23D4AF37' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="" disabled className="bg-[#0A0A0A] text-zinc-600">Select Service</option>
                    <option value="Portrait Photography" className="bg-[#0A0A0A]">Portrait Photography</option>
                    <option value="Wedding Photography" className="bg-[#0A0A0A]">Wedding Photography</option>
                    <option value="Event Photography" className="bg-[#0A0A0A]">Event Photography</option>
                    <option value="Graduation Photography" className="bg-[#0A0A0A]">Graduation Photography</option>
                    <option value="Birthday Photography" className="bg-[#0A0A0A]">Birthday Photography</option>
                    <option value="Fashion Photography" className="bg-[#0A0A0A]">Fashion Photography</option>
                    <option value="Brand Photography" className="bg-[#0A0A0A]">Brand Photography</option>
                    <option value="Lifestyle Photography" className="bg-[#0A0A0A]">Lifestyle Photography</option>
                  </select>
                  {errors.eventType && <p className="text-[10px] text-red-500 font-mono">{errors.eventType}</p>}
                </div>

                {/* Preferred Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-gold" />
                    <span>Preferred Date</span>
                  </label>
                  <input
                    type="date"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-[#0A0A0A] border text-zinc-300 text-xs font-sans rounded-none focus:outline-none focus:border-gold transition-colors ${
                      errors.preferredDate ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  {errors.preferredDate && <p className="text-[10px] text-red-500 font-mono">{errors.preferredDate}</p>}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase flex items-center space-x-2">
                  <MessageSquare className="w-3.5 h-3.5 text-gold" />
                  <span>Session Vision & Message</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 text-white text-xs font-sans rounded-none focus:outline-none focus:border-gold transition-colors resize-none"
                  placeholder="Describe your location, vision, traditional colors, or clothing outfits..."
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-none bg-gold text-black hover:bg-white font-sans text-xs tracking-widest font-extrabold uppercase transition-all duration-300 flex items-center justify-center space-x-3 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting details...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Booking Reservation</span>
                  </>
                )}
              </button>

            </form>
          </div>

        </div>
      </div>

      {/* Luxury Stateful Booking Success Confirmation Popup */}
      <AnimatePresence>
        {lastSubmittedBooking && (
          <motion.div
            id="booking-success-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              id="booking-success-modal"
              className="bg-[#0A0A0A] border border-white/10 w-full max-w-xl p-8 relative overflow-hidden"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ duration: 0.4 }}
            >
              {/* Gold glowing grid border */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />

              <div className="flex flex-col items-center text-center space-y-6">
                
                {/* Checkmark icon */}
                <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                  <CheckCircle className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono tracking-widest text-gold">
                    TRANSMISSION SUCCESSFUL
                  </span>
                  <h3 className="text-2xl font-serif font-light text-white uppercase tracking-wider">
                    Session Registered
                  </h3>
                  <p className="text-xs text-zinc-400 font-light max-w-sm mx-auto">
                    Your luxury session proposal has been logged. Please click below to complete your checkout and process payments securely via WhatsApp.
                  </p>
                </div>

                {/* Serialized Receipt Card */}
                <div className="w-full bg-black border border-white/5 p-5 text-left space-y-3 font-mono text-[11px] text-zinc-400">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span>BOOKING ID:</span>
                    <span className="text-gold font-bold">{lastSubmittedBooking.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PATRON:</span>
                    <span className="text-white font-semibold">{lastSubmittedBooking.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SERVICE:</span>
                    <span className="text-zinc-200">{lastSubmittedBooking.eventType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE PREFERRED:</span>
                    <span className="text-zinc-200">{lastSubmittedBooking.preferredDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>STATUS:</span>
                    <span className="text-gold font-bold uppercase">{lastSubmittedBooking.status}</span>
                  </div>
                </div>

                {/* Instant Actions including direct WhatsApp routing */}
                <div className="w-full flex flex-col sm:flex-row gap-4 pt-2">
                  <a
                    href={generateWhatsAppLink(lastSubmittedBooking)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-sans text-xs tracking-widest font-extrabold uppercase flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 fill-current" />
                    <span>WhatsApp Checkout & Pay</span>
                  </a>
                  <button
                    onClick={() => setLastSubmittedBooking(null)}
                    className="flex-1 py-3.5 border border-white/5 hover:border-gold/20 text-zinc-400 hover:text-white font-sans text-xs tracking-widest uppercase transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
