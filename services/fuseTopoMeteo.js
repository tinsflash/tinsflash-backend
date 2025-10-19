// ==========================================================
// 🌍 fuseTopoMeteo.js — Fusion relief NGI + météo TINSFLASH
// ==========================================================
import fs from "fs";

async function fuse() {
  const altitudes = JSON.parse(fs.readFileSync("./public/floreffe_altitudes.json", "utf8"));
  const forecasts = JSON.parse(fs.readFileSync("./public/floreffe_forecasts.json", "utf8"));
  const alerts = JSON.parse(fs.readFileSync("./public/floreffe_alerts.json", "utf8"));

  const zones = forecasts.zones.map(z => {
    const closest = altitudes.reduce((a,b)=>{
      const da=(z.lat-b.lat)**2+(z.lon-b.lon)**2;
      const db=(z.lat-a.lat)**2+(z.lon-a.lon)**2;
      return da<db?b:a;
    });
    const matchedAlerts = alerts.filter(a=>Math.abs(a.lat-z.lat)<0.002 && Math.abs(a.lon-z.lon)<0.002);
    return {
      ...z,
      alt: closest?.alt ?? z.alt ?? 100,
      alerts: matchedAlerts.map(a=>({
        type:a.type,
        level:a.level,
        reliability:a.reliability,
        description:a.description
      }))
    };
  });

  const output = { generated: new Date(), count: zones.length, zones };
  fs.writeFileSync("./public/floreffe_topoMeteo.json", JSON.stringify(output, null, 2));
  console.log(`✅ Fusion topo + météo complétée (${zones.length} zones)`);
}

fuse();
