// ==========================================================
// 🌍 TINSFLASH – Central Meteorological Engine (Everest Protocol v1.3 PRO++)
// 100 % réel – IA J.E.A.N. (GPT-5 moteur / GPT-4o-mini console)
// ==========================================================

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import axios from "axios";

// === Moteur interne & IA ===
import { runGlobal } from "./services/runGlobal.js";
import { runAIAnalysis } from "./services/aiAnalysis.js";
import {
  initEngineState,
  getEngineState,
  addEngineLog,
  addEngineError,
  engineEvents,
} from "./services/engineState.js";
import { enumerateCoveredPoints } from "./services/zonesCovered.js";
import { checkSourcesFreshness } from "./services/sourcesFreshness.js";
import Alert from "./models/Alert.js";
import { askCohere } from "./services/cohereService.js";
import * as chatService from "./services/chatService.js";

// ==========================================================
// 🧩 Initialisation
// ==========================================================
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
await initEngineState();

// ==========================================================
// 🌐 CORS global
// ==========================================================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ==========================================================
// 📁 Fichiers statiques
// ==========================================================
app.use(express.static(path.join(__dirname, "public")));
["avatars", "videos", "assets", "demo"].forEach((dir) =>
  app.use(`/${dir}`, express.static(path.join(__dirname, `public/${dir}`)))
);

// ==========================================================
// 🧠 Correctif MIME – Three.js & OrbitControls
// ==========================================================
app.get("/three.module.js", async (_, res) => {
  try {
    const r = await fetch("https://unpkg.com/three@0.161.0/build/three.module.js");
    res.type("application/javascript").send(await r.text());
  } catch (err) {
    res.status(500).send("// erreur module three.js");
  }
});
app.get("/OrbitControls.js", async (_, res) => {
  try {
    const r = await fetch("https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js");
    res.type("application/javascript").send(await r.text());
  } catch (err) {
    res.status(500).send("// erreur module OrbitControls");
  }
});

// ==========================================================
// 🔌 MongoDB
// ==========================================================
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connecté"))
    .catch((err) => console.error("❌ Erreur MongoDB :", err.message));
} else console.error("⚠️ MONGO_URI manquant dans .env");

// ==========================================================
// 🌍 Index public
// ==========================================================
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// ==========================================================
// 🌤️ Démo publique météo 3D
// ==========================================================
app.get("/demo/meteo3d-proplus.html", (_, res) =>
  res.sendFile(path.join(__dirname, "public/demo/meteo3d-proplus.html"))
);

// ==========================================================
// 🚀 Extraction réelle
// ==========================================================
app.post("/api/run-global", async (req, res) => {
  try {
    await checkSourcesFreshness();
    const zone = req.body?.zone || "All";
    const result = await runGlobal(zone);
    await addEngineLog(`⚙️ Extraction complète effectuée pour ${zone}`, "success", "runGlobal");
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError(`❌ Erreur extraction: ${e.message}`, "runGlobal");
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🧠 Analyse IA J.E.A.N.
// ==========================================================
app.post("/api/ai-analyse", async (_, res) => {
  try {
    const r = await runAIAnalysis();
    await addEngineLog("🧠 Analyse IA J.E.A.N terminée avec succès", "success", "IA");
    res.json({ success: true, result: r });
  } catch (e) {
    await addEngineError(`Erreur IA J.E.A.N: ${e.message}`, "IA");
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 📊 Statut moteur
// ==========================================================
app.get("/api/status", async (_, res) => {
  try {
    const state = await getEngineState();
    res.json({
      status: state?.checkup?.engineStatus || state?.status || "IDLE",
      lastRun: state?.lastRun,
      models: state?.checkup?.models || {},
      alerts: state?.alertsLocal || [],
      partialReport: state?.partialReport || null,
      finalReport: state?.finalReport || null,
      errors: state?.errors || [],
      coveredZones: enumerateCoveredPoints(),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 💬 IA publique Cohere
// ==========================================================
app.post("/api/cohere", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Question invalide" });
    const { reply, avatar } = await askCohere(question);
    await addEngineLog(`💬 Question publique: "${question}"`, "info", "Cohere");
    res.json({ success: true, reply, avatar: `/avatars/jean-${avatar}.png` });
  } catch (err) {
    await addEngineError(`Erreur Cohere: ${err.message}`, "Cohere");
    res.status(500).json({ success: false, reply: "Erreur interne J.E.A.N." });
  }
});

// ==========================================================
// 💬 IA console admin
// ==========================================================
app.post("/api/ai-admin", async (req, res) => {
  try {
    const { message, mode } = req.body;
    if (!message) return res.status(400).json({ success: false, error: "Message vide" });
    const reply = await chatService.askAIAdmin(message, mode || "moteur");
    await addEngineLog(`💬 Console admin (${mode}) : "${message}"`, "info", "admin");
    res.json({ success: true, reply });
  } catch (e) {
    await addEngineError(`Erreur IA admin: ${e.message}`, "admin");
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🌋 Alertes – Everest Protocol
// ==========================================================
app.get("/api/alerts", async (_, res) => {
  try {
    const alerts = await Alert.find().sort({ certainty: -1 });
    res.json(alerts);
  } catch (e) {
    await addEngineError(`Erreur récupération alertes: ${e.message}`, "alerts");
    res.status(500).json({ success: false, error: e.message });
  }
});
app.put("/api/alerts/status/:id", async (req, res) => {
  try {
    await Alert.findByIdAndUpdate(req.params.id, { status: req.body.action });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});
app.post("/api/alerts/export/:id", async (req, res) => {
  await addEngineLog(`🚨 Alerte ${req.params.id} publiée`, "info", "alerts");
  res.json({ ok: true });
});
app.delete("/api/alerts/:id", async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ==========================================================
// 📡 Flux SSE – Logs moteur (temps réel)
// ==========================================================
app.get("/api/logs/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const send = (log) => res.write(`data: ${JSON.stringify(log)}\n\n`);
  engineEvents.on("log", send);
  const ping = setInterval(() => res.write(`: ping\n\n`), 20000);
  req.on("close", () => {
    clearInterval(ping);
    engineEvents.off("log", send);
  });
});

// ==========================================================
// 🧭 Pages admin protégées
// ==========================================================
[
  "admin-pp.html",
  "admin-alerts.html",
  "admin-chat.html",
  "admin-index.html",
  "admin-radar.html",
  "admin-users.html",
].forEach((page) =>
  app.get(`/${page}`, (_, res) => res.sendFile(path.join(__dirname, "public", page)))
);

// ==========================================================
// 🚀 Lancement
// ==========================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`⚡ TINSFLASH PRO++ prêt sur port ${PORT}`);
  console.log("🌍 Zones couvertes :", enumerateCoveredPoints().length);
});
