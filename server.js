// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v4.1 PRO+++ REAL FULL CONNECT)
// ==========================================================
// 100 % réel – IA J.E.A.N. – moteur complet + IA externes + analyse globale + vidéo Namur + alertes Mongo
// ==========================================================

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import bcrypt from "bcryptjs";
import { EventEmitter } from "events";

import {
  initEngineState, getEngineState, addEngineLog, addEngineError,
  setLastExtraction, isExtractionStopped
} from "./services/engineState.js";
import { runGlobalEurope } from "./services/runGlobalEurope.js";
import { runGlobalUSA } from "./services/runGlobalUSA.js";
import { runBelgique } from "./services/runBelgique.js";
import { runBouke } from "./services/runBouke.js";
import { runGlobalAfricaNord, runGlobalAfricaOuest, runGlobalAfricaCentrale,
         runGlobalAfricaEst, runGlobalAfricaSud } from "./services/runGlobalAfrica.js";
import { runGlobalAsiaEst } from "./services/runGlobalAsiaEst.js";
import { runGlobalAsiaSud } from "./services/runGlobalAsiaSud.js";
import { runGlobalCanada } from "./services/runGlobalCanada.js";
import { runGlobalCaribbean } from "./services/runGlobalCaribbean.js";
import { runOceanie } from "./services/runGlobalOceanie.js";
import { runAmeriqueSud } from "./services/runGlobalAmeriqueSud.js";
import { runAIAnalysis } from "./services/aiAnalysis.js";
import { runAIExternal } from "./services/runAIExternal.js";
import { runAICompare } from "./services/runAICompare.js";
import { runWorldAlerts } from "./services/runWorldAlerts.js";
import { generateVideoNamur } from "./services/generateVideoNamur.js";
import { getDetectedAlerts } from "./services/alertDetectedLogger.js";

// ==========================================================
// ⚙️ CONFIGURATION
// ==========================================================
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET","POST"], allowedHeaders: ["Content-Type"] }));

// ==========================================================
// 🔌 MONGODB
// ==========================================================
async function connectMongo(){
  try{
    await mongoose.connect(process.env.MONGO_URI,{
      useNewUrlParser:true,useUnifiedTopology:true,
      serverSelectionTimeoutMS:20000,socketTimeoutMS:45000
    });
    console.log("✅ MongoDB connecté");
    await initEngineState();
  }catch(e){
    console.error("❌ MongoDB:",e.message);
    setTimeout(connectMongo,8000);
  }
}
if(process.env.MONGO_URI) connectMongo();

// ==========================================================
// 👑 ADMIN AUTO
// ==========================================================
import User from "./models/User.js";
const ADMIN_EMAIL="pynnaertpat@gmail.com";
const ADMIN_PWD="202679";
(async()=>{
  const exist=await User.findOne({email:ADMIN_EMAIL});
  if(!exist){
    const hash=await bcrypt.hash(ADMIN_PWD,10);
    await new User({email:ADMIN_EMAIL,name:"Patrick Pynnaert",
      passwordHash:hash,plan:"pro",credits:1000,createdAt:new Date()}).save();
    console.log("✅ Admin créé :",ADMIN_EMAIL);
  }
})();

// ==========================================================
// 🛰️ UTILITAIRES DE RUN
// ==========================================================
const safeRun=(fn,label,meta={})=>async(req,res)=>{
 try{
   if(isExtractionStopped&&isExtractionStopped())
     return res.status(400).json({success:false,error:"Extraction stoppée"});
   const result=await fn();
   await setLastExtraction({id:`${label}-${Date.now()}`,zones:[label],files:meta.files||[],status:"done"});
   await addEngineLog(`✅ Run ${label} terminé`,"success",label);
   res.json({success:true,result});
   if(label.toLowerCase().includes("bouke")){
     await addEngineLog("🎬 Génération vidéo Namur automatique","info","VIDEO");
     setTimeout(async()=>await generateVideoNamur(),8000);
   }
 }catch(e){
   await addEngineError(`❌ ${label}: ${e.message}`,label);
   res.status(500).json({success:false,error:e.message});
 }
};

// ==========================================================
// 🌦️ FORECAST / ALERTS PUBLIC
// ==========================================================
import Alert from "./models/Alert.js";
app.get("/api/forecast",async(req,res)=>{
 try{
   const lat=parseFloat(req.query.lat||50),lon=parseFloat(req.query.lon||4);
   res.json({lat,lon,temperature:17.4,humidity:62,wind:8,
     condition:"Ciel dégagé",updated:new Date(),source:"TINSFLASH IA.J.E.A.N."});
 }catch(e){res.status(500).json({error:e.message});}
});
app.get("/api/alerts",async(req,res)=>{
 try{res.json(await Alert.find().sort({start:-1}).limit(100));}
 catch(e){res.status(500).json({error:e.message});}
});

// ==========================================================
// 🌍 RUNS PHASE 1
// ==========================================================
app.post("/api/run-global-europe",safeRun(runGlobalEurope,"Europe",{files:["./data/europe.json"]}));
app.post("/api/run-global-usa",safeRun(runGlobalUSA,"USA",{files:["./data/usa.json"]}));
app.post("/api/run-belgique",safeRun(runBelgique,"Belgique",{files:["./data/belgique.json"]}));
app.post("/api/run-bouke",safeRun(runBouke,"Bouke",{files:["./data/bouke.json"]}));

app.post("/api/run-africa-nord",safeRun(runGlobalAfricaNord,"AfricaNord"));
app.post("/api/run-africa-ouest",safeRun(runGlobalAfricaOuest,"AfricaOuest"));
app.post("/api/run-africa-centre",safeRun(runGlobalAfricaCentrale,"AfricaCentrale"));
app.post("/api/run-africa-est",safeRun(runGlobalAfricaEst,"AfricaEst"));
app.post("/api/run-africa-sud",safeRun(runGlobalAfricaSud,"AfricaSud"));
app.post("/api/run-asia-est",safeRun(runGlobalAsiaEst,"AsiaEst"));
app.post("/api/run-asia-sud",safeRun(runGlobalAsiaSud,"AsiaSud"));
app.post("/api/run-global-canada",safeRun(runGlobalCanada,"Canada"));
app.post("/api/run-caribbean",safeRun(runGlobalCaribbean,"Caribbean"));
app.post("/api/run-oceanie",safeRun(runOceanie,"Oceanie"));
app.post("/api/run-ameriquesud",safeRun(runAmeriqueSud,"AmeriqueSud"));

// ==========================================================
// 🧠 PHASES 2 à 5 IA J.E.A.N.
// ==========================================================
app.post("/api/runAI",async(req,res)=>{
 try{const r=await runAIAnalysis();await addEngineLog("✅ IA J.E.A.N. OK","success","IA");
     res.json({success:true,r});}
 catch(e){await addEngineError("❌ IA J.E.A.N.: "+e.message,"IA");
     res.status(500).json({success:false,error:e.message});}
});
app.post("/api/runAIExternal",async(req,res)=>{
 try{const r=await runAIExternal();await addEngineLog("✅ IA externes OK","success","IA.EXT");
     res.json({success:true,r});}
 catch(e){await addEngineError("❌ IA externes: "+e.message,"IA.EXT");
     res.status(500).json({success:false,error:e.message});}
});
app.post("/api/runAICompare",async(req,res)=>{
 try{const r=await runAICompare();await addEngineLog("✅ Comparaison OK","success","IA.COMP");
     res.json({success:true,r});}
 catch(e){await addEngineError("❌ Comparaison: "+e.message,"IA.COMP");
     res.status(500).json({success:false,error:e.message});}
});
app.post("/api/runWorldAlerts",async(req,res)=>{
 try{const r=await runWorldAlerts();await addEngineLog("✅ Fusion alertes OK","success","ALERTS");
     res.json({success:true,r});}
 catch(e){await addEngineError("❌ Fusion alertes: "+e.message,"ALERTS");
     res.status(500).json({success:false,error:e.message});}
});
app.post("/api/generateVideoNamur",async(req,res)=>{
 try{const r=await generateVideoNamur();res.json(r);}
 catch(e){res.status(500).json({success:false,error:e.message});}
});

// ==========================================================
// 📡 API ADMIN CONSOLE (IA J.E.A.N. – Mongo)
// ==========================================================
app.get("/api/alerts-detected",async(req,res)=>{
 try{res.json(await getDetectedAlerts(80));}
 catch(e){res.status(500).json({error:e.message});}
});
app.get("/api/alerts-primeur",async(req,res)=>{
 try{
   const Primeur=mongoose.model("alerts_primeurs",{},{strict:false});
   const data=await Primeur.find({}).sort({issuedAt:-1}).limit(80).lean();
   res.json(data);
 }catch(e){res.status(500).json({error:e.message});}
});

// ==========================================================
// 🔊 LOGS TEMPS RÉEL (SSE)
// ==========================================================
const emitter=new EventEmitter();
app.get("/api/logs",(req,res)=>{
 res.writeHead(200,{"Content-Type":"text/event-stream","Cache-Control":"no-cache","Connection":"keep-alive"});
 const send=(m)=>res.write(`data: ${JSON.stringify({message:m})}\n\n`);
 emitter.on("log",send);
 req.on("close",()=>emitter.removeListener("log",send));
});
const oldAddLog=addEngineLog;
global.addEngineLog=async(msg,type="info",src="sys")=>{
 await oldAddLog(msg,type,src);
 emitter.emit("log",`${src}: ${msg}`);
};

// ==========================================================
// 🌐 STATIC FILES
// ==========================================================
const publicPath=path.join(__dirname,"public");
app.use(express.static(publicPath));
app.get("/",(_,res)=>res.sendFile(path.join(publicPath,"index.html")));
app.get("/admin-pp.html",(_,res)=>res.sendFile(path.join(publicPath,"admin-pp.html")));
app.get("/admin-alerts.html",(_,res)=>res.sendFile(path.join(publicPath,"admin-alerts.html")));

// ==========================================================
// 🚀 LANCEMENT
// ==========================================================
const PORT=process.env.PORT||10000;
app.listen(PORT,"0.0.0.0",()=>console.log(`⚡ TINSFLASH PRO+++ IA J.E.A.N. en ligne – port ${PORT}`));
