// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Services
import { runSuperForecast } from "./services/superForecast.js";
import forecastService from "./services/forecastService.js";
import radarService from "./services/radarService.js";
import alertsService from "./services/alertsService.js";
import podcastService from "./services/podcastService.js";
import chatService from "./services/chatService.js";
import { getWeatherNews } from "./services/newsService.js";
import { addLog, getLogs } from "./services/logsService.js";

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

// Fix __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir les fichiers statiques (public/)
app.use(express.static(path.join(__dirname, "public")));

// --- Protection admin-pp.html --- //
app.get("/admin-pp.html", (req, res) => {
  const pass = req.query.pass;
  if (pass === "202679") {
    res.sendFile(path.join(__dirname, "public", "admin-pp.html"));
  } else {
    res.status(401).send("⛔ Accès refusé – mot de passe requis");
  }
});

// Désactiver indexation Google
app.use((req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
});

// --- Connexion MongoDB --- //
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => logInfo("✅ MongoDB connecté"))
  .catch((err) => logError("❌ Erreur MongoDB: " + err.message));

/**
 * ROUTES API
 */

// --- SuperForecast ---
app.post("/api/supercalc/run", async (req, res) => {
  try {
    const { lat, lon } = req.body;
    addLog("🚀 Run SuperForecast lancé");
    const result = await runSuperForecast({ lat, lon });
    addLog("✅ Run SuperForecast terminé");
    res.json(result);
  } catch (err) {
    addLog("❌ Erreur supercalc/run: " + err.message);
    logError("❌ Erreur supercalc/run: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Prévisions météo ---
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

// --- Radar ---
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await radarService.getRadar();
    res.json(radar);
  } catch (err) {
    logError("❌ Erreur radar: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Alertes ---
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

// --- Podcasts ---
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

// --- Chat avec J.E.A.N. ---
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    addLog("💬 Question posée à J.E.A.N.: " + message);
    const response = await chatService.chatWithJean(message);
    addLog("🤖 Réponse J.E.A.N.: " + response.text);
    res.json(response);
  } catch (err) {
    logError("❌ Erreur chat: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Stats admin ---
app.get("/api/admin/stats", async (req, res) => {
  try {
    const forecasts = await Forecast.countDocuments();
    const alerts = await Alert.countDocuments();
    res.json({
      forecasts,
      alerts,
      uptime: process.uptime(),
    });
  } catch (err) {
    logError("❌ Erreur admin/stats: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Logs admin ---
app.get("/api/admin/logs", (req, res) => {
  res.json(getLogs());
});

// --- Users admin ---
app.get("/api/admin/users", (req, res) => {
  res.json({
    covered: { free: 120, premium: 35, pro: 10, proPlus: 2 },
    nonCovered: { free: 50, premium: 5, pro: 1, proPlus: 0 },
  });
});

// --- News météo mondiales ---
app.get("/api/admin/news", async (req, res) => {
  try {
    const news = await getWeatherNews();
    res.json(news);
  } catch (err) {
    logError("❌ Erreur news: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Prévisions nationales BE/FR/LUX (édition admin) ---
app.get("/api/admin/forecasts", async (req, res) => {
  try {
    const latest = await Forecast.findOne().sort({ timestamp: -1 });
    res.json(latest?.nationalForecasts || {});
  } catch (err) {
    logError("❌ Erreur admin/forecasts GET: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/forecasts", async (req, res) => {
  try {
    const { BE, FR, LUX } = req.body;
    const latest = await Forecast.findOne().sort({ timestamp: -1 });
    if (latest) {
      latest.nationalForecasts = { BE, FR, LUX };
      await latest.save();
    }
    res.json({ success: true, updated: latest?.nationalForecasts });
  } catch (err) {
    logError("❌ Erreur admin/forecasts POST: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🚀 Lancement serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logInfo(`🌍 Serveur météo Tinsflash en marche sur port ${PORT}`);
  logInfo("🤖 Mode IA actif: Cohere (GPT-5 en veille)");
});
