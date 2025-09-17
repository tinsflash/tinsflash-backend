// -------------------------
// 🚀 Super Serveur Météo
// Express + Services centralisés
// -------------------------
const express = require("express");
const cors = require("cors");
const path = require("path");

// Import centralisé
const services = require("./services");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// -------------------------
// 🌍 API ROUTES
// -------------------------

// ✅ Prévisions météo
app.get("/api/forecast", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat et lon requis" });

    const data = await services.forecast.getForecast(lat, lon);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Alertes météo
app.get("/api/alerts", async (req, res) => {
  try {
    const forecast = await services.forecast.getForecast(50.5, 4.5); // par défaut Belgique
    const alerts = await services.alerts.processAlerts(forecast);
    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Radar
app.get("/api/radar", async (req, res) => {
  try {
    const radar = await services.radar.getRadar();
    res.json({ radarUrl: radar });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Podcast météo
app.get("/api/podcast/generate", async (req, res) => {
  try {
    const { type } = req.query;
    const podcast = await services.podcast.generatePodcast(type || "free");
    res.json(podcast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Chat IA avec J.E.A.N
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await services.chat.chatWithJean(message);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Génération de texte météo
app.post("/api/textgen", async (req, res) => {
  try {
    const { prompt } = req.body;
    const text = await services.text.generateText(prompt);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// 📂 SERVE FRONTEND
// -------------------------
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -------------------------
// 🚀 LANCEMENT SERVEUR
// -------------------------
app.listen(PORT, () => {
  console.log(`🔥 Serveur météo opérationnel sur http://localhost:${PORT}`);
});
