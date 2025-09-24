// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// === Services ===
import superForecast from "./services/superForecast.js";
import forecastService from "./services/forecastService.js";
import alertsService from "./services/alertsService.js";
import radarService from "./services/radarService.js";
import podcastService from "./services/podcastService.js";
import chatService from "./services/chatService.js";   // ✅ Import corrigé (pas "* as")

// === DB Models ===
import Forecast from "./models/Forecast.js";
import Alert from "./models/Alert.js";   // ✅ Vérifié : ton zip a bien Alert.js (pas Alerts.js)

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// === MongoDB connection ===
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ==============================
// 📡 API ROUTES
// Prévisions
app.use("/api/forecast", forecastService);

// Fusion multi-modèles IA
app.use("/api/superforecast", superForecast);

// Alertes météo
app.use("/api/alerts", alertsService);

// Radar
app.use("/api/radar", radarService);

// Podcast météo
app.use("/api/podcast", podcastService);

// Chat IA (J.E.A.N.)
app.use("/api/chat", chatService);   // ✅ Correctement branché

// ==============================
// PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
