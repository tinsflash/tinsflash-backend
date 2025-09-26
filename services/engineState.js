import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_PATH = path.join(DATA_DIR, "engine-state.json");

let state = {
  runTime: null,
  zonesCovered: {},
  sources: {},
  alerts: [],
  errors: [],
  logs: [],
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STATE_PATH)) fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

export function loadEngineState() {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(STATE_PATH, "utf-8");
    state = JSON.parse(raw);
  } catch {
    ensureDataFile();
  }
  return state;
}

export function saveEngineState(newState) {
  state = newState;
  ensureDataFile();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  return state;
}

export function patchEngineState(patch) {
  const next = { ...loadEngineState(), ...patch };
  return saveEngineState(next);
}

export function addEngineLog(message) {
  const s = loadEngineState();
  s.logs.push({ message, timestamp: new Date().toISOString() });
  if (s.logs.length > 500) s.logs.shift();
  saveEngineState(s);
}

export function addEngineError(err) {
  const s = loadEngineState();
  s.errors.push({ error: String(err), timestamp: new Date().toISOString() });
  if (s.errors.length > 200) s.errors.shift();
  saveEngineState(s);
}

export function getEngineState() {
  return loadEngineState();
}
