// db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connecté avec succès !");
  } catch (err) {
    console.error("❌ Erreur connexion MongoDB :", err.message);
    process.exit(1);
  }
};

export default connectDB;
