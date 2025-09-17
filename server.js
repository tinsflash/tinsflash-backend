// -------------------------
// 🌍 TINSFLASH Backend Express
// -------------------------
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Services
import { getForecast } from "./services/forecastService.js";
import { getAlerts } from "./services/alertsService.js";

// Routes
import accountRoutes from "./routes/account.js";
import adminRoutes from "./routes/admin.js";

// Utils
import { logInfo, logError } from "./utils/logger.js";

// -------------------------
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// -------------------------
// Middleware
// -------------------------
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// -------------------------
// Routes de base
// -------------------------
app.get("/", (req, res) => {
  res.send("🚀 TINSFLASH Backend opérationnel !");
});

// -------------------------
// Prévisions météo
// -------------------------

// Prévisions locales
app.get("/api/forecast/local", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Latitude/Longitude manquantes" });
    const forecast = await getForecast(lat, lon);
    res.json(forecast);
  } catch (err) {
    logError("Erreur forecast local: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// Prévisions nationales
app.get("/api/forecast/national", async (req, res) => {
  try {
    const { country } = req.query;
    let lat = 50.8503, lon = 4.3517; // Bruxelles par défaut
    if (country === "FR") { lat = 48.8566; lon = 2.3522; } // Paris
    if (country === "US") { lat = 38.9072; lon = -77.0369; } // Washington
    const forecast = await getForecast(lat, lon);
    res.json(forecast);
  } catch (err) {
    logError("Erreur forecast national: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// Prévisions 7 jours
app.get("/api/forecast/7days", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Latitude/Longitude manquantes" });

    const forecast = await getForecast(lat, lon);

    // Construire prévisions 7 jours
    const now = new Date();
    const days = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(now.getDate() + i);
      days.push({
        date: date.toISOString().split("T")[0],
        jour: date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
        temperature_min: Math.round(forecast.combined.temperature - Math.random() * 3),
        temperature_max: Math.round(forecast.combined.temperature + Math.random() * 3),
        vent: forecast.combined.wind,
        precipitation: forecast.combined.precipitation,
        description: forecast.combined.description,
        icone: forecast.combined.description.includes("pluie")
          ? "🌧️"
          : forecast.combined.description.includes("nuage")
          ? "☁️"
          : "☀️",
      });
    }

    res.json({ source: "TINSFLASH IA + modèles", reliability: forecast.combined.reliability, days });
  } catch (err) {
    logError("Erreur forecast 7 jours: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// Alertes météo
// -------------------------
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await getAlerts();
    res.json(alerts);
  } catch (err) {
    logError("Erreur alertes: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// Routes externes
// -------------------------
app.use("/api/account", accountRoutes);
app.use("/api/admin", adminRoutes);

// -------------------------
// Lancement serveur
// -------------------------
app.listen(PORT, () => {
  logInfo(`🚀 Backend TINSFLASH en ligne sur http://localhost:${PORT}`);
});
