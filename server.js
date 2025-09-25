// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// === Services (imports alignés aux exports réels) ===
import forecastService from "./services/forecastService.js";
import runSuperForecast from "./services/superForecast.js";
import radarService from "./services/radarService.js";
import generateBulletin from "./services/bulletinService.js";
import { chatWithJean } from "./services/chatService.js";
import { addLog } from "./services/logsService.js";
import checkCoverage from "./services/checkCoverage.js";

// === DB Models ===
import Forecast from "./models/Forecast.js";
import Alert from "./models/Alert.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// === Resolve __dirname for ES modules ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Serve static HTML files ===
app.use(express.static(path.join(__dirname, "public")));

// Route explicite pour tes fichiers HTML (admin, index, etc.)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin-pp.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-pp.html"));
});

app.get("/alerts.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "alerts.html"));
});

app.get("/proplus.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "proplus.html"));
});

app.get("/admin-chat.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-chat.html"));
});

// === MongoDB connection ===
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ==============================
// 📡 API ROUTES
// ==============================

// (⚡ je n’ai rien modifié ici → ton code API reste inchangé)

// ==============================
// 🚀 START SERVER
// ==============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
