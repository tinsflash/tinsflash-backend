// services/engineState.js
import mongoose from "mongoose";

const ErrorSchema = new mongoose.Schema({
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const LogSchema = new mongoose.Schema({
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const EngineStateSchema = new mongoose.Schema({
  status: { type: String, default: "idle" }, // idle, running, ok, fail
  lastRun: { type: Date, default: null },
  checkup: { type: Object, default: {} },
  errors: { type: [ErrorSchema], default: [] },
  logs: { type: [LogSchema], default: [] },
});

// ✅ On force toujours la présence de checkup avec un engineStatus
EngineStateSchema.pre("save", function (next) {
  if (!this.checkup) this.checkup = {};
  if (!this.checkup.engineStatus) this.checkup.engineStatus = "IDLE";
  next();
});

// ✅ Helpers centralisés
EngineStateSchema.methods.addLog = function (msg) {
  this.logs.unshift({ message: msg, timestamp: new Date() });
  if (this.logs.length > 200) this.logs.pop(); // limite mémoire
};

EngineStateSchema.methods.addError = function (msg) {
  this.errors.unshift({ message: msg, timestamp: new Date() });
  if (this.errors.length > 200) this.errors.pop();
};

export default mongoose.model("EngineState", EngineStateSchema);
