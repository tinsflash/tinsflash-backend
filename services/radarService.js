// services/radarService.js
import express from "express";
import Radar from "../utils/radar.js";

const router = express.Router();

// ================================
// 🌍 Radar météo
// ================================
router.get("/", async (req, res) => {
  try {
    const radarData = await Radar.getLatest();
    res.json({
      status: "✅ OK",
      source: "radarService",
      data: radarData,
    });
  } catch (err) {
    console.error("❌ Erreur radarService:", err.message);
    res.status(500).json({ error: "Erreur radar météo" });
  }
});

export default router;
