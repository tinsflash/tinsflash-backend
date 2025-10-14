// ==========================================================
// 🌍 /vision/captureSatelliteMulti.js (TINSFLASH PRO+++ v6.3)
// ==========================================================
// 🔸 Phase 1B – VisionIA Capture (multi-couches satellite)
// 🔸 Objectif : capturer plusieurs couches météorologiques visuelles
// 🔸 Pas d’IA ici — uniquement extraction physique d’images satellites
// ==========================================================

import axios from "axios";
import fs from "fs";
import path from "path";
import { addVisionLog } from "./logVisionCapture.js";
import { storeCapture } from "./storeCapture.js";

// ==========================================================
// 🔧 CONFIGURATION DES COUCHES & SOURCES
// ==========================================================
const layers = [
  { key: "wind", name: "Vent", url: (lat, lon) => `https://tile.open-meteo.com/map/wind/4/${lat}/${lon}.png` },
  { key: "temp", name: "Température", url: (lat, lon) => `https://tile.open-meteo.com/map/temp/4/${lat}/${lon}.png` },
  { key: "rain", name: "Précipitations", url: (lat, lon) => `https://tile.open-meteo.com/map/precipitation/4/${lat}/${lon}.png` },
  { key: "snow", name: "Neige", url: (lat, lon) => `https://tile.open-meteo.com/map/snow/4/${lat}/${lon}.png` },
  { key: "cloud", name: "Nuages", url: (lat, lon) => `https://tile.open-meteo.com/map/cloud/4/${lat}/${lon}.png` },
  { key: "accumulation", name: "Accumulation", url: (lat, lon) => `https://tile.open-meteo.com/map/accumulation/4/${lat}/${lon}.png` },
  { key: "extreme", name: "Phénomènes extrêmes", url: (lat, lon) => `https://tile.open-meteo.com/map/extreme/4/${lat}/${lon}.png` },
];

// Dossier de stockage local temporaire (avant envoi Mongo)
const CAPTURE_DIR = path.join(process.cwd(), "data/vision_captures");
if (!fs.existsSync(CAPTURE_DIR)) fs.mkdirSync(CAPTURE_DIR, { recursive: true });

// ==========================================================
// 🚀 CAPTURE MULTI-COUCHES
// ==========================================================
export async function captureSatelliteMulti(lat = 50.46, lon = 4.86, region = "Global") {
  const timestamp = new Date().toISOString();
  const results = [];

  await addVisionLog(`🎥 Lancement des captures multi-couches pour ${region}`, "info");

  for (const layer of layers) {
    try {
      const imageUrl = layer.url(lat, lon);
      const filename = `${region}_${layer.key}_${timestamp.replace(/[:.]/g, "-")}.png`;
      const filepath = path.join(CAPTURE_DIR, filename);

      const response = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 15000 });
      fs.writeFileSync(filepath, response.data);

      const fileSize = fs.statSync(filepath).size;
      if (fileSize < 5000) throw new Error("Image trop petite ou vide");

      const captureData = {
        region,
        layer: layer.key,
        source: imageUrl,
        timestamp,
        filePath: filepath,
        size: fileSize,
      };

      await storeCapture(captureData);
      await addVisionLog(`✅ Capture ${layer.name} réussie (${Math.round(fileSize / 1024)} Ko)`, "success");
      results.push(captureData);
    } catch (err) {
      await addVisionLog(`⚠️ Échec capture ${layer.name} : ${err.message}`, "error");
    }
  }

  await addVisionLog(`📸 ${results.length}/${layers.length} couches capturées pour ${region}`, "summary");
  return results;
}

// ==========================================================
// 🧩 EXPORTS
// ==========================================================
export default { captureSatelliteMulti };
