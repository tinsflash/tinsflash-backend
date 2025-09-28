// PATH: services/runGlobal.js
// RUN GLOBAL – Prévisions locales/nationales sur zones couvertes

import gfs from "./gfs.js";
import ecmwf from "./ecmwf.js";
import icon from "./icon.js";
import meteomatics from "./meteomatics.js";
import nasaSat from "./nasaSat.js";
import copernicus from "./copernicusService.js";
import trullemans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";
import { askAI } from "./chatService.js";
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import { processAlerts } from "./alertsService.js";

export async function runGlobal() {
  const state = getEngineState();
  try {
    addEngineLog("🚀 Lancement du RUN GLOBAL…");

    // === Étape 1 : récupération des modèles
    addEngineLog("📡 Récupération données GFS/ECMWF/ICON/Meteomatics…");
    const gfsData = await gfs({});
    const ecmwfData = await ecmwf({});
    const iconData = await icon({});
    const meteomaticsData = await meteomatics({});

    addEngineLog("✅ Modèles principaux récupérés");

    // === Étape 2 : satellites et climat
    addEngineLog("🛰️ Intégration données NASA & Copernicus…");
    const nasaData = await nasaSat({});
    const copernicusData = await copernicus("reanalysis-era5-land", {});

    addEngineLog("✅ Sources satellites & climat intégrées");

    // === Étape 3 : comparateurs externes
    addEngineLog("🔎 Vérification avec Trullemans & Wetterzentrale…");
    const trullemansData = await trullemans({});
    const wetterzentraleData = await wetterzentrale({});
    addEngineLog("✅ Comparateurs chargés");

    // === Étape 4 : IA prévisions
    addEngineLog("🤖 Analyse IA des prévisions locales/nationales…");
    const prompt = `
Fusionne les données météo ci-dessous pour produire un bulletin :
- GFS: ${JSON.stringify(gfsData)}
- ECMWF: ${JSON.stringify(ecmwfData)}
- ICON: ${JSON.stringify(iconData)}
- Meteomatics: ${JSON.stringify(meteomaticsData)}
- NASA: ${JSON.stringify(nasaData)}
- Copernicus: ${JSON.stringify(copernicusData)}
Benchmarks (ne pas copier) :
- Trullemans: ${JSON.stringify(trullemansData)}
- Wetterzentrale: ${JSON.stringify(wetterzentraleData)}
`;
    const analysis = await askAI(prompt);

    addEngineLog("✅ Analyse IA des prévisions terminée");

    // === Étape 5 : Sauvegarde dans state
    state.globalForecast = {
      gfsData, ecmwfData, iconData, meteomaticsData,
      nasaData, copernicusData, trullemansData, wetterzentraleData,
      analysis,
    };
    saveEngineState(state);
    addEngineLog("💾 Prévisions globales sauvegardées dans engineState");

    // === Étape 6 : alertes automatiques
    addEngineLog("🚨 Traitement des alertes associées aux prévisions…");
    const alertStats = await processAlerts();
    addEngineLog("✅ Alertes traitées");

    addEngineLog("🏁 RUN GLOBAL terminé avec succès");
    return { forecast: analysis, alertStats };
  } catch (err) {
    addEngineError(err.message || "Erreur inconnue RUN GLOBAL");
    addEngineLog("❌ Erreur dans RUN GLOBAL");
    return { error: err.message };
  }
}
