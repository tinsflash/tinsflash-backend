// ==========================================================
// 🧠 TINSFLASH — services/visionService.js
// Analyse automatique des captures radar/satellite (PNG)
// Version VisionIA v2 — multi-couches IR / Visible / Radar
// ==========================================================
// Dépendances : npm i jimp
// ==========================================================
import fs from "fs";
import path from "path";
import Jimp from "jimp";
import { addEngineLog, addEngineError } from "./engineState.js";

const VISION_DIR = path.join(process.cwd(), "data", "vision");
const clamp01 = (x) => Math.max(0, Math.min(1, x ?? 0));

// ----------------------------------------------------------
// 🧩 Analyse individuelle d'une image
// ----------------------------------------------------------
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

// ----------------------------------------------------------
// 🌍 Analyse globale VisionIA (toutes les dernières captures)
// ----------------------------------------------------------
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

    // Trier par date et garder les 6 plus récentes (2 par source environ)
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
    let wSum = 0,
      dSum = 0,
      sSum = 0;
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

export default { analyzeVision };
