// -------------------------
// 🌍 server.js
// Backend Express pour TINSFLASH
// -------------------------

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { getForecast } from "./services/forecastService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// -------------------------
// ROUTES API
// -------------------------

// Test route
app.get("/", (req, res) => {
  res.send("🌍 TINSFLASH Backend opérationnel !");
});

// Prévisions locales (position utilisateur)
app.get("/forecast/local", async (req, res) => {
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

// Prévisions nationales (exemple : Belgique par défaut)
app.get("/forecast/national", async (req, res) => {
  try {
    // ⚠️ tu peux remplacer par une logique pays dynamique
    const { country } = req.query;
    let lat = 50.8503; // Bruxelles par défaut
    let lon = 4.3517;

    if (country === "FR") {
      lat = 48.8566;
      lon = 2.3522; // Paris
    }
    if (country === "US") {
      lat = 38.9072;
      lon = -77.0369; // Washington
    }

    const forecast = await getForecast(lat, lon);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alertes météo (placeholder à connecter plus tard)
app.get("/alerts", async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// LANCEMENT SERVEUR
// -------------------------
app.listen(PORT, () => {
  console.log(`🚀 Serveur TINSFLASH en ligne sur http://localhost:${PORT}`);
});
