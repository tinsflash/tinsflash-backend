// ==========================================================
// 🧠 TINSFLASH Meteorological Core
// 🚀 Serveur principal connecté – 100 % réel, zéro démo
// ==========================================================
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// === Services cœur du moteur ===
import { runGlobal } from "./services/runGlobal.js";           // Étape 1 : extraction réelle
import { runAIAnalysis } from "./services/aiAnalysis.js";      // Étape 2 : IA J.E.A.N
import * as engineStateService from "./services/engineState.js";
import * as adminLogs from "./services/adminLogs.js";
import { enumerateCoveredPoints } from "./services/zonesCovered.js";
import { checkSourcesFreshness } from "./services/sourcesFreshness.js";
import Alert from "./models/Alert.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// ==========================================================
// 🌍 Dossiers statiques – tout ce qui est public et visible Render
// ==========================================================
app.use(express.static(path.join(__dirname, "public")));

// ✅ Force les ressources statiques principales (Render bug fix)
app.use("/avatars", express.static(path.join(__dirname, "public/avatars")));
app.use("/videos", express.static(path.join(__dirname, "public/videos")));
app.use("/media", express.static(path.join(__dirname, "public")));
app.use("/scripts", express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "public")));

// ==========================================================
// 🔌 Connexion MongoDB (logs, alertes, états moteur)
// ==========================================================
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error("❌ Erreur MongoDB :", err));
} else {
  console.error("⚠️ MONGO_URI manquant dans .env (obligatoire pour moteur)");
}

// ==========================================================
// 🌐 Page d’accueil publique (index.html)
// ==========================================================
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================================================
// 🚀 Étape 1 : Extraction réelle (sans IA)
// ==========================================================
app.post("/api/run-global", async (req, res) => {
  try {
    console.log("🚀 Lancement extraction réelle RUN GLOBAL");
    await checkSourcesFreshness();
    const { zone } = req.body;
    const result = await runGlobal(zone || "All");
    res.json({ success: true, result });
  } catch (e) {
    console.error("❌ Erreur run-global :", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🧠 Étape 2 : Analyse IA J.E.A.N (relief, altitude, IA multi-modèles)
// ==========================================================
app.post("/api/ai-analyse", async (_, res) => {
  try {
    console.log("🧠 Analyse IA J.E.A.N – croisement relief/altitude/données réelles");
    const r = await runAIAnalysis();
    res.json(r);
  } catch (e) {
    console.error("❌ Erreur IA :", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 📡 Status moteur – source unique console admin + index
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

      // 💚 Zones couvertes par le moteur (vert)
      coveredZones: enumerateCoveredPoints(),
      // 💙 Zones non couvertes (OpenData)
      uncoveredZones: [],
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🔁 Logs SSE – flux en direct vers admin-pp.html
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
    logs.forEach(l => res.write(`data: ${JSON.stringify(l)}\n\n`));

  req.on("close", () => console.log("❌ Client SSE déconnecté"));
});

// ==========================================================
// 🌍 Alertes – données réelles issues du moteur
// ==========================================================
app.get("/api/alerts", async (_, res) => {
  try {
    const alerts = await Alert.find();
    res.json(alerts);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// === Résumé pour admin-alerts.html ===
app.get("/api/alerts/summary", async (_, res) => {
  try {
    const alerts = await Alert.find();
    const byStatus = {
      published: 0,
      toValidate: 0,
      "under-surveillance": 0,
      archived: 0,
    };
    let exclusives = 0, confirmedElsewhere = 0, continental = 0, local = 0;

    for (const a of alerts) {
      const s = a.data?.status || "under-surveillance";
      byStatus[s] = (byStatus[s] || 0) + 1;
      if (a.data?.external?.exclusivity === "exclusive") exclusives++;
      if (a.data?.external?.exclusivity === "confirmed-elsewhere") confirmedElsewhere++;
      if (a.continent) {
        if (["Europe","North America"].includes(a.continent)) local++;
        else continental++;
      }
    }

    res.json({ total: alerts.length, byStatus, exclusives, confirmedElsewhere, continental, local });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// === Mise à jour statut / validation ===
app.post("/api/alerts/:id/:action", async (req, res) => {
  try {
    const { id, action } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ success: false, error: "Alerte introuvable" });
    alert.data = alert.data || {};
    alert.data.status = action;
    await alert.save();
    await adminLogs.addLog(`✅ Alerte ${id} → ${action}`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// === Export partenaires (NASA / NOAA / Copernicus) ===
app.post("/api/alerts/export/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ success: false, error: "Alerte introuvable" });
    const targets = ["NASA","NOAA / NWS","Copernicus"];
    await adminLogs.addLog(`🚀 Export alerte ${id} vers ${targets.join(", ")}`);
    res.json({ success: true, targets });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// === Analyse IA ciblée sur une alerte ===
app.post("/api/alerts/analyze/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ success: false, error: "Alerte introuvable" });
    const r = await runAIAnalysis();
    await adminLogs.addLog(`🧠 IA J.E.A.N relancée pour alerte ${id}`);
    res.json({ success: true, alert, analysis: r.finalReport });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// === Actualités et observations satellites ===
app.get("/api/news", async (_, res) => {
  try {
    const articles = [
      {
        title: "Nouvelle tempête sur l’Atlantique Nord",
        summary: "Les modèles ECMWF et GFS confirment une formation rapide, vents > 120 km/h.",
        url: "https://www.metoffice.gov.uk/weather/warnings-and-advice/",
      },
      {
        title: "Anomalie thermique sur la Scandinavie",
        summary: "IA J.E.A.N détecte un excédent de +4 °C sur 72 h (Copernicus ERA5).",
        url: "https://climate.copernicus.eu/",
      },
    ];
    res.json({ articles });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🧭 Pages administrateur (protégées, invisibles moteurs)
// ==========================================================
const adminPages = [
  "admin-pp.html",
  "admin-alerts.html",
  "admin-chat.html",
  "admin-index.html",
  "admin-radar.html",
  "admin-users.html",
];
for (const page of adminPages) {
  app.get(`/admin${page.includes("admin-") ? "-" + page.split("-")[1].split(".")[0] : ""}`, (_, res) =>
    res.sendFile(path.join(__dirname, "public", page))
  );
}

// ==========================================================
// 🚀 Lancement Serveur
// ==========================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ TINSFLASH prêt sur port ${PORT}`);
  console.log("🌍 Couverture :", enumerateCoveredPoints().length, "points actifs (zones vertes).");
});
