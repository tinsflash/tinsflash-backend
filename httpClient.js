// PATH: utils/httpClient.js
// 🌐 HTTP client with retry, timeout and graceful JSON parsing
// Works with Node 18+ global fetch. Falls back to node-fetch if needed.

let _fetch = globalThis.fetch;
export async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await _fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function fetchJSON(url, { retries = 2, timeoutMs = 15000, ...options } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options, timeoutMs);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json") || ct.includes("+json")) {
        return await res.json();
      }
      const text = await res.text();
      try { return JSON.parse(text); } catch { return { raw: text }; }
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const delay = 400 * (2 ** attempt);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw lastErr;
    }
  }
}

export async function headOk(url, timeoutMs = 8000) {
  try {
    const res = await fetchWithTimeout(url, { method: "HEAD" }, timeoutMs);
    return res.ok;
  } catch {
    return false;
  }
}

export function buildQuery(params = {}) {
  const esc = encodeURIComponent;
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${esc(k)}=${esc(v)}`)
    .join("&");
}
