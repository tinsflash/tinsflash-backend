// ==========================================================
// 🌍 runGlobalAfrique.js (TINSFLASH PRO+++ v6.2 – 100 % Afrique)
// ==========================================================
// 🔸 Phase 1 pure – Extraction uniquement (aucune IA ni vidéo)
// 🔸 Sert de passerelle géographique vers superForecast.js
// 🔸 Couverture complète du continent africain + archipels
// 🔸 Respect strict des règles TINSFLASH (imports/exports intouchables)
// ==========================================================

import { addEngineLog, addEngineError } from "./engineState.js";
import { superForecast } from "./superForecast.js";
// ----------------------------------------------------------
// 🛰️ VisionIA – capture et analyse satellite automatique
// ----------------------------------------------------------
import { runVisionIA } from "./runVisionIA.js";
// ==========================================================
// 📍 ZONES GÉOGRAPHIQUES – COUVERTURE INTÉGRALE AFRIQUE
// ==========================================================
const zones = [
  // ======================
  // AFRIQUE DU NORD
  // ======================
  { name: "Casablanca", lat: 33.57, lon: -7.59, country: "MA", region: "Maroc" },
  { name: "Marrakech", lat: 31.63, lon: -8.01, country: "MA", region: "Atlas" },
  { name: "Agadir", lat: 30.43, lon: -9.60, country: "MA", region: "Atlantique" },
  { name: "Alger", lat: 36.75, lon: 3.06, country: "DZ", region: "Algérie" },
  { name: "Tamanrasset", lat: 22.79, lon: 5.53, country: "DZ", region: "Sahara" },
  { name: "Tunis", lat: 36.80, lon: 10.18, country: "TN", region: "Tunisie" },
  { name: "Sfax", lat: 34.74, lon: 10.76, country: "TN", region: "Tunisie" },
  { name: "Tripoli", lat: 32.89, lon: 13.19, country: "LY", region: "Libye" },
  { name: "Benghazi", lat: 32.12, lon: 20.07, country: "LY", region: "Libye" },
  { name: "Le Caire", lat: 30.04, lon: 31.24, country: "EG", region: "Égypte" },
  { name: "Assouan", lat: 24.09, lon: 32.90, country: "EG", region: "Égypte Sud" },

  // ======================
  // AFRIQUE DE L’OUEST
  // ======================
  { name: "Dakar", lat: 14.69, lon: -17.45, country: "SN", region: "Sénégal" },
  { name: "Saint-Louis", lat: 16.03, lon: -16.50, country: "SN", region: "Nord" },
  { name: "Nouakchott", lat: 18.08, lon: -15.97, country: "MR", region: "Mauritanie" },
  { name: "Bamako", lat: 12.64, lon: -7.99, country: "ML", region: "Mali" },
  { name: "Tombouctou", lat: 16.77, lon: -3.01, country: "ML", region: "Nord Mali" },
  { name: "Niamey", lat: 13.51, lon: 2.12, country: "NE", region: "Niger" },
  { name: "N’Djamena", lat: 12.12, lon: 15.05, country: "TD", region: "Tchad" },
  { name: "Ouagadougou", lat: 12.37, lon: -1.53, country: "BF", region: "Burkina Faso" },
  { name: "Abidjan", lat: 5.32, lon: -4.03, country: "CI", region: "Côte d’Ivoire" },
  { name: "Bouaké", lat: 7.69, lon: -5.03, country: "CI", region: "Centre" },
  { name: "Accra", lat: 5.56, lon: -0.20, country: "GH", region: "Ghana" },
  { name: "Tamale", lat: 9.41, lon: -0.84, country: "GH", region: "Nord Ghana" },
  { name: "Cotonou", lat: 6.37, lon: 2.43, country: "BJ", region: "Bénin" },
  { name: "Lomé", lat: 6.13, lon: 1.22, country: "TG", region: "Togo" },
  { name: "Lagos", lat: 6.45, lon: 3.40, country: "NG", region: "Nigeria" },
  { name: "Kano", lat: 12.00, lon: 8.52, country: "NG", region: "Nord Nigéria" },
  { name: "Conakry", lat: 9.64, lon: -13.58, country: "GN", region: "Guinée" },
  { name: "Monrovia", lat: 6.30, lon: -10.80, country: "LR", region: "Liberia" },
  { name: "Freetown", lat: 8.47, lon: -13.23, country: "SL", region: "Sierra Leone" },
  { name: "Banjul", lat: 13.45, lon: -16.58, country: "GM", region: "Gambie" },

  // ======================
  // AFRIQUE CENTRALE
  // ======================
  { name: "Yaoundé", lat: 3.87, lon: 11.52, country: "CM", region: "Cameroun" },
  { name: "Douala", lat: 4.05, lon: 9.70, country: "CM", region: "Cameroun" },
  { name: "Brazzaville", lat: -4.27, lon: 15.28, country: "CG", region: "Congo" },
  { name: "Pointe-Noire", lat: -4.78, lon: 11.86, country: "CG", region: "Congo" },
  { name: "Kinshasa", lat: -4.32, lon: 15.31, country: "CD", region: "RDC" },
  { name: "Goma", lat: -1.68, lon: 29.23, country: "CD", region: "Kivu" },
  { name: "Bangui", lat: 4.37, lon: 18.56, country: "CF", region: "Centrafrique" },
  { name: "Libreville", lat: 0.39, lon: 9.45, country: "GA", region: "Gabon" },
  { name: "Malabo", lat: 3.75, lon: 8.78, country: "GQ", region: "Guinée Équatoriale" },

  // ======================
  // AFRIQUE DE L’EST
  // ======================
  { name: "Addis-Abeba", lat: 8.98, lon: 38.79, country: "ET", region: "Éthiopie" },
  { name: "Mekele", lat: 13.50, lon: 39.47, country: "ET", region: "Nord" },
  { name: "Asmara", lat: 15.33, lon: 38.93, country: "ER", region: "Érythrée" },
  { name: "Djibouti", lat: 11.59, lon: 43.15, country: "DJ", region: "Djibouti" },
  { name: "Mogadiscio", lat: 2.04, lon: 45.34, country: "SO", region: "Somalie" },
  { name: "Kismayo", lat: -0.36, lon: 42.55, country: "SO", region: "Somalie" },
  { name: "Nairobi", lat: -1.29, lon: 36.82, country: "KE", region: "Kenya" },
  { name: "Mombasa", lat: -4.04, lon: 39.67, country: "KE", region: "Kenya" },
  { name: "Kampala", lat: 0.35, lon: 32.58, country: "UG", region: "Ouganda" },
  { name: "Kigali", lat: -1.95, lon: 30.06, country: "RW", region: "Rwanda" },
  { name: "Bujumbura", lat: -3.37, lon: 29.36, country: "BI", region: "Burundi" },
  { name: "Dar es Salaam", lat: -6.80, lon: 39.28, country: "TZ", region: "Tanzanie" },
  { name: "Arusha", lat: -3.37, lon: 36.68, country: "TZ", region: "Tanzanie Nord" },
  { name: "Juba", lat: 4.85, lon: 31.58, country: "SS", region: "Sud-Soudan" },
  { name: "Khartoum", lat: 15.50, lon: 32.56, country: "SD", region: "Soudan" },
  { name: "Port-Soudan", lat: 19.62, lon: 37.22, country: "SD", region: "Soudan Est" },

  // ======================
  // AFRIQUE AUSTRALE
  // ======================
  { name: "Luanda", lat: -8.84, lon: 13.23, country: "AO", region: "Angola" },
  { name: "Huambo", lat: -12.78, lon: 15.73, country: "AO", region: "Angola" },
  { name: "Windhoek", lat: -22.57, lon: 17.09, country: "NA", region: "Namibie" },
  { name: "Walvis Bay", lat: -22.96, lon: 14.51, country: "NA", region: "Namibie" },
  { name: "Gaborone", lat: -24.65, lon: 25.91, country: "BW", region: "Botswana" },
  { name: "Maun", lat: -19.98, lon: 23.42, country: "BW", region: "Okavango" },
  { name: "Lusaka", lat: -15.42, lon: 28.28, country: "ZM", region: "Zambie" },
  { name: "Livingstone", lat: -17.85, lon: 25.87, country: "ZM", region: "Zambie Sud" },
  { name: "Harare", lat: -17.83, lon: 31.05, country: "ZW", region: "Zimbabwe" },
  { name: "Bulawayo", lat: -20.16, lon: 28.62, country: "ZW", region: "Zimbabwe Sud" },
  { name: "Lilongwe", lat: -13.97, lon: 33.79, country: "MW", region: "Malawi" },
  { name: "Maputo", lat: -25.97, lon: 32.58, country: "MZ", region: "Mozambique" },
  { name: "Beira", lat: -19.83, lon: 34.86, country: "MZ", region: "Centre" },
  { name: "Antananarivo", lat: -18.91, lon: 47.54, country: "MG", region: "Madagascar" },
  { name: "Toamasina", lat: -18.15, lon: 49.40, country: "MG", region: "Côte Est" },
  { name: "Johannesburg", lat: -26.20, lon: 28.04, country: "ZA", region: "Afrique du Sud" },
  { name: "Durban", lat: -29.86, lon: 31.03, country: "ZA", region: "Afrique du Sud" },
  { name: "Cape Town", lat: -33.92, lon: 18.42, country: "ZA", region: "Afrique du Sud" },
  { name: "Maseru", lat: -29.32, lon: 27.48, country: "LS", region: "Lesotho" },
  { name: "Mbabane", lat: -26.32, lon: 31.13, country: "SZ", region: "Eswatini" },

  // ======================
  // 🌴 ARCHIPELS & ÎLES AFRICAINES
  // ======================
  { name: "Praia", lat: 14.93, lon: -23.51, country: "CV", region: "Cap-Vert" },
  { name: "Sao Tomé", lat: 0.34, lon: 6.73, country: "ST", region: "Sao Tomé-et-Principe" },
  { name: "Moroni", lat: -11.70, lon: 43.26, country: "KM", region: "Comores" },
  { name: "Victoria", lat: -4.62, lon: 55.45, country: "SC", region: "Seychelles" },
  { name: "Port Louis", lat: -20.16, lon: 57.50, country: "MU", region: "Île Maurice" },
];

// ==========================================================
// 🚀 LANCEUR GLOBAL – PHASE 1 PURE
// ==========================================================
export async function runGlobalAfrique() {
  try {
    await addEngineLog("🚀 Lancement runGlobalAfrique – Phase 1 pure", "info", "runGlobalAfrique");

    const result = await superForecast({ zones, runType: "Afrique", withAI: false });

    await addEngineLog(
      `✅ runGlobalAfrique terminé (phase 1 pure) – ${zones.length} points couverts`,
      "success",
      "runGlobalAfrique"
    );
    // ==========================================================
// 🛰️ PHASE 1B – VISION IA (SATELLITES IR / VISIBLE / RADAR)
// ==========================================================
try {
  const vision = await runVisionIA("Europe");
  if (vision?.confidence >= 50) {
    await addEngineLog(
      `🌍 VisionIA (${vision.zone}) active – ${vision.type} (${vision.confidence} %)`,
      "info",
      "vision"
    );
  } else {
    await addEngineLog(
      `🌫️ VisionIA (${vision.zone}) inerte – fiabilité ${vision.confidence} %`,
      "warn",
      "vision"
    );
  }
} catch (e) {
  await addEngineError("Erreur exécution VisionIA : " + e.message, "vision");
}
    return { success: true, result };
  } catch (err) {
    await addEngineError(`runGlobalAfrique : ${err.message}`, "runGlobalAfrique");
    return { success: false, error: err.message };
  }
}

// ==========================================================
// 📦 EXPORTS OFFICIELS (intouchables – compatibilité Render)
// ==========================================================
export default { runGlobalAfrique };
