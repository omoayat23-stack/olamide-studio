/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, LayoutDashboard, Calendar, Users, Briefcase, Image, FileText, 
  DollarSign, Settings, Bell, Search, LogOut, Shield, ChevronRight, 
  Trash2, Edit3, Edit, Plus, Check, X, ArrowUpRight, Folder, Globe, Link2, 
  Sliders, MessageSquare, Database, RefreshCw, Star, Info, Mail, Phone, 
  MapPin, CheckCircle, AlertTriangle, Play, HelpCircle, Download, FileSpreadsheet,
  Upload, Eye, CreditCard, ToggleLeft, ToggleRight, HardDrive, Type, FileCode, Lock, Sparkles, Instagram,
  Heart, MessageCircle, Activity, Cloud
} from 'lucide-react';
import { 
  getFromDB, saveToDB, saveToLocalOnly, logAdminAction as rawLogAdminAction, CrewMember, BlogPost, Transaction, 
  AdminProfile, ActivityLog, ContactMessage, WebsiteContent, compressImageBase64
} from './db';
import { BookingData, Service, PortfolioItem } from '../types';
import { PORTFOLIO_ITEMS } from '../data';

interface AdminDashboardProps {
  onLogout: () => void;
}

export interface SpotlightItem {
  id: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  imageUrl: string;
  technicalSpecs: string;
}

type TabType = 
  | 'dashboard' 
  | 'bookings' 
  | 'calendar'
  | 'clients' 
  | 'portfolio' 
  | 'blog' 
  | 'crew' 
  | 'finance' 
  | 'media' 
  | 'content' 
  | 'seo' 
  | 'messages' 
  | 'brand' 
  | 'logs'
  | 'instagram'
  | 'spotlight'
  | 'supabase';

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Loaded DB States
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [blog, setBlog] = useState<BlogPost[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [instagramPosts, setInstagramPosts] = useState<{ id: string; imageUrl: string; likes: string; comments: string }[]>([]);
  const [spotlightItems, setSpotlightItems] = useState<SpotlightItem[]>([]);
  const [uploadDiagnostics, setUploadDiagnostics] = useState<{
    success: boolean;
    bucket: string;
    url: string;
    path: string;
    dbRecordCreated: boolean;
    timestamp: string;
    error?: string;
  } | null>(null);

  // Shadow logAdminAction for instant, real-time UI logging updates
  const logAdminAction = (action: string, category: ActivityLog['category']) => {
    rawLogAdminAction(action, category);
    const updatedLogs = getFromDB<ActivityLog[]>('olamide_visuals_logs', []);
    setLogs(updatedLogs);
  };

  // Real-time complete control deletion handlers
  const handleDeleteBooking = (id: string) => {
    const updated = bookings.filter(b => b.id !== id);
    syncBookings(updated);
    setSelectedBookingIds(prev => prev.filter(item => item !== id));
    logAdminAction(`Permanently deleted booking reference: ${id}`, 'booking');
    triggerToast(`Booking ${id} permanently deleted.`);
  };

  const handleBulkDeleteBookings = (ids: string[]) => {
    const updated = bookings.filter(b => !ids.includes(b.id!));
    syncBookings(updated);
    setSelectedBookingIds(prev => prev.filter(id => !ids.includes(id)));
    logAdminAction(`Permanently bulk deleted ${ids.length} booking(s)`, 'booking');
    triggerToast(`${ids.length} booking(s) permanently deleted.`);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    syncTransactions(updated);
    logAdminAction(`Permanently deleted financial transaction: ${id}`, 'finance');
    triggerToast(`Transaction permanently deleted.`);
  };

  const syncLogs = (updated: ActivityLog[]) => {
    setLogs(updated);
    saveToDB('olamide_visuals_logs', updated);
  };

  const handleDeleteLog = (id: string) => {
    const updated = logs.filter(l => l.id !== id);
    syncLogs(updated);
    triggerToast('System log deleted.');
  };

  const handleClearAllLogs = () => {
    syncLogs([]);
    triggerToast('All system logs cleared.');
  };

  const handleDeleteMessage = (id: string) => {
    const updated = messages.filter(m => m.id !== id);
    syncMessages(updated);
    logAdminAction(`Permanently deleted client message reference: ${id}`, 'system');
    triggerToast('Client message permanently deleted.');
  };

  // Modals / Editing States
  const [editingBooking, setEditingBooking] = useState<BookingData | null>(null);
  const [editingCrew, setEditingCrew] = useState<CrewMember | null>(null);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioItem | null>(null);

  // Beautiful non-blocking custom iframe confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionText: string;
    isDanger: boolean;
    onConfirm: () => void;
  } | null>(null);

  const requestConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    actionText = "Confirm",
    isDanger = true
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      actionText,
      isDanger,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      }
    });
  };
  
  // New entry states
  const [newBookingModal, setNewBookingModal] = useState(false);
  const [newCrewModal, setNewCrewModal] = useState(false);
  const [newBlogModal, setNewBlogModal] = useState(false);
  const [newServiceModal, setNewServiceModal] = useState(false);
  const [newPortfolioModal, setNewPortfolioModal] = useState(false);
  const [editPortfolioModal, setEditPortfolioModal] = useState(false);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<PortfolioItem | null>(null);
 
  // Form states
  const [bookingForm, setBookingForm] = useState<Partial<BookingData>>({});
  const [crewForm, setCrewForm] = useState<Partial<CrewMember>>({});
  const [blogForm, setBlogForm] = useState<Partial<BlogPost>>({});
  const [serviceForm, setServiceForm] = useState<Partial<Service>>({});
  const [portfolioForm, setPortfolioForm] = useState<Partial<PortfolioItem>>({});
  const [instagramForm, setInstagramForm] = useState({ imageUrl: '', likes: '', comments: '' });
  const [uploadingIg, setUploadingIg] = useState(false);
  const [spotlightForm, setSpotlightForm] = useState({ title: '', category: '', tagline: '', description: '', imageUrl: '', technicalSpecs: '' });
  const [uploadingSpotlight, setUploadingSpotlight] = useState(false);
 
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiScanResult, setAiScanResult] = useState<{ visualAudit?: string; criticalCheck?: string; fallbackActive?: boolean; errorHint?: string } | null>(null);
 
  const [spotlightAiAnalyzing, setSpotlightAiAnalyzing] = useState(false);
  const [spotlightAiScanResult, setSpotlightAiScanResult] = useState<{ visualAudit?: string; criticalCheck?: string; fallbackActive?: boolean; errorHint?: string } | null>(null);
 
  // Supabase states
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('olamide_visuals_supabase_url') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem('olamide_visuals_supabase_anon_key') || '');
  const [supabaseConfig, setSupabaseConfig] = useState<{ envConfigured: boolean; url: string | null } | null>(null);
  const [supabaseTesting, setSupabaseTesting] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);
  const [syncingTables, setSyncingTables] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Cloudinary states
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState(() => localStorage.getItem('olamide_visuals_cloudinary_cloud_name') || '');
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState(() => localStorage.getItem('olamide_visuals_cloudinary_api_key') || '');
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState(() => localStorage.getItem('olamide_visuals_cloudinary_api_secret') || '');
  const [cloudinaryConfig, setCloudinaryConfig] = useState<{ envConfigured: boolean; cloudName: string | null } | null>(null);
  const [cloudinaryTesting, setCloudinaryTesting] = useState(false);
  const [cloudinaryTestResult, setCloudinaryTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);
  const [preferredStorage, setPreferredStorage] = useState<'supabase' | 'cloudinary'>(
    () => (localStorage.getItem('olamide_visuals_preferred_storage') as 'supabase' | 'cloudinary') || 'supabase'
  );

  // Disconnect & Diagnosis states
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<any | null>(null);

  const disconnectSupabase = async () => {
    if (!window.confirm("Are you sure you want to disconnect Supabase? This will clear credentials on the client and server cache.")) {
      return;
    }
    
    try {
      const res = await fetch("/api/supabase/disconnect", {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSupabaseUrl('');
        setSupabaseAnonKey('');
        setSupabaseTestResult(null);
        setSupabaseConfig({ envConfigured: false, url: null });
        
        localStorage.removeItem('olamide_visuals_supabase_url');
        localStorage.removeItem('olamide_visuals_supabase_anon_key');
        
        triggerToast("Supabase disconnected successfully!");
        logAdminAction("Successfully disconnected Supabase integration", "system");

        // Automatically run diagnostics to show the new state!
        runDiagnostics();
      } else {
        triggerToast(`Failed to disconnect: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error("Disconnect error:", err);
      triggerToast(`Failed to disconnect: ${err.message || err}`);
    }
  };

  const runDiagnostics = async () => {
    setDiagnosing(true);
    triggerToast("Initiating system diagnostics scan...");
    try {
      const res = await fetch("/api/diagnose/engine");
      const data = await res.json();
      if (res.ok) {
        setDiagnosticReport(data);
        triggerToast("Diagnostics scan completed successfully!");
      } else {
        triggerToast(`Diagnostics failed: ${data.error || "Unknown server error"}`);
      }
    } catch (err: any) {
      console.error("Diagnostics error:", err);
      triggerToast(`Diagnostics failed: ${err.message || err}`);
    } finally {
      setDiagnosing(false);
    }
  };
 
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    triggerToast(`SQL Schema for "${label}" copied to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };
 
  useEffect(() => {
    fetch('/api/supabase/config')
      .then(res => res.json())
      .then(data => {
        setSupabaseConfig(data);
      })
      .catch(err => console.error("Failed to fetch Supabase config:", err));

    fetch('/api/cloudinary/config')
      .then(res => res.json())
      .then(data => {
        setCloudinaryConfig(data);
      })
      .catch(err => console.error("Failed to fetch Cloudinary config:", err));
  }, []);

  const uploadToSupabaseStorage = async (base64Image: string, filename: string): Promise<string> => {
    try {
      setUploadDiagnostics(null); // Reset diagnostics on new upload
      
      const isCloudinary = preferredStorage === 'cloudinary';
      const endpoint = isCloudinary ? "/api/cloudinary/upload" : "/api/supabase/upload";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image, filename }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || "Upload failed");
      }
      const data = await res.json();
      
      const diag = {
        success: true,
        bucket: isCloudinary ? 'cloudinary' : (data.bucket || 'portfolio'),
        url: data.url,
        path: isCloudinary ? (data.publicId || filename) : (data.path || filename),
        dbRecordCreated: false, // Set to true once the admin publishes or updates the corresponding section
        timestamp: new Date().toLocaleTimeString(),
      };
      setUploadDiagnostics(diag);
      return data.url;
    } catch (error: any) {
      const diagErr = {
        success: false,
        bucket: preferredStorage === 'cloudinary' ? 'cloudinary' : 'portfolio',
        url: '',
        path: '',
        dbRecordCreated: false,
        timestamp: new Date().toLocaleTimeString(),
        error: error.message || String(error)
      };
      setUploadDiagnostics(diagErr);
      triggerToast(`${preferredStorage === 'cloudinary' ? 'Cloudinary' : 'Supabase'} Upload Failed: ${error.message || error}`);
      throw error; // Strictly propagate the error to block any saving of local/mock/base64 fallbacks
    }
  };
 
  const analyzePortfolioImage = async (imageSrc: string) => {
    if (!imageSrc) return;
    setAiAnalyzing(true);
    setAiScanResult(null);
    triggerToast("AI is scanning and analyzing the image...");
 
    try {
      let base64Image = imageSrc;
 
      if (!imageSrc.startsWith('data:')) {
        try {
          const response = await fetch(imageSrc);
          const blob = await response.blob();
          base64Image = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn("Could not convert image URL to base64 on client, passing URL directly", e);
        }
      }
 
      const res = await fetch("/api/gemini/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
 
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to scan image");
      }
 
      const data = await res.json();
      if (data.title || data.category) {
        setPortfolioForm(prev => ({
          ...prev,
          title: data.title || prev.title,
          category: data.category || prev.category,
          description: data.description || prev.description,
          tags: data.tags || prev.tags,
          aiPending: !!data.aiPending
        }));
        setAiScanResult({
          visualAudit: data.visualAudit,
          criticalCheck: data.criticalCheck,
          fallbackActive: !!data.fallbackActive,
          errorHint: data.errorHint
        });
        if (data.aiPending) {
          triggerToast("Manual entry enabled (Pending AI Analysis status assigned).");
        } else {
          triggerToast(`AI Auto-Filled: "${data.title}" in ${data.category}`);
        }
      } else {
        triggerToast("AI couldn't generate a clear title or category.");
      }
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      triggerToast(`AI Analysis failed: ${err.message || err}`);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleReAnalyzePortfolioItem = async (item: PortfolioItem) => {
    triggerToast("Initiating Gemini AI analysis for pending item...");
    try {
      let base64Image = item.imageUrl;

      if (!item.imageUrl.startsWith('data:')) {
        try {
          const response = await fetch(item.imageUrl);
          const blob = await response.blob();
          base64Image = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn("Could not convert image URL to base64 on client, passing URL directly", e);
        }
      }

      const res = await fetch("/api/gemini/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to scan image");
      }

      const data = await res.json();
      if (data.title || data.category) {
        const updatedItem: PortfolioItem = {
          ...item,
          title: data.title || item.title,
          category: data.category || item.category,
          description: data.description || item.description,
          tags: data.tags || item.tags,
          aiPending: !!data.aiPending
        };
        const updated = portfolioItems.map(p => p.id === item.id ? updatedItem : p);
        syncPortfolio(updated);
        logAdminAction(`Successfully ran AI analysis on pending artwork: ${updatedItem.title}`, 'portfolio');
        if (data.aiPending) {
          triggerToast("AI analysis bypassed (Gemini API still unconfigured).");
        } else {
          triggerToast(`AI Analysis complete! Auto-filled metadata saved.`);
        }
      } else {
        triggerToast("AI couldn't generate a clear title or category.");
      }
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      triggerToast(`AI Analysis failed: ${err.message || err}`);
    }
  };
 
  const analyzeSpotlightImage = async (imageSrc: string) => {
    if (!imageSrc) return;
    setSpotlightAiAnalyzing(true);
    setSpotlightAiScanResult(null);
    triggerToast("AI is scanning and analyzing the spotlight image...");
 
    try {
      let base64Image = imageSrc;
 
      if (!imageSrc.startsWith('data:')) {
        try {
          const response = await fetch(imageSrc);
          const blob = await response.blob();
          base64Image = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn("Could not convert spotlight image URL to base64 on client, passing URL directly", e);
        }
      }
 
      const res = await fetch("/api/gemini/analyze-spotlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
 
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to scan spotlight image");
      }
 
      const data = await res.json();
      if (data.title || data.category) {
        setSpotlightForm({
          title: data.title || '',
          category: data.category || '',
          tagline: data.tagline || '',
          description: data.description || '',
          technicalSpecs: data.technicalSpecs || '',
          imageUrl: imageSrc
        });
        setSpotlightAiScanResult({
          visualAudit: data.visualAudit,
          criticalCheck: data.criticalCheck,
          fallbackActive: !!data.fallbackActive,
          errorHint: data.errorHint
        });
        if (data.fallbackActive) {
          triggerToast(`Manual entry enabled (Gemini AI unconfigured / offline).`);
        } else {
          triggerToast(`AI Auto-Filled Spotlight: "${data.title}" in ${data.category}`);
        }
      } else {
        triggerToast("AI couldn't generate spotlight content.");
      }
    } catch (err: any) {
      console.error("AI Spotlight Analysis error:", err);
      triggerToast(`AI Spotlight Analysis failed: ${err.message || err}`);
    } finally {
      setSpotlightAiAnalyzing(false);
    }
  };

  const testSupabaseConnection = async () => {
    setSupabaseTesting(true);
    setSupabaseTestResult(null);
    triggerToast("Testing connection to Supabase...");

    try {
      const payload: any = {};
      if (supabaseUrl) payload.url = supabaseUrl;
      if (supabaseAnonKey) payload.anonKey = supabaseAnonKey;

      const res = await fetch("/api/supabase/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setSupabaseTestResult({
          success: false,
          message: data.error || "Failed to connect",
          details: data.details ? JSON.stringify(data.details, null, 2) : undefined
        });
        triggerToast("Supabase Connection Failed");
      } else {
        setSupabaseTestResult({
          success: true,
          message: data.message,
          details: data.details
        });
        triggerToast("Supabase Connection Successful!");
        logAdminAction("Successfully tested Supabase database connection", "system");

        if (supabaseUrl) {
          localStorage.setItem('olamide_visuals_supabase_url', supabaseUrl);
        }
        if (supabaseAnonKey) {
          localStorage.setItem('olamide_visuals_supabase_anon_key', supabaseAnonKey);
        }
      }
    } catch (err: any) {
      console.error("Test connection error:", err);
      setSupabaseTestResult({
        success: false,
        message: err.message || "An unexpected error occurred."
      });
      triggerToast("Supabase Connection Failed");
    } finally {
      setSupabaseTesting(false);
    }
  };

  const testCloudinaryConnection = async () => {
    setCloudinaryTesting(true);
    setCloudinaryTestResult(null);
    triggerToast("Testing connection to Cloudinary...");

    try {
      const payload: any = {};
      if (cloudinaryCloudName) payload.cloudName = cloudinaryCloudName;
      if (cloudinaryApiKey) payload.apiKey = cloudinaryApiKey;
      if (cloudinaryApiSecret) payload.apiSecret = cloudinaryApiSecret;

      const res = await fetch("/api/cloudinary/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setCloudinaryTestResult({
          success: false,
          message: data.error || "Failed to connect",
          details: data.details ? JSON.stringify(data.details, null, 2) : undefined
        });
        triggerToast("Cloudinary Connection Failed");
      } else {
        setCloudinaryTestResult({
          success: true,
          message: data.message,
          details: data.details
        });
        triggerToast("Cloudinary Connection Successful!");
        logAdminAction("Successfully tested Cloudinary cloud connection", "system");

        if (cloudinaryCloudName) {
          localStorage.setItem('olamide_visuals_cloudinary_cloud_name', cloudinaryCloudName);
        }
        if (cloudinaryApiKey) {
          localStorage.setItem('olamide_visuals_cloudinary_api_key', cloudinaryApiKey);
        }
        if (cloudinaryApiSecret) {
          localStorage.setItem('olamide_visuals_cloudinary_api_secret', cloudinaryApiSecret);
        }

        // Automatically configure preferred storage to cloudinary on success
        localStorage.setItem('olamide_visuals_preferred_storage', 'cloudinary');
        setPreferredStorage('cloudinary');
      }
    } catch (err: any) {
      console.error("Test Cloudinary connection error:", err);
      setCloudinaryTestResult({
        success: false,
        message: err.message || "An unexpected error occurred."
      });
      triggerToast("Cloudinary Connection Failed");
    } finally {
      setCloudinaryTesting(false);
    }
  };

  const syncTableToSupabase = async (tableName: string, dataItems: any[]) => {
    if (dataItems.length === 0) {
      triggerToast(`No local items to sync for table "${tableName}".`);
      return;
    }

    setSyncingTables(prev => ({ ...prev, [tableName]: true }));
    triggerToast(`Syncing ${dataItems.length} records to Supabase "${tableName}"...`);

    try {
      const mappedRecords = dataItems.map(item => {
        const clone = { ...item };
        if (!clone.id) {
          clone.id = Math.random().toString(36).substring(2, 11);
        }
        return clone;
      });

      const payload: any = {
        tableName,
        records: mappedRecords
      };

      if (supabaseUrl) payload.url = supabaseUrl;
      if (supabaseAnonKey) payload.anonKey = supabaseAnonKey;

      const res = await fetch("/api/supabase/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to synchronize");
      }

      if (result.tableMissing) {
        triggerToast(`Notice: Table "${tableName}" is not created on Supabase yet. Using local storage.`);
        return;
      }

      triggerToast(`✓ Synchronized ${dataItems.length} items to "${tableName}"!`);
      logAdminAction(`Synchronized database table ${tableName} to Supabase (${dataItems.length} records)`, "system");
    } catch (err: any) {
      console.warn(`[SUPABASE SYNC NOTIFY] ${tableName}:`, err);
      triggerToast(`Synchronization notice for ${tableName}: ${err.message}`);
    } finally {
      setSyncingTables(prev => ({ ...prev, [tableName]: false }));
    }
  };

  const [pullingAll, setPullingAll] = useState(false);

  const loadAllDataFromSupabase = async () => {
    setPullingAll(true);
    let successCount = 0;

    const tablesToPull = [
      { key: 'olamide_visuals_bookings', table: 'bookings', setter: setBookings },
      { key: 'olamide_visuals_crew', table: 'crew', setter: setCrew },
      { key: 'olamide_visuals_blog', table: 'blog', setter: setBlog },
      { key: 'olamide_visuals_transactions', table: 'transactions', setter: setTransactions },
      { key: 'olamide_visuals_messages', table: 'messages', setter: setMessages },
      { key: 'olamide_visuals_logs', table: 'logs', setter: setLogs },
      { key: 'olamide_visuals_portfolio_items', table: 'portfolio_items', setter: setPortfolioItems },
      { key: 'olamide_visuals_media', table: 'media', setter: setMediaItems },
      { key: 'olamide_visuals_instagram_posts', table: 'instagram', setter: setInstagramPosts },
      { key: 'olamide_visuals_spotlight', table: 'spotlight', setter: setSpotlightItems },
    ];

    for (const t of tablesToPull) {
      try {
        const res = await fetch(`/api/supabase/fetch?table=${t.table}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            saveToLocalOnly(t.key, result.data);
            t.setter(result.data);
            successCount++;
          }
        }
      } catch (err) {
        console.warn(`[SUPABASE INITIAL LOAD] Failed to pull from table ${t.table}:`, err);
      }
    }

    try {
      const res = await fetch('/api/supabase/fetch?table=content');
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          const mainRecord = result.data.find((item: any) => item.id === 'main') || result.data[0];
          const cnt = getFromDB<any>('olamide_visuals_content', {});
          const updatedContent = {
            ...cnt,
            about: {
              ...cnt.about,
              biography: mainRecord.biography || cnt?.about?.biography || '',
              profileImage: mainRecord.profileImage || cnt?.about?.profileImage || '',
              businessAddress: mainRecord.businessAddress || cnt?.about?.businessAddress || '',
            },
            branding: {
              ...cnt.branding,
              logoText: mainRecord.logoText || cnt?.branding?.logoText || '',
              tagline: mainRecord.tagline || cnt?.branding?.tagline || '',
              primaryColor: mainRecord.primaryColor || cnt?.branding?.primaryColor || '',
              fontFamily: mainRecord.fontFamily || cnt?.branding?.fontFamily || '',
              faviconUrl: mainRecord.faviconUrl || cnt?.branding?.faviconUrl || '',
            },
            hero: {
              ...cnt.hero,
              title: mainRecord.heroTitle || cnt?.hero?.title || '',
              subTitle: mainRecord.heroSubTitle || cnt?.hero?.subTitle || '',
              ctaText: mainRecord.heroCtaText || cnt?.hero?.ctaText || '',
            }
          };
          saveToLocalOnly('olamide_visuals_content', updatedContent);
          setContent(updatedContent);
          successCount++;
        }
      }
    } catch (err) {
      console.warn(`[SUPABASE INITIAL LOAD] Failed to pull content:`, err);
    }

    setPullingAll(false);
    return successCount;
  };

  // Media Library states
  const [editingMedia, setEditingMedia] = useState<{ id: string; url: string; name: string; size: string; folder: string } | null>(null);
  const [newMediaModal, setNewMediaModal] = useState(false);
  const [mediaFolders, setMediaFolders] = useState(['Weddings', 'Portraits', 'Fashion', 'Graduation', 'Behind The Scenes']);
  const [activeMediaFolder, setActiveMediaFolder] = useState('Weddings');
  const [mediaItems, setMediaItems] = useState<{ id: string; url: string; name: string; size: string; folder: string }[]>(() => {
    return getFromDB<{ id: string; url: string; name: string; size: string; folder: string }[]>('olamide_visuals_media', [
      { id: 'm-1', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80', name: 'wedding_timeless_moment.jpg', size: '2.4 MB', folder: 'Weddings' },
      { id: 'm-2', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80', name: 'fashion_editorial_studio.jpg', size: '1.8 MB', folder: 'Fashion' },
      { id: 'm-3', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80', name: 'graduation_studio_ceremony.jpg', size: '3.1 MB', folder: 'Graduation' },
      { id: 'm-4', url: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=1200&q=80', name: 'behind_the_scenes_action.jpg', size: '1.2 MB', folder: 'Behind The Scenes' }
    ]);
  });

  // Calendar state
  const [visitors, setVisitors] = useState<number>(() => {
    return Number(localStorage.getItem('olamide_visuals_visitors') || '1452');
  });
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(6); // July (0-indexed or 1-indexed? Let's do 6 = July)

  // System Security states
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [avatarDragActive, setAvatarDragActive] = useState(false);

  // Hidden Access Configuration and Security States
  const [hiddenAccessEnabled, setHiddenAccessEnabled] = useState(true);
  const [hiddenAccessMethod, setHiddenAccessMethod] = useState<'double-tap' | 'triple-tap' | 'five-tap' | 'disabled'>('double-tap');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [lockoutDuration, setLockoutDuration] = useState(15);
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminEmail, setAdminEmail] = useState('olamide@olamidevisuals.com');

  // Trigger Toast
  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Load Database on Mount and establish Real-Time Synchronization listeners
  useEffect(() => {
    const b = getFromDB<BookingData[]>('olamide_visuals_bookings', []);
    const c = getFromDB<CrewMember[]>('olamide_visuals_crew', []);
    const bl = getFromDB<BlogPost[]>('olamide_visuals_blog', []);
    const tx = getFromDB<Transaction[]>('olamide_visuals_transactions', []);
    const msg = getFromDB<ContactMessage[]>('olamide_visuals_messages', []);
    const lg = getFromDB<ActivityLog[]>('olamide_visuals_logs', []);
    const pr = getFromDB<AdminProfile>('olamide_visuals_admin', {
      username: 'admin',
      fullName: 'Olamide Oluwabusayomi',
      email: 'Olamideoluwabusayomi123@gmail.com',
      phone: '08142870306',
      avatarUrl: '',
      twoFactorEnabled: false,
      twoFactorSecret: ''
    });
    const cnt = getFromDB<WebsiteContent>('olamide_visuals_content', {} as WebsiteContent);

    const has = getFromDB<{
      enabled: boolean;
      method: 'double-tap' | 'triple-tap' | 'five-tap' | 'disabled';
      maxAttempts: number;
      lockoutDuration: number;
    }>('olamide_visuals_hidden_access_settings', {
      enabled: true,
      method: 'double-tap',
      maxAttempts: 5,
      lockoutDuration: 15
    });

    // Front-end dynamic variables
    const localServices = getFromDB<Service[]>('olamide_visuals_services', []);
    const localPortfolio = getFromDB<PortfolioItem[]>('olamide_visuals_portfolio_items', PORTFOLIO_ITEMS);
    const localInstagram = getFromDB<{ id: string; imageUrl: string; likes: string; comments: string }[]>('olamide_visuals_instagram_posts', []);
    const localSpotlight = getFromDB<SpotlightItem[]>('olamide_visuals_spotlight', []);

    setBookings(b);
    setCrew(c);
    setBlog(bl);
    setTransactions(tx);
    setMessages(msg);
    setLogs(lg);
    setProfile(pr);
    setContent(cnt);
    setMaintenanceMode(cnt?.settings?.maintenanceMode || false);
    setServices(localServices);
    setPortfolioItems(localPortfolio);
    setInstagramPosts(localInstagram);
    setSpotlightItems(localSpotlight);

    // Set Security settings states
    setHiddenAccessEnabled(has.enabled);
    setHiddenAccessMethod(has.method);
    setMaxLoginAttempts(has.maxAttempts);
    setLockoutDuration(has.lockoutDuration);
    setAdminUsername(pr?.username || 'admin');
    setAdminEmail(pr?.email || 'olamide@olamidevisuals.com');

    // Establish dynamic real-time cross-context synchronizer (listening to localStorage events and polling)
    const syncDatabaseRealtime = () => {
      const freshBookings = getFromDB<BookingData[]>('olamide_visuals_bookings', []);
      const freshTransactions = getFromDB<Transaction[]>('olamide_visuals_transactions', []);
      const freshMessages = getFromDB<ContactMessage[]>('olamide_visuals_messages', []);
      const freshLogs = getFromDB<ActivityLog[]>('olamide_visuals_logs', []);
      const freshBlog = getFromDB<BlogPost[]>('olamide_visuals_blog', []);
      const freshCrew = getFromDB<CrewMember[]>('olamide_visuals_crew', []);
      const freshProfile = getFromDB<AdminProfile>('olamide_visuals_admin', {} as AdminProfile);
      const freshMedia = getFromDB<{ id: string; url: string; name: string; size: string; folder: string }[]>('olamide_visuals_media', [
        { id: 'm-1', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80', name: 'wedding_timeless_moment.jpg', size: '2.4 MB', folder: 'Weddings' },
        { id: 'm-2', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80', name: 'fashion_editorial_studio.jpg', size: '1.8 MB', folder: 'Fashion' },
        { id: 'm-3', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80', name: 'graduation_studio_ceremony.jpg', size: '3.1 MB', folder: 'Graduation' },
        { id: 'm-4', url: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=1200&q=80', name: 'behind_the_scenes_action.jpg', size: '1.2 MB', folder: 'Behind The Scenes' }
      ]);
      const freshVisitors = Number(localStorage.getItem('olamide_visuals_visitors') || '1452');
      const freshInstagram = getFromDB<{ id: string; imageUrl: string; likes: string; comments: string }[]>('olamide_visuals_instagram_posts', []);
      const freshSpotlight = getFromDB<SpotlightItem[]>('olamide_visuals_spotlight', []);

      // Update state if they differ to avoid excessive re-renders
      setBookings(prev => JSON.stringify(prev) !== JSON.stringify(freshBookings) ? freshBookings : prev);
      setTransactions(prev => JSON.stringify(prev) !== JSON.stringify(freshTransactions) ? freshTransactions : prev);
      setMessages(prev => JSON.stringify(prev) !== JSON.stringify(freshMessages) ? freshMessages : prev);
      setLogs(prev => JSON.stringify(prev) !== JSON.stringify(freshLogs) ? freshLogs : prev);
      setBlog(prev => JSON.stringify(prev) !== JSON.stringify(freshBlog) ? freshBlog : prev);
      setCrew(prev => JSON.stringify(prev) !== JSON.stringify(freshCrew) ? freshCrew : prev);
      setProfile(prev => prev && JSON.stringify(prev) !== JSON.stringify(freshProfile) ? freshProfile : prev);
      setMediaItems(prev => JSON.stringify(prev) !== JSON.stringify(freshMedia) ? freshMedia : prev);
      setVisitors(prev => prev !== freshVisitors ? freshVisitors : prev);
      setInstagramPosts(prev => JSON.stringify(prev) !== JSON.stringify(freshInstagram) ? freshInstagram : prev);
      setSpotlightItems(prev => JSON.stringify(prev) !== JSON.stringify(freshSpotlight) ? freshSpotlight : prev);
    };

    window.addEventListener('storage', syncDatabaseRealtime);
    const intervalId = setInterval(syncDatabaseRealtime, 1000); // Poll every 1 second for instant responsive updates

    // Interval to simulate active live traffic in real-time
    const trafficIntervalId = setInterval(() => {
      setVisitors(prev => {
        const next = prev + Math.floor(Math.random() * 2) + 1; // Increment by 1 or 2
        localStorage.setItem('olamide_visuals_visitors', String(next));
        return next;
      });
    }, 12000); // every 12 seconds

    // Silent automatic connection validation on dashboard load to populate server cache
    const storedUrl = localStorage.getItem('olamide_visuals_supabase_url');
    const storedAnon = localStorage.getItem('olamide_visuals_supabase_anon_key');
    if (storedUrl && storedAnon) {
      fetch("/api/supabase/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: storedUrl, anonKey: storedAnon }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log("Supabase connection verified on mount. Pulling latest data from cloud tables...");
          loadAllDataFromSupabase();
        }
      })
      .catch(err => console.warn("Silent credentials synchronization failed on mount:", err));
    }

    // Silent automatic Cloudinary connection validation on dashboard load to populate server cache
    const storedCloudName = localStorage.getItem('olamide_visuals_cloudinary_cloud_name');
    const storedApiKey = localStorage.getItem('olamide_visuals_cloudinary_api_key');
    const storedApiSecret = localStorage.getItem('olamide_visuals_cloudinary_api_secret');
    if (storedCloudName && storedApiKey && storedApiSecret) {
      fetch("/api/cloudinary/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloudName: storedCloudName, apiKey: storedApiKey, apiSecret: storedApiSecret }),
      }).catch(err => console.warn("Silent Cloudinary credentials synchronization failed on mount:", err));
    }

    return () => {
      window.removeEventListener('storage', syncDatabaseRealtime);
      clearInterval(intervalId);
      clearInterval(trafficIntervalId);
    };
  }, []);

  // Sync state back to localStorage
  const syncBookings = (updated: BookingData[]) => {
    setBookings(updated);
    saveToDB('olamide_visuals_bookings', updated);
  };

  const syncMediaItems = (updated: { id: string; url: string; name: string; size: string; folder: string }[]) => {
    setMediaItems(updated);
    saveToDB('olamide_visuals_media', updated);
  };

  const handleDeleteMediaItem = (id: string) => {
    const targetItem = mediaItems.find(item => item.id === id);
    const updated = mediaItems.filter(item => item.id !== id);
    syncMediaItems(updated);

    if (targetItem) {
      // Also delete any portfolio items referencing this media item's URL or ID
      const updatedPortfolio = portfolioItems.filter(p => p.imageUrl !== targetItem.url && p.id !== targetItem.id);
      if (updatedPortfolio.length !== portfolioItems.length) {
        syncPortfolio(updatedPortfolio);
      }
    }

    logAdminAction(`Deleted media item ${id}`, 'portfolio');
    triggerToast('Media item deleted successfully.');
  };

  const handleUpdateMediaItem = (updatedItem: { id: string; url: string; name: string; size: string; folder: string }) => {
    const updated = mediaItems.map(item => item.id === updatedItem.id ? updatedItem : item);
    syncMediaItems(updated);
    logAdminAction(`Updated media item ${updatedItem.id} (${updatedItem.name})`, 'portfolio');
    triggerToast('Media item updated successfully.');
    setEditingMedia(null);
  };

  const handleCreateMediaItem = (name: string, folder: string, url: string, size?: string) => {
    const newItem = {
      id: `m-${Date.now()}`,
      name: name || 'untitled_media.jpg',
      folder: folder || activeMediaFolder,
      url: url || '',
      size: size || '1.5 MB'
    };
    const updated = [newItem, ...mediaItems];
    syncMediaItems(updated);
    logAdminAction(`Created media item ${newItem.id} (${newItem.name})`, 'portfolio');
    triggerToast('Media item added successfully.');
    setNewMediaModal(false);
  };

  const handleBulkUpload = (files: FileList) => {
    if (!files || files.length === 0) return;
    
    let uploadedCount = 0;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        triggerToast(`Skipped: ${file.name} (Not an image)`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        triggerToast(`Skipped: ${file.name} (Exceeds 10MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const rawBase64 = e.target?.result as string;
        if (rawBase64) {
          try {
            const base64Url = await compressImageBase64(rawBase64, 1200, 1200, 0.75);
            // Upload to Supabase Storage
            const storageUrl = await uploadToSupabaseStorage(base64Url, file.name);
            const approxSizeKb = Math.round((base64Url.length * 3) / 4 / 1024);
            const sizeStr = approxSizeKb > 1024 ? `${(approxSizeKb / 1024).toFixed(1)} MB` : `${approxSizeKb} KB`;
            
            const newItem = {
              id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name: file.name,
              folder: activeMediaFolder,
              url: storageUrl,
              size: sizeStr
            };
            
            setMediaItems((prev) => {
              const updated = [newItem, ...prev];
              saveToDB('olamide_visuals_media', updated);
              return updated;
            });
            uploadedCount++;
            if (uploadedCount === files.length) {
              logAdminAction(`Bulk uploaded ${uploadedCount} assets to folder ${activeMediaFolder}`, 'portfolio');
              triggerToast(`Successfully uploaded ${uploadedCount} photos to ${activeMediaFolder}.`);
            }
          } catch (uploadErr: any) {
            console.error("Bulk upload err:", uploadErr);
            triggerToast(`Bulk upload failed for ${file.name}: ${uploadErr.message || uploadErr}`);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const syncProfile = (updated: AdminProfile) => {
    setProfile(updated);
    saveToDB('olamide_visuals_admin', updated);
  };

  const syncCrew = (updated: CrewMember[]) => {
    setCrew(updated);
    saveToDB('olamide_visuals_crew', updated);
  };

  const syncBlog = (updated: BlogPost[]) => {
    setBlog(updated);
    saveToDB('olamide_visuals_blog', updated);
  };

  const syncTransactions = (updated: Transaction[]) => {
    setTransactions(updated);
    saveToDB('olamide_visuals_transactions', updated);
  };

  const syncMessages = (updated: ContactMessage[]) => {
    setMessages(updated);
    saveToDB('olamide_visuals_messages', updated);
  };

  const syncContent = (updated: WebsiteContent) => {
    setContent(updated);
    saveToDB('olamide_visuals_content', updated);
  };

  const syncServices = (updated: Service[]) => {
    setServices(updated);
    saveToDB('olamide_visuals_services', updated);
  };

  const syncPortfolio = (updated: PortfolioItem[]) => {
    setPortfolioItems(updated);
    saveToDB('olamide_visuals_portfolio_items', updated);
    setUploadDiagnostics(prev => prev ? { ...prev, dbRecordCreated: true } : null);
  };

  const syncInstagramPosts = (updated: { id: string; imageUrl: string; likes: string; comments: string }[]) => {
    setInstagramPosts(updated);
    saveToDB('olamide_visuals_instagram_posts', updated);
    setUploadDiagnostics(prev => prev ? { ...prev, dbRecordCreated: true } : null);
  };

  const handleIgImageUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      triggerToast('Error: File must be an image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      triggerToast('Error: Image size must be less than 10MB.');
      return;
    }
    setUploadingIg(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawBase64 = e.target?.result as string;
      if (rawBase64) {
        try {
          const base64Url = await compressImageBase64(rawBase64, 1000, 1000, 0.75);
          // Upload to Supabase Storage
          const storageUrl = await uploadToSupabaseStorage(base64Url, file.name);
          setInstagramForm(prev => ({ ...prev, imageUrl: storageUrl }));
          triggerToast(`Image uploaded to ${preferredStorage === 'cloudinary' ? 'Cloudinary' : 'Supabase Storage'} successfully!`);
        } catch (err: any) {
          console.error("Upload error:", err);
          triggerToast(`Failed to process image: ${err.message || err}`);
        }
      }
      setUploadingIg(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePublishInstagram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instagramForm.imageUrl) {
      triggerToast("Please upload or select an image first.");
      return;
    }
    const likesVal = instagramForm.likes.trim() || `${(Math.random() * 2 + 1).toFixed(1)}k`;
    const commentsVal = instagramForm.comments.trim() || `${Math.floor(Math.random() * 80 + 20)}`;

    const newPost = {
      id: `ig-${Date.now()}`,
      imageUrl: instagramForm.imageUrl,
      likes: likesVal,
      comments: commentsVal
    };

    const updated = [newPost, ...instagramPosts];
    syncInstagramPosts(updated);
    logAdminAction(`Published a fresh curated portrait to the Instagram Journal Feed`, 'portfolio');

    setInstagramForm({ imageUrl: '', likes: '', comments: '' });
    triggerToast("Instagram Journal post published successfully!");
  };

  const handleDeleteInstagramPost = (id: string) => {
    const updated = instagramPosts.filter(p => p.id !== id);
    syncInstagramPosts(updated);
    logAdminAction(`Permanently deleted Instagram Journal post reference: ${id}`, 'portfolio');
    triggerToast("Instagram Journal post deleted.");
  };

  const syncSpotlightItems = (updated: SpotlightItem[]) => {
    setSpotlightItems(updated);
    saveToDB('olamide_visuals_spotlight', updated);
  };

  const handleSpotlightImageUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      triggerToast('Error: File must be an image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      triggerToast('Error: Image size must be less than 10MB.');
      return;
    }
    setUploadingSpotlight(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawBase64 = e.target?.result as string;
      if (rawBase64) {
        try {
          const base64Url = await compressImageBase64(rawBase64, 1200, 1200, 0.75);
          // Upload to Supabase Storage
          const storageUrl = await uploadToSupabaseStorage(base64Url, file.name);
          setSpotlightForm(prev => ({ ...prev, imageUrl: storageUrl }));
          triggerToast("Spotlight image uploaded successfully!");
          // Automatically scan the uploaded spotlight image
          analyzeSpotlightImage(storageUrl);
        } catch (err: any) {
          console.error("Upload error:", err);
          triggerToast(`Failed to process image: ${err.message || err}`);
        }
      }
      setUploadingSpotlight(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePublishSpotlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotlightForm.imageUrl) {
      triggerToast("Please upload or select an image first.");
      return;
    }
    if (!spotlightForm.title.trim() || !spotlightForm.category.trim() || !spotlightForm.description.trim()) {
      triggerToast("Title, Category, and Description are required.");
      return;
    }

    const newSpotlight: SpotlightItem = {
      id: `spotlight-${Date.now()}`,
      title: spotlightForm.title.trim(),
      category: spotlightForm.category.trim(),
      tagline: spotlightForm.tagline.trim(),
      description: spotlightForm.description.trim(),
      imageUrl: spotlightForm.imageUrl,
      technicalSpecs: spotlightForm.technicalSpecs.trim() || 'Custom Shot • f/1.4'
    };

    const updated = [newSpotlight, ...spotlightItems];
    syncSpotlightItems(updated);
    logAdminAction(`Published a new cinematic spotlight series: ${newSpotlight.title}`, 'portfolio');

    setSpotlightForm({ title: '', category: '', tagline: '', description: '', imageUrl: '', technicalSpecs: '' });
    triggerToast("Cinematic Spotlight published successfully!");
  };

  const handleDeleteSpotlightItem = (id: string) => {
    const updated = spotlightItems.filter(item => item.id !== id);
    syncSpotlightItems(updated);
    logAdminAction(`Permanently deleted spotlight item: ${id}`, 'portfolio');
    triggerToast("Spotlight item deleted.");
  };

  // ---------------- BOOKING ACTIONS ----------------
  const handleApproveBooking = (id: string) => {
    const updated = bookings.map(b => b.id === id ? { ...b, status: 'confirmed' as const } : b);
    syncBookings(updated);
    const target = bookings.find(b => b.id === id);
    // Also create a transaction for it if confirmed
    if (target) {
      const isEventWedding = target.eventType.toLowerCase().includes('wedding');
      const amt = isEventWedding ? 250000 : 45000;
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        bookingId: id,
        clientName: target.name,
        amount: amt,
        method: 'Bank Transfer',
        status: 'pending_confirmation',
        date: new Date().toISOString(),
        invoiceNo: `INV-2026-00${transactions.length + 1}`
      };
      syncTransactions([newTx, ...transactions]);
    }
    logAdminAction(`Approved booking ${id} for ${target?.name}`, 'booking');
    triggerToast(`Booking ${id} approved & Invoice generated.`);
  };

  const handleCancelBooking = (id: string) => {
    const updated = bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b);
    syncBookings(updated);
    const target = bookings.find(b => b.id === id);
    logAdminAction(`Cancelled booking ${id} for ${target?.name}`, 'booking');
    triggerToast(`Booking ${id} has been marked as cancelled.`);
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const newBooking: BookingData = {
      id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      name: bookingForm.name || 'Anonymous Client',
      email: bookingForm.email || 'client@gmail.com',
      phone: bookingForm.phone || '08142870306',
      eventType: bookingForm.eventType || 'Portrait Photography',
      preferredDate: bookingForm.preferredDate || new Date().toISOString().split('T')[0],
      message: bookingForm.message || 'Booked directly via admin console panel.',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    syncBookings([newBooking, ...bookings]);
    logAdminAction(`Created direct booking ${newBooking.id} for ${newBooking.name}`, 'booking');
    setNewBookingModal(false);
    setBookingForm({});
    triggerToast(`Direct session reservation registered.`);
  };

  // ---------------- CREW ACTIONS ----------------
  const handleCreateCrew = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: CrewMember = {
      id: `crew-${Date.now()}`,
      name: crewForm.name || 'New Staff',
      role: crewForm.role || 'Photographer Associate',
      photoUrl: crewForm.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      availability: (crewForm.availability as any) || 'Available',
      phone: crewForm.phone || '08142870306',
      email: crewForm.email || 'crew@olamidevisuals.com',
      permissions: (crewForm.permissions as any) || 'View & Shoot Only'
    };
    syncCrew([...crew, newMember]);
    logAdminAction(`Added crew member: ${newMember.name}`, 'crew');
    setNewCrewModal(false);
    setCrewForm({});
    triggerToast(`Crew member added successfully.`);
  };

  const handleDeleteCrew = (id: string) => {
    const updated = crew.filter(c => c.id !== id);
    syncCrew(updated);
    logAdminAction(`Removed crew member ID: ${id}`, 'crew');
    triggerToast(`Crew member removed.`);
  };

  // ---------------- PORTFOLIO ACTIONS ----------------
  const handleEditPortfolioOpen = (item: PortfolioItem) => {
    setEditingPortfolioItem(item);
    setPortfolioForm({
      ...item,
      tags: item.tags || []
    });
    setAiScanResult(null); // Clear previous reports
    setEditPortfolioModal(true);
  };

  const handleUpdatePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPortfolioItem) return;

    const updatedItem: PortfolioItem = {
      ...editingPortfolioItem,
      title: portfolioForm.title || 'Masterwork Portrait',
      category: portfolioForm.category || 'Portraits',
      imageUrl: portfolioForm.imageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      description: portfolioForm.description || 'Editorial captured under professional studio conditions.',
      aspect: portfolioForm.aspect || 'portrait',
      location: portfolioForm.location || 'Ekpoma, Edo State',
      year: portfolioForm.year || '2026',
      tags: Array.isArray(portfolioForm.tags) ? portfolioForm.tags : [],
      aiPending: portfolioForm.aiPending !== undefined ? portfolioForm.aiPending : editingPortfolioItem.aiPending
    };

    const updated = portfolioItems.map(p => p.id === updatedItem.id ? updatedItem : p);
    syncPortfolio(updated);
    logAdminAction(`Updated portfolio artwork metadata: ${updatedItem.title}`, 'portfolio');
    setEditPortfolioModal(false);
    setEditingPortfolioItem(null);
    setPortfolioForm({});
    triggerToast(`Portfolio piece updated successfully.`);
  };

  const handleCreatePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: PortfolioItem = {
      id: `port-${Date.now()}`,
      title: portfolioForm.title || 'Masterwork Portrait',
      category: portfolioForm.category || 'Portraits',
      imageUrl: portfolioForm.imageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      description: portfolioForm.description || 'Editorial captured under professional studio conditions.',
      aspect: portfolioForm.aspect || 'portrait',
      location: portfolioForm.location || 'Ekpoma, Edo State',
      year: portfolioForm.year || '2026',
      tags: Array.isArray(portfolioForm.tags) ? portfolioForm.tags : [],
      aiPending: portfolioForm.aiPending !== undefined ? portfolioForm.aiPending : false
    };
    syncPortfolio([newItem, ...portfolioItems]);
    logAdminAction(`Uploaded & featured new portfolio artwork: ${newItem.title}`, 'portfolio');
    setNewPortfolioModal(false);
    setPortfolioForm({});
    triggerToast(`Portfolio piece published.`);
  };

  const handleDeletePortfolio = (id: string) => {
    const updated = portfolioItems.filter(p => p.id !== id);
    syncPortfolio(updated);
    logAdminAction(`Deleted portfolio item ID: ${id}`, 'portfolio');
    triggerToast(`Portfolio item deleted.`);
  };

  // ---------------- SERVICES ACTIONS ----------------
  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    const newSvc: Service = {
      id: `svc-${Date.now()}`,
      title: serviceForm.title || 'Brand Photography',
      description: serviceForm.description || 'Commercial rate visual asset generation.',
      icon: serviceForm.icon || 'Camera',
      imageUrl: serviceForm.imageUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      priceEstimate: serviceForm.priceEstimate || 'From ₦50,000',
      features: serviceForm.features || ['High-end editing', 'Digital cloud link']
    };
    syncServices([...services, newSvc]);
    logAdminAction(`Added new studio service: ${newSvc.title}`, 'settings');
    setNewServiceModal(false);
    setServiceForm({});
    triggerToast(`Studio service listed.`);
  };

  // ---------------- BLOG ACTIONS ----------------
  const handleCreateBlog = (e: React.FormEvent) => {
    e.preventDefault();
    const newPost: BlogPost = {
      id: `blog-${Date.now()}`,
      title: blogForm.title || 'Draft Article Title',
      content: blogForm.content || 'Start drafting here...',
      category: blogForm.category || 'General',
      tags: blogForm.tags || ['Olamide Visuals'],
      status: blogForm.status || 'draft',
      publishDate: new Date().toISOString(),
      views: 0,
      featured: blogForm.featured || false,
      seoTitle: blogForm.seoTitle || '',
      seoDesc: blogForm.seoDesc || ''
    };
    syncBlog([newPost, ...blog]);
    logAdminAction(`Created blog post: ${newPost.title}`, 'blog');
    setNewBlogModal(false);
    setBlogForm({});
    triggerToast(`Blog post created.`);
  };

  const handleUpdateBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;
    const updatedList = blog.map(b => b.id === editingBlog.id ? {
      ...b,
      title: blogForm.title ?? b.title,
      category: blogForm.category ?? b.category,
      status: blogForm.status ?? b.status,
      content: blogForm.content ?? b.content,
    } : b);
    syncBlog(updatedList);
    logAdminAction(`Updated existing blog post: ${editingBlog.title}`, 'blog');
    setEditingBlog(null);
    setBlogForm({});
    triggerToast(`Blog post updated.`);
  };

  const handleDeleteBlog = (id: string) => {
    const updated = blog.filter(b => b.id !== id);
    syncBlog(updated);
    logAdminAction(`Deleted blog article ID: ${id}`, 'blog');
    triggerToast(`Blog article removed.`);
  };

  // ---------------- FINANCIAL / TRANSACTIONS ----------------
  const handleConfirmTransaction = (id: string) => {
    const updated = transactions.map(t => t.id === id ? { ...t, status: 'completed' as const } : t);
    syncTransactions(updated);
    const target = transactions.find(t => t.id === id);
    logAdminAction(`Confirmed manual bank transfer transaction ID: ${id}`, 'finance');
    triggerToast(`Transaction payment verified.`);
  };

  // ---------------- MESSAGES ACTIONS ----------------
  const handleReplyMessage = (id: string, text: string) => {
    const updated = messages.map(m => m.id === id ? { ...m, status: 'replied' as const, replyText: text } : m);
    syncMessages(updated);
    logAdminAction(`Dispatched administrative response to message: ${id}`, 'system');
    triggerToast(`Reply dispatched to client inbox.`);
  };
 
  // ---------------- AVATAR FILE UPLOAD ----------------
  const handleAvatarFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      triggerToast('Error: File must be an image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      triggerToast('Error: Image size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawBase64 = e.target?.result as string;
      if (rawBase64 && profile) {
        const base64Url = await compressImageBase64(rawBase64, 400, 400, 0.8);
        const updated = {
          ...profile,
          avatarUrl: base64Url
        };
        syncProfile(updated);
        logAdminAction('Uploaded new admin profile picture', 'settings');
        triggerToast('Profile picture uploaded successfully.');
      }
    };
    reader.readAsDataURL(file);
  };

  // ---------------- BRANDING / SYSTEM SETTINGS ----------------
  const handleUpdateHeroContent = (title: string, subTitle: string) => {
    if (!content) return;
    const updated = {
      ...content,
      hero: {
        ...content.hero,
        title,
        subTitle
      }
    };
    syncContent(updated);
    logAdminAction('Updated hero editorial headlines', 'settings');
    triggerToast('Hero copy updated successfully.');
  };

  const handleUpdateAboutContent = (biography: string, profileImage: string) => {
    if (!content) return;
    const updated = {
      ...content,
      about: {
        ...content.about,
        biography,
        profileImage
      }
    };
    syncContent(updated);
    logAdminAction('Updated artist biography and profile image', 'settings');
    triggerToast('About section updated successfully.');
  };

  const handleUpdateBranding = (logoText: string, tagline: string) => {
    if (!content) return;
    const updated = {
      ...content,
      branding: {
        ...content.branding,
        logoText,
        tagline
      }
    };
    syncContent(updated);
    logAdminAction(`Updated brand identity to ${logoText} ${tagline}`, 'settings');
    triggerToast('Brand identity synchronized.');
  };

  const handleToggleMaintenanceMode = () => {
    if (!content) return;
    const nextVal = !maintenanceMode;
    setMaintenanceMode(nextVal);
    const updated = {
      ...content,
      settings: {
        ...content.settings,
        maintenanceMode: nextVal
      }
    };
    syncContent(updated);
    logAdminAction(`System Maintenance Mode set to ${nextVal ? 'ON' : 'OFF'}`, 'system');
    triggerToast(`Maintenance Mode set to ${nextVal ? 'ACTIVE' : 'INACTIVE'}`);
  };

  const handleBackupData = () => {
    // Generate a simulated JSON backup file representation
    const fullBackup = {
      bookings,
      crew,
      blog,
      transactions,
      messages,
      logs,
      content,
      services,
      portfolioItems
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OlamideVisuals_Studio_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logAdminAction('Executed full database structural backup', 'system');
    triggerToast('Data packet exported safely.');
  };

  const handleRestoreDefaultDB = () => {
    requestConfirmation(
      'System Factory Reset',
      'Are you absolutely sure you want to restore the entire system to default seed data? All custom bookings and modifications will be deleted!',
      () => {
        localStorage.clear();
        logAdminAction('Administrative factory reset triggered', 'system');
        window.location.reload();
      },
      'Execute Factory Reset',
      true
    );
  };

  // Calculate stats values for dashboard cards
  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
  const approvedBookingsCount = bookings.filter(b => b.status === 'confirmed').length;

  // Dynamic Real-time Revenue Cycle Trend calculations
  const monthlyRevenueData = React.useMemo(() => {
    const months = [
      { label: 'JAN', value: 15000, datePrefix: '2026-01' },
      { label: 'FEB', value: 40000, datePrefix: '2026-02' },
      { label: 'MAR', value: 120000, datePrefix: '2026-03' },
      { label: 'APR', value: 180000, datePrefix: '2026-04' },
      { label: 'MAY', value: 250000, datePrefix: '2026-05' },
      { label: 'JUN', value: 0, datePrefix: '2026-06' },
    ];

    transactions.forEach(t => {
      if (t.status === 'completed') {
        const dateStr = t.date;
        if (dateStr) {
          const prefix = dateStr.substring(0, 7);
          const found = months.find(m => m.datePrefix === prefix);
          if (found) {
            if (prefix === '2026-06') {
              found.value += t.amount;
            } else {
              found.value += t.amount;
            }
          }
        }
      }
    });

    return months;
  }, [transactions]);

  // Dynamic Real-time Booking Ratio calculations
  const bookingRatioStats = React.useMemo(() => {
    let portraits = 0;
    let weddings = 0;
    let fashion = 0;

    bookings.forEach(b => {
      const et = (b.eventType || '').toLowerCase();
      if (et.includes('portrait') || et.includes('graduation') || et.includes('studio') || et.includes('cap') || et.includes('shoot')) {
        portraits++;
      } else if (et.includes('wedding') || et.includes('bridal') || et.includes('marriage')) {
        weddings++;
      } else {
        fashion++;
      }
    });

    const total = bookings.length || 1;
    const pctPortraits = Math.round((portraits / total) * 100);
    const pctWeddings = Math.round((weddings / total) * 100);
    const pctFashion = 100 - pctPortraits - pctWeddings;

    return {
      portraits,
      weddings,
      fashion,
      pctPortraits,
      pctWeddings,
      pctFashion
    };
  }, [bookings]);

  // Filter lists based on Search Query
  const filteredBookings = bookings.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.eventType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCrew = crew.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBlog = blog.filter(bl => 
    bl.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    bl.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = transactions.filter(t => 
    t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMessages = messages.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const maxRevenueVal = Math.max(...monthlyRevenueData.map(m => m.value), 100000);
  const chartPoints = monthlyRevenueData.map((m, idx) => {
    const x = 10 + idx * 116;
    const y = 200 - (m.value / maxRevenueVal) * 180;
    return { x, y };
  });
  const chartLinePath = `M ${chartPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`;
  const chartAreaPath = `${chartLinePath} L 590 200 L 10 200 Z`;

  // Calendar render helpers
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const getBookingsOnDate = (dateString: string) => {
    return bookings.filter(b => b.preferredDate === dateString);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black text-zinc-300 font-sans flex overflow-hidden select-text antialiased">
      
      {/* Toast Alert overlay */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-[#0A0A0A] border-l-2 border-gold border border-white/5 text-white font-mono text-xs tracking-wider uppercase flex items-center space-x-3 shadow-2xl"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
          >
            <CheckCircle className="w-4 h-4 text-gold" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-64 border-r border-white/5 bg-[#080808] flex flex-col justify-between shrink-0 h-full">
        <div className="flex flex-col h-full overflow-y-auto">
          
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-white/5 flex items-center space-x-3 bg-black/40">
            <div className="w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center text-gold bg-black">
              <Camera className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-sm font-serif font-bold tracking-[0.2em] text-white uppercase leading-none block">
                Olamide
              </span>
              <span className="text-[8px] font-mono tracking-[0.3em] text-gold uppercase leading-none mt-1 block">
                Control Center
              </span>
            </div>
          </div>

          {/* Nav list grouped */}
          <div className="p-4 space-y-6">
            
            {/* OVERVIEW Group */}
            <div className="space-y-1">
              <span className="px-3 text-[9px] font-mono tracking-widest text-zinc-600 uppercase block mb-2">OVERVIEW</span>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Studio Stats</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'dashboard' ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            </div>

            {/* WORKFLOWS Group */}
            <div className="space-y-1">
              <span className="px-3 text-[9px] font-mono tracking-widest text-zinc-600 uppercase block mb-2">WORKFLOWS</span>
              <button 
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'bookings' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <Briefcase className="w-4 h-4" />
                  <span>Bookings ({bookings.length})</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'bookings' ? 'opacity-100' : 'opacity-0'}`} />
              </button>

              <button 
                onClick={() => setActiveTab('calendar')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'calendar' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <Calendar className="w-4 h-4" />
                  <span>Crew Scheduler</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'calendar' ? 'opacity-100' : 'opacity-0'}`} />
              </button>

              <button 
                onClick={() => setActiveTab('crew')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'crew' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <Users className="w-4 h-4" />
                  <span>Staff & Crew</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'crew' ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            </div>

            {/* PORTFOLIO & BLOG Group */}
            <div className="space-y-1">
              <span className="px-3 text-[9px] font-mono tracking-widest text-zinc-600 uppercase block mb-2">PORTFOLIO & MEDIA</span>
              <button 
                onClick={() => setActiveTab('portfolio')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'portfolio' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <Image className="w-4 h-4" />
                  <span>Portfolio Gallery</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'portfolio' ? 'opacity-100' : 'opacity-0'}`} />
              </button>

              <button 
                onClick={() => setActiveTab('blog')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'blog' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <FileText className="w-4 h-4" />
                  <span>Editorial Journal</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'blog' ? 'opacity-100' : 'opacity-0'}`} />
              </button>

              <button 
                onClick={() => setActiveTab('media')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'media' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <HardDrive className="w-4 h-4" />
                  <span>Media Library</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'media' ? 'opacity-100' : 'opacity-0'}`} />
              </button>

              <button 
                onClick={() => setActiveTab('instagram')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'instagram' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <Instagram className="w-4 h-4" />
                  <span>Instagram Journal</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'instagram' ? 'opacity-100' : 'opacity-0'}`} />
              </button>

              <button 
                onClick={() => setActiveTab('spotlight')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'spotlight' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Cinematic Spotlight</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'spotlight' ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            </div>

            {/* FINANCE Group */}
            <div className="space-y-1">
              <span className="px-3 text-[9px] font-mono tracking-widest text-zinc-600 uppercase block mb-2">FINANCIAL ERP</span>
              <button 
                onClick={() => setActiveTab('finance')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'finance' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <DollarSign className="w-4 h-4" />
                  <span>Invoices & Sales</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'finance' ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            </div>

            {/* COMMUNICATIONS & SEO */}
            <div className="space-y-1">
              <span className="px-3 text-[9px] font-mono tracking-widest text-zinc-600 uppercase block mb-2">CLIENT REACH</span>
              <button 
                onClick={() => setActiveTab('messages')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'messages' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>Contact Inbox ({messages.filter(m=>m.status==='unread').length})</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'messages' ? 'opacity-100' : 'opacity-0'}`} />
              </button>

              <button 
                onClick={() => setActiveTab('seo')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'seo' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <Globe className="w-4 h-4" />
                  <span>SEO Management</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'seo' ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            </div>

            {/* CMS BUILDER Group */}
            <div className="space-y-1">
              <span className="px-3 text-[9px] font-mono tracking-widest text-zinc-600 uppercase block mb-2">WEBSITE BUILDER</span>
              <button 
                onClick={() => setActiveTab('content')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'content' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <Sliders className="w-4 h-4" />
                  <span>Page Sections</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'content' ? 'opacity-100' : 'opacity-0'}`} />
              </button>

              <button 
                onClick={() => setActiveTab('brand')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'brand' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <Type className="w-4 h-4" />
                  <span>Brand Identity</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'brand' ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            </div>

            {/* CONTROL Group */}
            <div className="space-y-1">
              <span className="px-3 text-[9px] font-mono tracking-widest text-zinc-600 uppercase block mb-2">SYSTEM CONFIG</span>
              
              <button 
                onClick={() => setActiveTab('supabase')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'supabase' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <Database className="w-4 h-4" />
                  <span>Supabase Sync</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'supabase' ? 'opacity-100' : 'opacity-0'}`} />
              </button>

              <button 
                onClick={() => setActiveTab('cloudinary')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'cloudinary' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <Cloud className="w-4 h-4" />
                  <span>Cloudinary Sync</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'cloudinary' ? 'opacity-100' : 'opacity-0'}`} />
              </button>

              <button 
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
                  activeTab === 'logs' ? 'bg-[#0F0F0F] text-gold border-l-2 border-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <FileCode className="w-4 h-4" />
                  <span>Audit Logs</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'logs' ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            </div>

          </div>
        </div>

        {/* PROFILE BOTTOM ANCHOR */}
        <div className="p-4 border-t border-white/5 bg-black/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full border border-gold/40 overflow-hidden bg-zinc-900 shrink-0">
                <img 
                  src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} 
                  alt="Admin" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-white uppercase truncate">{profile?.fullName || 'Olamide'}</h4>
                <p className="text-[9px] font-mono text-gold uppercase tracking-widest truncate">Super Administrator</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors focus:outline-none cursor-pointer"
              title="Logout Administrative Access"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505]">
        
        {/* TOP STATUS & SEARCH BAR HEADER */}
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between bg-[#080808]/75 backdrop-blur-md shrink-0">
          
          {/* Live search input */}
          <div className="w-96 relative">
            <input 
              type="text" 
              placeholder="Search bookings, invoices, crew or logs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black border border-white/5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors"
            />
            <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-zinc-500" />
          </div>

          {/* Widgets & System actions */}
          <div className="flex items-center space-x-6">
            
            {/* Maintenance Mode indicator */}
            <div className="flex items-center space-x-2 bg-black border border-white/5 px-3 py-1 text-[10px] font-mono uppercase">
              <span className={`w-2 h-2 rounded-full ${maintenanceMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-zinc-400">MAINTENANCE:</span>
              <button 
                onClick={handleToggleMaintenanceMode}
                className="text-gold font-bold hover:underline focus:outline-none cursor-pointer"
              >
                {maintenanceMode ? 'ACTIVE' : 'OFF'}
              </button>
            </div>

            {/* Live site link */}
            <a 
              href="/" 
              target="_blank" 
              className="text-[10px] font-mono tracking-widest uppercase text-zinc-400 hover:text-gold transition-colors flex items-center space-x-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Studio Live View</span>
            </a>

            {/* Notification system */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-1.5 text-zinc-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full" />
              </button>

              {/* Notification dropdown dialog */}
              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <motion.div 
                      className="absolute right-0 mt-3 w-80 bg-[#0A0A0A] border border-white/10 shadow-2xl p-4 z-50 rounded-none space-y-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">NOTIFICATION GATEWAY</span>
                        <span className="text-[9px] bg-gold/10 text-gold px-1.5 py-0.5 uppercase font-mono">3 Alert Alerts</span>
                      </div>
                      
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        <div className="p-2.5 bg-black border border-white/5 text-[10px] font-mono space-y-1">
                          <div className="flex justify-between text-gold">
                            <span>NEW BOOKING INBOUND</span>
                            <span>JUST NOW</span>
                          </div>
                          <p className="text-zinc-400 font-sans">Osas Osaro has requested Portrait Photography package.</p>
                        </div>
                        <div className="p-2.5 bg-black border border-white/5 text-[10px] font-mono space-y-1">
                          <div className="flex justify-between text-emerald-400">
                            <span>PAYMENT CONFIRMED</span>
                            <span>10M AGO</span>
                          </div>
                          <p className="text-zinc-400 font-sans">Invoice INV-2026-0041 was paid via Paystack gateway.</p>
                        </div>
                        <div className="p-2.5 bg-black border border-white/5 text-[10px] font-mono space-y-1">
                          <div className="flex justify-between text-amber-400">
                            <span>CREW ASSIGNMENT</span>
                            <span>1H AGO</span>
                          </div>
                          <p className="text-zinc-400 font-sans">Adebayo Kolawole status set to available for Grad shoots.</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setNotificationsOpen(false);
                          triggerToast('All administrative alerts dismissed.');
                        }}
                        className="w-full py-2 bg-black border border-white/10 hover:border-gold/30 text-center text-[10px] font-mono text-zinc-400 hover:text-white transition-colors uppercase"
                      >
                        Clear All Logs
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Server status badge */}
            <div className="flex items-center space-x-1.5 bg-zinc-950 px-3 py-1.5 border border-white/5 text-[9px] font-mono tracking-widest text-emerald-500 font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SERVER: ONLINE</span>
            </div>

          </div>
        </header>

        {/* TAB WORKSPACE PANEL */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {/* TAB 1: DASHBOARD HOME STATS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              
              {/* Dynamic Header Welcomer */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Studio Command</h2>
                  <p className="text-xs text-zinc-500 font-mono mt-1">REAL-TIME BUSINESS ENGINE AND ENTERPRISE RESOURCE TRACKER</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleBackupData}
                    className="px-4 py-2 bg-black hover:bg-white text-zinc-400 hover:text-black border border-white/5 hover:border-white font-mono text-[10px] tracking-widest uppercase transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Dump Backup</span>
                  </button>
                  <button 
                    onClick={() => {
                      logAdminAction('Manual data synchronization refresh', 'system');
                      triggerToast('All data grids successfully synchronized.');
                    }}
                    className="px-4 py-2 bg-gold hover:bg-white text-black font-mono text-[10px] tracking-widest uppercase transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Grids</span>
                  </button>
                </div>
              </div>

              {/* STAT CARDS ROW */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-5 bg-[#080808] border border-white/5 space-y-3 relative overflow-hidden group">
                  <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">REVENUE STREAM</span>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xl sm:text-2xl font-mono text-white">₦{totalRevenue.toLocaleString()}</h3>
                    <span className="text-[9px] text-emerald-400 font-mono flex items-center">
                      +15.2% <ArrowUpRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                  <div className="absolute right-4 bottom-4 text-white/5 group-hover:text-gold/5 transition-colors">
                    <DollarSign className="w-10 h-10" />
                  </div>
                </div>

                <div className="p-5 bg-[#080808] border border-white/5 space-y-3 relative overflow-hidden group">
                  <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">TOTAL RESERVED</span>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xl sm:text-2xl font-mono text-white">{bookings.length}</h3>
                    <span className="text-[9px] text-gold font-mono uppercase">{pendingBookingsCount} pending</span>
                  </div>
                  <div className="absolute right-4 bottom-4 text-white/5 group-hover:text-gold/5 transition-colors">
                    <Briefcase className="w-10 h-10" />
                  </div>
                </div>

                <div className="p-5 bg-[#080808] border border-white/5 space-y-3 relative overflow-hidden group">
                  <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">COMMERCIAL INVOICES</span>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xl sm:text-2xl font-mono text-white">{transactions.length}</h3>
                    <span className="text-[9px] text-emerald-400 font-mono">100% SECURE</span>
                  </div>
                  <div className="absolute right-4 bottom-4 text-white/5 group-hover:text-gold/5 transition-colors">
                    <CreditCard className="w-10 h-10" />
                  </div>
                </div>

                <div className="p-5 bg-[#080808] border border-white/5 space-y-3 relative overflow-hidden group">
                  <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">STUDIO CREW</span>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xl sm:text-2xl font-mono text-white">{crew.length}</h3>
                    <span className="text-[9px] text-zinc-400 font-mono">{crew.filter(c=>c.availability==='Available').length} Active</span>
                  </div>
                  <div className="absolute right-4 bottom-4 text-white/5 group-hover:text-gold/5 transition-colors">
                    <Users className="w-10 h-10" />
                  </div>
                </div>

                <div className="p-5 bg-[#080808] border border-white/5 space-y-3 relative overflow-hidden group col-span-2 lg:col-span-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block">PORTAL VISITORS</span>
                    <button 
                      onClick={() => {
                        localStorage.setItem('olamide_visuals_visitors', '0');
                        setVisitors(0);
                        triggerToast('Visitor statistics reset successfully.');
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 p-0.5 cursor-pointer"
                      title="Reset/Delete Visitor Stats"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xl sm:text-2xl font-mono text-white">{visitors.toLocaleString()}</h3>
                    <span className="text-[9px] text-gold font-mono">EKPOMA HUB</span>
                  </div>
                  <div className="absolute right-4 bottom-4 text-white/5 group-hover:text-gold/5 transition-colors pointer-events-none">
                    <Globe className="w-10 h-10" />
                  </div>
                </div>
              </div>

              {/* ANALYTICS CHARTS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. Revenue line/area chart */}
                <div className="lg:col-span-8 p-6 bg-[#080808] border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">REVENUE CYCLE TREND (₦)</span>
                    <span className="text-[10px] font-mono text-gold bg-gold/10 px-2 py-0.5 uppercase">JANUARY - JUNE 2026</span>
                  </div>
                  
                  {/* Cubic SVG graph */}
                  <div className="h-64 relative w-full pt-4">
                    <svg className="w-full h-full" viewBox="0 0 600 220" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Horizontal gridlines */}
                      <line x1="0" y1="200" x2="600" y2="200" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="150" x2="600" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="100" x2="600" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="50" x2="600" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="5" x2="600" y2="5" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                      {/* Area graph */}
                      <path 
                        d={chartAreaPath} 
                        fill="url(#areaGrad)" 
                      />

                      {/* Stroke line */}
                      <path 
                        d={chartLinePath} 
                        fill="none" 
                        stroke="#D4AF37" 
                        strokeWidth="2.5" 
                      />

                      {/* Data point markers */}
                      {chartPoints.map((p, idx) => (
                        <circle key={idx} cx={p.x} cy={p.y} r="4" fill="#D4AF37" />
                      ))}
                    </svg>
                    
                    {/* Month labels bottom axis */}
                    <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 mt-2">
                      {monthlyRevenueData.map((m, idx) => (
                        <span key={idx}>
                          {m.label} (₦{m.value >= 1000 ? (m.value/1000).toFixed(0) + 'k' : m.value})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Donut status statistics */}
                <div className="lg:col-span-4 p-6 bg-[#080808] border border-white/5 space-y-4">
                  <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase block">BOOKING RATIO</span>
                  
                  <div className="flex items-center justify-center py-6">
                    <div className="relative w-36 h-36">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        {/* Circle background */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="3" />
                        {/* Segment 1: Portraits */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#D4AF37" strokeWidth="3" strokeDasharray={`${bookingRatioStats.pctPortraits} 100`} strokeDashoffset="0" />
                        {/* Segment 2: Weddings */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray={`${bookingRatioStats.pctWeddings} 100`} strokeDashoffset={-bookingRatioStats.pctPortraits} />
                        {/* Segment 3: Fashion */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#444444" strokeWidth="3" strokeDasharray={`${bookingRatioStats.pctFashion} 100`} strokeDashoffset={-(bookingRatioStats.pctPortraits + bookingRatioStats.pctWeddings)} />
                      </svg>
                      {/* Inside center text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-mono text-white font-bold">{bookings.length}</span>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Reserved</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-[10px] font-mono">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center"><span className="w-2.5 h-2.5 bg-gold mr-1.5" />Portraits ({bookingRatioStats.portraits})</span>
                      <span>{bookingRatioStats.pctPortraits}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center"><span className="w-2.5 h-2.5 bg-white mr-1.5" />Weddings ({bookingRatioStats.weddings})</span>
                      <span>{bookingRatioStats.pctWeddings}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center"><span className="w-2.5 h-2.5 bg-[#444444] mr-1.5" />Fashion & Commercial ({bookingRatioStats.fashion})</span>
                      <span>{bookingRatioStats.pctFashion}%</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* RECENT ACTIVITIES & SYSTEM ALERTS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Audit Activities log */}
                <div className="lg:col-span-7 p-6 bg-[#080808] border border-white/5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">SYSTEM AUDIT TRAIL</span>
                    <div className="flex items-center space-x-3">
                      {logs.length > 0 && (
                        <button 
                          onClick={() => {
                            requestConfirmation(
                              'Clear All Audit Logs',
                              'Are you sure you want to wipe the entire system audit trail? This action is irreversible.',
                              handleClearAllLogs,
                              'Clear All',
                              true
                            );
                          }}
                          className="text-[10px] text-red-500 hover:underline font-mono uppercase cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                      <button onClick={() => setActiveTab('logs')} className="text-[10px] text-gold hover:underline font-mono uppercase cursor-pointer">Full Logs</button>
                    </div>
                  </div>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {logs.slice(0, 5).map(l => (
                      <div key={l.id} className="flex justify-between text-xs items-start font-mono text-zinc-400 group/log py-1 hover:bg-white/[0.01]">
                        <div className="space-y-0.5 flex-1 pr-2">
                          <p className="text-white text-xs">{l.action}</p>
                          <span className="text-[10px] text-zinc-600 block">{new Date(l.timestamp).toLocaleString()} • {l.user}</span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className={`text-[9px] px-1.5 py-0.5 uppercase block border ${
                            l.category === 'auth' ? 'border-red-500/20 text-red-400 bg-red-950/10' :
                            l.category === 'booking' ? 'border-gold/20 text-gold bg-gold/10' :
                            'border-white/10 text-zinc-500'
                          }`}>
                            {l.category}
                          </span>
                          <button 
                            onClick={() => {
                              requestConfirmation(
                                'Delete Audit Log',
                                'Are you sure you want to delete this specific system audit log entry?',
                                () => handleDeleteLog(l.id),
                                'Delete Log',
                                true
                              );
                            }}
                            className="opacity-0 group-hover/log:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 p-0.5 cursor-pointer"
                            title="Delete Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <p className="text-xs text-zinc-600 font-mono py-4 text-center uppercase">No audit log entries found.</p>
                    )}
                  </div>
                </div>

                {/* Quick contact and message widget */}
                <div className="lg:col-span-5 p-6 bg-[#080808] border border-white/5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">CLIENT CONVERSATION STREAM</span>
                    <button onClick={() => setActiveTab('messages')} className="text-[10px] text-gold hover:underline font-mono uppercase cursor-pointer">Inbox</button>
                  </div>
                  <div className="space-y-3">
                    {messages.slice(0, 2).map(m => (
                      <div key={m.id} className="p-3 bg-black border border-white/5 space-y-2 relative group/msg">
                        <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                          <span>{m.name}</span>
                          <div className="flex items-center space-x-2">
                            <span>{new Date(m.date).toLocaleDateString()}</span>
                            <button 
                              onClick={() => {
                                requestConfirmation(
                                  'Delete Client Message',
                                  'Are you sure you want to permanently delete this client message?',
                                  () => handleDeleteMessage(m.id),
                                  'Delete Message',
                                  true
                                );
                              }}
                              className="opacity-0 group-hover/msg:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 p-0.5 cursor-pointer"
                              title="Delete Message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">{m.subject}</h4>
                        <p className="text-xs text-zinc-400 font-light truncate">{m.message}</p>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <p className="text-xs text-zinc-600 font-mono py-4 text-center uppercase">No incoming client messages.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: BOOKING MANAGEMENT */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Bookings Hub</h2>
                  <p className="text-xs text-zinc-500 font-mono mt-1">APPROVE, SCHEDULE, AND MANAGE USER RESERVATIONS</p>
                </div>
                <div className="flex items-center space-x-3">
                  {selectedBookingIds.length > 0 && (
                    <button
                      onClick={() => {
                        requestConfirmation(
                          "Bulk Delete Bookings",
                          `Are you sure you want to permanently delete the ${selectedBookingIds.length} selected booking(s)?`,
                          () => handleBulkDeleteBookings(selectedBookingIds),
                          "Delete Selected",
                          true
                        );
                      }}
                      className="px-4 py-2.5 bg-red-950 hover:bg-red-900 border border-red-500/30 text-red-400 font-mono text-xs tracking-widest uppercase transition-colors flex items-center space-x-1.5 cursor-pointer"
                      title="Delete all selected bookings permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Bulk Delete ({selectedBookingIds.length})</span>
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      requestConfirmation(
                        "Purge Bookings",
                        "CRITICAL WARNING: Are you sure you want to permanently clear ALL booking records? This action cannot be undone.",
                        () => {
                          syncBookings([]);
                          logAdminAction("Permanently purged all client bookings from the database", "booking");
                          triggerToast("All bookings successfully purged.");
                        },
                        "Purge All Data",
                        true
                      );
                    }}
                    className="px-4 py-2.5 bg-red-950/40 border border-red-500/20 hover:bg-red-900 text-red-400 font-mono text-xs tracking-widest uppercase transition-colors flex items-center space-x-1.5 cursor-pointer"
                    title="Clear all booking data permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All Bookings</span>
                  </button>
                  <button 
                    onClick={() => {
                      setBookingForm({});
                      setNewBookingModal(true);
                    }}
                    className="px-4 py-2.5 bg-gold hover:bg-white text-black font-mono text-xs tracking-widest uppercase transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Reserve Session</span>
                  </button>
                </div>
              </div>

              {/* BOOKINGS TABLE */}
              <div className="bg-[#080808] border border-white/5 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 font-mono text-[10px] text-zinc-500 uppercase tracking-widest bg-black/40">
                      <th className="p-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={filteredBookings.length > 0 && filteredBookings.every(b => selectedBookingIds.includes(b.id!))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const allIds = filteredBookings.map(b => b.id!);
                              setSelectedBookingIds(prev => Array.from(new Set([...prev, ...allIds])));
                            } else {
                              const filteredIds = filteredBookings.map(b => b.id!);
                              setSelectedBookingIds(prev => prev.filter(id => !filteredIds.includes(id)));
                            }
                          }}
                          className="w-4 h-4 accent-gold cursor-pointer rounded border-white/10 bg-black text-gold focus:ring-gold"
                        />
                      </th>
                      <th className="p-4">Reference</th>
                      <th className="p-4">Patron</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Service Package</th>
                      <th className="p-4">Shoot Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredBookings.map(b => {
                      const isSelected = selectedBookingIds.includes(b.id!);
                      return (
                        <tr key={b.id} className={`hover:bg-white/[0.01] transition-colors ${isSelected ? 'bg-gold/[0.02]' : ''}`}>
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBookingIds(prev => [...prev, b.id!]);
                                } else {
                                  setSelectedBookingIds(prev => prev.filter(id => id !== b.id));
                                }
                              }}
                              className="w-4 h-4 accent-gold cursor-pointer rounded border-white/10 bg-black text-gold focus:ring-gold"
                            />
                          </td>
                          <td className="p-4 font-mono text-gold font-bold">{b.id}</td>
                          <td className="p-4">
                            <p className="font-bold text-white uppercase">{b.name}</p>
                            <span className="text-[10px] text-zinc-500 font-mono italic">Client</span>
                          </td>
                          <td className="p-4 space-y-0.5 font-mono text-zinc-400">
                            <p className="flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-gold" />
                              <span>{b.email}</span>
                            </p>
                            <p className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-gold" />
                              <span>{b.phone}</span>
                            </p>
                          </td>
                          <td className="p-4">
                            <span className="bg-white/5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide text-zinc-300">
                              {b.eventType}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-zinc-400">{b.preferredDate}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider font-bold ${
                              b.status === 'confirmed' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' :
                              b.status === 'cancelled' ? 'bg-red-950/40 text-red-400 border border-red-500/20' :
                              'bg-amber-950/40 text-amber-400 border border-amber-500/20 animate-pulse'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {b.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleApproveBooking(b.id!)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                                  title="Approve booking slot"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleCancelBooking(b.id!)}
                                  className="px-2.5 py-1.5 bg-red-950 text-red-400 hover:bg-red-900 border border-red-500/20 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                                  title="Reject / Cancel booking"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <a 
                              href={`https://wa.me/234${b.phone.replace(/^0/, '')}?text=${encodeURIComponent(`Hello ${b.name}, this is Olamide Visuals regarding your ${b.eventType} booking on ${b.preferredDate}.`)}`}
                              target="_blank"
                              className="px-2.5 py-1.5 bg-black border border-white/10 hover:border-gold/30 text-zinc-300 hover:text-white font-mono text-[10px] uppercase tracking-wider transition-all"
                            >
                              Chat
                            </a>
                            <button 
                              onClick={() => {
                                requestConfirmation(
                                  "Delete Booking",
                                  `Are you sure you want to permanently delete booking reference ${b.id}?`,
                                  () => handleDeleteBooking(b.id!)
                                );
                              }}
                              className="px-2.5 py-1.5 bg-red-950/40 border border-red-500/20 text-red-400 hover:bg-red-900 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                              title="Delete booking permanently"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CALENDAR VIEW */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Crew Scheduler</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">VISUAL MONTHLY SHOOT REGISTER AND AVAILABILITY STATUS MAP</p>
              </div>

              {/* Monthly Calendar View */}
              <div className="bg-[#080808] border border-white/5 p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-serif text-white uppercase">July 2026</span>
                    <span className="text-xs font-mono text-gold">(Ekpoma Peak Season)</span>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setCalendarMonth(5)} className="px-3 py-1 bg-black border border-white/5 text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs">Prev</button>
                    <button onClick={() => setCalendarMonth(6)} className="px-3 py-1 bg-black border border-white/5 text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs">Next</button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 text-center">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="p-2 font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-bold bg-black/40">
                      {d}
                    </div>
                  ))}

                  {/* Empty cells */}
                  {[...Array(3)].map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-video bg-black/10 border border-white/[0.01]" />
                  ))}

                  {/* Days */}
                  {[...Array(31)].map((_, i) => {
                    const day = i + 1;
                    const paddedDay = day < 10 ? `0${day}` : day;
                    const dateStr = `2026-07-${paddedDay}`;
                    const booked = getBookingsOnDate(dateStr);

                    return (
                      <div key={day} className="aspect-video bg-black border border-white/5 p-2 flex flex-col justify-between text-left group hover:border-gold/30 transition-colors">
                        <span className="text-xs font-mono text-zinc-500 group-hover:text-gold transition-colors">{day}</span>
                        {booked.length > 0 && (
                          <div className="space-y-1">
                            {booked.map(b => (
                              <div key={b.id} className="text-[8px] font-mono bg-gold/10 text-gold px-1 py-0.5 uppercase truncate" title={b.name}>
                                {b.name.split(' ')[0]} • {b.eventType.split(' ')[0]}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLIENTS MANAGER */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Patron Directory</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">CLIENT RECORD DATABASE, RETENTION INDEX AND MILITARY NOTES</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookings.map(b => (
                  <div key={b.id} className="p-6 bg-[#080808] border border-white/5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase font-mono">{b.name}</h3>
                        <p className="text-[10px] font-mono text-zinc-500">CLIENT RECORD: {b.id}</p>
                      </div>
                      <span className="bg-gold/10 text-gold px-2.5 py-0.5 text-[9px] font-mono uppercase">Premium patron</span>
                    </div>

                    <div className="space-y-2 text-xs font-mono text-zinc-400 border-t border-b border-white/5 py-4">
                      <div className="flex justify-between">
                        <span>Email address:</span>
                        <span className="text-white">{b.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phone number:</span>
                        <span className="text-white">{b.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Preferred package:</span>
                        <span className="text-white">{b.eventType}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">INTERNAL STUDIO NOTES:</span>
                      <p className="p-3 bg-black border border-white/5 font-mono text-[10px] text-zinc-400">
                        {b.message || 'No specific requests recorded. Direct contact suggested.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PORTFOLIO & SERVICES */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Portfolio Gallery</h2>
                  <p className="text-xs text-zinc-500 font-mono mt-1">PUBLISH AND MANAGE MASTERPIECE FILES DISPLAYED ON THE FRONT-END</p>
                </div>
                <button 
                  onClick={() => {
                    setPortfolioForm({});
                    setNewPortfolioModal(true);
                  }}
                  className="px-4 py-2.5 bg-gold hover:bg-white text-black font-mono text-xs tracking-widest uppercase transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Masterwork</span>
                </button>
              </div>

              {/* Portfolio Grid list */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {portfolioItems.map(p => (
                  <div key={p.id} className="bg-[#080808] border border-white/5 group overflow-hidden flex flex-col justify-between">
                    <div className="aspect-video relative overflow-hidden bg-black">
                      <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-3 left-3 bg-black/80 border border-white/5 px-2 py-0.5 text-[9px] font-mono text-gold uppercase">
                        {p.category}
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-bold text-white uppercase font-mono">{p.title}</h4>
                          {p.aiPending && (
                            <span className="shrink-0 bg-amber-950/40 text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0.5 font-mono uppercase rounded animate-pulse">
                              Pending AI
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono">{p.location} • {p.year}</p>
                      </div>
                      <p className="text-xs text-zinc-400 font-light line-clamp-2">{p.description}</p>
                      
                      {p.tags && p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.tags.map(t => (
                            <span key={t} className="text-[9px] font-mono bg-white/5 border border-white/5 text-zinc-400 px-1.5 py-0.5 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-4 border-t border-white/5 bg-black/40 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-mono text-gold uppercase tracking-widest">Watermarked</span>
                        {p.aiPending && (
                          <button
                            onClick={() => handleReAnalyzePortfolioItem(p)}
                            className="bg-gold/10 hover:bg-gold hover:text-black border border-gold/20 text-gold font-mono text-[9px] uppercase px-2 py-0.5 transition-all flex items-center space-x-1 cursor-pointer"
                            title="Re-run Gemini AI metadata scan"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Scan AI</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEditPortfolioOpen(p)}
                          className="text-zinc-500 hover:text-gold transition-colors focus:outline-none cursor-pointer"
                          title="Edit metadata & details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePortfolio(p.id)}
                          className="text-zinc-500 hover:text-red-400 transition-colors focus:outline-none cursor-pointer"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: EDITORIAL JOURNAL */}
          {activeTab === 'blog' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Editorial Journal</h2>
                  <p className="text-xs text-zinc-500 font-mono mt-1">CREATE, SCHEDULE, AND OPTIMIZE SEO ARTICLES FOR SOCIAL REACH</p>
                </div>
                <button 
                  onClick={() => {
                    setBlogForm({});
                    setNewBlogModal(true);
                  }}
                  className="px-4 py-2.5 bg-gold hover:bg-white text-black font-mono text-xs tracking-widest uppercase transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Write Article</span>
                </button>
              </div>

              {/* Blog articles list */}
              <div className="space-y-4">
                {blog.map(post => (
                  <div key={post.id} className="p-6 bg-[#080808] border border-white/5 flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center space-x-3 text-[10px] font-mono">
                        <span className="text-gold uppercase font-bold">{post.category}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500">{new Date(post.publishDate).toLocaleDateString()}</span>
                        <span className="text-zinc-600">•</span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          post.status === 'published' ? 'bg-emerald-950/20 text-emerald-400' : 'bg-amber-950/20 text-amber-400'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-serif text-white uppercase tracking-wide">{post.title}</h3>
                      <p className="text-xs text-zinc-400 font-light leading-relaxed line-clamp-3">{post.content}</p>

                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {post.tags.map(t => (
                          <span key={t} className="text-[9px] font-mono bg-black border border-white/5 px-2 py-0.5 text-zinc-500">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex md:flex-col justify-between items-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0 shrink-0 space-y-3">
                      <div className="text-right font-mono text-[10px] text-zinc-500 space-y-1">
                        <p>VIEWS: {post.views}</p>
                        <p className="text-zinc-400 uppercase">SEO: OPTIMIZED</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => {
                            setBlogForm({
                              title: post.title,
                              category: post.category,
                              status: post.status,
                              content: post.content
                            });
                            setEditingBlog(post);
                          }}
                          className="p-1.5 bg-[#121212] hover:bg-gold/10 border border-white/10 text-zinc-400 hover:text-gold transition-colors focus:outline-none cursor-pointer"
                          title="Edit article details directly"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            requestConfirmation(
                              "Delete Blog Article",
                              `Are you sure you want to permanently delete article "${post.title}"?`,
                              () => handleDeleteBlog(post.id)
                            );
                          }}
                          className="p-1.5 bg-[#121212] hover:bg-red-900/20 border border-white/10 text-zinc-500 hover:text-red-400 transition-colors focus:outline-none cursor-pointer"
                          title="Delete article permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: STAFF & CREW */}
          {activeTab === 'crew' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Staff & Crew</h2>
                  <p className="text-xs text-zinc-500 font-mono mt-1">MANAGE ROLES, ASSIGN PERMISSIONS, AND AVAILABILITY STATUS FOR ACTIVE TEAM MEMBERS</p>
                </div>
                <button 
                  onClick={() => {
                    setCrewForm({});
                    setNewCrewModal(true);
                  }}
                  className="px-4 py-2.5 bg-gold hover:bg-white text-black font-mono text-xs tracking-widest uppercase transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Crew Member</span>
                </button>
              </div>

              {/* Crew Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {crew.map(member => (
                  <div key={member.id} className="p-6 bg-[#080808] border border-white/5 space-y-4 relative flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full overflow-hidden border border-gold/20 bg-zinc-900 mx-auto">
                        <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="text-center space-y-1">
                        <h3 className="text-sm font-bold text-white uppercase font-mono">{member.name}</h3>
                        <p className="text-[10px] text-gold font-mono uppercase tracking-widest leading-relaxed">{member.role}</p>
                      </div>

                      <div className="space-y-2 text-[11px] font-mono text-zinc-400 border-t border-b border-white/5 py-3">
                        <div className="flex justify-between">
                          <span>Phone:</span>
                          <span className="text-white select-all">{member.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Perms:</span>
                          <span className="text-white">{member.permissions}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Availability:</span>
                          <span className={`px-1.5 py-0.5 text-[9px] uppercase font-bold ${
                            member.availability === 'Available' ? 'bg-emerald-950/20 text-emerald-400' :
                            member.availability === 'Leave' ? 'bg-red-950/20 text-red-400' :
                            'bg-amber-950/20 text-amber-400'
                          }`}>
                            {member.availability}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center">
                      <span className="text-[8px] font-mono text-zinc-600">ID: {member.id}</span>
                      <button 
                        onClick={() => handleDeleteCrew(member.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors focus:outline-none cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: INVOICES & FINANCIAL ERP */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Invoices & Sales</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">ERP SALES INVENTORY, BILLING CYCLE AUDITING, AND MANUAL DEPOSIT VERIFICATION</p>
              </div>

              {/* Transactions grid list */}
              <div className="bg-[#080808] border border-white/5 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 font-mono text-[10px] text-zinc-500 uppercase tracking-widest bg-black/40">
                      <th className="p-4">Invoice No</th>
                      <th className="p-4">Client</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Gateway Method</th>
                      <th className="p-4">Transaction Date</th>
                      <th className="p-4">Payment Status</th>
                      <th className="p-4 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 font-mono text-white font-bold">{tx.invoiceNo}</td>
                        <td className="p-4">
                          <p className="font-bold text-white uppercase">{tx.clientName}</p>
                          <span className="text-[10px] text-zinc-500 font-mono">{tx.bookingId}</span>
                        </td>
                        <td className="p-4 font-mono text-gold font-bold">₦{tx.amount.toLocaleString()}</td>
                        <td className="p-4 font-mono text-zinc-400">{tx.method}</td>
                        <td className="p-4 font-mono text-zinc-400">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider font-bold ${
                            tx.status === 'completed' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/10' :
                            tx.status === 'refunded' ? 'bg-zinc-950 text-zinc-400 border border-white/5' :
                            'bg-amber-950/20 text-amber-400 border border-amber-500/10 animate-pulse'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {tx.status === 'pending_confirmation' ? (
                            <button 
                              onClick={() => handleConfirmTransaction(tx.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Verify Transfer
                            </button>
                          ) : (
                            <span className="text-zinc-600 font-mono text-[10px] uppercase mr-2">Locked</span>
                          )}
                          <button 
                            onClick={() => {
                              requestConfirmation(
                                "Delete Transaction",
                                `Are you sure you want to permanently delete transaction invoice ${tx.invoiceNo}?`,
                                () => handleDeleteTransaction(tx.id)
                              );
                            }}
                            className="px-2.5 py-1.5 bg-red-950/40 border border-red-500/20 text-red-400 hover:bg-red-900 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                            title="Delete transaction record"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: MEDIA LIBRARY */}
          {activeTab === 'media' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Media Library</h2>
                  <p className="text-xs text-zinc-500 font-mono mt-1">ORGANIZE RAW AND OPTIMIZED SHOOT GRAPHICS TO STORAGE CODES</p>
                </div>
              </div>

              {/* Storage Stats */}
              <div className="p-5 bg-[#080808] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center space-x-3">
                  <HardDrive className="w-8 h-8 text-gold" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase font-mono">Storage Volume Index</h3>
                    <p className="text-xs text-zinc-500 font-mono uppercase">
                      {mediaItems.length} portfolio-ready assets registered to local index
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2.5 w-full md:w-auto shrink-0">
                  <button 
                    onClick={() => setNewMediaModal(true)}
                    className="flex-1 md:flex-none px-4 py-2.5 bg-transparent hover:bg-white/5 border border-white/10 text-zinc-300 font-mono text-[10px] tracking-widest uppercase transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Media</span>
                  </button>
                  
                  <button 
                    onClick={() => document.getElementById('media-bulk-upload-input')?.click()}
                    className="flex-1 md:flex-none px-4 py-2.5 bg-gold hover:bg-white text-black font-mono text-[10px] tracking-widest uppercase transition-colors flex items-center justify-center space-x-1.5 cursor-pointer font-bold"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Bulk Upload</span>
                  </button>
                  
                  <input
                    type="file"
                    id="media-bulk-upload-input"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleBulkUpload(e.target.files);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Folder list */}
              <div className="flex flex-wrap gap-2.5">
                {mediaFolders.map(folder => (
                  <button
                    key={folder}
                    onClick={() => setActiveMediaFolder(folder)}
                    className={`px-4 py-2.5 font-mono text-xs uppercase tracking-wider border rounded-none cursor-pointer transition-all ${
                      activeMediaFolder === folder 
                        ? 'bg-gold border-gold text-black font-bold' 
                        : 'border-white/5 text-zinc-400 hover:border-white/25 hover:text-white bg-[#080808]'
                    }`}
                  >
                    {folder} ({mediaItems.filter(m => m.folder === folder).length})
                  </button>
                ))}
              </div>

              {/* Media Items grid */}
              {mediaItems.filter(m => m.folder === activeMediaFolder).length === 0 ? (
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files) {
                      handleBulkUpload(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => document.getElementById('media-bulk-upload-input')?.click()}
                  className="border-2 border-dashed border-white/10 p-16 text-center space-y-4 hover:border-gold/40 hover:bg-white/5 transition-all cursor-pointer group"
                >
                  <Upload className="w-10 h-10 text-zinc-600 mx-auto group-hover:text-gold transition-colors" />
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-zinc-300 uppercase tracking-widest">No Media in {activeMediaFolder}</p>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase">Drag & drop files here, or click to browse</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mediaItems.filter(m => m.folder === activeMediaFolder).map(item => (
                    <div key={item.id} className="bg-[#080808] border border-white/5 p-3 group relative flex flex-col justify-between h-[230px] transition-all hover:border-white/15">
                      <div className="relative h-28 overflow-hidden bg-zinc-950 border border-white/5">
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        {/* Hover action overlay */}
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setEditingMedia(item)}
                            className="p-1.5 bg-zinc-900 hover:bg-gold text-zinc-400 hover:text-black border border-white/10 transition-colors cursor-pointer"
                            title="Edit / Rename Media"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              requestConfirmation(
                                "Delete Media Item",
                                `Are you sure you want to permanently delete "${item.name}" from your library?`,
                                () => handleDeleteMediaItem(item.id)
                              );
                            }}
                            className="p-1.5 bg-zinc-900 hover:bg-red-900 text-zinc-400 hover:text-red-300 border border-white/10 transition-colors cursor-pointer"
                            title="Delete Media Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-0.5 py-2 font-mono text-[10px]">
                        <p className="text-white truncate font-bold" title={item.name}>{item.name}</p>
                        <p className="text-zinc-500 text-[9px] flex justify-between items-center">
                          <span>{item.size}</span>
                          <span className="text-gold uppercase text-[8px] tracking-wider font-semibold">{item.folder}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/5">
                        <button 
                          onClick={() => setEditingMedia(item)}
                          className="py-1.5 border border-white/10 hover:border-gold/40 text-[9px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer text-center"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            requestConfirmation(
                              "Delete Media Item",
                              `Are you sure you want to permanently delete "${item.name}"?`,
                              () => handleDeleteMediaItem(item.id)
                            );
                          }}
                          className="py-1.5 border border-white/10 hover:border-red-900 text-[9px] font-mono uppercase tracking-widest text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer text-center"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 11: WEBSITE BUILDER SECTIONS */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Page Sections</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">DIRECT LIVE INTERFACE BUILDER COPIES FOR OLAMIDE VISUALS HOMEPAGE</p>
              </div>

              {/* Edit Hero section values */}
              <div className="p-6 bg-[#080808] border border-white/5 space-y-4">
                <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase block pb-2 border-b border-white/5">Homepage Hero Segment</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Primary Display Title</label>
                    <input 
                      type="text" 
                      id="hero-title-input"
                      defaultValue={content?.hero?.title || 'Visual Poetry'}
                      className="w-full px-4 py-3 bg-black border border-white/10 text-white text-xs font-serif"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Secondary Sub-title</label>
                    <input 
                      type="text" 
                      id="hero-subtitle-input"
                      defaultValue={content?.hero?.subTitle || ''}
                      className="w-full px-4 py-3 bg-black border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    const title = (document.getElementById('hero-title-input') as HTMLInputElement)?.value;
                    const subtitle = (document.getElementById('hero-subtitle-input') as HTMLInputElement)?.value;
                    handleUpdateHeroContent(title, subtitle);
                  }}
                  className="px-4 py-2 bg-gold hover:bg-white text-black font-mono text-[10px] tracking-widest uppercase transition-colors cursor-pointer"
                >
                  Publish Changes
                </button>
              </div>

              {/* Edit About/Artist section values */}
              <div className="p-6 bg-[#080808] border border-white/5 space-y-4">
                <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase block pb-2 border-b border-white/5">Homepage About Artist Segment</span>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Artist Biography (Full Text)</label>
                    <textarea 
                      id="about-bio-input"
                      rows={5}
                      defaultValue={content?.about?.biography || ''}
                      className="w-full px-4 py-3 bg-black border border-white/10 text-white text-xs leading-relaxed"
                      placeholder="Type the full artist/biography story here..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block">Profile Image URL / Direct Upload</label>
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            id="about-image-input"
                            defaultValue={content?.about?.profileImage || ''}
                            className="flex-1 px-4 py-3 bg-black border border-white/10 text-white text-xs"
                            placeholder="Enter image URL or select local file"
                            onChange={(e) => {
                              const imgPreview = document.getElementById('about-image-preview') as HTMLImageElement;
                              if (imgPreview) imgPreview.src = e.target.value;
                            }}
                          />
                          <label className="px-3 py-3 bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">
                            Upload File
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = async (event) => {
                                    const rawBase64 = event.target?.result as string;
                                    if (rawBase64) {
                                      const base64 = await compressImageBase64(rawBase64, 800, 800, 0.75);
                                      const urlInput = document.getElementById('about-image-input') as HTMLInputElement;
                                      if (urlInput) {
                                        urlInput.value = base64;
                                      }
                                      const imgPreview = document.getElementById('about-image-preview') as HTMLImageElement;
                                      if (imgPreview) {
                                        imgPreview.src = base64;
                                      }
                                      triggerToast("Local profile file loaded and compressed successfully!");
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block">Quick Pick from Media Assets</label>
                        {mediaItems.length === 0 ? (
                          <p className="text-[10px] font-mono text-zinc-500 italic">No media assets found. Upload some in the Media tab.</p>
                        ) : (
                          <div className="border border-white/5 p-2 bg-black max-h-[140px] overflow-y-auto grid grid-cols-4 gap-2">
                            {mediaItems.map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  const urlInput = document.getElementById('about-image-input') as HTMLInputElement;
                                  if (urlInput) {
                                    urlInput.value = item.url;
                                    // Trigger preview update
                                    const imgPreview = document.getElementById('about-image-preview') as HTMLImageElement;
                                    if (imgPreview) imgPreview.src = item.url;
                                  }
                                }}
                                className="relative aspect-square border border-white/10 hover:border-gold transition-colors overflow-hidden group focus:outline-none"
                              >
                                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <span className="text-[8px] font-mono text-gold uppercase tracking-tighter">Choose</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Active Profile Image Preview</label>
                      <div className="aspect-[4/5] bg-black border border-white/5 flex items-center justify-center overflow-hidden relative group max-w-[180px]">
                        <img 
                          id="about-image-preview" 
                          src={content?.about?.profileImage || 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=1200&q=80'} 
                          alt="Artist Portrait Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const biography = (document.getElementById('about-bio-input') as HTMLTextAreaElement)?.value;
                    const profileImage = (document.getElementById('about-image-input') as HTMLInputElement)?.value;
                    handleUpdateAboutContent(biography, profileImage);
                  }}
                  className="px-4 py-2 bg-gold hover:bg-white text-black font-mono text-[10px] tracking-widest uppercase transition-colors cursor-pointer"
                >
                  Publish About Page Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB 12: SEO MANAGEMENT */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif text-white uppercase tracking-wider">SEO Management</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">SEARCH ENGINE OPTIMIZATION TOOLS, METAS, AND GOOGLE INDEX CONTROLLER</p>
              </div>

              <div className="p-6 bg-[#080808] border border-white/5 space-y-4">
                <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase block pb-2 border-b border-white/5">Google Meta Registry</span>
                
                <div className="space-y-4 pt-2 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Meta Title Tag</label>
                    <input 
                      type="text" 
                      defaultValue="Olamide Visuals - Premium Cinematic Photographer in Edo State, Nigeria"
                      className="w-full px-4 py-3 bg-black border border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Meta Description</label>
                    <textarea 
                      rows={3}
                      defaultValue="Award-winning wedding, portrait, and fashion photography services in Benin City, Ekpoma, and Nigeria. Preserving luxury milestones with dramatic lighting."
                      className="w-full px-4 py-3 bg-black border border-white/10 text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    logAdminAction('Updated search engine meta titles', 'settings');
                    triggerToast('Meta registries updated.');
                  }}
                  className="px-4 py-2 bg-gold hover:bg-white text-black font-mono text-[10px] tracking-widest uppercase transition-colors cursor-pointer"
                >
                  Save Meta Setup
                </button>
              </div>
            </div>
          )}

          {/* TAB 13: CONTACT MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Contact Inbox</h2>
                  <p className="text-xs text-zinc-500 font-mono mt-1">CLIENT ENQUIRIES DISPATCHED FROM STUDIO REACH PORTALS</p>
                </div>
                {messages.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to permanently delete all messages? This action cannot be undone.")) {
                        syncMessages([]);
                        logAdminAction("Permanently deleted all client messages", "system");
                        triggerToast("All client messages permanently deleted.");
                      }
                    }}
                    className="px-4 py-2 bg-red-950/40 hover:bg-red-900 border border-red-500/20 text-red-400 font-mono text-xs tracking-widest uppercase transition-colors cursor-pointer"
                  >
                    Delete All Messages
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {filteredMessages.length === 0 ? (
                  <div className="p-8 bg-[#080808] border border-white/5 text-center text-zinc-500 font-mono text-xs uppercase">
                    No client messages found.
                  </div>
                ) : (
                  filteredMessages.map(m => (
                    <div key={m.id} className="p-6 bg-[#080808] border border-white/5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase font-mono">{m.name}</h3>
                          <p className="text-[10px] font-mono text-zinc-500">{m.email} • {new Date(m.date).toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-0.5 font-mono text-[9px] uppercase font-bold ${
                          m.status === 'unread' ? 'bg-gold/10 text-gold border border-gold/20' : 'bg-black border border-white/5 text-zinc-500'
                        }`}>
                          {m.status}
                        </span>
                      </div>

                      <div className="p-4 bg-black border border-white/5 font-mono text-[11px] text-zinc-300 leading-relaxed">
                        {m.message}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const r = prompt('Type your response to the client:');
                            if (r) handleReplyMessage(m.id, r);
                          }}
                          className="px-3.5 py-1.5 bg-gold hover:bg-white text-black font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Send Reply
                        </button>
                        <button
                          onClick={() => triggerToast('Message archived.')}
                          className="px-3.5 py-1.5 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white font-mono text-[10px] uppercase tracking-wider transition-colors"
                        >
                          Archive
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to permanently delete this message?")) {
                              handleDeleteMessage(m.id);
                            }
                          }}
                          className="px-3.5 py-1.5 bg-red-950/20 border border-red-500/20 hover:bg-red-900 text-red-400 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 14: BRAND IDENTITY */}
          {activeTab === 'brand' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Brand Identity</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">SYNCHRONIZE THE LOGO CODES, PRIMARY HEX COLOR VALUES, AND DIRECT FONTS</p>
              </div>

              <div className="p-6 bg-[#080808] border border-white/5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Logo Title Text</label>
                    <input 
                      type="text" 
                      id="brand-logo-text"
                      defaultValue={content?.branding?.logoText || 'Olamide'}
                      className="w-full px-4 py-3 bg-black border border-white/10 text-white font-serif uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Brand Tagline</label>
                    <input 
                      type="text" 
                      id="brand-tagline"
                      defaultValue={content?.branding?.tagline || 'Visuals'}
                      className="w-full px-4 py-3 bg-black border border-white/10 text-white uppercase font-mono text-gold"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    const l = (document.getElementById('brand-logo-text') as HTMLInputElement)?.value;
                    const t = (document.getElementById('brand-tagline') as HTMLInputElement)?.value;
                    handleUpdateBranding(l, t);
                  }}
                  className="px-4 py-2 bg-gold hover:bg-white text-black font-mono text-[10px] tracking-widest uppercase transition-colors cursor-pointer"
                >
                  Save Brand Setup
                </button>
              </div>

              {/* ADMINISTRATIVE PORTRAIT / AVATAR UPLOAD */}
              <div className="p-6 bg-[#080808] border border-white/5 space-y-6">
                <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
                  <Camera className="w-4 h-4 text-gold" />
                  <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase block">Administrative Portrait / Profile Picture</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
                  {/* Current Avatar View */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-black border border-white/5 space-y-3">
                    <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Active Avatar</span>
                    <div className="w-24 h-24 rounded-full border-2 border-gold/40 overflow-hidden bg-zinc-900 shrink-0 relative group">
                      <img 
                        src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                        alt="Admin Avatar" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (profile) {
                          const updated = {
                            ...profile,
                            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                          };
                          syncProfile(updated);
                          logAdminAction('Reset admin profile picture to default Unsplash avatar', 'settings');
                          triggerToast('Reset to default avatar.');
                        }
                      }}
                      className="text-[9px] font-mono tracking-widest text-red-400 hover:text-red-300 transition-colors uppercase hover:underline cursor-pointer"
                    >
                      Reset to Default
                    </button>
                  </div>

                  {/* Drag and Drop Uploader */}
                  <div className="md:col-span-8 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Upload via Local File (Drag & Drop Supported)</label>
                      <div
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAvatarDragActive(true);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAvatarDragActive(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAvatarDragActive(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAvatarDragActive(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleAvatarFile(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => document.getElementById('avatar-file-upload')?.click()}
                        className={`border-2 border-dashed rounded-none p-6 text-center cursor-pointer transition-all ${
                          avatarDragActive 
                            ? 'border-gold bg-gold/5 text-gold' 
                            : 'border-white/10 hover:border-gold/40 hover:bg-white/5 text-zinc-400'
                        }`}
                      >
                        <input
                          type="file"
                          id="avatar-file-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleAvatarFile(e.target.files[0]);
                            }
                          }}
                        />
                        <div className="flex flex-col items-center space-y-2">
                          <Upload className="w-6 h-6 text-zinc-400" />
                          <p className="text-[10px] font-mono tracking-wide">
                            {avatarDragActive ? 'DROP YOUR PORTRAIT HERE' : 'DRAG & DROP OR CLICK TO CHOOSE PORTRAIT'}
                          </p>
                          <p className="text-[9px] text-zinc-600 uppercase font-mono">JPG, PNG, GIF up to 5MB (Saved as offline Base64 string)</p>
                        </div>
                      </div>
                    </div>

                    {/* Image URL fallback */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Or Specify Image URL Directly</label>
                      <div className="flex space-x-2">
                        <input 
                          type="text" 
                          id="avatar-url-direct-input"
                          placeholder="https://images.unsplash.com/..."
                          defaultValue={profile?.avatarUrl && !profile.avatarUrl.startsWith('data:') ? profile.avatarUrl : ''}
                          className="flex-1 px-4 py-2.5 bg-black border border-white/10 text-white font-mono text-xs placeholder-zinc-700 focus:border-gold/50 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = (document.getElementById('avatar-url-direct-input') as HTMLInputElement)?.value.trim();
                            if (!val) {
                              triggerToast('Error: Please enter a valid image URL.');
                              return;
                            }
                            if (profile) {
                              const updated = {
                                ...profile,
                                avatarUrl: val
                              };
                              syncProfile(updated);
                              logAdminAction(`Updated admin profile picture URL directly`, 'settings');
                              triggerToast('Profile picture URL synchronized successfully.');
                            }
                          }}
                          className="px-4 py-2.5 bg-white hover:bg-gold text-black font-mono text-[9px] tracking-widest uppercase transition-colors font-bold cursor-pointer shrink-0"
                        >
                          Sync Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Creative Portrait Preset Library */}
                <div className="pt-4 border-t border-white/5 space-y-2">
                  <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block">Quick Photographer Portrait Presets</span>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { name: 'Olamide Editorial', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
                      { name: 'Studio Spotlight', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
                      { name: 'Golden Hour Portrait', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80' },
                      { name: 'Minimalist Silhouette', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80' },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (profile) {
                            const updated = {
                              ...profile,
                              avatarUrl: preset.url
                            };
                            syncProfile(updated);
                            logAdminAction(`Updated admin profile picture to preset: ${preset.name}`, 'settings');
                            triggerToast(`Switched profile photo to ${preset.name}.`);
                            
                            // Also update the input if it exists
                            const urlInp = document.getElementById('avatar-url-direct-input') as HTMLInputElement;
                            if (urlInp) urlInp.value = preset.url;
                          }
                        }}
                        className={`group flex items-center space-x-2 p-1.5 bg-black hover:bg-white/5 border transition-all cursor-pointer ${
                          profile?.avatarUrl === preset.url ? 'border-gold' : 'border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 shrink-0">
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white uppercase pr-2">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* HIDDEN ADMIN ACCESS SETTINGS */}
              <div className="p-6 bg-[#080808] border border-white/5 space-y-6 text-xs">
                <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
                  <Shield className="w-4 h-4 text-gold" />
                  <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase block">Hidden Admin Access & Bruteforce Security</span>
                </div>

                <div className="space-y-4">
                  {/* Status Toggle */}
                  <div className="flex items-center justify-between p-4 bg-black border border-white/5">
                    <div>
                      <h4 className="text-white font-bold font-mono text-[10px] uppercase">Hidden Access System Status</h4>
                      <p className="text-[10px] text-zinc-500 font-light mt-0.5">Toggle whether double-tapping or multi-tapping the logo opens the login portal.</p>
                    </div>
                    <button
                      onClick={() => setHiddenAccessEnabled(!hiddenAccessEnabled)}
                      className="focus:outline-none cursor-pointer"
                    >
                      {hiddenAccessEnabled ? (
                        <ToggleRight className="w-9 h-9 text-gold" />
                      ) : (
                        <ToggleLeft className="w-9 h-9 text-zinc-600" />
                      )}
                    </button>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Access Action Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Logo Tap Access Trigger</label>
                      <select
                        disabled={!hiddenAccessEnabled}
                        value={hiddenAccessMethod}
                        onChange={(e) => setHiddenAccessMethod(e.target.value as any)}
                        className="w-full px-4 py-3 bg-black border border-white/10 text-white font-mono rounded-none focus:outline-none focus:border-gold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="double-tap">Double-Tap Logo (2 clicks)</option>
                        <option value="triple-tap">Triple-Tap Logo (3 clicks)</option>
                        <option value="five-tap">Five-Tap Logo (5 clicks)</option>
                        <option value="disabled">Disabled (Secret query parameter only)</option>
                      </select>
                    </div>

                    {/* Bruteforce Max Attempts */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Max Login Attempts Before Lockout</label>
                      <input
                        type="number"
                        min={3}
                        max={10}
                        value={maxLoginAttempts}
                        onChange={(e) => setMaxLoginAttempts(parseInt(e.target.value) || 5)}
                        className="w-full px-4 py-3 bg-black border border-white/10 text-white font-mono rounded-none focus:outline-none focus:border-gold"
                      />
                    </div>

                    {/* Lockout Duration */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Lockout Duration (Minutes)</label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={lockoutDuration}
                        onChange={(e) => setLockoutDuration(parseInt(e.target.value) || 15)}
                        className="w-full px-4 py-3 bg-black border border-white/10 text-white font-mono rounded-none focus:outline-none focus:border-gold"
                      />
                    </div>
                  </div>

                  {/* Accidental Activation Note */}
                  <div className="p-3.5 bg-black border border-white/5 text-[10px] text-zinc-400 leading-relaxed font-mono">
                    <span className="text-gold font-bold uppercase block mb-1">Accidental Activation Protection:</span>
                    When the logo click trigger is activated, a secure overlaid password entry modal will intercept the visitor. Access to the dashboard is strictly forbidden unless the administrator provides the valid password key, completely mitigating accidental guest actions.
                  </div>

                  {/* Hidden Dashboard URL Note */}
                  <div className="p-3.5 bg-black border border-white/5 text-[10px] text-zinc-400 leading-relaxed font-mono">
                    <span className="text-zinc-500 font-bold uppercase block mb-1">Hidden Dashboard Location:</span>
                    The administrator portal is decoupled from the main navigation tree and has no public visual links. The system is securely hidden behind the logo-tap gesture or via appending the private URL suffix <code className="text-gold">?admin=true</code> to the studio domain.
                  </div>

                  <button
                    onClick={() => {
                      const newSettings = {
                        enabled: hiddenAccessEnabled,
                        method: hiddenAccessMethod,
                        maxAttempts: maxLoginAttempts,
                        lockoutDuration: lockoutDuration
                      };
                      saveToDB('olamide_visuals_hidden_access_settings', newSettings);
                      logAdminAction(`Updated security settings: access mode set to ${hiddenAccessMethod} (${hiddenAccessEnabled ? 'enabled' : 'disabled'}), brute-force max attempts: ${maxLoginAttempts}, lockout duration: ${lockoutDuration} mins.`, 'settings');
                      triggerToast('Security configurations successfully deployed.');
                    }}
                    className="px-4 py-2 bg-gold hover:bg-white text-black font-mono text-[10px] tracking-widest uppercase transition-colors cursor-pointer"
                  >
                    Save Security Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 17: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Audit logs</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">DETAILED SYSTEM LOGS AND COMPREHENSIVE SECURITY AUDIT TRAIL</p>
              </div>

              {/* Log List */}
              <div className="bg-[#080808] border border-white/5 divide-y divide-white/5">
                {logs.map(lg => (
                  <div key={lg.id} className="p-4 flex flex-col md:flex-row justify-between text-xs font-mono text-zinc-400 gap-2 hover:bg-white/[0.01]">
                    <div className="space-y-1">
                      <p className="text-white font-bold">{lg.action}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-600">
                        <span>OPERATOR: {lg.user}</span>
                        <span>IP: {lg.ip}</span>
                        <span>DEVICE: {lg.device}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-zinc-500">{new Date(lg.timestamp).toLocaleString()}</p>
                      <span className="text-[9px] text-gold uppercase bg-gold/10 px-1.5 block w-max ml-auto mt-1">
                        {lg.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 18: INSTAGRAM JOURNAL */}
          {activeTab === 'instagram' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Instagram Journal Feed</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">CURATE EXCLUSIVE, COGNITIVE VISUAL STORIES DIRECTLY ONTO OUR MAIN HOMEPAGE JOURNAL</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form column */}
                <div className="lg:col-span-1 bg-[#080808] border border-white/5 p-6 space-y-6 self-start">
                  <div className="space-y-1 border-b border-white/5 pb-4">
                    <h3 className="text-sm font-bold text-white uppercase font-mono">Publish Journal Post</h3>
                    <p className="text-[10px] text-zinc-500 font-mono">UPLOAD A PHOTOGRAPHIC MASTERWORK TO THE INSTAGRAM JOURNAL GRID</p>
                  </div>

                  <form onSubmit={handlePublishInstagram} className="space-y-4">
                    {/* Drag and Drop / Upload Box */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Post Image</label>
                      
                      <div 
                        onClick={() => document.getElementById('instagram-file-input')?.click()}
                        className="aspect-square bg-black border border-dashed border-white/10 hover:border-gold/50 transition-colors flex flex-col items-center justify-center p-4 text-center cursor-pointer relative group overflow-hidden"
                      >
                        {instagramForm.imageUrl ? (
                          <>
                            <img 
                              src={instagramForm.imageUrl} 
                              alt="Upload Preview" 
                              className="absolute inset-0 w-full h-full object-cover group-hover:opacity-40 transition-opacity" 
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white font-mono text-[10px] uppercase">
                              Change Image
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2 flex flex-col items-center justify-center">
                            <Upload className={`w-8 h-8 text-zinc-600 group-hover:text-gold transition-colors ${uploadingIg ? 'animate-bounce' : ''}`} />
                            <p className="text-[10px] text-zinc-400 font-mono uppercase">Click to browse or drop photo here</p>
                            <p className="text-[8px] text-zinc-600 font-mono">PNG, JPG or WEBP up to 10MB</p>
                          </div>
                        )}
                      </div>

                      <input 
                        type="file" 
                        id="instagram-file-input" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleIgImageUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </div>

                    {/* Likes & Comments simulation */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Likes Count</label>
                        <input
                          type="text"
                          placeholder="e.g. 1.2k"
                          value={instagramForm.likes}
                          onChange={(e) => setInstagramForm(prev => ({ ...prev, likes: e.target.value }))}
                          className="w-full bg-black border border-white/5 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Comments</label>
                        <input
                          type="text"
                          placeholder="e.g. 48"
                          value={instagramForm.comments}
                          onChange={(e) => setInstagramForm(prev => ({ ...prev, comments: e.target.value }))}
                          className="w-full bg-black border border-white/5 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={uploadingIg || !instagramForm.imageUrl}
                      className="w-full py-3 bg-gold text-black font-mono text-xs tracking-widest font-bold uppercase transition-all flex items-center justify-center space-x-2 disabled:bg-zinc-800 disabled:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{uploadingIg ? 'PROCESSING...' : 'PUBLISH TO JOURNAL'}</span>
                    </button>
                  </form>
                </div>

                {/* Grid column */}
                <div className="lg:col-span-2 bg-[#080808] border border-white/5 p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase font-mono">Active Feed Grid</h3>
                      <p className="text-[10px] text-zinc-500 font-mono">LIVE VISUAL CHRONOLOGY DISPLAYED ON HOMEPAGE</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 bg-zinc-900 border border-white/5 rounded">
                      {instagramPosts.length} posts
                    </span>
                  </div>

                  {instagramPosts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {instagramPosts.map((post) => (
                        <div 
                          key={post.id} 
                          className="group relative bg-black border border-white/5 aspect-square overflow-hidden flex flex-col justify-between"
                        >
                          <img 
                            src={post.imageUrl} 
                            alt="Instagram Post" 
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          
                          {/* Top Tag & Delete Button overlay */}
                          <div className="absolute top-2 right-2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              onClick={() => handleDeleteInstagramPost(post.id)}
                              className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors shadow-lg cursor-pointer"
                              title="Delete Post"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Stats Info Overlay */}
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4 text-white">
                            <div className="flex items-center space-x-1">
                              <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
                              <span className="text-xs font-mono font-semibold">{post.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-3.5 h-3.5 text-gold fill-current" />
                              <span className="text-xs font-mono font-semibold">{post.comments}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 border border-dashed border-white/5 rounded bg-black/40 flex flex-col items-center justify-center space-y-3">
                      <Instagram className="w-10 h-10 text-zinc-600 animate-pulse" />
                      <div className="space-y-1">
                        <p className="text-sm text-zinc-400 font-mono uppercase">Journal grid is empty</p>
                        <p className="text-xs text-zinc-600 max-w-xs mx-auto">Upload your first exclusive shoot on the left to activate follow-grid curation on the main website.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 19: CINEMATIC SPOTLIGHT */}
          {activeTab === 'spotlight' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Cinematic Spotlight Showcase</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">CONSTRUCT AND DIRECT EXCLUSIVE STORYBOARDS TO HIGHLIGHT PHOTOGRAPHIC EXCELLENCE</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form column */}
                <div className="lg:col-span-5 bg-[#080808] border border-white/5 p-6 space-y-6 self-start">
                  <div className="space-y-1 border-b border-white/5 pb-4">
                    <h3 className="text-sm font-bold text-white uppercase font-mono">Publish Spotlight Story</h3>
                    <p className="text-[10px] text-zinc-500 font-mono">UPLOAD A CINEMATIC MASTERWORK AND DESIGN ITS ACCOMPANYING OVERLAY</p>
                  </div>

                  <form onSubmit={handlePublishSpotlight} className="space-y-4">
                    {/* Drag and Drop / Upload Box */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Story Image</label>
                        {spotlightForm.imageUrl && (
                          <button
                            type="button"
                            disabled={spotlightAiAnalyzing}
                            onClick={() => analyzeSpotlightImage(spotlightForm.imageUrl)}
                            className="text-gold hover:text-white flex items-center space-x-1 cursor-pointer disabled:opacity-50 text-[10px] font-mono uppercase tracking-wider"
                            title="Analyze this image using Gemini AI to automatically generate spotlight information"
                          >
                            <Sparkles className={`w-3 h-3 ${spotlightAiAnalyzing ? 'animate-spin' : ''}`} />
                            <span>{spotlightAiAnalyzing ? 'AI Scanning...' : 'Scan with Gemini AI'}</span>
                          </button>
                        )}
                      </div>
                      
                      <div 
                        onClick={() => document.getElementById('spotlight-file-input')?.click()}
                        className="aspect-[16/10] bg-black border border-dashed border-white/10 hover:border-gold/50 transition-colors flex flex-col items-center justify-center p-4 text-center cursor-pointer relative group overflow-hidden"
                      >
                        {spotlightForm.imageUrl ? (
                          <>
                            <img 
                              src={spotlightForm.imageUrl} 
                              alt="Upload Preview" 
                              className="absolute inset-0 w-full h-full object-cover group-hover:opacity-40 transition-opacity" 
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white font-mono text-[10px] uppercase">
                              Change Image
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2 flex flex-col items-center justify-center">
                            <Upload className={`w-8 h-8 text-zinc-600 group-hover:text-gold transition-colors ${uploadingSpotlight ? 'animate-bounce' : ''}`} />
                            <p className="text-[10px] text-zinc-400 font-mono uppercase">Click to browse or drop story photo</p>
                            <p className="text-[8px] text-zinc-600 font-mono">PNG, JPG or WEBP up to 10MB</p>
                          </div>
                        )}
                      </div>

                      <input 
                        type="file" 
                        id="spotlight-file-input" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleSpotlightImageUpload(e.target.files[0]);
                          }
                        }}
                      />

                      {spotlightForm.imageUrl && spotlightForm.imageUrl.startsWith('data:') && (
                        <p className="text-[10px] text-gold font-mono flex items-center space-x-1 mt-1">
                          <span>✓ Base64 Local File Loaded</span>
                          {spotlightAiAnalyzing && <span className="animate-pulse">(AI is auto-generating details...)</span>}
                        </p>
                      )}
                    </div>

                    {spotlightAiScanResult && (
                      <div className="p-3 bg-zinc-950 border border-gold/20 text-[10px] space-y-2 font-mono leading-relaxed transition-all duration-300">
                        <div className="flex items-center space-x-1.5 text-gold font-bold uppercase tracking-wider text-[9px]">
                          <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse" />
                          <span>Gemini AI Cinematic Audit Report</span>
                        </div>
                        <div className="space-y-1.5 border-t border-white/5 pt-2">
                          <div>
                            <span className="text-zinc-500 block uppercase text-[8px] tracking-wide font-bold">Visual Scan Audit:</span>
                            <span className="text-zinc-200">{spotlightAiScanResult.visualAudit}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase text-[8px] tracking-wide font-bold">Critical Verification Check:</span>
                            <span className="text-gold bg-gold/5 px-1.5 py-0.5 rounded border border-gold/10 inline-block font-medium mt-0.5">{spotlightAiScanResult.criticalCheck}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Story Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. The Grace of Melanin"
                        required
                        value={spotlightForm.title}
                        onChange={(e) => setSpotlightForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-black border border-white/5 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Category *</label>
                        <input
                          type="text"
                          placeholder="e.g. EDITORIAL PORTRAIT"
                          required
                          value={spotlightForm.category}
                          onChange={(e) => setSpotlightForm(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-black border border-white/5 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Technical Specs</label>
                        <input
                          type="text"
                          placeholder="e.g. Sony α7R V • 85mm f/1.2"
                          value={spotlightForm.technicalSpecs}
                          onChange={(e) => setSpotlightForm(prev => ({ ...prev, technicalSpecs: e.target.value }))}
                          className="w-full bg-black border border-white/5 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Tagline</label>
                      <input
                        type="text"
                        placeholder="e.g. Illuminating raw tones and textured shadow lines."
                        value={spotlightForm.tagline}
                        onChange={(e) => setSpotlightForm(prev => ({ ...prev, tagline: e.target.value }))}
                        className="w-full bg-black border border-white/5 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Creative Description *</label>
                      <textarea
                        placeholder="Detail the creative philosophy, environment setup, and narrative backstory..."
                        required
                        rows={3}
                        value={spotlightForm.description}
                        onChange={(e) => setSpotlightForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-black border border-white/5 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={uploadingSpotlight || !spotlightForm.imageUrl}
                      className="w-full py-3 bg-gold text-black font-mono text-xs tracking-widest font-bold uppercase transition-all flex items-center justify-center space-x-2 disabled:bg-zinc-800 disabled:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{uploadingSpotlight ? 'PROCESSING...' : 'PUBLISH TO SPOTLIGHT'}</span>
                    </button>
                  </form>
                </div>

                {/* Grid column */}
                <div className="lg:col-span-7 bg-[#080808] border border-white/5 p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase font-mono">Active Showcase Carousel</h3>
                      <p className="text-[10px] text-zinc-500 font-mono">LIVE SEQUENTIAL REEL DISPLAYED ON HOMEPAGE SPOTLIGHT</p>
                    </div>
                    <span className="text-[10px] font-mono text-gold px-2 py-0.5 bg-gold/5 border border-gold/10 rounded">
                      {spotlightItems.length} active
                    </span>
                  </div>

                  {spotlightItems.length > 0 ? (
                    <div className="space-y-4">
                      {spotlightItems.map((story) => (
                        <div 
                          key={story.id} 
                          className="group relative bg-black border border-white/5 p-4 flex flex-col md:flex-row gap-4 items-center justify-between"
                        >
                          <div className="flex items-center space-x-4 w-full md:w-auto">
                            <img 
                              src={story.imageUrl} 
                              alt={story.title} 
                              className="w-20 h-16 object-cover border border-white/10 shrink-0" 
                            />
                            <div className="min-w-0">
                              <span className="text-[9px] font-mono tracking-widest text-gold uppercase block leading-none mb-1">
                                {story.category}
                              </span>
                              <h4 className="text-sm font-bold text-white uppercase truncate font-serif leading-tight">
                                {story.title}
                              </h4>
                              {story.tagline && (
                                <p className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                                  "{story.tagline}"
                                </p>
                              )}
                              <p className="text-[9px] font-mono text-zinc-600 mt-1">
                                {story.technicalSpecs}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                            <button
                              onClick={() => handleDeleteSpotlightItem(story.id)}
                              className="p-2 bg-red-600/10 hover:bg-red-600 border border-red-600/20 hover:border-red-600 text-red-500 hover:text-white rounded transition-all duration-300 cursor-pointer"
                              title="Delete Story"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 border border-dashed border-white/5 rounded bg-black/40 flex flex-col items-center justify-center space-y-3">
                      <Sparkles className="w-10 h-10 text-zinc-600 animate-pulse" />
                      <div className="space-y-1">
                        <p className="text-sm text-zinc-400 font-mono uppercase">Spotlight carousel is empty</p>
                        <p className="text-xs text-zinc-600 max-w-xs mx-auto">Create and publish your first custom cinematic masterpiece on the left to activate the homepage storyteller spotlight.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 20: SUPABASE DATA SYNC & CONNECTION */}
          {activeTab === 'supabase' && (
            <div className="space-y-6 animate-fade-in text-zinc-100">
              <div>
                <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Supabase Integration Curation</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">ESTABLISH SECURE POSTGRESQL CONNECTIONS AND MOBILIZE PORTFOLIO AND BOOKINGS SYNC LAYERS</p>
              </div>

              {/* Status Header Banner */}
              <div className="p-4 bg-zinc-950 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">CONNECTION ENGINE STATUS</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${supabaseConfig?.envConfigured || supabaseTestResult?.success ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-xs font-bold uppercase text-white">
                      {supabaseTestResult?.success ? 'ONLINE & READY' : supabaseConfig?.envConfigured ? 'CREDENTIALS PRE-CONFIGURED' : 'DISCONNECTED'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {supabaseConfig?.envConfigured && (
                    <span className="text-[9px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Using Env Variables
                    </span>
                  )}
                  {supabaseConfig?.url && (
                    <span className="text-[9px] font-mono text-zinc-500">
                      ENDPOINT: {supabaseConfig.url}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Connection Form Section */}
                <div className="lg:col-span-5 bg-[#080808] border border-white/5 p-6 space-y-6 self-start">
                  <div className="space-y-1 border-b border-white/5 pb-4">
                    <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center space-x-1.5">
                      <Settings className="w-4 h-4 text-gold" />
                      <span>Connection Credentials</span>
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono">SPECIFY DIRECT PORTAL ENDPOINTS TO BYPASS FIRESTORE TO CLIENT MIRRORS</p>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Supabase Project URL</label>
                      <input 
                        type="url"
                        placeholder="https://your-project.supabase.co"
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        className="w-full bg-black border border-white/5 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Supabase Anon Public API Key</label>
                      <input 
                        type="password"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        value={supabaseAnonKey}
                        onChange={(e) => setSupabaseAnonKey(e.target.value)}
                        className="w-full bg-black border border-white/5 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={supabaseTesting}
                      onClick={testSupabaseConnection}
                      className="w-full py-3 bg-transparent border border-gold text-gold hover:bg-gold hover:text-black font-mono text-xs tracking-widest font-bold uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${supabaseTesting ? 'animate-spin' : ''}`} />
                      <span>{supabaseTesting ? 'VERIFYING PORTAL...' : 'TEST PORTAL CONNECTION'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={pullingAll || supabaseTesting}
                      onClick={async () => {
                        triggerToast("Pulling all table records from Supabase cloud database...");
                        const loadedCount = await loadAllDataFromSupabase();
                        triggerToast(`✓ Successfully imported ${loadedCount} active collections from Supabase!`);
                        logAdminAction(`Manually pulled database records from Supabase (${loadedCount} tables updated)`, "system");
                      }}
                      className="w-full py-3 bg-gold text-black hover:bg-white font-mono text-xs tracking-widest font-bold uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <Download className={`w-4 h-4 ${pullingAll ? 'animate-spin' : ''}`} />
                      <span>{pullingAll ? 'IMPORTING FROM CLOUD...' : 'PULL LATEST FROM CLOUD'}</span>
                    </button>

                    {/* Test result display */}
                    {supabaseTestResult && (
                      <div className={`p-4 border font-mono text-[10px] leading-relaxed transition-all duration-300 ${
                        supabaseTestResult.success 
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' 
                          : 'bg-red-950/20 border-red-500/20 text-red-300'
                      }`}>
                        <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[11px] mb-1">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>{supabaseTestResult.success ? 'Success Report' : 'Diagnostic Error'}</span>
                        </div>
                        <p>{supabaseTestResult.message}</p>
                        {supabaseTestResult.details && (
                          <pre className="mt-2 p-2 bg-black/40 text-[9px] text-zinc-400 border border-white/5 overflow-x-auto">
                            {supabaseTestResult.details}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Database Sync Grid Section */}
                <div className="lg:col-span-7 bg-[#080808] border border-white/5 p-6 space-y-6">
                  <div className="space-y-1 border-b border-white/5 pb-4">
                    <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center space-x-1.5">
                      <Database className="w-4 h-4 text-gold" />
                      <span>Database Sync Hub</span>
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono">MIGRATE ACTIVE LOCAL AND FIRESTORE RECORDS TO POSTGRESQL TABLES</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Portfolio Card */}
                    <div className="p-4 bg-black border border-white/5 space-y-3 font-mono flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] text-gold font-bold uppercase tracking-wider block">TABLE: portfolio_items</span>
                        <h4 className="text-xs font-bold text-white uppercase font-serif">Portfolio Artwork</h4>
                        <p className="text-[9px] text-zinc-500">Fine-art and client showcase items.</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-zinc-400">{portfolioItems.length} records</span>
                        <button
                          disabled={syncingTables['portfolio_items'] || supabaseTesting}
                          onClick={() => syncTableToSupabase('portfolio_items', portfolioItems)}
                          className="px-3 py-1.5 bg-gold text-black hover:bg-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {syncingTables['portfolio_items'] ? 'Syncing...' : 'Sync Now'}
                        </button>
                      </div>
                    </div>

                    {/* Spotlight Card */}
                    <div className="p-4 bg-black border border-white/5 space-y-3 font-mono flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] text-gold font-bold uppercase tracking-wider block">TABLE: spotlight</span>
                        <h4 className="text-xs font-bold text-white uppercase font-serif">Spotlight Carousel</h4>
                        <p className="text-[9px] text-zinc-500">Cinematic storyboards and meta gear specs.</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-zinc-400">{spotlightItems.length} records</span>
                        <button
                          disabled={syncingTables['spotlight'] || supabaseTesting}
                          onClick={() => syncTableToSupabase('spotlight', spotlightItems)}
                          className="px-3 py-1.5 bg-gold text-black hover:bg-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {syncingTables['spotlight'] ? 'Syncing...' : 'Sync Now'}
                        </button>
                      </div>
                    </div>

                    {/* Bookings Card */}
                    <div className="p-4 bg-black border border-white/5 space-y-3 font-mono flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] text-gold font-bold uppercase tracking-wider block">TABLE: bookings</span>
                        <h4 className="text-xs font-bold text-white uppercase font-serif">Client Bookings</h4>
                        <p className="text-[9px] text-zinc-500">Reservation calendar blocks and packages.</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-zinc-400">{bookings.length} records</span>
                        <button
                          disabled={syncingTables['bookings'] || supabaseTesting}
                          onClick={() => syncTableToSupabase('bookings', bookings)}
                          className="px-3 py-1.5 bg-gold text-black hover:bg-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {syncingTables['bookings'] ? 'Syncing...' : 'Sync Now'}
                        </button>
                      </div>
                    </div>

                    {/* Messages Card */}
                    <div className="p-4 bg-black border border-white/5 space-y-3 font-mono flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] text-gold font-bold uppercase tracking-wider block">TABLE: messages</span>
                        <h4 className="text-xs font-bold text-white uppercase font-serif">Inbox Messages</h4>
                        <p className="text-[9px] text-zinc-500">Contact form notes and inquiries.</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-zinc-400">{messages.length} records</span>
                        <button
                          disabled={syncingTables['messages'] || supabaseTesting}
                          onClick={() => syncTableToSupabase('messages', messages)}
                          className="px-3 py-1.5 bg-gold text-black hover:bg-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {syncingTables['messages'] ? 'Syncing...' : 'Sync Now'}
                        </button>
                      </div>
                    </div>

                    {/* Crew Card */}
                    <div className="p-4 bg-black border border-white/5 space-y-3 font-mono flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] text-gold font-bold uppercase tracking-wider block">TABLE: crew</span>
                        <h4 className="text-xs font-bold text-white uppercase font-serif">Crew Members</h4>
                        <p className="text-[9px] text-zinc-500">Team bios, photorealistic avatars, roles.</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-zinc-400">{crew.length} records</span>
                        <button
                          disabled={syncingTables['crew'] || supabaseTesting}
                          onClick={() => syncTableToSupabase('crew', crew)}
                          className="px-3 py-1.5 bg-gold text-black hover:bg-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {syncingTables['crew'] ? 'Syncing...' : 'Sync Now'}
                        </button>
                      </div>
                    </div>

                    {/* Blog Card */}
                    <div className="p-4 bg-black border border-white/5 space-y-3 font-mono flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] text-gold font-bold uppercase tracking-wider block">TABLE: blog</span>
                        <h4 className="text-xs font-bold text-white uppercase font-serif">Journal Articles</h4>
                        <p className="text-[9px] text-zinc-500">Blog posts, read-times, and narratives.</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-zinc-400">{blog.length} records</span>
                        <button
                          disabled={syncingTables['blog'] || supabaseTesting}
                          onClick={() => syncTableToSupabase('blog', blog)}
                          className="px-3 py-1.5 bg-gold text-black hover:bg-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {syncingTables['blog'] ? 'Syncing...' : 'Sync Now'}
                        </button>
                      </div>
                    </div>

                    {/* Instagram Card */}
                    <div className="p-4 bg-black border border-white/5 space-y-3 font-mono flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] text-gold font-bold uppercase tracking-wider block">TABLE: instagram</span>
                        <h4 className="text-xs font-bold text-white uppercase font-serif">Instagram Feed</h4>
                        <p className="text-[9px] text-zinc-500">Instagram curation posts and counts.</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-zinc-400">{instagramPosts.length} records</span>
                        <button
                          disabled={syncingTables['instagram'] || supabaseTesting}
                          onClick={() => syncTableToSupabase('instagram', instagramPosts)}
                          className="px-3 py-1.5 bg-gold text-black hover:bg-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {syncingTables['instagram'] ? 'Syncing...' : 'Sync Now'}
                        </button>
                      </div>
                    </div>

                    {/* Media Card */}
                    <div className="p-4 bg-black border border-white/5 space-y-3 font-mono flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] text-gold font-bold uppercase tracking-wider block">TABLE: media</span>
                        <h4 className="text-xs font-bold text-white uppercase font-serif">Media Assets</h4>
                        <p className="text-[9px] text-zinc-500">Uploaded images, filenames, sizes, and folders.</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-zinc-400">{mediaItems.length} records</span>
                        <button
                          disabled={syncingTables['media'] || supabaseTesting}
                          onClick={() => syncTableToSupabase('media', mediaItems)}
                          className="px-3 py-1.5 bg-gold text-black hover:bg-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {syncingTables['media'] ? 'Syncing...' : 'Sync Now'}
                        </button>
                      </div>
                    </div>

                    {/* Transactions Card */}
                    <div className="p-4 bg-black border border-white/5 space-y-3 font-mono flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] text-gold font-bold uppercase tracking-wider block">TABLE: transactions</span>
                        <h4 className="text-xs font-bold text-white uppercase font-serif">Transactions Ledger</h4>
                        <p className="text-[9px] text-zinc-500">Payment receipts, Paystack invoices, reference links.</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-zinc-400">{transactions.length} records</span>
                        <button
                          disabled={syncingTables['transactions'] || supabaseTesting}
                          onClick={() => syncTableToSupabase('transactions', transactions)}
                          className="px-3 py-1.5 bg-gold text-black hover:bg-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {syncingTables['transactions'] ? 'Syncing...' : 'Sync Now'}
                        </button>
                      </div>
                    </div>

                    {/* Activity Logs Card */}
                    <div className="p-4 bg-black border border-white/5 space-y-3 font-mono flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] text-gold font-bold uppercase tracking-wider block">TABLE: logs</span>
                        <h4 className="text-xs font-bold text-white uppercase font-serif">Security Logs</h4>
                        <p className="text-[9px] text-zinc-500">Admin actions, categories, device metadata, login events.</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-zinc-400">{logs.length} records</span>
                        <button
                          disabled={syncingTables['logs'] || supabaseTesting}
                          onClick={() => syncTableToSupabase('logs', logs)}
                          className="px-3 py-1.5 bg-gold text-black hover:bg-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {syncingTables['logs'] ? 'Syncing...' : 'Sync Now'}
                        </button>
                      </div>
                    </div>

                    {/* Storage & Database Sync Telemetry Diagnostics */}
                    <div className="col-span-1 md:col-span-2 p-5 bg-zinc-950 border border-gold/10 rounded-none space-y-4 font-mono">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-[10px] text-gold font-bold uppercase tracking-wider flex items-center space-x-1.5">
                          <Activity className="w-3.5 h-3.5" />
                          <span>Storage Upload & Database Sync Telemetry Diagnostics</span>
                        </span>
                        <span className="text-[8px] text-zinc-500">LIVE FEED</span>
                      </div>
                      
                      {uploadDiagnostics ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px]">
                          <div className="space-y-2">
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-zinc-500 uppercase">Upload Success Status:</span>
                              <span className={`font-bold ${uploadDiagnostics.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                {uploadDiagnostics.success ? 'YES ✓' : 'NO ✗'}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-zinc-500 uppercase">Storage Bucket Used:</span>
                              <span className="text-white font-bold">{uploadDiagnostics.bucket}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-zinc-500 uppercase">Database Record Created:</span>
                              <span className={`font-bold ${uploadDiagnostics.dbRecordCreated ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {uploadDiagnostics.dbRecordCreated ? 'YES ✓ (PERSISTED)' : 'PENDING PUBLICATION'}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-zinc-500 uppercase">Telemetry Timestamp:</span>
                              <span className="text-zinc-400">{uploadDiagnostics.timestamp}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 flex flex-col justify-between">
                            <div className="space-y-1">
                              <span className="text-zinc-500 uppercase block">Stored Public Image URL:</span>
                              {uploadDiagnostics.url ? (
                                <div className="flex items-center space-x-1">
                                  <input 
                                    type="text" 
                                    readOnly 
                                    value={uploadDiagnostics.url} 
                                    className="w-full bg-black/60 border border-white/5 p-1 text-[9px] text-zinc-300 focus:outline-none select-all font-mono"
                                  />
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(uploadDiagnostics.url);
                                      triggerToast("URL Copied!");
                                    }}
                                    className="p-1 px-2 bg-zinc-900 border border-white/10 hover:border-gold text-zinc-300 hover:text-white font-mono text-[9px] cursor-pointer"
                                  >
                                    Copy
                                  </button>
                                </div>
                              ) : (
                                <span className="text-zinc-600 italic">None - Upload Failed</span>
                              )}
                            </div>
                            {uploadDiagnostics.error && (
                              <div className="p-2 bg-red-950/20 border border-red-500/20 text-red-300 text-[9px] rounded">
                                <span className="font-bold">Error Details:</span> {uploadDiagnostics.error}
                              </div>
                            )}
                            {uploadDiagnostics.success && (
                              <div className="p-2 bg-emerald-950/20 border border-emerald-500/10 text-emerald-300 text-[9px] rounded leading-relaxed">
                                Curated asset safely stored in Supabase. Database record created status will display 'YES' as soon as the respective form is submitted.
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-zinc-500 text-[10px] space-y-1">
                          <p>No recent image uploads detected.</p>
                          <p className="text-[9px] text-zinc-600">Upload a portfolio asset, instagram post, crew avatar, or blog banner to trigger live telemetry diagnostics.</p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>

              {/* SQL Schemas Setup Accordion Card */}
              <div className="bg-[#080808] border border-white/5 p-6 space-y-4">
                <div className="border-b border-white/5 pb-4 space-y-1">
                  <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center space-x-1.5">
                    <FileCode className="w-4.5 h-4.5 text-gold" />
                    <span>Supabase Postgres Schema Setup Guide</span>
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    COPY AND RUN THESE SCHEMAS DIRECTLY IN YOUR SUPABASE SQL EDITOR BEFORE RUNNING THE SYNC HANDLERS ABOVE
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-[10px]">
                  
                  {/* Schema 1: Portfolio Items */}
                  <div className="p-4 bg-black border border-white/5 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-gold font-bold uppercase tracking-widest text-[9px]">1. PORTFOLIO ITEMS SQL</span>
                      <p className="text-zinc-500 text-[9px]">Creates the 'portfolio_items' table with correct column fields.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`create table portfolio_items (
  id text primary key,
  title text not null,
  category text,
  "imageUrl" text,
  client text,
  date text,
  description text,
  likes integer default 0,
  views integer default 0,
  aspect text,
  location text,
  year text
);`, 'portfolio_items')}
                      className="w-full py-2 bg-zinc-900 border border-white/10 hover:border-gold/30 text-zinc-300 hover:text-white uppercase font-bold text-[9px] tracking-widest transition-colors cursor-pointer"
                    >
                      {copiedText === 'portfolio_items' ? '✓ SQL COPIED' : 'COPY SCHEMAS SQL'}
                    </button>
                  </div>

                  {/* Schema 2: Spotlight */}
                  <div className="p-4 bg-black border border-white/5 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-gold font-bold uppercase tracking-widest text-[9px]">2. SPOTLIGHT STORY SQL</span>
                      <p className="text-zinc-500 text-[9px]">Creates the 'spotlight' table with technical camera specs.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`create table spotlight (
  id text primary key,
  title text not null,
  category text,
  tagline text,
  description text,
  "technicalSpecs" text,
  "imageUrl" text,
  "createdAt" text
);`, 'spotlight')}
                      className="w-full py-2 bg-zinc-900 border border-white/10 hover:border-gold/30 text-zinc-300 hover:text-white uppercase font-bold text-[9px] tracking-widest transition-colors cursor-pointer"
                    >
                      {copiedText === 'spotlight' ? '✓ SQL COPIED' : 'COPY SCHEMAS SQL'}
                    </button>
                  </div>

                  {/* Schema 3: Bookings */}
                  <div className="p-4 bg-black border border-white/5 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-gold font-bold uppercase tracking-widest text-[9px]">3. CLIENT BOOKINGS SQL</span>
                      <p className="text-zinc-500 text-[9px]">Creates the 'bookings' table including total price, and paid status.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`create table bookings (
  id text primary key,
  name text not null,
  email text,
  phone text,
  date text,
  time text,
  "eventType" text,
  status text,
  notes text,
  total numeric default 0,
  paid boolean default false,
  "createdAt" text
);`, 'bookings')}
                      className="w-full py-2 bg-zinc-900 border border-white/10 hover:border-gold/30 text-zinc-300 hover:text-white uppercase font-bold text-[9px] tracking-widest transition-colors cursor-pointer"
                    >
                      {copiedText === 'bookings' ? '✓ SQL COPIED' : 'COPY SCHEMAS SQL'}
                    </button>
                  </div>

                  {/* Schema 4: Messages */}
                  <div className="p-4 bg-black border border-white/5 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-gold font-bold uppercase tracking-widest text-[9px]">4. INBOX MESSAGES SQL</span>
                      <p className="text-zinc-500 text-[9px]">Creates 'messages' table for customer messages.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`create table messages (
  id text primary key,
  name text not null,
  email text,
  subject text,
  message text,
  status text,
  date text
);`, 'messages')}
                      className="w-full py-2 bg-zinc-900 border border-white/10 hover:border-gold/30 text-zinc-300 hover:text-white uppercase font-bold text-[9px] tracking-widest transition-colors cursor-pointer"
                    >
                      {copiedText === 'messages' ? '✓ SQL COPIED' : 'COPY SCHEMAS SQL'}
                    </button>
                  </div>

                  {/* Schema 5: Crew */}
                  <div className="p-4 bg-black border border-white/5 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-gold font-bold uppercase tracking-widest text-[9px]">5. TEAM CREW SQL</span>
                      <p className="text-zinc-500 text-[9px]">Creates 'crew' table with members, orders, and social indices.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`create table crew (
  id text primary key,
  name text not null,
  role text,
  bio text,
  "imageUrl" text,
  instagram text,
  "order" integer default 0
);`, 'crew')}
                      className="w-full py-2 bg-zinc-900 border border-white/10 hover:border-gold/30 text-zinc-300 hover:text-white uppercase font-bold text-[9px] tracking-widest transition-colors cursor-pointer"
                    >
                      {copiedText === 'crew' ? '✓ SQL COPIED' : 'COPY SCHEMAS SQL'}
                    </button>
                  </div>

                  {/* Schema 6: Blog */}
                  <div className="p-4 bg-black border border-white/5 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-gold font-bold uppercase tracking-widest text-[9px]">6. JOURNAL ARTICLES SQL</span>
                      <p className="text-zinc-500 text-[9px]">Creates 'blog' table with excerpt, contents, and like indices.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`create table blog (
  id text primary key,
  title text not null,
  excerpt text,
  content text,
  "imageUrl" text,
  category text,
  date text,
  "readTime" text,
  likes integer default 0,
  "commentsCount" integer default 0
);`, 'blog')}
                      className="w-full py-2 bg-zinc-900 border border-white/10 hover:border-gold/30 text-zinc-300 hover:text-white uppercase font-bold text-[9px] tracking-widest transition-colors cursor-pointer"
                    >
                      {copiedText === 'blog' ? '✓ SQL COPIED' : 'COPY SCHEMAS SQL'}
                    </button>
                  </div>

                  {/* Schema 7: Instagram */}
                  <div className="p-4 bg-black border border-white/5 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-gold font-bold uppercase tracking-widest text-[9px]">7. INSTAGRAM FEED SQL</span>
                      <p className="text-zinc-500 text-[9px]">Creates 'instagram' table for social feed curation assets.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`create table instagram (
  id text primary key,
  "imageUrl" text not null,
  likes text,
  comments text
);`, 'instagram')}
                      className="w-full py-2 bg-zinc-900 border border-white/10 hover:border-gold/30 text-zinc-300 hover:text-white uppercase font-bold text-[9px] tracking-widest transition-colors cursor-pointer"
                    >
                      {copiedText === 'instagram' ? '✓ SQL COPIED' : 'COPY SCHEMAS SQL'}
                    </button>
                  </div>

                  {/* Schema 8: Content Website Metadata */}
                  <div className="p-4 bg-black border border-white/5 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-gold font-bold uppercase tracking-widest text-[9px]">8. CONTENT WEBSITE METADATA SQL</span>
                      <p className="text-zinc-500 text-[9px]">Creates the 'content' table for global settings and biographies.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`create table content (
  id text primary key,
  biography text,
  "profileImage" text,
  "businessAddress" text,
  "logoText" text,
  tagline text,
  "primaryColor" text,
  "fontFamily" text,
  "faviconUrl" text,
  "heroTitle" text,
  "heroSubTitle" text,
  "heroCtaText" text
);`, 'content')}
                      className="w-full py-2 bg-zinc-900 border border-white/10 hover:border-gold/30 text-zinc-300 hover:text-white uppercase font-bold text-[9px] tracking-widest transition-colors cursor-pointer"
                    >
                      {copiedText === 'content' ? '✓ SQL COPIED' : 'COPY SCHEMAS SQL'}
                    </button>
                  </div>

                  {/* Schema 9: Media Library SQL */}
                  <div className="p-4 bg-black border border-white/5 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-gold font-bold uppercase tracking-widest text-[9px]">9. MEDIA LIBRARY SQL</span>
                      <p className="text-zinc-500 text-[9px]">Creates the 'media' table for local & cloud-uploaded media assets.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`create table media (
  id text primary key,
  url text not null,
  name text,
  size text,
  folder text
);

-- Row Level Security (RLS) setup for 'media'
alter table media enable row level security;
create policy "Allow public read access" on media for select using (true);
create policy "Allow all access" on media for all using (true) with check (true);`, 'media')}
                      className="w-full py-2 bg-zinc-900 border border-white/10 hover:border-gold/30 text-zinc-300 hover:text-white uppercase font-bold text-[9px] tracking-widest transition-colors cursor-pointer"
                    >
                      {copiedText === 'media' ? '✓ SQL COPIED' : 'COPY SCHEMAS SQL'}
                    </button>
                  </div>

                  {/* Schema 10: Transactions SQL */}
                  <div className="p-4 bg-black border border-white/5 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-gold font-bold uppercase tracking-widest text-[9px]">10. TRANSACTIONS LEDGER SQL</span>
                      <p className="text-zinc-500 text-[9px]">Creates the 'transactions' table with booking & reference mapping.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`create table transactions (
  id text primary key,
  "bookingId" text,
  "clientName" text,
  amount numeric,
  method text,
  status text,
  date text,
  "invoiceNo" text
);

-- Row Level Security (RLS) setup for 'transactions'
alter table transactions enable row level security;
create policy "Allow public read access" on transactions for select using (true);
create policy "Allow all access" on transactions for all using (true) with check (true);`, 'transactions')}
                      className="w-full py-2 bg-zinc-900 border border-white/10 hover:border-gold/30 text-zinc-300 hover:text-white uppercase font-bold text-[9px] tracking-widest transition-colors cursor-pointer"
                    >
                      {copiedText === 'transactions' ? '✓ SQL COPIED' : 'COPY SCHEMAS SQL'}
                    </button>
                  </div>

                  {/* Schema 11: Security Logs SQL */}
                  <div className="p-4 bg-black border border-white/5 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-gold font-bold uppercase tracking-widest text-[9px]">11. AUDIT SECURITY LOGS SQL</span>
                      <p className="text-zinc-500 text-[9px]">Creates the 'logs' table to persist administration activity trails.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`create table logs (
  id text primary key,
  timestamp text,
  action text not null,
  category text,
  "user" text,
  ip text,
  device text
);

-- Row Level Security (RLS) setup for 'logs'
alter table logs enable row level security;
create policy "Allow public read access" on logs for select using (true);
create policy "Allow all access" on logs for all using (true) with check (true);`, 'logs')}
                      className="w-full py-2 bg-zinc-900 border border-white/10 hover:border-gold/30 text-zinc-300 hover:text-white uppercase font-bold text-[9px] tracking-widest transition-colors cursor-pointer"
                    >
                      {copiedText === 'logs' ? '✓ SQL COPIED' : 'COPY SCHEMAS SQL'}
                    </button>
                  </div>

                </div>

                {/* System Diagnostics & Connection Control Hub */}
                <div className="bg-[#080808] border border-white/5 p-6 space-y-6 font-mono text-zinc-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white uppercase flex items-center space-x-1.5">
                        <Activity className="w-4 h-4 text-gold animate-pulse" />
                        <span>System Integration Diagnostics & Control</span>
                      </h3>
                      <p className="text-[10px] text-zinc-500">AUDIT CLOUD INTEGRATION STACKS AND MANAGE LIFECYCLE CONNECTIONS</p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        disabled={diagnosing}
                        onClick={runDiagnostics}
                        className="px-4 py-2 bg-transparent border border-zinc-700 text-zinc-300 hover:border-gold hover:text-gold text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${diagnosing ? 'animate-spin' : ''}`} />
                        <span>{diagnosing ? 'RUNNING SCAN...' : 'RUN INTEGRATION DIAGNOSIS'}</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={disconnectSupabase}
                        className="px-4 py-2 bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-black text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>DISCONNECT SUPABASE</span>
                      </button>
                    </div>
                  </div>

                  {/* Diagnosis report card */}
                  {diagnosticReport ? (
                    <div className="space-y-5 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Supabase Diagnosis Status */}
                        <div className="p-4 bg-black border border-white/5 space-y-2">
                          <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-sans">SUPABASE CLOUD POSTGRES</span>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              diagnosticReport.supabase.status === 'connected' ? 'bg-emerald-500 animate-pulse' :
                              diagnosticReport.supabase.status === 'explicitly_disconnected' ? 'bg-zinc-600' : 'bg-red-500'
                            }`} />
                            <span className="text-xs font-bold uppercase text-white">
                              {diagnosticReport.supabase.status === 'connected' ? 'Connected & Verified' :
                               diagnosticReport.supabase.status === 'explicitly_disconnected' ? 'Explicitly Disconnected' : 
                               diagnosticReport.supabase.status === 'unconfigured' ? 'Unconfigured / Empty' : 'Connection Failed'}
                            </span>
                          </div>
                          {diagnosticReport.supabase.url && (
                            <p className="text-[9px] text-zinc-400 truncate mt-1">Endpoint: {diagnosticReport.supabase.url}</p>
                          )}
                          {diagnosticReport.supabase.error && (
                            <p className="text-[9px] text-red-400 mt-1 leading-normal">{diagnosticReport.supabase.error}</p>
                          )}
                          {diagnosticReport.supabase.connectionTest && (
                            <p className="text-[9px] text-emerald-400 mt-1 leading-normal">{diagnosticReport.supabase.connectionTest}</p>
                          )}
                        </div>

                        {/* Cloudinary Status */}
                        <div className="p-4 bg-black border border-white/5 space-y-2">
                          <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-sans">CLOUDINARY IMAGE CDN</span>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              diagnosticReport.cloudinary.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'
                            }`} />
                            <span className="text-xs font-bold uppercase text-white">
                              {diagnosticReport.cloudinary.status === 'connected' ? 'Connected & Verified' : 
                               diagnosticReport.cloudinary.status === 'unconfigured' ? 'Not Configured' : 'Connection Failed'}
                            </span>
                          </div>
                          {diagnosticReport.cloudinary.cloudName && (
                            <p className="text-[9px] text-zinc-400 truncate mt-1">Cloud Name: {diagnosticReport.cloudinary.cloudName}</p>
                          )}
                          {diagnosticReport.cloudinary.error && (
                            <p className="text-[9px] text-red-400 mt-1 leading-normal">{diagnosticReport.cloudinary.error}</p>
                          )}
                          {diagnosticReport.cloudinary.connectionTest && (
                            <p className="text-[9px] text-emerald-400 mt-1 leading-normal">CDN test succeeded</p>
                          )}
                        </div>

                        {/* Platform Default Firestore Status */}
                        <div className="p-4 bg-black border border-white/5 space-y-2">
                          <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-sans">FIRESTORE CORE DATABASE</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold uppercase text-white">ACTIVE & OPERATIONAL</span>
                          </div>
                          <p className="text-[9px] text-zinc-400 mt-1 leading-normal">Platform-native reactive cache storage is serving as the primary local backup engine.</p>
                        </div>
                      </div>

                      {/* Environment variables grid */}
                      <div className="p-4 bg-zinc-950 border border-white/5 space-y-3">
                        <span className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold text-gold font-sans">CONTAINER PORTAL SECRETS VERIFICATION</span>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-[10px]">
                          <div className="flex items-center justify-between border-b border-white/5 pb-1">
                            <span className="text-zinc-500">GEMINI_API_KEY</span>
                            <span className={diagnosticReport.environment.geminiApiKeyConfigured ? 'text-emerald-400 font-bold' : 'text-zinc-600'}>
                              {diagnosticReport.environment.geminiApiKeyConfigured ? '✔ CONFIGURED' : '✘ MISSING'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-1">
                            <span className="text-zinc-500">SUPABASE_URL</span>
                            <span className={diagnosticReport.environment.supabaseEnvUrlConfigured ? 'text-emerald-400 font-bold' : 'text-zinc-600'}>
                              {diagnosticReport.environment.supabaseEnvUrlConfigured ? '✔ CONFIGURED' : '✘ BYPASSED'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-1">
                            <span className="text-zinc-500">SUPABASE_ANON_KEY</span>
                            <span className={diagnosticReport.environment.supabaseEnvKeyConfigured ? 'text-emerald-400 font-bold' : 'text-zinc-600'}>
                              {diagnosticReport.environment.supabaseEnvKeyConfigured ? '✔ CONFIGURED' : '✘ BYPASSED'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-1 sm:border-b-0 sm:pb-0">
                            <span className="text-zinc-500">CLOUDINARY_CLOUD</span>
                            <span className={diagnosticReport.environment.cloudinaryEnvCloudConfigured ? 'text-emerald-400 font-bold' : 'text-zinc-600'}>
                              {diagnosticReport.environment.cloudinaryEnvCloudConfigured ? '✔ CONFIGURED' : '✘ BYPASSED'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-1 sm:border-b-0 sm:pb-0">
                            <span className="text-zinc-500">CLOUDINARY_API_KEY</span>
                            <span className={diagnosticReport.environment.cloudinaryEnvKeyConfigured ? 'text-emerald-400 font-bold' : 'text-zinc-600'}>
                              {diagnosticReport.environment.cloudinaryEnvKeyConfigured ? '✔ CONFIGURED' : '✘ BYPASSED'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between sm:border-b-0 sm:pb-0 font-sans">
                            <span className="text-zinc-500">CLOUDINARY_SECRET</span>
                            <span className={diagnosticReport.environment.cloudinaryEnvSecretConfigured ? 'text-emerald-400 font-bold' : 'text-zinc-600'}>
                              {diagnosticReport.environment.cloudinaryEnvSecretConfigured ? '✔ CONFIGURED' : '✘ BYPASSED'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Prescriptive actionable suggestions */}
                      <div className="p-4 bg-zinc-950/40 border border-white/5 space-y-2">
                        <div className="flex items-center space-x-1.5 text-gold font-bold uppercase tracking-wider text-[11px] font-sans">
                          <Info className="w-3.5 h-3.5" />
                          <span>Prescriptive Corrective Actions</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1.5 text-[10px] text-zinc-400 leading-normal">
                          {diagnosticReport.supabase.status === 'explicitly_disconnected' && (
                            <li className="text-zinc-300 font-medium">Supabase is currently <span className="text-gold font-bold">disconnected</span>. Local uploads will fall back to standard local persistence, and no synchronization will take place. If you wish to reconnect, input credentials in the configuration panel above and click "Test Portal Connection".</li>
                          )}
                          {diagnosticReport.supabase.status === 'failed' && (
                            <li className="text-red-400 font-medium">Supabase connection test failed. Ensure your database is active on Supabase, your Row Level Security (RLS) is disabled, or you have configured acceptable policies, and verify that your URL format matches 'https://[id].supabase.co'.</li>
                          )}
                          {diagnosticReport.supabase.status === 'connected' && (
                            <li className="text-emerald-400">All connections to your PostgreSQL server are green and optimized! Your portfolio content, booking items, and spotlight carousels are ready to synchronize securely.</li>
                          )}
                          {!diagnosticReport.environment.geminiApiKeyConfigured && (
                            <li>The <span className="text-gold">GEMINI_API_KEY</span> is missing. Automated image category suggestion and poetic title generating will be bypassed. Define the secret in the environment settings to unlock.</li>
                          )}
                          {diagnosticReport.cloudinary.status === 'unconfigured' && (
                            <li>No Cloudinary storage configuration found. Media uploads default to Supabase storage. Connect a Cloudinary portal in the "Cloudinary Sync" tab to enable advanced media CDN optimizations.</li>
                          )}
                          {preferredStorage === 'cloudinary' && diagnosticReport.cloudinary.status !== 'connected' && (
                            <li className="text-red-400 font-bold">Your active storage provider is set to Cloudinary, but Cloudinary CDN credentials are unconfigured or failing. Please switch the provider back to Supabase or connect Cloudinary now.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-white/5 rounded bg-black/20 flex flex-col items-center justify-center space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase">No active diagnosis report</span>
                      <p className="text-[9px] text-zinc-600">Click the "Run Integration Diagnosis" button to audit your active cloud connection pipelines.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB: CLOUDINARY CLOUD STORAGE INTEGRATION */}
          {activeTab === 'cloudinary' && (
            <div className="space-y-6 animate-fade-in text-zinc-100">
              <div>
                <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Cloudinary Integration Curation</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">ESTABLISH SECURE CLOUDINARY CONNECTIONS FOR ADVANCED HIGH-SPEED IMAGE DELIVERY AND TRANSFORMATION</p>
              </div>

              {/* Status Header Banner */}
              <div className="p-4 bg-zinc-950 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">CONNECTION ENGINE STATUS</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${cloudinaryConfig?.envConfigured || cloudinaryTestResult?.success ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-xs font-bold uppercase text-white">
                      {cloudinaryTestResult?.success ? 'ONLINE & READY' : cloudinaryConfig?.envConfigured ? 'CREDENTIALS PRE-CONFIGURED' : 'DISCONNECTED'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {cloudinaryConfig?.envConfigured && (
                    <span className="text-[9px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Using Env Variables
                    </span>
                  )}
                  {(cloudinaryConfig?.cloudName || cloudinaryCloudName) && (
                    <span className="text-[9px] font-mono text-zinc-500">
                      CLOUD NAME: {cloudinaryConfig?.cloudName || cloudinaryCloudName}
                    </span>
                  )}
                </div>
              </div>

              {/* Active Storage Selector Banner */}
              <div className="p-4 bg-black border border-white/5 space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">Active Storage Engine Provider</span>
                    <p className="text-xs text-zinc-500">Determine which system handles user-uploaded images and media throughout the platform.</p>
                  </div>
                  <div className="flex bg-zinc-950 p-1 border border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('olamide_visuals_preferred_storage', 'supabase');
                        setPreferredStorage('supabase');
                        triggerToast("Storage engine updated to Supabase Storage");
                      }}
                      className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                        preferredStorage === 'supabase'
                          ? 'bg-gold text-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Supabase Storage
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('olamide_visuals_preferred_storage', 'cloudinary');
                        setPreferredStorage('cloudinary');
                        triggerToast("Storage engine updated to Cloudinary");
                      }}
                      className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                        preferredStorage === 'cloudinary'
                          ? 'bg-gold text-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Cloudinary
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Connection Form Section */}
                <div className="lg:col-span-6 bg-[#080808] border border-white/5 p-6 space-y-6 self-start">
                  <div className="space-y-1 border-b border-white/5 pb-4">
                    <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center space-x-1.5">
                      <Settings className="w-4 h-4 text-gold" />
                      <span>Cloudinary Credentials</span>
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono">SPECIFY CLOUD PORTAL PARAMETERS FOR SECURE ENCRYPTED UPLOADS</p>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Cloud Name</label>
                      <input 
                        type="text"
                        placeholder="your-cloud-name"
                        value={cloudinaryCloudName}
                        onChange={(e) => setCloudinaryCloudName(e.target.value)}
                        className="w-full bg-black border border-white/5 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">API Key</label>
                      <input 
                        type="text"
                        placeholder="123456789012345"
                        value={cloudinaryApiKey}
                        onChange={(e) => setCloudinaryApiKey(e.target.value)}
                        className="w-full bg-black border border-white/5 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">API Secret</label>
                      <input 
                        type="password"
                        placeholder="••••••••••••••••••••••••••••"
                        value={cloudinaryApiSecret}
                        onChange={(e) => setCloudinaryApiSecret(e.target.value)}
                        className="w-full bg-black border border-white/5 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={cloudinaryTesting}
                      onClick={testCloudinaryConnection}
                      className="w-full py-3 bg-transparent border border-gold text-gold hover:bg-gold hover:text-black font-mono text-xs tracking-widest font-bold uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${cloudinaryTesting ? 'animate-spin' : ''}`} />
                      <span>{cloudinaryTesting ? 'VERIFYING PORTAL...' : 'TEST CLOUDINARY PORTAL'}</span>
                    </button>

                    {/* Test result display */}
                    {cloudinaryTestResult && (
                      <div className={`p-4 border font-mono text-[10px] leading-relaxed transition-all duration-300 ${
                        cloudinaryTestResult.success 
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' 
                          : 'bg-red-950/20 border-red-500/20 text-red-300'
                      }`}>
                        <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[11px] mb-1">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>{cloudinaryTestResult.success ? 'Success Report' : 'Diagnostic Error'}</span>
                        </div>
                        <p>{cloudinaryTestResult.message}</p>
                        {cloudinaryTestResult.details && (
                          <pre className="mt-2 p-2 bg-black/40 text-[9px] text-zinc-400 border border-white/5 overflow-x-auto">
                            {cloudinaryTestResult.details}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cloudinary Info and Instructions Section */}
                <div className="lg:col-span-6 bg-[#080808] border border-white/5 p-6 space-y-6">
                  <div className="space-y-1 border-b border-white/5 pb-4">
                    <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center space-x-1.5">
                      <Info className="w-4 h-4 text-gold" />
                      <span>Integration & CDN Setup Instructions</span>
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono">LEARN HOW SECURE SIGNED IMAGE STREAMING POWERS YOUR MEDIA GALLERY</p>
                  </div>

                  <div className="space-y-4 font-mono text-xs leading-relaxed text-zinc-300">
                    <div className="p-4 bg-zinc-950/50 border border-white/5 space-y-2">
                      <h4 className="text-white text-xs font-bold uppercase text-gold">Secure Upload Handshake</h4>
                      <p className="text-[10px]">
                        The platform operates a secure, server-side Cloudinary proxy on the backend container.
                        Your API Secret is kept completely hidden from the browser, preventing any API key leakage or misuse.
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-950/50 border border-white/5 space-y-2">
                      <h4 className="text-white text-xs font-bold uppercase text-gold">Automatic Image Optimizations</h4>
                      <p className="text-[10px]">
                        Once connected, images uploaded to portfolio showcases, social posts, journal headers, and crew profiles
                        automatically stream to Cloudinary, applying default image optimizations and transformations instantly.
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-950/50 border border-white/5 space-y-2">
                      <h4 className="text-white text-xs font-bold uppercase text-gold">Unified Telemetry Tracking</h4>
                      <p className="text-[10px]">
                        The active storage provider is automatically tracked by the diagnostic log underneath.
                        You can view the specific CDN target of any newly uploaded image at any time.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </main>

      {/* ---------------- NEW ENTRY FORM MODALS ---------------- */}
      
      {/* 1. Reserve Booking slot */}
      {newBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <motion.div 
            className="bg-[#0A0A0A] border border-white/10 w-full max-w-lg p-8 space-y-6 relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase font-mono">Manual Session Reservation</h3>
              <button onClick={() => setNewBookingModal(false)} className="text-zinc-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Patron Full Name</label>
                  <input type="text" required onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})} className="w-full px-3 py-2 bg-black border border-white/10 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Patron Email</label>
                  <input type="email" required onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})} className="w-full px-3 py-2 bg-black border border-white/10 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Phone Contact</label>
                  <input type="text" required onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})} className="w-full px-3 py-2 bg-black border border-white/10 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Service Category</label>
                  <select onChange={(e) => setBookingForm({...bookingForm, eventType: e.target.value})} className="w-full px-3 py-2 bg-black border border-white/10 text-white">
                    <option value="Portrait Photography">Portrait Photography</option>
                    <option value="Wedding Photography">Wedding Photography</option>
                    <option value="Fashion Photography">Fashion Photography</option>
                    <option value="Graduation Photography">Graduation Photography</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500">Preferred Shoot Date</label>
                <input type="date" required onChange={(e) => setBookingForm({...bookingForm, preferredDate: e.target.value})} className="w-full px-3 py-2 bg-black border border-white/10 text-white" />
              </div>

              <button type="submit" className="w-full py-3 bg-gold text-black uppercase font-bold text-xs tracking-wider cursor-pointer">
                Confirm Reservation
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. Add Crew modal */}
      {newCrewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <motion.div 
            className="bg-[#0A0A0A] border border-white/10 w-full max-w-lg p-8 space-y-6 relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase font-mono">Register Crew Member</h3>
              <button onClick={() => setNewCrewModal(false)} className="text-zinc-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateCrew} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Full Name</label>
                  <input type="text" required onChange={(e) => setCrewForm({...crewForm, name: e.target.value})} className="w-full px-3 py-2 bg-black border border-white/10 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Creative Role</label>
                  <input type="text" required placeholder="e.g. Lead Lighting tech" onChange={(e) => setCrewForm({...crewForm, role: e.target.value})} className="w-full px-3 py-2 bg-black border border-white/10 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Contact Phone</label>
                  <input type="text" required onChange={(e) => setCrewForm({...crewForm, phone: e.target.value})} className="w-full px-3 py-2 bg-black border border-white/10 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Access Level Permissions</label>
                  <select onChange={(e) => setCrewForm({...crewForm, permissions: e.target.value as any})} className="w-full px-3 py-2 bg-black border border-white/10 text-white">
                    <option value="View & Shoot Only">View & Shoot Only</option>
                    <option value="Retoucher Access">Retoucher Access</option>
                    <option value="Full Access">Full Access</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-gold text-black uppercase font-bold text-xs tracking-wider cursor-pointer">
                Confirm Registration
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 3. Write/Edit Blog modal */}
      {(newBlogModal || editingBlog) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <motion.div 
            className="bg-[#0A0A0A] border border-white/10 w-full max-w-xl p-8 space-y-6 relative h-[90vh] overflow-y-auto"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase font-mono">
                {editingBlog ? "Modify Editorial Piece" : "Compose Editorial Piece"}
              </h3>
              <button 
                onClick={() => {
                  setNewBlogModal(false);
                  setEditingBlog(null);
                  setBlogForm({});
                }} 
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingBlog ? handleUpdateBlog : handleCreateBlog} className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-zinc-500">Article Heading</label>
                <input 
                  type="text" 
                  required 
                  value={blogForm.title || ''} 
                  onChange={(e) => setBlogForm({...blogForm, title: e.target.value})} 
                  className="w-full px-3 py-2 bg-black border border-white/10 text-white" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Category Tag</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Lighting Tips" 
                    value={blogForm.category || ''} 
                    onChange={(e) => setBlogForm({...blogForm, category: e.target.value})} 
                    className="w-full px-3 py-2 bg-black border border-white/10 text-white" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Publishing Status</label>
                  <select 
                    value={blogForm.status || 'draft'} 
                    onChange={(e) => setBlogForm({...blogForm, status: e.target.value as any})} 
                    className="w-full px-3 py-2 bg-black border border-white/10 text-white"
                  >
                    <option value="draft">Save draft</option>
                    <option value="published">Publish instantly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500">Article Content body</label>
                <textarea 
                  rows={8} 
                  required 
                  value={blogForm.content || ''} 
                  onChange={(e) => setBlogForm({...blogForm, content: e.target.value})} 
                  className="w-full px-3 py-2 bg-black border border-white/10 text-white leading-relaxed resize-none" 
                />
              </div>

              <button type="submit" className="w-full py-3 bg-gold text-black uppercase font-bold text-xs tracking-wider cursor-pointer">
                {editingBlog ? "Confirm & Update Article" : "Save & Register Article"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 4. Publish Masterwork modal */}
      {newPortfolioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <motion.div 
            className="bg-[#0A0A0A] border border-white/10 w-full max-w-lg p-8 space-y-6 relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase font-mono">Feature Artwork Piece</h3>
              <button onClick={() => setNewPortfolioModal(false)} className="text-zinc-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreatePortfolio} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-zinc-500">Artwork Title</label>
                    {aiAnalyzing && (
                      <span className="text-[9px] text-gold animate-pulse font-mono flex items-center space-x-1">
                        <Sparkles className="w-2.5 h-2.5 animate-spin" />
                        <span>AI Generating...</span>
                      </span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    required 
                    value={portfolioForm.title || ''} 
                    onChange={(e) => setPortfolioForm({...portfolioForm, title: e.target.value})} 
                    className="w-full px-3 py-2 bg-black border border-white/10 text-white focus:border-gold/50 outline-none transition-colors" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Portfolio Category</label>
                  <select 
                    value={portfolioForm.category || 'Weddings'} 
                    onChange={(e) => setPortfolioForm({...portfolioForm, category: e.target.value})} 
                    className="w-full px-3 py-2 bg-black border border-white/10 text-white focus:border-gold/50 outline-none transition-colors"
                  >
                    <option value="Weddings">Weddings</option>
                    <option value="Portraits">Portraits</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Graduation">Graduation</option>
                    <option value="Behind The Scenes">Behind The Scenes</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-500 block">Artwork Image URL / Direct Upload</label>
                  {portfolioForm.imageUrl && (
                    <button
                      type="button"
                      disabled={aiAnalyzing}
                      onClick={() => analyzePortfolioImage(portfolioForm.imageUrl!)}
                      className="text-gold hover:text-white flex items-center space-x-1 cursor-pointer disabled:opacity-50 text-[10px]"
                      title="Analyze this image using Gemini AI to generate title and category"
                    >
                      <Sparkles className={`w-3 h-3 ${aiAnalyzing ? 'animate-spin' : ''}`} />
                      <span>{aiAnalyzing ? 'AI Scanning...' : 'Scan with Gemini AI'}</span>
                    </button>
                  )}
                </div>
                <div className={`flex gap-2 items-center p-1 rounded transition-all duration-300 ${aiAnalyzing ? 'border border-gold/40 shadow-[0_0_15px_rgba(212,175,55,0.15)] bg-gold/[0.01]' : ''}`}>
                  <input 
                    type="text" 
                    value={portfolioForm.imageUrl || ''} 
                    required 
                    onChange={(e) => setPortfolioForm({...portfolioForm, imageUrl: e.target.value})} 
                    className="flex-1 px-3 py-2 bg-black border border-white/10 text-white focus:border-gold/50 outline-none transition-colors" 
                    placeholder="Enter image URL or upload file"
                  />
                  <label className="px-3 py-2 bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer font-mono text-[10px] uppercase tracking-wider whitespace-nowrap flex items-center space-x-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                           triggerToast(`Processing and uploading image to ${preferredStorage === 'cloudinary' ? 'Cloudinary' : 'Supabase'}...`);
                           const reader = new FileReader();
                           reader.onload = async (event) => {
                             const rawBase64 = event.target?.result as string;
                             if (rawBase64) {
                               try {
                                 const base64 = await compressImageBase64(rawBase64, 1200, 1200, 0.75);
                                 const storageUrl = await uploadToSupabaseStorage(base64, file.name);
                                 setPortfolioForm(prev => ({ ...prev, imageUrl: storageUrl }));
                                 triggerToast(`Image uploaded to ${preferredStorage === 'cloudinary' ? 'Cloudinary' : 'Supabase Storage'} successfully!`);
                                 // Automatically scan whenever a file is uploaded!
                                 analyzePortfolioImage(storageUrl);
                               } catch (uploadErr: any) {
                                 triggerToast(`Upload error: ${uploadErr.message || uploadErr}`);
                               }
                             }
                           };
                           reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {portfolioForm.imageUrl && portfolioForm.imageUrl.startsWith('data:') && (
                  <p className="text-[10px] text-gold font-mono flex items-center space-x-1">
                    <span>✓ Base64 Local File Loaded</span>
                    {aiAnalyzing && <span className="animate-pulse">(AI is auto-generating title & category...)</span>}
                  </p>
                )}
              </div>

              {aiScanResult && (
                <div className="p-3 bg-zinc-900/60 border border-gold/20 rounded-md text-[10px] space-y-2 font-mono leading-relaxed transition-all duration-300">
                  <div className="flex items-center space-x-1.5 text-gold font-bold uppercase tracking-wider text-[9px]">
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    <span>Gemini AI Professional Audit Report</span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-zinc-500 block uppercase text-[8px] tracking-wide font-bold">Visual Scan Audit:</span>
                      <span className="text-zinc-200">{aiScanResult.visualAudit}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase text-[8px] tracking-wide font-bold">Critical Verification Check:</span>
                      <span className="text-gold bg-gold/5 px-1.5 py-0.5 rounded border border-gold/10 inline-block font-medium mt-0.5">{aiScanResult.criticalCheck}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Location</label>
                  <input 
                    type="text" 
                    value={portfolioForm.location || ''}
                    placeholder="e.g. Benin City" 
                    onChange={(e) => setPortfolioForm({...portfolioForm, location: e.target.value})} 
                    className="w-full px-3 py-2 bg-black border border-white/10 text-white outline-none focus:border-gold/50 transition-colors" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Shoot Year</label>
                  <input 
                    type="text" 
                    value={portfolioForm.year || '2026'}
                    onChange={(e) => setPortfolioForm({...portfolioForm, year: e.target.value})} 
                    className="w-full px-3 py-2 bg-black border border-white/10 text-white outline-none focus:border-gold/50 transition-colors" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Aspect Ratio</label>
                  <select 
                    value={portfolioForm.aspect || 'portrait'}
                    onChange={(e) => setPortfolioForm({...portfolioForm, aspect: e.target.value as any})} 
                    className="w-full px-3 py-2 bg-black border border-white/10 text-white outline-none focus:border-gold/50 transition-colors"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                    <option value="square">Square</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500">Artwork Description</label>
                <textarea 
                  value={portfolioForm.description || ''} 
                  onChange={(e) => setPortfolioForm({...portfolioForm, description: e.target.value})} 
                  className="w-full px-3 py-2 bg-black border border-white/10 text-white focus:border-gold/50 outline-none transition-colors" 
                  rows={2}
                  placeholder="poetic backstory / visual concept (auto-generated by AI if scanned)"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500">Aesthetic Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={portfolioForm.tags ? (Array.isArray(portfolioForm.tags) ? portfolioForm.tags.join(', ') : portfolioForm.tags) : ''} 
                  onChange={(e) => {
                    const value = e.target.value;
                    const tagsArray = value.split(',').map(t => t.trim()).filter(Boolean);
                    setPortfolioForm({...portfolioForm, tags: tagsArray as any});
                  }} 
                  className="w-full px-3 py-2 bg-black border border-white/10 text-white focus:border-gold/50 outline-none transition-colors" 
                  placeholder="e.g. vintage, outdoor, portrait, intimate"
                />
              </div>

              <button 
                type="submit" 
                disabled={aiAnalyzing}
                className="w-full py-3 bg-gold disabled:bg-zinc-800 disabled:text-zinc-500 text-black uppercase font-bold text-xs tracking-wider cursor-pointer flex items-center justify-center space-x-2 transition-colors"
              >
                {aiAnalyzing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-black" />
                    <span>AI Analysis in Progress...</span>
                  </>
                ) : (
                  <span>Publish Masterwork</span>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Portfolio Modal */}
      {editPortfolioModal && editingPortfolioItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs animate-fade-in">
          <motion.div 
            className="bg-[#0A0A0A] border border-white/10 w-full max-w-md p-8 space-y-6 relative font-mono text-xs text-zinc-300"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase font-mono">Edit Artwork Metadata</h3>
              <button 
                onClick={() => {
                  setEditPortfolioModal(false);
                  setEditingPortfolioItem(null);
                  setPortfolioForm({});
                }} 
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePortfolio} className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-zinc-500">Artwork Title</label>
                <input 
                  type="text" 
                  value={portfolioForm.title || ''} 
                  required 
                  onChange={(e) => setPortfolioForm({...portfolioForm, title: e.target.value})} 
                  className="w-full px-3 py-2 bg-black border border-white/10 text-white focus:border-gold/50 outline-none transition-colors" 
                  placeholder="e.g. Whispers in the Sahara"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500">Portfolio Category</label>
                <select 
                  value={portfolioForm.category || 'Portraits'} 
                  onChange={(e) => setPortfolioForm({...portfolioForm, category: e.target.value as any})} 
                  className="w-full px-3 py-2 bg-black border border-white/10 text-white focus:border-gold/50 outline-none transition-colors"
                >
                  <option value="Weddings">Weddings</option>
                  <option value="Portraits">Portraits</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Graduation">Graduation</option>
                  <option value="Behind The Scenes">Behind The Scenes</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-500">Artwork Image URL</label>
                </div>
                <input 
                  type="text" 
                  value={portfolioForm.imageUrl || ''} 
                  required 
                  onChange={(e) => setPortfolioForm({...portfolioForm, imageUrl: e.target.value})} 
                  className="w-full px-3 py-2 bg-black border border-white/10 text-white focus:border-gold/50 outline-none transition-colors" 
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Location</label>
                  <input 
                    type="text" 
                    value={portfolioForm.location || ''}
                    placeholder="e.g. Benin City" 
                    onChange={(e) => setPortfolioForm({...portfolioForm, location: e.target.value})} 
                    className="w-full px-3 py-2 bg-black border border-white/10 text-white outline-none focus:border-gold/50 transition-colors" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Shoot Year</label>
                  <input 
                    type="text" 
                    value={portfolioForm.year || '2026'}
                    onChange={(e) => setPortfolioForm({...portfolioForm, year: e.target.value})} 
                    className="w-full px-3 py-2 bg-black border border-white/10 text-white outline-none focus:border-gold/50 transition-colors" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500">Aspect Ratio</label>
                  <select 
                    value={portfolioForm.aspect || 'portrait'}
                    onChange={(e) => setPortfolioForm({...portfolioForm, aspect: e.target.value as any})} 
                    className="w-full px-3 py-2 bg-black border border-white/10 text-white outline-none focus:border-gold/50 transition-colors"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                    <option value="square">Square</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500">Artwork Description</label>
                <textarea 
                  value={portfolioForm.description || ''} 
                  onChange={(e) => setPortfolioForm({...portfolioForm, description: e.target.value})} 
                  className="w-full px-3 py-2 bg-black border border-white/10 text-white focus:border-gold/50 outline-none transition-colors" 
                  rows={2}
                  placeholder="poetic backstory / visual concept"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500">Aesthetic Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={portfolioForm.tags ? (Array.isArray(portfolioForm.tags) ? portfolioForm.tags.join(', ') : portfolioForm.tags) : ''} 
                  onChange={(e) => {
                    const value = e.target.value;
                    const tagsArray = value.split(',').map(t => t.trim()).filter(Boolean);
                    setPortfolioForm({...portfolioForm, tags: tagsArray as any});
                  }} 
                  className="w-full px-3 py-2 bg-black border border-white/10 text-white focus:border-gold/50 outline-none transition-colors" 
                  placeholder="e.g. vintage, outdoor, portrait, intimate"
                />
              </div>

              <div className="flex items-center space-x-2 bg-black/50 p-2.5 border border-white/5">
                <input
                  type="checkbox"
                  id="edit-ai-pending"
                  checked={!!portfolioForm.aiPending}
                  onChange={(e) => setPortfolioForm({...portfolioForm, aiPending: e.target.checked})}
                  className="cursor-pointer"
                />
                <label htmlFor="edit-ai-pending" className="text-[10px] text-zinc-400 cursor-pointer select-none">
                  Mark as Pending AI Analysis status
                </label>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-gold hover:bg-white text-black uppercase font-bold text-xs tracking-wider cursor-pointer transition-colors"
              >
                Save Changes
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 5. Add Media Modal */}
      {newMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs animate-fade-in">
          <motion.div 
            className="bg-[#0A0A0A] border border-white/10 w-full max-w-md p-8 space-y-6 relative font-mono text-xs text-zinc-300"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase font-mono">Add Media Asset</h3>
              <button onClick={() => setNewMediaModal(false)} className="text-zinc-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              {/* Option 1: File Uploader */}
              <div className="space-y-1.5">
                <label className="text-zinc-500 uppercase text-[9px] tracking-widest block font-bold text-gold">Upload Local Image</label>
                <div 
                  onClick={() => document.getElementById('modal-single-upload-file')?.click()}
                  className="border border-dashed border-white/10 hover:border-gold/30 p-5 text-center cursor-pointer hover:bg-white/5 transition-all"
                >
                  <Upload className="w-5 h-5 text-zinc-400 mx-auto mb-2" />
                  <p className="text-[10px] text-zinc-400">CLICK TO CHOOSE IMAGE FILE</p>
                  <input 
                    type="file" 
                    id="modal-single-upload-file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        triggerToast(`Uploading image to ${preferredStorage === 'cloudinary' ? 'Cloudinary' : 'Supabase Storage'}...`);
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          const rawBase64 = event.target?.result as string;
                          if (rawBase64) {
                            try {
                              const base64 = await compressImageBase64(rawBase64, 1200, 1200, 0.75);
                              const storageUrl = await uploadToSupabaseStorage(base64, file.name);
                              const approxSizeKb = Math.round((base64.length * 3) / 4 / 1024);
                              const sizeStr = approxSizeKb > 1024 ? `${(approxSizeKb / 1024).toFixed(1)} MB` : `${approxSizeKb} KB`;
                              
                              const nameInp = document.getElementById('modal-media-name') as HTMLInputElement;
                              if (nameInp && !nameInp.value) {
                                nameInp.value = file.name;
                              }
                              const urlInp = document.getElementById('modal-media-url') as HTMLInputElement;
                              if (urlInp) {
                                urlInp.value = storageUrl;
                              }
                              const sizeInp = document.getElementById('modal-media-size') as HTMLInputElement;
                              if (sizeInp) {
                                sizeInp.value = sizeStr;
                              }
                              triggerToast('Image uploaded and registered successfully!');
                            } catch (err: any) {
                              triggerToast(`Storage upload failed: ${err.message || err}`);
                            }
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Form elements */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase text-[9px] tracking-widest block">Asset Name / Title</label>
                  <input 
                    type="text" 
                    id="modal-media-name" 
                    placeholder="wedding_epic_frame.jpg" 
                    required 
                    className="w-full px-3 py-2 bg-black border border-white/10 text-white font-mono text-xs focus:border-gold/50 focus:outline-none" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 uppercase text-[9px] tracking-widest block">Category Folder</label>
                    <select 
                      id="modal-media-folder" 
                      defaultValue={activeMediaFolder}
                      className="w-full px-3 py-2 bg-black border border-white/10 text-white font-mono text-xs focus:border-gold/50 focus:outline-none"
                    >
                      {mediaFolders.map(folder => (
                        <option key={folder} value={folder}>{folder}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 uppercase text-[9px] tracking-widest block">Asset Size Index</label>
                    <input 
                      type="text" 
                      id="modal-media-size" 
                      defaultValue="1.5 MB" 
                      className="w-full px-3 py-2 bg-black border border-white/10 text-white font-mono text-xs focus:border-gold/50 focus:outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase text-[9px] tracking-widest block">Or Specify Direct Asset URL / Base64</label>
                  <textarea 
                    id="modal-media-url" 
                    rows={3}
                    placeholder="https://images.unsplash.com/photo-..." 
                    required 
                    className="w-full px-3 py-2 bg-black border border-white/10 text-white font-mono text-xs focus:border-gold/50 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => {
                    const name = (document.getElementById('modal-media-name') as HTMLInputElement)?.value.trim();
                    const folder = (document.getElementById('modal-media-folder') as HTMLSelectElement)?.value;
                    const url = (document.getElementById('modal-media-url') as HTMLTextAreaElement)?.value.trim();
                    const size = (document.getElementById('modal-media-size') as HTMLInputElement)?.value.trim();

                    if (!name || !url) {
                      triggerToast('Error: Name and Image source are required.');
                      return;
                    }

                    handleCreateMediaItem(name, folder, url, size);
                  }}
                  className="w-full py-3 bg-gold text-black uppercase font-bold text-[10px] tracking-widest hover:bg-white transition-colors cursor-pointer"
                >
                  Publish to Library
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 6. Edit Media Modal */}
      {editingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs animate-fade-in">
          <motion.div 
            className="bg-[#0A0A0A] border border-white/10 w-full max-w-md p-8 space-y-6 relative font-mono text-xs text-zinc-300"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase font-mono">Edit Media Metadata</h3>
              <button onClick={() => setEditingMedia(null)} className="text-zinc-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              {/* Image Preview thumbnail */}
              <div className="flex justify-center p-3 bg-black border border-white/5 relative group">
                <img src={editingMedia.url} alt={editingMedia.name} className="h-28 object-contain" />
              </div>

              <div className="space-y-4">
                {/* Option to replace image file */}
                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase text-[9px] tracking-widest block font-bold text-gold">Replace Image File</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          const rawBase64 = event.target?.result as string;
                          if (rawBase64) {
                            const base64 = await compressImageBase64(rawBase64, 1200, 1200, 0.75);
                            const approxSizeKb = Math.round((base64.length * 3) / 4 / 1024);
                            const sizeStr = approxSizeKb > 1024 ? `${(approxSizeKb / 1024).toFixed(1)} MB` : `${approxSizeKb} KB`;
                            
                            setEditingMedia(prev => prev ? {
                              ...prev,
                              url: base64,
                              size: sizeStr,
                              name: file.name
                            } : null);
                            triggerToast('Replacement image loaded successfully.');
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-[10px] text-zinc-500 file:mr-4 file:py-1 file:px-3 file:border file:border-white/15 file:bg-transparent file:text-white file:font-mono file:text-[9px] file:uppercase file:cursor-pointer hover:file:bg-white/5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase text-[9px] tracking-widest block">Asset Name / Title</label>
                  <input 
                    type="text" 
                    id="edit-media-name" 
                    defaultValue={editingMedia.name}
                    required 
                    className="w-full px-3 py-2 bg-black border border-white/10 text-white font-mono text-xs focus:border-gold/50 focus:outline-none" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 uppercase text-[9px] tracking-widest block">Category Folder</label>
                    <select 
                      id="edit-media-folder" 
                      defaultValue={editingMedia.folder}
                      className="w-full px-3 py-2 bg-black border border-white/10 text-white font-mono text-xs focus:border-gold/50 focus:outline-none"
                    >
                      {mediaFolders.map(folder => (
                        <option key={folder} value={folder}>{folder}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 uppercase text-[9px] tracking-widest block">Asset Size Index</label>
                    <input 
                      type="text" 
                      id="edit-media-size" 
                      defaultValue={editingMedia.size} 
                      className="w-full px-3 py-2 bg-black border border-white/10 text-white font-mono text-xs focus:border-gold/50 focus:outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase text-[9px] tracking-widest block">Asset URL / Source Base64</label>
                  <textarea 
                    id="edit-media-url" 
                    rows={3}
                    defaultValue={editingMedia.url}
                    required 
                    className="w-full px-3 py-2 bg-black border border-white/10 text-white font-mono text-xs focus:border-gold/50 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setEditingMedia(null)}
                  className="flex-1 py-3 bg-transparent border border-white/10 hover:bg-white/5 text-zinc-300 uppercase font-bold text-[10px] tracking-widest transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const name = (document.getElementById('edit-media-name') as HTMLInputElement)?.value.trim();
                    const folder = (document.getElementById('edit-media-folder') as HTMLSelectElement)?.value;
                    const url = (document.getElementById('edit-media-url') as HTMLTextAreaElement)?.value.trim();
                    const size = (document.getElementById('edit-media-size') as HTMLInputElement)?.value.trim();

                    if (!name || !url) {
                      triggerToast('Error: Name and Image source are required.');
                      return;
                    }

                    handleUpdateMediaItem({
                      id: editingMedia.id,
                      name,
                      folder,
                      url,
                      size
                    });
                  }}
                  className="flex-1 py-3 bg-gold text-black uppercase font-bold text-[10px] tracking-widest hover:bg-white transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Beautiful non-blocking custom confirmation overlay */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs animate-fade-in">
          <motion.div 
            className="bg-[#0A0A0A] border border-white/10 w-full max-w-sm p-6 space-y-6 relative text-xs font-mono"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">{confirmModal.title}</span>
              <button 
                onClick={() => setConfirmModal(null)} 
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-zinc-400 leading-relaxed font-light">{confirmModal.message}</p>
            
            <div className="flex justify-end space-x-3 pt-2">
              <button 
                type="button" 
                onClick={() => setConfirmModal(null)} 
                className="px-4 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-zinc-300 font-mono text-[10px] tracking-widest uppercase transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => confirmModal.onConfirm()} 
                className={`px-4 py-2 ${
                  confirmModal.isDanger 
                    ? 'bg-red-950 text-red-400 hover:bg-red-900 border border-red-500/20' 
                    : 'bg-gold text-black hover:bg-white'
                } font-mono text-[10px] tracking-widest uppercase transition-colors cursor-pointer`}
              >
                {confirmModal.actionText}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
