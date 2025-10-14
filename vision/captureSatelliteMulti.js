// ====================================================================
// FICHIER : /vision/captureSatelliteMulti.js
// ====================================================================
// 🛰️ VisionIA – Capture Satellite Multi-Sources & Multi-Couches
// ====================================================================

import axios from "axios";
import fs from "fs";
import path from "path";

export async function captureSatelliteMulti() {
  const now = new Date().toISOString().replace(/[:.-]/g, "");
  const dir = `/tmp/vision/${now.slice(0,8)}`;
  fs.mkdirSync(dir, { recursive: true });

  // --- Couches satellites globales ---
  const satellites = [
    { name: "EUMETSAT_IR", url: "https://eumetview.eumetsat.int/static-images/MSG/MSG_IR108E/WESTERNEUROPE/thumbnail.jpg" },
    { name: "NASA_BLUE", url: "https://neo.gsfc.nasa.gov/archive/bluemarble/2025/thumbnail.jpg" },
    { name: "GOES_EAST", url: "https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/eus/GEOCOLOR/latest.jpg" },
    { name: "HIMAWARI", url: "https://rammb.cira.colostate.edu/ramsdis/online/images/himawari-8/full_disk_ahi_ir.jpg" },
    { name: "METEOBLUE_WIND", url: "https://my.meteoblue.com/visimage/meteogram?apikey=demo" },
  ];

  // --- Couches physiques multi-variables ---
  const layers = [
    { name: "WIND", url: "https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/5/16/10.png" },
    { name: "RAIN", url: "https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/5/17/10.png" },
    { name: "SNOW", url: "https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/5/18/10.png" },
    { name: "TEMP", url: "https://tile.open-meteo.com/v1/temperature/latest.png" },
    { name: "STORM", url: "https://tile.open-meteo.com/v1/thunderstorm/latest.png" },
  ];

  const sources = [...satellites, ...layers];
  const results = [];

  for (const s of sources) {
    try {
      const res = await axios.get(s.url, { responseType: "arraybuffer", timeout: 20000 });
      const filePath = path.join(dir, `${s.name}_${now}.jpg`);
      fs.writeFileSync(filePath, res.data);
      results.push({ source: s.name, file: filePath, date: now });
      console.log(`✅ Capture réussie : ${s.name}`);
    } catch (e) {
      console.error(`⚠️ Capture échouée : ${s.name}`);
    }
  }

  return results;
}
