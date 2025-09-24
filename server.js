// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// === Services ===
import superForecast from "./services/superForecast.js";
import forecastService from "./services/forecastService.js";
import alertsService from "./services/alertsService.js";
import radarService from "./services/radarService.js";
import podcastService from "./services/podcastService.js";
import chatService from "./services/chatService.js";
import { addLog, getLogs } from "./services/logsService.js";

// === DB Models ===
import Forecast from "./models/Forecast.js";
import Alert from "./models/Alert.js"; // ✅ cohérent

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ==============================
// 🔐 Protection Admin (Basic Auth)
// ==============================
function adminAuthMiddleware(req, res, next) {
  const isAdminPath =
    req.path === "/admin-pp.html" || req.path.startsWith("/admin");
  if (!isAdminPath) return next();

  const auth = req.headers.authorization;
  if (!auth) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Tinsflash Admin"');
    return res.status(401).send("Authentification requise");
  }

  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Basic") {
    return res.status(400).send("Format d'auth non supporté");
  }

  const decoded = Buffer.from(parts[1], "base64").toString("utf8");
  const [user, pass] = decoded.split(":");
  const ADMIN_USER = "admin";
  const ADMIN_PASS = "202679";

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return next();
  } else {
    res.setHeader("WWW-Authenticate", 'Basic realm="Tinsflash Admin"');
    return res.status(401).send("Authentification échouée");
  }
}

app.use(adminAuthMiddleware);

// ==============================
// 📂 Fichiers statiques
// ==============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

// ==============================
// 📡 MongoDB connection
// ==============================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

// ==============================
// 🚀 API ROUTES
// ==============================

// Run SuperForecast (manuel)
app.post("/api/superforecast/run", async (req, res) => {
  try {
    const data = req.body || {};
    const result = await superForecast.runSuperForecast(data);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get latest forecasts
app.get("/api/forecasts", async (req, res) => {
  try {
    const forecasts = await Forecast.find().sort({ date: -1 }).limit(50);
    res.json(forecasts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get alerts
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create alert (manual override)
app.post("/api/alerts", async (req, res) => {
  try {
    const alert = await alertsService.createAlert(req.body);
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat with J.E.A.N.
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await chatService.chatWithJean(message);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logs
app.get("/api/logs", async (req, res) => {
  try {
    const logs = await getLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Radar proxy
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await radarService.getRadar();
    res.json(radar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Podcast (bulletin météo audio)
app.get("/api/podcast", async (req, res) => {
  try {
    const audio = await podcastService.generatePodcast();
    res.json(audio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 🌍 Server start
// ==============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Serveur météo nucléaire actif sur le port ${PORT}`)
);
