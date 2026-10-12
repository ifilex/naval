import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // AI Tactical Battle Analysis using Gemini API (with safe fallback)
  app.post("/api/tactical-analysis", async (req, res) => {
    try {
      const { lang, winner, turns, accuracy, playerHits, playerMisses, aiHits, aiMisses, playerSunken, aiSunken, theater, difficulty } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          analysis: null,
          message: "Standard tactical telemetry generated."
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      const prompt = `You are a decorated Fleet Admiral naval tactician providing an after-action debriefing report (AAR) for a naval battleship combat simulation.
Language of response MUST be: ${lang || 'English'}.
Match facts:
- Outcome: ${winner === 'player' ? 'VICTORY for Player Fleet' : 'DEFEAT, AI Fleet dominated'}
- Total Turns: ${turns}
- Player Accuracy: ${accuracy}% (${playerHits} hits, ${playerMisses} misses)
- AI Performance: ${aiHits} hits, ${aiMisses} misses
- Player Ships Sunken: ${playerSunken}/5
- Enemy Ships Destroyed: ${aiSunken}/5
- Theater of War: ${theater}
- AI Tactical Level: ${difficulty}

Provide a short, immersive, 3-4 sentence military tactical evaluation. Critique the player's firing efficiency, targeting discipline (e.g. cluster hunting vs random firing), and give 1 pro-tip advice for the next sortie. Keep the tone authentic to a naval war room briefing.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      return res.json({
        analysis: response.text || null,
      });
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      return res.json({
        analysis: null,
        error: err.message || "Failed to generate AI analysis",
      });
    }
  });

  // Vite middleware for dev or static for production
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
    console.log(`Naval Warfare Command Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
