// ==========================================================
// 🧠 IA ANALYSIS – TINSFLASH PRO+++ (Everest Protocol v3.12)
// Analyse et pondération intelligente via IA J.E.A.N.
// Intègre les stations météo réelles
// ==========================================================

import { addEngineLog, addEngineError } from "./engineState.js";
import { fetchStationData } from "./fetchStationData.js";

// ==========================================================
// ⚙️  FUSION IA – Analyse des zones du SuperForecast
// ==========================================================
export async function runAIAnalysis(resultsPhase1 = []) {
  try {
    await addEngineLog("🔍 IA J.E.A.N. – Phase 2 : Analyse et pondération", "info", "aiAnalysis");
    const enriched = [];

    for (const r of resultsPhase1) {
      const { lat, lon, country, reliability } = r;

      // 1️⃣ Lecture stations locales
      const stations = await fetchStationData(lat, lon, country);
      const okSources = stations?.summary?.sourcesOK?.length || 0;

      // 2️⃣ Calcul cohérence modèle ↔ stations
      let coherence = 0;
      if (stations?.data?.length) {
        try {
          const s = stations.data[0];
          const stTemps = parseFloat(s.temperature_2m || s.T2M || s.temp || 0);
          const delta = Math.abs((r.temperature ?? 0) - stTemps);
          coherence = Math.max(0, 1 - delta / 10);
        } catch {
          coherence = 0.5;
        }
      } else coherence = 0.4;

      // 3️⃣ Calcul Indice Global J.E.A.N.
      const jeanIndex = Math.round(((reliability * 0.6) + (coherence * 0.4)) * 100);

      const aiResult = {
        ...r,
        jeanIndex,
        coherence,
        stationSources: stations?.summary?.sourcesOK || [],
        stationErrors: stations?.summary?.sourcesFail || [],
      };

      enriched.push(aiResult);
      await addEngineLog(
        `🧠 ${country} → Indice J.E.A.N. ${jeanIndex}% (cohérence ${Math.round(coherence*100)}%)`,
        "info",
        "aiAnalysis"
      );
    }

    const avgJean = Math.round(
      enriched.reduce((a, b) => a + (b.jeanIndex || 0), 0) / (enriched.length || 1)
    );

    await addEngineLog(`✅ IA J.E.A.N. terminée – Indice Global ${avgJean}%`, "success", "aiAnalysis");
    return { enriched, indiceGlobal: avgJean };
  } catch (e) {
    await addEngineError("Erreur IA J.E.A.N. : " + e.message, "aiAnalysis");
    return { error: e.message };
  }
}

export default { runAIAnalysis };
