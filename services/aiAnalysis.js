// ==========================================================
// 🧠 IA ANALYSIS – TINSFLASH PRO+++ (Everest Protocol v3.9)
// ==========================================================
// Fusion intelligente, pondération dynamique et calcul d’indice
// de fiabilité par IA J.E.A.N.
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import { fetchStationData } from "./stationsService.js"; // ✅ correction du nom de fichier
import { applyGeoFactors } from "./geoFactors.js";
import { applyLocalFactors } from "./localFactors.js";

// ==========================================================
// ⚙️ Fonction principale – Analyse IA J.E.A.N.
// ==========================================================
export async function runAIAnalysis(results = []) {
  try {
    console.log("\n🧠 [IA.J.E.A.N.] Démarrage de l’analyse complète…");
    await addEngineLog("🧠 Analyse IA.J.E.A.N. – démarrage", "info", "aiAnalysis");

    const enhanced = [];
    let globalReliability = 0;
    let totalZones = 0;

    for (const r of results) {
      const { lat, lon, country, temperature, precipitation, wind } = r;
      totalZones++;

      // ==========================================================
      // 1️⃣ Lecture stations météo locales
      // ==========================================================
      const stations = await fetchStationData(lat, lon, country);
      const stationData = stations?.data || [];
      const stationCount = Array.isArray(stationData) ? stationData.length : 0;

      // Pondération station → correction IA
      const stationFactor = Math.min(1, 0.7 + stationCount * 0.03);

      // ==========================================================
      // 2️⃣ Application des facteurs environnementaux
      // ==========================================================
      let adjusted = { temperature, precipitation, wind };
      adjusted = await applyGeoFactors(adjusted, lat, lon, country);
      adjusted = await applyLocalFactors(adjusted, lat, lon, country);

      // ==========================================================
      // 3️⃣ Calcul du score local et du taux de confiance IA
      // ==========================================================
      const localScore =
        (1 -
          Math.abs(adjusted.temperature - temperature) / 50 +
          Math.abs(adjusted.wind - wind) / 100) *
        stationFactor;

      const reliability = Math.max(0, Math.min(1, localScore));
      globalReliability += reliability;

      const aiResult = {
        ...r,
        stationCount,
        adjusted,
        reliability,
        aiComment:
          reliability > 0.9
            ? "Prévision hautement fiable"
            : reliability > 0.7
            ? "Prévision à surveiller"
            : "Prévision incertaine",
      };

      enhanced.push(aiResult);

      console.log(
        `🧩 Zone ${country} : fiabilité ${(reliability * 100).toFixed(
          1
        )}% | ${aiResult.aiComment}`
      );

      await addEngineLog(
        `🧠 ${country} – ${Math.round(reliability * 100)} % (${stationCount} stations)`,
        reliability > 0.9 ? "success" : reliability > 0.7 ? "warning" : "info",
        "aiAnalysis"
      );
    }

    // ==========================================================
    // 4️⃣ Synthèse globale IA
    // ==========================================================
    const indiceGlobal = +(globalReliability / (totalZones || 1)).toFixed(3);
    const synthese = {
      indiceGlobal: +(indiceGlobal * 100).toFixed(1),
      zones: enhanced.length,
      commentaire:
        indiceGlobal >= 0.9
          ? "Système parfaitement stable"
          : indiceGlobal >= 0.7
          ? "Système en légère instabilité – Vérification recommandée"
          : "Système instable – Réévaluation requise",
    };

    console.log(
      `\n✅ [IA.J.E.A.N.] Analyse terminée – Indice global ${synthese.indiceGlobal}% (${synthese.commentaire})`
    );
    await addEngineLog(
      `✅ IA.J.E.A.N. terminée – Indice global ${synthese.indiceGlobal}%`,
      "success",
      "aiAnalysis"
    );

    return { synthese, results: enhanced };
  } catch (e) {
    console.error("❌ Erreur IA.J.E.A.N. :", e.message);
    await addEngineError("Erreur IA.J.E.A.N. : " + e.message, "aiAnalysis");
    return { error: e.message, synthese: null, results: [] };
  }
}

export default { runAIAnalysis };
