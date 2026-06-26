import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set body parser limits for handling large base64 uploaded images
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/gemini/analyze-image", async (req: express.Request, res: express.Response) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Missing image data" });
      }

      // Parse data URL if present
      let mimeType = "image/jpeg";
      let base64Data = image;
      if (image.startsWith("data:")) {
        const match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is required on the server." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      const prompt = `Perform a thorough, multi-layered visual scan of this photograph to determine the absolute best artistic category and a bespoke, poetic title for a premium photographer's portfolio.

To prevent generic or random titles, perform these exact diagnostic checks in sequence before drawing any conclusion:
1. SUBJECT AUDIT: Who or what is the primary subject? (e.g., a couple embracing, a solo person looking at the camera, a model in avant-garde clothing, a graduate with academic regalia, or camera crews and lighting gear).
2. CONTEXTUAL CHECK: Identify specific, concrete objects that act as unmistakable anchors:
   - Weddings: Veils, bouquets, tuxedos, rings, wedding altars, tier cakes, marital emotions.
   - Graduation: Mortarboards (caps), gowns, diplomas, sashes, ceremonial stages, campus backdrops.
   - Fashion: Haute couture garments, designer runway settings, highly stylized poses, dramatic editorial makeup.
   - Portraits: Focus on human expressions, close-ups/headshots, natural or studio lighting emphasizing facial features.
   - Behind The Scenes: Softboxes, camera rigs, tripods, light stands, photographers/crew in action, unstructured candid sets.
3. TITLE DERIVATION: Generate an artistic, poetic, and highly relevant title inspired directly by the light, colors, emotions, or specific elements in the scanned image. Avoid generic names like "Beautiful Day" or "Untitled". Make it sound like a masterclass photographer named it.

Return your response in structured JSON format matching this schema:
{
  "visualAudit": "A detailed, swift visual summary of the image's key subjects, textures, and ambient lighting.",
  "criticalCheck": "Unambiguous visual evidence that led to selecting the chosen category (e.g., 'Spotted a graduation gown and mortarboard, ruling out portraits').",
  "category": "Weddings" | "Portraits" | "Fashion" | "Graduation" | "Behind The Scenes",
  "title": "A highly customized, evocative photographic title directly inspired by the visual elements scanned."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
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
              }
            },
            required: ["visualAudit", "criticalCheck", "category", "title"]
          }
        }
      });

      const jsonText = response.text || "{}";
      res.json(JSON.parse(jsonText));
    } catch (error: any) {
      console.error("Gemini analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze image" });
    }
  });

  app.post("/api/gemini/analyze-spotlight", async (req: express.Request, res: express.Response) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Missing image data" });
      }

      // Parse data URL if present
      let mimeType = "image/jpeg";
      let base64Data = image;
      if (image.startsWith("data:")) {
        const match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is required on the server." });
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

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
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
      console.error("Gemini spotlight analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze spotlight image" });
    }
  });

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
