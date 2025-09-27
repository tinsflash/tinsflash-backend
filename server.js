// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// === Services internes ===
import { getActiveAlerts } from "./services/alertsService.js";
import generateBulletin from "./services/bulletinService.js";
import { addLog, getLogs } from "./services/adminLogs.js";
import checkCoverage from "./services/checkCoverage.js";
import { getWeatherIcon, generateCode } from "./services/codesService.js";
import aiRouter from "./services/aiRouter.js";

// === Services météo ===
import forecastService from "./services/forecastService.js";
import runSuperForecast from "./services/superForecast.js";
import { radarHandler } from "./services/radarService.js";
import { getNews } from "./services/newsService.js";
import { getUserStats } from "./services/userService.js";

// === AJOUTS: moteur global & journal ===
import runGlobal from "./services/runGlobal.js";
import { getEngineState, saveEngineState } from "./services/engineState.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// === Correction __dirname pour ES Modules ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Fichiers statiques ===
app.use(express.static(path.join(__dirname, "public")));

// ==========================
// ROUTES API
// ==========================

// 🌍 Prévisions locales
app.get("/api/localforecast/:lat/:lon/:country?", async (req, res) => {
  try {
    const { lat, lon, country } = req.params;
    const data = await forecastService.getLocalForecast(lat, lon, country);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🌐 Prévisions nationales
app.get("/api/forecast/:country", async (req, res) => {
  try {
    const { country } = req.params;
    const data = await forecastService.getForecast(country);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚀 SuperForecast (par point)
app.post("/api/superforecast", async (req, res) => {
  try {
    const { lat, lon, country } = req.body;
    const result = await runSuperForecast({ lat, lon, country });
    addLog("Superforecast lancé");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚀🚀 RUN GLOBAL
app.post("/api/run-global", async (req, res) => {
  try {
    const report = await runGlobal();
    addLog("RUN GLOBAL terminé");
    res.json(report);
  } catch (err) {
    addLog(`RUN GLOBAL erreur: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// 🧠 Journal moteur
app.get("/api/engine-state", (req, res) => {
  try {
    res.json(getEngineState());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔔 Alertes météo
app.get("/api/alerts", async (req, res) => {
  try {
    const data = await getActiveAlerts();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🚨 Action sur alertes
app.post("/api/alerts/action", (req, res) => {
  try {
    const { index, action } = req.body;
    const state = getEngineState();
    const alerts = state.alertsList || [];

    if (!alerts[index]) return res.status(404).json({ status: "Alerte introuvable" });

    if (action === "validate") alerts[index].reliability = 95;
    if (action === "expert") alerts[index].tag = "expert";
    if (action === "wait") alerts[index].tag = "wait";

    saveEngineState({ ...state, alertsList: alerts });
    res.json({ status: `Action ${action} appliquée` });
  } catch (err) {
    res.status(500).json({ status: "Erreur", error: err.message });
  }
});

// 📡 Radar météo
app.get("/api/radar/:zone", async (req, res) => {
  try {
    const { zone } = req.params;
    const radar = await radarHandler(zone);
    res.json(radar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📰 Bulletin météo
app.get("/api/bulletin/:zone", async (req, res) => {
  try {
    const { zone } = req.params;
    const result = await generateBulletin(zone);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🤖 Chat IA
app.use("/api/chat", aiRouter);

// 🗂️ Logs
app.get("/api/logs", (req, res) => {
  try {
    res.json(getLogs());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Couverture
app.get("/api/checkup/:zone?", checkCoverage, (req, res) => {
  res.json(req.coverage);
});

// 📰 Actualités météo
app.get("/api/news", async (req, res) => {
  try {
    const news = await getNews();
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👥 Utilisateurs
app.get("/api/users", async (req, res) => {
  try {
    const stats = await getUserStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🎟️ Codes promo
app.get("/api/codes/:type", (req, res) => {
  try {
    const { type } = req.params;
    res.json(generateCode(type));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔒 Alias admin
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-pp.html"));
});

// ==========================
// DÉMARRAGE SERVEUR
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur TINSFLASH en marche sur le port ${PORT}`);
});
