// ==========================================================
// 🌍 TINSFLASH – /config/alertThresholds.js (Transition v5.2 PRO+++)
// ==========================================================
// ⚙️ Rôle : compatibilité descendante et passerelle vers le nouveau JSON
// ✅ Lecture automatique de /config/alertThresholds.json
// ✅ Maintien des mêmes exports (getThresholds, getPhenomenonThresholds)
// ✅ Journalisation via engineState.js
// ==========================================================

import fs from "fs";
import path from "path";
import { addEngineLog, addEngineError } from "../services/engineState.js";

const THRESHOLD_PATH = path.resolve("config/alertThresholds.json");

// --------------------------
// 🧠 Lecture globale
// --------------------------
export function getThresholds() {
  try {
    const raw = fs.readFileSync(THRESHOLD_PATH, "utf-8");
    const thresholds = JSON.parse(raw);
    addEngineLog("✅ Seuils TINSFLASH PRO+++ chargés depuis /config/alertThresholds.json");
    return thresholds;
  } catch (err) {
    addEngineError("❌ Lecture des seuils échouée : " + err.message, "alertThresholds");
    return {};
  }
}

// --------------------------
// 🎯 Lecture ciblée
// --------------------------
export function getPhenomenonThresholds(phenomenon) {
  try {
    const all = getThresholds();
    const data = all[phenomenon];
    if (!data) {
      addEngineLog(`⚠️ Phénomène non trouvé dans les seuils : ${phenomenon}`);
      return null;
    }
    return data;
  } catch (err) {
    addEngineError("❌ Erreur getPhenomenonThresholds : " + err.message, "alertThresholds");
    return null;
  }
}

// --------------------------
// 🧩 Export par défaut
// --------------------------
export default {
  getThresholds,
  getPhenomenonThresholds
};
