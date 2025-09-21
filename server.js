// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Services
import superForecast from "./services/superForecast.js";
import forecastService from "./services/forecastService.js";
import radarService from "./services/radarService.js";
import alertsService from "./services/alertsService.js";
import podcastService from "./services/podcastService.js";
import chatService from "./services/chatService.js";

// Middleware
import checkCoverage from "./services/checkCoverage.js";

// Models
import Forecast from "./models/Forecast.js";
import Alert from "./models/Alert.js";
import User from "./models/User.js"; // modèle pour gérer zones & rôles

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err.message));

/**
 * ROUTES API
 */

// 🔥 Run complet SuperForecast (IA + multi-modèles)
app.post("/api/supercalc/run", async (req, res) => {
  try {
    const { lat, lon } = req.body;
    const result = await superForecast.runFullForecast(lat, lon);
    res.json(result);
  } catch (err) {
    console.error("❌ Erreur supercalc/run:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📡 Forecast local
app.get("/api/forecast/local", checkCoverage, async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await forecastService.getLocalForecast(lat, lon);
    res.json(data);
  } catch (err) {
    console.error("❌ Erreur forecast/local:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📡 Forecast national
app.get("/api/forecast/national", checkCoverage, async (req, res) => {
  try {
    const { country } = req.query;
    const data = await forecastService.getNationalForecast(country);
    res.json(data);
  } catch (err) {
    console.error("❌ Erreur forecast/national:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📡 Forecast 7 jours
app.get("/api/forecast/7days", checkCoverage, async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await forecastService.get7DayForecast(lat, lon);
    res.json(data);
  } catch (err) {
    console.error("❌ Erreur forecast/7days:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🌍 Radar météo (pluie, neige, vent)
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await radarService.getRadar();
    res.json(radar);
  } catch (err) {
    console.error("❌ Erreur radar:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ⚠️ Alertes météo
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await alertsService.getAlerts();
    res.json(alerts);
  } catch (err) {
    console.error("❌ Erreur alerts:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/alerts", async (req, res) => {
  try {
    const alert = await alertsService.addAlert(req.body);
    res.json(alert);
  } catch (err) {
    console.error("❌ Erreur ajout alerte:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/alerts/:id", async (req, res) => {
  try {
    const result = await alertsService.deleteAlert(req.params.id);
    res.json(result);
  } catch (err) {
    console.error("❌ Erreur suppression alerte:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🎙 Podcasts météo
app.post("/api/podcast/generate", async (req, res) => {
  try {
    const { text } = req.body;
    const file = await podcastService.generatePodcast(text);
    res.json(file);
  } catch (err) {
    console.error("❌ Erreur podcast:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🤖 JEAN (IA météo explicative)
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const response = await chatService.askJean(message);
    res.json(response);
  } catch (err) {
    console.error("❌ Erreur chat:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ADMIN PRO+
 */

// 🚀 Run batch complet (depuis admin-pp bouton)
app.post("/api/admin/runBatch", async (req, res) => {
  try {
    console.log("🚀 Run batch lancé manuellement depuis admin");
    const zones = [
      { lat: 50.5, lon: 4.7, name: "Europe" },
      { lat: 40.7, lon: -74.0, name: "USA" }
    ];

    const results = [];
    for (const z of zones) {
      const result = await superForecast.runFullForecast(z.lat, z.lon);
      results.push({ zone: z.name, ...result });
    }

    res.json({ success: true, results });
  } catch (err) {
    console.error("❌ Erreur runBatch:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ⚠️ Alertes en attente (70–89 %)
app.get("/api/admin/alerts/pending", async (req, res) => {
  try {
    const alerts = await Alert.find({
      confidence: { $gte: 70, $lt: 90 },
      validated: false
    });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Validation manuelle d’alerte
app.put("/api/admin/alerts/validate/:id", async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { validated: true },
      { new: true }
    );
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👥 Statistiques utilisateurs par zones
app.get("/api/admin/users/zones", async (req, res) => {
  try {
    const users = await User.find();

    const stats = {
      covered: { free: 0, premium: 0, pro: 0, proPlus: 0 },
      nonCovered: { free: 0, premium: 0, pro: 0, proPlus: 0 }
    };

    users.forEach((u) => {
      const isCovered = ["europe", "usa"].includes(u.zone?.toLowerCase());
      const target = isCovered ? stats.covered : stats.nonCovered;

      if (u.role === "free") target.free++;
      if (u.role === "premium") target.premium++;
      if (u.role === "pro") target.pro++;
      if (u.role === "proplus") target.proPlus++;
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📊 Statistiques globales
app.get("/api/admin/stats", async (req, res) => {
  try {
    const forecasts = await Forecast.countDocuments();
    const alerts = await Alert.countDocuments();
    res.json({
      forecasts,
      alerts,
      uptime: process.uptime()
    });
  } catch (err) {
    console.error("❌ Erreur admin/stats:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🚀 Lancement serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 Serveur météo Tinsflash en marche sur port ${PORT}`);
});
