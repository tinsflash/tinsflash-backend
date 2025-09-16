import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import adminRoutes from "./routes/admin.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ----------------------
// Middleware
// ----------------------
app.use(express.json());
app.use(express.static("public")); // Pour tes fichiers publics (style.css, app.js, etc.)

// ----------------------
// ROUTE - Prévisions météo
// ----------------------
app.get("/forecast", async (req, res) => {
  const { lat, lon } = req.query;
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.SATELLITE_API}`;
    const reply = await fetch(url);
    const data = await reply.json();
    res.json({ source: "OpenWeather", data });
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération prévisions", details: err.message });
  }
})
  app.use("/admin", adminRoutes);
  ;

// ----------------------
// ROUTE - Alertes météo
// ----------------------
app.get("/alerts", async (req, res) => {
  try {
    // Exemple simple OpenWeather (alertes publiques)
    const url = `https://api.openweathermap.org/data/2.5/weather?q=Brussels&appid=${process.env.SATELLITE_API}`;
    const reply = await fetch(url);
    const data = await reply.json();

    // Exemple format maison
    const alerts = [
      {
        id: 1,
        level: "orange",
        type: "vent fort",
        reliability: 92,
        description: "Rafales attendues 90 km/h sur Bruxelles"
      }
    ];

    res.json({ source: "TINSFLASH", alerts, external: data });
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération alertes", details: err.message });
  }
});

// ----------------------
// ROUTE - Radar (simple OpenWeather maps)
// ----------------------
app.get("/radar", (req, res) => {
  const radarUrl = `https://tile.openweathermap.org/map/precipitation_new/2/2/1.png?appid=${process.env.SATELLITE_API}`;
  res.json({ radarUrl });
});

// ----------------------
// ROUTE - Podcasts
// ----------------------
app.get("/podcast/generate", async (req, res) => {
  const type = req.query.type;

  let prompt = "";
  switch (type) {
    case "free-morning": prompt = "Prévision météo nationale simple pour ce matin."; break;
    case "free-evening": prompt = "Prévision météo nationale simple pour ce soir."; break;
    case "premium-morning": prompt = "Prévision météo détaillée (Premium) pour ce matin."; break;
    case "premium-evening": prompt = "Prévision météo détaillée (Premium) pour ce soir."; break;
    case "pro-morning": prompt = "Prévision météo adaptée Pro pour ce matin."; break;
    case "pro-evening": prompt = "Prévision météo adaptée Pro pour ce soir."; break;
    case "proplus-morning": prompt = "Prévision météo Pro+ ultra détaillée pour ce matin."; break;
    case "proplus-evening": prompt = "Prévision météo Pro+ ultra détaillée pour ce soir."; break;
    default: prompt = "Prévision météo générique."; break;
  }

  try {
    const reply = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await reply.json();
    const forecastText = data.choices?.[0]?.message?.content || "Erreur IA";

    res.json({
      type,
      forecast: forecastText,
      audioUrl: `/audio/${type}-${Date.now()}.mp3` // TODO: générer TTS si tu veux
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur génération podcast", details: err.message });
  }
});

// ----------------------
// ROUTE - Codes promos
// ----------------------
app.get("/codes/generate", (req, res) => {
  const type = req.query.type;
  let duration = "10 jours";

  if (type === "proplus") duration = "30 jours";

  const code = `TEST-${type.toUpperCase()}-${Math.random().toString(36).substr(2, 8)}`;

  res.json({
    type,
    code,
    duration,
    status: "Code généré avec succès"
  });
});

// ----------------------
// ROUTE - Chat J.E.A.N
// ----------------------
app.post("/chat", async (req, res) => {
  const msg = req.body.message || "Analyse météo globale";

  try {
    const reply = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: "Tu es J.E.A.N, IA météo scientifique." }, { role: "user", content: msg }]
      })
    });

    const data = await reply.json();
    const answer = data.choices?.[0]?.message?.content || "Erreur IA";

    res.json({ reply: answer });
  } catch (err) {
    res.status(500).json({ error: "Erreur chat IA", details: err.message });
  }
});

// ----------------------
// Lancement serveur
// ----------------------
app.listen(PORT, () => {
  console.log(`🌍 TINSFLASH backend running on http://localhost:${PORT}`);
});

