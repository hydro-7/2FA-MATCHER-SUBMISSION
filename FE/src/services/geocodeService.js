import { MAP_CONFIG } from "../config/map";
import { GEOCODE, STORAGE_KEYS } from "../constants/app";

// Misses saved by earlier versions are dropped, so a place gets another try with the current lookup rules.
function readCache() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.GEOCODE)) ?? {};
    return Object.fromEntries(Object.entries(saved).filter(([, point]) => point));
  } catch {
    return {};
  }
}

const cache = readCache();
let queue = Promise.resolve();

function remember(key, value) {
  cache[key] = value;
  // A miss is remembered for this session only.
  if (!value) return;
  try {
    localStorage.setItem(STORAGE_KEYS.GEOCODE, JSON.stringify(cache, (_key, item) => (item === null ? undefined : item)));
  } catch {
    // Storage full or blocked: the in-memory cache still works for this session.
  }
}

// Requests run one at a time, spaced to respect the public geocoder's rate limit.
function search(query, near, isActive = () => true) {
  const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "1" });
  if (near) {
    const d = GEOCODE.VIEWBOX_DEG;
    params.set("viewbox", [near.lng - d, near.lat + d, near.lng + d, near.lat - d].join(","));
    params.set("bounded", "1");
  }
  const run = queue.then(async () => {
    // Skip lookups whose screen was left or restarted while they waited in the queue.
    if (!isActive()) throw new Error("cancelled");
    const response = await fetch(`${MAP_CONFIG.GEOCODER_URL}?${params}`, { headers: { Accept: "application/json" } });
    const [hit] = response.ok ? await response.json() : [];
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
  });
  queue = run.then(
    () => new Promise((resolve) => setTimeout(resolve, GEOCODE.SPACING_MS)),
    (error) => (error.message === "cancelled" ? null : new Promise((resolve) => setTimeout(resolve, GEOCODE.SPACING_MS))),
  );
  return run;
}

const FILLER = new Set(
  "a an and at by for from in of on the to with visit visiting lunch dinner breakfast brunch tour walk stroll trip explore exploring shopping sunset sunrise morning evening night".split(" "),
);

// Free-text activities ("Lunch at Nishiki Market", "Fushimi Inari Shrine visit") rarely match as typed:
// try the text, then the place words without activity words, then shorter prefixes of those.
export function candidates(text) {
  const words = text.replace(/[&,()]/g, " ").split(/\s+/).filter(Boolean);
  const place = words.filter((word) => !FILLER.has(word.toLowerCase()));
  // The place name can also sit at the end ("photo day in Arashiyama").
  const queries = [words, place, place.slice(0, GEOCODE.SHORT_WORDS), place.slice(0, 2), place.slice(-2), place.slice(-1)].map((list) => list.join(" "));
  return [...new Set(queries)].filter(Boolean);
}

export function cachedPlace(text, city) {
  const key = `${city}|${text}`.toLowerCase();
  return key in cache ? cache[key] : undefined;
}

export async function geocodePlace(text, city, near, isActive) {
  const key = `${city}|${text}`.toLowerCase();
  if (key in cache) return cache[key];
  let found = null;
  for (const query of candidates(text)) {
    try {
      found = await search(`${query}, ${city}`, near, isActive);
    } catch (error) {
      if (error.message === "cancelled") return undefined;
    }
    if (found) break;
  }
  remember(key, found);
  return found;
}

export async function geocodeCity(city) {
  const key = `city|${city}`.toLowerCase();
  if (key in cache) return cache[key];
  const found = await search(city).catch(() => null);
  if (found) remember(key, found);
  return found;
}
