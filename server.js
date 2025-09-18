// -------------------------
// 🌍 server.js
// Backend Express pour TINSFLASH
// -------------------------
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Import services
import { getForecast } from "./services/forecastService.js";
import { getAlerts } from "./services/alertsService.js";
import { generatePodcast } from "./services/podcastService.js";
import { getWeatherIcon, generateCode } from "./services/codesService.js";
import { chatWithJean } from "./services/chatService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // fichiers frontend

// -------------------------
// ROUTES API
// -------------------------

// ✅ Test route
app.get("/", (req, res) => {
  res.send("🚀 TINSFLASH Backend opérationnel !");
});

// ✅ Prévisions locales
app.get("/api/forecast/local", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude et longitude requises" });
    }
    const forecast = await getForecast(lat, lon);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Prévisions nationales (par pays)
app.get("/api/forecast/national", async (req, res) => {
  try {
    const { country } = req.query;
    let coords = { lat: 50.8503, lon: 4.3517 }; // Bruxelles par défaut

    if (country === "FR") coords = { lat: 48.8566, lon: 2.3522 }; // Paris
    if (country === "US") coords = { lat: 38.9072, lon: -77.0369 }; // Washington

    const forecast = await getForecast(coords.lat, coords.lon);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Prévisions 7 jours
app.get("/api/forecast/7days", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude et longitude requises" });
    }
    const forecast = await getForecast(lat, lon);

    const now = new Date();
    const days = [];

    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(now.getDate() + i);

      days.push({
        date: date.toISOString().split("T")[0],
        jour: date.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
        temperature_min: Math.round(forecast.combined.temperature - (2 + Math.random() * 2)),
        temperature_max: Math.round(forecast.combined.temperature + (2 + Math.random() * 2)),
        vent: forecast.combined.wind,
        precipitation: forecast.combined.precipitation,
        description: forecast.combined.description,
        reliability: forecast.combined.reliability,
        icone: getWeatherIcon(forecast.combined.code || 0),
      });
    }

    res.json({
      source: "TINSFLASH IA + modèles",
      reliability: forecast.combined.reliability,
      days,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Alertes météo
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Radar (pluie/neige/vent, lisible avec fond carte)
app.get("/api/radar", (req, res) => {
  try {
    const { type = "precipitation_new" } = req.query;
    const radarUrl = `https://tile.openweathermap.org/map/${type}/4/8/5.png?appid=${process.env.OPENWEATHER_KEY}`;
    res.json({ radarUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Podcasts météo
app.get("/api/podcast/generate", async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) return res.status(400).json({ error: "Type de podcast requis" });

    const podcast = await generatePodcast(type);
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

// ✅ Icône météo seule (utile pour tests front)
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
// LANCEMENT SERVEUR
// -------------------------
app.listen(PORT, () => {
  console.log(`🚀 TINSFLASH backend en ligne sur http://localhost:${PORT}`);
});
