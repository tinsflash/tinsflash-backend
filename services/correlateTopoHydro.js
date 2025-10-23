// ==========================================================
// 🌄 correlateTopoHydro.js — Analyse topographique et hydrologique locale
// ==========================================================
// ⚙️ Version Floreffe PRO+++ (avec Alerte IA intégrée)
// ==========================================================

import { addEngineLog } from "./engineState.js"; // pour journal IA J.E.A.N.

export async function correlateTopoHydro(point, { geo, hydro, reseaux, routes, liveHydro }) {
  try {
    const { lat, lon, precipitation, temperature } = point;

    // 🛡 Sécurisation des entrées
    if (!lat || !lon) throw new Error("Coordonnées invalides");
    if (!geo || !Array.isArray(geo.features)) geo = { features: [] };
    if (!hydro) hydro = { rivieres: [] };
    if (!reseaux) reseaux = { collecteurs: [] };
    if (!routes) routes = { routes: [] };

    // --- Relief & pente ---
    const slope = getSlopeAtLocation(lat, lon, geo);
    const permeability = getPermeabilityAtLocation(lat, lon, geo);
    const urbanDensity = getUrbanDensityAtLocation(lat, lon, geo);

    // --- Risques hydrologiques (Sambre + Wéry + autres) ---
    const { riverLevel, riverFlow, hydroRisk } = getHydroRiskAtLocation(
      lat, lon, precipitation, hydro, liveHydro
    );

    // --- Réseaux pluviaux (SPGE / bassins d’orage) ---
    const networkRisk = getNetworkRisk(precipitation, reseaux);

    // --- Routes : verglas / ruissellement / inondation ---
    const roadRisk = getRoadRisk(lat, lon, temperature, precipitation, routes);

    // --- Score global (pondéré) ---
    const scoreGlobal = Math.min(
      (slope * 0.25) + (hydroRisk * 3) + (networkRisk * 1.5) + (roadRisk * 1.5) +
      ((1 - permeability) * 2) + (urbanDensity * 2),
      20
    );

    // 🚨 Alerte IA J.E.A.N.
    if (scoreGlobal >= 15) {
      await addEngineLog(
        `🚨 [Alerte IA] Risque élevé détecté (${scoreGlobal.toFixed(1)}/20) — lat:${lat.toFixed(4)} lon:${lon.toFixed(4)}`,
        "floreffe"
      );
    }

    return {
      slope,
      hydroRisk,
      roadRisk,
      networkRisk,
      riverLevel,
      riverFlow,
      permeability,
      urbanDensity,
      scoreGlobal: +scoreGlobal.toFixed(2)
    };

  } catch (err) {
    console.error("❌ Erreur correlateTopoHydro:", err.message);
    return {
      slope: 0,
      hydroRisk: 0,
      roadRisk: 0,
      networkRisk: 0,
      riverLevel: 0,
      riverFlow: 0,
      permeability: 0,
      urbanDensity: 0,
      scoreGlobal: 0
    };
  }
}

// ==========================================================
// 🔧 Fonctions internes
// ==========================================================
function getSlopeAtLocation(lat, lon, geo) {
  let slope = 3;
  if (geo?.features?.length) {
    const f = geo.features.find(f =>
      f.geometry?.coordinates &&
      Math.abs(f.geometry.coordinates[1] - lat) < 0.001 &&
      Math.abs(f.geometry.coordinates[0] - lon) < 0.001
    );
    slope = f?.properties?.slope_avg ?? 3;
  }
  return slope;
}

function getPermeabilityAtLocation(lat, lon, geo) {
  if (!geo?.features?.length) return 0.4;
  const f = geo.features.find(f => f.properties?.soil_type);
  const type = f?.properties?.soil_type ?? "unknown";
  if (type === "argileux") return 0.2;
  if (type === "limoneux") return 0.5;
  if (type === "sableux") return 0.8;
  return 0.4;
}

function getUrbanDensityAtLocation(lat, lon, geo) {
  if (!geo?.features?.length) return 0.4;
  const f = geo.features.find(f => f.properties?.urban_density);
  return +(f?.properties?.urban_density ?? 0.4);
}

function getHydroRiskAtLocation(lat, lon, precip, hydro, liveHydro) {
  const allHydro = liveHydro?.stations?.length ? liveHydro.stations : hydro?.rivieres ?? [];
  let riverLevel = 0, riverFlow = 0, risk = 0;
  for (const r of allHydro) {
    if (!r?.lat || !r?.lon) continue;
    const dist = Math.hypot(r.lat - lat, r.lon - lon);
    if (dist < 0.02) {
      riverLevel = r.niveau_m ?? 0;
      riverFlow = r.debit_m3s ?? 0;
      if (r.nom?.toLowerCase().includes("sambre")) risk += 2;
      if (r.nom?.toLowerCase().includes("wéry")) risk += 3;
      if (precip > 8) risk += 2;
      if (riverLevel > (r.alert_threshold ?? 0.5)) risk += 2;
    }
  }
  return { riverLevel, riverFlow, hydroRisk: Math.min(risk, 5) };
}

function getNetworkRisk(precip, reseaux) {
  let risk = 0;
  for (const c of reseaux?.collecteurs ?? []) {
    if (c.status === "bassin_orage" && precip > 12) risk += 2;
    if (c.type === "unitaire" && precip > 10) risk += 1;
  }
  return Math.min(risk, 5);
}

function getRoadRisk(lat, lon, temp, precip, routes) {
  let risk = 0;
  for (const r of routes?.routes ?? []) {
    if (r.risk === "verglas" && temp < 0) risk += 2;
    if (r.risk === "inondation" && precip > 8) risk += 2;
    if (r.risk === "ruissellement" && precip > 10) risk += 1;
  }
  return Math.min(risk, 5);
}
