// services/checkCoverage.js
import { COVERAGE } from "../utils/zones.js";
import User from "../models/User.js";
import { addLog } from "./adminLogs.js";

export default async function checkCoverage(req, res, next) {
  try {
    const { lat, lon, userId } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude et longitude requises" });
    }

    let zone = "other";
    if (lon >= -130 && lon <= -60 && lat >= 25 && lat <= 50) {
      zone = "usa";
    } else if (lon >= -30 && lon <= 40 && lat >= 35 && lat <= 70) {
      zone = "europe";
    }

    if (COVERAGE[zone]) {
      return next();
    }

    const user = await User.findById(userId).exec();
    if (user) {
      if (user.subscription === "premium") {
        addLog(`⚠️ Premium hors zone détecté : ${user.email} (${lat}, ${lon})`);
        return next();
      } else {
        addLog(`🛑 Utilisateur gratuit hors zone : ${user.email || "unknown"} (${lat}, ${lon})`);
      }
    } else {
      addLog(`🆕 Nouvel utilisateur non identifié hors zone (${lat}, ${lon})`);
    }

    return res.status(403).json({
      error: "Zone non encore couverte",
      message:
        "Les prévisions complètes seront activées pour votre région prochainement. Passez en Premium pour accélérer l’ouverture.",
    });
  } catch (err) {
    addLog(`❌ Erreur middleware checkCoverage: ${err.message}`);
    return res.status(500).json({ error: "Erreur interne serveur" });
  }
}
