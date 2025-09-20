// -------------------------
// 🌍 server.js
// Backend Express pour TINSFLASH avec MongoDB et moteur IA multi-modèles
// -------------------------
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db.js"; // Connexion MongoDB
import Forecast from "./models/Forecast.js"; // Modèle Forecast

// Import services
import { runSuperForecast } from "./services/superForecast.js";
import { getAlerts, getUserAlerts } from "./services/alertsService.js";
import { generatePodcast } from "./services/podcastService.js";
import { getWeatherIcon, generateCode } from "./services/codesService.js";
import { chatWithJean } from "./services/chatService.js";
import { getRadarLayers } from "./services/radarService.js";

dotenv.config();

// -------------------------
// Initialisation serveur
// -------------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // frontend

// -------------------------
// Connexion MongoDB
// -------------------------
connectDB();

// -------------------------
// 🚀 Supercalculateur météo
// -------------------------
let lastRuns = []; // mémoire locale (backup rapide)

app.post("/api/supercalc/run", async (req, res) => {
  try {
    const { time, country, lat, lon } = req.body;
    const coords = {
      lat: lat || 50.8503,
      lon: lon || 4.3517
    };

    // 🔥 Lancement prévisions multi-modèles IA
    const forecast = await runSuperForecast(coords.lat, coords.lon, country || "BE");

    const runResult = {
      time: time || new Date().toISOString(),
      forecast: forecast.forecast,
      errors: forecast.errors || [],
      status:
        forecast.errors && forecast.errors.length > 0
          ? `⚠️ Run partiel : ${forecast.sources?.length || 0} sources utilisées, ${forecast.errors.length} erreurs`
          : "✅ Run 100% réussi",
    };

    // Sauvegarde en mémoire locale
    lastRuns.push(runResult);
    if (lastRuns.length > 10) lastRuns.shift();

    // Sauvegarde en base MongoDB
    const dbEntry = new Forecast({
      time: runResult.time,
      forecast: runResult.forecast,
      errors: runResult.errors,
      status: runResult.status,
    });
    await dbEntry.save();

    res.json(runResult);
  } catch (err) {
    console.error("❌ Erreur supercalculateur :", err);
    res.status(500).json({ error: "Erreur supercalculateur: " + err.message });
  }
});

app.get("/api/supercalc/logs", async (req, res) => {
  try {
    // Cherche les 10 derniers runs en DB
    const runs = await Forecast.find().sort({ createdAt: -1 }).limit(10);
    res.json(runs);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération logs: " + err.message });
  }
});

// -------------------------
// ROUTES API
// -------------------------

// ✅ Test route
app.get("/", (req, res) => {
  res.send("🚀 TINSFLASH Backend opérationnel avec moteur IA multi-modèles !");
});

// ✅ Prévisions locales
app.get("/api/forecast/local", async (req, res) => {
  try {
    const { lat, lon, country } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude et longitude requises" });
    }
    const forecast = await runSuperForecast(lat, lon, country || "BE");
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Prévisions nationales
app.get("/api/forecast/national", async (req, res) => {
  try {
    const { country } = req.query;
    let coords = { lat: 50.8503, lon: 4.3517 }; // BE par défaut

    if (country === "FR") coords = { lat: 48.8566, lon: 2.3522 };
    if (country === "US") coords = { lat: 38.9072, lon: -77.0369 };

    const forecast = await runSuperForecast(coords.lat, coords.lon, country || "BE");
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Prévisions 7 jours
app.get("/api/forecast/7days", async (req, res) => {
  try {
    const { lat, lon, country } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude et longitude requises" });
    }
    const forecast = await runSuperForecast(lat, lon, country || "BE");

    const now = new Date();
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(now.getDate() + i);

      days.push({
        date: date.toISOString().split("T")[0],
        jour: date.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
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

    res.json({
      source: "TINSFLASH IA + multi-modèles",
      reliability: forecast.forecast.reliability,
      days,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Alertes météo globales
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Alertes météo personnalisées (push)
app.get("/api/alerts/push", async (req, res) => {
  try {
    const { lat, lon, level } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude et longitude requises" });
    }
    const alerts = await getUserAlerts(lat, lon, level || "free");
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Radar interactif
app.get("/api/radar", async (req, res) => {
  try {
    const layers = await getRadarLayers();
    res.json({
      layers,
      tilesUrl:
        "https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/2/1_1.png",
      timestampsUrl: "https://api.rainviewer.com/public/maps.json",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Podcasts météo
app.post("/api/podcast/generate", async (req, res) => {
  try {
    const { type, text } = req.body;
    const podcast = await generatePodcast(type || "daily", text);
    res.json(podcast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Codes promo
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

// ✅ Icône météo
app.get("/api/weather/icon", (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "Code météo requis" });

    const icon = getWeatherIcon(parseInt(code, 10));
    res.json({ code, icon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Chat IA J.E.A.N
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
// Lancement serveur
// -------------------------
app.listen(PORT, () => {
  console.log(`🚀 Serveur TINSFLASH lancé sur le port ${PORT}`);
});
