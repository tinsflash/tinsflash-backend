// ==========================================================
// 🔎 AUDIT AUTOMATIQUE TINSFLASH PRO+++
// Vérifie les exports / imports / structures des fichiers
// Compatible Render + GitHub Actions
// ==========================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVICES_DIR = path.join(__dirname, "../src/services");

// ==========================================================
// 🔧 Utilitaires
// ==========================================================
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

// ==========================================================
// 🚀 AUDIT DES EXPORTS
// ==========================================================
function auditExports(content, file) {
  const exports = [];
  const missingExports = [];

  const requiredExports = [
    "runGlobal",
    "getAll",
    "_ZONES"
  ];

  // Vérification basique des exports présents
  if (/export\s+const\s+\w+_ZONES/.test(content)) exports.push("_ZONES");
  if (/export\s+function\s+getAll\w+Zones/.test(content)) exports.push("getAll");
  if (/export\s+async\s+function\s+runGlobal\w+/.test(content)) exports.push("runGlobal");

  for (const e of requiredExports) {
    if (!exports.includes(e)) missingExports.push(e);
  }

  // Vérifie si fichier tronqué
  if (!content.trim().endsWith("};")) {
    missingExports.push("Fermeture fichier (probable fin manquante)");
  }

  // Vérifie les import/export ESM
  if (/require\s*\(/.test(content)) {
    missingExports.push("Syntaxe require() détectée (non ESM)");
  }

  if (missingExports.length > 0) {
    console.log(`❌ ${file} → problème(s) détecté(s) : ${missingExports.join(", ")}`);
  } else {
    console.log(`✅ ${file} → OK (exports complets)`);
  }
}

// ==========================================================
// 📁 AUDIT GLOBAL
// ==========================================================
console.log("===============================================");
console.log("🧠 AUDIT TINSFLASH PRO+++ – Vérification services");
console.log("===============================================\n");

const files = fs.readdirSync(SERVICES_DIR).filter(f => f.endsWith(".js"));

let totalOk = 0;
let totalFail = 0;

for (const file of files) {
  const content = readFileSafe(path.join(SERVICES_DIR, file));
  if (!content) {
    console.log(`⚠️ ${file} est vide ou introuvable.`);
    totalFail++;
    continue;
  }

  if (file.startsWith("runGlobal")) {
    const before = totalFail;
    auditExports(content, file);
    if (before === totalFail) totalOk++;
  }
}

console.log("\n===============================================");
console.log(`✅ ${totalOk} fichiers valides | ❌ ${totalFail} fichiers à corriger`);
console.log("===============================================");

if (totalFail > 0) {
  console.log("\n🚨 ÉCHEC AUDIT – Corrige les fichiers signalés avant build Render !");
  process.exit(1);
} else {
  console.log("\n🎉 AUDIT RÉUSSI – Tous les fichiers sont valides !");
  process.exit(0);
}
