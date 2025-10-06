// PATH: server.js
// 🧠 TINSFLASH Meteorological Nuclear Core – Serveur principal connecté

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// === Services ===
import { runGlobal } from "./services/runGlobal.js";
import * as engineStateService from "./services/engineState.js";
import * as adminLogs from "./services/adminLogs.js";
import * as chatService from "./services/chatService.js";
import * as alertsService from "./services/alertsService.js";
import { checkSourcesFreshness } from "./services/sourcesFreshness.js";
import { askCohere } from "./services/cohereService.js";
import * as userService from "./services/userService.js";
import { runEvolution } from "./services/evolution.js"; // ♻️ suivi auto des alertes
import Alert from "./models/Alert.js"; // base Mongo pour alertes

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// === DATABASE ===
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
}

// === PAGE ACCUEIL ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// === RUN GLOBAL ===
app.post("/api/run-global", async (req, res) => {
  try {
    await checkSourcesFreshness();
    const { zone } = req.body;
    const result = await runGlobal(zone || "All");
    res.json({ success: true, result });
  } catch (e) {
    console.error("❌ Erreur run-global:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// === STATUS MOTEUR ===
app.get("/api/status", async (req, res) => {
  try {
    const state = await engineStateService.getEngineState();
    res.json({
      status: state?.checkup?.engineStatus || "IDLE",
      lastRun: state?.lastRun,
      models: state?.checkup?.models || "unknown",
      steps: state?.checkup || {},
      alerts: state?.alertsLocal || [],
      alertsCount: state?.alertsLocal?.length || 0,
      forecasts: state?.forecastsContinental || {},
      finalReport: state?.finalReport || {},
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// === ALERTES (complètes depuis DB ou engineState) ===
app.get("/api/alerts", async (_, res) => {
  try {
    const list = await Alert.find().sort({ createdAt: -1 }).limit(500);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === RÉSUMÉ DES ALERTES ===
app.get("/api/alerts/summary", async (_, res) => {
  try {
    const all = await Alert.find();
    const summary = {
      total: all.length,
      byStatus: {
        published: all.filter(a => a.certainty >= 90).length,
        toValidate: all.filter(a => a.certainty >= 70 && a.certainty < 90).length,
        "under-surveillance": all.filter(a => a.certainty >= 50 && a.certainty < 70).length,
        archived: all.filter(a => a.certainty < 50).length,
      },
      exclusives: all.filter(a => a.status === "✅ Premier détecteur").length,
      confirmedElsewhere: all.filter(a => a.status === "⚠️ Déjà signalé").length,
    };
    res.json(summary);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === EXPORT PREMIUM NASA / GOVERNMENT ===
app.post("/api/alerts/export", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "ID requis" });
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ error: "Alerte introuvable" });

    // Vérifie premium
    if (alert.status !== "✅ Premier détecteur" || alert.certainty < 70) {
      return res.status(403).json({ error: "Alerte non éligible export premium" });
    }

    const payload = {
      id: alert._id,
      country: alert.country,
      title: alert.title,
      description: alert.description,
      issuedAt: alert.issuedAt,
      certainty: alert.certainty,
      source: alert.source,
      severity: alert.severity,
    };

    // (Ici tu pourras plus tard envoyer via API officielle NASA / WMO)
    console.log("🚀 Export NASA/GOV:", payload);
    res.json({ success: true, message: "Export simulé (console)" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === MISE À JOUR D’UNE ALERTE (validation manuelle admin) ===
app.post("/api/alerts/:id/:action", async (req, res) => {
  try {
    const { id, action } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ error: "Alerte introuvable" });

    if (action === "published") alert.certainty = 95;
    if (action === "under-surveillance") alert.certainty = 60;
    if (action === "pending") alert.certainty = 75;

    await alert.save();
    res.json({ success: true, updated: alert });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === MISE À JOUR AUTOMATIQUE (évolution) ===
app.post("/api/evolution/run", async (_, res) => {
  try {
    const evo = await runEvolution();
    res.json({ success: true, evolution: evo });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === NEWS MÉTÉO ===
app.get("/api/news", async (_, res) => {
  try {
    const news = await alertsService.getNewsFeed();
    res.json(news);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === LOGS SSE ===
app.get("/api/logs/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  adminLogs.registerClient(res);
  const logs = await adminLogs.getLogs("current");
  if (logs?.length) logs.forEach((l) => res.write(`data: ${JSON.stringify(l)}\n\n`));
  req.on("close", () => console.log("❌ Client SSE déconnecté"));
});

// === CHAT PUBLIC J.E.A.N (Cohere) ===
app.post("/api/jean", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: "❌ Message manquant" });
    const { reply, avatar } = await askCohere(message);
    res.json({ reply, avatar });
  } catch (e) {
    res.status(500).json({ reply: "⚠️ Erreur interne", avatar: "default" });
  }
});

// === CHAT MOTEUR (GPT-5) ===
app.post("/api/chat-engine", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: "❌ Message manquant" });
    const reply = await chatService.askAIEngine(message);
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ reply: "⚠️ Erreur moteur: " + e.message });
  }
});

// === CHAT CONSOLE ADMIN (GPT-3.5) ===
app.post("/api/chat-admin", async (req, res) => {
  try {
    const { message, mode } = req.body;
    if (!message) return res.status(400).json({ reply: "❌ Message manquant" });
    const reply = await chatService.askAIAdmin(message, mode || "moteur");
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ reply: "⚠️ Erreur chat admin: " + e.message });
  }
});

// === INSCRIPTION FAN CLUB ===
app.post("/api/register-fan", async (req, res) => {
  try {
    const { email, geo } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Email requis" });

    const user = await userService.registerUser({
      email,
      zone: geo || "unknown",
      type: "Free",
    });

    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// === PAGES ADMIN (protégées, invisibles) ===
app.get("/admin", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-pp.html"))
);
app.get("/admin-alerts", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-alerts.html"))
);

// === LANCEMENT SERVEUR ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 TINSFLASH Server operational on port ${PORT}`));
