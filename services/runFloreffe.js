// ==========================================================
// 🌍 TINSFLASH — runFloreffe.js  (Everest Protocol v6.5 PRO+++ AUTONOME)
// ==========================================================
// 🔸 Commune pilote : Floreffe (Belgique)
// 🔸 Phases intégrées et autonomes : 1 (Extraction) + 2 (IA locale) + 5 (Fusion / Export)
// 🔸 Horizon prévisionnel : J+0 → J+5 (multi-jours stables) 100% réel
// ==========================================================
// @ts-check

import dotenv from "dotenv";
import fs from "fs";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import OpenAI from "openai";
import { addEngineLog, addEngineError } from "./engineState.js";
import { applyGeoFactors } from "./geoFactors.js";
import { applyLocalFactors } from "./localFactors.js";
import { fetchHRRR } from "./hrrrAdapter.js";
import superForecastModule from "./superForecast.js";
const { superForecast } = superForecastModule;
import { mergeMultiModels } from "./superForecast.js"; // déjà présent dans 1runFloreffe
import { correlateTopoHydro } from "./correlateTopoHydro.js";
import { fetchLiveHydroData } from "./fetchLiveHydroData.js";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ==========================================================
// 🧮 utilitaires
// ==========================================================
const country = "BE";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const toISODate = (d) => d.toISOString().slice(0, 10);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function getDateYMD() {
  const d = new Date();
  return d.toISOString().slice(0,10);
}

// ==========================================================
// ⚙️ Seuils d’alerte calibrés Floreffe (anticipatifs réels)
// ==========================================================
const ALERT_THRESHOLDS = {
  rain: { prealert: 5, alert: 15, extreme: 35, unit: "mm/h" },
  snow: { prealert: 0.8, alert: 2, extreme: 6, unit: "cm/h" },
  wind: { prealert: 55, alert: 70, extreme: 95, unit: "km/h" },
  heat: { prealert: 29, alert: 34, extreme: 38, unit: "°C" },
  cold: { prealert: -3, alert: -7, extreme: -12, unit: "°C" },
  humidity: { prealert: 93, alert: 97, extreme: 100, unit: "%" },
  visionia: { prealert: 70, alert: 82, extreme: 90, unit: "%" },
};

// ==========================================================
// 🧠 IA J.E.A.N. locale – Prompt contextuel Floreffe
// ==========================================================
const FLOREFFE_IA_PROMPT = `
Tu es J.E.A.N., IA météo-hydrologique locale, le meilleur météorologue,  le meilleur
climatologue,  une expert en geologie, un expert mathématicien, dédiée à la commune de Floreffe (Belgique).
Mission : produire des prévisions hyper-locales les plus fiables au monde pour ce territoire communal 
et des alertes précises et avant les organismes officiels idéalement pour les voiries, habitants et infrastructures.

Contexte :
- Collines (Floriffoux, Sovimont, Soye) : vent, givre/verglas.
- Vallée de la Sambre (Franière) : humidité, brouillard, crues éclairs.
- Zoning Franière/Materne : surfaces imperméables → ruissellement rapide.
- Réseau pluvial/égouttage : bassins Sovimont & Pêcherie sensibles.
- Points critiques : écoles, hall, routes pentues, ponts, halage, camping.
- Seuils : ≥90 % auto-publié ; 70–89 % validation humaine ; <70 % surveillance.

Tâches :
1) Pondère les sorties multi-modèles (Phase 1) par relief/pente/sol/vent.
2) Évalue risques : verglas, ruissellement, inondation, brouillard, rafales.
3) Score de cohérence [0..1] + résumé actionnable par point/jour.
4) Seulement du réel, expliquant « pourquoi ». 
Réponds STRICTEMENT en **JSON pur** sous forme d’un tableau \`[{...},{...}]\` sans aucun texte. 
`;

// ==========================================================
// ⚙️ SUPERFORECAST INTÉGRÉ
// ==========================================================
function pickHourlyAtNoon(hourlyObj, targetDate, times) {
  if (!hourlyObj || !times || !times.length) return null;
  const target = new Date(`${targetDate}T12:00:00Z`).getTime();
  let bestIdx = 0, bestDiff = Number.MAX_SAFE_INTEGER;
  times.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - target);
    if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
  });
  return {
    temperature_2m: hourlyObj.temperature_2m?.[bestIdx] ?? null,
    precipitation:  hourlyObj.precipitation?.[bestIdx] ?? 0,
    wind_speed_10m: hourlyObj.wind_speed_10m?.[bestIdx] ?? null
  };
}



// ==========================================================
// 🌍 Points géographiques Floreffe (version complète enregistrée)
// ==========================================================
const FLOREFFE_POINTS = [
  { id:'FLO_01', name:'Maison communale', lat:50.4368, lon:4.7562, alt:92,  type:'urbain',   risk:{flood:true, verglas:true, wind:false},    sensor:false, prio:'high' },
  { id:'FLO_02', name:'CPAS Floreffe',    lat:50.4374, lon:4.7555, alt:95,  type:'public',   risk:{flood:false, verglas:true, wind:false},   sensor:false, prio:'med'  },
  { id:'FLO_03', name:'Abbaye de Floreffe (plateau)', lat:50.4386, lon:4.7531, alt:138, type:'plateau', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_04', name:'Rue du Séminaire (école)', lat:50.4366, lon:4.7586, alt:97, type:'école', risk:{flood:false, verglas:true, wind:false}, sensor:false, prio:'high' },
  { id:'FLO_05', name:'Hall omnisport (parking+pente)', lat:50.4359, lon:4.7578, alt:96, type:'urbain', risk:{flood:false, verglas:true, wind:false}, sensor:true, prio:'high' },
  { id:'FLO_06', name:'Église Saint-Nicolas (centre)', lat:50.4378, lon:4.7569, alt:94, type:'public', risk:{flood:false, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_07', name:'Rue Joseph Hanse (résidentiel)', lat:50.4388, lon:4.7589, alt:98, type:'urbain', risk:{flood:false, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_08', name:'Rue du Pont (bas du centre)', lat:50.4399, lon:4.7607, alt:86, type:'vallée', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'high' },
  { id:'FLO_09', name:'Parking Abbaye (haut)', lat:50.4394, lon:4.7524, alt:142, type:'plateau', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_10', name:'Cimetière communal (haut)', lat:50.4347, lon:4.7542, alt:116, type:'plateau', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_11', name:'Sovimont (centre)', lat:50.4435, lon:4.7480, alt:182, type:'plateau', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_12', name:'Sovimont (haut agricole)', lat:50.4455, lon:4.7441, alt:190, type:'agri', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_13', name:'Soye (centre)', lat:50.4392, lon:4.7395, alt:165, type:'village', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_14', name:'Soye – Try des Bruyères (boisé)', lat:50.4382, lon:4.7429, alt:172, type:'boisé', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_15', name:'Floriffoux (place)', lat:50.4512, lon:4.7680, alt:155, type:'village', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_16', name:'Floriffoux – Rue du Baty (hauteur)', lat:50.4530, lon:4.7650, alt:172, type:'colline', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_17', name:'Floriffoux – vers Bois-de-Villers (colline)', lat:50.4516, lon:4.7586, alt:186, type:'colline', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_18', name:'Floriffoux – Carrefour N930', lat:50.4498, lon:4.7623, alt:164, type:'route', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_19', name:'Franière – Gare SNCB', lat:50.4545, lon:4.7583, alt:84, type:'vallée', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'high' },
  { id:'FLO_20', name:'Franière – Église & carrefour', lat:50.4554, lon:4.7599, alt:86, type:'urbain', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_21', name:'Zoning Franière – Entrée',  lat:50.4578, lon:4.7660, alt:88, type:'zoning', risk:{flood:true, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_22', name:'Zoning Franière – Centre',  lat:50.4586, lon:4.7676, alt:90, type:'zoning', risk:{flood:true, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_23', name:'Usine MATERNE',             lat:50.4589, lon:4.7703, alt:89, type:'industriel', risk:{flood:true, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_24', name:'Lakis – Centre', lat:50.4409, lon:4.7638, alt:128, type:'village', risk:{flood:false, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_25', name:'Lakis – École communale', lat:50.4407, lon:4.7647, alt:125, type:'école', risk:{flood:false, verglas:true, wind:false}, sensor:false, prio:'high' },
  { id:'FLO_26', name:'Bois de Floreffe – sommet N', lat:50.4508, lon:4.7344, alt:208, type:'boisé', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_27', name:'Bois de Floreffe – bas humide', lat:50.4489, lon:4.7368, alt:186, type:'boisé', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_28', name:'Rue du Champ des Alouettes', lat:50.4449, lon:4.7426, alt:178, type:'plateau', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_29', name:'Rue du Rognau (ouest)',       lat:50.4416, lon:4.7473, alt:171, type:'colline', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_30', name:'Rue du Tienne aux Biches',     lat:50.4427, lon:4.7411, alt:174, type:'boisé', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_31', name:'Rue du Sart-Saint-Laurent (crête)', lat:50.4472, lon:4.7534, alt:188, type:'crête', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_32', name:'Floriffoux – Colline (toit Patrick)', lat:50.453370, lon:4.767175, alt:176, type:'colline', risk:{flood:false, verglas:true, wind:true}, sensor:true, prio:'high' },
  { id:'FLO_33', name:'Pont sur la Sambre – Floreffe', lat:50.4425, lon:4.7612, alt:82, type:'rivière', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'high' },
  { id:'FLO_34', name:'Pont sur la Sambre – Franière', lat:50.4550, lon:4.7615, alt:83, type:'rivière', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'high' },
  { id:'FLO_35', name:'Halage – rive gauche (aval)',   lat:50.4442, lon:4.7618, alt:82, type:'rivière', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_36', name:'Halage – rive droite (amont)',  lat:50.4479, lon:4.7601, alt:83, type:'rivière', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_37', name:'Rue de la Pêcherie (inondable)', lat:50.4373, lon:4.7599, alt:90, type:'pluvial', risk:{flood:true, verglas:true, wind:false}, sensor:true, prio:'high' },
  { id:'FLO_38', name:'Rue des Prés (champ d’inondation)', lat:50.4362, lon:4.7621, alt:90, type:'pluvial', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_39', name:'Rue de la Basse-Sambre (→ Moustier)', lat:50.4329, lon:4.7707, alt:96, type:'vallée', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_40', name:'Rue de la Bourlotte (bas de vallée)',  lat:50.4315, lon:4.7577, alt:108, type:'vallée', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_41', name:'Ferme du Moulin (vallée humide)', lat:50.4336, lon:4.7525, alt:112, type:'vallée', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_42', name:'Station d’épuration SPGE (Sambre)',   lat:50.4406, lon:4.7665, alt:84,  type:'technique', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_43', name:'Bassin d’orage – Sovimont (bas)',     lat:50.4460, lon:4.7469, alt:176, type:'technique', risk:{flood:true, verglas:true, wind:false}, sensor:true,  prio:'high' },
  { id:'FLO_44', name:'Poste police / ateliers communaux', lat:50.4565, lon:4.7647, alt:90, type:'public', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_45', name:'Ancienne sucrerie (friche humide)',  lat:50.4526, lon:4.7709, alt:90, type:'friche', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_46', name:'Carrefour N90/N947 (entrée commune)', lat:50.4477, lon:4.7700, alt:96, type:'route', risk:{flood:true, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_47', name:'Rue de la Gare – Floreffe',           lat:50.4399, lon:4.7581, alt:92, type:'urbain', risk:{flood:false, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_48', name:'Rue du Fond des Bois (boisée)',       lat:50.4448, lon:4.7377, alt:180, type:'boisé', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_49', name:'Rue du Bois d’Arsimont (limite N)',   lat:50.4486, lon:4.7318, alt:196, type:'boisé', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_50', name:'Chemin des Carrières (drainage agri)',lat:50.4461, lon:4.7397, alt:176, type:'agri', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_51', name:'Rue du Parc – Camping (sommet)',      lat:50.4320, lon:4.7670, alt:168, type:'loisir', risk:{flood:false, verglas:true, wind:true}, sensor:true, prio:'high' },
  { id:'FLO_52', name:'Rue du Château (Sovimont)',           lat:50.4444, lon:4.7456, alt:186, type:'village', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_53', name:'Rue de la Croix (sommet exposé)',     lat:50.4466, lon:4.7513, alt:190, type:'crête',  risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_54', name:'Rue du Baty – Floriffoux (plateau)',  lat:50.4527, lon:4.7637, alt:171, type:'plateau', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_55', name:'Robermont – crête agricole',          lat:50.4307, lon:4.7604, alt:140, type:'crête',  risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_56', name:'Rue de la Pêcherie – avaloir clé',    lat:50.4377, lon:4.7612, alt:90, type:'pluvial', risk:{flood:true, verglas:true, wind:false}, sensor:true,  prio:'high' },
  { id:'FLO_57', name:'Bassin d’orage – Franière',           lat:50.4560, lon:4.7630, alt:91, type:'technique', risk:{flood:true, verglas:true, wind:false}, sensor:true, prio:'high' },
  { id:'FLO_58', name:'Égouttage central (collecteur SPGE)',lat:50.4388, lon:4.7589, alt:88, type:'technique', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_59', name:'Chemin de halage – secteur central',  lat:50.4433, lon:4.7608, alt:82, type:'rivière', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_60', name:'Rue du Parc – zone résidentielle',    lat:50.4330, lon:4.7662, alt:164, type:'urbain', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
];


// ==========================================================
// 🚀 Fonction principale — Run Floreffe autonome
// ==========================================================
// ==========================================================
// 🌍 PHASE 1 — Extraction multi-modèles météo (Floreffe)
// ==========================================================
async function superForecastLocal({ zones = [], runType = "Floreffe" }) {
  await addEngineLog(`🎬 [${runType}] Phase 1 — Extraction physique locale lancée`, "info", runType);
  const phase1Results = [];
const forecastDays = 5; // Horizon stable J+5 pour Floreffe
  for (let dayOffset = 0; dayOffset <= forecastDays; dayOffset++) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + dayOffset);
  const dateStr = targetDate.toISOString().slice(0, 10);
  
  for (const z of zones) {
    const { id, name, lat, lon } = z;
    const sources = [];

    // --- 9 modèles météo officiels validés (inchangés) ---
    const models = [
      {
        name: "GFS NOAA",
        url: `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`
      },
      {
        name: "ECMWF ERA5",
        url: `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,PRECTOTCORR,WS10M&community=RE&longitude=${lon}&latitude=${lat}&start=${getDateYMD()}&end=${getDateYMD()}&format=JSON`
      },
      {
        name: "ECMWF Open-Meteo",
        url: `https://api.open-meteo.com/v1/ecmwf?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`
      },
      {
        name: "AROME Météo-France",
        url: `https://api.open-meteo.com/v1/meteofrance?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`
      },
      {
        name: "ICON DWD",
        url: `https://api.open-meteo.com/v1/dwd-icon?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`
      },
      {
        name: "NASA POWER",
        url: `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,PRECTOTCORR,WS10M&community=RE&longitude=${lon}&latitude=${lat}&start=${getDateYMD()}&end=${getDateYMD()}&format=JSON`
      },
      {
        name: "Copernicus ERA5-Land",
        url: `https://archive-api.open-meteo.com/v1/era5?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`
      },
      {
        name: "Open-Meteo Forecast",
        url: `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`
      },
      {
        name: "MET Norway LocationForecast",
        url: `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`,
        headers: { "User-Agent": "TINSFLASH-MeteoEngine/1.0 (contact: meteo@tinsflash)" }
      }
    ];

    // --- Appels séquentiels avec retry x2 ---
    for (const m of models) {
      let attempt = 0, success = false;
      while (attempt < 2 && !success) {
        try {
          const opt = { timeout: 15000 };
          if (m.headers) opt.headers = m.headers;
          const r = await axios.get(m.url, opt);
          const parsed = parseModelResponse(r.data);
          if (parsed) { sources.push({ source: m.name, ...parsed }); success = true; }
        } catch (err) {
          attempt++;
          if (attempt >= 2) await addEngineError(`${m.name} échec permanent : ${err.message}`, "Phase1");
        }
      }
    }

// ==========================================================
// 🌦️ Phase 1 — Extraction réelle des modèles météo
// ==========================================================
const phase1Results = [];
for (const point of FLOREFFE_POINTS) {
  try {
    const data = await mergeMultiModels(point.lat, point.lon, "EU");
    phase1Results.push({ ...point, ...data });
    await addEngineLog(`[Floreffe] ✅ Modèles OK pour ${point.name} (${point.id})`, "success", "floreffe");
    await new Promise(r => setTimeout(r, 1200)); // temporisation douce
  } catch (err) {
    await addEngineError(`[Floreffe] ❌ Erreur modèles pour ${point.name}: ${err.message}`, "floreffe");
  }
}

// sauvegarde phase 1 sur Mongo
await saveExtractionToMongo("Floreffe", "EU", phase1Results);
    // --- Fusion multi-modèles (moyenne pondérée) ---
    const merged = await superForecastModule.mergeMultiModels(lat, lon, "BE");
phase1Results.push({ ...merged, id, name, lat, lon, date: dateStr });
    
  
} // fin boucle zones
} // fin boucle jours
  await saveExtractionToMongo("Floreffe", "BE", phase1Results);
  await addEngineLog(`✅ Phase 1 terminée : ${phase1Results.length} points extraits sur horizon J+0 → J+5`, "success", runType);

// ==========================================================
  // 🌄 PHASE 1bis — Corrélation topographique & hydrologique
  // ==========================================================
  await addEngineLog(`🌄 [${runType}] Corrélation topographique/hydrologique en cours`, "info", runType);

  const datasetsPath = path.resolve("./services/datasets");
  const geo = JSON.parse(fs.readFileSync(`${datasetsPath}/floreffe_geoportail.json`, "utf8"));
  const hydro = JSON.parse(fs.readFileSync(`${datasetsPath}/floreffe_hydro.json`, "utf8"));
  const reseaux = JSON.parse(fs.readFileSync(`${datasetsPath}/floreffe_reseaux.json`, "utf8"));
  const routes = JSON.parse(fs.readFileSync(`${datasetsPath}/floreffe_routes.json`, "utf8"));

  // --- mise à jour hydrométrique "live" (préparée) ---
  const liveHydro = await fetchLiveHydroData(); // bascule automatique vers hydro local si null

  const phase1bisResults = phase1Results.map(pt => {
    const topo = correlateTopoHydro(pt, { geo, hydro, reseaux, routes, liveHydro });
    return { ...pt, topo };
  });

  await saveExtractionToMongo("Floreffe", "BE", phase1bisResults);
  await addEngineLog(`✅ Corrélation topographique/hydrologique appliquée`, "success", runType);

  // ==========================================================
  // ⏱️ TEMPORISATION — 2 minutes avant Phase 2
  // ==========================================================
  await addEngineLog(`⏳ Attente 2 minutes avant Phase 2 (Stabilisation des modèles)`, "info", runType);
  await new Promise(r => setTimeout(r, 120000));


  // ==========================================================
  // 🔚 CLÔTURE DE LA PHASE 1 + PHASE 1bis
  // ==========================================================
  await addEngineLog(
  `🏁 [${runType}] Phases 1 et 1bis terminées – données synchronisées Mongo et prêtes pour l’IA J.E.A.N.`,
  "success",
  runType
);

// 🔒 Sauvegarde Phase 1bis dans Mongo (base commune)
try {
  const mongo = new MongoClient(process.env.MONGO_URI);
  await mongo.connect();
  const db = mongo.db("tinsflash");
// ==========================================================
// 🚀 Phase 1 + 1bis — Extraction locale avant IA J.E.A.N.
// ==========================================================
await addEngineLog(`[Floreffe] Phase 1+1bis — Lancement complet avant IA`, "info", "floreffe");

const zones = FLOREFFE_POINTS;
const runType = "Floreffe";
const phase1Run = await superForecastLocal({ zones, runType });

if (!phase1Run?.success) {
  await addEngineError(`[Floreffe] Erreur pendant Phase 1/1bis : ${phase1Run?.error || "inconnue"}`, "floreffe");
  return { success: false, error: "Phase 1 échouée" };
}

await addEngineLog(`[Floreffe] ✅ Phase 1+1bis terminée (${phase1Run.phase1Results?.length || 0} points)`, "success", "floreffe");

// Petite temporisation avant IA
await addEngineLog(`[Floreffe] ⏳ Pause 2 min avant IA J.E.A.N.`, "info", "floreffe");
await sleep(120000);
  
  await db.collection("floreffe_phase1bis").deleteMany({});
  await db.collection("floreffe_phase1bis").insertMany(phase1bisResults);

  await mongo.close();
  await addEngineLog(`💾 Phase 1bis sauvegardée dans Mongo Cloud`, "success", runType);
} catch (err) {
  await addEngineError(`Erreur Mongo sauvegarde Phase1bis : ${err.message}`, runType);
}

return { success: true, phase1Results: phase1bisResults };
} // ← fin de la fonction superForecastLocal

// ==========================================================
// 🚀 Fonction principale d’exécution complète (Phases 2 et 5)
// ==========================================================
// ==========================================================
// 🚀 Fonction principale — Phases 2 et 5 (IA J.E.A.N. + Export)
// ==========================================================
async function runFloreffe() {
  const mongo = new MongoClient(process.env.MONGO_URI);
  await mongo.connect();
  const db = mongo.db("tinsflash");

  try {
    // === PHASE 2 — IA J.E.A.N. locale ===
    await addEngineLog(`[Floreffe] Phase 2 — IA J.E.A.N. (analyse multi-jours)`, "info", "floreffe");
  const phase1bisResults = await db.collection("floreffe_phase1bis").find({}).toArray();
    const aiPrompt = `${FLOREFFE_IA_PROMPT}\n\n${JSON.stringify(phase1bisResults.slice(0, 250))}`;
    const ai = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: aiPrompt }],
      temperature: 1
    });

    let phase2Results = [];
    try {
      phase2Results = JSON.parse(ai.choices?.[0]?.message?.content || "[]");
    } catch (e) {
      await addEngineError(`[Floreffe] Erreur Phase 2 : Réponse IA non-JSON (${e.message})`, "floreffe");
      return { success: false };
    }

    await db.collection("floreffe_phase2").deleteMany({});
    if (phase2Results.length) await db.collection("floreffe_phase2").insertMany(phase2Results);
    await addEngineLog(`[Floreffe] ✅ Phase 2 (IA J.E.A.N.) terminée – ${phase2Results.length} lignes`, "success", "floreffe");

    // 🕒 Pause 2 min avant la Phase 5
    await addEngineLog("[Floreffe] Pause 2 min avant Phase 5 (stabilisation)", "info", "floreffe");
    await sleep(120000);

    // === PHASE 5 — Fusion + Export ===
    const enriched = Array.isArray(phase2Results) && phase2Results.length
      ? phase2Results.map(x => ({
          ...x,
          origin: "Floreffe_dome",
          timestamp: new Date(),
          thresholds: ALERT_THRESHOLDS
        }))
      : [];
    if (!enriched.length) return { success: false, error: "Phase 2 vide" };

    const alerts = enriched.map(x => {
      const rainHit = x.risk?.pluie >= ALERT_THRESHOLDS.rain.alert;
      const iceHit = x.risk?.verglas >= ALERT_THRESHOLDS.cold.alert;
      if (!rainHit && !iceHit) return null;
      const type = rainHit ? "pluie" : "verglas";
      const level = rainHit && x.risk.pluie >= ALERT_THRESHOLDS.rain.extreme ? "rouge" : "orange";
      const confidence = x.confidence ?? x.reliability ?? 0.9;
      return {
        name: x.name,
        zone: "Floreffe",
        lat: x.lat,
        lon: x.lon,
        type,
        level,
        reliability: confidence,
        description:
          confidence >= 0.9 ? "Alerte confirmée" :
          confidence >= 0.7 ? "Alerte à valider" :
          "En surveillance – pas encore confirmée",
        timestamp: new Date()
      };
    }).filter(Boolean);

    await db.collection("alerts_floreffe").deleteMany({});
    if (alerts.length) await db.collection("alerts_floreffe").insertMany(alerts);

    const forecastsPath = path.join(__dirname, "../public/floreffe_forecasts.json");
    const alertsPath = path.join(__dirname, "../public/floreffe_alerts.json");
   const forecastRange = "J+0 → J+5";
    await fs.promises.writeFile(
  forecastsPath,
  JSON.stringify({ generated: new Date(), range: forecastRange, zones: enriched }, null, 2)
);
    await fs.promises.writeFile(alertsPath, JSON.stringify(alerts, null, 2));

    await addEngineLog(`🏁 [Floreffe] Export JSON terminé (${alerts.length} alertes)`, "success", "floreffe");

    await db.collection("forecasts").updateOne(
  { zone: "Floreffe" },
  { $set: { zone: "Floreffe", data: enriched } },
  { upsert: true }
);
await db.collection("alerts").deleteMany({ zone: /Floreffe/i });
    
    if (alerts.length) await dbName.collection("alerts").insertMany(alerts);
    await addEngineLog("💾 Données Floreffe exportées vers Mongo Cloud global.", "success", "floreffe");

    await mongo.close();
    return { success: true, alerts: alerts.length };
  } catch (e) {
    await addEngineError(`Erreur Floreffe autonome : ${e.message}`, "floreffe");
    return { success: false, error: e.message };
  } finally {
    await sleep(150);
  }
}

// ==========================================================
// 🔚 Export compatible CommonJS pour Render
// ==========================================================
// ==========================================================
// 🔚 Export standard ESM + compatibilité CommonJS pour Render
// ==========================================================
export { runFloreffe, superForecastLocal };

// (optionnel : si tu veux aussi compat CJS)
export default { runFloreffe, superForecastLocal };
