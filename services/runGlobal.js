// services/aiRouter.js
import express from "express";
import { askAI } from "./aiService.js";
import { getEngineState } from "./engineState.js";
import { getLogs } from "./adminLogs.js";
import forecastService from "./forecastService.js";
import fetch from "node-fetch";

const router = express.Router();

// 🔁 mapping ISO → nom complet (pour forecastService)
const COUNTRY_MAP = {
  BE: "Belgium",
  FR: "France",
  DE: "Germany",
  ES: "Spain",
  IT: "Italy",
  NL: "Netherlands",
  PT: "Portugal",
  UK: "United Kingdom",
  GB: "United Kingdom",
  US: "USA",
  AT: "Austria",
  CH: "Switzerland",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  PL: "Poland",
  CZ: "Czechia",
  RO: "Romania",
  SK: "Slovakia",
  SI: "Slovenia",
  GR: "Greece",
  HU: "Hungary",
  IE: "Ireland",
  LT: "Lithuania",
  LV: "Latvia",
  EE: "Estonia",
  FI: "Finland",
  UA: "Ukraine",
  LU: "Luxembourg",
  MT: "Malta",
  BG: "Bulgaria",
  HR: "Croatia",
  CY: "Cyprus"
  // à compléter si nécessaire
};

router.post("/", async (req, res) => {
  try {
    const { message, country } = req.body;

    // 🔍 Mode diagnostic moteur
    if (/moteur|erreur|état|diagnostic/i.test(message)) {
      const state = getEngineState();
      const logs = getLogs().slice(0, 5);

      const prompt = `
Diagnostic demandé sur le moteur météo TINSFLASH.

État actuel:
- runTime: ${state.runTime}
- zones ok: ${Object.keys(state.zonesCovered || {}).filter(z => state.zonesCovered[z])}
- zones ko: ${Object.keys(state.zonesCovered || {}).filter(z => !state.zonesCovered[z])}
- erreurs: ${JSON.stringify(state.errors)}
- derniers logs: ${logs.map(l => l.message).join(" | ")}

Question: "${message}"
Réponds uniquement avec ces données. En français clair, professionnel et synthétique.
`;

      const reply = await askAI(prompt);
      return res.json({ success: true, reply, location: null });
    }

    // 🌍 Mode météo locale
    const cityMatch = message.match(/(?:à|au|en)\s+([A-Za-zÀ-ÿ\s-]+)/i);
    const city = cityMatch ? cityMatch[1].trim() : null;

    if (!city || !country) {
      return res.status(400).json({
        success: false,
        error: "❌ Requête invalide : ville ou pays manquant."
      });
    }

    // 🔁 normaliser le pays
    const normCountry = COUNTRY_MAP[country.toUpperCase()] || country;

    // Géocodage via Nominatim
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=${country.toLowerCase()}&q=${encodeURIComponent(city)}`;
    const resGeo = await fetch(url, { headers: { "User-Agent": "Tinsflash-Meteo" } });
    const data = await resGeo.json();

    if (!data.length) {
      return res.status(404).json({
        success: false,
        error: `❌ Localisation introuvable pour ${city}, ${normCountry}`
      });
    }

    const locationInfo = {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      display_name: data[0].display_name
    };

    // Prévisions avec moteur nucléaire météo
    const forecastData = await forecastService.getLocalForecast(locationInfo.lat, locationInfo.lon, normCountry);

    const prompt = `
Tu es l'assistant météo TINSFLASH.
Question utilisateur: "${message}"

Ville: ${city}
Pays: ${normCountry}
Prévisions centrales: ${forecastData ? JSON.stringify(forecastData) : "❌ Aucune donnée"}
`;

    const reply = await askAI(prompt);
    res.json({ success: true, reply, location: locationInfo });
  } catch (err) {
    console.error("❌ Chat IA error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
