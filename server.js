// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// === Chargement des services ===
import { getForecast, getNationalForecast } from "./services/forecastService.js";
import { runSuperForecast } from "./services/superForecast.js";
import { detectAlerts } from "./services/alertDetector.js";
import { getAlerts } from "./services/alertsService.js";
import { getRadar } from "./services/radarService.js";
import { generateBulletin } from "./services/bulletinService.js";
import { chatWithAI } from "./services/chatService.js";
import { logEvent, getLogs } from "./services/logsService.js";
import { checkCoverage } from "./services/checkCoverage.js";
import { getNews } from "./services/newsService.js";
import { getUsers } from "./services/userService.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// === Correction __dirname pour ES Modules ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Servir les fichiers statiques (index.html, admin-pp.html, etc.) ===
app.use(express.static(path.join(__dirname, "public")));

// === Routes API ===

// Prévisions locales
app.get("/api/localforecast/:lat/:lon", async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const data = await getForecast(lat, lon);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Prévisions nationales
app.get("/api/forecast/:zone", async (req, res) => {
  try {
    const { zone } = req.params;
    const data = await getNationalForecast(zone);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SuperForecast (Run global)
app.post("/api/superforecast", async (req, res) => {
  try {
    const result = await runSuperForecast();
    logEvent("Superforecast lancé");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alertes météo
app.get("/api/alerts/:zone", async (req, res) => {
  try {
    const { zone } = req.params;
    const alerts = await getAlerts(zone);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Radar météo
app.get("/api/radar/:zone", async (req, res) => {
  try {
    const { zone } = req.params;
    const radar = await getRadar(zone);
    res.json(radar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulletin texte
app.get("/api/bulletin/:zone", async (req, res) => {
  try {
    const { zone } = req.params;
    const text = await generateBulletin(zone);
    res.json({ bulletin: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat IA (Cohere pour l’instant)
app.post("/api/chat", async (req, res) => {
  try {
    const { message, zone } = req.body;
    const reply = await chatWithAI(message, zone);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logs moteur
app.get("/api/logs", async (req, res) => {
  try {
    const logs = await getLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check moteur (zones couvertes vs non)
app.get("/api/checkup", async (req, res) => {
  try {
    const status = await checkCoverage();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualités météo
app.get("/api/news", async (req, res) => {
  try {
    const news = await getNews();
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Utilisateurs
app.get("/api/users", async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Démarrage serveur ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur TINSFLASH en marche sur le port ${PORT}`);
});
