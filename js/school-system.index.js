/* ===== Global toggles & state ===== */
let includeOrgInGlobal = false;
let currentChart = null;

const CHART_MODES = ['lines','bars','net']; // order requested
let chartModeIndex = 0; // default: lines


// jn.112025 — construct selection + header wiring (supports optional groupC)
(function () {
  const params = new URLSearchParams(window.location.search);
  const constructId = params.get('construct') || 'school-system';

  // 🔹 Store under the same name radar/scatter/milestone expect
  window.__CURRENT_CONSTRUCT_ID = constructId;

  // Helper to apply header + subconstruct labels for a given construct
  function applyConstructHeader(id) {
    if (typeof window.getConstructConfig !== 'function') return;
    const cfg = window.getConstructConfig(id);
    if (!cfg) return;

    const headerTitleEl = document.querySelector('.teal-header h2');
    if (headerTitleEl && cfg.headerTitle) {
      headerTitleEl.textContent = cfg.headerTitle;
    }

    const subAEl = document.querySelector('.subconstruct-toggle[data-group="groupA"]');
    const subBEl = document.querySelector('.subconstruct-toggle[data-group="groupB"]');
    let subCEl   = document.querySelector('.subconstruct-toggle[data-group="groupC"]');

    function buildSubconstructHTML(sub) {
      if (!sub) return '';
      const badgeColor = sub.badgeColor || '#A98FD4';
      const badgeText  = sub.badgeText || 'A';
      const title      = sub.title || '';
      const desc       = sub.description || '';
      return `
        <span style="
          background-color: ${badgeColor};
          color: white;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
          margin-right: 6px;
        ">${badgeText}</span>
        <b>${title}</b> ${desc}
      `;
    }

    // A
    if (subAEl && cfg.groupA) {
      subAEl.innerHTML = buildSubconstructHTML(cfg.groupA);
    }

    // B
    if (subBEl && cfg.groupB) {
      subBEl.innerHTML = buildSubconstructHTML(cfg.groupB);
    }

    // C (create if needed, remove if not in config)
    if (cfg.groupC) {
      if (!subCEl) {
        const container = subAEl ? subAEl.parentElement : null;
        if (container) {
          subCEl = document.createElement('span');
          subCEl.className = 'subconstruct-toggle';
          subCEl.dataset.group = 'groupC';
          subCEl.style.display = 'inline-block';
          container.appendChild(subCEl);
        }
      }
      if (subCEl) {
        subCEl.innerHTML = buildSubconstructHTML(cfg.groupC);
      }
    } else if (subCEl) {
      subCEl.remove();
    }
  }

  // Apply header on initial load
  applyConstructHeader(constructId);

  // Expose a helper so rpplmasterscripts.js can switch constructs
  window.setCurrentConstructAndRefresh = function setCurrentConstructAndRefresh(newId) {
    if (!newId) return;

    // 1) update global
    window.__CURRENT_CONSTRUCT_ID = newId;

    // 2) update the URL (?construct=...) without reloading
    const params = new URLSearchParams(window.location.search);
    params.set('construct', newId);
    const newUrl = window.location.pathname + '?' + params.toString() + window.location.hash;
    window.history.replaceState({}, '', newUrl);

    // 3) update header + subconstruct badges
    applyConstructHeader(newId);

    // 4) re-render whichever view is active
    const activeBtn = document.querySelector('.menu-btn.active');
    const view = activeBtn?.dataset?.view || 'overall';

    switch (view) {
      case 'radar':
        renderRadarChart();
        break;
      case 'scatter':
        renderScatterplot();
        break;
      case 'milestone':
        if (typeof renderMilestoneChart === 'function') {
          renderMilestoneChart();
        }
        break;
      case 'overall':
      default:
        renderChart();
        break;
    }
  };
})();




// Optional: hide old checkbox toggle if present
const oldToggle = document.getElementById('chartTypeToggle');
if (oldToggle) oldToggle.style.display = 'none';

// Cycle button wiring (falls back if missing)

const modeBtn = document.getElementById('chartModeBtn');

function labelModeBtn() {
  if (!modeBtn) return;
  const mode = CHART_MODES[chartModeIndex] || 'lines';
  modeBtn.textContent = 'CHART MODE: ' + mode.toUpperCase();
  modeBtn.dataset.mode = mode; // <-- drives the CSS skins
}

if (modeBtn) {
  modeBtn.addEventListener('click', () => {
    chartModeIndex = (chartModeIndex + 1) % CHART_MODES.length;

    // tiny pulse animation
    modeBtn.classList.remove('pulse');
    void modeBtn.offsetWidth; // reflow to restart animation
    modeBtn.classList.add('pulse');

    labelModeBtn();
    renderChart();
  });

  // initial label/skin
  labelModeBtn();
}

// distinct dash patterns per tool index (cycle as needed)
const LINE_DASH_STEPS = [[], [6,6], [2,6], [12,4,2,4], [1,3], [8,2]];
const GLOBAL_POINT_RADIUS = 3;
const GLOBAL_POINT_HOVER_RADIUS = 6;


function loessSmoothing(x, y, bandwidth = 0.5, steps = 100) {
  const loess = [];
  const n = x.length;

  for (let xi = 1; xi <= 5; xi += (5 - 1) / steps) {
    let weights = [];
    let distances = x.map(xj => Math.abs(xj - xi));
    const maxDistance = Math.max(...distances);
    for (let d of distances) {
      const w = Math.pow(1 - Math.pow(d / maxDistance, 3), 3);
      weights.push(isNaN(w) ? 0 : w);
    }
    let sumW = 0, sumWX = 0, sumWY = 0, sumWXX = 0, sumWXY = 0;
    for (let i = 0; i < n; i++) {
      const w = weights[i];
      const xi_ = x[i];
      const yi_ = y[i];
      sumW += w;
      sumWX += w * xi_;
      sumWY += w * yi_;
      sumWXX += w * xi_ * xi_;
      sumWXY += w * xi_ * yi_;
    }
    const meanX = sumWX / sumW;
    const meanY = sumWY / sumW;
    const beta = (sumWXY - sumWX * meanY) / (sumWXX - sumWX * meanX);
    const alpha = meanY - beta * meanX;
    loess.push({ x: xi, y: alpha + beta * xi });
  }

  return loess;
}




function getScatterplotOrg1vsGlobalPairs(org1Rows, org2Rows, org3Rows, question, offsetIndex = 0) {
  const formatDate = d => d.trim().replace(/\s+/g, '');
  const org1Map = {};
  const org2Map = {};
  const org3Map = {};
  const result = [];

  org1Rows.forEach(row => {
    const dateKey = formatDate(row.date);
    const val = +row[question];
    if (!isNaN(val)) org1Map[dateKey] = val;
  });

  org2Rows.forEach(row => {
    const dateKey = formatDate(row.date);
    const val = +row[question];
    if (!isNaN(val)) org2Map[dateKey] = val;
  });

  org3Rows.forEach(row => {
    const dateKey = formatDate(row.date);
    const val = +row[question];
    if (!isNaN(val)) org3Map[dateKey] = val;
  });

  Object.keys(org1Map).forEach(dateKey => {
    const org1Val = org1Map[dateKey];
    const org2Val = org2Map[dateKey];
    const org3Val = org3Map[dateKey];

    const valuesToAvg = [];
    if (!isNaN(org2Val)) valuesToAvg.push(org2Val);
    if (!isNaN(org3Val)) valuesToAvg.push(org3Val);
    if (includeOrgInGlobal && !isNaN(org1Val)) valuesToAvg.push(org1Val);

    if (!isNaN(org1Val) && valuesToAvg.length >= 2) {
      const globalAvg = valuesToAvg.reduce((a, b) => a + b, 0) / valuesToAvg.length;

      // Apply jitter
      const jitter = 0.08;
      const dx = (offsetIndex % 3 - 1) * jitter; // -0.08, 0, +0.08
      const dy = (Math.floor(offsetIndex / 3) % 3 - 1) * jitter;

      result.push({
        x: org1Val + dx,
        y: globalAvg + dy,
        date: dateKey
      });
    }
  });

  return result;
}


// 👇 Helper: Parse DD/MM/YYYY to Date
function parseDate(d) {
  const [day, month, year] = d.split('/');
  return new Date(`${year}-${month}-${day}`);
}

// 👇 Helper: Group by org + question
function groupByOrgAndQuestion(data) {
  const grouped = {};
  data.forEach(entry => {
    const key = `${entry.org} - ${entry.question}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  });
  return grouped;
}

// 👇 Helper: Assign colors based on label
function assignColor(label) {
  const palette = {
    'Org 1': '#3b82f6',
    'Org 2': '#f97316',
    'Org 3': '#10b981'
  };
  if (label.includes('vision')) return palette[label.split(' - ')[0]];
  if (label.includes('professional learning')) return lighten(palette[label.split(' - ')[0]]);
  return '#999';
}

// 👇 Helper: Lighten a color (simple fallback)
function lighten(hex, factor = 0.5) {
  const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
  const toHex = v => Math.min(255, Math.floor(v + (255 - v) * factor)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}


/* RENDER RADAR CHART */
// const GLOBAL_BASELINE = 'allOrgs'; // change to 'excludeCurrent' if you want
window.GLOBAL_BASELINE ??= 'allOrgs';


function toggleLines(startIndex, endIndex) {
  for (let i = startIndex; i <= endIndex; i++) {
    const meta = currentChart.getDatasetMeta(i);
    meta.hidden = meta.hidden === null ? true : !meta.hidden;
  }
  currentChart.update();
}

// Hardcode ranges here per mode
// Each pair is [startIndex, endIndex] passed to toggleLines(start, end)
const MODE_TOGGLE_MAP = {
  lines: {
    groupA: [[0, 1], [2, 3]],   
    groupB: [[4, 5], [6, 7]]
  },
  net: {
    groupA: [[0, 1]],           
    groupB: [[2, 3]]
  }
  // bars: (intentionally no mapping)
};

document.querySelectorAll('.subconstruct-toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const group = toggle.dataset.group; // "groupA" | "groupB"
    if (!currentChart) return;

    const mode = (typeof CHART_MODES !== 'undefined' && CHART_MODES[chartModeIndex]) || 'lines';
    const ranges = (MODE_TOGGLE_MAP[mode] && MODE_TOGGLE_MAP[mode][group]) || [];

    // Do nothing in bars mode (no ranges defined)
    ranges.forEach(([start, end]) => toggleLines(start, end));

    toggle.classList.toggle('grayed-out');
  });
});


// Include-self toggle (checked = include current org in global)
(function wireIncludeSelf() {
  const el = document.getElementById('includeSelfToggle');
  if (!el) return;

  // ---- STATE SYNC ----
  // Support either legacy boolean (includeOrgInGlobal) or new string (GLOBAL_BASELINE)
  const readBaseline = () =>
    (typeof window.GLOBAL_BASELINE === 'string')
      ? window.GLOBAL_BASELINE                         // 'allOrgs' | 'excludeCurrent'
      : (window.includeOrgInGlobal ? 'allOrgs' : 'excludeCurrent');

  const writeBaseline = (value /* 'allOrgs' | 'excludeCurrent' */) => {
    window.GLOBAL_BASELINE = value;
    window.includeOrgInGlobal = (value === 'allOrgs'); // keep legacy in sync
  };

  // Set initial toggle position from state
  el.checked = (readBaseline() === 'allOrgs');

  // Helper: which view is active?
  function getActiveView() {
    // Preferred: .menu-btn.active with data-view
    const btnView = document.querySelector('.menu-btn.active')?.dataset?.view;
    if (btnView) return btnView;

    // Fallbacks you might already have:
    if (window.__CURRENT_VIEW) return window.__CURRENT_VIEW;  // e.g., you set this on tab click
    return 'overall'; // final fallback
  }

  // Map view → renderer
  const RENDERERS = {
    overall: () => renderChart(),
    radar: () => renderRadarChart(),
    scatter: () => renderScatterplot(),
    milestone: () => renderMilestoneChart?.(), // optional if defined
  };

  // On toggle change: update baseline + re-render current view only
  el.addEventListener('change', () => {
    writeBaseline(el.checked ? 'allOrgs' : 'excludeCurrent');

    const view = getActiveView();
    const render = RENDERERS[view] || RENDERERS.overall;
    render();
  });
})();



function fmt2(n) {
  if (n == null || isNaN(n)) return '—';
  const r = Math.round((+n + Number.EPSILON) * 100) / 100; // robust 2dp round
  return Number.isInteger(r) ? String(r) : r.toFixed(2);    // 3  vs  1.20
}

function customTooltipHandler(context) {
  const tooltip = context.tooltip;
  const chart   = context.chart;
  const mode    = (typeof CHART_MODES !== 'undefined' && CHART_MODES[chartModeIndex]) || 'lines';

  const tooltipEl = document.getElementById('custom-tooltip');
  const tooltipBody = document.getElementById('tooltip-text');
  if (!tooltip || tooltip.opacity === 0) {
    if (tooltipEl) tooltipEl.style.display = 'none';
    return;
  }

  const dps = tooltip.dataPoints || [];
  if (!dps.length) return;
  const idx = dps[0].dataIndex;
  const month = dps[0].label;

  let html = '';

  // ---------- LINES + NET ----------
  if (mode === 'lines' || mode === 'net') {
    const ds = chart.data.datasets[dps[0].datasetIndex] || {};
    const colorHeader = ds.borderColor || '#0E9F94';

    const metaEntry  = (ds.meta && ds.meta[idx]) || {};
    const org1Val    = (typeof metaEntry.org1Val === 'number') ? metaEntry.org1Val : dps[0].raw;
    const globalAvg  = (typeof metaEntry.globalAvg === 'number') ? metaEntry.globalAvg : null;
    const hasGlobal  = typeof globalAvg === 'number';
    const netDiff    = (hasGlobal && typeof org1Val === 'number') ? (org1Val - globalAvg) : null;

    html += `
      <div style="background:${colorHeader};color:#fff;padding:10px 14px;border-radius:6px 6px 0 0;">
        <div style="font-size:15px;font-weight:bold;">${month}</div>
        <div style="font-size:13px;opacity:.95;">${ds.label || ''}</div>
      </div>
      <div style="background:#fff;color:#222;padding:12px 14px;border:1px solid #ccc;border-top:0;border-radius:0 0 6px 6px;font-size:13px;">
        <div style="margin:4px 0 10px 0;">
          <div style="color:#0E9F94;">You: <strong>${fmt2(org1Val)}</strong></div>
          ${hasGlobal ? `<div style="color:#FFB84D;">Global: <strong>${fmt2(globalAvg)}</strong></div>` : ''}
          ${mode === 'net' && netDiff != null
            ? `<div style="margin-top:6px;color:${netDiff>=0 ? '#0E9F94' : '#cc3b3b'};">Net difference: <strong>${netDiff>=0?'+':''}${fmt2(netDiff)}</strong></div>`
            : ''
          }
        </div>
    `;

    // Per-question details (only if present)
    const hasQ = Array.isArray(ds.questions) && ds.questions.length &&
                 Array.isArray(ds.perQuestionMonthlyValues) &&
                 Array.isArray(ds.globalQuestionMonthlyValues);

    if (hasQ) {
      html += `<div style="font-size:12px;color:#666;margin:6px 0 8px;"><em>Questions from this tool:</em></div>`;
      const MAX = 5;
      ds.questions.forEach((q, i) => {
        const orgVal = ds.perQuestionMonthlyValues?.[i]?.[idx];
        const globVal = ds.globalQuestionMonthlyValues?.[i]?.[idx];
        if (orgVal == null || globVal == null) return;
        const orgPct = Math.max(0, Math.min(100, (orgVal / MAX) * 100));
        const globPct = Math.max(0, Math.min(100, (globVal / MAX) * 100));
        html += `
          <div style="margin-bottom:16px;">
            <div style="font-weight:600;font-size:13px;margin-bottom:12px;">${q}</div>
            <div style="position:relative;height:30px;margin:2px 0 6px;">
              <div style="position:absolute;top:-13px;left:0;width:100%;display:flex;justify-content:space-between;font-size:11px;color:#888;">
                <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
              </div>
              <div style="height:8px;background:#eee;border-radius:4px;position:relative;overflow:hidden;">
                <div style="width:${orgPct}%;background:#0E9F94;height:8px;position:absolute;top:0;left:0;border-radius:4px;"></div>
                <div style="width:${globPct}%;background:#FFB84D;height:4px;position:absolute;top:2px;left:0;border-radius:4px;"></div>
              </div>
            </div>
            <div style="font-size:12px;color:#444;display:flex;justify-content:space-between;margin-top:-18px;">
              <div style="color:#0E9F94;">You: <strong>${fmt2(orgVal)}</strong></div>
              <div style="color:#FFB84D;">Global: <strong>${fmt2(globVal)}</strong></div>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
  }

  // ---------- BARS ----------
  if (mode === 'bars') {
    const colorHeader = '#26413c';
    const labels = chart.data.datasets.map(ds => ds.label || '');
    const orgIdx = labels.findIndex(l => /Your Org/i.test(l));
    const globIdx = labels.findIndex(l => /Global/i.test(l));
    const orgVal = orgIdx > -1 ? chart.data.datasets[orgIdx].data[idx] : null;
    const globVal = globIdx > -1 ? chart.data.datasets[globIdx].data[idx] : null;

    html += `
      <div style="background:${colorHeader};color:#fff;padding:10px 14px;border-radius:6px 6px 0 0;">
        <div style="font-size:15px;font-weight:bold;">${month}</div>
        <div style="font-size:13px;opacity:.95;">Monthly Averages</div>
      </div>
      <div style="background:#fff;color:#222;padding:12px 14px;border:1px solid #ccc;border-top:0;border-radius:0 0 6px 6px;font-size:13px;">
        ${orgVal != null ? `<div style="color:#0E9F94;margin-bottom:4px;">Your Org (Avg): <strong>${fmt2(+orgVal)}</strong></div>` : ''}
        ${globVal != null ? `<div style="color:#F4A300;">Global (Avg): <strong>${fmt2(+globVal)}</strong></div>` : ''}
        <div style="font-size:12px;color:#666;margin-top:8px;"><em>Aggregated across visible subconstructs.</em></div>
      </div>
    `;
  }


  // ===== Write HTML first so we can measure =====
  if (tooltipBody) tooltipBody.innerHTML = html;

  // ===== Position inside the modal/container, biased toward center =====
  // NOTE: do NOT re-declare tooltipEl (it's const above). Use a new name:
  const tipEl = document.getElementById('custom-tooltip');
  const canvasRect = chart.canvas.getBoundingClientRect();

  // Find the modal/container; fallback to body
  const containerEl =
    chart.canvas.closest('.modal-content, .modal-overlay, .modal') ||
    chart.canvas.parentElement ||
    document.body;

  const contRect = containerEl.getBoundingClientRect();

  // Make visible to measure
  tipEl.style.display = 'block';
  tipEl.style.visibility = 'hidden';
  const tipW = tipEl.offsetWidth || 260;
  const tipH = tipEl.offsetHeight || 120;

  // Cursor anchor (page coords)
  const anchorX = canvasRect.left + window.pageXOffset + tooltip.caretX;
  const anchorY = canvasRect.top  + window.pageYOffset + tooltip.caretY;

  // Container center (page coords)
  const centerX = contRect.left + window.pageXOffset + contRect.width / 2;
  const centerY = contRect.top  + window.pageYOffset + contRect.height / 2;

  // Prefer a side that faces inward toward center
  const gap = 12;
  let prefX = (anchorX < centerX) ? (anchorX + gap) : (anchorX - tipW - gap);
  let prefY = (anchorY > centerY) ? (anchorY - tipH - gap) : (anchorY + gap);

  // Bias toward container center (pulls tooltip inward)
  const biasX = 0.60; // increase to pull more toward center
  const biasY = 0.15;
  prefX = prefX * (1 - biasX) + (centerX - tipW / 2) * biasX;
  prefY = prefY * (1 - biasY) + (centerY - tipH / 2) * biasY;

  // Clamp within container bounds
  const pad = 8;
  const minX = contRect.left + window.pageXOffset + pad;
  const maxX = contRect.right + window.pageXOffset - tipW - pad;
  const minY = contRect.top + window.pageYOffset + pad;
  const maxY = contRect.bottom + window.pageYOffset - tipH - pad;

  const finalX = Math.max(minX, Math.min(maxX, prefX));
  const finalY = Math.max(minY, Math.min(maxY, prefY));

  // Apply
  tipEl.style.left = `${finalX}px`;
  tipEl.style.top  = `${finalY}px`;
  tipEl.style.visibility = 'visible';

}



// Chart View Switching Logic
document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // ✅ Update active tab style
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const view = btn.dataset.view;
    const chartArea = document.getElementById('chart-area');

    // ✅ Clear chart area
    chartArea.innerHTML = '';
    
    // ✅ Adjust margin-top of milestone legend block
    if (view === 'milestone') {
      milestoneLegendBlock.style.marginTop = '60%';
    } else {
      milestoneLegendBlock.style.marginTop = '30%';
    }
    
    if (view === 'overall') {
      document.getElementById('chartTypeToggleContainer').style.display = 'flex';
    }else {
      document.getElementById('chartTypeToggleContainer').style.display = 'none'; // ✅ Hide for all others
    }
    
    if (view === 'scatter') {
      document.getElementById('yourorgcircle').style.display = 'none';
      document.getElementById('yourorglabel').style.display = 'none';
    }else {
      document.getElementById('yourorgcircle').style.display = 'flex'; // ✅ Hide for all others
      document.getElementById('yourorglabel').style.display = 'flex';
    }

    if (view === 'overall') {
      // 🟢 Load the main comparison chart
      chartArea.innerHTML = '<canvas id="networthChart" width="900" height="380" style="width: 100%;"></canvas>';
      renderChart();
      document.getElementById('globalToggleContainer').style.display = 'flex';

    } else if (view === 'radar') {
      // 🟢 Load radar chart summary
      renderRadarChart();
      document.getElementById('globalToggleContainer').style.display = 'flex';

    } else if (view === 'milestone') {
      // 🟢 Load milestone graph
      renderMilestoneChart();
      document.getElementById('globalToggleContainer').style.display = 'none';

    } else if (view === 'scatter') {
      renderScatterplot();
      document.getElementById('globalToggleContainer').style.display = 'flex';
    }
  });
});


// === Explainers: centered, clamped, hoverable ===
(function setupExplainers() {
  const icons = document.querySelectorAll('.info-icon[data-tooltip-id]');
  if (!icons.length) return;

  function positionExplainer(icon, tip) {
    // show to measure
    tip.style.display = 'block';
    tip.style.visibility = 'hidden';

    const container =
      icon.closest('.modal-content, .white-box, .modal, .container') || document.body;

    const contRect = container.getBoundingClientRect();
    const icoRect  = icon.getBoundingClientRect();

    const tipW = tip.offsetWidth  || 360;
    const tipH = tip.offsetHeight || 240;

    // anchor at the icon
    const anchorX = icoRect.left + icoRect.width  / 2 + window.pageXOffset;
    const anchorY = icoRect.top  + icoRect.height / 2 + window.pageYOffset;

    // container center
    const centerX = contRect.left + contRect.width  / 2 + window.pageXOffset;
    const centerY = contRect.top  + contRect.height / 2 + window.pageYOffset;

    // prefer below if icon is in top half, else above
    const gap = 12;
    let prefY = (anchorY < centerY)
      ? (icoRect.bottom + gap + window.pageYOffset)
      : (icoRect.top - tipH - gap + window.pageYOffset);

    // start horizontally centered on icon, then bias toward container center
    let prefX = anchorX - tipW / 2;
    const biasX = 0.35; // pull toward center (0..1)
    prefX = prefX * (1 - biasX) + (centerX - tipW / 2) * biasX;

    // clamp to container
    const pad  = 8;
    const minX = contRect.left  + window.pageXOffset + pad;
    const maxX = contRect.right + window.pageXOffset - tipW - pad;
    const minY = contRect.top   + window.pageYOffset + pad;
    const maxY = contRect.bottom+ window.pageYOffset - tipH - pad;

    tip.style.left       = Math.max(minX, Math.min(maxX, prefX)) + 'px';
    tip.style.top        = Math.max(minY, Math.min(maxY, prefY)) + 'px';
    tip.style.visibility = 'visible';
  }

  icons.forEach(icon => {
    const id  = icon.dataset.tooltipId;
    const tip = document.getElementById(`${id}-tooltip`);
    if (!tip) return;

    let hideTimer;

    const show = () => {
      clearTimeout(hideTimer);
      positionExplainer(icon, tip);
      tip.style.display = 'block';
    };
    const hide = () => {
      hideTimer = setTimeout(() => { tip.style.display = 'none'; }, 120);
    };

    // keep open while hovering the panel
    icon.addEventListener('mouseenter', show);
    icon.addEventListener('mouseleave', hide);
    tip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    tip.addEventListener('mouseleave', hide);
  });
})();



renderRadarChart();
// Chart.defaults.datasets.line.spanGaps = true;


(function initExplainers(){
  if (window.__explainersInit) return; // prevent double init
  window.__explainersInit = true;

  const has = id => document.getElementById(id);

  // Radar (Org Snapshot)
  if (has('demoRadar')) {
    const rctx = document.getElementById('demoRadar').getContext('2d');
    new Chart(rctx, {
      type: 'radar',
      data: {
        labels: ['(A) Coherence','(B) Foundations', '(C) Congruence'],
        datasets: [
          { label:'Your Org', data:[3.6,3.1,2.2], borderColor:'#0E9F94', pointBackgroundColor:'#0E9F94', borderWidth:1.3, fill:false, pointRadius:2 },
          { label:'Global',   data:[3.2,3.4,2.3], borderColor:'#FFB84D', pointBackgroundColor:'#FFB84D', borderWidth:1.3, fill:false, pointRadius:2 }
        ]
      },
      options: {
        responsive:false, maintainAspectRatio:false,
        scales:{ r:{ min:0,max:5, ticks:{ stepSize:1 }, grid:{ circular:false }, pointLabels:{ font:{ size:10 } } } },
        plugins:{ legend:{ display:false } }
      }
    });
  }

  // Trends (Lines with hollow global)
  if (has('demoTrend')) {
    const months = ['Feb','Mar','Apr','May'];
    const org = [1.8,3.0,4.3,5.0];
    const glob= [3.4,3.5,3.5,3.0];
    const tctx = document.getElementById('demoTrend').getContext('2d');
    const trend = new Chart(tctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          { label:'Your Org', data: org, borderColor:'#6f55d6', backgroundColor:'#6f55d6', tension:0, pointRadius:3, borderWidth:1.4, fill:false },
          { label:'Global',   data: glob, borderColor:'#6f55d6', backgroundColor:'#fff', tension:0, pointRadius:3, pointBackgroundColor:'#fff', pointBorderColor:'#6f55d6', pointBorderWidth:1.6, borderWidth:0, fill:false }
        ]
      },
      options: {
        responsive:false, maintainAspectRatio:false,
        scales:{
          y:{ min:0, max:5, ticks:{ stepSize:1 } },
          x:{ grid:{ display:false } }
        },
        plugins:{ legend:{ display:false }, tooltip:{ enabled:false } }
      }
    });

    // little “play” animation revealing points left→right
    let i=0;
    const tick = () => {
      if (i>=months.length) { i=0; trend.data.datasets.forEach(ds => ds.data.forEach((_,j)=>ds.pointRadius=3)); }
      trend.setDatasetVisibility(0,true);
      trend.setDatasetVisibility(1,true);
      trend.update('none');
      i++;
    };
    setTimeout(()=>{ tick(); },400);
  }

  // Milestones (Goal line + pulsing dot)
  if (has('demoMilestone')) {
    const mctx = document.getElementById('demoMilestone').getContext('2d');
    const months = ['Feb','Mar','Apr','May'];
    const series = [3.1,3.4,3.6,3.8];
    const goal = 3.5;
    const firstHit = series.findIndex(v=>v>=goal); // 2 (Apr)

    new Chart(mctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          { label:'Your Org', data: series, borderColor:'#0E9F94', backgroundColor:'#0E9F94', tension:0, pointRadius:2.5, borderWidth:1.3, fill:false, order:2 },
          { label:'Goal', type:'line', data: months.map(()=>goal), borderColor:'#9ad9cf', borderDash:[6,4], borderWidth:1.2, pointRadius:0, order:1 }
        ]
      },
      options: {
        responsive:false, maintainAspectRatio:false,
        scales:{ y:{ min:0, max:5, ticks:{ stepSize:1 } }, x:{ grid:{ display:false } } },
        plugins:{ legend:{ display:false }, tooltip:{ enabled:false } }
      }
    });

    // pulse the first-hit point visually (CSS effect simulated with overlay)
    const pill = document.querySelector('.milestone-pill');
    if (firstHit>=0 && pill) pill.style.display = 'block';
  }

  // Scatter (Item-Level Relationships)
  if (has('demoScatter')) {
    const sctx = document.getElementById('demoScatter').getContext('2d');
    const orgPts   = [{x:2.0,y:3.2},{x:3.1,y:3.4},{x:4.2,y:3.6}];
    const globalPts= [{x:2.5,y:2.8},{x:3.0,y:3.1},{x:4.0,y:3.3}];
    const REF = [{x:0,y:0},{x:6,y:6}];

    // tiny linear trend
    const xs = [...orgPts,...globalPts].map(p=>p.x);
    const ys = [...orgPts,...globalPts].map(p=>p.y);
    const n=xs.length, sx=xs.reduce((a,b)=>a+b,0), sy=ys.reduce((a,b)=>a+b,0),
          sxy=xs.reduce((a,b,i)=>a+b*ys[i],0), sxx=xs.reduce((a,b)=>a+b*b,0),
          m=(n*sxy-sx*sy)/(n*sxx-sx*sx), b=(sy-m*sx)/n;
    const trend = Array.from({length:60},(_,i)=>{const x=i*(6/59);return {x, y: m*x+b};});

    new Chart(sctx, {
      type: 'scatter',
      data: {
        datasets: [
          { label:'Your Org', data: orgPts, pointRadius:3, pointBackgroundColor:'#0E9F94', pointBorderColor:'#0E9F94', pointBorderWidth:1.2, showLine:false, order:2 },
          { label:'Global',   data: globalPts, pointRadius:3, pointBackgroundColor:'#fff', pointBorderColor:'#FFB84D', pointBorderWidth:1.6, showLine:false, order:2 },
          { label:'Trend',    type:'line', data: trend, borderColor:'#777', borderDash:[3,2], borderWidth:1.4, pointRadius:0, fill:false, order:1 },
          { label:'y = x',    type:'line', data: REF,   borderColor:'#c9c9c9', borderDash:[5,5], borderWidth:1, pointRadius:0, fill:false, order:0 }
        ]
      },
      options: {
        responsive:false, maintainAspectRatio:false, parsing:false,
        scales:{ x:{ min:0,max:6, ticks:{ stepSize:1 } }, y:{ min:0,max:6, ticks:{ stepSize:1 } } },
        plugins:{ legend:{ display:false }, tooltip:{ enabled:false } }
      }
    });
  }
})();

function getSavedLogin() {
  try { return JSON.parse(localStorage.getItem('rppl_login') || 'null'); }
  catch { return null; }
}

function getParam(name) {
  const p = new URLSearchParams(location.search).get(name);
  return p && p.trim() ? p : null;
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = getSavedLogin();
  const org  = getParam('org')  || saved?.org      || 'org1';       // fallback if opened directly
  const user = getParam('user') || saved?.username || '(unknown)';

  // Expose for your existing code
  window.__CURRENT_ORG  = org;
  window.__CURRENT_USER = user;

  console.log('[boot] org =', org, 'user =', user);
	// jn.112025 — default construct on boot
	window.__CURRENT_CONSTRUCT_ID = window.__CURRENT_CONSTRUCT_ID || 'school-system';


  // TODO: call your existing render/init that needs org here, e.g.:
  // renderChartsForOrg(org);
  renderRadarChart();
});



// jn.112025 — helper so rpplmasterscripts.js can switch constructs
window.setCurrentConstructAndRefresh = function setCurrentConstructAndRefresh(constructId) {
  const id = constructId || 'school-system';
  window.__CURRENT_CONSTRUCT_ID = id;

  // If you have a central mode controller, call that here instead.
  // For now, this uses the same logic as your chart-mode buttons:
  if (window.CHART_MODES && typeof window.chartModeIndex === 'number') {
    const mode = window.CHART_MODES[window.chartModeIndex];
    if (mode && typeof mode.render === 'function') {
      mode.render();
      return;
    }
  }

  // Fallbacks if you don't have CHART_MODES wired:
  if (typeof window.renderChart === 'function') {
    // Overall view
    window.renderChart();
  } else if (typeof window.renderRadarChart === 'function') {
    window.renderRadarChart();
  }
};
