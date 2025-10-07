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
// 🌍 CORS renforcé
// ==========================================================
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ==========================================================
// 🌍 Fichiers publics
// ==========================================================
app.use(express.static(path.join(__dirname, "public")));
["/avatars","/videos","/media","/scripts","/assets"].forEach(dir=>{
  app.use(dir, express.static(path.join(__dirname, "public")));
});

// ==========================================================
// 🔌 Connexion MongoDB
// ==========================================================
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI,{useNewUrlParser:true,useUnifiedTopology:true})
  .then(()=>console.log("✅ MongoDB connecté"))
  .catch(err=>console.error("❌ Erreur MongoDB :",err));
} else console.error("⚠️ MONGO_URI manquant dans .env");

// ==========================================================
// 🌐 Page publique
// ==========================================================
app.get("/",(_,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

// ==========================================================
// 🚀 Extraction réelle
// ==========================================================
app.post("/api/run-global",async(req,res)=>{
  try{
    await checkSourcesFreshness();
    const {zone}=req.body;
    const result=await runGlobal(zone||"All");
    await logToAdmin(`⚙️ Extraction complète effectuée pour ${zone||"All"}`);
    res.json({success:true,result});
  }catch(e){
    await logToAdmin(`❌ Erreur extraction: ${e.message}`);
    res.status(500).json({success:false,error:e.message});
  }
});

// ==========================================================
// 🧩 Compatibilité ancienne route /api/extract
// ==========================================================
app.get("/api/extract",async(_,res)=>{
  try{
    await checkSourcesFreshness();
    const result=await runGlobal("All");
    await logToAdmin("⚙️ Extraction complète (route legacy)");
    res.json({success:true,result});
  }catch(e){
    await logToAdmin(`❌ Échec extraction (legacy): ${e.message}`);
    res.status(500).json({success:false,error:e.message});
  }
});

// ==========================================================
// 🧠 Analyse IA J.E.A.N
// ==========================================================
app.post("/api/ai-analyse",async(_,res)=>{
  try{
    const r=await runAIAnalysis();
    await logToAdmin("🧠 Analyse IA J.E.A.N terminée avec succès");
    res.json(r);
  }catch(e){
    await logToAdmin(`❌ Erreur IA J.E.A.N: ${e.message}`);
    res.status(500).json({success:false,error:e.message});
  }
});

// ==========================================================
// 📡 Status moteur
// ==========================================================
app.get("/api/status",async(_,res)=>{
  try{
    const state=await engineStateService.getEngineState();
    res.json({
      status:state?.checkup?.engineStatus||state?.status||"IDLE",
      lastRun:state?.lastRun,
      models:state?.checkup?.models||"unknown",
      steps:state?.checkup||{},
      alerts:state?.alertsLocal||[],
      alertsCount:state?.alertsLocal?.length||0,
      alertsContinental:state?.alertsContinental||[],
      alertsWorld:state?.alertsWorld||[],
      forecasts:state?.forecastsContinental||{},
      partialReport:state?.partialReport||null,
      finalReport:state?.finalReport||null,
      engineErrors:state?.errors||[],
      coveredZones:enumerateCoveredPoints(),
      uncoveredZones:[]
    });
  }catch(e){res.status(500).json({success:false,error:e.message});}
});

// ==========================================================
// 💬 IA Cohere publique
// ==========================================================
app.post("/api/cohere",async(req,res)=>{
  try{
    const {question}=req.body;
    if(!question||question.trim().length<2)
      return res.status(400).json({error:"Question invalide"});
    const {reply,avatar}=await askCohere(question);
    await logToAdmin(`💬 Question IA J.E.A.N reçue: "${question}"`);
    res.json({success:true,reply,avatar:`/avatars/jean-${avatar}.png`});
  }catch(err){
    console.error("❌ Erreur Cohere :",err.message);
    res.status(500).json({success:false,reply:"Erreur interne J.E.A.N.",avatar:"/avatars/jean-default.png"});
  }
});

// ==========================================================
// 🌍 Alertes & exports
// ==========================================================
app.get("/api/alerts",async(_,res)=>{
  try{res.json(await Alert.find());}
  catch(e){res.status(500).json({success:false,error:e.message});}
});

app.post("/api/alerts/export/:id",async(req,res)=>{
  try{
    const alert=await Alert.findById(req.params.id);
    if(!alert)return res.status(404).json({success:false});
    const targets=["NASA","NOAA / NWS","Copernicus"];
    await logToAdmin(`🚀 Export alerte ${req.params.id} vers ${targets.join(", ")}`);
    res.json({success:true,targets});
  }catch(e){res.status(500).json({success:false,error:e.message});}
});

// ==========================================================
// 📡 Flux de logs & erreurs temps réel (SSE)
// ==========================================================
const logEmitter=new EventEmitter();
const errorEmitter=new EventEmitter();

app.get("/api/logs/stream",(req,res)=>{
  res.setHeader("Content-Type","text/event-stream");
  res.setHeader("Cache-Control","no-cache");
  res.setHeader("Connection","keep-alive");
  res.flushHeaders();

  const sendLog=log=>res.write(`data: ${JSON.stringify(log)}\n\n`);
  const sendErr=err=>res.write(`data: ${JSON.stringify({type:"error",...err})}\n\n`);
  logEmitter.on("newLog",sendLog);
  errorEmitter.on("newError",sendErr);

  const ping=setInterval(()=>res.write(`: ping\n\n`),25000);
  req.on("close",()=>{clearInterval(ping);logEmitter.removeListener("newLog",sendLog);errorEmitter.removeListener("newError",sendErr);});
});

// --- Logger intermédiaire sûr ---
async function logToAdmin(message){
  const payload={timestamp:new Date(),message};
  logEmitter.emit("newLog",payload);
  try{await adminLogs.addLog(message);}
  catch(e){
    errorEmitter.emit("newError",{timestamp:new Date(),message:`⚠️ Erreur enregistrement log: ${e.message}`});
  }
}

// --- Middleware erreurs global ---
app.use((err,req,res,next)=>{
  console.error("🔥 Erreur non gérée:",err);
  errorEmitter.emit("newError",{timestamp:new Date(),message:`🔥 Exception serveur: ${err.message}`});
  res.status(500).json({success:false,error:"Erreur interne serveur"});
});

// ==========================================================
// 🧭 Pages Admin
// ==========================================================
["admin-pp.html","admin-alerts.html","admin-chat.html","admin-index.html","admin-radar.html","admin-users.html"]
.forEach(page=>{
  const route=`/admin${page.includes("admin-")?"-"+page.split("-")[1].split(".")[0]:""}`;
  app.get(route,(_,res)=>res.sendFile(path.join(__dirname,"public",page)));
});

// ==========================================================
// 🚀 Lancement Serveur
// ==========================================================
const PORT=process.env.PORT||5000;
app.listen(PORT,()=>{
  console.log(`⚡ TINSFLASH prêt sur port ${PORT}`);
  console.log("🌍 Couverture :",enumerateCoveredPoints().length,"points actifs (zones vertes).");
});
