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
import Alert from "./models/
