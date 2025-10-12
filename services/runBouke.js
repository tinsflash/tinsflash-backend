// ==========================================================
// 🎥 TINSFLASH – runBouke.js (Everest Protocol v3.9 PRO+++)
// ==========================================================
// Extraction locale complète – Province de Namur (Bouké TV)
// But : couverture ultra-détaillée (communes + villages)
// ==========================================================

import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError } from "./engineState.js";

export async function runBouke() {
  try {
    await addEngineLog("🎥 Démarrage runBouké (Province de Namur complète)", "info", "runBouke");

    // ==========================================================
    // 📍 COMMUNES ET VILLAGES DE LA PROVINCE DE NAMUR
    // ==========================================================
    const zones = [
      // --- Namur (commune et sections)
      { name: "Namur", lat: 50.4669, lon: 4.8675 },
      { name: "Salzinnes", lat: 50.4606, lon: 4.8593 },
      { name: "Jambes", lat: 50.451, lon: 4.872 },
      { name: "Wépion", lat: 50.42, lon: 4.88 },
      { name: "Saint-Servais", lat: 50.47, lon: 4.85 },
      { name: "Vedrin", lat: 50.49, lon: 4.86 },
      { name: "Beez", lat: 50.47, lon: 4.91 },
      { name: "Belgrade", lat: 50.48, lon: 4.83 },
      { name: "Malonne", lat: 50.44, lon: 4.78 },
      { name: "Erpent", lat: 50.44, lon: 4.93 },
      { name: "Flawinne", lat: 50.456, lon: 4.809 },
      { name: "Suarlée", lat: 50.49, lon: 4.75 },
      { name: "Temploux", lat: 50.48, lon: 4.73 },

      // --- Floreffe / Floriffoux / Franière / Soye
      { name: "Floreffe", lat: 50.43, lon: 4.75 },
      { name: "Floriffoux", lat: 50.46, lon: 4.75 },
      { name: "Franière", lat: 50.44, lon: 4.73 },
      { name: "Soye", lat: 50.47, lon: 4.72 },

      // --- Fosses-la-Ville et environs
      { name: "Fosses-la-Ville", lat: 50.39, lon: 4.69 },
      { name: "Sart-Eustache", lat: 50.40, lon: 4.68 },
      { name: "Le Roux", lat: 50.40, lon: 4.63 },
      { name: "Vitrival", lat: 50.38, lon: 4.67 },
      { name: "Aisemont", lat: 50.40, lon: 4.65 },

      // --- Sambreville (Arsimont, Tamines, Auvelais)
      { name: "Arsimont", lat: 50.47, lon: 4.61 },
      { name: "Tamines", lat: 50.44, lon: 4.63 },
      { name: "Auvelais", lat: 50.44, lon: 4.63 },
      { name: "Moignelée", lat: 50.45, lon: 4.60 },
      { name: "Keumiée", lat: 50.47, lon: 4.58 },

      // --- Jemeppe-sur-Sambre
      { name: "Moustier-sur-Sambre", lat: 50.49, lon: 4.69 },
      { name: "Spy", lat: 50.52, lon: 4.68 },
      { name: "Balâtre", lat: 50.54, lon: 4.63 },
      { name: "Saint-Martin", lat: 50.51, lon: 4.67 },
      { name: "Onoz", lat: 50.51, lon: 4.68 },

      // --- Gembloux
      { name: "Gembloux", lat: 50.56, lon: 4.69 },
      { name: "Grand-Leez", lat: 50.56, lon: 4.76 },
      { name: "Grand-Manil", lat: 50.55, lon: 4.67 },
      { name: "Sauvenière", lat: 50.54, lon: 4.64 },
      { name: "Beuzet", lat: 50.54, lon: 4.61 },
      { name: "Bossière", lat: 50.52, lon: 4.63 },

      // --- Éghezée
      { name: "Éghezée", lat: 50.57, lon: 4.91 },
      { name: "Liernu", lat: 50.56, lon: 4.89 },
      { name: "Mehaigne", lat: 50.58, lon: 4.99 },
      { name: "Upigny", lat: 50.60, lon: 4.90 },
      { name: "Noville-sur-Méhaigne", lat: 50.59, lon: 4.95 },

      // --- Andenne
      { name: "Andenne", lat: 50.49, lon: 5.09 },
      { name: "Seilles", lat: 50.49, lon: 5.07 },
      { name: "Bonneville", lat: 50.50, lon: 5.04 },
      { name: "Landenne", lat: 50.50, lon: 5.03 },
      { name: "Coutisse", lat: 50.47, lon: 5.10 },
      { name: "Maizeret", lat: 50.48, lon: 5.06 },

      // --- Profondeville
      { name: "Profondeville", lat: 50.38, lon: 4.87 },
      { name: "Lesve", lat: 50.40, lon: 4.79 },
      { name: "Lustin", lat: 50.37, lon: 4.86 },
      { name: "Rivière", lat: 50.36, lon: 4.82 },
      { name: "Bois-de-Villers", lat: 50.40, lon: 4.77 },

      // --- Dinant / Vallée de la Meuse
      { name: "Dinant", lat: 50.26, lon: 4.91 },
      { name: "Anhée", lat: 50.29, lon: 4.88 },
      { name: "Yvoir", lat: 50.32, lon: 4.88 },
      { name: "Hastière", lat: 50.21, lon: 4.83 },
      { name: "Onhaye", lat: 50.27, lon: 4.83 },
      { name: "Falmagne", lat: 50.23, lon: 4.93 },

      // --- Ciney
      { name: "Ciney", lat: 50.29, lon: 5.09 },
      { name: "Leignon", lat: 50.29, lon: 5.05 },
      { name: "Braibant", lat: 50.28, lon: 5.08 },
      { name: "Chevetogne", lat: 50.25, lon: 5.16 },
      { name: "Haversin", lat: 50.25, lon: 5.22 },

      // --- Gesves / Assesse
      { name: "Gesves", lat: 50.39, lon: 5.07 },
      { name: "Assesse", lat: 50.36, lon: 4.97 },
      { name: "Sart-Bernard", lat: 50.38, lon: 4.93 },
      { name: "Sorinne-la-Longue", lat: 50.40, lon: 4.95 },

      // --- Couvin / Philippeville / Walcourt
      { name: "Couvin", lat: 50.05, lon: 4.49 },
      { name: "Mariembourg", lat: 50.07, lon: 4.53 },
      { name: "Philippeville", lat: 50.20, lon: 4.54 },
      { name: "Walcourt", lat: 50.25, lon: 4.44 },
      { name: "Cerfontaine", lat: 50.18, lon: 4.46 },
      { name: "Gerpinnes", lat: 50.33, lon: 4.53 },
    ];

    const result = await superForecast({ zones, runType: "Bouke-Namur" });
    await addEngineLog(`✅ runBouké terminé (${zones.length} zones locales)`, "success", "runBouke");
    return result;
  } catch (err) {
    await addEngineError(`Erreur runBouké : ${err.message}`, "runBouke");
    console.error("❌ Erreur runBouké :", err.message);
    return { error: err.message };
  }
}
