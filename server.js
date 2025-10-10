// ==========================================================
// 🌍 TINSFLASH – server.js (Everest Protocol v3.8 PRO+++)
// ==========================================================
// Moteur global IA J.E.A.N – 100 % réel, 100 % connecté
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
import { runWorldAlerts } from "./services/runWorldAlerts.js";
import Alert from "./models/Alert.js";
import * as chatService from "./services/chatService.js";
// ✅ Import inchangé mais cohérent avec forecastService
import { generateForecast } from "./services/forecastService.js";

// ... (tout le reste de ton fichier identique, inchangé)
