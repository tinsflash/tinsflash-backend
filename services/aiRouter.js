// services/aiRouter.js
import express from "express";
import { askAI } from "./aiService.js";
import forecastService from "./forecastService.js";
import trullemans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";
import fetch from "node-fetch";

const router = express.Router();

/**
 * Utilitaire: chercher lat/lon d'une ville via Nominatim
 */
async function geocodeCity(city, country) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=${country.toLowerCase()}&q=${encodeURIComponent(city)}`;
    const res = await fetch(url, { headers: { "User-Agent": "Tinsflash-Meteo" } });
    const data = await res.json();
    if (!data.length) return null;

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      display_name: data[0].display_name
    };
  } catch (err) {
    console.error("❌ Geocoding error:", err.message);
    return null;
  }
}

/**
 * Route /api/chat
 * Questions météo enrichies avec les données de la Centrale Nucléaire Météo
 */
router.post("/", async (req, res) => {
  try {
    const { message, country } = req.body;

    // Détecter la ville dans la question
    const cityMatch = message.match(/(?:à|au|en)\s+([A-Za-zÀ-ÿ\s-]+)/i);
    const city = cityMatch ? cityMatch[1].trim() : null;

    let forecastData = null;
    let comparators = null;
    let locationInfo = null;

    if (city && country) {
      // 🎯 Géocodage (ville + pays choisi dans admin)
      locationInfo = await geocodeCity(city, country);

      if (locationInfo) {
        forecastData = await forecastService.getLocalForecast(
          locationInfo.lat,
          locationInfo.lon,
          country
        );

        // Comparateurs uniquement si la question contient "compare"
        if (/compare/i.test(message)) {
          const tru = await trullemans(locationInfo.lat, locationInfo.lon);
          const wz = await wetterzentrale("arpege"); // exemple : modèle Arpège
          comparators = { trullemans: tru, wetterzentrale: wz };
        }
      }
    }

    const prompt = `
Tu es l'assistant du moteur nucléaire météo TINSFLASH.
Question utilisateur: "${message}"

Ville détectée: ${city || "❌ non détectée"}
Pays: ${country || "❌ non spécifié"}
Prévisions centrales: ${forecastData ? JSON.stringify(forecastData) : "❌ Aucune donnée"}
Comparateurs: ${comparators ? JSON.stringify(comparators) : "Non demandés"}

Consignes:
- Donne la réponse en français, claire et pro.
- Si prévisions disponibles → résume (température, précipitations, vent, risques).
- Si comparateurs présents → indique s'ils confirment ou divergent.
- Ne jamais inventer → si pas de données → préciser "donnée indisponible".
`;

    const reply = await askAI(prompt);
    res.json({ reply, location: locationInfo });
  } catch (err) {
    console.error("❌ Chat IA error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
