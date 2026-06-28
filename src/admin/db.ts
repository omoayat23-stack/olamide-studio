/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Service, PortfolioItem, Testimonial, BookingData } from '../types';
import { PORTFOLIO_ITEMS } from '../data';

// Let's create types for other tables we are managing
export interface CrewMember {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  availability: 'Available' | 'On Assignment' | 'Leave';
  phone: string;
  email: string;
  permissions: 'Full Access' | 'View & Shoot Only' | 'Retoucher Access';
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: 'published' | 'draft' | 'scheduled';
  publishDate: string;
  views: number;
  featured: boolean;
  seoTitle: string;
  seoDesc: string;
}

export interface Transaction {
  id: string;
  bookingId: string;
  clientName: string;
  amount: number;
  method: 'Paystack' | 'Flutterwave' | 'Bank Transfer';
  status: 'completed' | 'pending_confirmation' | 'refunded';
  date: string;
  invoiceNo: string;
}

export interface AdminProfile {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  category: 'auth' | 'booking' | 'portfolio' | 'blog' | 'crew' | 'finance' | 'settings' | 'system';
  user: string;
  ip: string;
  device: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  replyText?: string;
}

export interface WebsiteContent {
  hero: {
    title: string;
    subTitle: string;
    ctaText: string;
  };
  about: {
    biography: string;
    profileImage: string;
    businessAddress: string;
  };
  branding: {
    logoText: string;
    tagline: string;
    primaryColor: string;
    fontFamily: string;
    faviconUrl: string;
  };
  settings: {
    maintenanceMode: boolean;
    whatsappNumber: string;
    businessEmail: string;
    businessPhone: string;
    socials: {
      instagram: string;
      facebook: string;
      twitter: string;
      youtube: string;
    };
    seo: {
      metaTitle: string;
      metaDesc: string;
      ogImage: string;
    };
    payments: {
      paystackEnabled: boolean;
      flutterwaveEnabled: boolean;
      bankTransferEnabled: boolean;
      bankDetails: string;
    };
  };
}

// Default Seed Data
const DEFAULT_CREW: CrewMember[] = [
  {
    id: 'crew-1',
    name: 'Olamide Oluwabusayomi',
    role: 'Lead Photographer & Creative Director',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    availability: 'Available',
    phone: '08142870306',
    email: 'olamide@olamidevisuals.com',
    permissions: 'Full Access'
  },
  {
    id: 'crew-2',
    name: 'Emeka Okafor',
    role: 'Senior Retoucher & Lighting Specialist',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    availability: 'On Assignment',
    phone: '08034567890',
    email: 'emeka@olamidevisuals.com',
    permissions: 'Retoucher Access'
  },
  {
    id: 'crew-3',
    name: 'Adebayo Kolawole',
    role: 'Associate Event Shooter',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    availability: 'Available',
    phone: '08123456789',
    email: 'adebayo@olamidevisuals.com',
    permissions: 'View & Shoot Only'
  },
  {
    id: 'crew-4',
    name: 'Fatima Musa',
    role: 'Creative Makeup Artist & Stylist',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    availability: 'Leave',
    phone: '07098765432',
    email: 'fatima@olamidevisuals.com',
    permissions: 'View & Shoot Only'
  }
];

const DEFAULT_BLOG: BlogPost[] = [
  {
    id: 'blog-1',
    title: 'The Art of Edo Traditional Bridal Lighting',
    content: 'Edo traditional weddings are rich with visual culture - the crimson beads, the intricate fabrics, and the deep emotional connections. In this guide, we break down our proprietary speedlight-and-softbox layout used to capture those luxurious coral bead textures in any banquet hall in Ekpoma.',
    category: 'Lighting Techniques',
    tags: ['Bridal', 'Lighting', 'Edo Culture', 'Tutorial'],
    status: 'published',
    publishDate: '2026-05-18T10:00:00Z',
    views: 342,
    featured: true,
    seoTitle: 'Edo Bridal Wedding Lighting Setup - Olamide Visuals Blog',
    seoDesc: 'Learn the exact lighting setups Olamide Visuals uses to shoot luxury Edo weddings in Ekpoma.'
  },
  {
    id: 'blog-2',
    title: '5 Crucial Questions to Ask Before Hiring a Nigerian Wedding Photographer',
    content: 'A wedding is a once-in-a-lifetime portal of memory. Before committing to a photographer, make sure to ask about backup camera systems, raw file archiving policies, and real-world lighting experience in dark Nigerian reception venues.',
    category: 'Client Guides',
    tags: ['Weddings', 'Client Tips', 'Hiring Guide'],
    status: 'published',
    publishDate: '2026-06-12T14:30:00Z',
    views: 189,
    featured: false,
    seoTitle: 'How to Choose Your Wedding Photographer in Nigeria',
    seoDesc: 'Avoid disaster. Ask these 5 questions before booking any Nigerian event photographer.'
  },
  {
    id: 'blog-3',
    title: 'Graduation Day Session Posing & Confidence Blueprint',
    content: 'Graduating from AAU (Ambrose Alli University) or any top institution represents years of resilience. This guide explores creative ways to frame your cap, gown, and academic hood while showcasing authentic joy in your portrait posture.',
    category: 'Creative Posing',
    tags: ['AAU', 'Graduation', 'Posing tips', 'Portraits'],
    status: 'draft',
    publishDate: '2026-06-30T09:00:00Z',
    views: 0,
    featured: false,
    seoTitle: 'AAU Graduation Portrait Pose Ideas - Ekpoma Studio',
    seoDesc: 'Elegant posing blueprints for your upcoming Ambrose Alli University graduation shoot.'
  }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    bookingId: 'BK-5482',
    clientName: 'Osas Osaro',
    amount: 150000,
    method: 'Paystack',
    status: 'completed',
    date: '2026-06-20T11:45:00Z',
    invoiceNo: 'INV-2026-0041'
  },
  {
    id: 'tx-2',
    bookingId: 'BK-9821',
    clientName: 'Chioma Nkechi',
    amount: 250000,
    method: 'Flutterwave',
    status: 'completed',
    date: '2026-06-22T09:12:00Z',
    invoiceNo: 'INV-2026-0042'
  },
  {
    id: 'tx-3',
    bookingId: 'BK-2315',
    clientName: 'Tunde Bakare',
    amount: 45000,
    method: 'Bank Transfer',
    status: 'pending_confirmation',
    date: '2026-06-24T08:30:00Z',
    invoiceNo: 'INV-2026-0043'
  }
];

const DEFAULT_CONTACT_MESSAGES: ContactMessage[] = [
  {
    id: 'msg-1',
    name: 'Amina Bello',
    email: 'amina.bello@gmail.com',
    subject: 'Corporate Gala Shoot Inquiry',
    message: 'Greetings. We are organizing a corporate end-of-year award dinner in Ekpoma on October 15th. We need professional coverage for 250 guests. Could you please send us your comprehensive commercial rates and brand portfolio catalog?',
    date: '2026-06-21T15:20:00Z',
    status: 'unread'
  },
  {
    id: 'msg-2',
    name: 'Efe Omoruyi',
    email: 'efe.omoruyi@yahoo.com',
    subject: 'AAU Graduation Slot Booking',
    message: 'Hello, I will be graduating from AAU in September and I want to book an outdoor portrait session with you guys. Do you have group packages for 3 classmates?',
    date: '2026-06-23T11:05:00Z',
    status: 'read'
  }
];

const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-06-24T12:00:00Z',
    action: 'Administrator login successful',
    category: 'auth',
    user: 'Olamide (Super Admin)',
    ip: '102.89.43.11',
    device: 'MacBook Pro - Chrome (Lagos, NG)'
  },
  {
    id: 'log-2',
    timestamp: '2026-06-24T11:15:00Z',
    action: 'Approved Booking BK-9821 for Chioma Nkechi',
    category: 'booking',
    user: 'Olamide (Super Admin)',
    ip: '102.89.43.11',
    device: 'MacBook Pro - Chrome (Lagos, NG)'
  },
  {
    id: 'log-3',
    timestamp: '2026-06-23T16:45:00Z',
    action: 'Updated homepage hero headline',
    category: 'settings',
    user: 'Olamide (Super Admin)',
    ip: '102.88.22.95',
    device: 'iPhone 15 Pro - Safari (Ekpoma, NG)'
  }
];

const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  username: 'admin',
  fullName: 'Olamide Oluwabusayomi',
  email: 'Olamideoluwabusayomi123@gmail.com',
  phone: '08142870306',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  twoFactorEnabled: false,
  twoFactorSecret: '7F9A3B5D2E'
};

const DEFAULT_CONTENT: WebsiteContent = {
  hero: {
    title: 'Visual Poetry',
    subTitle: 'PRESERVING Nigeria’S HIGHEST MILESTONES WITH CINEMATIC LIGHTING & ARCHITECTURAL COMPOSITION',
    ctaText: 'RESERVE APERTURE'
  },
  about: {
    biography: 'Based in Edo State, Olamide Oluwabusayomi is an award-winning creative photographer who synthesizes high-contrast editorial structures with traditional cultural richness. Renowned for meticulous speedlight mastery and emotional visual staging, Olamide Visuals stands as Benin and Ekpoma’s premier agency for weddings, high-concept fashion, and fine-art milestones.',
    profileImage: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=1200&q=80',
    businessAddress: 'Ekpoma, Edo State, Nigeria'
  },
  branding: {
    logoText: 'Olamide',
    tagline: 'Visuals',
    primaryColor: '#D4AF37', // Gold
    fontFamily: 'font-serif',
    faviconUrl: '/favicon.ico'
  },
  settings: {
    maintenanceMode: false,
    whatsappNumber: '2348142870306',
    businessEmail: 'Olamideoluwabusayomi123@gmail.com',
    businessPhone: '08142870306',
    socials: {
      instagram: 'https://www.instagram.com/olamide_visuals',
      facebook: 'https://facebook.com/olamide_visuals',
      twitter: 'https://twitter.com/olamide_visuals',
      youtube: 'https://youtube.com/olamide_visuals'
    },
    seo: {
      metaTitle: 'Olamide Visuals - Premium Cinematic Photographer in Edo State, Nigeria',
      metaDesc: 'Award-winning wedding, portrait, and fashion photography services in Benin City, Ekpoma, and Nigeria. Preserving luxury milestones with dramatic lighting.',
      ogImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80'
    },
    payments: {
      paystackEnabled: true,
      flutterwaveEnabled: false,
      bankTransferEnabled: true,
      bankDetails: 'Access Bank - 1234567890 - Olamide Oluwabusayomi Visuals'
    }
  }
};

// Initialize localStorage DB if empty
export function initDB() {
  // 1. Bookings (We'll check existing or populate some samples)
  const existingBookings = localStorage.getItem('olamide_visuals_bookings');
  if (!existingBookings) {
    const seedBookings: BookingData[] = [
      {
        id: 'BK-5482',
        name: 'Osas Osaro',
        email: 'osas@gmail.com',
        phone: '08142870306',
        eventType: 'Portrait Photography',
        preferredDate: '2026-07-10',
        message: 'Traditional outfit studio portraits with high-contrast dramatic shadows.',
        createdAt: '2026-06-20T11:30:00Z',
        status: 'pending'
      },
      {
        id: 'BK-9821',
        name: 'Chioma Nkechi',
        email: 'chioma@gmail.com',
        phone: '08140001112',
        eventType: 'Wedding Photography',
        preferredDate: '2026-12-18',
        message: 'Luxury traditional Edo and church white wedding package.',
        createdAt: '2026-06-22T09:00:00Z',
        status: 'confirmed'
      },
      {
        id: 'BK-2315',
        name: 'Tunde Bakare',
        email: 'tunde@gmail.com',
        phone: '08055544433',
        eventType: 'Fashion Photography',
        preferredDate: '2026-07-25',
        message: 'High fashion runway catalog showcase under intense studio strobes.',
        createdAt: '2026-06-24T08:15:00Z',
        status: 'pending'
      }
    ];
    localStorage.setItem('olamide_visuals_bookings', JSON.stringify(seedBookings));
  }

  // 2. Crew
  if (!localStorage.getItem('olamide_visuals_crew')) {
    localStorage.setItem('olamide_visuals_crew', JSON.stringify(DEFAULT_CREW));
  }

  // 3. Blog
  if (!localStorage.getItem('olamide_visuals_blog')) {
    localStorage.setItem('olamide_visuals_blog', JSON.stringify(DEFAULT_BLOG));
  }

  // 4. Transactions
  if (!localStorage.getItem('olamide_visuals_transactions')) {
    localStorage.setItem('olamide_visuals_transactions', JSON.stringify(DEFAULT_TRANSACTIONS));
  }

  // 5. Contact Messages
  if (!localStorage.getItem('olamide_visuals_messages')) {
    localStorage.setItem('olamide_visuals_messages', JSON.stringify(DEFAULT_CONTACT_MESSAGES));
  }

  // 6. Activity Logs
  if (!localStorage.getItem('olamide_visuals_logs')) {
    localStorage.setItem('olamide_visuals_logs', JSON.stringify(DEFAULT_ACTIVITY_LOGS));
  }

  // 7. Admin Profile
  if (!localStorage.getItem('olamide_visuals_admin')) {
    localStorage.setItem('olamide_visuals_admin', JSON.stringify(DEFAULT_ADMIN_PROFILE));
  }

  // 8. Custom Editable Website Content
  if (!localStorage.getItem('olamide_visuals_content')) {
    localStorage.setItem('olamide_visuals_content', JSON.stringify(DEFAULT_CONTENT));
  }

  // 9. Extra visitors state
  if (!localStorage.getItem('olamide_visuals_visitors')) {
    localStorage.setItem('olamide_visuals_visitors', '1452');
  }

  // 10. Portfolio Items
  if (!localStorage.getItem('olamide_visuals_portfolio_items')) {
    localStorage.setItem('olamide_visuals_portfolio_items', JSON.stringify(PORTFOLIO_ITEMS));
  }

  // 11. Instagram Posts
  if (!localStorage.getItem('olamide_visuals_instagram_posts')) {
    localStorage.setItem('olamide_visuals_instagram_posts', JSON.stringify([]));
  }

  // 12. Cinematic Spotlight
  if (!localStorage.getItem('olamide_visuals_spotlight')) {
    localStorage.setItem('olamide_visuals_spotlight', JSON.stringify([]));
  }
}

// Memory cache fallback for local storage keys to survive QuotaExceededError
const memoryDbCache: Record<string, any> = {};

export function compressImageBase64(base64Str: string, maxWidth = 1200, maxHeight = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image/')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
}

export const saveToLocalOnly = <T>(key: string, data: T): void => {
  memoryDbCache[key] = data;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Local storage write failed for key: ${key} (likely quota exceeded). Keeping in memory cache.`, e);
  }
};

// Data Getters and Setters
export const getFromDB = <T>(key: string, defaultValue: T): T => {
  if (key in memoryDbCache) {
    return memoryDbCache[key] as T;
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Populate memory cache so future reads are extremely fast
      memoryDbCache[key] = parsed;
      return parsed as T;
    }
    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export const saveToDB = <T>(key: string, data: T): void => {
  try {
    let oldRaw: string | null = null;
    try {
      oldRaw = localStorage.getItem(key);
    } catch (e) {
      // ignore
    }

    // Save locally (updates memory cache & tries writing to localStorage)
    saveToLocalOnly(key, data);

    // Sync to Supabase automatically
    const KEY_TO_SUPABASE_TABLE: Record<string, string> = {
      'olamide_visuals_bookings': 'bookings',
      'olamide_visuals_crew': 'crew',
      'olamide_visuals_blog': 'blog',
      'olamide_visuals_messages': 'messages',
      'olamide_visuals_portfolio_items': 'portfolio_items',
      'olamide_visuals_instagram_posts': 'instagram',
      'olamide_visuals_spotlight': 'spotlight',
      'olamide_visuals_media': 'media',
      'olamide_visuals_transactions': 'transactions',
      'olamide_visuals_logs': 'logs',
    };
    const supTable = KEY_TO_SUPABASE_TABLE[key];
    if (supTable && Array.isArray(data)) {
      const mapped = data.map(item => {
        const clone = { ...item };
        if (!clone.id) {
          clone.id = Math.random().toString(36).substring(2, 11);
        }
        return clone;
      });
      fetch("/api/supabase/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableName: supTable,
          records: mapped
        })
      })
      .then(async (res) => {
        const resJson = await res.json();
        if (!res.ok) {
          console.warn(`[SUPABASE AUTO-SYNC NOTICE] Could not auto-sync ${key} to ${supTable}:`, resJson.error || res.statusText);
        } else if (resJson.tableMissing) {
          console.log(`[SUPABASE AUTO-SYNC NOTICE] Table '${supTable}' is not yet created on Supabase. Falling back to local state.`);
        } else {
          console.log(`[SUPABASE AUTO-SYNC SUCCESS] Successfully synchronized ${mapped.length} records to Supabase table '${supTable}'`);
        }
      })
      .catch(err => {
        console.warn(`[SUPABASE AUTO-SYNC NOTICE] Error auto-syncing ${key} to ${supTable}:`, err);
      });
    }

    // Dynamic cloud sync configuration
    const KEY_TO_COLLECTION: Record<string, string> = {
      'olamide_visuals_bookings': 'bookings',
      'olamide_visuals_crew': 'crew',
      'olamide_visuals_blog': 'blog',
      'olamide_visuals_transactions': 'transactions',
      'olamide_visuals_messages': 'messages',
      'olamide_visuals_logs': 'logs',
      'olamide_visuals_portfolio_items': 'portfolio',
      'olamide_visuals_media': 'media',
      'olamide_visuals_instagram_posts': 'instagram',
      'olamide_visuals_spotlight': 'spotlight',
    };

    if (key === 'olamide_visuals_admin') {
      import('../firebase').then(m => {
        const currentUser = m.auth.currentUser;
        const isAdmin = currentUser && (
          currentUser.email === 'shaffieswabstar@gmail.com' ||
          currentUser.email === 'Olamideoluwabusayomi123@gmail.com'
        );
        if (isAdmin) {
          m.saveItemToCloud('profile', 'admin', data).catch(() => {});
        }
      }).catch(() => {});
    } else if (key === 'olamide_visuals_content') {
      // Sync to Supabase content table
      const contentData = data as any;
      const flatContent = {
        id: 'main',
        biography: contentData?.about?.biography || '',
        profileImage: contentData?.about?.profileImage || '',
        businessAddress: contentData?.about?.businessAddress || '',
        logoText: contentData?.branding?.logoText || '',
        tagline: contentData?.branding?.tagline || '',
        primaryColor: contentData?.branding?.primaryColor || '',
        fontFamily: contentData?.branding?.fontFamily || '',
        faviconUrl: contentData?.branding?.faviconUrl || '',
        heroTitle: contentData?.hero?.title || '',
        heroSubTitle: contentData?.hero?.subTitle || '',
        heroCtaText: contentData?.hero?.ctaText || ''
      };
      
      fetch("/api/supabase/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableName: "content",
          records: [flatContent]
        })
      })
      .then(async (res) => {
        const resJson = await res.json();
        if (!res.ok) {
          console.error(`[SUPABASE AUTO-SYNC ERROR] Failed to sync content to 'content' table:`, resJson.error || res.statusText);
        } else {
          console.log(`[SUPABASE AUTO-SYNC SUCCESS] Successfully synchronized content to Supabase table 'content'`);
        }
      })
      .catch(err => {
        console.error(`[SUPABASE AUTO-SYNC EXCEPTION] Error syncing content:`, err);
      });

      import('../firebase').then(m => {
        const currentUser = m.auth.currentUser;
        const isAdmin = currentUser && (
          currentUser.email === 'shaffieswabstar@gmail.com' ||
          currentUser.email === 'Olamideoluwabusayomi123@gmail.com'
        );
        if (isAdmin) {
          m.saveItemToCloud('content', 'main', data).catch(() => {});
        }
      }).catch(() => {});
    } else if (key in KEY_TO_COLLECTION && Array.isArray(data)) {
      const coll = KEY_TO_COLLECTION[key];
      const oldList: any[] = oldRaw ? JSON.parse(oldRaw) : [];
      const newList = data as any[];

      import('../firebase').then(m => {
        const currentUser = m.auth.currentUser;
        const isAdmin = currentUser && (
          currentUser.email === 'shaffieswabstar@gmail.com' ||
          currentUser.email === 'Olamideoluwabusayomi123@gmail.com'
        );

        const adminOnlyKeys = [
          'olamide_visuals_crew',
          'olamide_visuals_blog',
          'olamide_visuals_transactions',
          'olamide_visuals_logs',
          'olamide_visuals_portfolio_items',
          'olamide_visuals_media',
          'olamide_visuals_instagram_posts',
          'olamide_visuals_spotlight'
        ];

        if (adminOnlyKeys.includes(key) && !isAdmin) {
          return;
        }

        // Identify and remove deleted documents from Cloud
        oldList.forEach(oldItem => {
          const id = oldItem.id || oldItem.txId || oldItem.bookingId;
          if (id && !newList.some(newItem => (newItem.id || newItem.txId || newItem.bookingId) === id)) {
            // Also auto-delete from Supabase if table mapping exists
            if (supTable) {
              fetch("/api/supabase/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tableName: supTable, id })
              }).catch(err => console.error("Supabase auto-delete error:", err));
            }

            if (isAdmin || !['bookings', 'messages'].includes(coll)) {
              m.deleteItemFromCloud(coll, id).catch(() => {});
            }
          }
        });

        // Add or modify documents in Cloud
        newList.forEach(item => {
          const id = item.id || item.txId || item.bookingId;
          if (id) {
            const existed = oldList.some(oldItem => (oldItem.id || oldItem.txId || oldItem.bookingId) === id);
            if (['bookings', 'messages'].includes(coll)) {
              if (!existed || isAdmin) {
                m.saveItemToCloud(coll, id, item).catch(() => {});
              }
            } else {
              m.saveItemToCloud(coll, id, item).catch(() => {});
            }
          }
        });
      }).catch(() => {});
    }
  } catch (e) {
    console.error(`Error writing to db key: ${key}`, e);
  }
};

// Custom helpers for direct actions
export function logAdminAction(action: string, category: ActivityLog['category']) {
  const logs = getFromDB<ActivityLog[]>('olamide_visuals_logs', DEFAULT_ACTIVITY_LOGS);
  const newLog: ActivityLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action,
    category,
    user: 'Olamide (Super Admin)',
    ip: '102.89.43.11',
    device: 'MacBook Pro - Chrome (Lagos, NG)'
  };
  saveToDB('olamide_visuals_logs', [newLog, ...logs]);
}
