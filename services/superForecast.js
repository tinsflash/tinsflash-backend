// PATH: services/superForecast.js
// SuperForecast — prévisions enrichies multi-sources + facteurs environnementaux
// ⚡ Centrale nucléaire météo – Moteur atomique

import { runGlobalEurope } from "./runGlobalEurope.js";
import { runGlobalUSA } from "./runGlobalUSA.js";
import gfs from "./gfs.js";
import ecmwf from "./ecmwf.js";
import icon from "./icon.js";
import meteomatics from "./meteomatics.js";
import nasaSat from "./nasaSat.js";
import copernicus from "./copernicusService.js";
import trullemans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";
import { applyGeoFactors } from "./geoFactors.js";   // ✅ ajustements relief/climat
import { askOpenAI } from "./openaiService.js";     // ✅ IA centrale
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";

// ✅ Export explicite
export async function runSuperForecastGlobal() {
  const state = getEngineState();
  try {
    addEngineLog("⚡ Lancement du SuperForecast Global…");

    // === Étape 1 : RUN Europe + USA ===
    addEngineLog("🌍 RUN Europe (zones couvertes détaillées) …");
    const europeData = await runGlobalEurope();

    addEngineLog("🇺🇸 RUN USA (États + sous-régions stratégiques) …");
    const usaData = await runGlobalUSA();

    // === Étape 2 : Collecte multi-sources météo ===
    addEngineLog("📡 Collecte des modèles et satellites…");
    const [
      gfsData, ecmwfData, iconData,
      meteomaticsData, nasaData, copernicusData,
      trullemansData, wetterzentraleData
    ] = await Promise.allSettled([
      gfs(),
      ecmwf(),
      icon(),
      meteomatics(),
      nasaSat(),
      copernicus("reanalysis-era5-land", { variable: ["2m_temperature", "total_precipitation"] }),
      trullemans(),
      wetterzentrale()
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

    // === Étape 3 : Fusion interne des modèles ===
    addEngineLog("🔀 Fusion interne des modèles météo…");
    const fusedModels = {
      temperature: {
        gfs: sources.gfs?.temperature,
        ecmwf: sources.ecmwf?.temperature,
        icon: sources.icon?.temperature,
        meteomatics: sources.meteomatics?.temperature
      },
      precipitation: {
        gfs: sources.gfs?.precipitation,
        ecmwf: sources.ecmwf?.precipitation,
        icon: sources.icon?.precipitation,
        meteomatics: sources.meteomatics?.precipitation
      },
      wind: {
        gfs: sources.gfs?.wind,
        ecmwf: sources.ecmwf?.wind,
        icon: sources.icon?.wind
      }
    };

    // === Étape 4 : Facteurs relief/climat/environnement ===
    addEngineLog("⛰️ Ajustements relief, climat, océans…");
    const adjustedData = await applyGeoFactors(fusedModels, europeData, usaData);

    // === Étape 5 : IA Finale ===
    addEngineLog("🤖 Analyse IA finale…");
    const prompt = `
SuperForecast Global — Synthèse finale

Prévisions attendues :
1. Locales (Europe par pays/régions + USA par États/sous-régions)
2. Nationales
3. Mondiales
4. Alertes locales, nationales, mondiales (règles fiabilité incluses)

Sources fusionnées et ajustées:
${JSON.stringify(adjustedData)}

Zones internes couvertes:
Europe: ${JSON.stringify(europeData)}
USA: ${JSON.stringify(usaData)}

Comparatifs (qualité uniquement, ne pas copier):
Trullemans: ${JSON.stringify(sources.trullemans)}
Wetterzentrale: ${JSON.stringify(sources.wetterzentrale)}

Règles alertes:
- fiabilité <70% = ignorée
- 70–90% = attente / expert
- >90% = publiée automatiquement
    `;

    const analysis = await askOpenAI(prompt);
    addEngineLog("✅ Analyse IA terminée");

    // === Étape 6 : Sauvegarde ===
    state.superForecastGlobal = {
      europe: europeData,
      usa: usaData,
      fused: adjustedData,
      forecast: analysis,
      sources
    };
    saveEngineState(state);

    addEngineLog("💾 SuperForecast Global sauvegardé");
    addEngineLog("🏁 Processus Global terminé avec succès");

    return state.superForecastGlobal;
  } catch (err) {
    addEngineError(err.message || "Erreur inconnue SuperForecast Global");
    addEngineLog("❌ Échec du SuperForecast Global");
    return { error: err.message };
  }
}
