// PATH: services/sourcesFreshness.js
// Vérifie la fraîcheur et l’accessibilité des sources météo
// ⚡ Centrale nucléaire météo

import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";

// === Liste des sources à tester ===
const sources = {
  GFS: "https://nomads.ncep.noaa.gov",          // NOAA GFS
  ECMWF: "https://www.ecmwf.int",               // ECMWF
  ICON: "https://opendata.dwd.de",              // Deutscher Wetterdienst
  Meteomatics: "https://api.meteomatics.com",   // Meteomatics
  NASA: "https://power.larc.nasa.gov",          // NASA POWER
  Copernicus: "https://cds.climate.copernicus.eu", // Copernicus ERA5
  OpenWeather: "https://api.openweathermap.org" // OpenWeather fallback
};

// Petit fetch avec timeout
async function checkURL(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    clearTimeout(timeout);
    return false;
  }
}

export async function checkSourcesFreshness() {
  const state = getEngineState();
  const results = {};

  try {
    addEngineLog("📡 Vérification fraîcheur des sources météo…");

    for (const [name, url] of Object.entries(sources)) {
      addEngineLog(`🔎 Test source : ${name}`);
      const ok = await checkURL(url);
      results[name] = ok ? "OK" : "NO OK";

      if (ok) {
        addEngineLog(`✅ Source ${name} opérationnelle`);
      } else {
        addEngineError(`❌ Source ${name} inaccessible`);
      }
    }

    // Sauvegarder dans engineState
    state.sources = results;
    saveEngineState(state);

    addEngineLog("🏁 Vérification des sources terminée");
    return results;
  } catch (err) {
    addEngineError(err.message || "Erreur checkSourcesFreshness");
    addEngineLog("❌ Erreur pendant la vérification des sources");
    return { error: err.message };
  }
}
