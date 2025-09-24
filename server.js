// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// === Services ===
import superForecast from "./services/superForecast.js";
import forecastService from "./services/forecastService.js";
import alertsService from "./services/alertsService.js";
import radarService from "./services/radarService.js";
import podcastService from "./services/podcastService.js";
import chatService from "./services/chatService.js";

// === Routes ===
import openaiRoutes from "./routes/openai.js";

// === DB Models ===
import Forecast from "./models/Forecast.js";
import Alert from "./models/Alerts.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// === MongoDB connection ===
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ==============================
// 📡 API ROUTES
// ==============================

// Admin – prévisions nationales
app.get("/api/admin/forecasts/latest/:country", async (req, res) => {
  try {
    const forecast = await Forecast.findOne({ country: req.params.country }).sort({ createdAt: -1 });
    if (!forecast) return res.status(404).json({ error: "Pas de prévision disponible" });
    res.json(forecast);
  } catch (err) {
    console.error("❌ Erreur récupération forecast:", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Admin – alertes
app.get("/api/admin/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération alertes" });
  }
});

app.post("/api/admin/alerts", async (req, res) => {
  try {
    const alert = await alertsService.createAlert(req.body);
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: "Erreur création alerte" });
  }
});

app.delete("/api/admin/alerts/:id", async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression alerte" });
  }
});

// SuperForecast – lancement manuel
app.post("/api/admin/superforecast/run", async (req, res) => {
  try {
    const { lat, lon } = req.body;
    const result = await superForecast.runSuperForecast(lat, lon);
    res.json(result);
  } catch (err) {
    console.error("❌ Erreur SuperForecast:", err.message);
    res.status(500).json({ error: "Erreur lancement SuperForecast" });
  }
});

// Chat avec IA J.E.A.N.
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await chatService.askJEAN(message);
    res.json({ reply });
  } catch (err) {
    console.error("❌ Erreur chat JEAN:", err.message);
    res.status(500).json({ error: "Erreur chat IA JEAN" });
  }
});

// Podcast météo (bulletins automatiques)
app.use("/api/openai", openaiRoutes);

// Radar (si déjà implémenté)
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await radarService.getRadarData();
    res.json(radar);
  } catch (err) {
    console.error("❌ Erreur radar:", err.message);
    res.status(500).json({ error: "Erreur récupération radar" });
  }
});

// ==============================
// 🚀 Serveur
// ==============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Serveur Tinsflash lancé sur port ${PORT}`));
