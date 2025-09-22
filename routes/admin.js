// routes/admin.js
import express from "express";
import { runSuperForecast } from "../services/superForecast.js";
import { chatWithJean } from "../services/chatService.js";
import { getForecasts, getAlerts, getUsers } from "../utils/db.js";

const router = express.Router();

/**
 * 🚀 Lancer un Run SuperForecast
 */
router.post("/superforecast", async (req, res) => {
  try {
    const location = req.body.location || { lat: 50.5, lon: 4.7 }; // défaut: Belgique
    const result = await runSuperForecast(location);
    res.json(result);
  } catch (err) {
    console.error("Erreur SuperForecast:", err);
    res.status(500).json({ error: "Erreur lors du lancement du Run SuperForecast." });
  }
});

/**
 * 📜 Logs & prévisions sauvegardées
 */
router.get("/forecasts", async (req, res) => {
  try {
    const forecasts = await getForecasts();
    res.json(forecasts);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération forecasts." });
  }
});

/**
 * ⚠️ Alertes générées
 */
router.get("/alerts", async (req, res) => {
  try {
    const alerts = await getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération alertes." });
  }
});

/**
 * 👥 Utilisateurs
 */
router.get("/users", async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération utilisateurs." });
  }
});

/**
 * 🤖 Chat avec J.E.A.N.
 */
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message manquant." });

    const jeanResponse = await chatWithJean([
      {
        role: "system",
        content:
          "Tu es J.E.A.N., chef mécanicien de la centrale nucléaire météo. " +
          "Expert météo, climat, mathématiques. Tu analyses les modèles météo, " +
          "produis des prévisions fiables et des alertes utiles pour la sécurité humaine, animale et matérielle."
      },
      { role: "user", content: message }
    ]);

    res.json({ response: jeanResponse });
  } catch (err) {
    console.error("Erreur Chat J.E.A.N.:", err.message);
    res.status(500).json({ error: "Erreur lors du chat avec J.E.A.N." });
  }
});

export default router;
