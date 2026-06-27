/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Phone, Mail, MapPin, Instagram, ExternalLink } from 'lucide-react';

export default function Contact() {
  const contacts = [
    {
      icon: Phone,
      label: 'Direct Line',
      value: '08142870306',
      href: 'tel:08142870306',
      actionText: 'Call Now'
    },
    {
      icon: Mail,
      label: 'Email Inbox',
      value: 'Olamideoluwabusayomi123@gmail.com',
      href: 'mailto:Olamideoluwabusayomi123@gmail.com',
      actionText: 'Send Email'
    },
    {
      icon: MapPin,
      label: 'Creative Studio',
      value: 'Ekpoma, Edo State, Nigeria',
      href: 'https://maps.google.com/?q=Ekpoma,Edo,Nigeria',
      actionText: 'Get Directions'
    },
    {
      icon: Instagram,
      label: 'Instagram DM',
      value: '@olamide_visuals',
      href: 'https://www.instagram.com/olamide_visuals',
      actionText: 'Direct Message'
    }
  ];

  return (
    <section id="contact" className="py-24 bg-[#080808] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-mono font-medium tracking-[0.3em] text-gold uppercase">
            CONTACT REGISTRY
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light tracking-tight text-white uppercase leading-tight">
            Connect With <span className="text-gold italic font-normal lowercase">Olamide</span>
          </h2>
          <div className="h-[1px] w-16 bg-gold mx-auto mt-4" />
          <p className="text-sm md:text-base text-zinc-400 font-light max-w-xl mx-auto leading-relaxed">
            Ready to preserve your next luxury milestone? Reach out to us through any channel below or consult our physical studio location map.
          </p>
        </div>

        {/* Contact Grid split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Quick Contact Cards on Left */}
          <div className="lg:col-span-5 space-y-6">
            {contacts.map((contact, idx) => {
              const Icon = contact.icon;
              return (
                <motion.div
                  key={contact.label}
                  className="p-5 bg-[#0A0A0A]/40 border border-white/5 hover:border-gold/30 transition-all duration-300 relative flex items-center justify-between group"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <div className="flex items-center space-x-4">
                    {/* Icon container */}
                    <div className="p-3 bg-black border border-white/5 text-gold group-hover:border-gold/30 transition-all rounded-none">
                      <Icon className="w-4.5 h-4.5" />
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">
                        {contact.label}
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-200 font-bold select-all break-all">
                        {contact.value}
                      </p>
                    </div>
                  </div>

                  {/* Action Link button */}
                  <a
                    href={contact.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-black hover:bg-gold text-zinc-400 hover:text-black border border-white/5 hover:border-gold font-mono text-[9px] tracking-widest uppercase transition-all duration-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{contact.actionText}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </motion.div>
              );
            })}
          </div>

          {/* Styled Google Maps iframe on Right */}
          <div className="lg:col-span-7 relative">
            <div className="relative w-full h-[400px] border border-white/5 bg-black p-2 overflow-hidden group">
              {/* Corner Viewfinder Markers */}
              <div className="absolute top-4 left-4 w-4 h-[1px] bg-gold/40 z-10" />
              <div className="absolute top-4 left-4 h-4 w-[1px] bg-gold/40 z-10" />
              <div className="absolute bottom-4 right-4 w-4 h-[1px] bg-gold/40 z-10" />
              <div className="absolute bottom-4 right-4 h-4 w-[1px] bg-gold/40 z-10" />

              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15830.407780332306!2d6.066453676229892!3d6.74102929285496!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x10469b60da80187d%3A0xe54d87dfb6ef7da8!2sEkpoma%2C%20Edo!5e0!3m2!1sen!2sng!4v1719273600000!5m2!1sen!2sng"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(110%) opacity(80%)' }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700"
              />
            </div>
            {/* Visual indicator overlay */}
            <div className="absolute bottom-6 right-6 pointer-events-none bg-black/90 border border-white/5 px-3 py-1.5 text-[9px] font-mono tracking-widest text-gold uppercase">
              STUDIO AREA MAP
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
