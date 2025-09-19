// -------------------------
// 🌍 server.js
// Backend Express pour TINSFLASH
// -------------------------
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./db.js";
import Forecast from "./models/Forecast.js";

// Import services
import { getForecast } from "./services/forecastService.js";
import { getAlerts } from "./services/alertsService.js";
import { generatePodcast } from "./services/podcastService.js";
import { getWeatherIcon, generateCode } from "./services/codesService.js";
import { chatWithJean } from "./services/chatService.js";
import { getRadarLayers } from "./services/radarService.js";

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // frontend

// -------------------------
// 🚀 Supercalculateur météo
// -------------------------
app.post("/api/supercalc/run", async (req, res) => {
  try {
    const { time, country } = req.body;
    const coords = { lat: 50.8503, lon: 4.3517 }; // Bruxelles

    // Vérifier si déjà en DB
    const existing = await Forecast.findOne({ runTime: time, country });
    if (existing) {
      return res.json({ ...existing._doc, status: "♻️ Résultat récupéré depuis DB" });
    }

    const forecast = await getForecast(coords.lat, coords.lon, country || "BE");

    const runResult = {
      runTime: time || new Date().toISOString(),
      country: country || "BE",
      lat: coords.lat,
      lon: coords.lon,
      forecast: forecast.combined,
      errors: forecast.combined.errors || [],
    };

    await Forecast.create(runResult);

    res.json({
      ...runResult,
      status: runResult.errors.length
        ? `⚠️ Run partiel : ${Object.keys(forecast.sources).length - runResult.errors.length} sources OK, ${runResult.errors.length} erreurs`
        : "✅ Run 100% réussi"
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur supercalculateur: " + err.message });
  }
});

app.get("/api/supercalc/logs", async (req, res) => {
  try {
    const logs = await Forecast.find().sort({ createdAt: -1 }).limit(10);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération logs" });
  }
});

// -------------------------
// ROUTES API classiques
// -------------------------

app.get("/", (req, res) => res.send("🚀 TINSFLASH Backend opérationnel !"));

// Local forecast
app.get("/api/forecast/local", async (req, res) => {
  try {
    const { lat, lon, country } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Latitude et longitude requises" });

    const lastRun = await Forecast.findOne({ country: country || "BE" }).sort({ createdAt: -1 });
    if (lastRun) return res.json(lastRun);

    const forecast = await getForecast(lat, lon, country || "BE");
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alerts
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Radar
app.get("/api/radar", async (req, res) => {
  try {
    const layers = await getRadarLayers();
    res.json({
      layers,
      tilesUrl: "https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/2/1_1.png",
      timestampsUrl: "https://api.rainviewer.com/public/maps.json",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Podcast
app.post("/api/podcast/generate", async (req, res) => {
  try {
    const { type, text } = req.body;
    const podcast = await generatePodcast(type || "daily", text);
    res.json(podcast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Codes
app.get("/api/codes/generate", (req, res) => {
  try {
    const { type } = req.query;
    if (!type) return res.status(400).json({ error: "Type d’abonnement requis" });

    const code = generateCode(type);
    res.json(code);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// LANCEMENT SERVEUR
// -------------------------
app.listen(PORT, () => {
  console.log(`🚀 TINSFLASH backend en ligne sur http://localhost:${PORT}`);
});
