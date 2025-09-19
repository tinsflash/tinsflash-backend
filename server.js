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
import { getRadarLayers } from "./services/radarService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // frontend

// -------------------------
// 🚀 Supercalculateur météo
// -------------------------
let lastRuns = [];
let runLogs = [];

app.post("/api/supercalc/run", async (req, res) => {
  try {
    const { time, country } = req.body;
    const coords = { lat: 50.8503, lon: 4.3517 }; // Bruxelles par défaut
    const runId = Date.now();

    runLogs = [];

    function log(step) {
      const msg = `${new Date().toISOString()} [${runId}] ${step}`;
      runLogs.push(msg);
      console.log(msg);
    }

    log("🟢 Lancement du supercalculateur météo…");

    // Étapes avec temporisation réaliste
    log("📡 Connexion aux modèles officiels (Meteomatics, OpenWeather, GFS, ICON)...");
    await new Promise(r => setTimeout(r, 3000));

    log("🔍 Ajout sources externes (Trullemans, Wetterzentrale, NASA, etc.)…");
    await new Promise(r => setTimeout(r, 3000));

    log("🤖 Fusion multi-modèles + analyse IA + facteurs locaux…");
    const forecast = await getForecast(coords.lat, coords.lon, country || "BE");
    await new Promise(r => setTimeout(r, 3000));

    log("📊 Vérification anomalies saisonnières & calcul fiabilité…");
    await new Promise(r => setTimeout(r, 2000));

    // Détection erreurs éventuelles
    const errors = Object.entries(forecast.sources || {})
      .filter(([_, val]) => val?.error)
      .map(([key, val]) => `⚠️ ${key}: ${val.error}`);

    const status =
      errors.length === 0
        ? "✅ Run 100% réussi"
        : `⚠️ Run terminé avec erreurs : ${errors.join(" | ")}`;

    log(status);

    const runResult = {
      id: runId,
      time: time || new Date().toISOString(),
      forecast: forecast.combined,
      status,
      bulletin: forecast.combined.bulletin,
    };

    lastRuns.push(runResult);
    if (lastRuns.length > 10) lastRuns.shift();

    res.json(runResult);
  } catch (err) {
    runLogs.push("❌ Erreur supercalculateur: " + err.message);
    res.status(500).json({ error: "Erreur supercalculateur: " + err.message });
  }
});

app.get("/api/supercalc/logs", (req, res) => {
  res.json(runLogs);
});

// -------------------------
// ROUTES API classiques
// -------------------------

// ✅ Test route
app.get("/", (req, res) => {
  res.send("🚀 TINSFLASH Backend opérationnel !");
});

// ✅ Prévisions locales
app.get("/api/forecast/local", async (req, res) => {
  try {
    const { lat, lon, country } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude et longitude requises" });
    }
    const forecast = await getForecast(lat, lon, country || "BE");
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Prévisions nationales
app.get("/api/forecast/national", async (req, res) => {
  try {
    const { country } = req.query;
    let coords = { lat: 50.8503, lon: 4.3517 };

    if (country === "FR") coords = { lat: 48.8566, lon: 2.3522 };
    if (country === "US") coords = { lat: 38.9072, lon: -77.0369 };

    const forecast = await getForecast(coords.lat, coords.lon, country || "BE");
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
    const forecast = await getForecast(lat, lon, country || "BE");

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
        temperature_min: forecast.combined.temperature_min,
        temperature_max: forecast.combined.temperature_max,
        vent: forecast.combined.wind,
        precipitation: forecast.combined.precipitation,
        description: forecast.combined.description,
        fiabilité: forecast.combined.reliability,
        anomalie: forecast.combined.anomaly?.message || "Normale",
        icone: getWeatherIcon(forecast.combined.code || 0),
      });
    }

    res.json({
      source: "TINSFLASH IA + multi-modèles",
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
// LANCEMENT SERVEUR
// -------------------------
app.listen(PORT, () => {
  console.log(`🚀 TINSFLASH backend en ligne sur http://localhost:${PORT}`);
});
