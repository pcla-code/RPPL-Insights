// js/school-system.org.js — org/user mapping + org list helpers
// jn.112025

/* ===== CONFIG ===== */
const USER_MAP_CANDIDATES = [
  '/config/usermap.csv',
  'config/usermap.csv'
];

/* ===== UTILS ===== */
function normalizeUserBasic(u = '') {
  return u.trim()
    .replace(/^.*\\/, '')   // DOMAIN\user  -> user
    .replace(/@.*$/, '')    // user@domain -> user
    .replace(/[\"']/g, '')  // strip quotes
    .trim();
}

function normalizeKey(u = '') {
  return normalizeUserBasic(u)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

async function fetchTextNoStore(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/* ===== CORE: user → org map ===== */

let __userMapCache = null;

async function loadUserOrgMap() {
  if (__userMapCache) return __userMapCache;

  let text = '';
  let source = '';

  for (const path of USER_MAP_CANDIDATES) {
    try {
      text = await fetchTextNoStore(path);
      source = path;
      break;
    } catch {
      // keep trying next candidate
    }
  }

  if (!text) {
    console.warn(
      '[usermap] could not load map from any candidate:',
      USER_MAP_CANDIDATES
    );
    __userMapCache = {
      __meta: { source: '(none)', rows: 0, keys: [] }
    };
    return __userMapCache;
  }

  const map = {};
  let rows = 0;

  text.split(/\r?\n/).forEach((line, i) => {
    const s = line.replace(/^\uFEFF/, '').trim();
    if (!s || s.startsWith('#')) return;

    // optional header skip
    if (i === 0 && /^user\s*,\s*org$/i.test(s)) return;

    const [u, o] = s.split(',').map(x => (x || '').trim());
    if (!u || !o) {
      console.warn(`[usermap] skip line ${i + 1}: "${line}"`);
      return;
    }
    map[normalizeKey(u)] = o.toLowerCase();
    rows++;
  });

  __userMapCache = {
    ...map,
    __meta: { source, rows, keys: Object.keys(map) }
  };

  return __userMapCache;
}

/* ===== Discover all org IDs from config/usermap.csv ===== */

async function getAllOrgIds() {
  const map = await loadUserOrgMap();
  const ids = new Set();

  Object.entries(map).forEach(([k, v]) => {
    if (k === '__meta') return;
    if (v) ids.add(String(v).toLowerCase());
  });

  const out = Array.from(ids).sort();
  if (!out.length) {
    console.warn(
      '[usermap] No orgs found; falling back to ["org1","org2","org3"]'
    );
    return ['org1', 'org2', 'org3'];
  }
  return out;
}
