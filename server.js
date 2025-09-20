import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { runSuperForecast } from "./services/superForecast.js";
import alertsService from "./services/alertsService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch(err => console.error("❌ Erreur MongoDB:", err));

// Route API classique
app.post("/api/supercalc/run", async (req, res) => {
  try {
    const forecast = await runSuperForecast();
    res.json({ success: true, forecast });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route SSE pour le suivi en temps réel
app.get("/api/supercalc/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const forecast = await runSuperForecast((step, msg, progress) => {
      send({ type: "log", message: msg });
      send({ type: "progress", value: progress, message: step });
    });

    send({ type: "done", message: "✅ Run terminé", forecast });
    res.end();
  } catch (err) {
    send({ type: "error", message: err.message });
    res.end();
  }
});

// Alertes
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await alertsService.getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pages admin
app.get("/admin-pp", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-pp.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
