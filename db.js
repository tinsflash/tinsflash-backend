import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/tinsflash";

mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    console.log("⏳ Connexion MongoDB...");
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // timeout clair
    });
    console.log("✅ MongoDB connecté avec succès !");
  } catch (err) {
    console.error("❌ Erreur connexion MongoDB:", err.message);
    process.exit(1);
  }
};

export default connectDB;
