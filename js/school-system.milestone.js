// js/school-system.milestone.js — milestone / goal chart
// Depends on: Chart.js, loadCSV(), formatMonth(), resolveCurrentOrgId(),
// window.__CURRENT_ORG, currentChart, LINE_DASH_STEPS (optional),
// getMilestoneDataForConstruct(), window.__CURRENT_CONSTRUCT_ID.

function customMilestoneTooltip(context) {
  const tooltipModel = context.tooltip;
  const tooltipEl = document.getElementById('custom-tooltip');

  if (!tooltipEl) return;

  if (tooltipModel.opacity === 0) {
    tooltipEl.style.display = 'none';
    return;
  }

  const dataPoint = tooltipModel.dataPoints?.[0];
  if (!dataPoint) return;

  const month = dataPoint.label;

  // For now: just show "Neithan"
  const body = document.getElementById('tooltip-text');
  if (body) {
    body.innerHTML = `
      <div style="background: #0E9F94; color: white; padding: 10px 14px; border-radius: 6px 6px 0 0;">
        <div style="font-size: 15px; font-weight: bold;">${month}</div>
      </div>
      <div style="background: white; color: #222; padding: 14px 18px; border-radius: 0 0 6px 6px; font-size: 13px; border: 1px solid #ccc;">
        <strong>Neithan</strong>
      </div>
    `;
  }

  const canvas = context.chart.canvas;
  const rect = canvas.getBoundingClientRect();
  tooltipEl.style.left = rect.left + window.pageXOffset + tooltipModel.caretX + 'px';
  tooltipEl.style.top  = rect.top  + window.pageYOffset + tooltipModel.caretY + 'px';
  tooltipEl.style.display = 'block';
}


// Legacy helpers (kept here in case you wire them later)
function checkCondition(value, conditionString) {
  const match = String(conditionString || '').match(/(<=|>=|<|>|=)\s*([\d.]+)/);
  if (!match) return false;

  const [, operator, number] = match;
  const threshold = parseFloat(number);
  if (isNaN(threshold)) return false;

  switch (operator) {
    case '>':  return value >  threshold;
    case '<':  return value <  threshold;
    case '>=': return value >= threshold;
    case '<=': return value <= threshold;
    case '=':  return value === threshold;
    default:   return false;
  }
}

function getAllMonths(dataset) {
  const set = new Set();
  (dataset || []).forEach(row => {
    const formatted = formatMonth(row.date);
    if (formatted) set.add(formatted);
  });
  return Array.from(set).sort((a, b) => new Date(a) - new Date(b));
}

const milestoneColors = ['#FF9F40', '#FF6384', '#9966FF', '#00D084', '#FFCD56', '#4C9AFF', '#638FF4'];
let milestoneColorIndex = 0;

const milestoneYPositions = [-0.5, -1, -1.5, -2, -2.5, -3, -3.5, -4, -4.5];
let milestoneYIndex = 0;

let milestoneMarkers = [];

function renderGoalList() {
  const goalListDiv = document.getElementById('goalList');
  if (!goalListDiv) return;

  goalListDiv.innerHTML = '';

  milestoneMarkers.forEach((marker, index) => {
    const goalItem = document.createElement('div');
    goalItem.style.display = 'flex';
    goalItem.style.alignItems = 'center';
    goalItem.style.justifyContent = 'space-between';
    goalItem.style.gap = '12px';

    goalItem.innerHTML = `
      <span style="font-size: 14px;">Goal ${index + 1} – ${marker.label}</span>
      <button style="background: none; border: none; color: crimson; font-weight: bold; cursor: pointer;" onclick="removeGoal(${index})">✕</button>
    `;

    goalListDiv.appendChild(goalItem);
  });
}

function removeGoal(index) {
  milestoneMarkers.splice(index, 1);
  renderGoalList();
  renderMilestoneChart();
}


// Main milestone renderer
async function renderMilestoneChart({ condition = '> 3' } = {}) {
  if (currentChart) currentChart.destroy?.();

  // Resolve current construct
  const CONSTRUCT_ID = window.__CURRENT_CONSTRUCT_ID || 'school-system';
  console.debug('[milestone] CONSTRUCT_ID =', CONSTRUCT_ID);

  // UI shell
  const chartArea = document.getElementById('chart-area');
  chartArea.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <canvas id="milestoneChart" width="900" height="330" style="width:100%;"></canvas>

      <div style="
        display:flex;align-items:center;flex-wrap:wrap;gap:12px;
        padding:10px 15px;background:#e6f7f5;border-radius:8px;
        font:14px/1.2 system-ui,'Segoe UI',Roboto,sans-serif;color:#00332e;
        box-shadow:0 2px 5px rgba(0,0,0,.05);
      ">
        <label for="surveySelect" style="font-weight:600;">Sub-construct:</label>
        <select id="surveySelect" style="
          padding:6px 10px;border:1px solid #b2dcd7;border-radius:6px;background:#fff;color:#00332e;font-weight:500;
        "></select>

        <label for="thresholdInput" style="font-weight:600;">Goal:</label>
        <input id="thresholdInput" type="text" placeholder="e.g., > 3.4" style="
          width:90px;padding:6px 10px;border:1px solid #b2dcd7;border-radius:6px;background:#fff;color:#00332e;font-weight:500;
        ">

        <label for="goalMonthInput" style="font-weight:600;">Month:</label>
        <input id="goalMonthInput" type="text" placeholder="e.g., May 2026 or 05/2026" style="
          width:140px;padding:6px 10px;border:1px solid #b2dcd7;border-radius:6px;background:#fff;color:#00332e;font-weight:500;
        ">

        <button id="addMilestoneBtn" style="
          padding:6px 12px;background:#0e9f94;border:none;border-radius:6px;color:#fff;font-weight:600;cursor:pointer;
          transition:background .3s ease;
        " onmouseover="this.style.background='#0b877e'" onmouseout="this.style.background='#0e9f94'">
          Add Goal
        </button>
      </div>
    </div>
  `;

  // --- helpers ---
  const avg  = (a)=> a && a.length ? a.reduce((x,y)=>x+y,0)/a.length : null;
  const parseCond = (s) => {
    const m = String(s||'').trim().match(/(<=|>=|<|>|=)\s*([\d.]+)/);
    if (!m) return null;
    return { op: m[1], t: parseFloat(m[2]) };
  };
  const evalCond = (v, {op, t}) => {
    if (v == null || isNaN(v)) return false;
    switch (op) {
      case '>':  return v >  t;
      case '>=': return v >= t;
      case '<':  return v <  t;
      case '<=': return v <= t;
      case '=':  return v === t;
      default:   return false;
    }
  };

  // Month helpers (no Date() ambiguity)
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MONTH_INDEX = Object.fromEntries(MONTH_NAMES.map((m,i)=>[m.toLowerCase(), i]));

  // Accepts "May 2026", "05/2026", "2026-05", "May/2026"
  function normalizeMonthInput(s) {
    if (!s) return null;
    const t = String(s).trim();
    let m = t.match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (m) {
      const mi = MONTH_INDEX[m[1].toLowerCase()];
      if (mi != null) return `${MONTH_NAMES[mi]} ${m[2]}`;
    }
    m = t.match(/^(\d{1,2})[\/\-](\d{4})$/);
    if (m) {
      const mm = Math.min(Math.max(parseInt(m[1],10),1),12);
      return `${MONTH_NAMES[mm-1]} ${m[2]}`;
    }
    m = t.match(/^(\d{4})[\/\-](\d{1,2})$/);
    if (m) {
      const mm = Math.min(Math.max(parseInt(m[2],10),1),12);
      return `${MONTH_NAMES[mm-1]} ${m[1]}`;
    }
    return null;
  }

  function sortMonthLabels(labels) {
    return labels.slice().sort((a,b) => {
      const [ma,ya] = a.split(' '), [mb,yb] = b.split(' ');
      const da = { y:+ya, m:MONTH_INDEX[ma.toLowerCase()] ?? 0 };
      const db = { y:+yb, m:MONTH_INDEX[mb.toLowerCase()] ?? 0 };
      return (da.y - db.y) || (da.m - db.m);
    });
  }

  function ensureLabel(chart, label) {
    const labels = chart.data.labels;
    if (labels.includes(label)) return;
    const sorted = sortMonthLabels(labels.concat(label));
    const newIndex = sorted.indexOf(label);

    chart.data.datasets.forEach(ds => {
      const old = Array.isArray(ds.data) ? ds.data.slice() : [];
      const newArr = new Array(sorted.length).fill(null);
      labels.forEach((lab, oldI) => {
        const newI = sorted.indexOf(lab);
        newArr[newI] = old[oldI] ?? null;
      });
      ds.data = newArr;
    });
    chart.data.labels = sorted;
  }

  // Which org am I?
  const CURRENT_ORG = (window.__CURRENT_ORG) ||
                      (typeof resolveCurrentOrgId === 'function' ? await resolveCurrentOrgId() : 'org1');

  // 🔹 BASE / FALLBACK sets (School & System original config)
  const defaultSets = [
    {
      label: '(A) HQIM Coherence - Teacher Survey',
      color: '#A98FD4',
      fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
      questions: [
        "How well does your school leaders' vision for instruction align with your adopted curriculum?"
      ]
    },
    {
      label: '(A) HQIM Coherence - School Leader Survey',
      color: '#A98FD4',
      fileOf: (org) => `orgdata/${org}_school_leader_survey.csv`,
      questions: [
        "How much of a priority is implementation of [curriculum] for your school?",
        "How aligned is your HQIM To what extent are teachers held accountable to implementing [curriculum] through performance evaluations?",
        "To what extent is implementation of [curriculum] integrated with other school systems and initiatives (e.g. assessments and RTI)?"
      ]
    },
    {
      label: '(B) Foundational Structures - School Leader Survey',
      color: '#4C9AFF',
      fileOf: (org) => `orgdata/${org}_school_leader_survey.csv`,
      questions: [
        "How often does school leadership review data on implementation of [curriculum] to support continuous improvement?"
      ]
    },
    {
      label: '(B) Foundational Structures - Teacher Survey',
      color: '#4C9AFF',
      fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
      questions: [
        "Do you have sufficient time to engage in professional learning focused on [curriculum]?"
      ]
    }
  ];

  // 🔹 NEW: pull sets from shared data config for this construct
  let configForConstruct = null;
  if (typeof window.getMilestoneDataForConstruct === 'function') {
    configForConstruct = window.getMilestoneDataForConstruct(CONSTRUCT_ID);
  }

  let sets = (configForConstruct && Array.isArray(configForConstruct.sets) && configForConstruct.sets.length)
    ? configForConstruct.sets
    : defaultSets;

  console.debug('[milestone] using sets for construct', CONSTRUCT_ID, sets);

  // Populate dropdown
  const select = document.getElementById('surveySelect');
  sets.forEach((s, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = s.label;
    select.appendChild(opt);
  });
  select.value = '0';

  // Load your org’s series for each set
  const processed = []; // {label,color, series: month->avg}
  const allMonthsSet = new Set();

  const csvCache = {};
  const getCSV = async (path) => {
    if (csvCache[path]) return csvCache[path];
    try {
      const data = await loadCSV(path);
      csvCache[path] = data;
      return data;
    } catch (e) {
      console.warn('[milestone] failed to load', path, e);
      csvCache[path] = [];
      return [];
    }
  };

  for (const s of sets) {
    const rows = await getCSV(s.fileOf(CURRENT_ORG));

    // month -> avg across the set.questions
    const bucket = {}; // m -> [values]
    rows.forEach(r => {
      const m = formatMonth(r.date);
      if (!m) return;
      const vals = s.questions
        .map(q => parseFloat(r[q]))
        .filter(v => !isNaN(v));
      if (!vals.length) return;
      (bucket[m] ||= []).push(avg(vals));
    });

    const series = {};
    Object.entries(bucket).forEach(([m, arr]) => {
      const v = avg(arr);
      if (v != null) { series[m] = v; allMonthsSet.add(m); }
    });

    processed.push({ label: s.label, color: s.color, series, questions: s.questions });
  }

  // Shared x-axis (union of months across sub-constructs)
  const allMonths = Array.from(allMonthsSet).sort((a,b)=> new Date(a+' 1') - new Date(b+' 1'));

  // Dash palette
  const LINE_DASH_STEPS_LOCAL = (window.LINE_DASH_STEPS && Array.isArray(window.LINE_DASH_STEPS))
    ? window.LINE_DASH_STEPS
    : [[], [6,6], [2,6], [12,4,2,4], [1,3], [8,2]];

  function subKey(label){ const m = label.match(/^\((\w)\)/); return m? m[1].toUpperCase() : 'A'; }

  // Build datasets: one line per sub-construct (Your Org only), no markers
  const seenIdx = {};
  const datasets = processed.map(p => {
    const sk = subKey(p.label);
    const idx = seenIdx[sk] = (seenIdx[sk] ?? 0) + 1;
    return {
      label: `${p.label} (Your Org)`,
      data: allMonths.map(m => (m in p.series ? p.series[m] : null)),
      borderColor: p.color,
      backgroundColor: p.color,
      tension: 0,
      fill: false,
      borderWidth: 1.8,
      borderDash: LINE_DASH_STEPS_LOCAL[(idx-1) % LINE_DASH_STEPS_LOCAL.length],
      pointRadius: 0,
      pointHoverRadius: 0,
      pointHitRadius: 8,
      pointStyle: 'line',
      order: 1
    };
  });

  // Init chart
  const ctx = document.getElementById('milestoneChart').getContext('2d');
  currentChart = new Chart(ctx, {
    type: 'line',
    data: { labels: allMonths, datasets },
    options: {
      scales: {
        y: { min: 0, max: 6, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.08)' } },
        x: { grid: { display: false }, ticks: { color: '#0E9F94', font: { weight: 'bold', size: 14 }, padding: 25 } }
      },
      plugins: {
        tooltip: { enabled: false }, // lines don’t show tooltips; goals will
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true, boxWidth: 16, boxHeight: 14, padding: 10,
            font: { size: 14, weight: '400' },
            generateLabels(chart) {
              const base = Chart.defaults.plugins.legend.labels.generateLabels(chart);
              const items = base.filter(it => !(chart.data.datasets?.[it.datasetIndex]?.skipLegend));
              items.forEach(it => {
                const ds = chart.data.datasets[it.datasetIndex] || {};
                const visible = chart.isDatasetVisible(it.datasetIndex);
                it.hidden = false;
                const isLine = (ds.type ?? chart.config.type) === 'line';
                if (isLine && !ds.noLine) {
                  it.pointStyle  = 'line';
                  it.fillStyle   = undefined;
                  it.strokeStyle = visible ? (ds.borderColor || '#666') : '#c2c2c2';
                  it.lineWidth   = ds.borderWidth ?? 1.8;
                  it.lineDash    = Array.isArray(ds.borderDash) ? ds.borderDash.slice() : [];
                } else {
                  it.pointStyle  = ds.pointStyle || 'circle';
                  const fill   = ds.pointBackgroundColor ?? ds.backgroundColor ?? '#fff';
                  const stroke = ds.pointBorderColor     ?? ds.borderColor     ?? '#000';
                  const lw     = ds.pointBorderWidth     ?? ds.borderWidth     ?? 1.6;
                  it.fillStyle   = visible ? fill   : '#e0e0e0';
                  it.strokeStyle = visible ? stroke : '#c2c2c2';
                  it.lineWidth   = lw;
                  it.lineDash    = [];
                }
                it.color = visible ? '#000' : '#999';
                it.fontColor = it.color;
              });
              return items;
            }
          },
          onClick(e, item, legend) {
            const chart = legend.chart;
            const idx = item.datasetIndex;
            const vis = chart.isDatasetVisible(idx);
            chart.setDatasetVisibility(idx, !vis);
            chart.update();
          },
          onHover(e, item, legend) {
            const chart = legend.chart;
            chart.canvas.style.cursor = 'pointer';
            chart._legendHoverIndex = item.datasetIndex;
            chart.canvas.oncontextmenu = evt => {
              evt.preventDefault();
              const i = chart._legendHoverIndex;
              if (i == null) return;
              const ds = chart.data.datasets[i];
              if (!ds || !/^Goal:/.test(ds.label || '')) return;
              if (confirm(`Delete "${ds.label}"?`)) {
                chart.data.datasets.splice(i, 1);
                chart.update();
              }
            };
          },
          onLeave(e, item, legend) {
            const chart = legend.chart;
            chart.canvas.style.cursor = 'default';
            chart._legendHoverIndex = null;
            chart.canvas.oncontextmenu = null;
          }
        }
      }
    }
  });

  // --- GOAL add button ---
  const GOAL_COLORS = ['#FF9F40','#FF6384','#9966FF','#00D084','#FFCD56','#4C9AFF','#638FF4'];
  let goalColorIdx = 0;

  const surveySelect = document.getElementById('surveySelect');
  const thresholdInput = document.getElementById('thresholdInput');
  const monthInput = document.getElementById('goalMonthInput');

  document.getElementById('addMilestoneBtn').addEventListener('click', async () => {
    const setIdx = +surveySelect.value;
    const set = sets[setIdx];
    const condStr = (thresholdInput.value || condition).trim();
    const cond = parseCond(condStr);
    if (!cond) { alert('Enter a goal like "> 3.4"'); return; }

    // Build (aligned) series for this set
    const rows = await getCSV(set.fileOf(CURRENT_ORG));
    const byMonth = {}; // month -> [avgs]
    rows.forEach(r => {
      const m = formatMonth(r.date);
      if (!m) return;
      const vals = set.questions.map(q => parseFloat(r[q])).filter(v => !isNaN(v));
      if (!vals.length) return;
      (byMonth[m] ||= []).push(avg(vals));
    });
    const series = currentChart.data.labels.map(m => (byMonth[m] ? avg(byMonth[m]) : null));

    // Find first hit (left-to-right)
    let hitIdx = -1;
    for (let i=0;i<series.length;i++) {
      if (evalCond(series[i], cond)) { hitIdx = i; break; }
    }

    // Choose marker style & coordinates
    goalColorIdx = (goalColorIdx + 1) % GOAL_COLORS.length;
    const color = GOAL_COLORS[goalColorIdx];

    const requestedMonth = normalizeMonthInput(monthInput?.value);
    const thresholdY = Math.max(0, Math.min(6, cond.t));

    let xLabel, yValue, filled = true, metaNote = '';

    if (hitIdx >= 0 && !requestedMonth) {
      // Met already and no future month requested → place at first met
      xLabel = currentChart.data.labels[hitIdx];
      yValue = series[hitIdx];
      filled = true;
      metaNote = 'Met';
    } else {
      // Either not met OR user requested a specific month → show future goal marker
      xLabel = requestedMonth || currentChart.data.labels[Math.max(0, currentChart.data.labels.length - 1)];
      yValue = thresholdY;
      filled = false;
      metaNote = requestedMonth ? 'Goal (future)' : 'Not met';
      if (requestedMonth && !currentChart.data.labels.includes(requestedMonth)) {
        ensureLabel(currentChart, requestedMonth);
      }
    }

    // Add the scatter dataset (goal marker)
    currentChart.data.datasets.push({
      label: `Goal: ${set.label} ${condStr}`,
      type: 'scatter',
      data: [{ x: xLabel, y: yValue, metaNote }],
      pointBackgroundColor: filled ? color : '#fff',
      pointBorderColor: color,
      pointBorderWidth: filled ? 0 : 2,
      pointRadius: 10,
      pointHoverRadius: 10,
      pointStyle: 'circle',
      order: 10
    });

    // Enable tooltip for goal dots
    currentChart.options.plugins.tooltip = {
      enabled: true, intersect: true, mode: 'point', displayColors: false,
      filter: (ctx) => String(ctx.dataset.label || '').startsWith('Goal:'),
      callbacks: {
        title: () => '',
        label: (ctx) => {
          const state = ctx.raw?.metaNote || '';
          return `${state}: ${ctx.dataset.label}`;
        }
      }
    };

    currentChart.update();
  });
}
