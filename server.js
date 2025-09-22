// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

// ✅ Imports internes (présents dans ton ZIP)
import { addLog, getLogs } from "./services/logsService.js";
import { chatWithJean } from "./services/chatService.js";
import forecastRoutes from "./routes/forecast.js";   // prévisions
import alertsRoutes from "./routes/alerts.js";       // alertes
import adminRoutes from "./routes/admin.js";         // console admin
import userRoutes from "./routes/user.js";           // ⚠️ CORRIGÉ (fichier = user.js)
import supercalcRoutes from "./routes/supercalc.js"; // supercalc/superforecast

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// -------------------------
// 🌍 Connexion MongoDB
// -------------------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => addLog("✅ Connecté à MongoDB"))
  .catch((err) => addLog("❌ Erreur MongoDB: " + err.message));

// -------------------------
// 🌍 Routes principales
// -------------------------

// ✅ Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Tinsflash Centrale Météo 🚀" });
});

// ✅ Logs en temps réel
app.get("/api/admin/logs", async (req, res) => {
  try {
    const logs = await getLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Chat IA J.E.A.N.
app.post("/api/admin/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message manquant" });

  try {
    addLog("💬 Question posée à J.E.A.N.: " + message);
    const response = await chatWithJean(message);
    addLog(`🤖 Réponse J.E.A.N. (${response.engine}): ${response.text}`);
    res.json(response);
  } catch (err) {
    addLog("❌ Erreur chatWithJean: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// 🌍 Brancher toutes les routes
// -------------------------
app.use("/api/forecast", forecastRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes); // ⚠️ corrigé pour "user.js"
app.use("/api/supercalc", supercalcRoutes);

// -------------------------
// 🌍 Lancement serveur
// -------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  addLog(`🚀 Serveur lancé sur le port ${PORT}`);
});
