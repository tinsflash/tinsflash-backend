// PATH: server.js
// 🧠 TINSFLASH Meteorological Nuclear Core – Serveur principal 100% réel & stable Render

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
import { runEvolution } from "./services/evolution.js";
import Alert from "./models/Alert.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

/* ------------------------------------------------------------------
   🧩 CONNEXION MONGO
------------------------------------------------------------------ */
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000,
    })
    .then(() => console.log("✅ MongoDB connecté"))
    .catch((err) => console.error("❌ Erreur MongoDB:", err.message));
} else {
  console.error("⚠️ Variable MONGO_URI manquante !");
}

/* ------------------------------------------------------------------
   🌐 ROUTES DE BASE
------------------------------------------------------------------ */
app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

/* ------------------------------------------------------------------
   ⚙️ LANCEMENT RUN GLOBAL
------------------------------------------------------------------ */
app.post("/api/run-global", async (req, res) => {
  try {
    console.log("🚀 Lancement RUN GLOBAL via API (Render visible)");
    await checkSourcesFreshness();
    const { zone } = req.body;
    const result = await runGlobal(zone || "All");
    res.json({ success: true, result });
  } catch (e) {
    console.error("❌ Erreur run-global:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

/* ------------------------------------------------------------------
   📊 STATUS MOTEUR
------------------------------------------------------------------ */
app.get("/api/status", async (_, res) => {
  try {
    const state = await engineStateService.getEngineState();
    res.json({
      status: state?.checkup?.engineStatus || state?.status || "IDLE",
      lastRun: state?.lastRun,
      models: state?.checkup?.models || {},
      steps: state?.checkup || {},
      alerts: state?.alertsLocal || [],
      alertsCount: state?.alertsLocal?.length || 0,
      forecasts: state?.forecastsContinental || {},
      finalReport: state?.finalReport || {},
      engineErrors: state?.errors || [],
    });
  } catch (e) {
    console.error("⚠️ Erreur récupération status:", e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/* ------------------------------------------------------------------
   🛰️ LOGS SSE EN DIRECT
------------------------------------------------------------------ */
app.get("/api/logs/stream", async (req, res) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    adminLogs.registerClient(res);
    console.log("🛰️ Client SSE connecté");

    const logs = await adminLogs.getLogs("current");
    if (logs?.length)
      logs.forEach((l) =>
        res.write(`data: ${JSON.stringify(l)}\n\n`)
      );

    req.on("close", () => console.log("❌ Client SSE déconnecté"));
  } catch (err) {
    console.error("⚠️ Erreur SSE logs:", err.message);
    res.status(500).end();
  }
});

/* ------------------------------------------------------------------
   🧠 EVOLUTION AUTO DES ALERTES
------------------------------------------------------------------ */
app.post("/api/evolution/run", async (_, res) => {
  try {
    const evo = await runEvolution();
    res.json({ success: true, evolution: evo });
  } catch (e) {
    console.error("❌ Erreur évolution:", e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/* ------------------------------------------------------------------
   ⚡ CHAT MOTEUR (GPT-3.5)
------------------------------------------------------------------ */
app.post("/api/chat-engine", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: "❌ Message vide" });
    const reply = await chatService.askAIEngine(message);
    res.json({ reply });
  } catch (e) {
    console.error("⚠️ Chat moteur:", e.message);
    res.status(500).json({ reply: "Erreur moteur: " + e.message });
  }
});

/* ------------------------------------------------------------------
   🪐 CHAT PUBLIC (Cohere J.E.A.N)
------------------------------------------------------------------ */
app.post("/api/jean", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message)
      return res.status(400).json({ reply: "❌ Message manquant" });
    const { reply, avatar } = await askCohere(message);
    res.json({ reply, avatar });
  } catch (e) {
    console.error("⚠️ Chat public J.E.A.N:", e.message);
    res.status(500).json({ reply: "Erreur interne", avatar: "default" });
  }
});

/* ------------------------------------------------------------------
   📋 PAGES ADMIN (invisibles moteurs recherche)
------------------------------------------------------------------ */
app.get("/admin", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-pp.html"))
);
app.get("/admin-alerts", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-alerts.html"))
);

/* ------------------------------------------------------------------
   🚀 LANCEMENT SERVEUR
------------------------------------------------------------------ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 TINSFLASH Server opérationnel sur le port ${PORT}`)
);
