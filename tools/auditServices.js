// tools/auditServices.js
// 🔎 Audit léger des fichiers critiques (non bloquant)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");

const mustExist = [
  "server.js",
  "services/engineState.js",
  "services/zonesCovered.js",
  "services/runWorld.js",
  "services/runWorldAlerts.js",
  "services/runGlobalEurope.js",
  "services/runGlobalUSA.js",
  "services/runGlobalCanada.js",
  "services/runGlobalAfricaNord.js",
  "services/runGlobalAfricaCentrale.js",
  "services/runGlobalAfricaOuest.js",
  "services/runGlobalAfricaSud.js",
  "services/runGlobalAmericaSud.js",
  "services/runGlobalAsiaEst.js",
  "services/runGlobalAsiaSud.js",
  "services/runGlobalOceania.js",
  "services/runGlobalCaribbean.js",
  "models/Alert.js",
];

let ok = true;
for (const rel of mustExist) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    ok = false;
    console.log(`⚠️  Manquant: ${rel}`);
  }
}

if (ok) {
  console.log("✅ Audit services: OK (tous les fichiers critiques sont présents)");
} else {
  console.log("ℹ️  Audit services: terminé avec avertissements (non bloquant)");
}

process.exit(0);
