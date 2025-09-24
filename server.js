// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// === Services ===
import forecastService from "./services/forecastService.js";
import superForecast from "./services/superForecast.js";
import alertsService from "./services/alertsService.js";
import radarService from "./services/radarService.js";
import podcastService from "./services/podcastService.js";
import chatService from "./services/chatService.js";

// === DB Models ===
import Alert from "./models/Alert.js";

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
app.get("/api/forecast", forecastService.getForecast);

// Super forecast
app.get("/api/superforecast", superForecast.run);

// Alertes
app.get("/api/alerts", alertsService.getAlerts);
app.post("/api/alerts", alertsService.createAlert);

// Radar
app.get("/api/radar", radarService.fetchRadar);

// Podcasts (⚠️ mode DEBUG pour l’instant)
app.get("/api/podcast", podcastService.fetchPodcast);

// Chat IA
app.post("/api/chat", chatService.chat);

// ==============================
// ✅ Server ready
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
