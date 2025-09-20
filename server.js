// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import { runSuperForecast } from "./src/services/superForecast.js";
import Forecast from "./src/models/Forecast.js";
import Alert from "./src/models/Alerts.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ✅ Connexion MongoDB
mongoose
  .connect(process.env.MONGO_URI, { dbName: "tinsflash" })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error("❌ MongoDB erreur:", err));

// --- ROUTES ---

// 🔹 Lancer un run météo
app.post("/api/supercalc/run", async (req, res) => {
  try {
    const { location } = req.body;
    const forecast = await runSuperForecast(location || "Bruxelles");
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Obtenir le dernier run
app.get("/api/forecast/latest", async (req, res) => {
  try {
    const forecast = await Forecast.findOne().sort({ runAt: -1 });
    if (!forecast) return res.status(404).json({ error: "Aucune prévision disponible" });
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Obtenir tous les runs sauvegardés
app.get("/api/forecast/logs", async (req, res) => {
  try {
    const logs = await Forecast.find().sort({ runAt: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Alertes météo
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- LANCEMENT SERVEUR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur TINSFLASH lancé sur http://localhost:${PORT}`));
