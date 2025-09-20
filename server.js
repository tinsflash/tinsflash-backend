// -------------------------
// 🌍 server.js
// Backend Express pour TINSFLASH avec MongoDB et moteur IA multi-modèles
// -------------------------
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db.js"; 
import Forecast from "./models/Forecast.js"; 

// Services
import { runSuperForecast } from "./services/superForecast.js";
import { getAlerts } from "./services/alertsService.js";
import { generatePodcast } from "./services/podcastService.js";
import { getWeatherIcon, generateCode } from "./services/codesService.js";
import { chatWithJean } from "./services/chatService.js";
import { getRadarLayers } from "./services/radarService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public")); 

connectDB();

// -------------------------
// 🚀 SUPER CALCULATEUR METEO
// -------------------------
let lastRuns = [];

app.post("/api/supercalc/run", async (req, res) => {
  try {
    const { time, country, lat, lon } = req.body;
    const coords = { lat: lat || 50.8503, lon: lon || 4.3517 };

    const forecast = await runSuperForecast(coords.lat, coords.lon, country || "BE");

    const runResult = {
      time: time || new Date().toISOString(),
      forecast: forecast.forecast,
      errors: forecast.errors || [],
      status: forecast.errors.length > 0
        ? `⚠️ Run partiel : ${forecast.sources?.length || 0} sources utilisées, ${forecast.errors.length} erreurs`
        : "✅ Run 100% réussi",
    };

    lastRuns.push(runResult);
    if (lastRuns.length > 10) lastRuns.shift();

    const dbEntry = new Forecast(runResult);
    await dbEntry.save();

    res.json(runResult);
  } catch (err) {
    console.error("❌ Erreur supercalculateur :", err);
    res.status(500).json({ error: "Erreur supercalculateur: " + err.message });
  }
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
// API ROUTES
// -------------------------
app.get("/", (req, res) => {
  res.send("🚀 TINSFLASH Backend opérationnel avec moteur IA multi-modèles !");
});

app.get("/api/forecast/local", async (req, res) => {
  try {
    const { lat, lon, country } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Latitude et longitude requises" });
    res.json(await runSuperForecast(lat, lon, country || "BE"));
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
    res.json(await runSuperForecast(coords.lat, coords.lon, country || "BE"));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/forecast/7days", async (req, res) => {
  try {
    const { lat, lon, country } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Latitude et longitude requises" });

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

    res.json({ source: "TINSFLASH IA + multi-modèles", reliability: forecast.forecast.reliability, days });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/alerts", async (req, res) => {
  try {
    res.json(await getAlerts());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Radar interactif
app.get("/api/radar", async (req, res) => {
  try {
    res.json({
      layers: [
        {
          name: "🌧️ Précipitations",
          type: "rain",
          url: "https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/2/1_1.png",
          attribution: "Radar RainViewer"
        },
        {
          name: "❄️ Neige",
          type: "snow",
          url: "https://tilecache.rainviewer.com/v2/snow/{time}/256/{z}/{x}/{y}/2/1_1.png",
          attribution: "Radar RainViewer"
        },
        {
          name: "🌬️ Vent",
          type: "wind",
          url: "https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=439d4b804bc8187953eb36d2a8c26a02",
          attribution: "Vent OpenWeatherMap (demo)"
        }
      ],
      timestampsUrl: "https://api.rainviewer.com/public/maps.json"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/podcast/generate", async (req, res) => {
  try {
    const { type, text } = req.body;
    res.json(await generatePodcast(type || "daily", text));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/codes/generate", (req, res) => {
  try {
    const { type } = req.query;
    if (!type) return res.status(400).json({ error: "Type d’abonnement requis" });
    res.json(generateCode(type));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/weather/icon", (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "Code météo requis" });
    res.json({ code, icon: getWeatherIcon(parseInt(code, 10)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    res.json(await chatWithJean(message || "Analyse météo globale"));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// START SERVER
// -------------------------
app.listen(PORT, () => {
  console.log(`✅ Serveur TINSFLASH lancé sur http://localhost:${PORT}`);
});
