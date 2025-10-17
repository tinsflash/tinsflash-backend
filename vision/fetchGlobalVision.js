// ==========================================================
// 🌍 TINSFLASH – fetchGlobalVision.js (VisionIA Phase 1B)
// ==========================================================
// ✅ But : Capture mondiale réelle via satellites NOAA GOES-19 + GOES-18
// ✅ Respect des règles : aucun import/export modifié
// ==========================================================

import axios from "axios";
import fs from "fs";
import path from "path";
import https from "https";
import { addVisionLog } from "./logVisionCapture.js";
import { storeCapture } from "./storeCapture.js";

const agent = new https.Agent({ rejectUnauthorized: false });

const CAPTURE_DIR = "./data/vision_captures";
if (!fs.existsSync(CAPTURE_DIR)) fs.mkdirSync(CAPTURE_DIR, { recursive: true });

// ==========================================================
// 🛰️ Couches actives NOAA/GOES (globales)
// ==========================================================
const SOURCES = [
  {
    id: "geocolor_global",
    url: "https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/latest.jpg",
    desc: "Vue globale GEOCOLOR (GOES-19)",
    type: "jpg",
  },
  {
    id: "airmass_global",
    url: "https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/AirMass/latest.jpg",
    desc: "Masse d’air – contrastes thermiques (GOES-19)",
    type: "jpg",
  },
  {
    id: "sandwich_global",
    url: "https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/Sandwich/latest.jpg",
    desc: "Fusion visible + IR – température nuages (GOES-19)",
    type: "jpg",
  },
  {
    id: "glm_lightning",
    url: "https://cdn.star.nesdis.noaa.gov/GOES19/GLM/FD/EXTENT3/latest.png",
    desc: "Activité foudre (GLM – GOES-19)",
    type: "png",
  },
  {
    id: "geocolor_pacific",
    url: "https://cdn.star.nesdis.noaa.gov/GOES18/ABI/FD/GEOCOLOR/latest.jpg",
    desc: "Vue Pacifique/Océanie (GOES-18)",
    type: "jpg",
  },
];

// ==========================================================
// ⚙️ Fonction principale
// ==========================================================
export async function fetchGlobalVision(runType = "manual") {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  let successCount = 0;

  await addVisionLog("🌍 Lancement capture globale NOAA GOES-19/18", "info", runType);

  for (const src of SOURCES) {
    try {
      const filename = `${src.id}_${timestamp}.${src.type}`;
      const filepath = path.join(CAPTURE_DIR, filename);

      const response = await axios.get(src.url, {
        responseType: "arraybuffer",
        httpsAgent: agent,
        timeout: 20000,
      });

      fs.writeFileSync(filepath, response.data);
      await storeCapture({
        name: src.id,
        description: src.desc,
        path: filepath,
        source: src.url,
        timestamp: new Date(),
      });

      await addVisionLog(`✅ Capture réussie : ${src.id}`, "success", runType);
      successCount++;
    } catch (err) {
      await addVisionLog(
        `❌ Échec capture ${src.id} – ${err.code || err.message}`,
        "error",
        runType
      );
    }
  }

  if (successCount > 0) {
    await addVisionLog(
      `🌎 VisionIA NOAA terminée (${successCount}/${SOURCES.length} couches)`,
      "success",
      runType
    );
  } else {
    await addVisionLog(
      "⚠️ Aucune capture enregistrée – vérifier URLs ou réseau",
      "warn",
      runType
    );
  }

  return { success: successCount > 0, count: successCount };
}

// ==========================================================
// 🧪 Exécution directe (run manuel Render / local)
// ==========================================================
if (process.argv[1] === new URL(import.meta.url).pathname) {
  fetchGlobalVision("manual_run").then((r) =>
    console.log("Résultat VisionIA globale :", r)
  );
}
