// models/EngineState.js
import mongoose from "mongoose";

const ErrorSchema = new mongoose.Schema({
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const EngineStateSchema = new mongoose.Schema({
  status: { 
    type: String, 
    default: "idle", // idle, running, ok, fail
  },
  lastRun: { 
    type: Date, 
    default: null 
  },
  checkup: { 
    type: Object, 
    default: {} 
  },
  errors: { 
    type: [ErrorSchema], 
    default: [] 
  },
});

// ✅ Export du modèle
export default mongoose.model("EngineState", EngineStateSchema);
