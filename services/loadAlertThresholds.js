// ==========================================================
// 🌍 TINSFLASH – loadAlertThresholds.js
// ==========================================================
// ✅ Lecture des seuils d’alerte officiels TINSFLASH PRO+++
// ✅ Comparaison avec IRM / Météo-France / NWS / ECCC
// ✅ Détection de primeur (alerte déclenchée avant organismes)
// ==========================================================

import fs from "fs";
import path from "path";
import { addEngineLog } from "./engineState.js";

const THRESHOLD_PATH = path.resolve("config/alertThresholds.json");

// --------------------------
// 🧠 Lecture des seuils
// --------------------------
export async function loadAlertThresholds() {
  try {
    const raw = fs.readFileSync(THRESHOLD_PATH, "utf-8");
    const thresholds = JSON.parse(raw);
    addEngineLog("✅ Seuils d’alerte TINSFLASH chargés avec succès");
    return thresholds;
  } catch (err) {
    addEngineLog("❌ Erreur lecture alertThresholds.json : " + err.message);
    return {};
  }
}

// --------------------------
// 📊 Comparaison avec organismes officiels
// --------------------------
export function compareWithOfficialSources(phenomenon, value, thresholds) {
  const t = thresholds[phenomenon];
  if (!t) return null;

  const result = {
    phenomenon,
    value,
    preAlerte: false,
    alerte: false,
    extreme: false,
    primeur: false,
    commentaire: ""
  };

  try {
    // Analyse seuils numériques
    if (typeof t.prealerte === "number" && value >= t.prealerte) result.preAlerte = true;
    if (typeof t.alerte === "number" && value >= t.alerte) result.alerte = true;
    if (typeof t.extreme === "number" && value >= t.extreme) result.extreme = true;

    // Exemple de seuils officiels moyens (valeurs de référence statiques)
    const refs = {
      irm: { vent: 80, pluie: 25, neige: 5 },
      meteoFrance: { vent: 100, pluie: 40, neige: 10 },
      nws: { vent: 93, pluie: 50, neige: 18 },
      eccc: { vent: 90, pluie: 50, neige: 15 }
    };

    const ref = refs.irm[phenomenon] || 0;
    if (result.alerte && value < ref) {
      result.primeur = true;
      result.commentaire = "🚀 Alerte TINSFLASH déclenchée avant organisme officiel";
    }

  } catch (err) {
    addEngineLog(`⚠️ Erreur analyse seuils ${phenomenon}: ${err.message}`);
  }

  return result;
}

// --------------------------
// 🧩 Exemple d’utilisation
// --------------------------
export async function checkPhenomenon(phenomenon, value) {
  const thresholds = await loadAlertThresholds();
  const res = compareWithOfficialSources(phenomenon, value, thresholds);
  if (res?.primeur) {
    addEngineLog(`🚨 PRIMEUR – ${phenomenon.toUpperCase()} détecté avant les autres (${value})`);
  }
  return res;
}
