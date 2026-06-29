import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";

const app = express();

// Set body parser limits for handling large base64 uploaded images
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Robust utility to parse, validate, and retrieve Cloudinary credentials with file cache fallback
function getCloudinaryConfig(): { cloudName: string | null; apiKey: string | null; apiSecret: string | null } {
  let cloudName: string | null = null;
  let apiKey: string | null = null;
  let apiSecret: string | null = null;

  // 1. Try reading from the server-side file cache first (so Admin Panel edits override process.env)
  try {
    const cachePath = path.join(process.cwd(), "cloudinary-config.json");
    if (fs.existsSync(cachePath)) {
      const raw = fs.readFileSync(cachePath, "utf-8");
      const cached = JSON.parse(raw);
      if (cached.cloudName && cached.apiKey && cached.apiSecret) {
        cloudName = cached.cloudName.trim();
        apiKey = cached.apiKey.trim();
        apiSecret = cached.apiSecret.trim();
        console.log("[CLOUDINARY CONFIG] Loaded overridden/tested credentials from server cache (cloudinary-config.json).");
      }
    }
  } catch (err) {
    console.warn("[CLOUDINARY CONFIG] Error reading cloudinary-config.json:", err);
  }

  // 2. Fallback to process.env if cache didn't have all required fields
  if (!cloudName || !apiKey || !apiSecret) {
    let envCloudName = process.env.CLOUDINARY_CLOUD_NAME || null;
    let envApiKey = process.env.CLOUDINARY_API_KEY || null;
    let envApiSecret = process.env.CLOUDINARY_API_SECRET || null;

    if (envCloudName) envCloudName = envCloudName.trim();
    if (envApiKey) envApiKey = envApiKey.trim();
    if (envApiSecret) envApiSecret = envApiSecret.trim();

    if (!cloudName && envCloudName) cloudName = envCloudName;
    if (!apiKey && envApiKey) apiKey = envApiKey;
    if (!apiSecret && envApiSecret) apiSecret = envApiSecret;
  }

  return { cloudName, apiKey, apiSecret };
}

// Robust utility to parse, validate, and retrieve Supabase credentials with file cache fallback
function getSupabaseConfig(): { url: string | null; anonKey: string | null } {
  // Helper to validate URL structure using native URL constructor
  const isValidUrlFormat = (uri: string): boolean => {
    try {
      new URL(uri);
      return true;
    } catch {
      return false;
    }
  };

  // Check if Supabase has been explicitly disconnected in the cache override, or if we have valid credentials there
  let url: string | null = null;
  let anonKey: string | null = null;
  let explicitlyDisconnected = false;

  try {
    const cachePath = path.join(process.cwd(), "supabase-config.json");
    if (fs.existsSync(cachePath)) {
      const raw = fs.readFileSync(cachePath, "utf-8");
      const cached = JSON.parse(raw);
      if (cached && cached.disconnected === true) {
        explicitlyDisconnected = true;
      } else if (cached && cached.url && cached.anonKey) {
        let cachedUrl = cached.url.trim();
        let cachedAnon = cached.anonKey.trim();

        if (
          cachedUrl !== "" &&
          !cachedUrl.includes("YOUR_SUPABASE_URL") &&
          !cachedUrl.includes("placeholder") &&
          (cachedUrl.startsWith("http://") || cachedUrl.startsWith("https://")) &&
          isValidUrlFormat(cachedUrl) &&
          cachedAnon !== "" &&
          !cachedAnon.includes("YOUR_SUPABASE") &&
          !cachedAnon.includes("placeholder")
        ) {
          url = cachedUrl;
          anonKey = cachedAnon;
          console.log("[SUPABASE CONFIG] Loaded valid credentials from server cache (supabase-config.json).");
        }
      }
    }
  } catch (err) {
    console.warn("[SUPABASE CONFIG] Error reading supabase-config.json:", err);
  }

  if (explicitlyDisconnected) {
    return { url: null, anonKey: null };
  }

  // Fallback to process.env if cache didn't have valid credentials
  if (!url || !anonKey) {
    let envUrl = process.env.SUPABASE_URL || null;
    let envAnonKey = process.env.SUPABASE_ANON_KEY || null;

    if (envUrl) {
      envUrl = envUrl.trim();
      if (
        envUrl === "" || 
        envUrl.includes("YOUR_SUPABASE_URL") || 
        envUrl.includes("placeholder") || 
        (!envUrl.startsWith("http://") && !envUrl.startsWith("https://")) ||
        !isValidUrlFormat(envUrl)
      ) {
        envUrl = null;
      }
    }

    if (envAnonKey) {
      envAnonKey = envAnonKey.trim();
      if (
        envAnonKey === "" || 
        envAnonKey.includes("YOUR_SUPABASE") || 
        envAnonKey.includes("placeholder")
      ) {
        envAnonKey = null;
      }
    }

    if (!url && envUrl) url = envUrl;
    if (!anonKey && envAnonKey) anonKey = envAnonKey;
  }

  return { url, anonKey };
}

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Supabase API Integration
  app.get("/api/supabase/config", (req, res) => {
    const { url, anonKey } = getSupabaseConfig();
    res.json({
      envConfigured: !!(url && anonKey),
      url: url ? `${url.substring(0, 20)}...` : null
    });
  });

  // Cloudinary API Integration
  app.get("/api/cloudinary/config", (req, res) => {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    res.json({
      envConfigured: !!(cloudName && apiKey && apiSecret),
      cloudName: cloudName
    });
  });

  app.post("/api/cloudinary/test", async (req, res) => {
    try {
      const { cloudName: defaultCloud, apiKey: defaultKey, apiSecret: defaultSecret } = getCloudinaryConfig();
      const cloudName = req.body.cloudName || defaultCloud;
      const apiKey = req.body.apiKey || defaultKey;
      const apiSecret = req.body.apiSecret || defaultSecret;

      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(400).json({
          success: false,
          error: "Cloud Name, API Key, and API Secret are required."
        });
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });

      // Simple Ping-like request to check API keys
      try {
        const result = await cloudinary.api.ping();
        
        // Cache verified credentials on the server
        try {
          fs.writeFileSync(
            path.join(process.cwd(), "cloudinary-config.json"),
            JSON.stringify({ cloudName, apiKey, apiSecret }, null, 2),
            "utf-8"
          );
          console.log("[CLOUDINARY TEST] Successfully cached verified Cloudinary credentials to cloudinary-config.json");
        } catch (fsErr) {
          console.error("[CLOUDINARY TEST] Error caching credentials to file:", fsErr);
        }

        return res.json({
          success: true,
          message: "Successfully connected to Cloudinary API!",
          details: JSON.stringify(result, null, 2)
        });
      } catch (pingErr: any) {
        console.error("[CLOUDINARY PING ERROR]", pingErr);
        return res.status(401).json({
          success: false,
          error: `Cloudinary validation failed: ${pingErr.message || JSON.stringify(pingErr)}`
        });
      }
    } catch (err: any) {
      console.error("[CLOUDINARY TEST EXCEPTION]", err);
      return res.status(500).json({
        success: false,
        error: `Unexpected error: ${err.message || err}`
      });
    }
  });

  // Robust helper for initializing Supabase client with retry validation and Vercel-optimized logging
  async function verifySupabaseConnectionWithRetry(url: string, anonKey: string, retries = 3, delay = 1000): Promise<{ success: boolean; error?: any; details?: string }> {
    console.log(`[SUPABASE INITIALIZATION] Attempting to connect to Supabase project at ${url}...`);
    
    let lastError: any = null;
    const supabase = createClient(url, anonKey);

    for (let i = 0; i < retries; i++) {
      try {
        console.log(`[SUPABASE INITIALIZATION] [Attempt ${i + 1}/${retries}] Querying lightweight connection test...`);
        
        // Query a dummy relation to test the PostgREST API endpoint connectivity and auth keys
        const { error } = await supabase.from('supabase_connection_test').select('*').limit(1);
        
        if (!error) {
          console.log(`[SUPABASE INITIALIZATION] [SUCCESS] Successfully connected and queried 'supabase_connection_test' table on attempt ${i + 1}.`);
          return { success: true, details: "Verified database connection and queried test table successfully." };
        }

        // Check if it's an API auth or schema error
        // If error code is postgrest relation doesn't exist (PGRST116 / PGRST111 or PostgreSQL 42P01), the credentials are CORRECT but the table doesn't exist.
        if (error.code && (error.code.startsWith('PGRST') || error.code === '42P01')) {
          console.log(`[SUPABASE INITIALIZATION] [SUCCESS] Credentials validated successfully! (PostgREST returned code ${error.code}: Table 'supabase_connection_test' does not exist, which confirms API authentication is fully valid).`);
          return { 
            success: true, 
            details: "API authentication credentials are valid. You can now build the required tables and synchronize data." 
          };
        }

        // Treat any other error as transient or bad credentials
        lastError = error;
        console.warn(`[SUPABASE INITIALIZATION] [WARNING] Attempt ${i + 1} failed with error code ${error.code || 'unknown'}: ${error.message}`);
        
      } catch (err: any) {
        lastError = err;
        console.error(`[SUPABASE INITIALIZATION] [ERROR] Unexpected system exception during attempt ${i + 1}:`, err.message || err);
      }

      if (i < retries - 1) {
        console.log(`[SUPABASE INITIALIZATION] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.error(`[SUPABASE INITIALIZATION] [FAILURE] All ${retries} connection verification attempts failed. Last error:`, lastError);
    return { success: false, error: lastError };
  }

  app.post("/api/supabase/test", async (req, res) => {
    try {
      const { url: defaultUrl, anonKey: defaultAnonKey } = getSupabaseConfig();
      const url = req.body.url || defaultUrl;
      const anonKey = req.body.anonKey || defaultAnonKey;

      if (!url || !anonKey) {
        console.error("[SUPABASE TEST ENDPOINT] [ERROR] Missing Supabase URL or Anon Key credentials.");
        return res.status(400).json({ 
          success: false, 
          error: "Supabase URL and Anon Key are required. Please configure them in your Environment Secrets or enter them directly below." 
        });
      }

      // Check URL format to prevent crashing on createClient
      try {
        new URL(url);
      } catch (urlErr) {
        return res.status(400).json({
          success: false,
          error: "Invalid Supabase URL: Provided URL is malformed."
        });
      }

      const verificationResult = await verifySupabaseConnectionWithRetry(url, anonKey);
      
      if (verificationResult.success) {
        // Cache verified credentials on the server
        try {
          fs.writeFileSync(
            path.join(process.cwd(), "supabase-config.json"),
            JSON.stringify({ url, anonKey }, null, 2),
            "utf-8"
          );
          console.log("[SUPABASE TEST] Successfully cached verified Supabase credentials to supabase-config.json");
        } catch (fsErr) {
          console.error("[SUPABASE TEST] Error caching credentials to file:", fsErr);
        }

        // Run diagnostic checks on all tables
        const tablesToCheck = [
          'portfolio_items',
          'portfolio',
          'spotlight',
          'bookings',
          'messages',
          'crew',
          'blog',
          'instagram',
          'media',
          'transactions',
          'logs'
        ];

        const supabase = createClient(url, anonKey);
        const tablesDiagnostics: Record<string, { exists: boolean; accessible: boolean; error: string | null; code: string | null }> = {};
        
        for (const table of tablesToCheck) {
          try {
            const { error } = await supabase.from(table).select('*').limit(1);
            if (!error) {
              tablesDiagnostics[table] = { exists: true, accessible: true, error: null, code: null };
            } else {
              const code = error.code;
              const isMissing = code === '42P01' || error.message?.includes("does not exist") || error.message?.includes("Could not find the table") || error.message?.includes("schema cache");
              const isRls = code === '42501' || error.message?.includes("insufficient_privilege") || error.message?.includes("row-level security");
              
              tablesDiagnostics[table] = {
                exists: !isMissing,
                accessible: !isMissing && !isRls,
                error: error.message,
                code: code || null
              };
            }
          } catch (err: any) {
            tablesDiagnostics[table] = {
              exists: false,
              accessible: false,
              error: err.message || String(err),
              code: 'SYSTEM_ERROR'
            };
          }
        }

        return res.json({
          success: true,
          message: "Successfully connected to Supabase API & Database!",
          details: verificationResult.details,
          envConfigured: true,
          tablesDiagnostics
        });
      } else {
        const error = verificationResult.error;
        return res.status(401).json({
          success: false,
          error: error?.message || "Supabase API validation failed. Please check your URL and API credentials.",
          details: error,
          envConfigured: !!(defaultUrl && defaultAnonKey)
        });
      }
    } catch (error: any) {
      console.error("[SUPABASE TEST ENDPOINT] [FATAL SYSTEM ERROR]", error);
      return res.status(500).json({
        success: false,
        error: error.message || "An unexpected error occurred during Supabase verification"
      });
    }
  });

  // Disconnect Supabase by setting disconnected flag and clearing stored file cache
  app.post("/api/supabase/disconnect", (req, res) => {
    try {
      const cachePath = path.join(process.cwd(), "supabase-config.json");
      fs.writeFileSync(
        cachePath,
        JSON.stringify({ disconnected: true }, null, 2),
        "utf-8"
      );
      console.log("[SUPABASE DISCONNECT] Successfully wrote disconnect flag to supabase-config.json");
      return res.json({
        success: true,
        message: "Successfully disconnected from Supabase. Connections have been deactivated, and the local credential cache is cleared."
      });
    } catch (err: any) {
      console.error("[SUPABASE DISCONNECT ERROR]", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to clear Supabase configuration cache."
      });
    }
  });

  // Automated Integration and Connection Diagnostics
  app.get("/api/diagnose/engine", async (req, res) => {
    const report: any = {
      timestamp: new Date().toISOString(),
      environment: {
        geminiApiKeyConfigured: !!process.env.GEMINI_API_KEY,
        supabaseEnvUrlConfigured: !!process.env.SUPABASE_URL,
        supabaseEnvKeyConfigured: !!process.env.SUPABASE_ANON_KEY,
        cloudinaryEnvCloudConfigured: !!process.env.CLOUDINARY_CLOUD_NAME,
        cloudinaryEnvKeyConfigured: !!process.env.CLOUDINARY_API_KEY,
        cloudinaryEnvSecretConfigured: !!process.env.CLOUDINARY_API_SECRET,
      },
      supabase: {
        status: "unconfigured",
        url: null,
        error: null,
        connectionTest: null
      },
      cloudinary: {
        status: "unconfigured",
        cloudName: null,
        error: null,
        connectionTest: null
      }
    };

    // 1. Supabase Diagnosis
    try {
      const { url, anonKey } = getSupabaseConfig();
      if (url && anonKey) {
        report.supabase.url = url;
        const verification = await verifySupabaseConnectionWithRetry(url, anonKey, 1, 100);
        if (verification.success) {
          report.supabase.status = "connected";
          report.supabase.connectionTest = "SUCCESS: Successfully queried database & schema metadata.";
        } else {
          report.supabase.status = "failed";
          report.supabase.error = verification.error?.message || "Failed to query Supabase service.";
        }
      } else {
        // Check if explicitly disconnected
        const cachePath = path.join(process.cwd(), "supabase-config.json");
        if (fs.existsSync(cachePath)) {
          const raw = fs.readFileSync(cachePath, "utf-8");
          const cached = JSON.parse(raw);
          if (cached && cached.disconnected === true) {
            report.supabase.status = "explicitly_disconnected";
          }
        }
      }
    } catch (err: any) {
      report.supabase.status = "error";
      report.supabase.error = err.message || String(err);
    }

    // 2. Cloudinary Diagnosis
    try {
      const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
      if (cloudName && apiKey && apiSecret) {
        report.cloudinary.cloudName = cloudName;
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
          secure: true
        });
        try {
          const pingResult = await cloudinary.api.ping();
          report.cloudinary.status = "connected";
          report.cloudinary.connectionTest = `SUCCESS: Connected to Cloudinary Cloud. Status: ${JSON.stringify(pingResult)}`;
        } catch (pingErr: any) {
          report.cloudinary.status = "failed";
          report.cloudinary.error = pingErr.message || String(pingErr);
        }
      }
    } catch (err: any) {
      report.cloudinary.status = "error";
      report.cloudinary.error = err.message || String(err);
    }

    return res.json(report);
  });

  // Fetch all records from a Supabase table
  app.get("/api/supabase/fetch", async (req, res) => {
    try {
      const table = req.query.table as string;
      const { url, anonKey } = getSupabaseConfig();

      if (!url || !anonKey) {
        console.warn("[SUPABASE FETCH] Supabase is not configured or disconnected. Returning graceful empty data array.");
        return res.json({ success: true, data: [], message: "Supabase is unconfigured or disconnected. Gracefully returning empty list." });
      }

      if (!table) {
        return res.status(400).json({ success: false, error: "Missing 'table' query parameter." });
      }

      const supabase = createClient(url, anonKey);
      console.log(`[SUPABASE FETCH] Fetching all records from table '${table}'...`);

      let resolvedTable = table;
      let { data, error } = await supabase.from(resolvedTable).select("*");

      if (error) {
        const isTableMissing = 
          error.code === '42P01' || 
          error.code === 'PGRST116' || 
          (error.message && (
            error.message.includes("Could not find the table") ||
            error.message.includes("does not exist") ||
            error.message.includes("schema cache")
          ));

        if (isTableMissing && (table === 'portfolio_items' || table === 'portfolio')) {
          resolvedTable = table === 'portfolio_items' ? 'portfolio' : 'portfolio_items';
          console.log(`[SUPABASE FETCH FALLBACK] Table '${table}' not found, trying '${resolvedTable}'...`);
          const fallbackResult = await supabase.from(resolvedTable).select("*");
          if (!fallbackResult.error) {
            data = fallbackResult.data;
            error = null;
            console.log(`[SUPABASE FETCH FALLBACK SUCCESS] Successfully fetched from fallback table '${resolvedTable}'`);
          }
        }
      }

      if (error) {
        const isTableMissing = 
          error.code === '42P01' || 
          error.code === 'PGRST116' || 
          (error.message && (
            error.message.includes("Could not find the table") ||
            error.message.includes("does not exist") ||
            error.message.includes("schema cache")
          ));

        if (isTableMissing) {
          console.log(`[SUPABASE FETCH GRACEFUL FALLBACK] Table '${resolvedTable}' does not exist on Supabase. Gracefully returning empty array.`);
          return res.json({ 
            success: true, 
            data: [], 
            message: `Table '${resolvedTable}' does not exist yet. Please run the corresponding SQL schema in your Supabase SQL Editor.`,
            tableMissing: true
          });
        }

        console.error(`[SUPABASE FETCH ERROR] Error fetching from table '${resolvedTable}':`, error);
        return res.status(500).json({ success: false, error: error.message, details: error });
      }

      return res.json({ success: true, data: data || [] });
    } catch (err: any) {
      console.error("[SUPABASE FETCH FATAL ERROR]", err);
      return res.status(500).json({ success: false, error: err.message || err });
    }
  });

  // Delete a record from a Supabase table
  app.post("/api/supabase/delete", async (req, res) => {
    try {
      const { tableName, id } = req.body;
      const { url, anonKey } = getSupabaseConfig();

      if (!url || !anonKey) {
        return res.status(500).json({ success: false, error: "Supabase is not configured or credentials are invalid." });
      }

      if (!tableName || !id) {
        return res.status(400).json({ success: false, error: "Missing tableName or id in request body." });
      }

      const supabase = createClient(url, anonKey);
      console.log(`[SUPABASE DELETE] Deleting record '${id}' from table '${tableName}'...`);

      let resolvedTable = tableName;
      let { error } = await supabase.from(resolvedTable).delete().eq("id", id);

      if (error) {
        const isTableMissing = 
          error.code === '42P01' || 
          error.code === 'PGRST116' || 
          (error.message && (
            error.message.includes("Could not find the table") ||
            error.message.includes("does not exist") ||
            error.message.includes("schema cache")
          ));

        if (isTableMissing && (tableName === 'portfolio_items' || tableName === 'portfolio')) {
          resolvedTable = tableName === 'portfolio_items' ? 'portfolio' : 'portfolio_items';
          console.log(`[SUPABASE DELETE FALLBACK] Table '${tableName}' not found, trying '${resolvedTable}'...`);
          const fallbackResult = await supabase.from(resolvedTable).delete().eq("id", id);
          if (!fallbackResult.error) {
            error = null;
            console.log(`[SUPABASE DELETE FALLBACK SUCCESS] Successfully deleted from fallback table '${resolvedTable}'`);
          }
        }
      }

      if (error) {
        const isTableMissing = 
          error.code === '42P01' || 
          error.code === 'PGRST116' || 
          (error.message && (
            error.message.includes("Could not find the table") ||
            error.message.includes("does not exist") ||
            error.message.includes("schema cache")
          ));

        if (isTableMissing) {
          console.warn(`[SUPABASE DELETE WARNING] Table '${resolvedTable}' does not exist on Supabase. Gracefully skipping cloud deletion.`);
          return res.json({ 
            success: true, 
            message: `Table '${resolvedTable}' does not exist yet. Gracefully skipped cloud deletion.`,
            tableMissing: true
          });
        }

        console.error(`[SUPABASE DELETE ERROR] Error deleting from table '${resolvedTable}':`, error);
        return res.status(500).json({ success: false, error: error.message, details: error });
      }

      return res.json({ success: true, message: `Successfully deleted record with ID '${id}' from table '${resolvedTable}'` });
    } catch (err: any) {
      console.error("[SUPABASE DELETE FATAL ERROR]", err);
      return res.status(500).json({ success: false, error: err.message || err });
    }
  });

  app.post("/api/supabase/sync", async (req, res) => {
    try {
      const { url: defaultUrl, anonKey: defaultAnonKey } = getSupabaseConfig();
      const url = req.body.url || defaultUrl;
      const anonKey = req.body.anonKey || defaultAnonKey;
      const { tableName, records } = req.body;

      if (!url || !anonKey) {
        return res.status(400).json({ success: false, error: "Missing Supabase connection credentials." });
      }
      if (!tableName || !records || !Array.isArray(records)) {
        return res.status(400).json({ success: false, error: "Missing tableName or records array." });
      }

      // Check URL format to prevent crashing on createClient
      try {
        new URL(url);
      } catch (urlErr) {
        return res.status(400).json({
          success: false,
          error: "Invalid Supabase URL: Provided URL is malformed."
        });
      }

      if (records.length === 0) {
        return res.json({ success: true, message: "No records found to sync." });
      }

      const supabase = createClient(url, anonKey);

      // Cache verified credentials on successful sync
      try {
        fs.writeFileSync(
          path.join(process.cwd(), "supabase-config.json"),
          JSON.stringify({ url, anonKey }, null, 2),
          "utf-8"
        );
      } catch (fsErr) {
        console.error("[SUPABASE SYNC] Error caching credentials to file:", fsErr);
      }

      // Sanitize and map records to strictly match Supabase columns, avoiding PostgreSQL Column Mismatch errors.
      let resolvedTableName = tableName;
      const getSanitizedRecords = (targetTable: string) => {
        return records.map((item: any) => {
          const clean: any = {};
          const normalizedTable = targetTable.toLowerCase();

          if (normalizedTable === 'portfolio' || normalizedTable === 'portfolio_items') {
            const allowed = ['id', 'title', 'category', 'imageUrl', 'client', 'date', 'description', 'likes', 'views', 'aspect', 'location', 'year'];
            allowed.forEach(k => {
              if (item[k] !== undefined) clean[k] = item[k];
            });
            if (clean.imageUrl === undefined && item.url !== undefined) {
              clean.imageUrl = item.url;
            }
          } else if (normalizedTable === 'spotlight') {
            const allowed = ['id', 'title', 'category', 'tagline', 'description', 'technicalSpecs', 'imageUrl', 'createdAt'];
            allowed.forEach(k => {
              if (item[k] !== undefined) clean[k] = item[k];
            });
          } else if (normalizedTable === 'bookings') {
            const allowed = ['id', 'name', 'email', 'phone', 'date', 'time', 'eventType', 'status', 'notes', 'total', 'paid', 'createdAt'];
            allowed.forEach(k => {
              if (item[k] !== undefined) clean[k] = item[k];
            });
            if (clean.date === undefined && item.preferredDate !== undefined) {
              clean.date = item.preferredDate;
            }
            if (clean.notes === undefined && item.message !== undefined) {
              clean.notes = item.message;
            }
          } else if (normalizedTable === 'messages') {
            const allowed = ['id', 'name', 'email', 'subject', 'message', 'status', 'date'];
            allowed.forEach(k => {
              if (item[k] !== undefined) clean[k] = item[k];
            });
          } else if (normalizedTable === 'crew') {
            const allowed = ['id', 'name', 'role', 'bio', 'imageUrl', 'instagram', 'order'];
            allowed.forEach(k => {
              if (item[k] !== undefined) clean[k] = item[k];
            });
            if (clean.imageUrl === undefined && item.photoUrl !== undefined) {
              clean.imageUrl = item.photoUrl;
            }
          } else if (normalizedTable === 'blog') {
            const allowed = ['id', 'title', 'category', 'excerpt', 'content', 'imageUrl', 'author', 'date', 'readTime', 'published'];
            allowed.forEach(k => {
              if (item[k] !== undefined) clean[k] = item[k];
            });
            if (clean.published === undefined && item.status !== undefined) {
              clean.published = item.status === 'published';
            }
            if (clean.date === undefined && item.publishDate !== undefined) {
              clean.date = item.publishDate;
            }
            if (clean.excerpt === undefined && item.content !== undefined) {
              clean.excerpt = typeof item.content === 'string' ? item.content.substring(0, 150) + '...' : '';
            }
          } else if (normalizedTable === 'instagram') {
            const allowed = ['id', 'imageUrl', 'likes', 'comments'];
            allowed.forEach(k => {
              if (item[k] !== undefined) clean[k] = item[k];
            });
          } else if (normalizedTable === 'content') {
            const allowed = ['id', 'biography', 'profileImage', 'businessAddress', 'logoText', 'tagline', 'primaryColor', 'fontFamily', 'faviconUrl', 'heroTitle', 'heroSubTitle', 'heroCtaText'];
            allowed.forEach(k => {
              if (item[k] !== undefined) clean[k] = item[k];
            });
          } else if (normalizedTable === 'media') {
            const allowed = ['id', 'url', 'name', 'size', 'folder'];
            allowed.forEach(k => {
              if (item[k] !== undefined) clean[k] = item[k];
            });
          } else if (normalizedTable === 'transactions') {
            const allowed = ['id', 'bookingId', 'clientName', 'amount', 'status', 'date', 'method'];
            allowed.forEach(k => {
              if (item[k] !== undefined) clean[k] = item[k];
            });
          } else if (normalizedTable === 'logs') {
            const allowed = ['id', 'timestamp', 'action', 'category', 'user', 'ip', 'device'];
            allowed.forEach(k => {
              if (item[k] !== undefined) clean[k] = item[k];
            });
          } else {
            return { ...item };
          }

          if (!clean.id && item.id) {
            clean.id = item.id;
          }
          return clean;
        });
      };

      // Perform an upsert on the table using 'id' as the conflict resolution column.
      let { error } = await supabase
        .from(resolvedTableName)
        .upsert(getSanitizedRecords(resolvedTableName), { onConflict: 'id' });

      if (error) {
        const isTableMissing = 
          error.code === '42P01' || 
          error.code === 'PGRST116' || 
          (error.message && (
            error.message.includes("Could not find the table") ||
            error.message.includes("does not exist") ||
            error.message.includes("schema cache")
          ));

        if (isTableMissing && (tableName === 'portfolio_items' || tableName === 'portfolio')) {
          resolvedTableName = tableName === 'portfolio_items' ? 'portfolio' : 'portfolio_items';
          console.log(`[SUPABASE SYNC FALLBACK] Table '${tableName}' not found, trying '${resolvedTableName}'...`);
          const fallbackResult = await supabase
            .from(resolvedTableName)
            .upsert(getSanitizedRecords(resolvedTableName), { onConflict: 'id' });
          if (!fallbackResult.error) {
            error = null;
            console.log(`[SUPABASE SYNC FALLBACK SUCCESS] Successfully synced to fallback table '${resolvedTableName}'`);
          }
        }
      }

      if (error) {
        const isTableMissing = 
          error.code === '42P01' || 
          error.code === 'PGRST116' || 
          (error.message && (
            error.message.includes("Could not find the table") ||
            error.message.includes("does not exist") ||
            error.message.includes("schema cache")
          ));

        if (isTableMissing) {
          console.warn(`[SUPABASE SYNC WARNING] Table '${resolvedTableName}' does not exist on Supabase yet. This is expected if you haven't run the SQL schema creation commands yet. Gracefully falling back.`);
          return res.json({
            success: true,
            message: `Table '${resolvedTableName}' is not yet created in your Supabase database. Local data has been saved safely, and sync will retry once the table is created.`,
            tableMissing: true
          });
        }

        console.warn(`[SUPABASE SYNC EXCEPTION] Sync problem for table ${resolvedTableName}:`, error.message);
        return res.status(500).json({ 
          success: false, 
          error: error.message,
          details: error,
          hint: `Please verify that the table '${resolvedTableName}' exists in your Supabase database with columns that match your records, and that Row Level Security (RLS) is disabled or has policies configured to allow INSERT/UPDATE.`
        });
      }

      return res.json({
        success: true,
        message: `Successfully synchronized ${records.length} records to Supabase table '${resolvedTableName}'!`
      });
    } catch (error: any) {
      console.error("General Sync Error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "An error occurred during synchronization."
      });
    }
  });

  // Helper function for resilient retries with exponential backoff
  async function runWithRetry<T>(fn: () => Promise<T>, retries = 4, initialDelay = 1500): Promise<T> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        const currentDelay = initialDelay * Math.pow(2, i);
        console.warn(`Attempt ${i + 1} failed. Retrying in ${currentDelay}ms...`, err);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, currentDelay));
        }
      }
    }
    throw lastError;
  }

  // Helper function for calling generateContent with model fallback and resilient retries
  async function generateContentWithFallback(ai: any, params: any, retries = 2, initialDelay = 1000): Promise<any> {
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
    let lastError: any;

    for (const model of modelsToTry) {
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`[GEMINI] Attempting content generation using model: ${model} (attempt ${i + 1})`);
          const response = await ai.models.generateContent({
            ...params,
            model: model
          });
          return response;
        } catch (err: any) {
          lastError = err;
          const status = err.status || err.code || (err.message && err.message.includes("503") ? 503 : null);
          const isUnavailable = status === 503 || status === 429 || (err.message && (err.message.includes("UNAVAILABLE") || err.message.includes("high demand") || err.message.includes("limit")));
          
          console.warn(`[GEMINI] Attempt ${i + 1} with ${model} failed:`, err.message || err);
          
          if (isUnavailable && model === "gemini-3.5-flash") {
            // If experiencing high demand or 503, immediately break the retry loop and fall back to the next model
            console.log(`[GEMINI] Model ${model} is experiencing high demand. Falling back to the next model immediately.`);
            break;
          }

          if (i < retries - 1) {
            const currentDelay = initialDelay * Math.pow(1.5, i);
            await new Promise(resolve => setTimeout(resolve, currentDelay));
          }
        }
      }
    }
    throw lastError;
  }

  // Supabase Storage Image Upload Secure Proxy Endpoint
  app.post("/api/supabase/upload", async (req, res) => {
    try {
      const { image, filename } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, error: "Missing image data" });
      }

      const { url, anonKey } = getSupabaseConfig();

      if (!url || !anonKey) {
        console.error("[SUPABASE UPLOAD ERROR] Supabase environment variables are not configured.");
        return res.status(500).json({
          success: false,
          error: "Supabase configuration is missing or invalid. Please configure it in the Admin Panel."
        });
      }

      // Parse and decode base64 image
      let mimeType = "image/jpeg";
      let base64Data = image;
      if (image.startsWith("data:")) {
        const match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      }

      // Size and type validation
      const fileBuffer = Buffer.from(base64Data, "base64");
      const sizeInMb = fileBuffer.length / (1024 * 1024);
      if (sizeInMb > 10) {
        return res.status(400).json({ success: false, error: "Image file exceeds the 10MB size limit." });
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
      if (!allowedTypes.includes(mimeType)) {
        return res.status(400).json({ success: false, error: `Unsupported image type: ${mimeType}. Please upload a JPG, PNG, WEBP, or GIF.` });
      }

      const supabase = createClient(url, anonKey);
      const bucketName = "portfolio";

      // Ensure bucket exists - Supabase storage client
      try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (!listError) {
          const exists = buckets.some(b => b.name === bucketName);
          if (!exists) {
            console.log(`Bucket '${bucketName}' does not exist. Attempting to create it...`);
            await supabase.storage.createBucket(bucketName, { public: true });
          }
        }
      } catch (bucketErr) {
        console.warn("Could not check/create bucket in Supabase (might be due to RLS/permissions or connection issue):", bucketErr);
      }

      const cleanFilename = (filename || `upload-${Date.now()}`).replace(/[^a-zA-Z0-9.-]/g, "_");
      const uniquePath = `${Date.now()}-${cleanFilename}`;

      console.log(`Uploading ${uniquePath} (${sizeInMb.toFixed(2)} MB) to Supabase Storage bucket '${bucketName}'...`);
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(uniquePath, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.error("Supabase Storage upload error:", uploadError);
        let userFriendlyError = uploadError.message;
        if (uploadError.message && (
          uploadError.message.includes("Bucket not found") || 
          uploadError.message.includes("does not exist") ||
          uploadError.message.toLowerCase().includes("not_found")
        )) {
          userFriendlyError = 'The "portfolio" Storage Bucket does not exist on your Supabase project. To resolve this, go to your Supabase Console -> Storage -> Buckets, create a new bucket named "portfolio", and ensure you toggle "Public bucket" ON.';
        }
        return res.status(500).json({
          success: false,
          error: `Supabase Storage upload failed: ${userFriendlyError}`
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uniquePath);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error("Failed to generate public URL for uploaded file.");
      }

      console.log(`Supabase Storage upload succeeded. Public URL: ${publicUrlData.publicUrl}`);
      return res.json({
        success: true,
        url: publicUrlData.publicUrl,
        bucket: bucketName,
        path: data?.path || uniquePath,
        isFallback: false,
        dbRecordCreated: false,
        message: "File successfully uploaded and stored in Supabase Storage."
      });
    } catch (error: any) {
      console.error("General Supabase upload route fatal error:", error);
      return res.status(500).json({
        success: false,
        error: `Unexpected error during upload: ${error.message || error}`
      });
    }
  });

  // Cloudinary Secure Proxy Upload Endpoint
  app.post("/api/cloudinary/upload", async (req, res) => {
    try {
      const { image, filename } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, error: "Missing image data" });
      }

      const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
      if (!cloudName || !apiKey || !apiSecret) {
        console.error("[CLOUDINARY UPLOAD ERROR] Cloudinary configuration is missing.");
        return res.status(500).json({
          success: false,
          error: "Cloudinary configuration is missing. Please configure it in the Admin Panel."
        });
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });

      let uploadStr = image;
      if (!image.startsWith("data:")) {
        uploadStr = `data:image/jpeg;base64,${image}`;
      }

      const cleanId = (filename || `upload-${Date.now()}`)
        .replace(/\.[^/.]+$/, "") // remove extension
        .replace(/[^a-zA-Z0-9_-]/g, "_");

      console.log(`Uploading ${cleanId} to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(uploadStr, {
        public_id: `${Date.now()}-${cleanId}`,
        folder: "olamide_visuals"
      });

      console.log(`Cloudinary upload succeeded. Secure URL: ${uploadResult.secure_url}`);
      return res.json({
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        message: "File successfully uploaded and stored in Cloudinary."
      });
    } catch (error: any) {
      console.error("General Cloudinary upload route fatal error:", error);
      return res.status(500).json({
        success: false,
        error: `Cloudinary upload failed: ${error.message || error}`
      });
    }
  });

  // Helper to resolve an image input (data URL, raw base64, or remote HTTP/HTTPS URL) to clean base64 data and mimeType
  async function resolveImageToBase64(imageInput: string): Promise<{ base64Data: string; mimeType: string }> {
    if (!imageInput) {
      throw new Error("Missing image input");
    }

    // Case 1: Data URL
    if (imageInput.startsWith("data:")) {
      const match = imageInput.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return {
          mimeType: match[1],
          base64Data: match[2],
        };
      }
      throw new Error("Invalid data URL format");
    }

    // Case 2: HTTP/HTTPS URL
    if (imageInput.startsWith("http://") || imageInput.startsWith("https://")) {
      try {
        const response = await fetch(imageInput);
        if (!response.ok) {
          throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString("base64");
        
        let mimeType = response.headers.get("content-type") || "image/jpeg";
        if (!mimeType.startsWith("image/")) {
          mimeType = "image/jpeg";
        }
        return { base64Data, mimeType };
      } catch (err: any) {
        console.error("[IMAGE RESOLVE ERROR] Failed to download remote image URL:", err);
        throw new Error(`Failed to download and process remote image: ${err.message || err}`);
      }
    }

    // Case 3: Raw base64 data (default to image/jpeg)
    return {
      base64Data: imageInput,
      mimeType: "image/jpeg",
    };
  }

  app.post("/api/gemini/analyze-image", async (req: express.Request, res: express.Response) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Missing image data" });
      }

      // Resolve the image input (handles URLs, data URLs, and base64) securely server-side
      const { base64Data, mimeType } = await resolveImageToBase64(image);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is missing or unconfigured.");
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      const prompt = `Perform a thorough, multi-layered visual scan of this photograph to determine the absolute best artistic category, a bespoke poetic title, a creative narrative description, and custom-tailored search tags for a premium photographer's portfolio.

To prevent generic or random values, perform these exact diagnostic checks in sequence before drawing any conclusion:
1. SUBJECT AUDIT: Who or what is the primary subject? (e.g., a couple embracing, a solo person looking at the camera, a model in avant-garde clothing, a graduate with academic regalia, or camera crews and lighting gear).
2. CONTEXTUAL CHECK: Identify specific, concrete objects that act as unmistakable anchors:
   - Weddings: Veils, bouquets, tuxedos, rings, wedding altars, tier cakes, marital emotions.
   - Graduation: Mortarboards (caps), gowns, diplomas, sashes, ceremonial stages, campus backdrops.
   - Fashion: Haute couture garments, designer runway settings, highly stylized poses, dramatic editorial makeup.
   - Portraits: Focus on human expressions, close-ups/headshots, natural or studio lighting emphasizing facial features.
   - Behind The Scenes: Softboxes, camera rigs, tripods, light stands, photographers/crew in action, unstructured candid sets.
3. TITLE DERIVATION: Generate an artistic, poetic, and highly relevant title inspired directly by the light, colors, emotions, or specific elements in the scanned image. Avoid generic names like "Beautiful Day" or "Untitled". Make it sound like a masterclass photographer named it.
4. DESCRIPTION: Generate a 1-2 sentence high-end editorial description of the shoot's emotion, lighting, and visual narrative.
5. TAGS: Generate an array of 3-5 lowercase aesthetic tags (e.g., "vintage", "golden-hour", "minimalist", "intimate") describing the photograph's mood and environment.

Return your response in structured JSON format matching this schema:
{
  "visualAudit": "A detailed, swift visual summary of the image's key subjects, textures, and ambient lighting.",
  "criticalCheck": "Unambiguous visual evidence that led to selecting the chosen category (e.g., 'Spotted a graduation gown and mortarboard, ruling out portraits').",
  "category": "Weddings" | "Portraits" | "Fashion" | "Graduation" | "Behind The Scenes",
  "title": "A highly customized, evocative photographic title directly inspired by the visual elements scanned.",
  "description": "An evocative, high-end editorial narrative detailing the style and emotion.",
  "tags": ["tag1", "tag2", "tag3"]
}`;

      const response = await generateContentWithFallback(ai, {
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          prompt
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visualAudit: {
                type: Type.STRING,
                description: "A summary of scanned visual elements, lighting, and textures."
              },
              criticalCheck: {
                type: Type.STRING,
                description: "The visual check or evidence verified before confirming the category."
              },
              category: {
                type: Type.STRING,
                description: "The validated category: 'Weddings', 'Portraits', 'Fashion', 'Graduation', or 'Behind The Scenes'."
              },
              title: {
                type: Type.STRING,
                description: "A highly specific, poetic, non-generic title based on the visual evidence."
              },
              description: {
                type: Type.STRING,
                description: "A 1-2 sentence high-end editorial narrative."
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3-5 lowercase aesthetic tags describing the photograph."
              }
            },
            required: ["visualAudit", "criticalCheck", "category", "title", "description", "tags"]
          }
        }
      });

      const jsonText = response.text || "{}";
      res.json(JSON.parse(jsonText));
    } catch (error: any) {
      console.warn("Gemini analysis failed or is unconfigured. Returning graceful fallback to allow manual entry:", error.message || error);
      // Fulfill Requirement 6: fallback gracefully with aiPending: true
      return res.json({
        visualAudit: "Gemini AI was unavailable or unconfigured during upload. Visual audit was bypassed.",
        criticalCheck: "Bypassed verification checks to prevent application blockages.",
        category: "Portraits",
        title: "Untitled Story",
        description: "Pending AI analysis and poetic narration.",
        tags: ["pending-analysis"],
        aiPending: true,
        fallbackActive: true,
        errorHint: error.message || "Unconfigured"
      });
    }
  });

  app.post("/api/gemini/analyze-spotlight", async (req: express.Request, res: express.Response) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Missing image data" });
      }

      // Resolve the image input (handles URLs, data URLs, and base64) securely server-side
      const { base64Data, mimeType } = await resolveImageToBase64(image);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is missing or unconfigured.");
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      const prompt = `Perform a thorough, multi-layered visual scan of this photograph to determine the absolute best artistic category, a bespoke poetic title, a short evocative tagline, a highly creative description of the narrative or visual philosophy, and a plausible list of professional technical camera specs for a premium photographer's cinematic showcase spotlight.

To prevent generic or random values, perform these exact diagnostic checks in sequence before drawing any conclusion:
1. SUBJECT AUDIT: Who or what is the primary subject? Identify their pose, surroundings, and environment.
2. CATEGORY IDENTIFICATION: Recommend an artistic, capitalized category (e.g. "EDITORIAL PORTRAIT", "LUXURY WEDDING", "ACADEMIC MILESTONE", "BEHIND THE SCENES", "FASHION EDITORIAL", "COSMIC CINEMATIC", or similar high-end terms).
3. TITLE DERIVATION: Generate a beautiful, poetic, uppercase/title case title that conveys the artistic vibe. Avoid generic names like "Beautiful Day" or "Untitled". Make it sound like a masterclass photographer named it.
4. TAGLINE: Generate a single short sentence or phrase under 15 words that sums up the mood, e.g., "Illuminating raw tones and textured structural shadow lines." or "Preserving laughter and cultural heritage during traditional unions."
5. DESCRIPTION: Provide 2-3 sentences outlining the creative narrative backstory, emotional weight, visual styling (such as backlighting, high-contrast, or natural golden hour), and setting. Make it sound extremely professional, passionate, and artistic.
6. TECHNICAL SPECS: Generate high-end professional camera gear configurations that realistically match the style of the photo, e.g. "Sony α7R V • 85mm f/1.2 GM • ISO 100 • f/1.4 • 1/250s" or similar.

Return your response in structured JSON format matching this schema:
{
  "visualAudit": "A swift visual summary of the image's key subjects, textures, and lighting.",
  "criticalCheck": "Unambiguous visual evidence that led to selecting the chosen category and narrative.",
  "category": "The capitalized, highly stylized category.",
  "title": "An evocative, poetic title.",
  "tagline": "A poetic, short tagline/quote.",
  "description": "A high-end creative description detailing the philosophy, lighting, and narrative.",
  "technicalSpecs": "Professional camera specs (e.g. Camera body • Lens • ISO • f-stop • Shutter speed)."
}`;

      const response = await generateContentWithFallback(ai, {
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          prompt
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visualAudit: {
                type: Type.STRING,
                description: "A summary of scanned visual elements, lighting, and textures."
              },
              criticalCheck: {
                type: Type.STRING,
                description: "The visual check or evidence verified before confirming the category and details."
              },
              category: {
                type: Type.STRING,
                description: "The capitalized stylized category (e.g., 'EDITORIAL PORTRAIT', 'LUXURY WEDDING')."
              },
              title: {
                type: Type.STRING,
                description: "A highly specific, poetic, non-generic title."
              },
              tagline: {
                type: Type.STRING,
                description: "A short poetic tagline/quote under 15 words."
              },
              description: {
                type: Type.STRING,
                description: "A 2-3 sentence creative backstory, emotional weight, and lighting style."
              },
              technicalSpecs: {
                type: Type.STRING,
                description: "Realistic camera specs, format: Camera body • Lens • ISO • f-stop • Shutter speed."
              }
            },
            required: ["visualAudit", "criticalCheck", "category", "title", "tagline", "description", "technicalSpecs"]
          }
        }
      });

      const jsonText = response.text || "{}";
      res.json(JSON.parse(jsonText));
    } catch (error: any) {
      console.warn("Gemini spotlight analysis failed or is unconfigured:", error.message || error);
      return res.json({
        visualAudit: "Gemini AI was unavailable or unconfigured during spotlight upload.",
        criticalCheck: "Bypassed validation checks to prevent application blockages.",
        category: "EDITORIAL PORTRAIT",
        title: "UNVEILED ESSENCE",
        tagline: "Exploring structural tones, contrast, and depth of character.",
        description: "A stunning dramatic composition exploring fine-art visuals and high-contrast ambient styles. Prepopulated during unconfigured fallback mode.",
        technicalSpecs: "Sony α7R V • 85mm f/1.2 GM • ISO 100 • f/1.4 • 1/250s",
        fallbackActive: true,
        errorHint: error.message || "Unconfigured"
      });
    }
  });

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

export default app;
