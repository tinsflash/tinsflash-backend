// ====================================================================
// FICHIER : /vision/cleanupOldCaptures.js
// ====================================================================
// 🧹 VisionIA – Suppression automatique des anciennes captures
// 🔧 Version : TINSFLASH PRO+++ v6.3 (NOAA / GOES stable)
// ====================================================================

import fs from "fs";
import path from "path";
import { addVisionLog } from "./logVisionCapture.js";

// Dossier de stockage VisionIA global
const ROOT_DIR = path.join(process.cwd(), "data/vision_captures");

// Durée maximale de conservation (30 h)
const MAX_AGE_MS = 30 * 60 * 60 * 1000;

// ====================================================================
// 🧽 Nettoyage automatique des anciennes captures
// ====================================================================
export async function cleanupOldCaptures() {
  try {
    if (!fs.existsSync(ROOT_DIR)) {
      await addVisionLog("⚠️ Aucun dossier VisionIA à nettoyer", "warn");
      return;
    }

    const files = fs.readdirSync(ROOT_DIR);
    const now = Date.now();
    let removed = 0;

    for (const file of files) {
      const filePath = path.join(ROOT_DIR, file);
      const stat = fs.statSync(filePath);

      // Vérifie si le fichier est trop ancien
      if (now - stat.mtimeMs > MAX_AGE_MS) {
        fs.rmSync(filePath, { recursive: true, force: true });
        removed++;
        console.log(`🧹 Fichier VisionIA supprimé : ${filePath}`);
      }
    }

    if (removed > 0) {
      await addVisionLog(`🧹 ${removed} captures VisionIA supprimées (>30h)`, "info");
    } else {
      await addVisionLog("✅ Aucune capture à supprimer (toutes récentes)", "success");
    }
  } catch (err) {
    console.error(`⚠️ Erreur nettoyage VisionIA : ${err.message}`);
    await addVisionLog(`⚠️ Erreur nettoyage VisionIA : ${err.message}`, "error");
  }
}
