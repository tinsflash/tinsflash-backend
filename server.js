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

// Routes
import adminRoutes from "./routes/admin.js";

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

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Protect admin console
app.get("/admin-pp.html", (req, res) => {
  const pass = req.query.pass;
  if (pass === "202679") {
    res.sendFile(path.join(__dirname, "public", "admin-pp.html"));
  } else {
    res.status(401).send("⛔ Accès refusé – mot de passe requis");
  }
});

// Disable Google indexing
app.use((req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
});

// MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => logInfo("✅ MongoDB connecté"))
  .catch((err) => logError("❌ Erreur MongoDB: " + err.message));

/**
 * API ROUTES
 */

// --- SuperForecast ---
app.post("/api/supercalc/run", async (req, res) => {
  try {
    const { lat, lon } = req.body;
    addLog("🚀 Run SuperForecast lancé");
    const result = await superForecast.runFullForecast(lat, lon);
    addLog("✅ Run SuperForecast terminé");
    res.json(result);
  } catch (err) {
    addLog("❌ Erreur run SuperForecast: " + err.message);
    logError("❌ Erreur supercalc/run: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Forecast ---
app.get("/api/forecast/local", checkCoverage, async (req, res) => {
  try {
    const { lat, lon, country } = req.query;
    const data = await forecastService.getLocalForecast(lat, lon, country);
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
    const { lat, lon, country } = req.query;
    const data = await forecastService.get7DayForecast(lat, lon, country);
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

// --- Alerts ---
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

// --- Podcast ---
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

// --- Chat JEAN ---
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    addLog("💬 Question posée à J.E.A.N.: " + message);
    const response = await chatService.chatWithJean(message);
    addLog("🤖 Réponse J.E.A.N.: " + response);
    res.json({ reply: response });
  } catch (err) {
    logError("❌ Erreur chat: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Admin API ---
app.use("/api/admin", adminRoutes);

// --- Logs admin ---
app.get("/api/admin/logs", (req, res) => {
  res.json(getLogs());
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logInfo(`🌍 Serveur météo Tinsflash en marche sur port ${PORT}`);
});
