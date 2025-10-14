// ====================================================================
// FICHIER : /vision/cleanupOldCaptures.js
// ====================================================================
// 🧹 VisionIA – Suppression automatique des anciennes captures
// ====================================================================

import fs from "fs";
import path from "path";

export async function cleanupOldCaptures() {
  const root = "/tmp/vision";
  if (!fs.existsSync(root)) return;

  const dirs = fs.readdirSync(root);
  const limit = Date.now() - 96 * 60 * 60 * 1000; // 96h

  for (const d of dirs) {
    const folder = path.join(root, d);
    const stat = fs.statSync(folder);
    if (stat.mtimeMs < limit) {
      fs.rmSync(folder, { recursive: true, force: true });
      console.log(`🧹 Dossier VisionIA supprimé : ${folder}`);
    }
  }
}
