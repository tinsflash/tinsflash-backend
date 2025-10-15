// ==========================================================
// 🛰️ TINSFLASH — services/visionFetchers.js
// Version multi-couches satellite (IR / Visible / Radar)
// Capture automatique de cartes depuis TaMeteo, EUMETSAT et SAT24
// ==========================================================
// Dépendances : npm i puppeteer
// Sur Render, ajouter : PUPPETEER_SKIP_DOWNLOAD=false
// ==========================================================
import fs from "fs";
import path from "path";
import { addEngineLog, addEngineError } from "./engineState.js";

const VISION_DIR = path.join(process.cwd(), "data", "vision");
function ensureDir() {
  if (!fs.existsSync(VISION_DIR)) fs.mkdirSync(VISION_DIR, { recursive: true });
}

// ----------------------------------------------
// 🔧 Helper : gestion du navigateur headless
// ----------------------------------------------
async function withBrowser(run) {
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process"
    ],
    headless: "new",
  });
  try { return await run(browser); }
  finally { await browser.close(); }
}

// ----------------------------------------------
// 📸 Helper : capture d’un sélecteur précis
// ----------------------------------------------
async function screenshotPage(page, url, selector, outPath, desc) {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForTimeout(2500);
  const el = await page.$(selector);
  if (!el) throw new Error(`Sélecteur introuvable pour ${desc}`);
  const b = await el.boundingBox();
  if (!b) throw new Error(`BoundingBox null pour ${desc}`);
  await page.screenshot({ path: outPath, clip: b });
  return outPath;
}

// ==========================================================
// 🌍 TaMeteo (monde / Europe) — IR / Visible / Radar
// ==========================================================
async function captureTaMeteo(browser) {
  const page = await browser.newPage();
  page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
  const out = [];
  const base = "https://www.tameteo.com/satellites/";

  const modes = [
    { name: "IR", url: base + "infrared/", selector: "#map, canvas, .leaflet-container" },
    { name: "Visible", url: base + "visible/", selector: "#map, canvas, .leaflet-container" },
    { name: "Radar", url: base + "rain/", selector: "#map, canvas, .leaflet-container" },
  ];

  for (const m of modes) {
    try {
      const p = path.join(VISION_DIR, `vision_tameteo_${m.name}_${Date.now()}.png`);
      await screenshotPage(page, m.url, m.selector, p, `TaMeteo ${m.name}`);
      out.push(p);
      await addEngineLog(`🛰️ Vision: capture TaMeteo ${m.name} OK`);
    } catch (e) {
      await addEngineError(`Vision TaMeteo ${m.name}: ${e.message}`, "vision");
    }
  }
  await page.close();
  return out;
}

// ==========================================================
// ☁️ EUMETSAT — produits multi-spectra IR / Visible / WV
// ==========================================================
async function captureEUMETSAT(browser) {
  const page = await browser.newPage();
  page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
  const out = [];
  const base = "https://view.eumetsat.int/productviewer?v=";
  const modes = [
    { name: "IR", url: base + "default&product=MSG_IR", selector: "canvas, .ol-viewport" },
    { name: "Visible", url: base + "default&product=MSG_RGB", selector: "canvas, .ol-viewport" },
    { name: "WV", url: base + "default&product=MSG_WV", selector: "canvas, .ol-viewport" },
  ];
  for (const m of modes) {
    try {
      const p = path.join(VISION_DIR, `vision_eumetsat_${m.name}_${Date.now()}.png`);
      await screenshotPage(page, m.url, m.selector, p, `EUMETSAT ${m.name}`);
      out.push(p);
      await addEngineLog(`🛰️ Vision: capture EUMETSAT ${m.name} OK`);
    } catch (e) {
      await addEngineError(`Vision EUMETSAT ${m.name}: ${e.message}`, "vision");
    }
  }
  await page.close();
  return out;
}

// ==========================================================
// 🇺🇸 SAT24 (USA) — Visible / IR
// ==========================================================
async function captureSAT24(browser) {
  const page = await browser.newPage();
  page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
  const out = [];
  const base = "https://www.sat24.com/fr-be/country/us";
  const modes = [
    { name: "Visible", url: base + "/visible", selector: "#map, canvas, .leaflet-container" },
    { name: "IR", url: base + "/infrared", selector: "#map, canvas, .leaflet-container" },
  ];
  for (const m of modes) {
    try {
      const p = path.join(VISION_DIR, `vision_sat24_${m.name}_${Date.now()}.png`);
      await screenshotPage(page, m.url, m.selector, p, `SAT24 ${m.name}`);
      out.push(p);
      await addEngineLog(`🛰️ Vision: capture SAT24 ${m.name} OK`);
    } catch (e) {
      await addEngineError(`Vision SAT24 ${m.name}: ${e.message}`, "vision");
    }
  }
  await page.close();
  return out;
}

// ==========================================================
// 🚀 RUNNER GLOBAL — lance toutes les captures multi-sources
// ==========================================================
export async function fetchVisionCaptures() {
  ensureDir();
  const saved = [];
  try {
    await addEngineLog("🔭 VisionIA Phase 1B — démarrage des captures multi-sources IR/Visible/Radar…","info","vision");
    await withBrowser(async (browser) => {
      const a = await captureTaMeteo(browser); saved.push(...a);
      const b = await captureEUMETSAT(browser); saved.push(...b);
      const c = await captureSAT24(browser); saved.push(...c);
    });
    await addEngineLog(`✅ VisionIA: ${saved.length} capture(s) enregistrée(s)`, "success", "vision");
  } catch (e) {
    await addEngineError("VisionIA global: " + e.message, "vision");
  }
  return saved;
}

export default { fetchVisionCaptures };
