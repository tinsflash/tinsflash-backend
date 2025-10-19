// ==========================================================
// 💧 fetchLiveHydroData.js — Hydrométrie temps réel (Floreffe + Mornimont + Sambre)
// ==========================================================

import fs from "fs";
import path from "path";
import axios from "axios";
import csv from "csvtojson";
import { addEngineError, addEngineLog } from "./engineState.js";

export async function fetchLiveHydroData() {
  const datasetsPath = path.resolve("./services/datasets");
  const localPath = `${datasetsPath}/floreffe_hydro.json`;

  try {
    await addEngineLog("🌊 Lecture hydrométrique : Sambre + Mornimont (SPW)", "info", "Hydro");

    // --- 🌧 1. Précipitations 6h ---
    const rain6Url =
      "https://hydrometrie.wallonie.be/services/download?downloadurl=aHR0cHM6Ly9oeWRyb21ldHJpZS53YWxsb25pZS5iZS9zZXJ2aWNlcy9LaVdJUy9LaVdJUz9yZXF1ZXN0PWdldFRpbWVzZXJpZXNWYWx1ZXMmc2VydmljZT1raXN0ZXJzJnR5cGU9cXVlcnlTZXJ2aWNlcyZkYXRhc291cmNlPTAmZm9ybWF0PWNzdiZtZXRhZGF0YT10cnVlJnRzX2lkPTI0NzM2NzAxMCZtaW1lVHlwZT10ZXh0JTJGY3N2Jmxhbmd1YWdlPWZyJnJldHVybmZpZWxkcz1UaW1lc3RhbXAlMkNWYWx1ZSZkb3dubG9hZGFzemlwPWZhbHNlJnVzZXJpbmZvPXdlYl9zMF9wdWJsaWMmZG93bmxvYWRmaWxlbmFtZT03MzM1X01PUk5JTU9OVCtCYXItRWNsdXNlX1ByZXVuZGVmaW5lZGNpcGl0YXRpb24mZnJvbT0yMDI1LTA5LTAxVDE5JTNBNTYlM0E1My4wMjhaJnRvPTIwMjUtMTAtMjZUMDglM0EzNCUzQTIzLjAyOFo%3D";
    const rain6Res = await axios.get(rain6Url, { responseType: "text" });
    const rain6Json = await csv().fromString(rain6Res.data);
    const rain6 = parseFloat(rain6Json.at(-1)?.Value || 0);

    // --- 🌧 2. Précipitations 12h ---
    const rain12Url =
      "https://hydrometrie.wallonie.be/services/download?downloadurl=aHR0cHM6Ly9oeWRyb21ldHJpZS53YWxsb25pZS5iZS9zZXJ2aWNlcy9LaVdJUy9LaVdJUz9yZXF1ZXN0PWdldFRpbWVzZXJpZXNWYWx1ZXMmc2VydmljZT1raXN0ZXJzJnR5cGU9cXVlcnlTZXJ2aWNlcyZkYXRhc291cmNlPTAmZm9ybWF0PWNzdiZtZXRhZGF0YT10cnVlJnRzX2lkPTI0NzM2NzAxMCZtaW1lVHlwZT10ZXh0JTJGY3N2Jmxhbmd1YWdlPWZyJnJldHVybmZpZWxkcz1UaW1lc3RhbXAlMkNWYWx1ZSZkb3dubG9hZGFzemlwPWZhbHNlJnVzZXJpbmZvPXdlYl9zMF9wdWJsaWMmZG93bmxvYWRmaWxlbmFtZT03MzM1X01PUk5JTU9OVCtCYXItRWNsdXNlX1ByZXVuZGVmaW5lZGNpcGl0YXRpb24mZnJvbT0yMDI1LTA4LTE5VDA2JTNBMTQlM0ExNy41ODdaJnRvPTIwMjUtMTAtMTVUMDIlM0ExMSUzQTQyLjQwMVo%3D";
    const rain12Res = await axios.get(rain12Url, { responseType: "text" });
    const rain12Json = await csv().fromString(rain12Res.data);
    const rain12 = parseFloat(rain12Json.at(-1)?.Value || 0);

    // --- 🌧 3. Précipitations 72h ---
    const rain72Url =
      "https://hydrometrie.wallonie.be/services/download?downloadurl=aHR0cHM6Ly9oeWRyb21ldHJpZS53YWxsb25pZS5iZS9zZXJ2aWNlcy9LaVdJUy9LaVdJUz9yZXF1ZXN0PWdldFRpbWVzZXJpZXNWYWx1ZXMmc2VydmljZT1raXN0ZXJzJnR5cGU9cXVlcnlTZXJ2aWNlcyZkYXRhc291cmNlPTAmZm9ybWF0PWNzdiZtZXRhZGF0YT10cnVlJnRzX2lkPTI0NzM2NzAxMCZtaW1lVHlwZT10ZXh0JTJGY3N2Jmxhbmd1YWdlPWZyJnJldHVybmZpZWxkcz1UaW1lc3RhbXAlMkNWYWx1ZSZkb3dubG9hZGFzemlwPWZhbHNlJnVzZXJpbmZvPXdlYl9zMF9wdWJsaWMmZG93bmxvYWRmaWxlbmFtZT03MzM1X01PUk5JTU9OVCtCYXItRWNsdXNlX1ByZXVuZGVmaW5lZGNpcGl0YXRpb24mZnJvbT0yMDI1LTA4LTE5VDA2JTNBMDAlM0EwMC4wMDBaJnRvPTIwMjUtMTAtMTVUMDIlM0E1NyUzQTI0LjgxNFo%3D";
    const rain72Res = await axios.get(rain72Url, { responseType: "text" });
    const rain72Json = await csv().fromString(rain72Res.data);
    const rain72 = parseFloat(rain72Json.at(-1)?.Value || 0);

    // --- 💧 4. Hauteur d’eau Mornimont ---
    const levelUrl =
      "https://hydrometrie.wallonie.be/services/download?downloadurl=aHR0cHM6Ly9oeWRyb21ldHJpZS53YWxsb25pZS5iZS9zZXJ2aWNlcy9LaVdJUy9LaVdJUz9yZXF1ZXN0PWdldFRpbWVzZXJpZXNWYWx1ZXMmc2VydmljZT1raXN0ZXJzJnR5cGU9cXVlcnlTZXJ2aWNlcyZkYXRhc291cmNlPTAmZm9ybWF0PWNzdiZtZXRhZGF0YT10cnVlJnRzX2lkPTI0NzM0NDAxMCZtaW1lVHlwZT10ZXh0JTJGY3N2Jmxhbmd1YWdlPWZyJnJldHVybmZpZWxkcz1UaW1lc3RhbXAlMkNWYWx1ZSZkb3dubG9hZGFzemlwPWZhbHNlJnVzZXJpbmZvPXdlYl9zMF9wdWJsaWMmZG93bmxvYWRmaWxlbmFtZT03MzM1X01PUk5JTU9OVCtCYXItRWNsdXNlX1ByZXVuZGVmaW5lZGNpcGl0YXRpb24mZnJvbT0yMDI1LTA5LTAxVDE5JTNBNTYlM0E1My4wMjhaJnRvPTIwMjUtMTAtMjZUMDglM0EzNCUzQTIzLjAyOFo%3D";
    const levelRes = await axios.get(levelUrl, { responseType: "text" });
    const levelJson = await csv().fromString(levelRes.data);
    const level = parseFloat(levelJson.at(-1)?.Value || 0);

    // --- 💦 5. Débit de la Sambre (station 247062010) ---
    const flowUrl =
      "https://hydrometrie.wallonie.be/services/download?downloadurl=aHR0cHM6Ly9oeWRyb21ldHJpZS53YWxsb25pZS5iZS9zZXJ2aWNlcy9LaVdJUy9LaVdJUz9yZXF1ZXN0PWdldFRpbWVzZXJpZXNWYWx1ZXMmc2VydmljZT1raXN0ZXJzJnR5cGU9cXVlcnlTZXJ2aWNlcyZkYXRhc291cmNlPTAmZm9ybWF0PWNzdiZtZXRhZGF0YT10cnVlJnRzX2lkPTI0NzA2MjAxMCZtaW1lVHlwZT10ZXh0JTJGY3N2Jmxhbmd1YWdlPWZyJnJldHVybmZpZWxkcz1UaW1lc3RhbXAlMkNWYWx1ZSZkb3dubG9hZGFzemlwPWZhbHNlJnVzZXJpbmZvPXdlYl9zMF9wdWJsaWMmZG93bmxvYWRmaWxlbmFtZT03MzE5X1NBTFpJTk5FUytSb25ldF9EZXVuZGVmaW5lZGJpdCt1bHRyYXNvbiZmcm9tPTIwMjUtMDgtMTlUMDQlM0EwMCUzQTAwLjAwMFomdG89MjAyNS0xMC0zMFQwMiUzQTEzJTNBMTUuOTM1Wg%3D%3D";
    const flowRes = await axios.get(flowUrl, { responseType: "text" });
    const flowJson = await csv().fromString(flowRes.data);
    const flow = parseFloat(flowJson.at(-1)?.Value || 0);

    const hydroData = {
      station: "Mornimont / Sambre",
      codes: {
        pluie: "247367010",
        hauteur: "247344010",
        debit: "247062010",
      },
      timestamp: new Date().toISOString(),
      pluie6h: rain6,
      pluie12h: rain12,
      pluie72h: rain72,
      hauteurEau_m: level,
      debit_m3s: flow,
      source: "SPW Hydrométrie",
    };

    // Sauvegarde locale
    fs.writeFileSync(localPath, JSON.stringify(hydroData, null, 2));
    await addEngineLog(
      `✅ Hydrométrie : 💧${level.toFixed(2)} m | 💨${flow.toFixed(1)} m³/s | 🌧6h ${rain6} mm / 12h ${rain12} mm / 72h ${rain72} mm`,
      "success",
      "Hydro"
    );

    return hydroData;
  } catch (err) {
    await addEngineError(`Erreur lecture hydrométrie SPW : ${err.message}`, "Hydro");
    // Fallback : lecture locale si dispo
    try {
      const data = JSON.parse(fs.readFileSync(localPath, "utf8"));
      await addEngineLog("💾 Données hydrométriques locales utilisées (fallback).", "warn", "Hydro");
      return data;
    } catch {
      return { station: "Mornimont", erreur: err.message };
    }
  }
}
