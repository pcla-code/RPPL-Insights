// login.js

// org → display label
const ORG_LABELS = {
  org1: 'UBE',
  org2: 'LE',
  org3: 'ANet',
  org4: 'IP',
  org5: 'TL',
  org6: 'TNTP'
};
const orgLabel = (org) => ORG_LABELS[(org || '').toLowerCase()] || (org || '');


// --- small CSV helper (2- or 3-column) ---
async function loadUserOrgMap() {
  const res = await fetch('config/usermap.csv', { cache: 'no-store' });
  if (!res.ok) throw new Error('Cannot load config/usermap.csv');
  const text = await res.text();

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  // Expect: username,org[,password]
  const map = Object.create(null);
  const passwords = Object.create(null); // only if third column exists
  let hasPasswords = false;

  for (const line of lines) {
    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 2) continue;
    const [u, org, pw] = parts;
    const key = normalizeKey(u);
    // map[key] = org;
		map[key] = (org || '').toLowerCase();   // NEW

    if (typeof pw === 'string' && pw.length > 0) {
      hasPasswords = true;
      passwords[key] = pw;
    }
  }

  return { map, passwords, hasPasswords, __meta: { rows: lines.length } };
}

function normalizeKey(s) {
  return (s || '').toLowerCase().trim();
}
function normalizeUserBasic(s) {
  return (s || '').trim();
}

// --- UI bits ---
function showLoginModal() {
  document.getElementById('loginModal').style.display = 'flex';
  setTimeout(() => document.getElementById('loginUsername').focus(), 0);
}
function hideLoginModal() {
  document.getElementById('loginModal').style.display = 'none';
}
function showLoginError(msg) {
  const el = document.getElementById('loginError');
  el.textContent = msg;
  el.style.display = 'block';
}
function clearLoginError() {
  const el = document.getElementById('loginError');
  el.textContent = '';
  el.style.display = 'none';
}

/*
function writeLoginBanner(username, org, note = '') {
  const el = document.getElementById('loginBanner');
  if (!el) return;
  el.style.display = 'inline-flex';
  el.textContent = `Logged in as ${username || '—'} → ${org}${note ? ' ' + note : ''}`;
}
*/

function writeLoginBanner(username, org, note = '') {
  const el = document.getElementById('loginBanner');
  if (!el) return;
  el.style.display = 'inline-flex';
  el.textContent = `Logged in as ${username || '—'} → ${orgLabel(org)}` + (note ? ` ${note}` : '');
}


// --- sources of truth ---
// Priority: 1) ?user/?org, 2) saved localStorage, 3) modal
async function resolveUserAndOrg() {
  const mapData = await loadUserOrgMap();

  // 1) URL overrides
  const qs = new URLSearchParams(location.search);
  const qsUser = qs.get('user');
  const qsOrg = qs.get('org');
	/*
  if (qsUser) {
    const k = normalizeKey(qsUser);
    const org = qsOrg ? normalizeKey(qsOrg) : (mapData.map[k] || 'org1');
    persistLogin(qsUser, org, 'query override');
    return { username: qsUser, org, source: 'query' };
  }
	*/
	if (qsUser) {
		const k = normalizeKey(qsUser);
		let org = qsOrg ? normalizeKey(qsOrg) : (mapData.map[k] || 'org1');
		org = (org || 'org1').toLowerCase();             // normalize
		persistLogin(qsUser, org, 'query override');
		return { username: qsUser, org, source: 'query' };
	}


  // 2) Local storage
  const saved = getSavedLogin();
  if (saved?.username && saved?.org) {
    writeLoginBanner(saved.username, saved.org, ''); // (saved)
    window.__CURRENT_USER = saved.username;
    window.__CURRENT_ORG = saved.org;
    return { username: saved.username, org: saved.org, source: 'local' };
  }

  // 3) Modal
  const creds = await promptForCredentials(mapData);
  persistLogin(creds.username, creds.org, '');
  return { username: creds.username, org: creds.org, source: 'modal' };
}

/*
function persistLogin(username, org, note = '') {
  localStorage.setItem('rppl_login', JSON.stringify({ username, org, ts: Date.now() }));
  writeLoginBanner(username, org, note ? `(${note})` : '');
  window.__CURRENT_USER = username;
  window.__CURRENT_ORG = org;
}
*/

function persistLogin(username, org, note = '') {
  const payload = { username, org: (org || '').toLowerCase(), label: orgLabel(org), ts: Date.now() };
  localStorage.setItem('rppl_login', JSON.stringify(payload));
  writeLoginBanner(username, payload.org, note ? `(${note})` : '');
  window.__CURRENT_USER = username;
  window.__CURRENT_ORG  = payload.org;
}


function getSavedLogin() {
  try {
    return JSON.parse(localStorage.getItem('rppl_login') || 'null');
  } catch { return null; }
}

// Shows modal and validates against usermap
function promptForCredentials(mapData) {
  return new Promise((resolve) => {
    const modal = document.getElementById('loginModal');
    const form = document.getElementById('loginForm');
    const inputU = document.getElementById('loginUsername');
    const inputP = document.getElementById('loginPassword');
    const cancel = document.getElementById('loginCancelBtn');

    clearLoginError();
    showLoginModal();

    const submitHandler = (ev) => {
      ev.preventDefault();
      clearLoginError();

      const rawUser = inputU.value || '';
      const pw = inputP.value || '';
      const key = normalizeKey(rawUser);

      // Try exact match; if missing, attempt starts-with fuzzy (your old behavior)
      let org = mapData.map[key];
      if (!org) {
        const keys = Object.keys(mapData.map);
        const hit = keys.find(k => k.startsWith(key) || key.startsWith(k));
        if (hit) org = mapData.map[hit];
      }

      if (!org) {
        showLoginError('User not found. Please check your username.');
        return;
      }

      if (mapData.hasPasswords) {
        const expected = mapData.passwords[key] ?? null;
        if (expected !== null && expected !== pw) {
          showLoginError('Invalid password.');
          return;
        }
      }
      hideLoginModal();

      resolve({ username: normalizeUserBasic(rawUser), org });
      cleanup();
    };

    const cancelHandler = () => {
      // Optional: allow cancel to default to org1 or keep modal open
      // Here we keep the modal open to ensure a selection.
      showLoginError('Please sign in to continue.');
    };

    function cleanup() {
      form.removeEventListener('submit', submitHandler);
      cancel.removeEventListener('click', cancelHandler);
    }

    form.addEventListener('submit', submitHandler);
    cancel.addEventListener('click', cancelHandler);
  });
}

// ---- Public entrypoint you call before loading data ----
window.resolveCurrentOrgId = async function resolveCurrentOrgId() {
  try {
    const { username, org, source } = await resolveUserAndOrg();
    console.info('[login] resolved:', { username, org, source });
    return org;
  } catch (e) {
    console.error('[login] resolve failed:', e);
    writeLoginBanner('(unknown)', 'org1', '(error)');
    window.__CURRENT_ORG = 'org1';
    return 'org1';
  }
};

// Optional debug helper
window.DEBUG_userOrg = async () => {
  const { map, hasPasswords, __meta } = await loadUserOrgMap();
  const saved = getSavedLogin();
  console.table([
    { field: 'userRows', value: __meta.rows },
    { field: 'hasPasswords', value: hasPasswords },
    { field: 'savedUser', value: saved?.username || '(none)' },
    { field: 'savedOrg', value: saved?.org || '(none)' },
  ]);
};


document.addEventListener('DOMContentLoaded', async () => {
	// Triggers the modal and saves {username, org} to localStorage
	const org = await window.resolveCurrentOrgId();

	// After login, force sub-iframe pages to reload so they read localStorage
	document.querySelectorAll('iframe').forEach(f => {
		const u = new URL(f.src, location.href);
		// Optional: also pass org/user for determinism (nice to have)
		if (window.__CURRENT_USER) u.searchParams.set('user', window.__CURRENT_USER);
		if (org) u.searchParams.set('org', org);
		// Cache-bust so it actually reloads
		u.searchParams.set('v', Date.now());
		f.src = u.toString();
	});
});

