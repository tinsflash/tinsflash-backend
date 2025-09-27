// services/checkCoverage.js

// Liste zones couvertes (noms normalisés)
const COVERED = [
  "Germany","Austria","Belgium","Bulgaria","Cyprus","Croatia","Denmark",
  "Spain","Estonia","Finland","France","Greece","Hungary","Ireland",
  "Italy","Latvia","Lithuania","Luxembourg","Malta","Netherlands",
  "Poland","Portugal","Czechia","Romania","Slovakia","Slovenia","Sweden",
  "Ukraine","United Kingdom","Norway","USA"
];

export default function checkCoverage(req, res, next) {
  const { zone } = req.params;

  if (!zone) {
    req.coverage = { covered: false, type: "unknown" };
    return next();
  }

  const found = COVERED.find(
    (z) => z.toLowerCase() === zone.toLowerCase()
  );

  if (found) {
    req.coverage = { covered: true, type: "covered", zone: found };
  } else {
    req.coverage = { covered: false, type: "uncovered", zone };
  }

  return next();
}
