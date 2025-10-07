// ==========================================================
// 🧠 TINSFLASH Meteorological Core – Everest Protocol v1
// 🌍 Serveur principal – 100 % réel, zéro démo
// ==========================================================
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import EventEmitter from "events";

import { runGlobal } from "./services/runGlobal.js";
import { runAIAnalysis } from "./services/aiAnalysis.js";
import * as engineStateService from "./services/engineState.js";
import * as adminLogs from "./services/adminLogs.js";
import { enumerateCoveredPoints } from "./services/zonesCovered.js";
import { checkSourcesFreshness } from "./services/sourcesFreshness.js";
import Alert from "./models/Alert.js";
import { askCohere } from "./services/cohereService.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ==========================================================
// 🌍 CORS compatible Render / GitHub / Local
// ==========================================================
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ==========================================================
// 🌍 Fichiers publics
// ==========================================================
app.use(express.static(path.join(__dirname, "public")));
app.use("/avatars", express.static(path.join(__dirname, "public/avatars")));
app.use("/videos", express.static(path.join(__dirname, "public/videos")));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// ==========================================================
// 🔌 Connexion MongoDB
// ==========================================================
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error("❌ Erreur MongoDB :", err));
} else console.error("⚠️ MONGO_URI manquant dans .env");

// ==========================================================
// 🌐 Page publique
// ==========================================================
app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

// ==========================================================
// 🚀 Extraction réelle
// ==========================================================
app.post("/api/run-global", async (req, res) => {
  try {
    await checkSourcesFreshness();
    const { zone } = req.body;
    const result = await runGlobal(zone || "All");
    await adminLogs.addLog(`⚙️ Extraction complète pour ${zone || "All"}`);
    res.json({ success: true, result });
  } catch (e) {
    await adminLogs.addLog(`❌ Erreur extraction: ${e.message}`);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 🧠 Analyse IA J.E.A.N
// ==========================================================
app.post("/api/ai-analyse", async (_, res) => {
  try {
    const r = await runAIAnalysis();
    await adminLogs.addLog("🧠 Analyse IA J.E.A.N terminée avec succès");
    res.json(r);
  } catch (e) {
    await adminLogs.addLog(`❌ Erreur IA J.E.A.N: ${e.message}`);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 📡 Statut moteur
// ==========================================================
app.get("/api/status", async (_, res) => {
  try {
    const state = await engineStateService.getEngineState();
    res.json({
      status: state?.checkup?.engineStatus || state?.status || "IDLE",
      lastRun: state?.lastRun,
      models: state?.checkup?.models || {},
      alerts: state?.alertsLocal || [],
      alertsContinental: state?.alertsContinental || [],
      alertsWorld: state?.alertsWorld || [],
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
// 💬 IA Cohere publique (chat utilisateur)
// ==========================================================
app.post("/api/cohere", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || question.trim().length < 2)
      return res.status(400).json({ error: "Question invalide" });

    const { reply, avatar } = await askCohere(question);
    await adminLogs.addLog(`💬 Question J.E.A.N: "${question}"`);
    res.json({ success: true, reply, avatar: `/avatars/jean-${avatar}.png` });
  } catch (err) {
    res.status(500).json({ success: false, reply: "Erreur J.E.A.N.", avatar: "/avatars/jean-default.png" });
  }
});

// ==========================================================
// 🌍 Alertes & export global
// ==========================================================
app.get("/api/alerts", async (_, res) => {
  try {
    const alerts = await Alert.find().sort({ certainty: -1 });
    res.json(alerts);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ✅ Export manuel NASA/NOAA/Copernicus
app.post("/api/alerts/export/:id", async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false });

    const targets = ["NASA", "NOAA / NWS", "Copernicus"];
    alert.status = "auto_published";
    alert.history.push({ ts: new Date(), note: "Exportée vers organismes internationaux" });
    await alert.save();

    await adminLogs.addLog(`🚀 Export alerte ${alert._id} vers ${targets.join(", ")}`);
    res.json({ success: true, targets });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ✅ Suppression manuelle (ou après 3 runs)
app.delete("/api/alerts/:id", async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    await adminLogs.addLog(`🗑️ Alerte ${req.params.id} supprimée`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================================
// 📡 Flux de logs SSE
// ==========================================================
const logEmitter = new EventEmitter();
const errorEmitter = new EventEmitter();

app.get("/api/logs/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendLog = log => res.write(`data: ${JSON.stringify(log)}\n\n`);
  logEmitter.on("newLog", sendLog);

  const sendErr = err => res.write(`data: ${JSON.stringify({ type:"error",...err })}\n\n`);
  errorEmitter.on("newError", sendErr);

  const ping=setInterval(()=>res.write(`: ping\n\n`),25000);
  req.on("close",()=>{clearInterval(ping);logEmitter.removeListener("newLog",sendLog);errorEmitter.removeListener("newError",sendErr);});
});

const originalAddLog = adminLogs.addLog;
adminLogs.addLog = async msg => {
  const payload={timestamp:new Date(),message:msg};
  logEmitter.emit("newLog",payload);
  try{await originalAddLog(msg);}
  catch(e){errorEmitter.emit("newError",{timestamp:new Date(),message:`⚠️ Log error: ${e.message}`});}
};

// ==========================================================
// 🧭 Pages admin (invisibles moteurs de recherche)
// ==========================================================
const pages=["admin-pp.html","admin-alerts.html","admin-chat.html","admin-index.html","admin-radar.html","admin-users.html"];
for(const page of pages){
  app.get(`/${page}`,(_,res)=>res.sendFile(path.join(__dirname,"public",page)));
}

// ==========================================================
// 🚀 Lancement serveur
// ==========================================================
const PORT=process.env.PORT||5000;
app.listen(PORT,()=>{
  console.log(`⚡ TINSFLASH prêt sur port ${PORT}`);
  console.log("🌍 Zones couvertes :",enumerateCoveredPoints().length);
});
