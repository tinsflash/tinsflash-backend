// db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Erreur connexion MongoDB :", error.message);
    process.exit(1); // stoppe le serveur si DB KO
  }
};

export default connectDB;
