// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v3.0 PRO+++)
// ==========================================================
// Moteur global connecté IA.J.E.A.N.
// Compatible Render / MongoDB / GitHub Actions / Admin Console
// ==========================================================

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { runGlobal } from "./services/runGlobal.js"; // moteur agrégé si utilisé
import { runWorld } from "./services/runWorld.js";   // RUN 'reste du monde'
import { runWorldAlerts } from "./services/runWorldAlerts.js";
import { runAIAnalysis } from "./services/aiAnalysis.js"; // Phase 2 IA (alias possible de runGlobalAI)

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
import Alert from "./models/Alert.js";

// === RUNS PAR ZONES (Europe/USA/Canada séparés du reste du monde) ===
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

// ==========================================================
// 🌐 CORS
// ==========================================================
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
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
      autoIndex: true,
      serverSelectionTimeoutMS: 15000,
    })
    .then(() => console.log("✅ MongoDB connecté"))
    .catch((e) => console.error("❌ Erreur MongoDB:", e.message));
} else {
  console.warn("⚠️ MONGO_URI non défini – certaines features ne fonctionneront pas.");
}

// Init état moteur
await initEngineState();

// ==========================================================
// 🛑 STOP / RESET EXTRACTION
// ==========================================================
app.post("/api/stop-extraction", async (_req, res) => {
  try {
    stopExtraction();
    await addEngineLog("🛑 Extraction stoppée manuellement via API", "warn", "core");
    res.json({ success: true, message: "Extraction stoppée" });
  } catch (e) {
    await addEngineError("Erreur stop-extraction : " + e.message, "core");
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/reset-stop-extraction", async (_req, res) => {
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
// 🚀 RUNS PRINCIPAUX (boutons console)
// ==========================================================

// 1) Europe + USA + Canada (2×/jour)
app.post("/api/run-main", async (_req, res) => {
  try {
    if (isExtractionStopped && isExtractionStopped()) {
      return res.status(400).json({ success: false, error: "Extraction stoppée manuellement" });
    }
    await addEngineLog("⚡ RUN PRINCIPAL – Europe + USA + Canada", "info", "runMain");

    await checkSourcesFreshness();

    const eu = await runGlobalEurope();
    const us = await runGlobalUSA();
    const ca = await runGlobalCanada();

    await addEngineLog(
      `✅ EU(${eu?.forecastCount || 0}) + US(${us?.forecastCount || 0}) + CA(${ca?.forecastCount || 0})`,
      "success",
      "runMain"
    );

    // Fusion partielle des alertes (optionnel ici)
    const fused = await runWorldAlerts();
    await addEngineLog(
      `🌍 Fusion alertes (partielle/main) → ${fused?.summary?.totalAlerts || 0} alertes`,
      "info",
      "runMain"
    );

    const s = await getEngineState();
    s.lastRun = new Date();
    s.checkup = s.checkup || {};
    s.checkup.engineStatus = "OK-MAIN";
    await saveEngineState(s);

    res.json({ success: true, eu, us, ca, fused });
  } catch (e) {
    await addEngineError("❌ run-main: " + e.message, "runMain");
    res.status(500).json({ success: false, error: e.message });
  }
});

// 2) Reste du monde (1×/jour – Afrique/AmSud/Asie/Océanie/Caraïbes)
app.post("/api/run-world", async (_req, res) => {
  try {
    if (isExtractionStopped && isExtractionStopped()) {
      return res.status(400).json({ success: false, error: "Extraction stoppée manuellement" });
    }
    await addEngineLog("🌍 RUN MONDIAL – Reste du monde", "info", "runWorld");

    await checkSourcesFreshness();
    const world = await runWorld(); // lance tous les sous-runs hors EU/USA/Canada

    const fused = await runWorldAlerts();
    await addEngineLog(
      `🌐 Fusion alertes (monde) → ${fused?.summary?.totalAlerts || 0} alertes`,
      "info",
      "runWorld"
    );

    const s = await getEngineState();
    s.lastRun = new Date();
    s.checkup = s.checkup || {};
    s.checkup.engineStatus = "OK-WORLD";
    await saveEngineState(s);

    res.json({ success: true, world, fused });
  } catch (e) {
    await addEngineError("❌ run-world: " + e.message, "runWorld");
    res.status(500).json({ success: false, error: e.message });
  }
});

// 3) Analyse IA J.E.A.N. (phase 2)
app.post("/api/ai-analyse", async (_req, res) => {
  try {
    await addEngineLog("🧠 IA J.E.A.N. – Analyse globale", "info", "IA.JEAN");
    const result = await runAIAnalysis();
    await addEngineLog("✅ IA J.E.A.N. – Analyse terminée", "success", "IA.JEAN");
    res.json({ success: true, result });
  } catch (e) {
    await addEngineError(`Erreur IA J.E.A.N.: ${e.message}`, "IA.JEAN");
    res.status(500).json({ success: false, error: e.message });
  }
});

// 4) Fusion globale (prévisions + alertes consolidées)
app.post("/api/fusion-globale", async (_req, res) => {
  try {
    await addEngineLog("📦 Fusion globale (prévisions + alertes)…", "info", "fusion");
    const fused = await runWorldAlerts();
    await addEngineLog(
      `✅ Fusion globale OK – ${fused?.summary?.totalAlerts || 0} alertes`,
      "success",
      "fusion"
    );
    res.json({ success: true, result: fused });
  } catch (e) {
    await addEngineError(`Erreur fusion globale: ${e.message}`, "fusion");
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🔧 RUNS PAR ZONE (routes directes pour la console)
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
  { route: "/api/runGlobalAsiaEst", fn: runGlobalAsiaEst, label: "Asie de l’Est" },
  { route: "/api/runGlobalAsiaSud", fn: runGlobalAsiaSud, label: "Asie du Sud" },
  { route: "/api/runGlobalOceania", fn: runGlobalOceania, label: "Océanie" },
  { route: "/api/runGlobalCaribbean", fn: runGlobalCaribbean, label: "Caraïbes" },
];

zoneRoutes.forEach(({ route, fn, label }) => {
  app.post(route, async (_req, res) => {
    try {
      if (isExtractionStopped && isExtractionStopped()) {
        return res.status(400).json({ success: false, error: "Extraction stoppée manuellement" });
      }
      await addEngineLog(`🚀 Lancement extraction ${label}`, "info", "runGlobal");
      const result = await fn();
      const state = await getEngineState();
      state.lastRun = new Date();
      await saveEngineState(state);
      await addEngineLog(`✅ Extraction ${label} terminée`, "success", "runGlobal");
      res.json({ success: true, result });
    } catch (e) {
      await addEngineError(`Erreur extraction ${label}: ${e.message}`, "runGlobal");
      res.status(500).json({ success: false, error: e.message });
    }
  });
});

// ==========================================================
// 🌎 RUN WORLD ALERTS (fusion globale des alertes)
// ==========================================================
app.post("/api/runWorldAlerts", async (_req, res) => {
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
// 📊 STATUS MOTEUR
// ==========================================================
app.get("/api/status", async (_req, res) => {
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
// 📡 LOGS SSE (Console admin)
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
// ⚡ ALERTES IA – Export public
// ==========================================================
app.get("/api/alerts", async (_req, res) => {
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
  "admin-index.html",
  "admin-radar.html",
  "admin-users.html",
].forEach((p) =>
  app.get(`/${p}`, (_req, res) =>
    res.sendFile(path.join(__dirname, "public", p))
  )
);

// ==========================================================
// 📁 STATIC FILES (APRÈS les routes API)
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
  console.log(`⚡ TINSFLASH PRO+++ prêt sur port ${PORT}`);
  console.log("🌍 Zones couvertes:", enumerateCoveredPoints().length);
});
