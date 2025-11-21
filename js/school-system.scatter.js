// js/school-system.scatter.js — Scatterplot view
// relies on: formatMonth, loadCSV, getAllOrgIds, resolveCurrentOrgId,
// getScatterDataForConstruct(), window.__CURRENT_CONSTRUCT_ID

async function renderScatterplot() {
  // ===== UI scaffold =====
  const chartArea = document.getElementById("chart-area");
  chartArea.innerHTML = `
    <div class="rel-chart-wrap">
      <div class="rel-chart-inner">
        <canvas id="scatterChart"></canvas>
      </div>
      <div class="rel-controls rel-controls-bottom">
        <label class="rel-control">X
          <select id="relX" class="rel-select"></select>
        </label>
        <label class="rel-control">Y
          <select id="relY" class="rel-select"></select>
        </label>
      </div>
    </div>
  `;

  const canvas = document.getElementById("scatterChart");
  canvas.height = 380;
  const ctx = canvas.getContext("2d");

  // ===== colors & scales =====
  const ORG_COLOR    = '#0E9F94';
  const GLOBAL_COLOR = '#FFB84D';
  const SCORE_MIN = 0, SCORE_MAX = 6;

  // ===== helpers =====
  const short = (s, n=90) => (s.length<=n? s : s.slice(0,n-1)+'…');
  const r2    = (n)=> (n==null||isNaN(n))?null:Math.round(n*100)/100;
  const avg   = (a)=> a.length ? a.reduce((x,y)=>x+y,0)/a.length : null;
  const mulberry32 = (seed)=>()=>{ let t=seed+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
  const jitter = (seed, mag=0.02)=>{ const rnd=mulberry32(seed)(); return (rnd*2-1)*mag; };

  function linearTrend(points){
    const xs = points.map(p=>p.x), ys = points.map(p=>p.y);
    if (xs.length < 2) return [];
    const n=xs.length, sx=xs.reduce((a,b)=>a+b,0), sy=ys.reduce((a,b)=>a+b,0);
    const sxy=xs.reduce((a,b,i)=>a+b*ys[i],0), sxx=xs.reduce((a,b)=>a+b*b,0);
    const denom = n*sxx - sx*sx;
    if (denom === 0) return [];
    const m = (n*sxy - sx*sy) / denom;
    const b = (sy - m*sx) / n;
    return [
      { x: SCORE_MIN, y: m*SCORE_MIN + b },
      { x: SCORE_MAX, y: m*SCORE_MAX + b }
    ].map(p => ({ x: p.x, y: Math.max(SCORE_MIN, Math.min(SCORE_MAX, p.y)) }));
  }

  const subOf = (label)=> (label.match(/^\((\w)\)/)?.[1] || label.match(/^([A-Z])\./)?.[1] || 'A');
  const monthOf = (row)=> formatMonth(row.date); // uses global helper

  // ===== current org + peers =====
  const CURRENT_ORG = window.__CURRENT_ORG || await resolveCurrentOrgId();
  const ALL_ORGS    = await getAllOrgIds();
  const currentIdx  = ALL_ORGS.indexOf(CURRENT_ORG);
  const PEER_ORGS   = ALL_ORGS.filter((_,i)=> i !== currentIdx);

  // ===== CSV cache =====
  const __csvCache = {};
  const getCSV = async (path) => {
    if (__csvCache[path]) return __csvCache[path];
    try {
      const data = await loadCSV(path);
      __csvCache[path] = data;
      return data;
    } catch(e) {
      console.warn('[scatter] failed to load', path, e);
      __csvCache[path]=[];
      return [];
    }
  };

  // ===== Tool catalog (construct-aware) =====
  const CONSTRUCT_ID = window.__CURRENT_CONSTRUCT_ID || 'school-system';
  console.debug('[scatter] CONSTRUCT_ID =', CONSTRUCT_ID);

  // Original School & System config as fallback
  const DEFAULT_SURVEY_SETS = [
    {
      label: "(A) HQIM Coherence — Teacher",
      fileOf: (org)=> `orgdata/${org}_teacher_survey.csv`,
      questions: [
        "How well does your school leaders' vision for instruction align with your adopted curriculum?"
      ]
    },
    {
      label: "(A) HQIM Coherence — School Leader",
      fileOf: (org)=> `orgdata/${org}_school_leader_survey.csv`,
      questions: [
        "How much of a priority is implementation of [curriculum] for your school?",
        "How aligned is your HQIM To what extent are teachers held accountable to implementing [curriculum] through performance evaluations?",
        "To what extent is implementation of [curriculum] integrated with other school systems and initiatives (e.g. assessments and RTI)?"
      ]
    },
    {
      label: "(B) Foundational Structures — School Leader",
      fileOf: (org)=> `orgdata/${org}_school_leader_survey.csv`,
      questions: [
        "How often does school leadership review data on implementation of [curriculum] to support continuous improvement?"
      ]
    },
    {
      label: "(B) Foundational Structures — Teacher",
      fileOf: (org)=> `orgdata/${org}_teacher_survey.csv`,
      questions: [
        "Do you have sufficient time to engage in professional learning focused on [curriculum]?"
      ]
    }
  ];

  let configForConstruct = null;
  if (typeof window.getScatterDataForConstruct === 'function') {
    configForConstruct = window.getScatterDataForConstruct(CONSTRUCT_ID);
  }

  const SURVEY_SETS = (
    configForConstruct &&
    Array.isArray(configForConstruct.SURVEY_SETS) &&
    configForConstruct.SURVEY_SETS.length
  )
    ? configForConstruct.SURVEY_SETS
    : DEFAULT_SURVEY_SETS;

  console.debug('[scatter] using SURVEY_SETS for construct', CONSTRUCT_ID, SURVEY_SETS);

  // ===== Sub-construct display names (no role/tool) =====
  const SUB_NAME_BY_KEY = {};
  SURVEY_SETS.forEach(set => {
    const key = subOf(set.label);
    if (!SUB_NAME_BY_KEY[key]) {
      const noPrefix = set.label.replace(/^\(\w\)\s*/, '');
      const base = noPrefix.split('—')[0].trim(); // e.g. "HQIM Coherence"
      SUB_NAME_BY_KEY[key] = base;
    }
  });
  const subName = (key)=> `(${key}) ${SUB_NAME_BY_KEY[key] || 'Sub-construct'}`;

  // ===== Group sets by sub-construct key =====
  const GROUPS = {};
  SURVEY_SETS.forEach((set, i)=>{
    const key = subOf(set.label);
    (GROUPS[key]||(GROUPS[key]=[])).push(i);
  });

  // ===== Selector catalog =====
  const CATALOG = [];
  Object.keys(GROUPS).sort().forEach(key=>{
    CATALOG.push({
      id: `group::${key}`,
      type: 'subavg',
      subKey: key,
      label: `${subName(key)} — Sub-construct Average`,
      questionLabel: 'Average of sub-construct'
    });
  });
  SURVEY_SETS.forEach((set, si)=>{
    set.questions.forEach((q, qi)=>{
      CATALOG.push({
        id: `${si}::${qi}`,
        type: 'item',
        setIndex: si,
        qIndex: qi,
        label: set.label,
        question: q,
        questionLabel: q
      });
    });
  });

  // ===== UI options =====
  const xSel = document.getElementById('relX');
  const ySel = document.getElementById('relY');
  function addOptions(sel){
    CATALOG.forEach(item=>{
      const qText = item.type==='subavg' ? 'Average of sub-construct' : item.questionLabel;
      const srcLabel = item.type==='subavg' ? item.label : `${item.label} — ${qText}`;
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = short(srcLabel, 90);
      sel.appendChild(opt);
    });
  }
  addOptions(xSel); addOptions(ySel);
  if (CATALOG.length>0) xSel.value = CATALOG[0].id;
  if (CATALOG.length>1) ySel.value = CATALOG[1].id;

  // ===== lookups =====
  function parseItem(id){
    const [a,b] = id.split('::');
    if (a === 'group') {
      return {
        type:'subavg',
        subKey:b,
        label:`${subName(b)} — Sub-construct Average`,
        questionLabel:'Average of sub-construct'
      };
    } else {
      const setIndex = +a, qIndex = +b;
      const set = SURVEY_SETS[setIndex];
      return {
        type:'item',
        setIndex,
        qIndex,
        label:set.label,
        question:set.questions[qIndex],
        questionLabel:set.questions[qIndex],
        set
      };
    }
  }

  // ===== value extractors =====
  function valueFromRow(row, item) {
    if (item.type === 'item') {
      const v = parseFloat(row[item.question]);
      return isNaN(v) ? null : v;
    }
    return null; // subavg handled via monthly aggregation
  }

  // month-map for ITEM (single file)
  function monthMapItem(rows, item) {
    const map = {};
    rows.forEach(r=>{
      const m = monthOf(r); if (!m) return;
      const v = valueFromRow(r, item);
      if (v==null) return;
      (map[m]||(map[m]=[])).push(v);
    });
    const out = {};
    Object.entries(map).forEach(([m, arr])=> out[m] = avg(arr));
    return out;
  }

  // month-map for SUBAVG (all sets in that subKey, single org)
  async function monthMapSubAvg(org, subKey) {
    const setIdxs = GROUPS[subKey] || [];
    const byMonth = {}; // m -> [vals across all tools/questions]
    for (const si of setIdxs) {
      const set = SURVEY_SETS[si];
      const rows = await getCSV(set.fileOf(org));
      rows.forEach(r=>{
        const m = monthOf(r); if (!m) return;
        set.questions.forEach(q=>{
          const v = parseFloat(r[q]);
          if (!isNaN(v)) (byMonth[m]||(byMonth[m]=[])).push(v);
        });
      });
    }
    const out = {};
    Object.entries(byMonth).forEach(([m, arr])=> out[m] = avg(arr));
    return out;
  }

  // ===== pairing logic =====
  async function buildPairs(xItem, yItem) {
    // ---- Your Org ----
    let orgPoints = [];
    if (xItem.type==='item' && yItem.type==='item' && xItem.setIndex === yItem.setIndex) {
      const rows = await getCSV(SURVEY_SETS[xItem.setIndex].fileOf(CURRENT_ORG));
      rows.forEach((row, i)=>{
        const x = valueFromRow(row, xItem);
        const y = valueFromRow(row, yItem);
        if (x!=null && y!=null) orgPoints.push({ x:r2(x), y:r2(y), meta:{ type:'row', i, date: row.date || null } });
      });
    } else {
      const mx = (xItem.type==='subavg')
        ? await monthMapSubAvg(CURRENT_ORG, xItem.subKey)
        : monthMapItem(await getCSV(SURVEY_SETS[xItem.setIndex].fileOf(CURRENT_ORG)), xItem);

      const my = (yItem.type==='subavg')
        ? await monthMapSubAvg(CURRENT_ORG, yItem.subKey)
        : monthMapItem(await getCSV(SURVEY_SETS[yItem.setIndex].fileOf(CURRENT_ORG)), yItem);

      const months = [...new Set([...Object.keys(mx), ...Object.keys(my)])].sort();
      months.forEach((m, idx)=>{
        if (mx[m]!=null && my[m]!=null) {
          orgPoints.push({
            x: r2(mx[m] + jitter(1000+idx, 0.02)),
            y: r2(my[m] + jitter(2000+idx, 0.02)),
            meta:{ type:'month', month:m }
          });
        }
      });
    }

    // ---- Global (peers) ----
    let globalPoints = [];
    if (xItem.type==='item' && yItem.type==='item' && xItem.setIndex === yItem.setIndex) {
      for (const org of PEER_ORGS) {
        const rows = await getCSV(SURVEY_SETS[xItem.setIndex].fileOf(org));
        rows.forEach((row, i)=>{
          const x = valueFromRow(row, xItem);
          const y = valueFromRow(row, yItem);
          if (x!=null && y!=null) globalPoints.push({ x:r2(x), y:r2(y), meta:{ type:'row', i, tag: org, date: row.date || null } });
        });
      }
    } else {
      const poolX = {}, poolY = {};
      for (const org of PEER_ORGS) {
        const mx = (xItem.type==='subavg')
          ? await monthMapSubAvg(org, xItem.subKey)
          : monthMapItem(await getCSV(SURVEY_SETS[xItem.setIndex].fileOf(org)), xItem);
        const my = (yItem.type==='subavg')
          ? await monthMapSubAvg(org, yItem.subKey)
          : monthMapItem(await getCSV(SURVEY_SETS[yItem.setIndex].fileOf(org)), yItem);
        Object.entries(mx).forEach(([m,v])=> (poolX[m]||(poolX[m]=[])).push(v));
        Object.entries(my).forEach(([m,v])=> (poolY[m]||(poolY[m]=[])).push(v));
      }
      const months = [...new Set([...Object.keys(poolX), ...Object.keys(poolY)])].sort();
      months.forEach((m, idx)=>{
        const x = avg(poolX[m]||[]);
        const y = avg(poolY[m]||[]);
        if (x!=null && y!=null) {
          globalPoints.push({
            x: r2(x + jitter(3000+idx, 0.02)),
            y: r2(y + jitter(4000+idx, 0.02)),
            meta:{ type:'month', month:m }
          });
        }
      });
    }

    return { orgPoints, globalPoints };
  }

  let chart;

  async function updateChart() {
    const xItem = parseItem(xSel.value);
    const yItem = parseItem(ySel.value);
    const { orgPoints, globalPoints } = await buildPairs(xItem, yItem);

    if (chart) chart.destroy();

    // Feint highlight when sub-construct average is selected (either axis)
    const avgSelected = (xItem.type==='subavg' || yItem.type==='subavg');
    const baseOrgRadius = avgSelected ? 4 : 3;
    const baseGlobRadius= avgSelected ? 4 : 3;
    const baseOrgBorderW = avgSelected ? 2 : 1.2;
    const baseGlobBorderW= avgSelected ? 2 : 1.6;

    const datasets = [
      // points: circles
      {
        label: 'Your Org',
        data: orgPoints,
        showLine: false,
        pointRadius: baseOrgRadius,
        pointHoverRadius: baseOrgRadius + 2,
        pointHitRadius: 8,
        pointStyle: 'circle',
        pointBackgroundColor: avgSelected ? 'rgba(14,159,148,0.85)' : ORG_COLOR,
        pointBorderColor: ORG_COLOR,
        pointBorderWidth: baseOrgBorderW,
        order: 2
      },
      {
        label: 'Global',
        data: globalPoints,
        showLine: false,
        pointRadius: baseGlobRadius,
        pointHoverRadius: baseGlobRadius + 2,
        pointHitRadius: 8,
        pointStyle: 'circle',
        pointBackgroundColor: '#fff',
        pointBorderColor: GLOBAL_COLOR,
        pointBorderWidth: baseGlobBorderW,
        order: 2
      }
    ];

    // dashed lines of best fit (always both)
    const ot = linearTrend(orgPoints);
    if (ot.length) {
      datasets.push({
        label: 'Your Org — Line of Best Fit',
        type: 'line',
        data: ot,
        borderColor: ORG_COLOR,
        borderWidth: 1.8,
        borderDash: [6,4],
        pointRadius: 0,
        fill: false,
        order: 1
      });
    }
    const gt = linearTrend(globalPoints);
    if (gt.length) {
      datasets.push({
        label: 'Global — Line of Best Fit',
        type: 'line',
        data: gt,
        borderColor: GLOBAL_COLOR,
        borderWidth: 1.8,
        borderDash: [6,4],
        pointRadius: 0,
        fill: false,
        order: 1
      });
    }

    chart = new Chart(ctx, {
      type: 'scatter',
      data: { datasets },
      options: {
        parsing: false,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: true },
        scales: {
          x: {
            type: 'linear',
            min: SCORE_MIN, max: SCORE_MAX,
            title: {
              display: true,
              text: (()=> {
                const item = parseItem(xSel.value);
                const q = item.type==='subavg' ? 'Average of sub-construct' : item.questionLabel;
                return `${item.label} — ${short(q, 30)}`;
              })()
            },
            ticks: { stepSize: 1 }
          },
          y: {
            min: SCORE_MIN, max: SCORE_MAX,
            title: {
              display: true,
              text: (()=> {
                const item = parseItem(ySel.value);
                const q = item.type==='subavg' ? 'Average of sub-construct' : item.questionLabel;
                return `${item.label} — ${short(q, 30)}`;
              })()
            },
            ticks: { stepSize: 1 },
            grid: { color: 'rgba(0,0,0,0.08)' }
          }
        },
        plugins: {
          // Legend: circles for points; dashed line samples for trend lines
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              boxWidth: 14,
              boxHeight: 12,
              padding: 10,
              font: { size: 13, weight: '400' },

              generateLabels(chart) {
                // Start with the defaults to keep datasetIndex correct
                const base = Chart.defaults.plugins.legend.labels.generateLabels(chart);

                // Optional: hide any dataset that sets skipLegend: true
                const items = base.filter(item => {
                  const ds = chart.data.datasets?.[item.datasetIndex];
                  return !(ds && ds.skipLegend);
                });

                items.forEach(item => {
                  const ds = chart.data.datasets?.[item.datasetIndex] || {};
                  const meta = chart.getDatasetMeta(item.datasetIndex);
                  const visible = !meta.hidden;  // v3/v4 friendly

                  // Never use strikethrough
                  item.hidden = false;

                  // Decide how the sample looks in the legend
                  const isTrend = /Line of Best Fit/i.test(ds.label);

                  if (isTrend) {
                    // dashed line sample
                    item.pointStyle  = 'line';
                    item.fillStyle   = undefined; // no fill box
                    item.strokeStyle = ds.borderColor || '#666';
                    item.lineWidth   = ds.borderWidth ?? 1.8;
                    item.lineDash    = ds.borderDash  ?? [6, 4];
                  } else {
                    // circle sample for point sets
                    item.pointStyle  = 'circle';
                    const fill       = ds.pointBackgroundColor ?? ds.backgroundColor ?? '#fff';
                    const stroke     = ds.pointBorderColor     ?? ds.borderColor     ?? '#000';
                    const lw         = ds.pointBorderWidth     ?? 1.6;

                    item.fillStyle   = fill;
                    item.strokeStyle = stroke;
                    item.lineWidth   = lw;
                    item.lineDash    = [];
                  }

                  // Gray-out when hidden, no strikethrough
                  if (!visible) {
                    item.color       = '#999';
                    // soften sample too
                    item.fillStyle   = (isTrend ? undefined : '#e0e0e0');
                    item.strokeStyle = '#c2c2c2';
                  } else {
                    item.color       = '#000';
                  }
                });

                return items;
              }
            },

            // Click: toggle dataset visibility (with optional grouping)
            onClick(e, item, legend) {
              const chart = legend.chart;
              const idx   = item.datasetIndex;
              const ds    = chart.data.datasets[idx];

              // Optional grouping: set ds.legendGroup = 'org' or 'global' on related datasets
              const group = ds && ds.legendGroup;
              const indices = group
                ? chart.data.datasets.map((d, i) => d.legendGroup === group ? i : -1).filter(i => i >= 0)
                : [idx];

              // Determine target state from the first dataset in the group
              const firstMeta = chart.getDatasetMeta(indices[0]);
              const willHide  = !firstMeta.hidden; // if visible -> hide group

              indices.forEach(i => {
                const meta = chart.getDatasetMeta(i);
                // v3/v4 friendly toggle: true = hidden, null = visible
                meta.hidden = willHide ? true : null;
              });

              chart.update();
            }
          },
          tooltip: {
            enabled: true,
            callbacks: {
              title: (items)=> [items[0].dataset.label],
              label: (item)=> {
                const {x, y, meta} = item.raw || {};
                const base = `X=${x?.toFixed?.(2) ?? '—'}, Y=${y?.toFixed?.(2) ?? '—'}`;
                if (!meta) return base;
                if (meta.type==='row') {
                  const dt = meta.date ? ` • ${meta.date}` : '';
                  return `${base}${dt}`;
                } else if (meta.type==='month') {
                  return `${base} • ${meta.month}`;
                }
                return base;
              },
              afterBody: ()=> {
                const xi = parseItem(xSel.value);
                const yi = parseItem(ySel.value);
                const xQL = xi.type==='subavg' ? 'Average of sub-construct' : xi.questionLabel;
                const yQL = yi.type==='subavg' ? 'Average of sub-construct' : yi.questionLabel;
                return ['', 'X:', `${xi.label} — ${xQL}`, 'Y:', `${yi.label} — ${yQL}`];
              }
            }
          }
        }
      }
    });
  }

  xSel.addEventListener('change', updateChart);
  ySel.addEventListener('change', updateChart);
  updateChart();
}
