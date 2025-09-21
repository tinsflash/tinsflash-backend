// services/checkCoverage.js
import { COVERAGE } from "../utils/zones.js";
import User from "../models/User.js"; // modèle MongoDB utilisateur (à créer si pas encore)

export default async function checkCoverage(req, res, next) {
  try {
    const { lat, lon, userId } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude et longitude requises" });
    }

    // Déterminer la zone géographique
    let zone = "other";
    if (lon >= -130 && lon <= -60 && lat >= 25 && lat <= 50) {
      zone = "usa";
    } else if (lon >= -30 && lon <= 40 && lat >= 35 && lat <= 70) {
      zone = "europe";
    }

    // Vérifier la couverture
    if (COVERAGE[zone]) {
      return next(); // ✅ zone active
    }

    // Sinon → vérifier si Premium
    const user = await User.findById(userId).exec();
    if (user && user.subscription === "premium") {
      // ✅ Extension automatique → log admin
      console.log(`⚠️ Premium hors zone : ${user.email} (${lat}, ${lon})`);
      // TODO : notifier admin par email ou dashboard
      return next();
    }

    // Sinon → bloquer avec message clair
    return res.status(403).json({
      error: "Zone non encore couverte",
      message: "Les prévisions complètes seront activées pour votre région prochainement. Passez en Premium pour accélérer l’ouverture."
    });
  } catch (err) {
    console.error("❌ Erreur middleware checkCoverage:", err);
    return res.status(500).json({ error: "Erreur interne serveur" });
  }
}
