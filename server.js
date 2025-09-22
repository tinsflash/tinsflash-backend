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

// Fix __dirname pour ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fichiers statiques
app.use(express.static(path.join(__dirname, "public")));

// --- Protection console admin --- //
app.get("/admin-pp.html", (req, res) => {
  const pass = req.query.pass;
  if (pass === "202679") {
    res.sendFile(path.join(__dirname, "public", "admin-pp.html"));
  } else {
    res.status(401).send("⛔ Accès refusé – mot de passe requis");
  }
});

// Désactivation indexation
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
    const result = await superForecast.runFullForecast(lat, lon);
    addLog("✅ Run SuperForecast terminé");
    res.json(result);
  } catch (err) {
    addLog("❌ Erreur run SuperForecast: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Forecasts ---
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

// Prévisions spécifiques BE/FR/LUX modifiables via admin
let customBulletins = {
  BE: "",
  FR: "",
  LUX: "",
};

app.get("/api/admin/bulletins", (req, res) => {
  res.json(customBulletins);
});

app.post("/api/admin/bulletins", (req, res) => {
  const { country, text } = req.body;
  if (["BE", "FR", "LUX"].includes(country)) {
    customBulletins[country] = text;
    addLog(`📝 Bulletin ${country} mis à jour manuellement`);
    return res.json({ success: true });
  }
  res.status(400).json({ error: "Pays non géré" });
});

// --- Radar ---
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await radarService.getRadar();
    res.json(radar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Alertes ---
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await alertsService.getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Chat avec J.E.A.N. ---
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

// --- Logs ---
app.get("/api/admin/logs", (req, res) => {
  res.json({ logs: getLogs() });
});

// --- Users ---
app.get("/api/admin/users", (req, res) => {
  res.json({
    covered: { free: 20, premium: 5, pro: 2, proPlus: 1 },
    nonCovered: { free: 8, premium: 2, pro: 0, proPlus: 0 },
  });
});

// 🚀 Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logInfo(`🌍 Serveur météo Tinsflash en marche sur port ${PORT}`);
});
