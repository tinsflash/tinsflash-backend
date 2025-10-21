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
          headers: { "User-Agent": "TINSFLASH-MeteoEngine/1.0 (contact: skysnapia@gmail.com)" }
        }
      ];

   for (const m of models) {
  try {
    const options = { timeout: 15000 };
    if (m.headers) options.headers = m.headers;
    const r = await axios.get(m.url, options);

    // --- Extraction simplifiée ---
    let T = null, P = 0, W = null;
    if (r.data?.hourly?.time) {
      const times = r.data.hourly.time;
      const idx = times.findIndex((t) => t.includes("12:00"));
      T = r.data.hourly.temperature_2m?.[idx] ?? null;
      P = r.data.hourly.precipitation?.[idx] ?? 0;
      W = r.data.hourly.wind_speed_10m?.[idx] ?? null;
    }
// --- Fusion moyenne & fiabilité ---
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

 // Journal d’ouverture Mongo (non bloquant)
      await addEngineLog("⏳ Vérification de la connexion Mongo (Mongoose)...", "info", "floreffe");

      // ✅ On passe désormais par mongoose.connection
      // (on réutilise la connexion déjà ouverte, pas de re-déclaration)
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

// === PHASE 1bis — Corrélation topographique / hydrologique ===
await addEngineLog("[Floreffe] 🌊 Corrélation topographique / hydrologique en cours...", "info", "floreffe");

// === PHASE 1bis – Corrélation topographique / hydrologique ===
const datasetsPath = path.resolve("./services/datasets");
const geo = JSON.parse(fs.readFileSync(`${datasetsPath}/floreffe_geoperalt.json`, "utf8"));
const hydro = JSON.parse(fs.readFileSync(`${datasetsPath}/floreffe_hydro.json`, "utf8"));
const reseaux = JSON.parse(fs.readFileSync(`${datasetsPath}/floreffe_reseaux.json`, "utf8"));
const routes = JSON.parse(fs.readFileSync(`${datasetsPath}/floreffe_routes.json`, "utf8"));
const livelyHydro = await fetchLivelyHydroData();

const phase1bisResults = phase1Results.map((pt) => ({
  ...pt,
  hydro: correlateTopoHydro(pt, geo, hydro, reseaux, routes, livelyHydro)
}));

await saveExtractionToMongo("Floreffe", "BE", phase1bisResults);
await addEngineLog("🌊 Corrélation topographique / hydrologique appliquée", "success", "floreffe");

// === PHASE 1bis+ – Calcul humidité et indice VisionIA local ===
await addEngineLog("💧 Début calcul humidité et VisionIA (1bis+)", "info", "floreffe");

const phase1bisPlus = phase1bisResults.map((pt) => {
  const result = { ...pt };

  // === Calcul humidité relative approximée ===
  const rain = Number(result.precipitation ?? 0);
  const temp = Number(result.temperature ?? 20);
  let humidity = 60;

  if (rain > 0.5) humidity += 20;
  if (temp < 5) humidity += 10;
  if (temp < 0) humidity += 5;
  if (humidity > 100) humidity = 100;

  result.humidity = Math.round(humidity);

  // === Calcul indice VisionIA local (score de confiance IA terrain) ===
  const alt = Number(result.altitude ?? 100);
  const topoScore = result.topo?.score ?? 0.8;
  let visionia = topoScore;

  if (alt > 160) visionia *= 1.05;
  if (alt < 90) visionia *= 0.95;
  if (result.reliability < 0.7) visionia *= 0.85;

  result.visionia = Math.min(1, +(visionia.toFixed(2)));

  return result;
});

// === Sauvegarde Mongo (VisionIA + humidité) ===
if (mongoose.connection.readyState === 1) {
  const floreffePhase1bis = mongoose.connection.collection("floreffe_phase1bis");
  const floreffePhase1bisPlus = mongoose.connection.collection("floreffe_phase1bisplus");

  await floreffePhase1bis.deleteMany({});
  await floreffePhase1bisPlus.insertMany(phase1bisPlus);

  await addEngineLog(
    `✅ [Floreffe] Phase 1bis sauvegardée (${phase1bisPlus.length} points humidité + VisionIA)`,
    "success",
    "floreffe"
  );
} else {
  await addEngineError(
    "[Floreffe] ❌ Connexion Mongo inactive lors de la sauvegarde Phase 1bis",
    "floreffe"
  );
}
    // ⏳ Temporisation avant Phase 2
await addEngineLog("⏳ Temporisation avant Phase 2 (IA J.E.A.N.)", "info", "floreffe");
await sleep(200000); // 2 minutes ou plus

    // === PHASE 2 — IA J.E.A.N. locale (multi-jours, compatible GPT-5) ===
await addEngineLog("[Floreffe] Phase 2 — IA J.E.A.N. (analyse multi-jours)", "info", "floreffe");

let phase1Data = phase1Results;

const chunkSize = 200;
const chunks = [];
for (let i = 0; i < phase1Data.length; i += chunkSize)
  chunks.push(phase1Data.slice(i, i + chunkSize));

let phase2Results = [];
const startPhase2 = Date.now();

for (const [index, chunk] of chunks.entries()) {
  // 🧠 Construction du prompt détaillé
  const aiPrompt = `
${FLOREFFE_IA_PROMPT}

Analyse locale J.E.A.N. — paquet ${index + 1}/${chunks.length} (${chunk.length} points) :

Voici les données physiques extraites en Phase 1 (réelles, non simulées) pour analyse :
${JSON.stringify(chunk, null, 2)}

Retourne STRICTEMENT un tableau JSON où chaque entrée contient :
{
  "id": "FLO_01",
  "name": "Maison communale",
  "dayOffset": 0,
  "temperature": 7.5,
  "precipitation": 2.3,
  "wind": 18.2,
  "risk": {
    "pluie": 0.7,
    "verglas": 0.2,
    "vent": 0.4,
    "brouillard": 0.6,
    "inondation": 0.5
  },
  "reliability": 0.92,
  "commentaire": "Risque de bruine faible avec vent modéré, vigilance ruissellement",
  "confidence": 0.9
}
Ne commente rien hors JSON.
  `;

  try {
    const ai = await openai.responses.create({
      model: "gpt-5",
      input: [
       {
  role: "system",
  content: `Tu es J.E.A.N., IA météo-hydrologique locale,
  meilleur météorologue, meilleur climatologue et meilleur mathématicien au monde,
  experte de la commune de Floreffe (Belgique).`
},
        { role: "user", content: aiPrompt }
      ],
    });

    const raw = ai.output_text?.trim() || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Aucune structure JSON détectée dans la réponse IA");

    const parsed = JSON.parse(jsonMatch[0]);
    if (Array.isArray(parsed)) phase2Results.push(...parsed);
    else if (parsed && typeof parsed === "object") phase2Results.push(parsed);

    await addEngineLog(`[Floreffe] ✅ IA J.E.A.N. — paquet ${index + 1}/${chunks.length}`, "success", "floreffe");
    await sleep(2000);
  } catch (err) {
    await addEngineError(`[Floreffe] ⚠️ Erreur IA J.E.A.N. paquet ${index + 1} : ${err.message}`, "floreffe");
    await sleep(6000);
  }
}

// === Sauvegarde Mongo Phase 2 (version Mongoose stable) ===
if (mongoose.connection.readyState === 1) {
  const floreffePhase2 = mongoose.connection.collection("floreffe_phase2");
  try {
    await floreffePhase2.deleteMany({});
    if (phase2Results.length) {
      await floreffePhase2.insertMany(phase2Results);
    }
    const duration = ((Date.now() - startPhase2) / 1000).toFixed(1);
    await addEngineLog(
      `[Floreffe] ✅ Phase 2 terminée (${phase2Results.length} objets, ${duration}s)`,
      "success",
      "floreffe"
    );
  } catch (err) {
    await addEngineError(`[Floreffe] ❌ Erreur sauvegarde Phase 2 : ${err.message}`, "floreffe");
  }
} else {
  await addEngineError("❌ [Floreffe] Connexion Mongo inactive à la sauvegarde Phase 2", "floreffe");
}
// === Temporisation avant Phase 5 ===
await addEngineLog("🕓 Temporisation avant Phase 5 (Fusion/Export)", "info", "floreffe");
await sleep(200000); // 2 min ou plus


// === PHASE 5 — FUSION IA + EXPORT GLOBAL (MONGOOSE STABLE) ===

try {
  // === Création dossier public si besoin ===
  const publicDir = path.join(__dirname, "../public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    await addEngineLog("[Floreffe] 📁 Dossier public créé automatiquement", "info", "floreffe");
  }

  // === Écriture des fichiers publics initiaux ===
  await fs.promises.writeFile(
    path.join(publicDir, "floreffe_forecasts.json"),
    JSON.stringify(exportForecasts, null, 2),
    "utf8"
  );

  await fs.promises.writeFile(
    path.join(publicDir, "floreffe_alerts.json"),
    JSON.stringify({ generated: new Date(), alerts }, null, 2),
    "utf8"
  );

  await addEngineLog("✅ Export public floreffe_forecasts.json + floreffe_alerts.json terminé", "success", "floreffe");

  // === PATCH BLOC 2 — Sécurisation écriture JSON et nettoyage doublons ===
  try {
    const forecastsFile = path.join(publicDir, "floreffe_forecasts.json");
    const alertsFile = path.join(publicDir, "floreffe_alerts.json");

    await fs.promises.writeFile(
      forecastsFile,
      JSON.stringify(exportForecasts, null, 2),
      "utf8"
    );

    await fs.promises.writeFile(
      alertsFile,
      JSON.stringify({ generated: new Date(), alerts }, null, 2),
      "utf8"
    );

    await addEngineLog("✅ [Floreffe] Export JSON sécurisé (prévision + alertes) effectué", "success", "floreffe");
  } catch (err) {
    await addEngineError(`[Floreffe] ⚠️ Erreur écriture fichiers JSON : ${err.message}`, "floreffe");
  }
  // === FIN PATCH BLOC 2 ===


  // === PATCH BLOC 4 — Vérification JSON publics + correctif 5 jours ===
  try {
    const forecastsFile = path.join(publicDir, "floreffe_forecasts.json");
    const alertsFile = path.join(publicDir, "floreffe_alerts.json");

    const checkFile = (file) => fs.existsSync(file) && fs.statSync(file).size > 20;

    // Validation prévisions
    if (!checkFile(forecastsFile)) {
      await addEngineError("[Floreffe] ❌ floreffe_forecasts.json manquant ou vide", "floreffe");
    } else {
      await addEngineLog("[Floreffe] ✅ floreffe_forecasts.json validé pour affichage", "success", "floreffe");
    }

    // Validation alertes
    if (!checkFile(alertsFile)) {
      await addEngineLog("🚫 Aucune alerte active (fichier vide ou inexistant)", "info", "floreffe");
      await fs.promises.writeFile(alertsFile, JSON.stringify({ generated: new Date(), alerts: [] }, null, 2), "utf8");
    }

    // Correction données nulles
    const forecasts = JSON.parse(fs.readFileSync(forecastsFile, "utf8"));
    if (forecasts?.zones?.length) {
      forecasts.zones = forecasts.zones.map((z) => ({
        ...z,
        temperature: Number.isFinite(z.temperature) ? z.temperature : 0,
        precipitation: Number.isFinite(z.precipitation) ? z.precipitation : 0,
        wind: Number.isFinite(z.wind) ? z.wind : 0,
        humidity: Number.isFinite(z.humidity) ? z.humidity : 0,
      }));

      await fs.promises.writeFile(forecastsFile, JSON.stringify(forecasts, null, 2), "utf8");
      await addEngineLog("[Floreffe] 🔄 Vérification + correction JSON publics OK", "success", "floreffe");
    }
  } catch (err) {
    await addEngineError(`[Floreffe] ⚠️ Erreur vérification JSON publics : ${err.message}`, "floreffe");
  }
  // === FIN PATCH BLOC 4 ===


  // === PATCH BLOC 5 — Contrôle pré-synchronisation Mongo ===
  try {
    await addEngineLog("[Floreffe] 🔍 Vérification avant synchronisation Mongo", "info", "floreffe");

    const validForecasts = Array.isArray(enriched) && enriched.length > 0;
    const validAlerts = Array.isArray(alerts);

    if (!validForecasts) {
      await addEngineError("[Floreffe] ⚠️ Aucun forecast valide détecté avant synchro", "floreffe");
    } else {
      const uniqueZones = new Map();
      for (const f of enriched) uniqueZones.set(f.name || f.id, f);
      enriched.length = 0;
      enriched.push(...uniqueZones.values());
      await addEngineLog(`[Floreffe] ✅ ${enriched.length} prévisions uniques prêtes pour Mongo`, "success", "floreffe");
    }

    if (validAlerts && alerts.length) {
      await addEngineLog(`[Floreffe] ⚠️ ${alerts.length} alertes à synchroniser`, "info", "floreffe");
    } else {
      await addEngineLog("[Floreffe] 🚫 Aucune alerte à synchroniser (OK)", "info", "floreffe");
    }

    const now = new Date().toISOString();
    await addEngineLog(`[Floreffe] 🧾 Récapitulatif ${now} → Forecasts:${enriched.length} | Alerts:${alerts.length}`, "success", "floreffe");
  } catch (err) {
    await addEngineError(`[Floreffe] ❌ Erreur contrôle pré-synchro Mongo : ${err.message}`, "floreffe");
  }

// === Sauvegarde Mongo Cloud (Mongoose stable) ===
if (mongoose.connection.readyState === 1) {
  const conn = mongoose.connection;
  const forecastsCol = conn.collection("forecasts");
  const alertsCol = conn.collection("alerts");

  try {
    await forecastsCol.updateOne(
      { zone: "Floreffe" },
      { $set: { zone: "Floreffe", data: enriched, updatedAt: new Date() } },
      { upsert: true }
    );

    await alertsCol.deleteMany({ zone: /Floreffe/i });
    if (alerts.length) await alertsCol.insertMany(alerts);

    await addEngineLog("💾 Données Floreffe exportées vers Mongo Cloud global.", "success", "floreffe");
  } catch (err) {
    await addEngineError(`[Floreffe] ❌ Erreur export Cloud : ${err.message}`, "floreffe");
  }
} else {
  await addEngineError("[Floreffe] ❌ Connexion Mongo inactive lors de l’export Cloud", "floreffe");
}

// --- Génération relief NGI + fusion météo
try {
  const { exec } = await import("child_process");
  exec("node ./services/generateFloreffeAltitudes.js && node ./services/fuseTopoMeteo.js");
  await addEngineLog("🗺️ Génération relief NGI + fusion météo lancée", "info", "floreffe");
} catch (err) {
  await addEngineError(`[Floreffe] ⚠️ Erreur génération relief/fusion : ${err.message}`, "floreffe");
}

// --- Synchronisation multi-Render
try {
  await syncResultsToCentral(enriched, alerts);
  await addEngineLog("📡 Synchronisation vers moteur central terminée", "success", "floreffe");
} catch (err) {
  await addEngineError(`[Floreffe] ❌ Échec synchronisation multi-Render : ${err.message}`, "floreffe");
}

// --- Fermeture propre de Mongo ---
try {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    await addEngineLog("[Floreffe] 🔒 Connexion Mongo fermée proprement", "success", "floreffe");
  } else {
    await addEngineLog("[Floreffe] ⚙️ Mongo déjà fermé ou inactif", "info", "floreffe");
  }
} catch (err) {
  await addEngineError(`[Floreffe] ⚠️ Erreur lors de la fermeture Mongo : ${err.message}`, "floreffe");
}

// --- Fin de run propre ---
await addEngineLog("[Floreffe] 🏁 Fin de run détectée — arrêt Render propre", "success", "floreffe");
await sleep(500);
if (typeof process !== "undefined" && process.exit) {
  setTimeout(() => process.exit(0), 1000);
}
// =======================================================
// 🔚 EXPORT UNIVERSEL — TINSFLASH PRO+++ (ESM + CJS SAFE)
// =======================================================

// ✅ Export natif si l'environnement ESM est actif
let __isESM = false;
try {
  // Si import.meta existe, on est bien en module ESM
  if (typeof import.meta !== "undefined" && import.meta.url) {
    __isESM = true;
  }
} catch {}

// --- Export ESM pur
if (__isESM) {
  try {
    // Trick ESM : on utilise dynamic import pour ne pas bloquer CommonJS
    const dynamicExports = { runFloreffe, superForecastLocal };
    globalThis.__TINSFLASH_EXPORTS__ = dynamicExports;
  } catch (err) {
    console.error("⚠️ ESM export error:", err.message);
  }
}

// --- Fallback CommonJS pour Render / Node loader par défaut
try {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { runFloreffe, superForecastLocal };
  }
} catch (err) {
  console.error("⚠️ CommonJS export error:", err.message);
}

// --- Journal de validation
console.log("✅ [TINSFLASH] Export universel initialisé (mode:", __isESM ? "ESM" : "CJS", ")");
