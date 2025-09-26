// services/checkCoverage.js
// Middleware de couverture zones – VERSION TOLÉRANTE
// - accepte zone via :params, ?query ou body JSON
// - accepte codes alpha2 (BE, FR, US, GB, UA, NO...) et noms
// - renvoie 400 uniquement si AUCUNE zone fournie

const COVERED = new Set([
  // UE-27
  "AT","BE","BG","CY","HR","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
  // + extensions demandées
  "GB","UA","NO",
  // USA
  "US","USA"
]);

// petits alias fréquents pour tolérance d'input
const ALIASES = {
  "UNITED STATES":"US",
  "ETATS-UNIS":"US",
  "ÉTATS-UNIS":"US",
  "U.S.":"US",
  "U.S.A.":"US",
  "USA":"US",
  "UK":"GB",
  "UNITED KINGDOM":"GB",
  "GREAT BRITAIN":"GB",
  "ENGLAND":"GB",
  "ANGLETERRE":"GB",
  "UKRAINE":"UA",
  "NORWAY":"NO",
  "NORVEGE":"NO",
  "NORVÈGE":"NO",
  "BELGIUM":"BE",
  "BELGIQUE":"BE",
  "FRANCE":"FR",
};

function normalizeZone(z) {
  if (!z) return null;
  let s = String(z).trim().toUpperCase();
  if (ALIASES[s]) s = ALIASES[s];
  // tolère noms longs type "Belgique", "France", etc.
  if (s.length > 3 && ALIASES[s]) s = ALIASES[s];
  // tolère codes alpha-3
  if (s === "FRA") s = "FR";
  if (s === "BEL") s = "BE";
  if (s === "NOR") s = "NO";
  if (s === "UKR") s = "UA";
  if (s === "DEU") s = "DE";
  if (s === "USA") s = "US";
  return s;
}

export default function checkCoverage(req, res, next) {
  // >>> PRINCIPAL CHANGEMENT : on lit partout (params, query, body)
  const raw =
    (req.params && req.params.zone) ||
    (req.query && (req.query.zone || req.query.country)) ||
    (req.body && (req.body.zone || req.body.country));

  const zone = normalizeZone(raw);

  if (!zone) {
    return res.status(400).json({ error: "Zone non spécifiée" });
  }

  // on attache pour les handlers en aval (utile pour /api/chat par ex.)
  req.zone = zone;

  // détermine si zone couverte ou pas
  const covered = COVERED.has(zone);

  // si non couverte : on laisse passer l'appel (tu veux du 100% réel),
  // mais certains endpoints renverront un message adapté côté service,
  // et la page publique se servira d'Open Data.
  req.covered = covered;

  next();
}
