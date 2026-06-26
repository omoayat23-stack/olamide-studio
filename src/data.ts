/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Service, PortfolioItem, Testimonial, StatItem } from './types';

// Let's use high-quality professional photography URLs from Unsplash
export const IMAGES = {
  weddingCinematic: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  fashionEditorial: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
  graduationPortrait: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
  photographerPortrait: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=1200&q=80',
};

export const SERVICES: Service[] = [
  {
    id: 'wedding',
    title: 'Wedding Photography',
    description: 'Capturing the raw emotions, timeless romance, and opulent details of your special day with cinematic grace.',
    icon: 'Heart',
    imageUrl: IMAGES.weddingCinematic,
    priceEstimate: 'From ₦250,000',
    features: [
      'Full day coverage (preparation to reception)',
      'High-end professional editing & retouching',
      'Luxurious leather-bound photobook',
      'Secure private online gallery with lifetime access',
      'Complementary pre-wedding couple shoot'
    ]
  },
  {
    id: 'portrait',
    title: 'Portrait Photography',
    description: 'Bespoke fine-art and studio portraits that capture your authentic personality and project confidence.',
    icon: 'User',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    priceEstimate: 'From ₦35,000',
    features: [
      'In-studio or tailored outdoor location',
      'Professional creative direction & styling advice',
      'Signature high-contrast retouching style',
      'Multiple outfit changes permitted',
      'Delivery of high-res digital files in 72 hours'
    ]
  },
  {
    id: 'fashion',
    title: 'Fashion Photography',
    description: 'High-concept, dramatic editorial and runway coverage for models, designers, and luxury lifestyle brands.',
    icon: 'Sparkles',
    imageUrl: IMAGES.fashionEditorial,
    priceEstimate: 'From ₦80,000',
    features: [
      'Avant-garde lighting & creative art direction',
      'Model portfolio development guidance',
      'High-end magazine-ready retouching',
      'Commercial usage licensing',
      'Collaboration with professional makeup artists'
    ]
  },
  {
    id: 'graduation',
    title: 'Graduation Photography',
    description: 'Commemorating your academic milestone with dignified, proud, and emotionally charged premium portraits.',
    icon: 'GraduationCap',
    imageUrl: IMAGES.graduationPortrait,
    priceEstimate: 'From ₦25,000',
    features: [
      'Traditional cap and gown studio framing',
      'Outdoor campus atmospheric shots (Ekpoma, AAU, etc.)',
      'Family package options included',
      'Laminated wooden frame prints',
      'Express processing options available'
    ]
  },
  {
    id: 'event',
    title: 'Event Photography',
    description: 'Vibrant, high-energy coverage of corporate conferences, luxury galas, and high-society cultural gatherings.',
    icon: 'Camera',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
    priceEstimate: 'From ₦100,000',
    features: [
      'Candid storytelling of key moments',
      'Fast turnaround for media & press releases',
      'Professional audio-visual vibe coordination',
      'High-quality wide-angle atmosphere shots',
      'Digital cloud delivery folder'
    ]
  },
  {
    id: 'birthday',
    title: 'Birthday Photography',
    description: 'Celebrate your milestones with high-fashion theme shoots, gorgeous cakes, and joy-filled moments.',
    icon: 'Cake',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    priceEstimate: 'From ₦40,000',
    features: [
      'Custom theme set design & lighting setup',
      'Creative pose guidance for confidence',
      'Family & friends group portraits',
      'Social-media optimized formats',
      'Stunning canvas print of hero shot'
    ]
  },
  {
    id: 'brand',
    title: 'Brand Photography',
    description: 'Elevating corporate brands, executives, and commercial products with world-class, conversion-focused imagery.',
    icon: 'Briefcase',
    imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=1200&q=80',
    priceEstimate: 'From ₦120,000',
    features: [
      'Corporate executive headshots & office action',
      'Sleek catalog product photography',
      'Visual storytelling of manufacturing/service delivery',
      'Full commercial copyrights',
      'Consistent brand tone & color matching'
    ]
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle Photography',
    description: 'Capturing organic, natural-light storytelling of daily life, families, and high-society tastemakers.',
    icon: 'Compass',
    imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1200&q=80',
    priceEstimate: 'From ₦50,000',
    features: [
      'Natural-light candid environments',
      'Relaxed, fun, and warm direction style',
      'Perfect for social curators & bloggers',
      'Authentic emotional captures',
      'High-quality digital delivery files'
    ]
  }
];

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  // Portraits
  {
    id: 'p1',
    title: 'The Golden Essence',
    category: 'Portraits',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    description: 'High-contrast studio portrait emphasizing natural textures and serene emotional depth.',
    aspect: 'portrait',
    location: 'Ekpoma Studio, Edo',
    year: '2026'
  },
  {
    id: 'p2',
    title: 'Melanin and Gold',
    category: 'Portraits',
    imageUrl: IMAGES.fashionEditorial,
    description: 'Artistic exploration of skin tone, elegance, and traditional luxury gold aesthetics.',
    aspect: 'portrait',
    location: 'Benin City, Edo',
    year: '2026'
  },
  {
    id: 'p3',
    title: 'Dignified Excellence',
    category: 'Portraits',
    imageUrl: IMAGES.graduationPortrait,
    description: 'Dignified graduation close-up capturing pure pride and accomplishment.',
    aspect: 'portrait',
    location: 'AAU Campus, Ekpoma',
    year: '2025'
  },

  // Weddings
  {
    id: 'w1',
    title: 'Timeless Vows in Edo',
    category: 'Weddings',
    imageUrl: IMAGES.weddingCinematic,
    description: 'A luxurious Nigerian wedding couple framed by the majestic soft golden hour light.',
    aspect: 'landscape',
    location: 'Prestige Event Hall, Ekpoma',
    year: '2026'
  },
  {
    id: 'w2',
    title: 'Gilded Royal Union',
    category: 'Weddings',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    description: 'Stunning outdoor wedding moments capturing raw affection and magnificent traditional fabrics.',
    aspect: 'landscape',
    location: 'Edo State, Nigeria',
    year: '2025'
  },

  // Events
  {
    id: 'e1',
    title: 'Vibrations of Edo Gala',
    category: 'Events',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
    description: 'Cinematic wide-angle shot capturing the high-society atmosphere of a luxury charity gala.',
    aspect: 'landscape',
    location: 'Edo Cultural Center, Benin',
    year: '2026'
  },
  {
    id: 'e2',
    title: 'Celebratory Splendor',
    category: 'Events',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    description: 'Vibrant capturing of movement and premium decor at a high-end anniversary celebration.',
    aspect: 'landscape',
    location: 'Grand Ballroom, Ekpoma',
    year: '2025'
  },

  // Fashion
  {
    id: 'f1',
    title: 'Urban Runway Contrast',
    category: 'Fashion',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
    description: 'Editorial fashion spread blending sleek modern textiles with rustic background structures.',
    aspect: 'portrait',
    location: 'Vantage Studio, Benin',
    year: '2026'
  },
  {
    id: 'f2',
    title: 'Sleek Silhouette',
    category: 'Fashion',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80',
    description: 'Dramatic lighting and high contrast styling capturing confidence and structure.',
    aspect: 'portrait',
    location: 'Ekpoma, Edo',
    year: '2026'
  },

  // Lifestyle
  {
    id: 'l1',
    title: 'Golden Hour Serenity',
    category: 'Lifestyle',
    imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1200&q=80',
    description: 'Warm, candid lifestyle portrait basking in natural sunlight and raw human joy.',
    aspect: 'square',
    location: 'Hills of Ekpoma, Edo',
    year: '2026'
  },

  // Commercial
  {
    id: 'c1',
    title: 'Modern Retail Space',
    category: 'Commercial',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    description: 'Commercial interior architecture shot for a high-end luxury fashion boutique.',
    aspect: 'landscape',
    location: 'Sapele Road, Benin City',
    year: '2025'
  },
  {
    id: 'c2',
    title: 'Executive Dynamism',
    category: 'Commercial',
    imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=1200&q=80',
    description: 'Corporate headshot showcasing leadership, modern workspaces, and professional elegance.',
    aspect: 'landscape',
    location: 'Tech Hub, Ekpoma',
    year: '2026'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Dr. Ehis Osagie',
    role: 'AAU Academic Board Member',
    text: 'Olamide Visuals captured my daughter’s graduation and family portraits. The level of professionalism, the pacing of the shoot, and the incredible lighting left us absolutely speechless. A true master of his craft in Edo State.',
    rating: 5,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 't2',
    name: 'Mrs. Adesuwa Alao',
    role: 'Bride',
    text: 'Words cannot describe the magic Olamide created at our wedding. Every time I look at our wedding photobook, I cry. He didn’t just take pictures; he preserved our laughter, our tears, and our vows. Luxury personified.',
    rating: 5,
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 't3',
    name: 'Tobi Bakare',
    role: 'Creative Director, Elan Wear',
    text: 'Working with Olamide Visuals for our brand lookbook was seamless. He has an impeccable eye for fashion and lighting, translating our sketches into dramatic, high-fashion editorials that helped boost our catalog sales.',
    rating: 5,
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
  }
];

export const STATS: StatItem[] = [
  {
    id: 's1',
    label: 'Projects Completed',
    value: 450,
    suffix: '+',
    icon: 'CheckCircle'
  },
  {
    id: 's2',
    label: 'Happy Clients',
    value: 320,
    suffix: '+',
    icon: 'Heart'
  },
  {
    id: 's3',
    label: 'Photo Sessions',
    value: 1200,
    suffix: '+',
    icon: 'Camera'
  },
  {
    id: 's4',
    label: 'Events Covered',
    value: 180,
    suffix: '+',
    icon: 'Calendar'
  }
];

export const WHY_CHOOSE_US = [
  {
    id: 'w1',
    title: 'Creative Direction',
    description: 'We don’t just stand behind the lens; we actively direct your poses, curation, set design, and storytelling to unlock your most confident self.'
  },
  {
    id: 'w2',
    title: 'Professional Editing',
    description: 'Our signature post-production retouching balances realistic skin textures, rich color-grading, and high-contrast dramatic tones for a true editorial finish.'
  },
  {
    id: 'w3',
    title: 'High-Quality Imagery',
    description: 'Equipped with cutting-edge full-frame mirrorless camera bodies and professional G-Master prime lenses, we deliver jaw-dropping detail and clarity.'
  },
  {
    id: 'w4',
    title: 'Attention to Detail',
    description: 'From correcting a stray strand of hair to balancing background light reflections, we obsess over every tiny pixel to ensure absolute perfection.'
  },
  {
    id: 'w5',
    title: 'Reliable Delivery',
    description: 'We respect your schedule. Our workflow guarantees beautifully curated high-res galleries within our promised timeframe, without compromise.'
  },
  {
    id: 'w6',
    title: 'Exceptional Experience',
    description: 'From your initial booking consultation to receiving your physical wooden prints, we provide an elite, pampering client journey that respects your vision.'
  }
];

export const INSTAGRAM_POSTS = [];

export const HERO_SLIDES = [
  {
    id: 'slide1',
    title: 'Capturing Moments. Creating Timeless Stories.',
    subtitle: 'Professional photography that transforms fleeting moments into unforgettable visual legacies.',
    image: IMAGES.weddingCinematic,
    tag: 'WEDDING & COUPLES'
  },
  {
    id: 'slide2',
    title: 'Uncompromising Editorial Artistry.',
    subtitle: 'Bold concept execution and high-contrast styling that makes every detail stand out.',
    image: IMAGES.fashionEditorial,
    tag: 'FASHION & EDITORIAL'
  },
  {
    id: 'slide3',
    title: 'Celebrating Academic Excellence.',
    subtitle: 'Preserving your milestones with dignity, prestige, and beautiful physical print memories.',
    image: IMAGES.graduationPortrait,
    tag: 'GRADUATION PORTRAITS'
  }
];
