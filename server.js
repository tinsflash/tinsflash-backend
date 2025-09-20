// -------------------------
// 🚀 server.js
// Backend Express + MongoDB + IA météo
// Machine nucléaire météo TINSFLASH
// -------------------------

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db.js";
import Forecast from "./models/Forecast.js";

import { runSuperForecast } from "./services/superForecast.js";
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
app.use(express.static("public"));

let lastRuns = [];
let currentProgress = { step: 0, total: 5, status: "idle" };

// -------------------------
// SUPER CALCULATEUR
// -------------------------
app.post("/api/supercalc/run", async (req, res) => {
  try {
    const { time, country, lat, lon } = req.body;
    const coords = { lat: lat || 50.8503, lon: lon || 4.3517 };

    currentProgress = { step: 0, total: 5, status: "running" };

    // Étape 1 : Préparation
    currentProgress.step = 1;

    // Étape 2 : Exécution IA
    currentProgress.step = 2;
    const forecast = await runSuperForecast(coords.lat, coords.lon, country || "BE");

    // Étape 3 : Consolidation
    currentProgress.step = 3;
    const runResult = {
      time: time || new Date().toISOString(),
      forecast: forecast.forecast,
      errors: forecast.errors || [],
      status:
        forecast.errors && forecast.errors.length > 0
          ? `⚠️ Partiel (${forecast.sources?.length} sources, ${forecast.errors.length} erreurs)`
          : "✅ Run réussi",
    };

    // Étape 4 : Sauvegarde
    currentProgress.step = 4;
    lastRuns.push(runResult);
    if (lastRuns.length > 10) lastRuns.shift();

    const dbEntry = new Forecast(runResult);
    await dbEntry.save();

    // Étape 5 : Terminé
    currentProgress.step = 5;
    currentProgress.status = "done";

    res.json(runResult);
  } catch (err) {
    currentProgress.status = "error";
    res.status(500).json({ error: "Supercalc error: " + err.message });
  }
});

app.get("/api/supercalc/progress", (req, res) => {
  res.json(currentProgress);
});

app.get("/api/supercalc/logs", async (req, res) => {
  try {
    const runs = await Forecast.find().sort({ createdAt: -1 }).limit(10);
    res.json(runs);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération logs: " + err.message });
  }
});

// -------------------------
// ROUTES API
// -------------------------
app.get("/", (req, res) => res.send("🚀 Backend TINSFLASH en ligne !"));

app.get("/api/forecast/local", async (req, res) => {
  try {
    const { lat, lon, country } = req.query;
    const forecast = await runSuperForecast(lat, lon, country || "BE");
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/forecast/national", async (req, res) => {
  try {
    const { country } = req.query;
    let coords = { lat: 50.8503, lon: 4.3517 };
    if (country === "FR") coords = { lat: 48.8566, lon: 2.3522 };
    if (country === "US") coords = { lat: 38.9072, lon: -77.0369 };
    const forecast = await runSuperForecast(coords.lat, coords.lon, country || "BE");
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/forecast/7days", async (req, res) => {
  try {
    const { lat, lon, country } = req.query;
    const forecast = await runSuperForecast(lat, lon, country || "BE");

    const now = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(now.getDate() + i);
      days.push({
        date: date.toISOString().split("T")[0],
        jour: date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
        temperature_min: forecast.forecast.temperature_min,
        temperature_max: forecast.forecast.temperature_max,
        vent: forecast.forecast.wind,
        precipitation: forecast.forecast.precipitation,
        description: forecast.forecast.description,
        fiabilité: forecast.forecast.reliability,
        anomalie: forecast.forecast.anomaly || "Normale",
        icone: getWeatherIcon(forecast.forecast.code || 0),
      });
    }
    res.json({ source: "TINSFLASH IA", days });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

app.post("/api/podcast/generate", async (req, res) => {
  try {
    const { type, text } = req.body;
    const podcast = await generatePodcast(type || "daily", text);
    res.json(podcast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/codes/generate", (req, res) => {
  const { type } = req.query;
  const code = generateCode(type || "premium");
  res.json(code);
});

app.get("/api/weather/icon", (req, res) => {
  const { code } = req.query;
  const icon = getWeatherIcon(parseInt(code || 0, 10));
  res.json({ code, icon });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await chatWithJean(message || "Analyse météo globale");
    res.json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// LANCEMENT
// -------------------------
app.listen(PORT, () => {
  console.log(`🚀 Serveur TINSFLASH lancé sur port ${PORT}`);
});
