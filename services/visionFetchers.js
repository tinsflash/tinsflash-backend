// ==========================================================
// 🛰️ TINSFLASH — visionFetchers.js (v5.15 PRO+++)
// ==========================================================
// Fonction : télécharger toutes les 30 minutes les images
// satellites fixes (Europe, USA, Asie, etc.) sans IA.
// L’analyse IA (aiAnalysis.js) se fait plus tard via les runs.
// ==========================================================

import fs from "fs";
import path from "path";
import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";

const VISION_DIR = path.join(process.cwd(), "data", "vision");
if (!fs.existsSync(VISION_DIR)) fs.mkdirSync(VISION_DIR, { recursive: true });

// ==========================================================
// 🌍 Sources fixes d’images satellites (stables, publiques)
// ==========================================================
const visionSources = [
  { name: "Europe_IR", url: "https://eumetview.eumetsat.int/static-images/MSG/IR108/Europe/latest.jpg" },
  { name: "Europe_Airmass", url: "https://eumetview.eumetsat.int/static-images/MSG/RGB/AIRMASS/Europe/latest.jpg" },
  { name: "Europe_NaturalColor", url: "https://eumetview.eumetsat.int/static-images/MSG/RGB/NATURALCOLOR/Europe/latest.jpg" },
  { name: "Afrique_IR", url: "https://eumetview.eumetsat.int/static-images/MSG/IR108/Africa/latest.jpg" },
  { name: "Ameriques_GOES16", url: "https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/latest.jpg" },
  { name: "USA_GOES16", url: "https://cdn.star.nesdis.noaa.gov/GOES16/ABI/CONUS/GEOCOLOR/latest.jpg" },
  { name: "Atlantique_GOES16", url: "https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/taw/GEOCOLOR/latest.jpg" },
  { name: "Pacifique_GOES18", url: "https://cdn.star.nesdis.noaa.gov/GOES18/ABI/FD/GEOCOLOR/latest.jpg" },
  { name: "Asie_Himawari", url: "https://himawari8.nict.go.jp/img/FULL_24h/latest.jpg" },
];

// ==========================================================
// 🧠 Fonction : téléchargement direct d'une image
// ==========================================================
async function fetchAndStoreImage(name, url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
    if (!res.headers["content-type"]?.startsWith("image/")) {
      throw new Error(`Réponse non-image (${res.headers["content-type"] || "inconnue"})`);
    }

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const ext = res.headers["content-type"].includes("png") ? "png" : "jpg";
    const filename = `vision_${name}_${ts}.${ext}`;
    const outPath = path.join(VISION_DIR, filename);
    fs.writeFileSync(outPath, res.data);
    await addEngineLog(`🛰️ Vision: ${name} OK → ${filename}`, "info", "vision");
    return outPath;
  } catch (err) {
    await addEngineError(`Vision fetch ${name} échoué: ${err.message}`, "vision");
    return null;
  }
}

// ==========================================================
// 🚀 Fonction principale — pompe toutes les sources
// ==========================================================
export async function fetchVisionCaptures() {
  await addEngineLog("🔭 VisionIA Phase 1B — téléchargement images fixes…", "info", "vision");

  const saved = [];
  for (const src of visionSources) {
    const p = await fetchAndStoreImage(src.name, src.url);
    if (p) saved.push(p);
  }

  await addEngineLog(`✅ Vision: ${saved.length}/${visionSources.length} images enregistrées`, "success", "vision");
  return saved;
}

// ==========================================================
// ⏱️ Planification automatique (toutes les 30 minutes)
// ==========================================================
// (À activer dans ton server.js principal si pas déjà fait)
setInterval(async () => {
  try {
    await fetchVisionCaptures();
  } catch (e) {
    await addEngineError("Erreur planification VisionIA: " + e.message, "vision");
  }
}, 30 * 60 * 1000); // 30 min

export default { fetchVisionCaptures };
