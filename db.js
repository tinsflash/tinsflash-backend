// -------------------------
// 🔌 db.js
// Connexion MongoDB
// -------------------------
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ Erreur connexion MongoDB :", err.message);
    process.exit(1);
  }
};

export default connectDB;
