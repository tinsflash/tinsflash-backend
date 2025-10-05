// ✅ services/superForecast.js
// Moteur principal TINSFLASH – Fusion modèles + IA (J.E.A.N.)

import modelsFetcher from "./modelsFetcher.js";
import EngineState from "../models/EngineState.js";
import axios from "axios";

export default async function superForecast(lat = 50.5, lon = 4.7) {
  console.log("⚙️ Lancement du moteur J.E.A.N...");
  const engine = await EngineState.findOne() || new EngineState();

  engine.status = "running";
  engine.lastRun = new Date();
  engine.logs.push({ message: "Démarrage du moteur", timestamp: new Date() });
  await engine.save();

  const { okModels, failed } = await modelsFetcher.testAllModels(lat, lon);
  engine.checkup = {
    models_ok: okModels.map((m) => m.name),
    models_fail: failed.map((m) => m.name),
    time: new Date(),
  };

  // Simulation de fusion IA (réel dans version prod : pondération par modèle)
  const forecasts = [];
  for (const model of okModels) {
    try {
      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`
      );
      forecasts.push({ model: model.name, data: res.data });
    } catch (err) {
      engine.errors.push({ message: `Erreur fusion ${model.name}: ${err.message}`, timestamp: new Date() });
    }
  }

  engine.status = failed.length === 0 ? "ok" : "partial";
  engine.logs.push({
    message: `Prévisions fusionnées avec ${okModels.length} modèles réussis / ${failed.length} en échec.`,
    timestamp: new Date(),
  });
  await engine.save();

  console.log("✅ Moteur terminé : ", engine.status);
  return forecasts;
}
