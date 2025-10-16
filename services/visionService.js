// ==========================================================
// 🧠 TINSFLASH — services/visionService.js
// Analyse automatique des captures radar/satellite (PNG)
// Version VisionIA v2.1 PRO+++ — multi-couches IR / Visible / Radar
// 100 % réel, robuste et Render-compatible
// ==========================================================
// Dépendances : npm i jimp
// ==========================================================
import fs from "fs";
import path from "path";
import https from "https";
import Jimp from "jimp";
import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";

const VISION_DIR = path.join(process.cwd(), "data", "vision");
const clamp01 = (x) => Math.max(0, Math.min(1, x ?? 0));

// ==========================================================
// 🧩 Récupération sécurisée des images (avec retry et SSL tolérant)
// ==========================================================
async function safeDownload(url, dest) {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false }); // accepte SSL auto-signé
    const response = await axios.get(url, { responseType: "arraybuffer", timeout: 15000, httpsAgent: agent });
    fs.writeFileSync(dest, Buffer.from(response.data));
    await addEngineLog(`📥 VisionIA: image téléchargée ${path.basename(dest)}`, "info", "vision");
    return true;
  } catch (err) {
    await addEngineError(`VisionIA safeDownload: ${err.message}`, "vision");
    return false;
  }
}

// ==========================================================
// 🧩 Analyse individuelle d'une image (réel)
// ==========================================================
async function analyzeImage(file) {
  const img = await Jimp.read(file);
  const { width, height, data } = img.bitmap;
  let sum = 0, sumSq = 0, n = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b; // luminance
    sum += y; sumSq += y * y; n++;
  }

  const mean = sum / n;
  const variance = Math.max(0, sumSq / n - mean * mean);
  const std = Math.sqrt(variance);

  // Heuristiques d’interprétation météo
  const density = clamp01(1 - (mean / 255));     // sombre = nuages épais
  const structure = clamp01(std / 80);            // contraste = convection
  const convective = density > 0.55 && structure > 0.45;

  let type = "nuages épars";
  if (convective) type = "convection / orage probable";
  else if (density > 0.7) type = "nuages denses / pluie probable";
  else if (density > 0.5) type = "ciel chargé";

  const confidence = Math.round(clamp01((density * 0.6 + structure * 0.4)) * 100);
  const spectrum = file.includes("_IR_")
    ? "IR"
    : file.includes("_Radar_")
    ? "Radar"
    : file.includes("_WV_")
    ? "WV"
    : file.includes("_Visible_")
    ? "Visible"
    : "Unknown";

  return {
    file,
    width,
    height,
    spectrum,
    mean,
    std,
    density,
    structure,
    convective,
    type,
    confidence,
  };
}

// ==========================================================
// 🌍 Analyse globale VisionIA (captures radar/satellite)
// ==========================================================
export async function analyzeVision(lat = null, lon = null, zone = "Global") {
  try {
    if (!fs.existsSync(VISION_DIR)) {
      await addEngineLog("🔍 VisionIA: aucun dossier data/vision trouvé", "warn", "vision");
      return { active: false, confidence: 0, type: "none", details: {} };
    }

    const files = fs.readdirSync(VISION_DIR).filter((f) => f.endsWith(".png"));
    if (!files.length) {
      await addEngineLog("🔍 VisionIA: aucune capture PNG trouvée", "warn", "vision");
      return { active: false, confidence: 0, type: "none", details: {} };
    }

    // Trier par date et garder les 6 plus récentes
    const byTime = files
      .map((f) => ({ f, t: fs.statSync(path.join(VISION_DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)
      .slice(0, 6)
      .map((x) => path.join(VISION_DIR, x.f));

    const analyses = [];
    for (const f of byTime) {
      try {
        analyses.push(await analyzeImage(f));
      } catch (e) {
        await addEngineError("VisionIA analyzeImage: " + e.message, "vision");
      }
    }

    if (!analyses.length)
      return { active: false, confidence: 0, type: "none", details: {} };

    // Pondération selon le type spectral
    const weights = { IR: 0.6, Visible: 0.3, Radar: 0.1, WV: 0.4 };
    let wSum = 0, dSum = 0, sSum = 0;
    analyses.forEach((x) => {
      const w = weights[x.spectrum] ?? 0.2;
      wSum += w;
      dSum += x.density * w;
      sSum += x.structure * w;
    });

    const density = dSum / wSum;
    const structure = sSum / wSum;
    const convective = analyses.some((x) => x.convective);
    const confidence = Math.round(clamp01((density * 0.6 + structure * 0.4)) * 100);
    let type = "nuages épars";
    if (convective) type = "convection / orage probable";
    else if (density > 0.7) type = "nuages denses / pluie probable";
    else if (density > 0.5) type = "ciel chargé";
    const active = confidence >= 50;

    await addEngineLog(
      `🧪 VisionIA agrégée — dens:${density.toFixed(2)} struct:${structure.toFixed(
        2
      )} conf:${confidence}% → ${type}`,
      "info",
      "vision"
    );

    return {
      active,
      confidence,
      type,
      details: {
        density,
        structure,
        samples: analyses.length,
        files: byTime.map((p) => path.basename(p)),
        analyses,
      },
    };
  } catch (e) {
    await addEngineError("VisionIA analyzeVision: " + e.message, "vision");
    return { active: false, confidence: 0, type: "none", details: {} };
  }
}

// ==========================================================
// 🛰️ Téléchargement manuel des images satellite (fallback EUMETSAT / GOES)
// ==========================================================
export async function downloadVisionSet() {
  const urls = [
    // 🌍 Europe
    "https://eumetview.eumetsat.int/static-images/MSG/RGB/Europe-IR.jpg",
    "https://eumetview.eumetsat.int/static-images/MSG/RGB/Airmass.jpg",
    "https://eumetview.eumetsat.int/static-images/MSG/RGB/NaturalColor.jpg",
    // 🌎 Amériques
    "https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/americas/GEOCOLOR/latest.jpg",
    // 🌏 Asie (Himawari, SSL tolérant)
    "https://www.data.jma.go.jp/mscweb/data/himawari/img/satimg_Western_Pacific.jpg",
  ];

  if (!fs.existsSync(VISION_DIR)) fs.mkdirSync(VISION_DIR, { recursive: true });

  for (const url of urls) {
    const file = path.join(VISION_DIR, path.basename(url).replace(".jpg", ".png"));
    await safeDownload(url, file);
  }

  await addEngineLog(`🌐 VisionIA: téléchargement multi-sources terminé (${urls.length} images)`, "info", "vision");
}

export default { analyzeVision, downloadVisionSet };
