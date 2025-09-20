// db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("⏳ Tentative de connexion MongoDB...");

    if (!process.env.MONGO_URI) {
      throw new Error("⚠️ Variable MONGO_URI non définie dans Render !");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // timeout rapide
    });

    console.log("✅ MongoDB connecté avec succès !");
  } catch (err) {
    console.error("❌ Erreur connexion MongoDB :", err.message);

    // Affiche l'URI tronqué pour debug (sécurisé)
    if (process.env.MONGO_URI) {
      console.error("🔑 URI (début) :", process.env.MONGO_URI.substring(0, 50) + "...");
    }

    process.exit(1); // stoppe le serveur si échec DB
  }
};

export default connectDB;
