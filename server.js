// ==========================================================
// 🌍 TINSFLASH – Central Meteorological Engine (Everest Protocol v2.5 PRO++)
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
import { createFullReportPDF } from "./services/exportReport.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
await initEngineState();

// ==========================================================
// 🌐 CORS
// ==========================================================
app.use(cors({ origin: "*", methods: ["GET","POST","PUT","DELETE"], allowedHeaders: ["Content-Type","Authorization"] }));

// ==========================================================
// 📁 Static
// ==========================================================
app.use(express.static(path.join(__dirname,"public")));
["avatars","videos","assets","demo"].forEach(d =>
  app.use(`/${d}`,express.static(path.join(__dirname,`public/${d}`)))
);

// ==========================================================
// 🧠 Correctifs modules
// ==========================================================
app.get("/three.module.js",async(_,res)=>{
  try{const r=await fetch("https://unpkg.com/three@0.161.0/build/three.module.js");
  res.type("application/javascript").send(await r.text());}
  catch{res.status(500).send("// erreur module three.js");}
});
app.get("/OrbitControls.js",async(_,res)=>{
  try{const r=await fetch("https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js");
  res.type("application/javascript").send(await r.text());}
  catch{res.status(500).send("// erreur module OrbitControls");}
});

// ==========================================================
// 🔌 MongoDB
// ==========================================================
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI,{useNewUrlParser:true,useUnifiedTopology:true})
    .then(()=>console.log("✅ MongoDB connecté"))
    .catch(e=>console.error("❌ Erreur MongoDB :",e.message));
} else console.error("⚠️ MONGO_URI manquant dans .env");

// ==========================================================
// 🌍 Index public
// ==========================================================
app.get("/",(_,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

// ==========================================================
// 🚀 Extraction réelle (RunGlobal)
// ==========================================================
app.post("/api/run-global",async(req,res)=>{
  try{
    await checkSourcesFreshness();
    const zone=req.body?.zone||"All";
    const result=await runGlobal(zone);
    await addEngineLog(`⚙️ Extraction complète effectuée pour ${zone}`,"success","runGlobal");
    res.json({success:true,result});
  }catch(e){
    await addEngineError(`❌ Erreur extraction: ${e.message}`,"runGlobal");
    res.status(500).json({success:false,error:e.message});
  }
});

// ==========================================================
// 🧠 Analyse IA J.E.A.N.
// ==========================================================
app.post("/api/ai-analyse",async(_,res)=>{
  try{
    const r=await runAIAnalysis();
    await addEngineLog("🧠 Analyse IA J.E.A.N terminée avec succès","success","IA");
    res.json({success:true,result:r});
  }catch(e){
    await addEngineError(`Erreur IA J.E.A.N: ${e.message}`,"IA");
    res.status(500).json({success:false,error:e.message});
  }
});

// ==========================================================
// ⚡ NOUVELLE ROUTE – Prévision instantanée utilisateur
// ==========================================================
// lit directement les données stockées au dernier runGlobal sans relancer le moteur
app.get("/api/forecast", async (req,res)=>{
  try{
    const {lat,lon}=req.query;
    if(!lat||!lon) return res.status(400).json({error:"Coordonnées manquantes"});
    const state=await getEngineState();
    const forecasts=state?.forecasts||state?.partialReport?.forecasts||[];
    // on cherche la prévision la plus proche
    let nearest=null,minDist=1e9;
    for(const f of forecasts){
      if(!f.lat||!f.lon) continue;
      const d=Math.hypot(f.lat-lat,f.lon-lon);
      if(d<minDist){minDist=d;nearest=f;}
    }
    // Cherche les alertes proches
    const alerts=await Alert.find({
      "geo.lat":{$gte:lat-1,$lte:+lat+1},
      "geo.lon":{$gte:lon-1,$lte:+lon+1}
    }).sort({certainty:-1}).limit(10);
    if(!nearest) return res.json({message:"Aucune prévision locale stockée",alerts});
    res.json({forecast:nearest,alerts});
  }catch(e){
    await addEngineError("Erreur forecast instantané: "+e.message,"forecast");
    res.status(500).json({error:e.message});
  }
});

// ==========================================================
// 📊 Statut moteur
// ==========================================================
app.get("/api/status",async(_,res)=>{
  try{
    const s=await getEngineState();
    res.json({
      status:s?.checkup?.engineStatus||s?.status||"IDLE",
      lastRun:s?.lastRun,
      models:s?.checkup?.models||{},
      alerts:s?.alertsLocal||[],
      alertsContinental:s?.alertsContinental||[],
      alertsWorld:s?.alertsWorld||[],
      errors:s?.errors||[],
      coveredZones:enumerateCoveredPoints(),
    });
  }catch(e){res.status(500).json({success:false,error:e.message});}
});

// ==========================================================
// 🌋 Alertes
// ==========================================================
app.get("/api/alerts",async(_,res)=>{
  try{res.json(await Alert.find().sort({certainty:-1}));}
  catch(e){await addEngineError(`Erreur récupération alertes: ${e.message}`,"alerts");res.status(500).json({success:false,error:e.message});}
});

// ==========================================================
// 📤 Export PDF d’une alerte
// ==========================================================
app.get("/api/alerts/export/:id",async(req,res)=>{
  try{
    const alert=await Alert.findById(req.params.id);
    if(!alert)return res.status(404).json({error:"Alerte introuvable"});
    const pdfBuffer=await createFullReportPDF(alert,"buffer");
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition",`attachment; filename=TINSFLASH_Alert_${alert._id}.pdf`);
    res.send(Buffer.from(pdfBuffer));
  }catch(e){
    await addEngineError(`Erreur export PDF: ${e.message}`,"alerts");
    res.status(500).json({success:false,error:e.message});
  }
});

// ==========================================================
// 📡 Flux SSE – Logs moteur
// ==========================================================
app.get("/api/logs/stream",(req,res)=>{
  res.setHeader("Content-Type","text/event-stream");
  res.setHeader("Cache-Control","no-cache");
  res.setHeader("Connection","keep-alive");
  res.flushHeaders();
  const send=l=>res.write(`data: ${JSON.stringify(l)}\n\n`);
  engineEvents.on("log",send);
  const ping=setInterval(()=>res.write(": ping\n\n"),20000);
  req.on("close",()=>{clearInterval(ping);engineEvents.off("log",send);});
});

// ==========================================================
// 🧭 Pages admin
// ==========================================================
["admin-pp.html","admin-alerts.html","admin-chat.html","admin-index.html","admin-radar.html","admin-users.html"]
  .forEach(p=>app.get(`/${p}`,(_,res)=>res.sendFile(path.join(__dirname,"public",p))));

// ==========================================================
const PORT=process.env.PORT||10000;
app.listen(PORT,()=>{
  console.log(`⚡ TINSFLASH PRO++ prêt sur port ${PORT}`);
  console.log("🌍 Zones couvertes:",enumerateCoveredPoints().length);
});
