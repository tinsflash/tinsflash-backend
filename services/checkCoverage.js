// PATH: services/checkCoverage.js
// Middleware Express pour vérifier si une zone est couverte ou non

const COVERED_REGIONS = [
  // UE27
  "Germany","Austria","Belgium","Bulgaria","Cyprus","Croatia","Denmark",
  "Spain","Estonia","Finland","France","Greece","Hungary","Ireland",
  "Italy","Latvia","Lithuania","Luxembourg","Malta","Netherlands",
  "Poland","Portugal","Czechia","Czech Republic","Romania","Slovakia",
  "Slovenia","Sweden",

  // Ajouts
  "Ukraine",
  "United Kingdom","UK","England","Scotland","Wales","Northern Ireland",
  "Norway",
  "USA","United States"
];

/**
 * Vérifie si une zone est couverte
 */
function isCovered(country) {
  if (!country) return false;
  return COVERED_REGIONS.includes(country);
}

/**
 * Middleware Express
 * - Si la zone est couverte → next()
 * - Si non couverte → réponse adaptée
 */
export default function checkCoverage(req, res, next) {
  const { zone } = req.params;

  if (!zone) {
    return res.status(400).json({ error: "Zone non spécifiée" });
  }

  if (isCovered(zone)) {
    return next();
  } else {
    return res.status(403).json({
      error: "Zone non couverte par la centrale météo",
      zone,
      covered: false,
      message: "Disponible uniquement avec abonnement Premium/Pro+",
    });
  }
}
