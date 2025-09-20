// -------------------------
// 📦 db.js
// Connexion MongoDB robuste avec fallback
// -------------------------
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

async function connectDB() {
  if (!MONGO_URI) {
    console.warn("⚠️ Aucun MONGO_URI défini → le serveur tourne sans base de données !");
    return;
  }

  try {
    console.log("🔌 Tentative de connexion MongoDB...");
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10s timeout
    });

    console.log("✅ Connexion MongoDB réussie !");
  } catch (err) {
    console.error("❌ Erreur de connexion MongoDB :", err.message);
    console.warn("⚠️ Le serveur continue en mode SANS DB (backup mémoire locale).");
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ Déconnecté de MongoDB. Tentative de reconnexion automatique...");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("🔄 Reconnexion MongoDB réussie !");
  });
}

export default connectDB;
