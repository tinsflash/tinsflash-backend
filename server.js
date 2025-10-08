// ==========================================================
// 🌍 TINSFLASH – Central Meteorological Engine (Everest Protocol v2.6 PRO++)
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
app.use(
  cors({
    origin: "*",
    methods: ["GET","POST","PUT","DELETE"],
    allowedHeaders: ["Content-Type","Authorization"],
  })
);

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
  try{
    const r=await fetch("https://unpkg.com/three@0.161.0/build/three.module.js");
    res.type("application/javascript").send(await r.text());
  }catch{res.status(500).send("// erreur module three.js")}
});
app.get("/OrbitControls.js",async(_,res)=>{
  try{
    const r=await fetch("https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js");
    res.type("application/javascript").send(await r.text());
  }catch{res.status(500).send("// erreur module OrbitControls")}
});

// ==========================================================
// 🔌 MongoDB
// ==========================================================
if(process.env.MONGO_URI){
  mongoose.connect(process.env.MONGO_URI,{useNewUrlParser:true,useUnifiedTopology:true})
    .then(()=>console.log("✅ MongoDB connecté"))
    .catch(e=>console.error("❌ Erreur MongoDB:",e.message));
}else console.error("⚠️ MONGO_URI manquant");

// ==========================================================
app.get("/",(_,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

// ==========================================================
// 🚀 Run global
// ==========================================================
app.post("/api/run-global",async(req,res)=>{
  try{
    await checkSourcesFreshness();
    const zone=req.body?.zone||"All";
    const r=await runGlobal(zone);
    await addEngineLog(`⚙️ Extraction complète ${zone}`,"success","runGlobal");
    res.json({success:true,result:r});
  }catch(e){
    await addEngineError(`Erreur extraction: ${e.message}`,"runGlobal");
    res.status(500).json({success:false,error:e.message});
  }
});

// ==========================================================
// 🧠 Analyse IA J.E.A.N.
// ==========================================================
app.post("/api/ai-analyse",async(_,res)=>{
  try{
    const r=await runAIAnalysis();
    await addEngineLog("🧠 Analyse IA J.E.A.N terminée","success","IA");
    res.json({success:true,result:r});
  }catch(e){
    await addEngineError(`Erreur IA J.E.A.N: ${e.message}`,"IA");
    res.status(500).json({success:false,error:e.message});
  }
});

// ==========================================================
// 📊 Status
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
// 💬 IA publique Cohere
// ==========================================================
app.post("/api/cohere",async(req,res)=>{
  try{
    const {question}=req.body;
    if(!question)return res.status(400).json({error:"Question invalide"});
    const {reply,avatar}=await askCohere(question);
    await addEngineLog(`💬 Question publique: "${question}"`,"info","Cohere");
    res.json({success:true,reply,avatar:`/avatars/jean-${avatar}.png`});
  }catch(e){
    await addEngineError(`Erreur Cohere: ${e.message}`,"Cohere");
    res.status(500).json({success:false,reply:"Erreur interne"});
  }
});

// ==========================================================
// 💬 IA admin
// ==========================================================
app.post("/api/ai-admin",async(req,res)=>{
  try{
    const {message,mode}=req.body;
    if(!message)return res.status(400).json({success:false,error:"Message vide"});
    const r=await chatService.askAIAdmin(message,mode||"moteur");
    await addEngineLog(`💬 Console admin (${mode}) : "${message}"`,"info","admin");
    res.json({success:true,reply:r});
  }catch(e){
    await addEngineError(`Erreur IA admin: ${e.message}`,"admin");
    res.status(500).json({success:false,error:e.message});
  }
});

// ==========================================================
// 🌋 Alertes
// ==========================================================
app.get("/api/alerts",async(_,res)=>{
  try{res.json(await Alert.find().sort({certainty:-1}));}
  catch(e){await addEngineError(`Erreur alertes: ${e.message}`,"alerts");res.status(500).json({success:false,error:e.message});}
});

// ==========================================================
// 📤 Export PDF / expert
// ==========================================================
app.all("/api/alerts/export/:id",async(req,res)=>{
  try{
    const alert=await Alert.findById(req.params.id);
    if(!alert)return res.status(404).json({error:"Not found"});
    const mode=req.query.mode||req.body.mode||"simple";
    const pdf=await createFullReportPDF(alert,mode);
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition",`attachment; filename=TINSFLASH_Alert_${alert._id}.pdf`);
    res.send(Buffer.from(pdf));
  }catch(e){
    await addEngineError(`Erreur export: ${e.message}`,"alerts");
    res.status(500).json({error:e.message});
  }
});

// ==========================================================
// 📡 Logs SSE
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
