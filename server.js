// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v3.6 PRO+++)
// ==========================================================
// Moteur global IA J.E.A.N – 100 % réel, 100 % connecté
// Compatible Render / MongoDB / GitHub Actions / Admin Console
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
  saveEngineState,
  addEngineLog,
  addEngineError,
  engineEvents,
  stopExtraction,
  resetStopFlag,
  isExtractionStopped
} from "./services/engineState.js";

import { enumerateCoveredPoints } from "./services/zonesCovered.js";
import { checkSourcesFreshness } from "./services/sourcesFreshness.js";
import { runWorldAlerts } from "./services/runWorldAlerts.js";
import Alert from "./models/Alert.js";
import * as chatService from "./services/chatService.js";

// === RUNS PAR ZONES ===
import { runGlobalEurope } from "./services/runGlobalEurope.js";
import { runGlobalUSA } from "./services/runGlobalUSA.js";
import { runGlobalCanada } from "./services/runGlobalCanada.js";
import { runGlobalAfricaNord } from "./services/runGlobalAfricaNord.js";
import { runGlobalAfricaCentrale } from "./services/runGlobalAfricaCentrale.js";
import { runGlobalAfricaOuest } from "./services/runGlobalAfricaOuest.js";
import { runGlobalAfricaSud } from "./services/runGlobalAfricaSud.js";
import { runGlobalAmericaSud } from "./services/runGlobalAmericaSud.js";
import { runGlobalAsiaEst } from "./services/runGlobalAsiaEst.js";
import { runGlobalAsiaSud } from "./services/runGlobalAsiaSud.js";
import { runGlobalOceania } from "./services/runGlobalOceania.js";
import { runGlobalCaribbean } from "./services/runGlobalCaribbean.js";

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
// 🔌 MongoDB – Connexion stabilisée Render + Atlas Paris
// ==========================================================
if (process.env.MONGO_URI) {
  try {
    mongoose.set("suppressReservedKeysWarning", true);
    mongoose
      .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 20000,
        connectTimeoutMS: 20000,
        socketTimeoutMS: 45000,
      })
      .then(async () => {
        console.log("✅ MongoDB connecté");
        const state = await getEngineState();
        if (state) console.log("🧠 État moteur chargé avec succès.");
      })
      .catch((e) => console.error("❌ Erreur MongoDB:", e.message));
  } catch (err) {
    console.error("⚠️ Erreur d'initialisation MongoDB:", err);
  }
} else {
  console.warn("⚠️ Aucune variable MONGO_URI définie !");
}

// ==========================================================
// 🛑 STOP / RESET EXTRACTION
// ==========================================================
app.post("/api/stop-extraction", async (req, res) => {
  try {
    stopExtraction();
    await addEngineLog("🛑 Extraction stoppée manuellement via API", "warn", "core");
    res.json({ success: true, message: "Extraction stoppée" });
  } catch (e) {
    await addEngineError("Erreur stop-extraction : " + e.message, "core");
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/reset-stop-extraction", async (req, res) => {
  try {
    resetStopFlag();
    await addEngineLog("✅ Flag stop extraction réinitialisé", "info", "core");
    res.json({ success: true });
  } catch (e) {
    await addEngineError("Erreur reset-stop-extraction : " + e.message, "core");
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🚀 RUN GLOBAL (All zones ou spécifique)
// ==========================================================
app.post("/api/run-global", async (req, res) => {
  try {
    if (isExtractionStopped && isExtractionStopped()) {
      return res.status(400).json({ success: false, error: "Extraction stoppée manuellement" });
    }
    await checkSourcesFreshness();
    const zone = req.body?.zone || "All";
    const r = await runGlobal(zone);
    await addEngineLog(`⚙️ Extraction complète effectuée pour ${zone}`, "success", "runGlobal");
    res.json({ success: true, result: r });
  } catch (e) {
    await addEngineError(`Erreur extraction: ${e.message}`, "runGlobal");
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🌍 RUNS PAR ZONES INDIVIDUELLES
// ==========================================================
const zoneRoutes = [
  { route: "/api/runGlobalEurope", fn: runGlobalEurope, label: "Europe" },
  { route: "/api/runGlobalUSA", fn: runGlobalUSA, label: "USA" },
  { route: "/api/runGlobalCanada", fn: runGlobalCanada, label: "Canada" },
  { route: "/api/runGlobalAfricaNord", fn: runGlobalAfricaNord, label: "Afrique du Nord" },
  { route: "/api/runGlobalAfricaCentrale", fn: runGlobalAfricaCentrale, label: "Afrique Centrale" },
  { route: "/api/runGlobalAfricaOuest", fn: runGlobalAfricaOuest, label: "Afrique de l’Ouest" },
  { route: "/api/runGlobalAfricaSud", fn: runGlobalAfricaSud, label: "Afrique du Sud" },
  { route: "/api/runGlobalAmericaSud", fn: runGlobalAmericaSud, label: "Amérique du Sud" },
  { route: "/api/runGlobalAsiaEst", fn: runGlobalAsiaEst, label: "Asie Est" },
  { route: "/api/runGlobalAsiaSud", fn: runGlobalAsiaSud, label: "Asie Sud" },
  { route: "/api/runGlobalOceania", fn: runGlobalOceania, label: "Océanie" },
  { route: "/api/runGlobalCaribbean", fn: runGlobalCaribbean, label: "Caraïbes" },
];

zoneRoutes.forEach(({ route, fn, label }) => {
  app.post(route, async (req, res) => {
    try {
      if (isExtractionStopped && isExtractionStopped()) {
        return res.status(400).json({ success: false, error: "Extraction stoppée manuellement" });
      }
      await addEngineLog(`🚀 Lancement extraction ${label}`, "info", "runGlobal");
      const result = await fn();
      const state = await getEngineState();
      state.lastRun = new Date();
      await saveEngineState(state);
      await addEngineLog(`✅ Extraction ${label} terminée avec succès`, "success", "runGlobal");
      res.json({ success: true, result });
    } catch (e) {
      await addEngineError(`Erreur extraction ${label}: ${e.message}`, "runGlobal");
      res.status(500).json({ success: false, error: e.message });
    }
  });
});

// ==========================================================
// 🧠 ANALYSE IA J.E.A.N.
// ==========================================================
app.post("/api/ai-analyse", async (req, res) => {
  try {
    await addEngineLog("🧠 Lancement IA J.E.A.N. – Analyse en cours...", "info", "IA.JEAN");
    const result = await runAIAnalysis();
    await addEngineLog("✅ IA J.E.A.N. – Analyse terminée avec succès", "success", "IA.JEAN");
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError(`Erreur IA J.E.A.N. : ${e.message}`, "IA.JEAN");
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🌎 FUSION MONDIALE DES ALERTES
// ==========================================================
app.post("/api/runWorldAlerts", async (req, res) => {
  try {
    await addEngineLog("🌍 Fusion globale des alertes en cours...", "info", "core");
    const result = await runWorldAlerts();
    await addEngineLog("✅ Fusion mondiale terminée", "success", "core");
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError(`Erreur runWorldAlerts: ${e.message}`, "core");
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🌍 ROUTES COMPLÉMENTAIRES – CONSOLE V3.6 PRO+++
// ==========================================================
app.post("/api/run-europe-usa", async (req, res) => {
  try {
    await addEngineLog("⚙️ Extraction combinée Europe/USA/Canada", "info", "core");
    const [r1, r2, r3] = await Promise.all([runGlobalEurope(), runGlobalUSA(), runGlobalCanada()]);
    const state = await getEngineState();
    state.lastRunEurope = new Date();
    await saveEngineState(state);
    await addEngineLog("✅ Extraction Europe/USA/Canada terminée", "success", "core");
    res.json({ success: true, result: { r1, r2, r3 } });
  } catch (e) {
    await addEngineError("Erreur run-europe-usa: " + e.message, "core");
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/run-world", async (req, res) => {
  try {
    await addEngineLog("🌍 Extraction Reste du monde", "info", "core");
    const results = await Promise.all([
      runGlobalAfricaNord(), runGlobalAfricaCentrale(), runGlobalAfricaOuest(),
      runGlobalAfricaSud(), runGlobalAmericaSud(),
      runGlobalAsiaEst(), runGlobalAsiaSud(),
      runGlobalOceania(), runGlobalCaribbean()
    ]);
    const state = await getEngineState();
    state.lastRunWorld = new Date();
    await saveEngineState(state);
    await addEngineLog("✅ Extraction Reste du monde terminée", "success", "core");
    res.json({ success: true, result: results });
  } catch (e) {
    await addEngineError("Erreur run-world: " + e.message, "core");
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/fusion-world", async (req, res) => {
  try {
    const result = await runWorldAlerts();
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError("Erreur fusion-world: " + e.message, "core");
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 📊 STATUS + LOGS + ADMIN
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
// ⚡ ALERTES IA – EXPORT PUBLIC
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
// 📁 STATIC FILES
// ==========================================================
app.use(express.static(path.join(__dirname, "public")));
["avatars", "videos", "assets", "demo"].forEach((d) =>
  app.use(`/${d}`, express.static(path.join(__dirname, `public/${d}`)))
);

// ==========================================================
// 🚀 LANCEMENT SERVEUR
// ==========================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => {
  console.log(`⚡ TINSFLASH PRO+++ prêt sur port ${PORT}`);
  console.log("🌍 Zones couvertes:", enumerateCoveredPoints().length);
});
