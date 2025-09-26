// services/aiRouter.js
import express from "express";
import { askAI } from "./aiService.js";
import forecastService from "./forecastService.js";
import trullemans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";

const router = express.Router();

/**
 * Route /api/chat
 * Questions météo enrichies avec les données de la Centrale Nucléaire Météo
 */
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    // Détection simple ville/pays (si mentionnés dans la question)
    const cityMatch = message.match(/à ([A-Za-zÀ-ÿ\s-]+)/i);
    let forecastData = null;
    let comparators = null;

    if (cityMatch) {
      const city = cityMatch[1].trim();

      // Exemple simplifié : pour la France (Marseille)
      if (/marseille/i.test(city)) {
        // Marseille coords
        const lat = 43.2965, lon = 5.3698, country = "FR";
        forecastData = await forecastService.getLocalForecast(lat, lon, country);

        // Comparateurs
        const tru = await trullemans(lat, lon);
        const wz = await wetterzentrale("arpege"); // ex: modèle Arpège
        comparators = { trullemans: tru, wetterzentrale: wz };
      }
    }

    // Construire le prompt IA
    const prompt = `
Tu es l'assistant du moteur nucléaire météo.
Question utilisateur: "${message}"

Prévisions centrales: ${forecastData ? JSON.stringify(forecastData) : "❌ Aucune donnée"}
Comparateurs: ${comparators ? JSON.stringify(comparators) : "Non disponibles"}

Consignes:
- Si prévisions disponibles → donne un résumé clair, précis, en français.
- Si comparateurs présents → indique s'ils confirment ou contredisent nos prévisions.
- Si rien trouvé → dis que la donnée n'est pas disponible.
`;

    const reply = await askAI(prompt);

    res.json({ reply });
  } catch (err) {
    console.error("❌ Chat IA error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
