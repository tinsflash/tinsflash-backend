// hiddensources/comparator.js

function mergeForecasts(sources) {
  if (!sources || sources.length === 0) return null;

  try {
    return {
      source: "Comparator",
      temperature_min: average(sources.map(s => s.temperature_min)),
      temperature_max: average(sources.map(s => s.temperature_max)),
      wind: average(sources.map(s => s.wind)),
      precipitation: average(sources.map(s => s.precipitation)),
      reliability: average(sources.map(s => s.reliability || 50)),
      description: majorityDescription(sources)
    };
  } catch (err) {
    console.error("❌ Comparator error:", err.message);
    return null;
  }
}

function average(values) {
  if (!values || values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function majorityDescription(sources) {
  const freq = {};
  sources.forEach(s => {
    if (s.description) {
      freq[s.description] = (freq[s.description] || 0) + 1;
    }
  });
  return Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0] || "Conditions variables";
}

export default { mergeForecasts };
