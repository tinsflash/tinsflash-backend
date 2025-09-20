import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import superForecast from "./services/superForecast.js";
import Forecast from "./models/Forecast.js";
import Alert from "./models/Alerts.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// API : Lancer un run (uniquement admin)
app.post("/api/supercalc/run", async (req, res) => {
  try {
    const result = await superForecast();
    const forecast = new Forecast(result);
    await forecast.save();
    res.json({ success: true, forecast });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API : Dernier forecast (utilisé par index)
app.get("/api/forecast/latest", async (req, res) => {
  const last = await Forecast.findOne().sort({ createdAt: -1 });
  res.json(last || { message: "Pas de prévisions disponibles" });
});

// API : Alertes
app.get("/api/alerts", async (req, res) => {
  const alerts = await Alert.find().sort({ createdAt: -1 }).limit(5);
  res.json(alerts);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on ${PORT}`));
