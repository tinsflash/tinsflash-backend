// services/checkCoverage.js
import { getEngineState } from "./engineState.js";

// Liste zones couvertes par défaut (fallback)
const STATIC_ZONES = [
  "Germany","Austria","Belgium","Bulgaria","Cyprus","Croatia","Denmark",
  "Spain","Estonia","Finland","France","Greece","Hungary","Ireland",
  "Italy","Latvia","Lithuania","Luxembourg","Malta","Netherlands",
  "Poland","Portugal","Czechia","Romania","Slovakia","Slovenia","Sweden",
  "Ukraine","United Kingdom","Norway","USA"
];

export default function checkCoverage(req, res, next) {
  const { zone } = req.params;
  const state = getEngineState();

  if (!zone) {
    req.coverage = {
      covered: Object.keys(state.zonesCovered || {}),
      type: "global"
    };
    return next();
  }

  const found = STATIC_ZONES.find(z => z.toLowerCase() === zone.toLowerCase());
  if (found) {
    const coveredNow = !!state.zonesCovered?.[found];
    req.coverage = { covered: coveredNow, type: "covered", zone: found };
  } else {
    req.coverage = { covered: false, type: "uncovered", zone };
  }

  return next();
}
