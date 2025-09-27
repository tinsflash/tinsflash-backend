// services/aiRouter.js
import express from "express";
import { askAI } from "./aiService.js";
import { getEngineState } from "./engineState.js";
import { getLogs } from "./adminLogs.js";
import forecastService from "./forecastService.js";
import fetch from "node-fetch";

const router = express.Router();

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
      return res.json({ reply, location: null });
    }

    // 🌍 Mode météo locale
    const cityMatch = message.match(/(?:à|au|en)\s+([A-Za-zÀ-ÿ\s-]+)/i);
    const city = cityMatch ? cityMatch[1].trim() : null;

    let forecastData = null;
    let locationInfo = null;

    if (city && country) {
      // Géocodage
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=${country.toLowerCase()}&q=${encodeURIComponent(city)}`;
      const resGeo = await fetch(url, { headers: { "User-Agent": "Tinsflash-Meteo" } });
      const data = await resGeo.json();
      if (data.length) {
        locationInfo = {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          display_name: data[0].display_name
        };
        forecastData = await forecastService.getLocalForecast(locationInfo.lat, locationInfo.lon, country);
      }
    }

    const prompt = `
Tu es l'assistant météo TINSFLASH.
Question utilisateur: "${message}"

Ville: ${city || "❌ non détectée"}
Pays: ${country || "❌ non spécifié"}
Prévisions centrales: ${forecastData ? JSON.stringify(forecastData) : "❌ Aucune donnée"}
`;

    const reply = await askAI(prompt);
    res.json({ reply, location: locationInfo });
  } catch (err) {
    console.error("❌ Chat IA error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
