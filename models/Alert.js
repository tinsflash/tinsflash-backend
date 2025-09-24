// models/Alert.js
import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema({
  type: { type: String, required: true },        // Ex: pluie, vent, neige, orage
  level: { type: String, required: true },       // Ex: jaune, orange, rouge
  certainty: { type: Number, required: true },   // % de certitude (70-100)
  description: { type: String },                 // Explication textuelle
  location: { type: String },                    // Pays / région / zone
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Alert", AlertSchema);
