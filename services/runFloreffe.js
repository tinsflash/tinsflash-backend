// ==========================================================
// 🌍 TINSFLASH — runFloreffe.js  (Everest Protocol v6.3-PRO+++)
// ==========================================================
// 🔸 Commune pilote : Floreffe (Belgique)
// 🔸 Phases intégrées : 1 (Extraction) + 2 (IA locale) + 5 (Export)
// ==========================================================

import dotenv from "dotenv";
import fs from "fs";
import axios from "axios";
import { MongoClient } from "mongodb";
import OpenAI from "openai";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError } from "./engineState.js";
dotenv.config();

// ==========================================================
// 🛰️ Captures satellite Phase 1 — sources fixes
// ==========================================================
const SAT_SOURCES = {
  europeZoom:
    "https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=2025-10-16&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor&CRS=EPSG:4326&BBOX=4.72,50.40,4.80,50.46&FORMAT=image/png&WIDTH=1200&HEIGHT=900",
  zoomFloreffe:
    "https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=2025-10-16&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor&CRS=EPSG:4326&BBOX=4.749,50.444,4.785,50.462&FORMAT=image/png&WIDTH=1200&HEIGHT=900"
};

// ==========================================================
// ⚙️ Seuils d’alerte calibrés Floreffe (anticipatifs)
// ==========================================================
const ALERT_THRESHOLDS = {
  rain: { prealert: 5, alert: 15, extreme: 35, unit: "mm/h" },
  snow: { prealert: 0.8, alert: 2, extreme: 6, unit: "cm/h" },
  wind: { prealert: 55, alert: 70, extreme: 95, unit: "km/h" },
  heat: { prealert: 29, alert: 34, extreme: 38, unit: "°C" },
  cold: { prealert: -3, alert: -7, extreme: -12, unit: "°C" },
  humidity: { prealert: 93, alert: 97, extreme: 100, unit: "%" },
  visionia: { prealert: 70, alert: 82, extreme: 90, unit: "%" }
};

// ---------- 60 POINTS GÉOGRAPHIQUES — Couverture complète du territoire
// lat/lon approximatifs réalistes (à affiner au besoin). altitude ~ indicative (m).
const FLOREFFE_POINTS = [
  { id:'FLO_01', name:'Maison communale', lat:50.4368, lon:4.7562, alt:92,  type:'urbain',   risk:{flood:true, verglas:true, wind:false},    sensor:false, prio:'high' },
  { id:'FLO_02', name:'CPAS Floreffe',    lat:50.4374, lon:4.7555, alt:95,  type:'public',   risk:{flood:false, verglas:true, wind:false},   sensor:false, prio:'med'  },
  { id:'FLO_03', name:'Abbaye de Floreffe (plateau)', lat:50.4386, lon:4.7531, alt:138, type:'plateau', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_04', name:'Rue du Séminaire (école)', lat:50.4366, lon:4.7586, alt:97, type:'école', risk:{flood:false, verglas:true, wind:false}, sensor:false, prio:'high' },
  { id:'FLO_05', name:'Hall omnisport (parking+pente)', lat:50.4359, lon:4.7578, alt:96, type:'urbain', risk:{flood:false, verglas:true, wind:false}, sensor:true, prio:'high' },
  { id:'FLO_06', name:'Église Saint-Nicolas (centre)', lat:50.4378, lon:4.7569, alt:94, type:'public', risk:{flood:false, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_07', name:'Rue Joseph Hanse (résidentiel)', lat:50.4388, lon:4.7589, alt:98, type:'urbain', risk:{flood:false, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_08', name:'Rue du Pont (bas du centre)', lat:50.4399, lon:4.7607, alt:86, type:'vallée', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'high' },

  { id:'FLO_09', name:'Parking Abbaye (haut)', lat:50.4394, lon:4.7524, alt:142, type:'plateau', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_10', name:'Cimetière communal (haut)', lat:50.4347, lon:4.7542, alt:116, type:'plateau', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },

  { id:'FLO_11', name:'Sovimont (centre)', lat:50.4435, lon:4.7480, alt:182, type:'plateau', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_12', name:'Sovimont (haut agricole)', lat:50.4455, lon:4.7441, alt:190, type:'agri', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },

  { id:'FLO_13', name:'Soye (centre)', lat:50.4392, lon:4.7395, alt:165, type:'village', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_14', name:'Soye – Try des Bruyères (boisé)', lat:50.4382, lon:4.7429, alt:172, type:'boisé', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },

  { id:'FLO_15', name:'Floriffoux (place)', lat:50.4512, lon:4.7680, alt:155, type:'village', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_16', name:'Floriffoux – Rue du Baty (hauteur)', lat:50.4530, lon:4.7650, alt:172, type:'colline', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_17', name:'Floriffoux – vers Bois-de-Villers (colline)', lat:50.4516, lon:4.7586, alt:186, type:'colline', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_18', name:'Floriffoux – Carrefour N930', lat:50.4498, lon:4.7623, alt:164, type:'route', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },

  { id:'FLO_19', name:'Franière – Gare SNCB', lat:50.4545, lon:4.7583, alt:84, type:'vallée', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'high' },
  { id:'FLO_20', name:'Franière – Église & carrefour', lat:50.4554, lon:4.7599, alt:86, type:'urbain', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },

  { id:'FLO_21', name:'Zoning Franière – Entrée',  lat:50.4578, lon:4.7660, alt:88, type:'zoning', risk:{flood:true, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_22', name:'Zoning Franière – Centre',  lat:50.4586, lon:4.7676, alt:90, type:'zoning', risk:{flood:true, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_23', name:'Usine MATERNE',             lat:50.4589, lon:4.7703, alt:89, type:'industriel', risk:{flood:true, verglas:true, wind:true}, sensor:false, prio:'high' },

  { id:'FLO_24', name:'Lakis – Centre', lat:50.4409, lon:4.7638, alt:128, type:'village', risk:{flood:false, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_25', name:'Lakis – École communale', lat:50.4407, lon:4.7647, alt:125, type:'école', risk:{flood:false, verglas:true, wind:false}, sensor:false, prio:'high' },

  { id:'FLO_26', name:'Bois de Floreffe – sommet N', lat:50.4508, lon:4.7344, alt:208, type:'boisé', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_27', name:'Bois de Floreffe – bas humide', lat:50.4489, lon:4.7368, alt:186, type:'boisé', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },

  { id:'FLO_28', name:'Rue du Champ des Alouettes', lat:50.4449, lon:4.7426, alt:178, type:'plateau', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_29', name:'Rue du Rognau (ouest)',       lat:50.4416, lon:4.7473, alt:171, type:'colline', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_30', name:'Rue du Tienne aux Biches',     lat:50.4427, lon:4.7411, alt:174, type:'boisé', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },

  { id:'FLO_31', name:'Rue du Sart-Saint-Laurent (crête)', lat:50.4472, lon:4.7534, alt:188, type:'crête', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_32', name:'Floriffoux – Colline (toit Patrick)', lat:50.453370, lon:4.767175, alt:176, type:'colline', risk:{flood:false, verglas:true, wind:true}, sensor:true, prio:'high' },

  { id:'FLO_33', name:'Pont sur la Sambre – Floreffe', lat:50.4425, lon:4.7612, alt:82, type:'rivière', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'high' },
  { id:'FLO_34', name:'Pont sur la Sambre – Franière', lat:50.4550, lon:4.7615, alt:83, type:'rivière', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'high' },
  { id:'FLO_35', name:'Halage – rive gauche (aval)',   lat:50.4442, lon:4.7618, alt:82, type:'rivière', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_36', name:'Halage – rive droite (amont)',  lat:50.4479, lon:4.7601, alt:83, type:'rivière', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },

  { id:'FLO_37', name:'Rue de la Pêcherie (inondable)', lat:50.4373, lon:4.7599, alt:90, type:'pluvial', risk:{flood:true, verglas:true, wind:false}, sensor:true, prio:'high' },
  { id:'FLO_38', name:'Rue des Prés (champ d’inondation)', lat:50.4362, lon:4.7621, alt:90, type:'pluvial', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_39', name:'Rue de la Basse-Sambre (→ Moustier)', lat:50.4329, lon:4.7707, alt:96, type:'vallée', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_40', name:'Rue de la Bourlotte (bas de vallée)',  lat:50.4315, lon:4.7577, alt:108, type:'vallée', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },

  { id:'FLO_41', name:'Ferme du Moulin (vallée humide)', lat:50.4336, lon:4.7525, alt:112, type:'vallée', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_42', name:'Station d’épuration SPGE (Sambre)',   lat:50.4406, lon:4.7665, alt:84,  type:'technique', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_43', name:'Bassin d’orage – Sovimont (bas)',     lat:50.4460, lon:4.7469, alt:176, type:'technique', risk:{flood:true, verglas:true, wind:false}, sensor:true,  prio:'high' },

  { id:'FLO_44', name:'Poste police / ateliers communaux', lat:50.4565, lon:4.7647, alt:90, type:'public', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_45', name:'Ancienne sucrerie (friche humide)',  lat:50.4526, lon:4.7709, alt:90, type:'friche', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },

  { id:'FLO_46', name:'Carrefour N90/N947 (entrée commune)', lat:50.4477, lon:4.7700, alt:96, type:'route', risk:{flood:true, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_47', name:'Rue de la Gare – Floreffe',           lat:50.4399, lon:4.7581, alt:92, type:'urbain', risk:{flood:false, verglas:true, wind:false}, sensor:false, prio:'med' },

  { id:'FLO_48', name:'Rue du Fond des Bois (boisée)',       lat:50.4448, lon:4.7377, alt:180, type:'boisé', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_49', name:'Rue du Bois d’Arsimont (limite N)',   lat:50.4486, lon:4.7318, alt:196, type:'boisé', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_50', name:'Chemin des Carrières (drainage agri)',lat:50.4461, lon:4.7397, alt:176, type:'agri', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },

  { id:'FLO_51', name:'Rue du Parc – Camping (sommet)',      lat:50.4320, lon:4.7670, alt:168, type:'loisir', risk:{flood:false, verglas:true, wind:true}, sensor:true, prio:'high' },
  { id:'FLO_52', name:'Rue du Château (Sovimont)',           lat:50.4444, lon:4.7456, alt:186, type:'village', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
  { id:'FLO_53', name:'Rue de la Croix (sommet exposé)',     lat:50.4466, lon:4.7513, alt:190, type:'crête',  risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },

  { id:'FLO_54', name:'Rue du Baty – Floriffoux (plateau)',  lat:50.4527, lon:4.7637, alt:171, type:'plateau', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'high' },
  { id:'FLO_55', name:'Robermont – crête agricole',          lat:50.4307, lon:4.7604, alt:140, type:'crête',  risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },

  { id:'FLO_56', name:'Rue de la Pêcherie – avaloir clé',    lat:50.4377, lon:4.7612, alt:90, type:'pluvial', risk:{flood:true, verglas:true, wind:false}, sensor:true,  prio:'high' },
  { id:'FLO_57', name:'Bassin d’orage – Franière',           lat:50.4560, lon:4.7630, alt:91, type:'technique', risk:{flood:true, verglas:true, wind:false}, sensor:true, prio:'high' },
  { id:'FLO_58', name:'Égouttage central (collecteur SPGE)',lat:50.4388, lon:4.7589, alt:88, type:'technique', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },

  { id:'FLO_59', name:'Chemin de halage – secteur central',  lat:50.4433, lon:4.7608, alt:82, type:'rivière', risk:{flood:true, verglas:true, wind:false}, sensor:false, prio:'med' },
  { id:'FLO_60', name:'Rue du Parc – zone résidentielle',    lat:50.4330, lon:4.7662, alt:164, type:'urbain', risk:{flood:false, verglas:true, wind:true}, sensor:false, prio:'med' },
];

// ---------- Prompt IA spécialisé Floreffe (Phase 2)
const FLOREFFE_IA_PROMPT = `
Tu es J.E.A.N., IA météo-hydrologique locale dédiée à la commune de Floreffe (Belgique).
Objectif : produire des prévisions hyper-locales fiables et des alertes opérationnelles pour la voirie communale.

Contraintes et contexte de terrain :
- Collines (Floriffoux, Sovimont, Soye) exposées au vent, givre, verglas.
- Vallée de la Sambre (Franière) sujette à humidité, brouillard, inondation rapide.
- Zoning Franière, Materne : surfaces imperméables → ruissellement accru.
- Réseau pluvial/égouttage : saturation à surveiller (bassin Sovimont, avaloirs Rue de la Pêcherie).
- Points sensibles : écoles, hall, routes pentues, ponts, halage, camping sur sommet.
- Seuils d’alerte : ≥90% auto-publié ; 70–89% validation manuelle ; <70% surveillance.

Tâches :
1) Pondère les sorties multi-modèles physiques (Phase 1) avec relief, pente, type de sol, exposition au vent.
2) Déduis les risques : verglas (temp sol), ruissellement (pluie x pente x imperméabilité), inondation locale (S>1), brouillard (HR>90% & vent<5km/h), rafales.
3) Rends un score de cohérence [0..1] par point + un résumé exploitable.
4) Ne propose que du RÉEL (pas de simulation). Sois explicable : "parce que...".
`;
// ==========================================================
// 🚀 Fonction principale
// ==========================================================
export async function runFloreffe() {
  const mongo = new MongoClient(process.env.MONGO_URI);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    await mongo.connect();
    const db = mongo.db("tinsflash");

    await addEngineLog("🚀 Phase 1 – Extraction multi-modèles Floreffe", "info");

    // === PHASE 1 ===
    const result = await superForecast({
      zones: FLOREFFE_POINTS,
      runType: "Floreffe",
      withAI: false
    });
    if (!result?.success)
      throw new Error(result?.error || "Échec extraction météo Floreffe");

    await db.collection("floreffe_phase1").insertMany(result.phase1Results);

    // Sauvegarde images satellite
    const img1 = await axios.get(SAT_SOURCES.europeZoom, { responseType: "arraybuffer" });
    const img2 = await axios.get(SAT_SOURCES.zoomFloreffe, { responseType: "arraybuffer" });
    fs.writeFileSync("./public/sat_floreffe_europe.png", img1.data);
    fs.writeFileSync("./public/sat_floreffe_zoom.png", img2.data);

    await addEngineLog("✅ Phase 1 terminée et satellites sauvegardés", "success");

    // === PHASE 2 – IA J.E.A.N. locale ===
    const sampleData = JSON.stringify(result.phase1Results.slice(0, 10));
    const aiPrompt = `${FLOREFFE_IA_PROMPT}\n\nDonnées d’entrée : ${sampleData}`;

    const ai = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: aiPrompt }],
      temperature: 0.2
    });

    let phase2Results;
    try {
      phase2Results = JSON.parse(ai.choices[0].message.content);
    } catch {
      throw new Error("Réponse IA non-JSON");
    }

    await db.collection("floreffe_phase2").insertMany(phase2Results);
    const conf = phase2Results.reduce((a, b) => a + (b.confidence || 0), 0) / phase2Results.length;

    // === PHASE 5 – Export global ===
    const enriched = phase2Results.map((x) => ({
      ...x,
      origin: "Floreffe_dome",
      timestamp: new Date(),
      thresholds: ALERT_THRESHOLDS
    }));

    const alerts = enriched
      .filter((x) => x.risk && (x.risk.pluie >= ALERT_THRESHOLDS.rain.alert || x.risk.verglas >= ALERT_THRESHOLDS.cold.alert))
      .map((x) => ({
        point: x.point,
        type: x.risk.pluie ? "pluie" : "verglas",
        level:
          x.risk.pluie && x.risk.pluie >= ALERT_THRESHOLDS.rain.extreme
            ? "rouge"
            : "orange",
        confidence: x.confidence,
        timestamp: new Date()
      }));

    await db.collection("alerts_floreffe").insertMany(alerts);

    fs.writeFileSync("./public/floreffe_forecasts.json", JSON.stringify(enriched, null, 2));
    fs.writeFileSync("./public/floreffe_alerts.json", JSON.stringify(alerts, null, 2));

    await addEngineLog(
      `🏁 Export terminé – ${alerts.length} alertes / confiance ${(conf * 100).toFixed(1)} %`,
      "success"
    );

    return { success: true, alerts: alerts.length };
  } catch (e) {
    await addEngineError(`Erreur Floreffe : ${e.message}`, "floreffe");
    return { success: false, error: e.message };
  } finally {
    await mongo.close();
  }
}
