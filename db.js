// db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("⏳ Tentative de connexion MongoDB...");

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connecté avec succès !");
  } catch (err) {
    console.error("❌ Erreur connexion MongoDB:", err.message);

    // Affiche aussi l’URI tronqué (juste pour debug, pas complet pour sécurité)
    if (process.env.MONGO_URI) {
      console.error("🔑 URI fourni:", process.env.MONGO_URI.substring(0, 50) + "...");
    } else {
      console.error("⚠️ Aucun MONGO_URI défini dans les variables Render !");
    }

    process.exit(1); // Stoppe le serveur
  }
};

export default connectDB;
