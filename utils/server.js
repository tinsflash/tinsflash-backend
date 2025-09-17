// -------------------------
// 🌍 server.js
// Backend Express pour TINSFLASH
// -------------------------
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { getForecast } from "./services/forecastService.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// -------------------------
// Gestion du chemin absolu
// -------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------------
// Servir les fichiers statiques (public/)
// -------------------------
app.use(express.static(path.join(__dirname, "public")));

// -------------------------
// ROUTES API
// -------------------------
// Test route
app.get("/api", (req, res) => {
  res.send("🌍 TINSFLASH Backend opérationnel !");
});

// Prévisions locales (position utilisateur)
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

// Prévisions nationales
app.get("/api/forecast/national", async (req, res) => {
  try {
    const { country } = req.query;
    let lat = 50.8503; // Bruxelles par défaut
    let lon = 4.3517;

    if (country === "FR") {
      lat = 48.8566;
      lon = 2.3522;
    }
    if (country === "US") {
      lat = 38.9072;
      lon = -77.0369;
    }

    const forecast = await getForecast(lat, lon);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alertes météo
app.get("/api/alerts", (req, res) => {
  res.json({
    alerts: [
      {
        region: "Europe",
        type: "orage violent",
        level: "orange",
        reliability: 88,
        source: "IA.J.E.A.N",
      },
    ],
  });
});

// Prévisions 7 jours
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

    res.json({
      source: "TINSFLASH IA + modèles",
      reliability: forecast.combined.reliability,
      days,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// Route par défaut → index.html
// -------------------------
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -------------------------
// LANCEMENT SERVEUR
// -------------------------
app.listen(PORT, () => {
  console.log(`🚀 Serveur TINSFLASH en ligne sur http://localhost:${PORT}`);
});
