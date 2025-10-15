// ==========================================================
// 🌪️ TINSFLASH – aiphase5.js
// v1.0  —  PHASE 5 UNIQUEMENT (prévisions publiques + alertes)
// ==========================================================
// Rôle :
// 1) Lire les sorties d'analyse IA (Phase 2/4) sur les 3 dernières heures
// 2) Générer des prévisions locales/nationales "publiables"
// 3) Détecter et consolider les alertes selon config/alertThresholds.json
// 4) Écrire les objets d'alerte en MongoDB (collection: alerts)
// 5) Journaliser proprement (EngineLog)
// ==========================================================

import path from "path";
import fs from "fs";

import { addEngineLog, addEngineError } from "./engineState.js";
import { getThresholds } from "../config/alertThresholds.js";

// NB: imports dynamiques pour éviter couplage au chargement
// (mongoose n'est chargé que pendant l'exécution du run Phase 5)

const clamp01 = (x) => Math.max(0, Math.min(1, x ?? 0));
const mm = (v) => (typeof v === "number" && !Number.isNaN(v) ? v : null);

// ----------------------------------------------------------
// 🧠 Prompt (mémoire d’intention pour les LLM/assistants)
// ----------------------------------------------------------
const PHASE5_DIRECTIVE = `
Tu es un météorologue et climatologue de niveau international, expert du relief,
de la dynamique atmosphérique et des environnements côtiers/continentaux. 
Ta tâche : à partir des données d'analyse IA (Phase 2 ou Phase 4) disponibles sur
les 3 dernières heures, produire des prévisions locales et nationales précises 
ET détecter les alertes météorologiques selon les seuils officiels TINSFLASH
(config/alertThresholds.json). 
Tu privilégies l'anticipation (primeur), l'explicabilité, et la fiabilité chiffrée (%).
`;

// ----------------------------------------------------------
// 🕒 Fenêtre temporelle utilisée par la Phase 5
// ----------------------------------------------------------
const WINDOW_HOURS = 3;

// ----------------------------------------------------------
// 🔎 Aides d’extraction depuis un point IA (Phase 2/4)
// Les champs viennent de aiAnalysis.js (reliés tels quels si dispo).
// ----------------------------------------------------------
function pickScalarFromPoint(p) {
  // Température/vent/pluie/neige : s’ils sont disponibles dans les sous-objets
  const wind = p?.wind || {};
  const rain = p?.rain || {};
  const snow = p?.snow || {};

  return {
    lat: mm(Number(p.lat ?? p.latitude)),
    lon: mm(Number(p.lon ?? p.longitude)),
    country: p.country || null,
    zone: String(p.zone || p.region || p.country || "Unknown"),

    // indicateurs généraux
    reliability_pct: mm(Number(p.reliability_pct ?? p.reliability * 100)),
    indiceLocal: mm(Number(p.indiceLocal)),
    condition: p.condition || null,

    // métriques météo (tolère multiples clés)
    gust_kmh: mm(Number(wind.gust_kmh ?? wind.gust ?? wind.max_kmh ?? wind.max)),
    wind_kmh: mm(Number(wind.avg_kmh ?? wind.avg ?? wind.speed_kmh ?? wind.speed)),
    rain_1h_mm: mm(Number(rain["1h"] ?? rain.h1 ?? rain.last1h)),
    rain_6h_mm: mm(Number(rain["6h"] ?? rain.h6 ?? rain.last6h)),
    rain_24h_mm: mm(Number(rain["24h"] ?? rain.h24 ?? rain.last24h)),
    snow_6h_cm: mm(Number(snow["6h_cm"] ?? snow.h6_cm ?? snow.h6)),
    snow_12h_cm: mm(Number(snow["12h_cm"] ?? snow.h12_cm ?? snow.h12)),
    snow_24h_cm: mm(Number(snow["24h_cm"] ?? snow.h24_cm ?? snow.h24)),

    analysedAt: p.analysedAt ? new Date(p.analysedAt) : null,
    visualEvidence: !!p.visualEvidence,
    phenomena: p.phenomena || null, // si Phase 2 a identifié des phénomènes
    sources: Array.isArray(p.sources) ? p.sources : null,
  };
}

// ----------------------------------------------------------
// 📏 Application des seuils d’alerte
// ----------------------------------------------------------
function evaluateAgainstThresholds(s, thresholds) {
  // s = scalar metrics for a single point
  const alerts = [];

  // --- Vent (rafales en km/h)
  if (s.gust_kmh != null) {
    const t = thresholds.vent;
    if (t && s.gust_kmh >= Number(t.alerte)) {
      alerts.push({
        type: "vent",
        level: s.gust_kmh >= Number(t.extreme) ? "extreme" : "alerte",
        value: s.gust_kmh,
        unit: "km/h",
        reason: "Rafales mesurées/modélisées",
      });
    } else if (t && s.gust_kmh >= Number(t.prealerte)) {
      alerts.push({
        type: "vent",
        level: "prealerte",
        value: s.gust_kmh,
        unit: "km/h",
        reason: "Rafales significatives",
      });
    }
  }

  // --- Pluie (mm/1h, 6h, 24h)
  if (thresholds.pluie && (s.rain_1h_mm != null || s.rain_6h_mm != null || s.rain_24h_mm != null)) {
    const t = thresholds.pluie;
    const tests = [
      { k: "1h", v: s.rain_1h_mm },
      { k: "6h", v: s.rain_6h_mm },
      { k: "24h", v: s.rain_24h_mm },
    ];
    for (const { k, v } of tests) {
      if (v == null) continue;
      const a = t.alerte?.[k];
      const x = t.extreme?.[k];
      const p = t.prealerte?.[k];
      if (a != null && v >= Number(a)) {
        alerts.push({
          type: "pluie",
          level: x != null && v >= Number(x) ? "extreme" : "alerte",
          value: v,
          window: k,
          unit: "mm",
          reason: `Accumulation ${k}`,
        });
      } else if (p != null && v >= Number(p)) {
        alerts.push({
          type: "pluie",
          level: "prealerte",
          value: v,
          window: k,
          unit: "mm",
          reason: `Accumulation ${k}`,
        });
      }
    }
  }

  // --- Neige (cm/6h, 12h, 24h)
  if (thresholds.neige && (s.snow_6h_cm != null || s.snow_12h_cm != null || s.snow_24h_cm != null)) {
    const t = thresholds.neige;
    const tests = [
      { k: "6h", v: s.snow_6h_cm },
      { k: "12h", v: s.snow_12h_cm },
      { k: "24h", v: s.snow_24h_cm },
    ];
    for (const { k, v } of tests) {
      if (v == null) continue;
      const a = t.alerte?.[k];
      const x = t.extreme?.[k];
      const p = t.prealerte?.[k];
      if (a != null && v >= Number(a)) {
        alerts.push({
          type: "neige",
          level: x != null && v >= Number(x) ? "extreme" : "alerte",
          value: v,
          window: k,
          unit: "cm",
          reason: `Hauteur ${k}`,
        });
      } else if (p != null && v >= Number(p)) {
        alerts.push({
          type: "neige",
          level: "prealerte",
          value: v,
          window: k,
          unit: "cm",
          reason: `Hauteur ${k}`,
        });
      }
    }
  }

  // TODO : on peut étendre ici (verglas, chaleur, submersion, orage_grêle, etc.)
  // en suivant la même mécanique et en s’appuyant sur s.phenomena si fourni par la Phase 2.

  return alerts;
}

// ----------------------------------------------------------
// 🧮 Fiabilité alerte (simple, robuste et explicable)
// ----------------------------------------------------------
function computeAlertReliabilityPct(s, hasVisual, sourcesCount) {
  // pondération : modèles (sources), visuel, cohérence locale
  const w = { models: 0.45, visual: 0.25, local: 0.30 };

  // modèles : on approxime par nb de sources vs 8 attendues
  const EXPECTED = 8;
  const models = clamp01((sourcesCount ?? 0) / EXPECTED);

  // visuel : booléen => 0/1
  const visual = hasVisual ? 1 : 0;

  // local : on se sert de la fiabilité locale si disponible
  const local = clamp01((s.reliability_pct ?? 60) / 100);

  const score =
    w.models * models +
    w.visual * visual +
    w.local * local;

  return Math.round(clamp01(score) * 100); // %
}

// ----------------------------------------------------------
// 🗺️ Consolidation "nationale" simple par agrégation
// (une zone peut de facto être une région; on garde zone + country)
// ----------------------------------------------------------
function makePublicForecastFromPoint(s) {
  return {
    zone: s.zone,
    country: s.country,
    lat: s.lat,
    lon: s.lon,
    condition: s.condition || "Conditions variables",
    reliability_pct: s.reliability_pct ?? null,
    updated: new Date(),
    indices: {
      indiceLocal: s.indiceLocal ?? null,
    },
  };
}

// ----------------------------------------------------------
// 🚀 Entrée principale Phase 5
// ----------------------------------------------------------
export async function runPhase5() {
  try {
    await addEngineLog("🚨 Phase 5 – Fusion des alertes (aiphase5.js)", "info", "alerts");

    // 0) Charger seuils
    const thresholds = getThresholds();

    // 1) Connexion Mongo + modèles dynamiques
    const { default: mongoose } = await import("mongoose");
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGO_URI absent");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });

    const AnySchema = new mongoose.Schema({}, { strict: false });

    const AiPoints =
      mongoose.models.forecasts_ai_points ||
      mongoose.model("forecasts_ai_points", AnySchema, "forecasts_ai_points");

    const Alerts =
      mongoose.models.alerts ||
      mongoose.model("alerts", AnySchema, "alerts");

    // 2) Fenêtre temporelle (≤ 3 h)
    const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000);

    // 3) Charger points IA récents
    const points = await AiPoints.find({ analysedAt: { $gte: since } }).lean();
    if (!points.length) {
      await addEngineLog("ℹ️ Phase 5: aucun point IA récent (<3h).", "info", "alerts");
      await mongoose.disconnect();
      return { alerts: 0, forecasts: 0, reason: "no_recent_points" };
    }

    await addEngineLog(`📥 Phase 5: ${points.length} points IA chargés (<${WINDOW_HOURS}h).`, "info", "alerts");

    // 4) Balayage points -> prévisions publiques + alertes
    const publicForecasts = [];
    const consolidatedAlerts = [];

    for (const p of points) {
      const s = pickScalarFromPoint(p);
      if (!s.lat || !s.lon) continue;

      // prévision publique minimale (pour front)
      publicForecasts.push(makePublicForecastFromPoint(s));

      // seuils -> alertes
      const localAlerts = evaluateAgainstThresholds(s, thresholds);

      for (const a of localAlerts) {
        const reliability_pct = computeAlertReliabilityPct(
          s,
          !!s.visualEvidence,
          Array.isArray(s.sources) ? s.sources.length : 0
        );

        consolidatedAlerts.push({
          title:
            a.type === "vent"
              ? `Rafales fortes ${s.zone}`
              : a.type === "pluie"
              ? `Pluies intenses ${s.zone}`
              : a.type === "neige"
              ? `Chutes de neige ${s.zone}`
              : `Alerte ${a.type} ${s.zone}`,
          phenomenon: a.type,
          level: a.level, // prealerte | alerte | extreme
          zone: s.zone,
          country: s.country,
          lat: s.lat,
          lon: s.lon,
          metrics: {
            value: a.value,
            unit: a.unit ?? null,
            window: a.window ?? null,
          },
          reason: a.reason,
          reliability_pct,
          // primeur si aucune comparaison/externe connue :
          isPrimeur: !(p?.phenomena?.externalComparisons?.length),
          comparedToExternal: !!(p?.phenomena?.externalComparisons?.length),
          sourcesCount: Array.isArray(s.sources) ? s.sources.length : null,
          visualEvidence: !!s.visualEvidence,
          createdAt: new Date(),
          updatedAt: new Date(),
          engine: "TINSFLASH IA.J.E.A.N.",
          version: "phase5.v1.0",
        });
      }
    }

    // 5) Écriture Mongo (ALERTES)
    //    Politique : on n’efface que les alertes >30h ; on ajoute en plus
    //    (si tu veux écraser par zone, on peut le faire dans une itération suivante).
    let inserted = 0;
    if (consolidatedAlerts.length) {
      await Alerts.insertMany(consolidatedAlerts, { ordered: false });
      inserted = consolidatedAlerts.length;
    }

    // 6) Purge > 30 h des anciennes alertes
    try {
      const cutoff = new Date(Date.now() - 30 * 60 * 60 * 1000);
      const del = await Alerts.deleteMany({ createdAt: { $lt: cutoff } });
      await addEngineLog(
        `🧹 Phase 5: purge alerts >30h: ${del?.deletedCount ?? 0} supprimée(s)`,
        "info",
        "alerts"
      );
    } catch (err) {
      await addEngineError(`Purge alerts >30h: ${err.message}`, "alerts");
    }

    await addEngineLog(
      `✅ Phase 5: ${inserted} alerte(s) consolidée(s), ${publicForecasts.length} prévision(s) publiques calculées.`,
      "success",
      "alerts"
    );

    await mongoose.disconnect();

    return {
      alerts: inserted,
      forecasts: publicForecasts.length,
      note: "Prévisions publiques non écrites (front les récupère via /api/forecast existant).",
      directive: PHASE5_DIRECTIVE.trim(),
    };
  } catch (e) {
    await addEngineError(`Phase 5 erreur: ${e.message}`, "alerts");
    try {
      const { default: mongoose } = await import("mongoose");
      if (mongoose.connection?.readyState) await mongoose.disconnect();
    } catch {}
    return { error: e.message };
  }
}

export default { runPhase5 };
