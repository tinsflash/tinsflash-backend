// PATH: services/runGlobalAfricaEst.js
// 🌍 Référentiel zones Afrique de l’Est & Corne – TINSFLASH PRO+++
// Couvre : Éthiopie, Somalie, Kenya, Tanzanie, Ouganda, Soudan du Sud,
//          Rwanda, Burundi, Érythrée, Djibouti
// Objectif : Rift est-africain, hautes terres, côtes océan Indien, flux de mousson
// ==========================================================

import { addEngineLog } from "./engineState.js";

/**
 * Journalise le chargement des zones Afrique de l’Est & Corne
 */
export async function logAfricaEstCoverage() {
  await addEngineLog(
    "🗺️ Chargement zones Afrique de l’Est & Corne – validé",
    "info",
    "zonesCovered"
  );
}

// ===========================
// 🌍 ZONES DÉTAILLÉES
// ===========================
export const AFRICA_EST_ZONES = {
  Ethiopia: [
    { lat: 8.98,  lon: 38.79, region: "Addis Ababa - Highlands" },
    { lat: 11.59, lon: 37.39, region: "Bahir Dar - Lake Tana" },
    { lat: 13.50, lon: 39.47, region: "Mekelle - Tigray North" },
    { lat: 9.60,  lon: 41.86, region: "Dire Dawa/Harar - East Rift" },
    { lat: 6.04,  lon: 37.55, region: "Arba Minch - South Rift" }
  ],

  Somalia: [
    { lat: 2.04,  lon: 45.34, region: "Mogadishu - Indian Ocean Coast" },
    { lat: 9.56,  lon: 44.06, region: "Hargeisa - Somaliland Highlands" },
    { lat: -0.44, lon: 42.55, region: "Kismayo - South Coast" },
    { lat: 6.77,  lon: 47.43, region: "Galkayo - Central Arid" }
  ],

  Kenya: [
    { lat: -1.29, lon: 36.82, region: "Nairobi - Highlands" },
    { lat: -4.05, lon: 39.67, region: "Mombasa - Coast" },
    { lat: 0.52,  lon: 35.27, region: "Eldoret - Uasin Gishu" },
    { lat: -0.10, lon: 34.75, region: "Kisumu - Lake Victoria" },
    { lat: 3.12,  lon: 35.60, region: "Lodwar - Turkana Desert" }
  ],

  Tanzania: [
    { lat: -6.82, lon: 39.28, region: "Dar es Salaam - Coast" },
    { lat: -6.16, lon: 35.75, region: "Dodoma - Central Plateau" },
    { lat: -3.37, lon: 36.68, region: "Arusha/Kilimanjaro - North Highlands" },
    { lat: -2.52, lon: 32.90, region: "Mwanza - Lake Victoria" },
    { lat: -6.16, lon: 39.20, region: "Zanzibar - Unguja" }
  ],

  Uganda: [
    { lat: 0.35,
