// services/stationsService.js
// 📡 Stations météo locales (AllMetsat + autres)
// Objectif : récupérer observations locales (température, vent, pression, humidité)

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";

export async function fetchStationData(lat, lon, country, region) {
  try {
    addEngineLog(`📡 Lecture stations locales pour ${country}${region ? " - " + region : ""}`);

    // AllMetsat (données observation en direct)
    let stationData = null;
    try {
      const res = await axios.get(
        `https://www.allmetsat.com/observations/metar-json.php?lat=${lat}&lon=${lon}`
      );
      stationData = res.data;
    } catch (e) {
      addEngineLog("⚠️ AllMetsat non disponible");
    }

    return {
      type: "stations",
      data: stationData,
    };
  } catch (err) {
    addEngineError(`Erreur lecture stations locales: ${err.message}`);
    return { type: "stations", error: err.message };
  }
}
