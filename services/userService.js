// PATH: services/userService.js
import User from "../models/User.js";
import geoip from "geoip-lite";

/**
 * ✅ Inscription utilisateur (Fan Club ou Premium)
 * Données minimales : email (obligatoire)
 * Optionnelles : nom, plan, localisation, langue, consentement RGPD
 */
export async function registerUser(data) {
  try {
    if (!data.email) throw new Error("Email manquant");

    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing)
      return { success: true, message: "Déjà inscrit ✅", user: existing };

    // 🌍 Détection automatique localisation (fallback IP)
    let geo = {};
    if (data.ip) {
      const g = geoip.lookup(data.ip);
      if (g) geo = { country: g.country, region: g.region, city: g.city };
    }

    const user = new User({
      email: data.email.toLowerCase(),
      name: data.name || "",
      plan: data.plan || "free",
      lang: data.lang || "auto",
      location: data.location || geo,
      consent: {
        accepted: data.consent?.accepted ?? false,
        date: data.consent?.date || new Date(),
        ip: data.ip || null,
      },
      zone: data.zone || "non-covered",
      type: data.plan?.toLowerCase() || "free",
      createdAt: new Date(),
    });

    await user.save();
    return { success: true, message: "Inscription réussie 🎉", user };
  } catch (err) {
    console.error("❌ registerUser error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * ✅ Désinscription utilisateur (Fan Club / Premium)
 * Supprime les données conformément au RGPD
 */
export async function unregisterUser(email) {
  try {
    if (!email) throw new Error("Email requis");
    const result = await User.deleteOne({ email: email.toLowerCase() });
    return result.deletedCount > 0
      ? { success: true, message: "Utilisateur supprimé (RGPD ✔️)" }
      : { success: false, message: "Utilisateur non trouvé" };
  } catch (err) {
    console.error("❌ unregisterUser error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * ✅ Liste complète (pour console admin)
 */
export async function getAllUsers() {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return users;
  } catch (err) {
    console.error("❌ getAllUsers error:", err.message);
    return [];
  }
}

/**
 * ✅ Statistiques globales (Dashboard admin)
 */
export async function getUserStats() {
  try {
    const users = await User.aggregate([
      { $group: { _id: "$plan", count: { $sum: 1 } } },
    ]);

    const stats = { free: 0, premium: 0, pro: 0 };
    users.forEach((u) => {
      stats[u._id] = u.count;
    });

    const total = users.reduce((sum, u) => sum + u.count, 0);
    return { ...stats, total };
  } catch (err) {
    console.error("❌ User stats error:", err.message);
    return { free: 0, premium: 0, pro: 0, total: 0 };
  }
}

/**
 * ✅ Mise à jour consentement RGPD
 */
export async function updateConsent(email, consent) {
  try {
    if (!email) throw new Error("Email requis");
    const updated = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        $set: {
          "consent.accepted": consent.accepted,
          "consent.date": new Date(),
        },
      },
      { new: true }
    );
    return { success: true, user: updated };
  } catch (err) {
    console.error("❌ updateConsent error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * ✅ Vérifie si un email est déjà inscrit
 */
export async function checkUserExists(email) {
  try {
    if (!email) return false;
    const user = await User.findOne({ email: email.toLowerCase() });
    return !!user;
  } catch (err) {
    console.error("❌ checkUserExists error:", err.message);
    return false;
  }
}

export default {
  registerUser,
  unregisterUser,
  getAllUsers,
  getUserStats,
  updateConsent,
  checkUserExists,
};
