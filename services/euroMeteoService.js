// PATH: services/euroMeteoService.js
// 🌍 Vérification interne des alertes européennes (EUMETNET / MeteoAlarm)
// ⚙️ Cross-check silencieux avec les sources officielles européennes
// (jamais affiché publiquement)

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";

/**
 * 🔍 Récupère les alertes MeteoAlarm pour un pays donné (format CAP XML/JSON)
 */
export async function getMeteoAlarm(countryCode) {
  try {
    // Source officielle EUMETNET / MeteoAlarm open
    const url = `https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-${countryCode.toLowerCase()}.en.json`;
    const res = await axios.get(url, { timeout: 15000 });
    return res.data?.alerts || [];
  } catch (err) {
    await addEngineError(`❌ MeteoAlarm (${countryCode}) : ${err.message}`);
    return [];
  }
}

/**
 * ⚙️ Compare nos alertes TINSFLASH avec MeteoAlarm pour les pays couverts
 * @param {Object} tinsflashForecasts Prévisions locales internes (Europe)
 * @param {Array} tinsflashAlerts Alertes générées par notre moteur
 */
export async function crossCheck(tinsflashForecasts = {}, tinsflashAlerts = []) {
  try {
    let compared = 0;
    let differences = 0;
    let aheadCount = 0;

    // Liste simplifiée de pays EUMETNET (UE27 + UK + CH + NO + SE)
    const COUNTRIES = [
      "BE", "FR", "DE", "NL", "LU", "IT", "ES", "PT", "AT", "CH", "SE", "NO",
      "PL", "CZ", "SK", "HU", "SI", "HR", "RO", "BG", "GR", "IE", "DK", "FI",
      "EE", "LV", "LT", "UK", "UA"
    ];

    for (const code of COUNTRIES) {
      const official = await getMeteoAlarm(code);
      const ours = tinsflashAlerts.filter(a => a.country === code);

      compared += ours.length;
      if (!official.length) continue;

      for (const alert of ours) {
        const same = official.find(o => {
          const title = o.title?.toLowerCase() || "";
          return title.includes(alert.type?.toLowerCase() || "");
        });
        if (!same) differences++;
        if (!same && alert.confidence >= 0.8) aheadCount++;
      }
    }

    const summary = `Comparé ${compared} alertes sur ${COUNTRIES.length} pays. Différences ${differences}, TINSFLASH en avance ${aheadCount}.`;
    await addEngineLog(`📊 Cross-check MeteoAlarm : ${summary}`);

    return { compared, differences, aheadCount, summary };
  } catch (err) {
    await addEngineError(`⚠️ Erreur crossCheck MeteoAlarm : ${err.message}`);
    return { compared: 0, differences: 0, aheadCount: 0, summary: err.message };
  }
}

export default { getMeteoAlarm, crossCheck };
