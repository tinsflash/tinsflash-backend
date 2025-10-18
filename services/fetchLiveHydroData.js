// ==========================================================
// 💧 fetchLiveHydroData.js — Mise à jour hydrométrique temps réel (Floreffe)
// ==========================================================

import fs from "fs";
import path from "path";
import axios from "axios";
import { addEngineError, addEngineLog } from "./engineState.js";

export async function fetchLiveHydroData() {
  const datasetsPath = path.resolve("./services/datasets");
  const localPath = `${datasetsPath}/floreffe_hydro.json`;

  try {
    // 🔹 Étape 1 — essayer la source live (à activer quand tu auras le flux JSON officiel)
    const liveUrl = "https://hydrometrie.wallonie.be/api/floreffe"; // ⚙️ placeholder futur flux JSON
    const res = await axios.get(liveUrl, { timeout: 10000 });
    if (res.data?.stations?.length) {
      await addEngineLog(`🌊 Données hydrométriques live chargées (${res.data.stations.length} stations)`, "info", "HydroLive");
      return res.data;
    }
  } catch (err) {
    await addEngineError(`Source live non disponible : ${err.message}`, "HydroLive");
  }

  try {
    // 🔹 Étape 2 — fallback local
    const data = JSON.parse(fs.readFileSync(localPath, "utf8"));
    await addEngineLog(`💾 Données hydrométriques locales chargées (${data.rivieres?.length ?? 0} rivières)`, "info", "HydroLocal");
    return data;
  } catch (err) {
    await addEngineError(`Erreur lecture hydro locale : ${err.message}`, "HydroLocal");
    return { stations: [] };
  }
}
