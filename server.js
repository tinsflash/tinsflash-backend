// ==========================================================
// 🌍 TINSFLASH PRO+++ — Central Meteorological Engine
// Core Atomic Meteorological Server (Everest Protocol v3.0)
// ==========================================================

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { runGlobalEurope } from "./services/runGlobalEurope.js";
import { runGlobalUSA } from "./services/runGlobalUSA.js";
import { runWorld } from "./services/runWorld.js";
import { analyzeSuperForecast } from "./services/superForecast.js";
import { logEngineState, getEngineStatus } from "./services/engineState.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================
// 🧠 Connexion MongoDB
// ============================
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB :", err));

// ============================
// ⚙️ ROUTES MOTEUR
// ============================

// Lancer extraction Europe + USA
app.get("/api/run/europe-usa", async (req, res) => {
  try {
    await logEngineState("Démarrage extraction Europe + USA");
    const europe = await runGlobalEurope();
    const usa = await runGlobalUSA();
    await logEngineState("✅ Extraction Europe+USA terminée");
    res.json({ status: "ok", europe, usa });
  } catch (err) {
    console.error("Erreur run Europe-USA :", err);
    await logEngineState("❌ Erreur Europe-USA : " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// Lancer extraction reste du monde
app.get("/api/run/world", async (req, res) => {
  try {
    await logEngineState("Démarrage extraction Monde complet");
    const result = await runWorld();
    await logEngineState("✅ Extraction Monde terminée");
    res.json({ status: "ok", result });
  } catch (err) {
    console.error("Erreur run Monde :", err);
    await logEngineState("❌ Erreur Monde : " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// Analyse IA J.E.A.N.
app.get("/api/run/analyze", async (req, res) => {
  try {
    await logEngineState("Analyse IA J.E.A.N. en cours...");
    const result = await analyzeSuperForecast();
    await logEngineState("✅ Analyse IA terminée");
    res.json({ status: "ok", result });
  } catch (err) {
    console.error("Erreur analyse :", err);
    await logEngineState("❌ Erreur analyse : " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// Statut moteur
app.get("/api/status", async (req, res) => {
  const status = await getEngineStatus();
  res.json(status);
});

// ============================
// 🌐 INTERFACE PUBLIQUE
// ============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================
// 🚀 LANCEMENT DU SERVEUR
// ============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur TINSFLASH lancé sur le port ${PORT}`);
});
