import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import connectDB from "./db.js";
import Forecast from "./models/Forecast.js";

// Import routes
import accountRoutes from "./routes/account.js";
import adminPPRoutes from "./routes/admin-pp.js";
import adminRoutes from "./routes/admin.js";
import adsRoutes from "./routes/ads.js";
import alertsRoutes from "./routes/alerts.js";
import forecastRoutes from "./routes/forecast.js";
import forecastPlusRoutes from "./routes/forecastPlus.js";
import hiddenSourcesRoutes from "./routes/hiddenSources.js";
import openaiRoutes from "./routes/openai.js";
import podcastRoutes from "./routes/podcast.js";
import subscribeRoutes from "./routes/subscribe.js";

// Import services
import { getForecast } from "./services/forecastService.js";

dotenv.config();
connectDB();

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

// Routes
app.use("/api/account", accountRoutes);
app.use("/api/admin-pp", adminPPRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ads", adsRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/forecast", forecastRoutes);
app.use("/api/forecastplus", forecastPlusRoutes);
app.use("/api/hiddensources", hiddenSourcesRoutes);
app.use("/api/openai", openaiRoutes);
app.use("/api/podcast", podcastRoutes);
app.use("/api/subscribe", subscribeRoutes);

// Mémoire locale pour derniers runs
const lastRuns = [];

// Supercalculateur (sécurisé)
app.post("/api/supercalc/run", async (req, res) => {
  try {
    const { time, country } = req.body;
    const coords = { lat: 50.8503, lon: 4.3517 }; // Bruxelles

    const forecast = await getForecast(coords.lat, coords.lon, country || "BE");

    const runResult = {
      time: time || new Date().toISOString(),
      forecast: forecast.combined,
      errors: forecast.errors || [],
      status:
        forecast.errors && forecast.errors.length > 0
          ? `⚠️ Run partiel : ${forecast.successCount} sources OK, ${forecast.errors.length} erreurs`
          : "✅ Run 100% réussi",
    };

    lastRuns.push(runResult);
    if (lastRuns.length > 10) lastRuns.shift();

    // Sauvegarde MongoDB
    try {
      const dbEntry = new Forecast({
        time: runResult.time,
        forecast: runResult.forecast,
        errors: runResult.errors,
        status: runResult.status,
      });
      await dbEntry.save();
    } catch (dbErr) {
      console.error("⚠️ Erreur MongoDB:", dbErr.message);
    }

    res.json(runResult);
  } catch (err) {
    console.error("❌ Erreur supercalc:", err);
    res.status(500).json({ error: "Erreur supercalculateur: " + err.message });
  }
});

// Logs
app.get("/api/supercalc/logs", (req, res) => {
  res.json(lastRuns);
});

// Démarrage
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 TINSFLASH Backend opérationnel sur port ${PORT}`)
);
