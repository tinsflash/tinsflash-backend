// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v2.6 PRO++)
// ==========================================================

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import axios from "axios";
import fs from "fs";
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

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
await initEngineState();

// ==========================================================
// 🌐 CORS
// ==========================================================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
    .catch((e) => console.error("❌ Erreur MongoDB:", e.message));
}

// ==========================================================
// 🚀 RUN GLOBAL
// ==========================================================
app.post("/api/run-global", async (req, res) => {
  try {
    await checkSourcesFreshness();
    const zone = req.body?.zone || "All";
    const r = await runGlobal(zone);
    await addEngineLog(
      `⚙️ Extraction complète effectuée pour ${zone}`,
      "success",
      "runGlobal"
    );
    res.json({ success: true, result: r });
  } catch (e) {
    await addEngineError(`Erreur extraction: ${e.message}`, "runGlobal");
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🧠 ANALYSE IA J.E.A.N. (phase 2 moteur)
// ==========================================================
app.post("/api/ai-analyse", async (req, res) => {
  try {
    await addEngineLog("🧠 Lancement IA J.E.A.N. – Analyse en cours...", "info", "IA.JEAN");
    const result = await runAIAnalysis(); // fonction déjà importée, inchangée
    await addEngineLog("✅ IA J.E.A.N. – Analyse terminée avec succès", "success", "IA.JEAN");
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError(`Erreur IA J.E.A.N. : ${e.message}`, "IA.JEAN");
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 📊 STATUS MOTEUR
// ==========================================================
app.get("/api/status", async (_, res) => {
  try {
    const s = await getEngineState();
    res.json({
      status: s?.checkup?.engineStatus || s?.status || "IDLE",
      lastRun: s?.lastRun,
      errors: s?.errors || [],
      coveredZones: enumerateCoveredPoints(),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 📡 LOGS SSE
// ==========================================================
app.get("/api/logs/stream", (req, res) => {
  console.log("🌐 Flux SSE connecté depuis console admin...");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const send = (l) => res.write(`data: ${JSON.stringify(l)}\n\n`);
  engineEvents.on("log", send);
  const ping = setInterval(() => res.write(": ping\n\n"), 20000);
  req.on("close", () => {
    clearInterval(ping);
    engineEvents.off("log", send);
  });
});

// ==========================================================
// ⚡ ALERTES IA (lecture directe pour intégration)
// ==========================================================
app.get("/api/alerts", async (_, res) => {
  try {
    const alerts = await Alert.find().lean();
    res.json(alerts || []);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🧭 PAGES ADMIN
// ==========================================================
[
  "admin-pp.html",
  "admin-alerts.html",
  "admin-chat.html",
  "admin-index.html",
  "admin-radar.html",
  "admin-users.html",
].forEach((p) =>
  app.get(`/${p}`, (_, res) =>
    res.sendFile(path.join(__dirname, "public", p))
  )
);

// ==========================================================
// 📁 STATIC FILES (APRÈS les routes API !)
// ==========================================================
app.use(express.static(path.join(__dirname, "public")));
["avatars", "videos", "assets", "demo"].forEach((d) =>
  app.use(`/${d}`, express.static(path.join(__dirname, `public/${d}`)))
);

// ==========================================================
// 🚀 LANCEMENT SERVEUR
// ==========================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`⚡ TINSFLASH PRO++ prêt sur port ${PORT}`);
  console.log("🌍 Zones couvertes:", enumerateCoveredPoints().length);
});
