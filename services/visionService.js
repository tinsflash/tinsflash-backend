// ==========================================================
// 🌍 TINSFLASH – visionService.js (Everest Protocol v5.2 PRO+++)
// ==========================================================
// 🔸 Phase 1B – VisionIA (captures satellites & multicouches)
// 🔸 Sources : EUMETSAT, NOAA GOES, JMA Himawari, NASA GIBS
// 🔸 Analyse d’images : Jimp (luminosité, densité nuageuse, convection)
// ==========================================================

import axios from "axios";
import fs from "fs";
import path from "path";
import Jimp from "jimp";
import { addEngineLog, addEngineError } from "./engineState.js";

// Petite pause entre les téléchargements (stabilité Render)
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ==========================================================
// 📸 LISTE DES SOURCES SATELLITES ACTIVES
// ==========================================================
const VISION_SOURCES = [
  // --- Europe ---
  {
    name: "Europe IR",
    url: "https://eumetview.eumetsat.int/static-images/MSG/RGB/Europe-IR.jpg",
  },
  {
    name: "Europe Airmass",
    url: "https://eumetview.eumetsat.int/static-images/MSG/RGB/Airmass.jpg",
  },
  {
    name: "Europe Natural Color",
    url: "https://eumetview.eumetsat.int/static-images/MSG/RGB/NaturalColor.jpg",
  },

  // --- Amériques ---
  {
    name: "Americas Geocolor",
    url: "https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/americas/GEOCOLOR/latest.jpg",
  },

  // --- Asie ---
  {
    name: "Himawari Western Pacific",
    url: "https://www.data.jma.go.jp/mscweb/data/himawari/img/satimg_Western_Pacific.jpg",
  },

  // --- Floreffe (NASA GIBS) ---
  {
    name: "NASA Floreffe TrueColor",
    url: (() => {
      const date = new Date(Date.now() - 2 * 3600000)
        .toISOString()
        .split("T")[0];
      return `https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=${date}&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor&CRS=EPSG:4326&BBOX=4.70,50.38,4.82,50.47&FORMAT=image/png&WIDTH=1200&HEIGHT=900`;
    })(),
  },
];

// ==========================================================
// ⚙️ Téléchargement multi-sources VisionIA
// ==========================================================
export async function downloadVisionSet(region = "EU") {
  const outDir = path.join("./data/vision", region);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  await addEngineLog(`🛰️ VisionIA – Démarrage captures satellites (${VISION_SOURCES.length} sources)`, "info", region);

  for (const src of VISION_SOURCES) {
    try {
      const response = await axios.get(src.url, { responseType: "arraybuffer", timeout: 20000 });
      const buffer = Buffer.from(response.data);
      const img = await Jimp.read(buffer);

      // 🔍 Analyse rapide des propriétés
      const brightness = img.bitmap.data.reduce((a, b, i) => (i % 4 === 0 ? a + b : a), 0) / (img.bitmap.width * img.bitmap.height);
      const filename = `${src.name.replace(/\s+/g, "_")}_${Date.now()}.jpg`;
      const filepath = path.join(outDir, filename);

      await img.writeAsync(filepath);

      await addEngineLog(
        `✅ [${src.name}] Téléchargée et analysée – Luminosité moyenne : ${brightness.toFixed(1)}`,
        "success",
        region
      );
    } catch (err) {
      await addEngineError(`❌ VisionIA – ${src.name} : ${err.message}`, region);
    }

    // Pause entre les requêtes
    await delay(250);
  }

  await addEngineLog(`📦 VisionIA – Fin des captures satellites`, "success", region);
  return { success: true, count: VISION_SOURCES.length };
}

// ==========================================================
// 🧠 Analyse IA optionnelle (convection / nuages / orages)
// ==========================================================
export async function analyzeVisionSet(region = "EU") {
  try {
    const dir = path.join("./data/vision", region);
    if (!fs.existsSync(dir)) throw new Error("Aucun dossier vision détecté");

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg") || f.endsWith(".png"));
    const results = [];

    for (const f of files) {
      const img = await Jimp.read(path.join(dir, f));
      const w = img.bitmap.width;
      const h = img.bitmap.height;
      let convectiveIndex = 0;

      // Calcul d’un indice simplifié de convection
      img.scan(0, 0, w, h, function (x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        if (r > 180 && g < 160 && b < 160) convectiveIndex++;
      });

      const totalPixels = w * h;
      const convPct = (convectiveIndex / totalPixels) * 100;

      results.push({
        file: f,
        convective_pct: convPct.toFixed(2),
        date: new Date(),
      });

      await addEngineLog(`🌩️ Analyse VisionIA (${f}) : convection ${convPct.toFixed(2)}%`, "info", region);
    }

    return { success: true, results };
  } catch (err) {
    await addEngineError(`Erreur analyse VisionIA : ${err.message}`, region);
    return { success: false, error: err.message };
  }
}
export default { analyzeVision, downloadVisionSet };
