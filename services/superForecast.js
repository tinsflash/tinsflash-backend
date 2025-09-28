// services/superForecast.js
// ⚡ SuperForecast — prévisions enrichies multi-sources par point unique
// + orchestration globale (Europe + USA)

import gfs from "./gfs.js";
import ecmwf from "./ecmwf.js";
import icon from "./icon.js";
import meteomatics from "./meteomatics.js";
import nasaSat from "./nasaSat.js";
import copernicus from "./copernicusService.js";
import trullemans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";
import { askOpenAI } from "./openaiService.js"; // ✅ IA centrale
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";

import { runGlobalEurope } from "./runGlobalEurope.js";
import { runGlobalUSA } from "./runGlobalUSA.js";
import { processAlerts } from "./alertsService.js";

// =======================================================
// 1) SuperForecast par point unique (inchangé)
// =======================================================
export async function runSuperForecast({ lat, lon, country, region }) {
  const state = getEngineState();
  try {
    addEngineLog(`⚡ Lancement du SuperForecast pour ${country}${region ? " - " + region : ""} (${lat},${lon})`);

    // === Étape 1 : préparer Copernicus ERA5
    const copernicusRequest = {
      variable: ["2m_temperature", "total_precipitation"],
      product_type: "reanalysis",
      year: new Date().getUTCFullYear(),
      month: String(new Date().getUTCMonth() + 1).padStart(2, "0"),
      day: String(new Date().getUTCDate()).padStart(2, "0"),
      time: ["00:00", "06:00", "12:00", "18:00"],
      area: [lat + 0.25, lon - 0.25, lat - 0.25, lon + 0.25],
      format: "json"
    };

    // === Étape 2 : récupérer toutes les sources météo
    addEngineLog("📡 Récupération multi-sources météo…");
    const [
      gfsData, ecmwfData, iconData,
      meteomaticsData, nasaData, copernicusData,
      trullemansData, wetterzentraleData
    ] = await Promise.allSettled([
      gfs({ lat, lon, country }),
      ecmwf({ lat, lon, country }),
      icon({ lat, lon, country }),
      meteomatics({ lat, lon, country }),
      nasaSat({ lat, lon, country }),
      copernicus("reanalysis-era5-land", copernicusRequest),
      trullemans({ lat, lon, country }),
      wetterzentrale({ lat, lon, country })
    ]);

    const sources = {
      gfs: gfsData.value ?? { error: gfsData.reason?.message },
      ecmwf: ecmwfData.value ?? { error: ecmwfData.reason?.message },
      icon: iconData.value ?? { error: iconData.reason?.message },
      meteomatics: meteomaticsData.value ?? { error: meteomaticsData.reason?.message },
      nasaSat: nasaData.value ?? { error: nasaData.reason?.message },
      copernicus: copernicusData.value ?? { error: copernicusData.reason?.message },
      trullemans: trullemansData.value ?? { error: trullemansData.reason?.message },
      wetterzentrale: wetterzentraleData.value ?? { error: wetterzentraleData.reason?.message }
    };
    addEngineLog("✅ Sources météo collectées");

    // === Étape 3 : analyse IA
    addEngineLog("🤖 Analyse IA des données multi-sources…");
    const prompt = `
Prévisions météo enrichies pour un point précis.
Coordonnées: lat=${lat}, lon=${lon}, pays=${country}${region ? ", région=" + region : ""}

Sources principales:
- GFS: ${JSON.stringify(sources.gfs)}
- ECMWF: ${JSON.stringify(sources.ecmwf)}
- ICON: ${JSON.stringify(sources.icon)}
- Meteomatics: ${JSON.stringify(sources.meteomatics)}
- NASA POWER / Satellites: ${JSON.stringify(sources.nasaSat)}
- Copernicus ERA5: ${JSON.stringify(sources.copernicus)}

Données comparatives (benchmarks qualité, ne pas copier):
- Trullemans: ${JSON.stringify(sources.trullemans)}
- Wetterzentrale: ${JSON.stringify(sources.wetterzentrale)}

Consignes IA:
- Croiser et fusionner uniquement les données principales.
- Comparer avec Trullemans/Wetterzentrale uniquement pour ajuster la fiabilité.
- Fournir un bulletin détaillé: températures, précipitations, vent, risques météo.
- Horizon: aujourd'hui + 7 jours.
- Mentionner incertitudes et fiabilité globale.
- Style clair, professionnel, bulletin météo en français.
`;

    const analysis = await askOpenAI(prompt);
    addEngineLog("✅ Analyse IA terminée");

    // === Étape 4 : sauvegarde
    if (!state.superForecasts) state.superForecasts = [];
    state.superForecasts.push({
      lat, lon, country, region, forecast: analysis, sources
    });
    saveEngineState(state);
    addEngineLog("💾 SuperForecast sauvegardé");

    addEngineLog("🏁 SuperForecast terminé avec succès");
    return { lat, lon, country, region, forecast: analysis, sources };
  } catch (err) {
    addEngineError(err.message || "Erreur inconnue SuperForecast");
    addEngineLog("❌ Erreur dans SuperForecast");
    return { error: err.message };
  }
}

// =======================================================
// 2) Orchestration Globale (Europe + USA)
// =======================================================
export async function runSuperForecastGlobal() {
  const state = getEngineState();
  try {
    addEngineLog("🌍 Lancement du SUPER FORECAST GLOBAL (Europe + USA)…");
    state.runTime = new Date().toISOString();
    state.checkup = { europe: "PENDING", usa: "PENDING", alerts: "PENDING" };
    saveEngineState(state);

    let europeResult, usaResult;

    try {
      europeResult = await runGlobalEurope();
      state.checkup.europe = europeResult?.error ? "FAIL" : "OK";
    } catch (e) {
      addEngineError(`❌ Erreur Europe: ${e.message}`);
      state.checkup.europe = "FAIL";
    }

    try {
      usaResult = await runGlobalUSA();
      state.checkup.usa = usaResult?.error ? "FAIL" : "OK";
    } catch (e) {
      addEngineError(`❌ Erreur USA: ${e.message}`);
      state.checkup.usa = "FAIL";
    }

    // Fusion globale
    state.zonesGlobal = {
      europe: europeResult?.summary || {},
      usa: usaResult?.summary || {}
    };

    // Alertes
    let alertsResult;
    try {
      alertsResult = await processAlerts();
      state.checkup.alerts = alertsResult?.error ? "FAIL" : "OK";
    } catch (e) {
      addEngineError(`❌ Erreur alertes: ${e.message}`);
      state.checkup.alerts = "FAIL";
    }

    state.checkup.engineStatus = "OK";
    saveEngineState(state);
    addEngineLog("✅ SUPER FORECAST GLOBAL terminé");

    return { europe: europeResult, usa: usaResult, alerts: alertsResult, summary: state.zonesGlobal };
  } catch (err) {
    addEngineError(err.message || "Erreur inconnue SUPER FORECAST GLOBAL");
    state.checkup.engineStatus = "FAIL";
    saveEngineState(state);
    addEngineLog("❌ SUPER FORECAST GLOBAL en échec");
    return { error: err.message };
  }
}
