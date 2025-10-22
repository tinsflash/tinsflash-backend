// ==========================================================
// 🌍 TINSFLASH — runFloreffe.js  (Everest Protocol v6.5.1 PRO+++ AUTONOME)
// ==========================================================
// 🔸 Commune pilote : Floreffe (Belgique)
// 🔸 Phases intégrées et autonomes : 1 (Extraction) + 2 (IA locale) + 5 (Fusion / Export)
// 🔸 Correction : suppression double boucle (dayOffset/day) – version stable Render
// ==========================================================

import dotenv from "dotenv";
import fs from "fs";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import OpenAI from "openai";
import { addEngineLog, addEngineError, saveExtractionToMongo } from "./engineState.js";
import { applyGeoFactors } from "./geoFactors.js";
import { applyLocalFactors } from "./localFactors.js";
import { correlateTopoHydro } from "./correlateTopoHydro.js";
import { fetchLiveHydroData } from "./fetchLiveHydroData.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function getDateYMD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ==========================================================
// ⚙️ Seuils d’alerte calibrés Floreffe
// ==========================================================
const ALERT_THRESHOLDS = {
  rain:     { prealert: 5,  alert: 15, extreme: 35, unit: "mm/h" },
  snow:     { prealert: 0.3, alert: 2,  extreme: 6,  unit: "cm/h" },
  wind:     { prealert: 55, alert: 70, extreme: 95, unit: "km/h" },
  heat:     { prealert: 27, alert: 34, extreme: 38, unit: "°C" },
  cold:     { prealert: 1, alert: -7, extreme: -12, unit: "°C" },
  humidity: { prealert: 93, alert: 97, extreme: 100, unit: "%" },
  visionia: { prealert: 70, alert: 82, extreme: 90, unit: "%" },
};

// ==========================================================
// 🧠 IA J.E.A.N. locale – Prompt contextuel Floreffe
// ==========================================================
const FLOREFFE_IA_PROMPT = `
Tu es J.E.A.N., IA météo-hydrologique locale, expert météorologique, expert climatologue,  expert en étude de relief,
et un expert mathématicien dédiée à la commune de Floreffe (Belgique).
Mission : produire des prévisions hyper-locales fiables et des alertes précises pour voiries, habitants et infrastructures.

Contexte géographique :
- Collines (Floriffoux, Sovimont, Soye) : exposition vent/givre/verglas.
- Vallée de la Sambre (Franière) : humidité, brouillard, inondations éclair.
- Zoning Franière / Materne : surfaces imperméables → ruissellement rapide.
- Réseau pluvial : bassins Sovimont & Pêcherie sensibles.
- Points critiques : écoles, hall, routes pentues, ponts, halage, camping.
- Seuils : ≥90 % auto-publié ; 70–89 % validation humaine ; <70 % surveillance.

Tâches :
1) Pondère les sorties multi-modèles (Phase 1) avec relief, pente, sol, vent.
2) Évalue risques : verglas (temp sol), ruissellement (pluie × pente), inondation (S > 1),
   brouillard (HR > 90 % & vent < 5 km/h), rafales.
3) Calcule un score de cohérence [0..1] et un résumé exploitable par zone et par jour.
4) Ne produis que du réel — pas de simulation. Retourne STRICTEMENT du JSON pur.
`;

const country = "BE";
const toISODate = (d) => d.toISOString().slice(0, 10);

// ==========================================================
// ⚙️ FONCTION SUPERFORECAST INTÉGRÉE (indépendante, J+offset)
// ==========================================================
async function superForecastLocal({ zones = [], runType = "Floreffe", dayOffset = 0 }) {
  await addEngineLog(`📡 [${runType}] Extraction physique locale J+${dayOffset}`, "info", "superForecast");

  const results = [];

  for (const z of zones) {
    const sources = [];
    const push = (x) => sources.push(x);

    try {
      const [lat, lon] = [z.lat, z.lon];
      const base = new Date();
      base.setUTCDate(base.getUTCDate() + dayOffset);
      const ymd = toISODate(base);
// --- Fenêtre temporelle dynamique pour corriger les 422 NASA/ECMWF ---
let startDate = getDateYMD();
let endDate = getDateYMD();
if (dayOffset === 0) {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  startDate = getDateYMD(yesterday); // J-1 → J
}
      const models = [
  {
    name: "Open-Meteo Forecast (daily+hourly)",
    url: `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=5`
  },
  {
    name: "ECMWF ERA5-Land",
    url: `https://archive-api.open-meteo.com/v1/era5?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=5`
  },
  {
    name: "GFS NOAA",
    url: `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=5`
  },
  {
    name: "ICON DWD",
    url: `https://api.open-meteo.com/v1/dwd-icon?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=5`
  },
  {
    name: "AROME Météo-France",
    url: `https://api.open-meteo.com/v1/meteofrance?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=5`
  },
  {
    name: "NASA POWER",
    url: `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,PRECTOTCORR,WS10M&community=RE&longitude=${lon}&latitude=${lat}&start=${startDate}&end=${endDate}&format=JSON`
  }
      ];

   for (const m of models) {
  try {
    const options = { timeout: 15000 };
    if (m.headers) options.headers = m.headers;
    const r = await axios.get(m.url, { timeout: 15000, headers: m.headers || {} });

// --- Extraction complète (horaire + daily) ---
let T = null, P = 0, W = null;

// horaire
if (r.data?.hourly?.time?.length) {
  const temps = r.data.hourly.time.map((t, i) => ({
    t,
    temp: r.data.hourly.temperature_2m?.[i],
    rain: r.data.hourly.precipitation?.[i],
    wind: r.data.hourly.wind_speed_10m?.[i]
  }));
  const subset = temps.slice(0, 24 * (dayOffset + 1)).slice(-24); // moyenne sur 24 h du jour cible
  if (subset.length) {
    T = subset.reduce((s, e) => s + (e.temp ?? 0), 0) / subset.length;
    P = subset.reduce((s, e) => s + (e.rain ?? 0), 0);
    W = subset.reduce((s, e) => s + (e.wind ?? 0), 0) / subset.length;
  }
}

// daily
if (r.data?.daily?.temperature_2m_max) {
  const i = Math.min(dayOffset, r.data.daily.temperature_2m_max.length - 1);
  const tmax = r.data.daily.temperature_2m_max[i];
  const tmin = r.data.daily.temperature_2m_min[i];
  const pday = r.data.daily.precipitation_sum[i];
  if (tmax != null && tmin != null) T = (tmax + tmin) / 2;
  if (pday != null) P = Math.max(P, pday);
}

push({ source: m.name, temperature: T, precipitation: P, wind: W });// --- Fusion moyenne & fiabilité ---
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const valid = sources.filter((s) => s.temperature !== null);
const reliability = +(valid.length / (models.length || 1)).toFixed(2);

const merged = {
  id: z.id,
  name: z.name,
  lat,
  lon,
  alt: z.alt ?? 100,
  dayOffset,
  temperature: avg(valid.map((s) => s.temperature)),
  precipitation: avg(valid.map((s) => s.precipitation)),
  wind: avg(valid.map((s) => s.wind)),
  reliability,
  sources: valid.map((s) => s.source),
};

// === Ajustements locaux ===
let final = await applyLocalFactors(await applyGeoFactors(merged, lat, lon, country), lat, lon, country);

// 🌬️ Modulation vent selon altitude
if (final.alt && final.wind != null) {
  if (final.alt > 150) final.wind = +(final.wind * 1.15).toFixed(1);
  else if (final.alt < 90) final.wind = +(final.wind * 0.85).toFixed(1);
}

// 🌧️ Pluie réaliste
if (final.precipitation != null) {
  if (final.precipitation < 0.05) final.precipitation = 0;
  final.precipitation = +final.precipitation.toFixed(2);
}

results.push(final);
    // --- Log clair selon résultat ---
    if (T !== null || P > 0 || W !== null) {
      await addEngineLog(`✅ [${runType}] ${m.name} OK (T:${T ?? "?"}° P:${P ?? 0} mm W:${W ?? "?"} km/h)`,
        "success",
        "superForecast");
      push({ source: m.name, temperature: T, precipitation: P, wind: W });
    } else {
      await addEngineError(`⚠️ [${runType}] ${m.name} réponse vide ou incomplète`, "superForecast");
    }
  } catch (e) {
    // 422 ou autres → échec clair
    const msg = e.response?.status
      ? `status ${e.response.status}`
      : e.message;
    await addEngineError(`❌ [${runType}] ${m.name} indisponible (${msg})`, "superForecast");
  }
  await sleep(2000);
}
      const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
      const valid = sources.filter((s) => s.temperature !== null);
      const reliability = +(valid.length / (models.length || 1)).toFixed(2);

      const merged = {
        id: z.id,
        name: z.name,
        lat,
        lon,
        dayOffset,
        temperature: avg(valid.map((s) => s.temperature)),
        precipitation: avg(valid.map((s) => s.precipitation)),
        wind: avg(valid.map((s) => s.wind)),
        reliability,
        sources: valid.map((s) => s.source),
      };

      const final = await applyLocalFactors(
        await applyGeoFactors(merged, lat, lon, country),
        lat,
        lon,
        country
      );
      results.push(final);

    } catch (err) {
      await addEngineError(`mergeMultiModels : ${err.message}`, "superForecast");
    }
  }

  return { success: true, phase1Results: results };
}

// ==========================================================
// 🗺️ === Ici s’insère ton tableau FLOREFFE_POINTS complet ===
// ==========================================================
// ==========================================================
// ---------- 60 POINTS GÉOGRAPHIQUES — Couverture complète du territoire
// (LISTE INTÉGRALE CONSERVÉE)
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
// 🌍 Fonction principale – 100 % autonome (version Mongoose stable)
// ==========================================================
async function runFloreffe() {
  // Connexion MongoDB avec Mongoose
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    // === Connexion Mongoose (remplace MongoClient) ===
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: "tinsflash",
        serverSelectionTimeoutMS: 20000,
        socketTimeoutMS: 45000,
      });
      console.log("✅ MongoDB connecté (Mongoose – runFloreffe)");
    }

    // === PATCH BLOC 6 – Sécurisation Mongo + préparation multi-Render ===
    await addEngineLog("🔐 Initialisation sécurité Mongo & Multi-Render", "info", "floreffe");

    // --- Vérification URI ---
    if (!process.env.MONGO_URI || !process.env.MONGO_URI.startsWith("mongodb+srv")) {
      throw new Error("URI MongoDB invalide ou non sécurisée");
    }

    // --- Restriction de domaine (anti-vol moteur) ---
    const allowedRenderHosts = [
      "tinsflash.onrender.com",
      "tinsflash-floreffe.onrender.com",
      "tinsflash-bouke.onrender.com",
      "tinsflash-backend.onrender.com",
      "tinsflash-namur.onrender.com",
    ];
    const currentHost = process.env.RENDER_EXTERNAL_HOSTNAME || "local";

    if (!allowedRenderHosts.includes(currentHost)) {
      await addEngineError(`🚫 Accès refusé : hôte non autorisé (${currentHost})`, "security");
      throw new Error(`Hôte non autorisé : ${currentHost}`);
    }

    // --- Journal d’identification ---
    await addEngineLog(`✅ Serveur authentifié : ${currentHost}`, "success", "floreffe");

    // --- Signature de session (trace unique) ---
    const sessionToken = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const EngineSession = mongoose.connection.collection("engine_sessions");
    await EngineSession.insertOne({
      zone: "Floreffe",
      host: currentHost,
      startedAt: new Date(),
      sessionToken,
      status: "RUNNING",
    });

    // --- Sauvegarde du token dans le contexte global ---
    globalThis.__ENGINE_SESSION__ = sessionToken;
  } catch (err) {
    await addEngineError(`🧱 [SECURITÉ] Échec initialisation : ${err.message}`, "security");
    throw err;
  }

  // === FIN PATCH BLOC 6 ===
  const db = mongoose.connection;

  console.log("🌍 [TINSFLASH] Démarrage Floreffe — Everest Protocol v6.5.1 (Fix DoubleLoop)");
// === Vérification de la fraîcheur des données (Phase 1 déjà existante) ===
let skipPhase1 = false;
if (mongoose.connection.readyState === 1) {
  try {
    const floreffePhase1 = mongoose.connection.collection("floreffe_phase1");
    const lastDoc = await floreffePhase1
      .find({}, { projection: { timestamp: 1 } })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    if (lastDoc.length) {
      const lastTime = new Date(lastDoc[0].timestamp).getTime();
      const ageHours = (Date.now() - lastTime) / (1000 * 60 * 60);
      if (ageHours < 2) {
        skipPhase1 = true;
        await addEngineLog(
          `⚡ Données Phase 1 récentes (${ageHours.toFixed(2)} h) → saut extraction.`,
          "info",
          "floreffe"
        );
      } else {
        await addEngineLog(
          `⏳ Données Phase 1 trop anciennes (${ageHours.toFixed(2)} h) → nouvelle extraction.`,
          "info",
          "floreffe"
        );
      }
    } else {
      await addEngineLog("🔄 Aucune donnée Phase 1 trouvée → extraction requise.", "info", "floreffe");
    }
  } catch (err) {
    await addEngineError(`[Floreffe] Erreur vérification fraîcheur : ${err.message}`, "floreffe");
  }
}

// === PHASE 1 – Extraction multi-modèles locale (si nécessaire) ===
await addEngineLog("🔎 Vérification fraîcheur données avant Phase 1", "info", "floreffe");

if (!skipPhase1) {
  globalThis.__PHASE1_RESULTS__ = [];
  
  // === PHASE 1 – Extraction multi-modèles locale sur 7 jours (intégration progressive) ===
  const phase1Results = [];
  const forecastDays = 5;

  for (let dayOffset = 0; dayOffset <= forecastDays; dayOffset++) {
    try {
      const res = await superForecastLocal({
        zones: FLOREFFE_POINTS,
        runType: "Floreffe",
        dayOffset,
      });

      if (res?.success && res.phase1Results?.length) {
        const now = new Date();
        const stamped = res.phase1Results.map((p) => ({
          ...p,
          timestamp: now,
          dayOffset,
          hour: now.toISOString().split("T")[1].slice(0, 5),
        }));

        phase1Results.push(...stamped);
        globalThis.__PHASE1_RESULTS__ = phase1Results;

        // Journal d’ouverture Mongo (non bloquant)
        await addEngineLog("⏳ Vérification de la connexion Mongo (Mongoose)...", "info", "floreffe");

        // ✅ On passe désormais par mongoose.connection
        if (mongoose.connection.readyState === 1) {
          const floreffePhase1 = mongoose.connection.collection("floreffe_phase1");
          await floreffePhase1.insertMany(stamped);
          await addEngineLog(
            `✅ [Floreffe] Données J+${dayOffset} (${stamped.length}) intégrées avec succès`,
            "success",
            "floreffe"
          );
        } else {
          await addEngineError(
            `[Floreffe] ⚠️ Connexion Mongo inactive lors de l’insertion J+${dayOffset}`,
            "floreffe"
          );
        }

        // 🧩 Validation finale des données du jour
        if (!stamped?.length) {
          await addEngineError(
            `[Floreffe] Aucun résultat valide pour J+${dayOffset}`,
            "floreffe"
          );
        }
      } else {
        await addEngineError(
          `[Floreffe] ⚠️ Aucun jeu de données retourné pour J+${dayOffset}`,
          "floreffe"
        );
      }

      // Petite pause entre chaque jour (évite surcharge IA)
      await sleep(50000);

    } catch (e) {
      await addEngineError(`[Floreffe] ❌ Erreur extraction J+${dayOffset} : ${e.message}`, "floreffe");
    }
  } // ← fin correcte de la boucle for

  // --- Journal synthétique de la Phase 1 ---
  await addEngineLog(
    `[Floreffe] ✅ Phase 1 terminée (${phase1Results.length} points cumulés sur ${forecastDays + 1} jours)`,
    "success",
    "floreffe"
  );
} else {
  await addEngineLog("✅ Phase 1 sautée, on passe directement à la Phase 2.", "success", "floreffe");
}


// ==========================================================
// 🌊 PHASE 1bis — Corrélation topographique / hydrologique
// ==========================================================

// ==========================================================
// 🌊 PHASE 1bis — Corrélation topographique / hydrologique
// ==========================================================
await addEngineLog("[Floreffe] 🌊 Corrélation topographique / hydrologique en cours...", "info", "floreffe");

let phase1Results = globalThis.__PHASE1_RESULTS__ || phase1Results || [];
const datasetsPath = path.resolve("./services/datasets");
let geoData = null;

try {
  const geoPath = path.join(datasetsPath, "floreffe_geoportail.json");
  geoData = JSON.parse(fs.readFileSync(geoPath, "utf8"));
  await addEngineLog(`📡 Données topographiques chargées (${geoPath})`, "info", "floreffe");
} catch (e) {
  geoData = { features: [] };
  await addEngineError(`[Floreffe] ⚠️ Données topographiques manquantes : ${e.message}`, "floreffe");
}

let hydro = {}, reseaux = {}, routes = {}, livelyHydro = {};
try {
  hydro = JSON.parse(fs.readFileSync(`${datasetsPath}/floreffe_hydro.json`, "utf8"));
  reseaux = JSON.parse(fs.readFileSync(`${datasetsPath}/floreffe_reseaux.json`, "utf8"));
  routes = JSON.parse(fs.readFileSync(`${datasetsPath}/floreffe_routes.json`, "utf8"));
  livelyHydro = await fetchLiveHydroData();
  await addEngineLog("💾 Couches hydrologiques & infrastructures chargées avec succès", "success", "floreffe");
} catch (e) {
  await addEngineError(`[Floreffe] ⚠️ Erreur chargement datasets secondaires : ${e.message}`, "floreffe");
}

let phase1bisResults = [];
try {
  if (!Array.isArray(phase1Results) || phase1Results.length === 0)
    throw new Error("phase1Results vide ou invalide");

  phase1bisResults = phase1Results.map((pt) => ({
    ...pt,
    hydro: correlateTopoHydro(pt, geoData, hydro, reseaux, routes, livelyHydro)
  }));

  await saveExtractionToMongo("Floreffe", "BE", phase1bisResults);
  await addEngineLog("🌊 Corrélation topo/hydro appliquée avec succès", "success", "floreffe");
} catch (e) {
  await addEngineError(`[Floreffe] ❌ Erreur corrélation topo/hydro : ${e.message}`, "floreffe");
  phase1bisResults = phase1Results;
}

// ==========================================================
// 💧 PHASE 1bis+ — Humidité + VisionIA locale
// ==========================================================
await addEngineLog("💧 Calcul humidité + indice VisionIA local (1bis+)", "info", "floreffe");

const phase1bisPlus = phase1bisResults.map((pt) => {
  const result = { ...pt };
  const rain = Number(result.precipitation ?? 0);
  const temp = Number(result.temperature ?? 20);
  let humidity = 60;
  if (rain > 0.5) humidity += 20;
  if (temp < 5) humidity += 10;
  if (temp < 0) humidity += 5;
  if (humidity > 100) humidity = 100;
  result.humidity = Math.round(humidity);

  const alt = Number(result.alt ?? 100);
  const topoScore = result.topo?.score ?? 0.8;
  let visionia = topoScore;
  if (alt > 160) visionia *= 1.05;
  if (alt < 90) visionia *= 0.95;
  if (result.reliability < 0.7) visionia *= 0.85;
  result.visionia = Math.min(1, +(visionia.toFixed(2)));
  return result;
});

try {
  if (mongoose.connection.readyState === 1) {
    const floreffePhase1bis = mongoose.connection.collection("floreffe_phase1bis");
    const floreffePhase1bisPlus = mongoose.connection.collection("floreffe_phase1bisplus");
    await floreffePhase1bis.deleteMany({});
    if (phase1bisPlus.length > 0) await floreffePhase1bisPlus.insertMany(phase1bisPlus);
    await addEngineLog(`✅ Phase 1bis+ sauvegardée (${phase1bisPlus.length} points)`, "success", "floreffe");
  }
} catch (err) {
  await addEngineError(`[Floreffe] ⚠️ Erreur Mongo Phase 1bis+ : ${err.message}`, "floreffe");
}

await addEngineLog("⏳ Temporisation avant Phase 2 (IA J.E.A.N.)", "info", "floreffe");
await sleep(120000);

// ==========================================================
// 🧠 PHASE 2 — IA J.E.A.N. Locale
// ==========================================================
await addEngineLog("[Floreffe] 🚀 Phase 2 (IA J.E.A.N.) – Démarrage analyse locale", "info", "floreffe");

// ✅ Une seule instance OpenAI globale
const aiClient = globalThis.__TINSFLASH_AI__ || new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
globalThis.__TINSFLASH_AI__ = aiClient;

const phase1Data = Array.isArray(phase1bisPlus) ? phase1bisPlus : [];
const chunkSize = 150;
const chunks = [];
for (let i = 0; i < phase1Data.length; i += chunkSize) {
  chunks.push(phase1Data.slice(i, i + chunkSize));
}

let phase2Results = [];
const startPhase2 = Date.now();
await addEngineLog(`[Floreffe] ⚙️ IA J.E.A.N. initialisée – ${chunks.length} blocs × ${chunkSize} points`, "info", "floreffe");

for (const [index, chunk] of chunks.entries()) {
  const aiPrompt = `
${FLOREFFE_IA_PROMPT}

Analyse locale J.E.A.N. — bloc ${index + 1}/${chunks.length} (${chunk.length} points) :

${JSON.stringify(chunk, null, 2)}
Retourne STRICTEMENT un tableau JSON.
`;

  try {
    const ai = await aiClient.responses.create({
      model: "gpt-5",
      input: [
        { role: "system", content: "IA météorologique et hydrologique TINSFLASH PRO+++" },
        { role: "user", content: aiPrompt }
      ],
      temperature: 0.3,
      max_output_tokens: 1500
    });

    const raw = ai.output?.[0]?.content?.[0]?.text?.trim() || "";
    const match = raw.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!match) throw new Error("Aucune structure JSON détectée");

    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed)) phase2Results.push(...parsed);
    else if (parsed && typeof parsed === "object") phase2Results.push(parsed);

    await addEngineLog(`[Floreffe] ✅ Bloc IA ${index + 1}/${chunks.length} traité`, "success", "floreffe");
    await sleep(2500);
  } catch (err) {
    await addEngineError(`[Floreffe] ⚠️ Bloc ${index + 1} : ${err.message}`, "floreffe");
    await sleep(6000);
  }
}
// ==========================================================
// ⚡ PHASE 5 — FUSION + ALERTES RÉELLES (pondérées Floreffe)
// ==========================================================
await addEngineLog("🕓 Temporisation avant Phase 5 (Fusion/Export)", "info", "floreffe");
await sleep(120000);

// --- 5.1 Fusion interne unique des résultats Phase 2 ---
let enriched = Array.isArray(phase2Results) ? [...phase2Results] : [];
const publicDir = path.resolve("./public");

try {
  const unique = new Map();
  for (const item of enriched) unique.set(item.id || item.name, item);
  enriched = Array.from(unique.values());

  // ✅ Injecte la priorité (prio) si manquante, depuis la table points
  const byIdOrName = new Map(FLOREFFE_POINTS.map(p => [p.id || p.name, p]));
  enriched = enriched.map(e => {
    const key = e.id || e.name;
    const src = byIdOrName.get(key);
    return src && !e.prio ? { ...e, prio: src.prio } : e;
  });

  await addEngineLog(`[Floreffe] 🔗 Fusion interne : ${enriched.length} entrées consolidées`, "info", "floreffe");
} catch (err) {
  await addEngineError(`[Floreffe] ❌ Fusion interne : ${err.message}`, "floreffe");
}

// --- 5.2 Génération des alertes pondérées ---
await addEngineLog("[Floreffe] ⚡ Début génération d'alertes (pondération locale)", "info", "floreffe");

let alerts = enriched.flatMap(pt => {
  const list = [];
  const rain = Number(pt.precipitation ?? 0);
  const wind = Number(pt.wind ?? 0);
  const temp = Number(pt.temperature ?? 0);
  const hum  = Number(pt.humidity ?? 0);
  const vis  = Number((pt.visionia ?? 0) * 100); // visionia en %

  // Pluie
  if (rain >= ALERT_THRESHOLDS.rain.extreme) list.push({ type: "Pluie", level: "Extrême", value: rain, zone: pt.name });
  else if (rain >= ALERT_THRESHOLDS.rain.alert) list.push({ type: "Pluie", level: "Alerte", value: rain, zone: pt.name });
  else if (rain >= ALERT_THRESHOLDS.rain.prealert) list.push({ type: "Pluie", level: "Pré-alerte", value: rain, zone: pt.name });

  // Vent
  if (wind >= ALERT_THRESHOLDS.wind.extreme) list.push({ type: "Vent", level: "Extrême", value: wind, zone: pt.name });
  else if (wind >= ALERT_THRESHOLDS.wind.alert) list.push({ type: "Vent", level: "Alerte", value: wind, zone: pt.name });
  else if (wind >= ALERT_THRESHOLDS.wind.prealert) list.push({ type: "Vent", level: "Pré-alerte", value: wind, zone: pt.name });

  // Froid
  if (temp <= ALERT_THRESHOLDS.cold.extreme) list.push({ type: "Froid", level: "Extrême", value: temp, zone: pt.name });
  else if (temp <= ALERT_THRESHOLDS.cold.alert) list.push({ type: "Froid", level: "Alerte", value: temp, zone: pt.name });
  else if (temp <= ALERT_THRESHOLDS.cold.prealert) list.push({ type: "Froid", level: "Pré-alerte", value: temp, zone: pt.name });

  // Chaleur
  if (temp >= ALERT_THRESHOLDS.heat.extreme) list.push({ type: "Chaleur", level: "Extrême", value: temp, zone: pt.name });
  else if (temp >= ALERT_THRESHOLDS.heat.alert) list.push({ type: "Chaleur", level: "Alerte", value: temp, zone: pt.name });
  else if (temp >= ALERT_THRESHOLDS.heat.prealert) list.push({ type: "Chaleur", level: "Pré-alerte", value: temp, zone: pt.name });

  // Humidité (brouillard/saturation)
  if (hum >= ALERT_THRESHOLDS.humidity.alert)
    list.push({ type: "Humidité", level: "Alerte", value: hum, zone: pt.name });

  // VisionIA (indice topo/hydro local converti en %)
  if (vis >= ALERT_THRESHOLDS.visionia.alert)
    list.push({ type: "VisionIA", level: "Alerte", value: vis, zone: pt.name });

  return list;
});

// 5.3 Pondération (fiabilité × priorité)
alerts = alerts.map(a => {
  const zoneData = enriched.find(z => z.name === a.zone);
  const reliability = Number(zoneData?.reliability ?? 1);
  const prio = zoneData?.prio === "high" ? 1.15 : zoneData?.prio === "med" ? 1.05 : 1;
  const weighted = +(Number(a.value) * reliability * prio).toFixed(2);
  return { ...a, reliability, prio, weighted };
});

// 5.4 Déduplication (zone+type+level) en gardant le score max
const dedup = new Map();
for (const a of alerts) {
  const key = `${a.zone}::${a.type}::${a.level}`;
  const prev = dedup.get(key);
  if (!prev || a.weighted > prev.weighted) dedup.set(key, a);
}
alerts = Array.from(dedup.values());

// 5.5 Tri par sévérité pondérée (desc)
alerts.sort((x, y) => y.weighted - x.weighted);

await addEngineLog(`[Floreffe] ⚡ ${alerts.length} alertes générées et pondérées`, "success", "floreffe");

// --- 5.6 Écriture des fichiers publics ---
try {
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const exportForecasts = { generated: new Date().toISOString(), zones: enriched };
  const exportAlerts   = { generated: new Date().toISOString(), alerts };
  await fs.promises.writeFile(path.join(publicDir, "floreffe_forecasts.json"), JSON.stringify(exportForecasts, null, 2));
  await fs.promises.writeFile(path.join(publicDir, "floreffe_alerts.json"), JSON.stringify(exportAlerts, null, 2));
  await addEngineLog("✅ JSON publics générés", "success", "floreffe");
} catch (err) {
  await addEngineError(`[Floreffe] ❌ Échec écriture fichiers publics : ${err.message}`, "floreffe");
}

// --- 5.7 Fermeture propre Mongo ---
try {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    await addEngineLog("🔒 Mongo fermée proprement", "success", "floreffe");
  }
} catch (err) {
  await addEngineError(`[Floreffe] ⚠️ Clôture : ${err.message}`, "floreffe");
}
}

// =======================================================
// ✅ EXPORT UNIVERSEL (compatible ESM + CommonJS + Render)
// =======================================================

export { runFloreffe, superForecastLocal };
console.log("✅ [TINSFLASH] ESM MODELS — Export final prêt");
