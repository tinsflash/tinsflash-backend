// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Services
import superForecast from "./services/superForecast.js";
import forecastService from "./services/forecastService.js";
import radarService from "./services/radarService.js";
import alertsService from "./services/alertsService.js";
import podcastService from "./services/podcastService.js";
import chatService from "./services/chatService.js";
import { addLog, getLogs } from "./services/logsService.js";
import { generateBulletin, getBulletin, updateBulletin } from "./services/bulletinService.js";

// Middleware
import checkCoverage from "./services/checkCoverage.js";
import { logInfo, logError } from "./utils/logger.js";

// Models
import Forecast from "./models/Forecast.js";
import Alert from "./models/Alert.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Fix __dirname pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "public")));

// --- Protection admin-pp.html ---
app.get("/admin-pp.html", (req, res) => {
  const pass = req.query.pass;
  if (pass === "202679") {
    res.sendFile(path.join(__dirname, "public", "admin-pp.html"));
  } else {
    res.status(401).send("⛔ Accès refusé – mot de passe requis");
  }
});

// Désactiver l’indexation Google
app.use((req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
});

// --- Connexion MongoDB ---
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => logInfo("✅ MongoDB connecté"))
  .catch((err) => logError("❌ Erreur MongoDB: " + err.message));

/**
 * ROUTES API
 */

// SuperForecast
app.post("/api/supercalc/run", async (req, res) => {
  try {
    const { lat, lon } = req.body;
    addLog("🚀 Run SuperForecast lancé");
    const result = await superForecast.runFullForecast(lat, lon);
    addLog("✅ Run SuperForecast terminé");
    res.json(result);
  } catch (err) {
    addLog("❌ Erreur run SuperForecast: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// Forecasts
app.get("/api/forecast/local", checkCoverage, async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await forecastService.getLocalForecast(lat, lon);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/forecast/national", checkCoverage, async (req, res) => {
  try {
    const { country } = req.query;
    const data = await forecastService.getNationalForecast(country);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Radar
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await radarService.getRadar();
    res.json(radar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alertes
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await alertsService.getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Podcasts
app.post("/api/podcast/generate", async (req, res) => {
  try {
    const { text } = req.body;
    const file = await podcastService.generatePodcast(text);
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat JEAN
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    addLog("💬 Question posée à J.E.A.N.: " + message);
    const response = await chatService.chatWithJean(message);
    addLog("🤖 Réponse J.E.A.N.: " + response);
    res.json({ reply: response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Stats
app.get("/api/admin/stats", async (req, res) => {
  try {
    const forecasts = await Forecast.countDocuments();
    const alerts = await Alert.countDocuments();
    res.json({ forecasts, alerts, uptime: process.uptime() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Logs
app.get("/api/admin/logs", (req, res) => res.json(getLogs()));

// Admin Users (⚠️ temporaire → connecter plus tard DB Users)
app.get("/api/admin/users", (req, res) => {
  res.json({
    covered: { free: 12, premium: 3, pro: 1, proPlus: 0 },
    nonCovered: { free: 4, premium: 1, pro: 0, proPlus: 0 },
  });
});

// Bulletins météo
app.post("/api/admin/bulletin/generate", async (req, res) => {
  try {
    const bulletin = await generateBulletin();
    res.json(bulletin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/bulletin/latest", (req, res) => {
  try {
    const bulletin = getBulletin();
    res.json(bulletin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/bulletin/update", (req, res) => {
  try {
    const bulletin = updateBulletin(req.body);
    res.json(bulletin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚀 Lancement serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logInfo(`🌍 Serveur météo Tinsflash en marche sur port ${PORT}`);
});
