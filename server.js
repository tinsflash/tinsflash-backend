// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Services
import superForecast from "./services/superForecast.js";
import forecastService from "./services/forecastService.js";
import radarService from "./services/radarService.js";
import alertsService from "./services/alertsService.js";
import podcastService from "./services/podcastService.js";
import chatService from "./services/chatService.js";

// Middleware
import checkCoverage from "./services/checkCoverage.js";

// Models
import Forecast from "./models/Forecast.js";
import Alert from "./models/Alert.js";

// Utils
import { logInfo, logError } from "./utils/logger.js";
import runForecastBatch from "./admin/manualForecast.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => logInfo("✅ MongoDB connecté"))
  .catch((err) => logError("❌ Erreur MongoDB: " + err.message));

/**
 * ROUTES API PUBLIQUES
 */

// 🔥 Run complet SuperForecast (IA + multi-modèles)
app.post("/api/supercalc/run", async (req, res) => {
  try {
    const { lat, lon } = req.body;
    const result = await superForecast.runFullForecast(lat, lon);
    res.json(result);
  } catch (err) {
    logError("❌ Erreur supercalc/run: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📡 Forecast local
app.get("/api/forecast/local", checkCoverage, async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await forecastService.getLocalForecast(lat, lon);
    res.json(data);
  } catch (err) {
    logError("❌ Erreur forecast/local: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📡 Forecast national
app.get("/api/forecast/national", checkCoverage, async (req, res) => {
  try {
    const { country } = req.query;
    const data = await forecastService.getNationalForecast(country);
    res.json(data);
  } catch (err) {
    logError("❌ Erreur forecast/national: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📡 Forecast 7 jours
app.get("/api/forecast/7days", checkCoverage, async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await forecastService.get7DayForecast(lat, lon);
    res.json(data);
  } catch (err) {
    logError("❌ Erreur forecast/7days: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🌍 Radar météo
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await radarService.getRadar();
    res.json(radar);
  } catch (err) {
    logError("❌ Erreur radar: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// ⚠️ Alertes météo
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await alertsService.getAlerts();
    res.json(alerts);
  } catch (err) {
    logError("❌ Erreur alerts: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/alerts", async (req, res) => {
  try {
    const alert = await alertsService.addAlert(req.body);
    res.json(alert);
  } catch (err) {
    logError("❌ Erreur ajout alerte: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/alerts/:id", async (req, res) => {
  try {
    const result = await alertsService.deleteAlert(req.params.id);
    res.json(result);
  } catch (err) {
    logError("❌ Erreur suppression alerte: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🎙 Podcasts météo
app.post("/api/podcast/generate", async (req, res) => {
  try {
    const { text } = req.body;
    const file = await podcastService.generatePodcast(text);
    res.json(file);
  } catch (err) {
    logError("❌ Erreur podcast: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🤖 JEAN (IA météo explicative)
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const response = await chatService.askJean(message);
    res.json(response);
  } catch (err) {
    logError("❌ Erreur chat: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ADMIN PRO+
 */

// Lancer un run batch complet
app.post("/api/admin/runBatch", async (req, res) => {
  try {
    logInfo("🚀 Début du run batch depuis Admin");
    await runForecastBatch();
    logInfo("✅ Run batch terminé avec succès");
    res.json({ success: true });
  } catch (err) {
    logError("Erreur run batch admin: " + err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Stats admin
app.get("/api/admin/stats", async (req, res) => {
  try {
    const forecasts = await Forecast.countDocuments();
    const alerts = await Alert.countDocuments();
    res.json({
      forecasts,
      alerts,
      uptime: process.uptime()
    });
  } catch (err) {
    logError("Erreur admin/stats: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// ------------------
// ALERTES MANUELLES (70-89%)
// ------------------
app.get("/api/admin/alerts/pending", async (req, res) => {
  try {
    const pending = await Alert.find({
      confidence: { $gte: 70, $lt: 90 },
      validated: false
    });
    res.json(pending);
  } catch (err) {
    logError("Erreur admin/alerts/pending: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/alerts/validate/:id", async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { validated: true },
      { new: true }
    );
    if (!alert) {
      return res.status(404).json({ error: "Alerte introuvable" });
    }
    logInfo(`⚠️ Alerte ${alert._id} validée manuellement`);
    res.json(alert);
  } catch (err) {
    logError("Erreur validation alerte: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🚀 Lancement serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logInfo(`🌍 Serveur météo Tinsflash en marche sur port ${PORT}`);
});
