import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import adminRoutes from "./routes/admin.js";
import path from "path";
import { fileURLToPath } from "url";

// Import services
import { getForecast } from "./services/forecastService.js";
import { getAlerts } from "./services/alertsService.js";
import { generatePodcast } from "./services/podcastService.js";
import { generateCode } from "./services/codesService.js";
import { chatWithJean } from "./services/chatService.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ----------------------
// Middleware
// ----------------------
app.use(express.json());
app.use(express.static("public")); // Pour tes fichiers publics (style.css, app.js, etc.)

app.get("/forecast", async (req, res) => {
  const { lat, lon } = req.query;
  try {
    if (!lat || !lon) {
      return res.status(400).json({ error: "Paramètres lat/lon requis" });
    }
    const forecast = await getForecast(lat, lon);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/alerts", async (req, res) => {
  try {
    const alerts = await getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------
// ROUTE RADAR (simple redirection)
// ----------------------
app.get("/radar", (req, res) => {
  const radarUrl = `https://tile.openweathermap.org/map/precipitation_new/2/2/1.png?appid=${process.env.OPENWEATHER_KEY}`;
  res.json({ radarUrl });
});

// ----------------------
// ROUTES PODCASTS
// ----------------------
app.get("/podcast/generate", async (req, res) => {
  const { type } = req.query;
  try {
    if (!type) return res.status(400).json({ error: "Type de podcast requis" });
    const podcast = await generatePodcast(type);
    res.json(podcast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------
// ROUTES CODES PROMO
// ----------------------
app.get("/codes/generate", (req, res) => {
  const { type } = req.query;
  if (!type) return res.status(400).json({ error: "Type d’abonnement requis" });

  const code = generateCode(type);
  res.json(code);
});

// ----------------------
// ROUTE CHAT J.E.A.N
// ----------------------
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  try {
    const reply = await chatWithJean(message);
    res.json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------
// LANCEMENT SERVEUR
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 TINSFLASH backend en ligne sur http://localhost:${PORT}`);
});
