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
import { MongoClient } from "mongodb";
import OpenAI from "openai";
import { addEngineLog, addEngineError, saveExtractionToMongo } from "./engineState.js";
import { applyGeoFactors } from "./geoFactors.js";
import { applyLocalFactors } from "./localFactors.js";
import { correlateTopoHydro } from "./correlateTopoHydro.js";
import { fetchLiveHydroData } from "./fetchLiveHydroData.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  snow:     { prealert: 0.8, alert: 2,  extreme: 6,  unit: "cm/h" },
  wind:     { prealert: 55, alert: 70, extreme: 95, unit: "km/h" },
  heat:     { prealert: 29, alert: 34, extreme: 38, unit: "°C" },
  cold:     { prealert: -3, alert: -7, extreme: -12, unit: "°C" },
  humidity: { prealert: 93, alert: 97, extreme: 100, unit: "%" },
  visionia: { prealert: 70, alert: 82, extreme: 90, unit: "%" },
};

// ==========================================================
// 🧠 IA J.E.A.N. locale – Prompt contextuel Floreffe
// ==========================================================
const FLOREFFE_IA_PROMPT = `
Tu es J.E.A.N., IA météo-hydrologique locale dédiée à la commune de Floreffe (Belgique).
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
    await addEngineLog(`📡 [SuperForecast] Test du modèle ${m.name}`, "info", "superForecast");

    const options = { timeout: 15000 };
    if (m.headers) options.headers = m.headers;
    const r = await axios.get(m.url, options);

    let T = null, P = 0, W = null;

    if (r.data?.hourly?.time) {
      const times = r.data.hourly.time;
      const idx = times.findIndex((t) => t.includes("12:00"));
      T = r.data.hourly.temperature_2m?.[idx] ?? null;
      P = r.data.hourly.precipitation?.[idx] ?? 0;
      W = r.data.hourly.wind_speed_10m?.[idx] ?? null;
    }

    push({ source: m.name, temperature: T, precipitation: P, wind: W });

    await addEngineLog(
      `✅ [SuperForecast] ${m.name} OK → T=${T ?? "?"}°C, P=${P ?? "?"}mm, W=${W ?? "?"}km/h`,
      "success",
      "superForecast"
    );
  } catch (e) {
    await addEngineError(`💥 [SuperForecast] ${m.name} indisponible : ${e.message}`, "superForecast");
  }

  await sleep(200);
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
// 🚀 Fonction principale – 100 % autonome
// ==========================================================
async function runFloreffe() {
  const mongo = new MongoClient(process.env.MONGO_URI);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    await mongo.connect();
    const db = mongo.db("tinsflash");

    console.log("✅ [TINSFLASH] Démarrage Floreffe — Everest Protocol v6.5.1 (Fix DoubleLoop)");

    // === PHASE 1 – Extraction multi-modèles locale sur 7 jours ===
    // === PHASE 1 – Extraction multi-modèles locale sur 7 jours ===
const phase1Results = [];
const forecastDays = 5;

for (let dayOffset = 0; dayOffset <= forecastDays; dayOffset++) {
  try {
    await addEngineLog(`🌀 [Floreffe] Phase 1 — Extraction physique J+${dayOffset}`, "info", "floreffe");

    const res = await superForecastLocal({
      zones: FLOREFFE_POINTS,
      runType: "Floreffe",
      dayOffset
    });

    if (res?.success && res.phase1Results?.length) {
      const now = new Date();
      const stamped = res.phase1Results.map(p => ({
        ...p,
        timestamp: now,
        hour: now.toISOString().split("T")[1].slice(0,5),
      }));
      phase1Results.push(...stamped);

      await addEngineLog(
        `✅ [Floreffe] Extraction J+${dayOffset} terminée (${FLOREFFE_POINTS.length} points)`,
        "success",
        "floreffe"
      );

      // 🌄 Corrélation topographique/hydrologique par J+N (non imbriquée)
      try {
        await addEngineLog(`🌄 [Floreffe] Corrélation topo/hydro J+${dayOffset}`, "info", "floreffe");
        await correlateTopoHydro(`Floreffe_J${dayOffset}`, dayOffset);
        await addEngineLog(`✅ Corrélation J+${dayOffset} terminée`, "success", "floreffe");
      } catch (corrErr) {
        await addEngineError(`⚠️ Corrélation J+${dayOffset} : ${corrErr.message}`, "floreffe");
      }
    } else {
      await addEngineError(`[Floreffe] Aucun résultat valide pour J+${dayOffset}`, "floreffe");
    }

    // 🕐 Temporisation de stabilité entre J+N (2 minutes)
    await sleep(120000);

  } catch (e) {
    await addEngineError(`[Floreffe] Erreur extraction J+${dayOffset} : ${e.message}`, "floreffe");
  }
}
    // === PHASE 2 — IA J.E.A.N. locale (multi-jours)
    await addEngineLog("[Floreffe] Phase 2 — IA J.E.A.N. (analyse multi-jours)", "info", "floreffe");

    let phase1Data = phase1Results;

    if (!phase1Data?.length) {
      const reload = await db.collection("floreffe_phase1").find({}).toArray();
      if (reload?.length) {
        phase1Data = reload;
        await addEngineLog(`[Floreffe] 🔁 Données Phase 1 rechargées (${reload.length})`, "info", "floreffe");
      } else {
        await addEngineError("[Floreffe] ⚠️ Aucune donnée Phase 1 pour IA J.E.A.N.", "floreffe");
        phase1Data = [];
      }
    }

    const chunkSize = 200;
    const chunks = [];
    for (let i = 0; i < phase1Data.length; i += chunkSize)
      chunks.push(phase1Data.slice(i, i + chunkSize));

    let phase2Results = [];
    const startPhase2 = Date.now();

    for (const [index, chunk] of chunks.entries()) {
      const aiPrompt = `${FLOREFFE_IA_PROMPT}\n\nAnalyse locale J.E.A.N. — paquet ${index + 1}/${chunks.length} (${chunk.length} points) :\n${JSON.stringify(chunk)}`;
      try {
        const ai = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [{ role: "user", content: aiPrompt }],
          temperature: 0.8,
        });

        const raw = ai.choices?.[0]?.message?.content?.trim() || "";
        const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("Aucune structure JSON détectée");

        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) phase2Results.push(...parsed);
        else if (parsed && typeof parsed === "object") phase2Results.push(parsed);

        await addEngineLog(`[Floreffe] ✅ IA J.E.A.N. — paquet ${index + 1}/${chunks.length}`, "success", "floreffe");
        await sleep(2000);
      } catch (err) {
        await addEngineError(`[Floreffe] ⚠️ Erreur IA J.E.A.N. paquet ${index + 1} : ${err.message}`, "floreffe");
        await sleep(1000);
      }
    }

    await db.collection("floreffe_phase2").deleteMany({});
    if (phase2Results.length) await db.collection("floreffe_phase2").insertMany(phase2Results);

    const duration = ((Date.now() - startPhase2) / 1000).toFixed(1);
    await addEngineLog(`[Floreffe] 🤖 Phase 2 terminée (${phase2Results.length} objets, ${duration}s)`, "success", "floreffe");

    // === PHASE 5 — Fusion + Export ===

    // ==========================================================
// 🌍 PHASE 5 — FUSION COMPLÈTE + EXPORT FINAL (Everest Protocol v6.5.1 PRO+++ AUTONOME)
// ==========================================================
try {
  await addEngineLog("🧠 [Floreffe] Phase 5 — Fusion IA + physique + export global en cours...", "info", "floreffe");

  // 🔹 Charger les données réelles précédentes
  const phase1 = await db.collection("floreffe_phase1").find({}).toArray();
  const phase2 = await db.collection("floreffe_phase2").find({}).toArray();

  // 🔹 Fusion intelligente
  const fused = [];
  for (const p1 of phase1) {
    const p2 = phase2.find(p =>
      Math.abs(p1.lat - p.lat) < 0.01 &&
      Math.abs(p1.lon - p.lon) < 0.01
    );

    const fusedObj = {
      zone: "Floreffe",
      lat: p1.lat,
      lon: p1.lon,
      name: p1.name || p2?.name,
      temperature: p2?.temperature ?? p1.temperature,
      precipitation: p2?.precipitation ?? p1.precipitation,
      wind: p2?.wind ?? p1.wind,
      reliability: +((
        (p1.reliability ?? 0.5) +
        (p2?.reliability ?? 0.5)
      ) / 2).toFixed(2),
      risk: p2?.risk ?? {},
      origin: "Floreffe_dome",
      timestamp: new Date(),
      thresholds: ALERT_THRESHOLDS
    };
    fused.push(fusedObj);
  }

  // 🔹 Calcul de moyennes locales pour monitoring
  const avg = arr => (arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0);
  const meanTemp = avg(fused.map(f => f.temperature ?? 0)).toFixed(1);
  const meanRain = avg(fused.map(f => f.precipitation ?? 0)).toFixed(1);
  const meanWind = avg(fused.map(f => f.wind ?? 0)).toFixed(1);
  await addEngineLog(`🌡️ Moyennes locales : T=${meanTemp}°C / P=${meanRain} mm / W=${meanWind} km/h`, "info", "floreffe");

  // 🔹 Génération des alertes locales fusionnées
  const alerts = fused
    .map(x => {
      const rainHit = x.precipitation >= ALERT_THRESHOLDS.rain.alert;
      const iceHit = x.temperature <= ALERT_THRESHOLDS.cold.alert;
      const windHit = x.wind >= ALERT_THRESHOLDS.wind.alert;
      if (!rainHit && !iceHit && !windHit) return null;

      let type = rainHit ? "Alerte Pluie forte" :
                 iceHit ? "Alerte Verglas" :
                 "Alerte Vent fort";
      let desc =
        rainHit
          ? `Cumul horaire > ${ALERT_THRESHOLDS.rain.alert} mm/h`
          : iceHit
            ? `Températures < ${ALERT_THRESHOLDS.cold.alert} °C → verglas possible`
            : `Rafales ≥ ${ALERT_THRESHOLDS.wind.alert} km/h`;
      const level =
        (rainHit && x.precipitation >= ALERT_THRESHOLDS.rain.extreme) ||
        (windHit && x.wind >= ALERT_THRESHOLDS.wind.extreme)
          ? "rouge" : "orange";

      return {
        type,
        zone: x.name || "Floreffe",
        description: desc,
        reliability: x.reliability ?? 0.9,
        lat: x.lat,
        lon: x.lon,
        level,
        timestamp: new Date()
      };
    })
    .filter(Boolean);

  // 🔹 Sauvegarde Mongo locale
  await db.collection("floreffe_phase5").deleteMany({});
  await db.collection("floreffe_phase5").insertMany(fused);
  await db.collection("alerts_floreffe").deleteMany({});
  if (alerts.length) await db.collection("alerts_floreffe").insertMany(alerts);

  await addEngineLog(`✅ [Floreffe] Fusion/Export local OK (${fused.length} points, ${alerts.length} alertes)`, "success", "floreffe");

  // 🔹 Export JSON public
  const forecastsPath = path.join(__dirname, "../public/floreffe_forecasts.json");
  const alertsPath = path.join(__dirname, "../public/floreffe_alerts.json");
  const forecastRange = "J+0 → J+5";

  await fs.promises.writeFile(
    forecastsPath,
    JSON.stringify({ generated: new Date(), range: forecastRange, zones: fused }, null, 2)
  );
  await fs.promises.writeFile(alertsPath, JSON.stringify(alerts, null, 2));

  await addEngineLog(`📤 [Floreffe] Export JSON public terminé (${alerts.length} alertes)`, "success", "floreffe");

  // 🔹 Synchronisation Mongo Cloud Global
  await db.collection("forecasts").updateOne(
    { zone: "Floreffe" },
    { $set: { zone: "Floreffe", data: fused } },
    { upsert: true }
  );
  await db.collection("alerts").deleteMany({ zone: /Floreffe/i });
  if (alerts.length) await db.collection("alerts").insertMany(alerts);

  await addEngineLog("💾 [Floreffe] Synchronisation Mongo Cloud terminée.", "success", "floreffe");
} catch (err) {
  await addEngineError(`[Floreffe] ❌ Erreur Phase 5 — Fusion/Export : ${err.message}`, "floreffe");
}

// ==========================================================
// 🔚 Export compatible ESM (Render + Node 22.x)
// ==========================================================
export { runFloreffe, superForecastLocal }; 
