# 🚀 Olamide Visuals - Production Deployment Guide

Olamide Visuals is fully optimized for containerized environments (Cloud Run, Docker) as well as static or serverless platforms like **Vercel** with full-stack support.

Follow this guide to securely connect your **Supabase Storage** bucket and **Gemini AI Model Analyzer** in production.

---

## 🔑 Required Environment Variables

To activate persistent storage and AI-powered visual scanning in production, configure the following secrets in your deployment dashboard (e.g., Vercel Project Settings > Environment Variables):

| Key | Description | Example / Instructions |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio Gemini API Key | `AIzaSy...` (Get yours at https://aistudio.google.com) |
| `SUPABASE_URL` | Your Supabase project URL | `https://yourprojectid.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous client API Key | `eyJhbGciOi...` (Found in API settings) |
| `APP_URL` | The public base URL of your deployed application | `https://olamide-visuals.vercel.app` |

---

## 📦 1. Setting Up Supabase Storage (Required for uploads)

To support robust, non-base64 high-speed image uploads, follow these simple steps to prepare your Supabase Storage Bucket:

1. **Sign in** to your [Supabase Console](https://supabase.com).
2. Open your project and navigate to **Storage** in the left sidebar.
3. Click **New Bucket** and name it exactly **`portfolio`**.
4. Set the bucket privacy toggle to **Public** (required to generate public image URLs).
5. Ensure your bucket's RLS (Row Level Security) policies allow public reading of items (usually default for public buckets) and authenticating uploads (handled by our server-side secure proxy).

> 💡 **Graceful Fallback Mode:** If `SUPABASE_URL` or `SUPABASE_ANON_KEY` are not configured or fail to connect, Olamide Visuals will automatically fall back to saving ultra-compressed inline Base64 assets locally in the browser/sqlite store so your work is never lost.

---

## 🤖 2. Activating Gemini AI Image Auto-Analysis

With `GEMINI_API_KEY` configured on your host server, the masterclass AI analyzer will trigger automatically:

- **Portfolio Uploads**: Scanning photographs automatically fills out the poetic visual title, category folder recommendation, editorial storytelling description, and custom-tailored search tags.
- **Showcase Spotlights**: Instantly generates dramatic spotlight taglines, rich lighting/philosophy descriptions, and authentic camera technical specifications (`Sony α7R V • 85mm f/1.2 ...`).

### ⚙️ Fallback & Manual Entry Behavior (Offline-Ready)
- If the Gemini API is unconfigured or rate-limited, uploading artworks will succeed smoothly with a **"Pending AI"** status assigned.
- Users can review, edit, or enter visual metadata manually at any time.
- A **"Scan AI"** button is rendered directly on any pending items in the admin gallery panel, allowing you to trigger AI scanning instantly once credentials are ready.

---

## 🛠️ Full-Stack Build Commands (For reference)

If configuring custom pipeline scripts:
- **Build**: `npm run build`
- **Start**: `npm run start`

The application runs a unified, production-compiled Express + Vite server that manages secure server-side API proxy routing, keeping all private API keys hidden from client-side inspect tools.
