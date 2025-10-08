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

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.static(path.join(__dirname, "public")));
["avatars", "videos", "assets", "demo"].forEach((dir) =>
  app.use(`/${dir}`, express.static(path.join(__dirname, `public/${dir}`)))
);

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

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connecté"))
    .catch((err) => console.error("❌ Erreur MongoDB :", err.message));
} else console.error("⚠️ MONGO_URI manquant dans .env");

app.get("/", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

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

app.get("/api/status", async (_, res) => {
  try {
    const state = await getEngineState();
    res.json({
      status: state?.checkup?.engineStatus || state?.status || "IDLE",
      lastRun: state?.lastRun,
      models: state?.checkup?.models || {},
      alerts: state?.alertsLocal || [],
      alertsContinental: state?.alertsContinental || [],
      alertsWorld: state?.alertsWorld || [],
      errors: state?.errors || [],
      coveredZones: enumerateCoveredPoints(),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/api/alerts", async (_, res) => {
  try {
    const alerts = await Alert.find().sort({ certainty: -1 });
    res.json(alerts);
  } catch (e) {
    await addEngineError(`Erreur récupération alertes: ${e.message}`, "alerts");
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/api/logs-stream", (req, res) => {
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

["admin-pp.html", "admin-alerts.html", "admin-chat.html"].forEach((page) =>
  app.get(`/${page}`, (_, res) => res.sendFile(path.join(__dirname, "public", page)))
);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`⚡ TINSFLASH PRO++ prêt sur port ${PORT}`);
  console.log("🌍 Zones couvertes :", enumerateCoveredPoints().length);
});
