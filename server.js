// server.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import forecastService from "./services/forecastService.js";
import superForecast from "./services/superForecast.js";
import alertsService from "./services/alertsService.js";
import chatService from "./services/chatService.js";
import bulletinService from "./services/bulletinService.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --------- ROUTES --------- //

// Lancer un SuperForecast
app.post("/run-superforecast", async (req, res) => {
  try {
    const logs = await superForecast.run();
    res.json({ success: true, logs });
  } catch (err) {
    console.error("❌ Erreur SuperForecast:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Obtenir les alertes
app.get("/alerts", async (req, res) => {
  try {
    const alerts = await alertsService.getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ajouter une alerte
app.post("/alerts", async (req, res) => {
  try {
    const alert = await alertsService.addAlert(req.body);
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat avec J.E.A.N.
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await chatService.chatWithJean(message);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Générer un bulletin météo
app.get("/bulletin", async (req, res) => {
  try {
    const bulletin = await bulletinService.getBulletin();
    res.json(bulletin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mettre à jour le bulletin météo
app.post("/bulletin", async (req, res) => {
  try {
    const updated = await bulletinService.updateBulletin(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------- LANCEMENT SERVEUR --------- //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur météo nucléaire lancé sur le port ${PORT}`);
});
