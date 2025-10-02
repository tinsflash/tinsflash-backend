// PATH: services/superForecast.js
// SuperForecast — prévisions enrichies multi-sources par point unique
// ⚡ Centrale nucléaire météo – Moteur atomique orchestral

import gfs from "./gfs.js";
import ecmwf from "./ecmwf.js";
import icon from "./icon.js";
import meteomatics from "./meteomatics.js";
import nasaSat from "./nasaSat.js";
import copernicus from "./copernicusService.js";
import trullemans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";
import hrrr from "./hrrr.js";          // 🇺🇸 HRRR (NOAA, USA only)
import arome from "./arome.js";        // 🇫🇷🇧🇪 AROME (France/Belgique via Meteomatics)
import { askOpenAI } from "./openaiService.js";
import {
  addEngineLog,
  addEngineError,
  saveEngineState,
  getEngineState,
} from "./engineState.js";

// Facteurs d’ajustement
import { applyGeoFactors } from "./geoFactors.js";     
import adjustWithLocalFactors from "./localFactors.js"; 
import forecastVision from "./forecastVision.js";       

// ✅ Export NOMMÉ uniquement
export async function runSuperForecast({ lat, lon, country, region }) {
  const state = await getEngineState();
  try {
    addEngineLog(
      `⚡ Lancement du SuperForecast pour ${country}${
        region ? " - " + region : ""
      } (${lat},${lon})`
    );

    // === Étape 1 : préparer Copernicus ERA5
    const copernicusRequest = {
      variable: ["2m_temperature", "total_precipitation"],
      product_type: "reanalysis",
      year: new Date().getUTCFullYear(),
      month: String(new Date().getUTCMonth() + 1).padStart(2, "0"),
      day: String(new Date().getUTCDate()).padStart(2, "0"),
      time: ["00:00", "06:00", "12:00", "18:00"],
      area: [lat + 0.25, lon - 0.25, lat - 0.25, lon + 0.25],
      format: "json",
    };

    // === Étape 2 : récupérer toutes les sources météo
    addEngineLog("📡 Récupération multi-sources météo…");
    const [
      gfsData,
      ecmwfData,
      iconData,
      meteomaticsData,
      nasaData,
      copernicusData,
      trullemansData,
      wetterzentraleData,
      hrrrData,
      aromeData,
    ] = await Promise.allSettled([
      gfs({ lat, lon, country }),
      ecmwf({ lat, lon, country }),
      icon({ lat, lon, country }),
      meteomatics({ lat, lon, country }),
      nasaSat({ lat, lon, country }),
      copernicus("reanalysis-era5-land", copernicusRequest),
      trullemans({ lat, lon, country }),
      wetterzentrale({ lat, lon, country }),
      hrrr(lat, lon),
      arome(lat, lon),
    ]);

    const sources = {
      gfs: gfsData.value ?? { error: gfsData.reason?.message },
      ecmwf: ecmwfData.value ?? { error: ecmwfData.reason?.message },
      icon: iconData.value ?? { error: iconData.reason?.message },
      meteomatics: meteomaticsData.value ?? { error: meteomaticsData.reason?.message },
      nasaSat: nasaData.value ?? { error: nasaData.reason?.message },
      copernicus: copernicusData.value ?? { error: copernicusData.reason?.message },
      trullemans: trullemansData.value ?? { error: trullemansData.reason?.message },
      wetterzentrale: wetterzentraleData.value ?? { error: wetterzentraleData.reason?.message },
      hrrr: hrrrData.value ?? { error: hrrrData.reason?.message },
      arome: aromeData.value ?? { error: aromeData.reason?.message },
    };
    addEngineLog("✅ Sources météo collectées");

    // === Étape 3 : fusion brute (GFS/ECMWF/ICON + Meteomatics si dispo)
    const baseForecast = {};
    try {
      const temps = [];
      if (sources.gfs?.temperature) temps.push(sources.gfs.temperature);
      if (sources.ecmwf?.temperature) temps.push(sources.ecmwf.temperature);
      if (sources.icon?.temperature) temps.push(sources.icon.temperature);
      if (sources.meteomatics?.temperature) temps.push(sources.meteomatics.temperature);
      baseForecast.temperature = temps.length
        ? temps.reduce((a, b) => a + b, 0) / temps.length
        : null;

      const precs = [];
      if (sources.gfs?.precipitation) precs.push(sources.gfs.precipitation);
      if (sources.ecmwf?.precipitation) precs.push(sources.ecmwf.precipitation);
      if (sources.icon?.precipitation) precs.push(sources.icon.precipitation);
      if (sources.meteomatics?.precipitation) precs.push(sources.meteomatics.precipitation);
      baseForecast.precipitation = precs.length
        ? precs.reduce((a, b) => a + b, 0) / precs.length
        : null;
    } catch (err) {
      addEngineError("⚠️ Erreur fusion brute prévisions: " + err.message);
    }

    // === Étape 4 : ajustements globaux et locaux
    let enriched = await applyGeoFactors(baseForecast, lat, lon, country);
    enriched = await adjustWithLocalFactors(enriched, country, lat, lon);

    // === Étape 4bis : anomalies saisonnières
    const anomaly = forecastVision.detectSeasonalAnomaly(
      sources.gfs || sources.ecmwf || null
    );
    if (anomaly) {
      enriched.anomaly = anomaly;
    }

    // === Étape 5 : analyse IA avec retour JSON
    addEngineLog("🤖 Analyse IA des données multi-sources…");
    const prompt = `
Prévisions météo enrichies pour un point précis.
Coordonnées: lat=${lat}, lon=${lon}, pays=${country}${
      region ? ", région=" + region : ""
    }

Fusion principale: ${JSON.stringify(baseForecast)}
Ajustements: ${JSON.stringify(enriched)}
Sources principales: GFS, ECMWF, ICON, Meteomatics, NASA, Copernicus
Compléments: HRRR (USA), AROME (FR/BE)
Benchmarks: Trullemans, Wetterzentrale

Consignes IA:
1. Fournir un retour en JSON strict uniquement.
2. Structure attendue :
{
  "resume": "...",
  "temperature": "...",
  "precipitation": "...",
  "vent": "...",
  "risques": ["..."],
  "fiabilite": "...%",
  "bulletin": "Texte simplifié grand public"
}
3. Ne jamais sortir de texte en dehors du JSON.
`;

    let aiFusion = await askOpenAI(
      "Tu es un moteur météo avancé qui produit un JSON structuré fiable.",
      prompt
    );

    let parsedForecast;
    try {
      parsedForecast = JSON.parse(aiFusion);
    } catch {
      parsedForecast = { raw: aiFusion }; // fallback
    }

    // === Étape 6 : sauvegarde
    state.superForecasts = state.superForecasts || [];
    state.superForecasts.push({
      lat,
      lon,
      country,
      region,
      forecast: parsedForecast,
      sources,
      enriched,
    });
    await saveEngineState(state);

    addEngineLog("🏁 SuperForecast terminé avec succès");
    return { lat, lon, country, region, forecast: parsedForecast, sources, enriched };
  } catch (err) {
    await addEngineError(err.message || "Erreur inconnue SuperForecast");
    addEngineLog("❌ Erreur dans SuperForecast");
    return { error: err.message };
  }
}
