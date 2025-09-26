import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Import des services
import { runSuperForecast } from "./services/superForecast.js";
import { getForecast } from "./services/forecastService.js";
import { visionForecast } from "./services/forecastVision.js";
import { detectAlerts } from "./services/alertsEngine.js";
import { getAlerts, saveAlerts } from "./services/alertsService.js";
import { generateBulletin } from "./services/bulletinService.js";
import { generateForecastText } from "./services/textGenService.js";
import { getRadarData } from "./services/radarService.js";
import { askAI } from "./services/aiService.js";
import { saveLog, getLogs } from "./services/logsService.js";
import { checkCoverage } from "./services/checkCoverage.js";
import { fetchNews } from "./services/newsService.js";
import { getUsers, addUser } from "./services/userService.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Fix __dirname dans ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir le frontend (index.html, admin-pp.html, etc.)
app.use(express.static(path.join(__dirname, "public")));


// ==================== ROUTES API ====================

// Prévisions météo
app.get("/api/forecast/:zone", async (req, res) => {
  try {
    const data = await getForecast(req.params.zone);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vision Forecast (optionnel, IA météo étendue)
app.get("/api/forecastvision/:zone", async (req, res) => {
  try {
    const data = await visionForecast(req.params.zone);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Super Forecast (Run global)
app.post("/api/superforecast", async (req, res) => {
  try {
    const result = await runSuperForecast();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alertes météo
app.get("/api/alerts/:zone", async (req, res) => {
  try {
    const alerts = await getAlerts(req.params.zone);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/alerts", async (req, res) => {
  try {
    const result = await saveAlerts(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulletin météo (texte généré)
app.get("/api/bulletin/:zone", async (req, res) => {
  try {
    const bulletin = await generateBulletin(req.params.zone);
    res.json(bulletin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Texte prévisionnel (éditable)
app.post("/api/textforecast", async (req, res) => {
  try {
    const text = await generateForecastText(req.body);
    res.json(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Radar météo
app.get("/api/radar/:zone", async (req, res) => {
  try {
    const radar = await getRadarData(req.params.zone);
    res.json(radar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat IA
app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body;
    const response = await askAI(question);
    res.json(response);
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

app.post("/api/logs", async (req, res) => {
  try {
    const log = await saveLog(req.body);
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check Coverage (zones couvertes / non couvertes)
app.get("/api/checkup", async (req, res) => {
  try {
    const result = await checkCoverage();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualités météo
app.get("/api/news", async (req, res) => {
  try {
    const news = await fetchNews();
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

app.post("/api/users", async (req, res) => {
  try {
    const user = await addUser(req.body);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==================== LANCEMENT ====================
app.listen(PORT, () => {
  console.log(`🚀 Serveur météo en ligne sur http://localhost:${PORT}`);
});
