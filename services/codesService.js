export function generateCode(type) {
  let duration = "10 jours";
  if (type === "proplus") duration = "30 jours";

  const code = `TEST-${type.toUpperCase()}-${Math.random().toString(36).substr(2, 8)}`;

  return {
    type,
    code,
    duration,
    status: "Code généré avec succès"
  };
}

