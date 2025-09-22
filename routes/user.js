// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import forecastRoutes from "./routes/forecast.js";
import alertRoutes from "./routes/alerts.js";
import bulletinRoutes from "./routes/bulletins.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/user.js"; // ✅ corrigé (singulier)

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes principales
app.use("/api/forecast", forecastRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/bulletins", bulletinRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes); // ✅ corrigé (singulier)

// Page d’accueil
app.get("/", (req, res) => {
  res.send("🚀 Tinsflash Backend – Centrale Nucléaire Météo en marche !");
});

// Connexion MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB :", err));

// Lancer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
