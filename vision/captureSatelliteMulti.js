// ==========================================================
// 🌍 /vision/captureSatelliteMulti.js (TINSFLASH PRO+++ v6.3)
// ==========================================================
// 🔸 Phase 1B – VisionIA Capture (multi-couches satellite globales)
// 🔸 Objectif : capturer les couches NOAA GOES-19 + GOES-18
// 🔸 Pas d’IA ici — uniquement extraction physique d’images satellites
// ==========================================================

import axios from "axios";
import fs from "fs";
import path from "path";
import https from "https";
import { addVisionLog } from "./logVisionCapture.js";
import { storeCapture } from "./storeCapture.js";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// ==========================================================
// 🔧 CONFIGURATION DES COUCHES ACTIVES (NOAA / GOES-19 & 18)
// ==========================================================
const layers = [
  {
    key: "geocolor_global",
    name: "Vue couleur naturelle (GOES-19)",
    url: "https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/latest.jpg",
    type: "jpg",
  },
  {
    key: "airmass_global",
    name: "Masse d’air (GOES-19)",
    url: "https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/AirMass/latest.jpg",
    type: "jpg",
  },
  {
    key: "sandwich_global",
    name: "Fusion visible + IR (GOES-19)",
    url: "https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/Sandwich/latest.jpg",
    type: "jpg",
  },
  {
    key: "glm_lightning",
    name: "Activité électrique (GLM – GOES-19)",
    url: "https://cdn.star.nesdis.noaa.gov/GOES19/GLM/FD/EXTENT3/latest.png",
    type: "png",
  },
  {
    key: "geocolor_pacific",
    name: "Vue couleur naturelle (GOES-18 – Pacifique/Océanie)",
    url: "https://cdn.star.nesdis.noaa.gov/GOES18/ABI/FD/GEOCOLOR/latest.jpg",
    type: "jpg",
  },
];

// ==========================================================
// 📂 Dossier de stockage local temporaire
// ==========================================================
const CAPTURE_DIR = path.join(process.cwd(), "data/vision_captures");
if (!fs.existsSync(CAPTURE_DIR)) fs.mkdirSync(CAPTURE_DIR, { recursive: true });

// ==========================================================
// 🚀 CAPTURE MULTI-COUCHES – VERSION GLOBALE NOAA
// ==========================================================
export async function captureSatelliteMulti(region = "Global") {
  const timestamp = new Date().toISOString();
  const results = [];

  await addVisionLog(`🎥 Lancement des captures NOAA/GOES pour ${region}`, "info");

  for (const layer of layers) {
    try {
      const filename = `${region}_${layer.key}_${timestamp.replace(/[:.]/g, "-")}.${layer.type}`;
      const filepath = path.join(CAPTURE_DIR, filename);

      const response = await axios.get(layer.url, {
        responseType: "arraybuffer",
        httpsAgent,
        timeout: 20000,
      });

      fs.writeFileSync(filepath, response.data);

      const fileSize = fs.statSync(filepath).size;
      if (fileSize < 5000) throw new Error("Image trop petite ou vide");

      const captureData = {
        region,
        layer: layer.key,
        source: layer.url,
        timestamp,
        filePath: filepath,
        size: fileSize,
      };

      await storeCapture(captureData);
      await addVisionLog(
        `✅ Capture ${layer.name} réussie (${Math.round(fileSize / 1024)} Ko)`,
        "success"
      );
      results.push(captureData);
    } catch (err) {
      await addVisionLog(`⚠️ Échec capture ${layer.name} : ${err.message}`, "error");
    }
  }

  await addVisionLog(
    `📸 ${results.length}/${layers.length} couches capturées pour ${region}`,
    results.length === layers.length ? "success" : "warn"
  );

  return results;
}

// ==========================================================
// 🧩 EXPORTS
// ==========================================================
export default { captureSatelliteMulti };
