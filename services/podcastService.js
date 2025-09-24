// services/podcastService.js
import express from "express";
import Podcast from "../utils/podcast.js";

const router = express.Router();

// ================================
// 🎙️ Podcasts météo
// ================================
router.get("/", async (req, res) => {
  try {
    const podcast = await Podcast.generate();
    res.json({
      status: "✅ OK",
      source: "podcastService",
      podcast,
    });
  } catch (err) {
    console.error("❌ Erreur podcastService:", err.message);
    res.status(500).json({ error: "Erreur podcast météo" });
  }
});

export default router;
