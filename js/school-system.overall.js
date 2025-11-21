// js/school-system.overall.js — overall / networth line chart
// Depends on: Chart.js, loadCSV(), formatMonth(), groupAndAverage(),
// resolveCurrentOrgId(), getAllOrgIds(), includeOrgInGlobal, currentChart,
// CHART_MODES / chartModeIndex, customTooltipHandler, showTrendsOverTimeTutorial,
// getOverallDataForConstruct().

async function renderChart() {
  showTrendsOverTimeTutorial({ once: true });
  if (currentChart) currentChart.destroy?.();

  // ---- Resolve current construct (from ?construct=... or default) ----
  const CONSTRUCT_ID = window.__CURRENT_CONSTRUCT_ID || 'school-system';

  // ---- Resolve orgs dynamically ----
  const CURRENT_ORG = window.__CURRENT_ORG || await resolveCurrentOrgId();
  const ALL_ORGS = await getAllOrgIds();             // e.g., ["org1","org2","org3",...]
  let yourIdx = ALL_ORGS.indexOf(CURRENT_ORG);
  if (yourIdx < 0) {
    console.warn('[lines] current org not found; defaulting to first');
    yourIdx = 0;
  }

  console.debug('[lines] CONSTRUCT_ID =', CONSTRUCT_ID, 'CURRENT_ORG =', CURRENT_ORG, 'ALL_ORGS =', ALL_ORGS);

  // ---- 🔹 NEW: load surveySets from shared data config ----
  let configForConstruct = null;
  if (typeof window.getOverallDataForConstruct === 'function') {
    configForConstruct = window.getOverallDataForConstruct(CONSTRUCT_ID);
  }

  let surveySets = (configForConstruct && Array.isArray(configForConstruct.surveySets))
    ? configForConstruct.surveySets
    : [];

  // Fallback to original School/System config if nothing configured
  if (!surveySets.length) {
    console.warn('[lines] No surveySets for construct', CONSTRUCT_ID, '— falling back to School & System defaults.');
    surveySets = [
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
  }

  // ---- Styling constants ----
  const LINE_DASH_STEPS = [[0,0],[6,6],[3,3],[2,4],[10,4],[4,2]];
  const POINT_STYLES = ['circle','triangle','cross','rectRot','star','rectRounded'];
  const GLOBAL_POINT_RADIUS = 3;
  const GLOBAL_POINT_HOVER_RADIUS = 5;

  // ---- Tiny cache so we don’t re-fetch CSVs repeatedly ----
  const __csvCache = {};
  const getCSV = async (path) => {
    if (__csvCache[path]) return __csvCache[path];
    try {
      const rows = await loadCSV(path);
      __csvCache[path] = rows;
      return rows;
    } catch (e) {
      console.warn('[lines] failed to load', path, e);
      __csvCache[path] = [];
      return [];
    }
  };

  // Helpers
  const avg = (arr) => {
    const a = arr.filter(v => typeof v === 'number' && !isNaN(v));
    return a.length ? a.reduce((x,y)=>x+y,0)/a.length : null;
  };
  const monthKeys = (obj) => Object.keys(obj || {});
  const deriveSubKey = (label) => (label.match(/^\((\w)\)/)?.[1] || 'A').toUpperCase();

  // Build processed view for all sets
  const processed = [];
  const allMonthsSet = new Set();

  for (const set of surveySets) {
    // Load all org datasets for this set
    const dataByOrg = await Promise.all(ALL_ORGS.map(org => getCSV(set.fileOf(org))));

    // Per-org monthly averages for this set (across the set.questions)
    const perOrgMaps = dataByOrg.map(rows => groupAndAverage(rows, set.questions));

    // Union of months across all orgs
    const monthsSeen = new Set(perOrgMaps.flatMap(m => monthKeys(m)));
    monthsSeen.forEach(m => allMonthsSet.add(m));

    // Global baseline per month (include/exclude current org via includeOrgInGlobal)
    const globalMap = {};
		/*
    const peerIdxs = includeOrgInGlobal
      ? ALL_ORGS.map((_,i)=>i)
      : ALL_ORGS.map((_,i)=>i).filter(i => i !== yourIdx);
		*/
		
		// NEW unified baseline reader
		const baseline = (typeof window.GLOBAL_BASELINE === 'string')
			? window.GLOBAL_BASELINE
			: (includeOrgInGlobal ? 'allOrgs' : 'excludeCurrent');

		const peerIdxs = (baseline === 'allOrgs')
			? ALL_ORGS.map((_,i) => i)
			: ALL_ORGS.map((_,i) => i).filter(i => i !== yourIdx);


    monthsSeen.forEach(m => {
      const pool = peerIdxs.map(i => perOrgMaps[i]?.[m]).filter(v => typeof v === 'number');
      globalMap[m] = avg(pool);
    });

    // Per-question monthly (for tooltips)
    const monthsArr = Array.from(monthsSeen);
    const yourRows = dataByOrg[yourIdx] || [];
    const perQOrg = set.questions.map(q => {
      const map = {};
      monthsArr.forEach(m => {
        const vals = yourRows
          .filter(r => formatMonth(r.date) === m)
          .map(r => parseFloat(r[q]))
          .filter(n => !isNaN(n));
        map[m] = vals.length ? avg(vals) : null;
      });
      return map;
    });

    const perQGlobal = set.questions.map(q => {
      const map = {};
      monthsArr.forEach(m => {
        const vals = peerIdxs.flatMap(i =>
          (dataByOrg[i]||[])
            .filter(r => formatMonth(r.date) === m)
            .map(r => parseFloat(r[q]))
            .filter(n => !isNaN(n))
        );
        map[m] = vals.length ? avg(vals) : null;
      });
      return map;
    });

    processed.push({
      label: set.label,
      color: set.color,
      yourMap: perOrgMaps[yourIdx] || {},
      globalMap,
      perQOrg,
      perQGlobal,
      questions: set.questions
    });
  }

  // just your org's months
  const allMonths = Object.keys(processed[0].yourMap)  // or union across all p.yourMap
    .filter(m => m)
    .sort((a,b) => new Date(a+' 1') - new Date(b+' 1'));

  // ---- Build datasets: Your Org (line), Global (hollow points) ----
  const datasets = [];
  const seenBySub = {};
  for (const p of processed) {
    const subKey = deriveSubKey(p.label);
    const idx = seenBySub[subKey] ?? 0;
    seenBySub[subKey] = idx + 1;

    const dash  = LINE_DASH_STEPS[idx % LINE_DASH_STEPS.length];
    const glyph = POINT_STYLES[idx % POINT_STYLES.length];

    const yourSeries   = allMonths.map(m => (m in p.yourMap   ? p.yourMap[m]   : null));
    const globalSeries = allMonths.map(m => (m in p.globalMap ? p.globalMap[m] : null));

    console.log('[DEBUG] building dataset', {
      label: p.label,
      allMonths,
      yourMap: p.yourMap,
      globalMap: p.globalMap,
      yourSeries,
      globalSeries
    });

    // YOUR ORG — line only
    datasets.push({
      label: `${p.label} (Your Org)`,
      data: yourSeries,
      borderColor: p.color,
      backgroundColor: p.color,
      tension: 0,
      fill: false,
      borderWidth: 1.8,
      borderDash: dash,
      pointRadius: 0,
      pointHoverRadius: 0,
      pointHitRadius: 8,
      pointStyle: 'line',  // legend shows a line sample
      meta: allMonths.map(m => ({ orgVal: p.yourMap[m] ?? null, globalAvg: p.globalMap[m] ?? null })),
      questions: p.questions,
      perQuestionMonthlyValues: p.perQOrg.map(obj => allMonths.map(m => obj[m] ?? null)),
      globalQuestionMonthlyValues: p.perQGlobal.map(obj => allMonths.map(m => obj[m] ?? null))
    });

    // GLOBAL — line + hollow markers
    datasets.push({
      label: `${p.label} (Global)`,
      data: globalSeries,
      // draw the line
      borderColor: p.color,
      borderWidth: 1.4,
      borderDash: dash,
      tension: 0,
      fill: false,

      // hollow markers
      pointRadius: GLOBAL_POINT_RADIUS,
      pointHoverRadius: GLOBAL_POINT_HOVER_RADIUS,
      pointHitRadius: 8,
      pointStyle: glyph,
      pointBackgroundColor: '#fff',
      pointBorderColor: p.color,
      pointBorderWidth: 2,

      // metadata
      meta: allMonths.map(m => ({ orgVal: p.yourMap[m] ?? null, globalAvg: p.globalMap[m] ?? null })),
      questions: p.questions,
      perQuestionMonthlyValues: p.perQOrg.map(obj => allMonths.map(m => obj[m] ?? null)),
      globalQuestionMonthlyValues: p.perQGlobal.map(obj => allMonths.map(m => obj[m] ?? null))
    });
  }

  // ---- Chart ----
  const ctx = document.getElementById('networthChart').getContext('2d');
  currentChart = new Chart(ctx, {
    type: 'line',
    data: { labels: allMonths, datasets },
    options: {
      onHover: (event, els) => {
        event.native.target.style.cursor = els.length ? 'pointer' : 'default';
      },
      scales: {
        y: {
          min: 0, max: 6, ticks: { stepSize: 1 },
          grid: { color: 'rgba(0,0,0,0.08)' }
        },
        x: {
          grid: { drawBorder: false, display: false },
          ticks: { color: '#0E9F94', font: { weight: 'bold', size: 14 }, padding: 25 }
        }
      },
      plugins: {
        tooltip: {
          enabled: false,
          external: (typeof customTooltipHandler === 'function')
            ? customTooltipHandler
            : undefined
        },
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 16,
            boxHeight: 14,
            padding: 10,
            font: { size: 14, weight: '400' },

            generateLabels(chart) {
              const base = Chart.defaults.plugins.legend.labels.generateLabels(chart);

              // Skip any datasets that opt out of legend
              const items = base.filter(item => {
                const ds = chart.data.datasets?.[item.datasetIndex];
                return !(ds && ds.skipLegend);
              });

              items.forEach(item => {
                const ds = chart.data.datasets[item.datasetIndex] || {};
                const visible = chart.isDatasetVisible(item.datasetIndex);

                // Never use the default strikethrough
                item.hidden = false;

                const isLineDataset =
                  ((ds.type || chart.config.type) === 'line') && !ds.noLine;

                if (isLineDataset) {
                  // show a dashed line sample
                  item.pointStyle  = 'line';
                  item.fillStyle   = undefined;
                  item.strokeStyle = visible ? (ds.borderColor || '#666') : '#c2c2c2';
                  item.lineWidth   = ds.borderWidth ?? 1.8;
                  item.lineDash    = ds.borderDash  ?? [];
                } else {
                  // point sample (circles)
                  item.pointStyle  = ds.pointStyle || 'circle';
                  const fill   = ds.pointBackgroundColor ?? ds.backgroundColor ?? '#fff';
                  const stroke = ds.pointBorderColor     ?? ds.borderColor     ?? '#000';
                  const lw     = ds.pointBorderWidth     ?? ds.borderWidth     ?? 1.6;

                  item.fillStyle   = visible ? fill   : '#e0e0e0';
                  item.strokeStyle = visible ? stroke : '#c2c2c2';
                  item.lineWidth   = lw;
                  item.lineDash    = [];
                }

                // Gray out text when hidden
                item.color = visible ? '#000' : '#999';
                item.fontColor = item.color; // v3 compat
              });

              return items;
            }
          },

          // CLICK → toggle DATASET visibility
          onClick(e, listItem, legend) {
            const chart = legend.chart;
            const i = listItem.datasetIndex;
            const visible = chart.isDatasetVisible(i);
            chart.setDatasetVisibility(i, !visible);
            chart.update();
          }
        }
      }
    }
  });
}
