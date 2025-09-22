// models/Bulletin.js
import mongoose from "mongoose";

const bulletinSchema = new mongoose.Schema({
  country: { type: String, required: true }, // ex: BE, FR, LU
  type: { type: String, enum: ["local", "national"], required: true },
  textGenerated: { type: String, required: true }, // texte auto IA
  textEdited: { type: String, default: "" }, // corrections admin
  date: { type: Date, default: Date.now }
});

export default mongoose.model("Bulletin", bulletinSchema);
