// PATH: models/User.js
import mongoose from "mongoose";

const ConsentSchema = new mongoose.Schema({
  accepted: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  ip: { type: String, default: null },
});

const LocationSchema = new mongoose.Schema({
  country: { type: String, default: "" },
  region: { type: String, default: "" },
  city: { type: String, default: "" },
});

const UserSchema = new mongoose.Schema(
  {
    // ✅ Identité & contact
    email: { type: String, required: true, unique: true },
    name: { type: String, default: "" },

    // ✅ Abonnement (plan)
    plan: { type: String, enum: ["free", "premium", "pro", "pro+"], default: "free" },

    // ✅ Zone météo (pour stats internes)
    zone: { type: String, enum: ["covered", "non-covered"], default: "non-covered" },

    // ✅ Langue utilisateur
    lang: { type: String, default: "auto" }, // ex: fr, en, es, de...

    // ✅ Localisation
    location: { type: LocationSchema, default: () => ({}) },

    // ✅ Consentement RGPD
    consent: { type: ConsentSchema, default: () => ({}) },

    // ✅ Fan Club / Engagement
    fanClub: { type: Boolean, default: false },
    joinSource: { type: String, default: "tinsflash" }, // ex: index, mobile, campagne, etc.

    // ✅ Horodatage
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "users" }
);

const User = mongoose.model("User", UserSchema);
export default User;
