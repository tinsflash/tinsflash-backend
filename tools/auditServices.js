// ==========================================================
// 🌍 AUDIT TINSFLASH PRO+++ – Vérification des services
// ==========================================================
// Vérifie automatiquement que tous les fichiers du dossier
// /src/services/ contiennent bien des exports valides,
// ne sont pas vides, et ne provoquent aucune erreur.
// ==========================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === ✅ Chemin Render corrigé ===
const SERVICES_DIR = path.join(__dirname, "../services");

// === Liste des extensions surveillées ===
const EXTENSIONS = [".js", ".mjs"];

// === Drapeaux ===
let totalFiles = 0;
let okFiles = 0;
let badFiles = [];

// ==========================================================
// 🔍 Vérifie un fichier individuellement
// ==========================================================
function verifyFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  if (!content.trim()) {
    badFiles.push(`${path.basename(filePath)} → vide`);
    return;
  }

  // Vérifie présence d'export (nommé ou default)
  if (!content.includes("export ")) {
    badFiles.push(`${path.basename(filePath)} → aucun export trouvé`);
    return;
  }

  // Vérifie parenthèses et accolades de base
  const open = (content.match(/{/g) || []).length;
  const close = (content.match(/}/g) || []).length;
  if (open !== close) {
    badFiles.push(`${path.basename(filePath)} → accolades déséquilibrées`);
    return;
  }

  okFiles++;
}

// ==========================================================
// 🚀 Démarrage de l’audit
// ==========================================================
console.log("==============================================");
console.log("🧠 AUDIT TINSFLASH PRO+++ – Vérification services");
console.log("==============================================\n");

try {
  const files = fs.readdirSync(SERVICES_DIR).filter((f) =>
    EXTENSIONS.some((ext) => f.endsWith(ext))
  );

  totalFiles = files.length;

  if (totalFiles === 0) {
    console.log("⚠️ Aucun fichier trouvé dans services/");
    process.exit(1);
  }

  for (const f of files) {
    const filePath = path.join(SERVICES_DIR, f);
    try {
      verifyFile(filePath);
    } catch (err) {
      badFiles.push(`${f} → erreur lecture (${err.message})`);
    }
  }

  // ========================================================
  // 📊 Résumé final
  // ========================================================
  console.log(`🗂️  Fichiers vérifiés : ${totalFiles}`);
  console.log(`✅ Valides : ${okFiles}`);
  console.log(`❌ Erreurs : ${badFiles.length}\n`);

  if (badFiles.length > 0) {
    console.log("🚨 Détails des fichiers problématiques :");
    badFiles.forEach((b) => console.log("   - " + b));
    console.log("\n💥 AUDIT ÉCHEC – Corrige les fichiers listés avant rebuild Render.");
    process.exit(1);
  }

  console.log("🌋 Audit Render OK – moteur TINSFLASH prêt au décollage 🚀\n");
  process.exit(0);
} catch (err) {
  console.error("❌ Erreur audit :", err.message);
  process.exit(1);
}
