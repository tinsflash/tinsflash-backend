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
      const logs = getLogs().slice(0, 10);

      const prompt = `
Diagnostic demandé sur le moteur météo TINSFLASH.

État actuel :
- runTime : ${state.runTime}
- Zones OK : ${Object.keys(state.zonesCovered || {}).filter(z => state.zonesCovered[z])}
- Zones KO : ${Object.keys(state.zonesCovered || {}).filter(z => !state.zonesCovered[z])}
- Erreurs : ${JSON.stringify(state.errors)}
- Derniers logs : ${logs.map(l => l.message).join(" | ")}

Réponds en français, clair, professionnel et uniquement avec ces données.
`;
      const reply = await askAI(prompt);
      return res.json({ reply, location: null });
    }

    // 🌍 Si on détecte une ville
    const cityMatch = message.match(/(?:à|au|en)\s+([A-Za-zÀ-ÿ\s-]+)/i);
    const city = cityMatch ? cityMatch[1].trim() : null;

    let forecastData = null;
    let locationInfo = null;

    if (city && country) {
      // Géocodage de la ville
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

    // 🛰️ Si pas de ville/pays → fallback moteur
    if (!city || !country) {
      const state = getEngineState();
      const logs = getLogs().slice(0, 5);

      const prompt = `
Résumé demandé dans la console admin TINSFLASH.

Dernier run du moteur nucléaire météo :
- Date : ${state.runTime}
- Zones couvertes OK : ${Object.keys(state.zonesCovered || {}).filter(z => state.zonesCovered[z])}
- Zones KO : ${Object.keys(state.zonesCovered || {}).filter(z => !state.zonesCovered[z])}
- Alertes détectées : ${state.alertsList?.length || 0}
- Logs récents : ${logs.map(l => l.message).join(" | ")}

Question posée : "${message}"

Réponds uniquement avec ces données en bulletin météo clair et professionnel.
`;
      const reply = await askAI(prompt);
      return res.json({ reply, location: null });
    }

    // 🔮 Si ville + pays détectés → prévisions locales
    const prompt = `
Tu es l'assistant météo TINSFLASH (console admin).
Question : "${message}"

Ville : ${city || "❌ non détectée"}
Pays : ${country || "❌ non spécifié"}
Prévisions centrales : ${forecastData ? JSON.stringify(forecastData) : "❌ Aucune donnée"}
`;

    const reply = await askAI(prompt);
    res.json({ reply, location: locationInfo });
  } catch (err) {
    console.error("❌ Chat IA error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
