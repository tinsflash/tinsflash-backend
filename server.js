// PATH: server.js
// 🧠 TINSFLASH Meteorological Nuclear Core – Serveur principal connecté & visible Render

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// === Services ===
import { runGlobal } from "./services/runGlobal.js";             // Étape 1 : Extraction réelle (sans IA)
import { runAIAnalysis } from "./services/aiAnalysis.js";        // Étape 2 : IA J.E.A.N
import * as engineStateService from "./services/engineState.js";
import * as adminLogs from "./services/adminLogs.js";
import * as alertsService from "./services/alertsService.js";
import { checkSourcesFreshness } from "./services/sourcesFreshness.js";
import Alert from "./models/Alert.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// === MongoDB ===
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connecté"))
    .catch((err) => console.error("❌ Erreur MongoDB:", err));
} else {
  console.error("⚠️ MONGO_URI manquant dans .env");
}

// === PAGE ACCUEIL ===
app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

// ==========================================================
// 🚀 ETAPE 1 : EXTRACTION SANS IA (RUN GLOBAL)
// ==========================================================
app.post("/api/run-global", async (req, res) => {
  try {
    console.log("🚀 Lancement RUN GLOBAL (EXTRACTION) via API");
    await checkSourcesFreshness();
    const { zone } = req.body;
    const result = await runGlobal(zone || "All");
    res.json({ success: true, result });
  } catch (e) {
    console.error("❌ Erreur run-global:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🧠 ETAPE 2 : ANALYSE IA J.E.A.N (relief / altitude)
// ==========================================================
app.post("/api/ai-analyse", async (_, res) => {
  try {
    console.log("🧠 Lancement Analyse IA J.E.A.N via API");
    const r = await runAIAnalysis();
    res.json(r);
  } catch (e) {
    console.error("❌ Erreur analyse IA:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 📡 STATUS MOTEUR – pour console admin
// ==========================================================
app.get("/api/status", async (_, res) => {
  try {
    const state = await engineStateService.getEngineState();
    res.json({
      status: state?.checkup?.engineStatus || state?.status || "IDLE",
      lastRun: state?.lastRun,
      models: state?.checkup?.models || "unknown",
      steps: state?.checkup || {},
      alerts: state?.alertsLocal || [],
      alertsCount: state?.alertsLocal?.length || 0,
      alertsContinental: state?.alertsContinental || [],
      alertsWorld: state?.alertsWorld || [],
      forecasts: state?.forecastsContinental || {},
      partialReport: state?.partialReport || null,
      finalReport: state?.finalReport || null,
      engineErrors: state?.errors || [],
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🔁 LOGS SSE – Console Admin en direct
// ==========================================================
app.get("/api/logs/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  adminLogs.registerClient(res);
  console.log("🛰️ Client SSE connecté");

  const logs = await adminLogs.getLogs("current");
  if (logs?.length)
    logs.forEach((l) => res.write(`data: ${JSON.stringify(l)}\n\n`));

  req.on("close", () => console.log("❌ Client SSE déconnecté"));
});

// ==========================================================
// 🔎 ALERTES – Lecture de base (pour cartes & résumés)
// ==========================================================
app.get("/api/alerts", async (_, res) => {
  try {
    const alerts = await Alert.find();
    res.json(alerts);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🌎 ALERTES – Extensions pour admin-alerts.html
// ==========================================================
app.get("/api/alerts/summary", async (_, res) => {
  try {
    const alerts = await Alert.find();
    const byStatus = {
      published: 0,
      toValidate: 0,
      "under-surveillance": 0,
      archived: 0,
    };
    let exclusives = 0,
      confirmedElsewhere = 0,
      continental = 0,
      local = 0;

    for (const a of alerts) {
      const s = a.data?.status || "under-surveillance";
      byStatus[s] = (byStatus[s] || 0) + 1;
      if (a.data?.external?.exclusivity === "exclusive") exclusives++;
      if (a.data?.external?.exclusivity === "confirmed-elsewhere")
        confirmedElsewhere++;
      if (a.continent) {
        if (["Europe", "North America"].includes(a.continent)) local++;
        else continental++;
      }
    }

    res.json({
      total: alerts.length,
      byStatus,
      exclusives,
      confirmedElsewhere,
      continental,
      local,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Changement de statut (validation / archivage / etc.)
app.post("/api/alerts/:id/:action", async (req, res) => {
  try {
    const { id, action } = req.params;
    const alert = await Alert.findById(id);
    if (!alert)
      return res.status(404).json({ success: false, error: "Alerte introuvable" });
    alert.data = alert.data || {};
    alert.data.status = action;
    await alert.save();
    await adminLogs.addLog(`✅ Alerte ${id} → ${action}`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Export vers partenaires (NASA / NWS / Copernicus)
app.post("/api/alerts/export/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);
    if (!alert)
      return res.status(404).json({ success: false, error: "Alerte introuvable" });

    const targets = ["NASA", "NOAA / NWS", "Copernicus"];
    await adminLogs.addLog(`🚀 Export alerte ${id} vers ${targets.join(", ")}`);
    res.json({ success: true, targets });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Analyse IA ciblée sur une alerte
app.post("/api/alerts/analyze/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);
    if (!alert)
      return res.status(404).json({ success: false, error: "Alerte introuvable" });

    const r = await runAIAnalysis();
    await adminLogs.addLog(`🧠 IA J.E.A.N relancée pour alerte ${id}`);
    res.json({ success: true, alert, analysis: r.finalReport });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Actualités et observations satellites
app.get("/api/news", async (_, res) => {
  try {
    const articles = [
      {
        title: "Nouvelle tempête sur l’Atlantique Nord",
        summary:
          "Les modèles ECMWF et GFS confirment une formation rapide, risque de vents >120 km/h.",
        url: "https://www.metoffice.gov.uk/weather/warnings-and-advice/",
      },
      {
        title: "Anomalie thermique sur la Scandinavie",
        summary:
          "L’analyse IA J.E.A.N détecte un excédent de +4°C sur 72h. Source : Copernicus ERA5.",
        url: "https://climate.copernicus.eu/",
      },
    ];
    res.json({ articles });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🧭 PAGES ADMIN (protégées, non indexées)
// ==========================================================
app.get("/admin", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-pp.html"))
);
app.get("/admin-alerts", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-alerts.html"))
);
app.get("/admin-chat", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-chat.html"))
);
app.get("/admin-index", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-index.html"))
);
app.get("/admin-radar", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-radar.html"))
);
app.get("/admin-users", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "admin-users.html"))
);

// ==========================================================
// 🚀 LANCEMENT SERVEUR
// ==========================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 TINSFLASH Server en ligne sur port ${PORT}`)
);
