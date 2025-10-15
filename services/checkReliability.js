// services/checkReliability.js
import mongoose from "mongoose";

export async function checkReliability() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;
  const col = db.collection("forecasts_ai_points");
  const res = await col.aggregate([{ $group: { _id: null, avgReliability: { $avg: "$reliability_pct" } } }]).toArray();
  const avg = res[0]?.avgReliability || 0;
  await mongoose.disconnect();
  return { reliability_pct: Math.round(avg * 100) / 100 };
}
