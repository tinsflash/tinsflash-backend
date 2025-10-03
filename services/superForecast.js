// PATH: services/superForecast.js
// SuperForecast — prévisions enrichies multi-sources par point unique
// ⚡ Centrale nucléaire météo – Moteur atomique orchestral

// === Sources physiques et satellites (déjà en place)
import gfs from "./gfs.js";
import ecmwf from "./ecmwf.js";
import icon from "./icon.js";
import meteomatics from "./meteomatics.js";
import nasaSat from "./nasaSat.js";
import copernicus from "./copernicusService.js";
import trullemans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";
import hrrr from "./hrrr.js";
import arome from "./arome.js";

// === Nouvelles IA
import aifs from "./aifs.js";              
import graphcast from "./graphcast.js";    
import pangu from "./pangu.js";            
import nowcastnet from "./nowcastnet.js";  
import corrDiff from "./corrDiff.js";      

// === Services internes
import { askOpenAI } from "./openaiService.js";
import {
  addEngineLog,
  addEngineError,
  saveEngineState,
  getEngineState,
} from "./engineState.js";

import { applyGeoFactors } from "./geoFactors.js";     
import adjustWithLocalFactors from "./localFactors.js"; 
import forecastVision from "./forecastVision.js";       

// ✅ Export NOMMÉ uniquement
export async function runSuperForecast({ lat, lon, country, region, horizon = 24 }) {
  const state = await getEngineState();
  try {
    addEngineLog(
      `⚡ Lancement du SuperForecast pour ${country}${region ? " - " + region : ""} (${lat},${lon}), horizon=${horizon}h`
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

    // === Étape 2 : récupération toutes sources météo
    addEngineLog("📡 Récupération multi-sources météo (physiques + IA)...");
    const [
      gfsData, ecmwfData, iconData, meteomaticsData, nasaData, copernicusData,
      trullemansData, wetterzentraleData, hrrrData, aromeData,
      aifsData, graphcastData, panguData, nowcastnetData, corrDiffData
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
      aifs({ lat, lon, country }),
      graphcast({ lat, lon, country }),
      pangu({ lat, lon, country }),
      nowcastnet({ lat, lon, country }),
      corrDiff({ lat, lon, country }),
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
      aifs: aifsData.value ?? { error: aifsData.reason?.message },
      graphcast: graphcastData.value ?? { error: graphcastData.reason?.message },
      pangu: panguData.value ?? { error: panguData.reason?.message },
      nowcastnet: nowcastnetData.value ?? { error: nowcastnetData.reason?.message },
      corrDiff: corrDiffData.value ?? { error: corrDiffData.reason?.message },
    };
    addEngineLog("✅ Toutes sources météo collectées");

    // === Étape 3 : pondération dynamique par horizon
    let wPhys = 0.35, wIA = 0.35, wNowcast = 0.25, wDownscale = 0.05;

    if (horizon <= 6) {
      wNowcast = 0.5; wPhys = 0.25; wIA = 0.2;
    } else if (horizon <= 24) {
      wNowcast = 0.2; wPhys = 0.35; wIA = 0.35;
    } else {
      wNowcast = 0.1; wPhys = 0.4; wIA = 0.45;
    }

    // === Étape 4 : Fusion pondérée multi-sources
    const fusion = {};
    try {
      const weightedTemps = [], weightedPrecs = [], weightedWinds = [];

      const pushVal = (arr, val, weight) => {
        if (typeof val === "number" && !isNaN(val)) arr.push(val * weight);
      };

      // Températures
      pushVal(weightedTemps, sources.gfs?.temperature, wPhys);
      pushVal(weightedTemps, sources.ecmwf?.temperature, wPhys);
      pushVal(weightedTemps, sources.icon?.temperature, wPhys);
      pushVal(weightedTemps, sources.meteomatics?.temperature, wPhys);
      pushVal(weightedTemps, sources.copernicus?.temperature, wPhys);

      pushVal(weightedTemps, sources.aifs?.temperature, wIA);
      pushVal(weightedTemps, sources.graphcast?.temperature, wIA);
      pushVal(weightedTemps, sources.pangu?.temperature, wIA);

      pushVal(weightedTemps, sources.nowcastnet?.temperature, wNowcast);
      pushVal(weightedTemps, sources.corrDiff?.temperature, wDownscale);

      // Précipitations
      pushVal(weightedPrecs, sources.gfs?.precipitation, wPhys);
      pushVal(weightedPrecs, sources.ecmwf?.precipitation, wPhys);
      pushVal(weightedPrecs, sources.icon?.precipitation, wPhys);
      pushVal(weightedPrecs, sources.meteomatics?.precipitation, wPhys);
      pushVal(weightedPrecs, sources.copernicus?.precipitation, wPhys);

      pushVal(weightedPrecs, sources.aifs?.precipitation, wIA);
      pushVal(weightedPrecs, sources.graphcast?.precipitation, wIA);
      pushVal(weightedPrecs, sources.pangu?.precipitation, wIA);

      pushVal(weightedPrecs, sources.nowcastnet?.precipitation, wNowcast);
      pushVal(weightedPrecs, sources.corrDiff?.precipitation, wDownscale);

      // Vents
      pushVal(weightedWinds, sources.gfs?.wind, wPhys);
      pushVal(weightedWinds, sources.ecmwf?.wind, wPhys);
      pushVal(weightedWinds, sources.icon?.wind, wPhys);
      pushVal(weightedWinds, sources.meteomatics?.wind, wPhys);

      pushVal(weightedWinds, sources.aifs?.wind, wIA);
      pushVal(weightedWinds, sources.graphcast?.wind, wIA);
      pushVal(weightedWinds, sources.pangu?.wind, wIA);

      pushVal(weightedWinds, sources.nowcastnet?.wind, wNowcast);
      pushVal(weightedWinds, sources.corrDiff?.wind, wDownscale);

      fusion.temperature = weightedTemps.length ? weightedTemps.reduce((a,b)=>a+b,0) / weightedTemps.length : null;
      fusion.precipitation = weightedPrecs.length ? weightedPrecs.reduce((a,b)=>a+b,0) / weightedPrecs.length : null;
      fusion.wind = weightedWinds.length ? weightedWinds.reduce((a,b)=>a+b,0) / weightedWinds.length : null;
      fusion.reliability = Math.min(100, Math.round(((weightedTemps.length + weightedPrecs.length + weightedWinds.length) / 20) * 100));
    } catch (err) {
      addEngineError("⚠️ Erreur fusion pondérée: " + err.message);
    }

    // === Étape 5 : ajustements globaux et locaux
    let enriched = await applyGeoFactors(fusion, lat, lon, country);
    enriched = await adjustWithLocalFactors(enriched, country, lat, lon);

    // === Étape 6 : anomalies saisonnières
    const anomaly = forecastVision.detectSeasonalAnomaly(
      sources.gfs || sources.ecmwf || null
    );
    if (anomaly) enriched.anomaly = anomaly;

    // === Étape 7 : analyse IA
    addEngineLog("🤖 Analyse IA multi-sources (physiques + IA)...");
    const prompt = `
Prévisions météo enrichies pour un point précis.
Coordonnées: lat=${lat}, lon=${lon}, pays=${country}${region ? ", région=" + region : ""}, horizon=${horizon}h

Fusion pondérée: ${JSON.stringify(fusion)}
Ajustements: ${JSON.stringify(enriched)}
Sources principales: GFS, ECMWF, ICON, Meteomatics, Copernicus, NASA
IA: AIFS, GraphCast, Pangu, NowcastNet, CorrDiff
Compléments: HRRR (USA), AROME (FR/BE)
Benchmarks: Trullemans, Wetterzentrale
`;

    let aiFusion = await askOpenAI(
      "Tu es un moteur météo avancé qui produit un JSON structuré fiable.",
      prompt
    );

    let parsedForecast;
    try {
      parsedForecast = JSON.parse(aiFusion);
    } catch {
      parsedForecast = { raw: aiFusion };
    }

    // === Étape 8 : sauvegarde
    state.superForecasts = state.superForecasts || [];
    state.superForecasts.push({
      lat, lon, country, region, horizon,
      forecast: parsedForecast,
      sources,
      enriched,
      fusion,
    });
    await saveEngineState(state);

    addEngineLog("🏁 SuperForecast terminé avec succès");
    return { lat, lon, country, region, horizon, forecast: parsedForecast, sources, enriched, fusion };
  } catch (err) {
    await addEngineError(err.message || "Erreur inconnue SuperForecast");
    addEngineLog("❌ Erreur dans SuperForecast");
    return { error: err.message };
  }
}
