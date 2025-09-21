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

// Middleware
import checkCoverage from "./services/checkCoverage.js";
import { logInfo, logError, getLogs } from "./utils/logger.js";

// Models
import Forecast from "./models/Forecast.js";
import Alert from "./models/Alert.js";
import User from "./models/User.js"; // pour stats utilisateurs

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Fix __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir public/
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

// Désactiver indexation Google
app.use((req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
});

// --- Connexion MongoDB ---
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

// SuperForecast (Europe & USA)
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

// Forecast local/national/7j
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

// Radar
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await radarService.getRadar();
    res.json(radar);
  } catch (err) {
    logError("❌ Erreur radar: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// Alertes
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await alertsService.getAlerts();

    // Split covered vs uncovered
    const coveredZones = ["EUROPE", "USA"];
    const covered = alerts.filter(a =>
      coveredZones.includes(a.zone?.toUpperCase())
    );
    const uncovered = alerts.filter(
      a => !coveredZones.includes(a.zone?.toUpperCase())
    );

    res.json({ covered, uncovered });
  } catch (err) {
    logError("❌ Erreur alerts:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/alerts", async (req, res) => {
  try {
    const alert = await alertsService.addAlert(req.body);
    res.json(alert);
  } catch (err) {
    logError("❌ Erreur ajout alerte:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/alerts/:id", async (req, res) => {
  try {
    const result = await alertsService.deleteAlert(req.params.id);
    res.json(result);
  } catch (err) {
    logError("❌ Erreur suppression alerte:", err.message);
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
    logError("❌ Erreur podcast:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Chat IA Jean
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const response = await chatService.askJean(message);
    res.json(response);
  } catch (err) {
    logError("❌ Erreur chat:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Logs
app.get("/api/logs", (req, res) => {
  try {
    res.json({ logs: getLogs() });
  } catch (err) {
    logError("❌ Erreur logs: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// Admin stats (utilisateurs + zones)
app.get("/api/admin/stats", async (req, res) => {
  try {
    const forecasts = await Forecast.countDocuments();
    const alerts = await Alert.countDocuments();
    const users = await User.find();

    // Group by zone + abonnement
    const stats = { covered: {}, uncovered: {} };
    const coveredZones = ["EUROPE", "USA"];

    users.forEach(u => {
      const target = coveredZones.includes(u.zone?.toUpperCase())
        ? stats.covered
        : stats.uncovered;

      if (!target[u.type]) target[u.type] = 0;
      target[u.type]++;
    });

    res.json({
      forecasts,
      alerts,
      uptime: process.uptime(),
      users: stats,
    });
  } catch (err) {
    logError("❌ Erreur admin/stats: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🚀 Lancement serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logInfo(`🌍 Serveur météo Tinsflash en marche sur port ${PORT}`);
});
