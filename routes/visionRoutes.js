// ====================================================================
// FICHIER : /routes/visionRoutes.js
// ====================================================================
// 🌍 TINSFLASH PRO+++ v6.3 – VisionIA (NOAA / GOES)
// 🔗 API pour admin-pp.html : affichage et déclenchement VisionIA
// ====================================================================

import express from "express";
import mongoose from "mongoose";
import { runVisionCapture } from "../vision/visionCapture.js";
import { addVisionLog } from "../vision/logVisionCapture.js";

// ====================================================================
// 🧱 Schéma minimal VisionCapture (identique à /vision/storeCapture.js)
// ====================================================================
const VisionSchema = new mongoose.Schema({
  source: String,
  file: String,
  filePath: String,
  date: String,
  timestamp: { type: Date, default: Date.now },
});

const VisionCapture =
  mongoose.models.VisionCapture || mongoose.model("VisionCapture", VisionSchema);

// ====================================================================
// 🚀 ROUTER EXPRESS
// ====================================================================
const router = express.Router();

// ====================================================================
// GET /api/vision-captures
// 🔹 Retourne les 50 dernières captures NOAA/GOES (VisionIA Phase 1B)
// ====================================================================
router.get("/vision-captures", async (req, res) => {
  try {
    const captures = await VisionCapture.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    // Vérifie que les fichiers existent sur disque local
    const filtered = captures.map(c => ({
      ...c,
      filePath: c.filePath && c.filePath.startsWith("/data")
        ? c.filePath.replace(process.cwd(), "")
        : c.filePath || c.file || "",
    }));

    await addVisionLog(`📡 ${filtered.length} captures VisionIA renvoyées à la console admin`, "info");
    res.json(filtered);
  } catch (err) {
    await addVisionLog(`⚠️ Erreur /vision-captures : ${err.message}`, "error");
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// POST /api/runVisionIA
// 🔹 Déclenchement manuel de la Phase 1B VisionIA NOAA / GOES
// ====================================================================
router.post("/runVisionIA", async (req, res) => {
  try {
    await addVisionLog("🚀 Déclenchement manuel VisionIA – NOAA / GOES", "info");
    const result = await runVisionCapture("Global");

    if (result.success) {
      await addVisionLog(`✅ VisionIA terminée : ${result.stored.length} captures`, "success");
      res.json({ success: true, count: result.stored.length, message: "VisionIA OK" });
    } else {
      await addVisionLog("⚠️ VisionIA exécutée mais sans capture valide", "warn");
      res.json({ success: false, message: "Aucune capture récupérée" });
    }
  } catch (err) {
    await addVisionLog(`❌ Erreur /runVisionIA : ${err.message}`, "error");
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// EXPORT
// ====================================================================
export default router;
