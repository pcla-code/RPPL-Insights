// js/school-system.radar.js — radar chart renderer
// Depends on: Chart.js, loadCSV(), resolveCurrentOrgId(), getAllOrgIds(),
// getRadarDataForConstruct(), and window.GLOBAL_BASELINE (default set in the main script).

async function renderRadarChart() {
  const chartArea = document.getElementById("chart-area");
  chartArea.innerHTML = `
    <canvas id="radarChart" width="230" height="230" style="max-width: 100%; max-height: 250;"></canvas>
  `;
  const ctx = document.getElementById("radarChart").getContext("2d");

  // Resolve current construct (from ?construct=... or default)
  const CONSTRUCT_ID = window.__CURRENT_CONSTRUCT_ID || 'school-system';

  // Resolve current org and the full org list
  const CURRENT_ORG = window.__CURRENT_ORG || await resolveCurrentOrgId();
  const ALL_ORGS = await getAllOrgIds();
  const currentIdx = ALL_ORGS.indexOf(CURRENT_ORG);
  if (currentIdx < 0) {
    console.warn(`[radar] CURRENT_ORG "${CURRENT_ORG}" not in ALL_ORGS ${JSON.stringify(ALL_ORGS)}.`);
  }
  console.debug('[radar] CONSTRUCT_ID =', CONSTRUCT_ID, 'CURRENT_ORG =', CURRENT_ORG, 'ALL_ORGS =', ALL_ORGS);

  // 🔹 NEW: pull surveySets from the shared data config
  let configForConstruct = null;
  if (typeof window.getRadarDataForConstruct === 'function') {
    configForConstruct = window.getRadarDataForConstruct(CONSTRUCT_ID);
  }

  let surveySets = (configForConstruct && Array.isArray(configForConstruct.surveySets))
    ? configForConstruct.surveySets
    : [];

  // Fallback: if you forgot to populate DATA_CONFIGS for this construct,
  // use the old School & System defaults so charts still render.
  if (!surveySets.length) {
    console.warn('[radar] No surveySets found for construct', CONSTRUCT_ID, 'falling back to School & System defaults.');
    surveySets = [
      {
        label: "(A) HQIM Coherence - Teacher Survey",
        fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
        questions: [
          "How well does your school leaders' vision for instruction align with your adopted curriculum?"
        ]
      },
      {
        label: "(B) Foundational Structures - Teacher Survey",
        fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
        questions: [
          "Do you have sufficient time to engage in professional learning focused on [curriculum]?"
        ]
      },
      {
        label: "(A) HQIM Coherence - School Leader Survey",
        fileOf: (org) => `orgdata/${org}_school_leader_survey.csv`,
        questions: [
          "How much of a priority is implementation of [curriculum] for your school?"
        ]
      },
      {
        label: "(B) Foundational Structures - School Leader Survey",
        fileOf: (org) => `orgdata/${org}_school_leader_survey.csv`,
        questions: [
          "How often does school leadership review data on implementation of [curriculum] to support continuous improvement?"
        ]
      },
      {
        label: "(A) HQIM Coherence - Non-Teacher PL",
        fileOf: (org) => `orgdata/${org}_non_teacher_pl_participant.csv`,
        questions: [
          "How well does your school's vision for instruction align with [adopted curriculum]?"
        ]
      },
      {
        label: "(B) Foundational Structures - Non-Teacher PL",
        fileOf: (org) => `orgdata/${org}_non_teacher_pl_participant.csv`,
        questions: [
          "Do teachers in your school have sufficient time to engage in professional learning focused on [curriculum]?"
        ]
      }
    ];
  }

  // Simple cache so we don’t re-fetch the same CSV multiple times
  const __csvCache = {};
  const getCSV = async (path) => {
    if (__csvCache[path]) return __csvCache[path];
    try {
      const data = await loadCSV(path); // your global loader (Papa.parse etc.)
      __csvCache[path] = data;
      return data;
    } catch (e) {
      console.warn('[radar] failed to load', path, e);
      __csvCache[path] = [];
      return [];
    }
  };

  const avg = (arr) => {
    const nums = arr.filter((v) => typeof v === 'number' && !isNaN(v));
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  };
  const getAverageScore = (rows, questions) => {
    const vals = [];
    rows.forEach(r => {
      questions.forEach(q => {
        const v = parseFloat(r[q]);
        if (!isNaN(v)) vals.push(v);
      });
    });
    return vals.length ? +avg(vals).toFixed(2) : null;
  };

  const yourOrgData = [];
  const globalData = [];
  const pointRadiusOrg = [];
  const pointRadiusGlobal = [];

  for (const set of surveySets) {
    // Load ALL org files for this set (N orgs)
    const allData = await Promise.all(
      ALL_ORGS.map((org) => getCSV(set.fileOf(org)))
    );

    // Per-org averages for this set
    const perOrgAvg = allData.map((rows) => getAverageScore(rows, set.questions));

    // Your org’s average
    const yourAvg =
      currentIdx >= 0 ? perOrgAvg[currentIdx] : getAverageScore(await getCSV(set.fileOf(CURRENT_ORG)), set.questions);

    // Global average per policy (uses GLOBAL_BASELINE)
    let globalAvg;
    if ((window.GLOBAL_BASELINE || 'allOrgs') === 'allOrgs') {
      // constant across users
      globalAvg = avg(perOrgAvg);
    } else {
      // exclude current user’s org from the global
      const peers = perOrgAvg.filter((_, i) => i !== currentIdx);
      globalAvg = avg(peers);
    }

    yourOrgData.push(yourAvg);
    globalData.push(globalAvg);

    const isOrgHigher = (yourAvg ?? -Infinity) >= (globalAvg ?? -Infinity);
    pointRadiusOrg.push(isOrgHigher ? 6 : 3);
    pointRadiusGlobal.push(isOrgHigher ? 3 : 6);
  }

  // 🔹 Optional: dynamic title from constructs.js if available
  let constructTitle =
    "Construct: HQIM implementation is supported by and integrated with existing infrastructure";
  if (typeof window.getConstructConfigForId === 'function') {
    const cfg = window.getConstructConfigForId(CONSTRUCT_ID);
    if (cfg) {
      if (cfg.subtitle) {
        constructTitle = `Construct: ${cfg.subtitle}`;
      } else if (cfg.title) {
        constructTitle = `Construct: ${cfg.title}`;
      }
    }
  }

  new Chart(ctx, {
    type: "radar",
    data: {
      labels: surveySets.map(set => {
        const parts = String(set.label || '').split('\n');
        return parts[1] ? [`${parts[0]}`, parts[1]] : `${parts[0]}`;
      }),
      datasets: [
        {
          label: "Your Organization",
          data: yourOrgData,
          borderColor: "#0E9F94",
          pointBackgroundColor: "#0E9F94",
          pointRadius: pointRadiusOrg,
          borderWidth: 1.5,
          fill: false
        },
        {
          label: "Global Average",
          data: globalData,
          borderColor: "#FFB84D",
          pointBackgroundColor: "#FFB84D",
          pointRadius: pointRadiusGlobal,
          borderWidth: 1.5,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 5,
          ticks: { stepSize: 1 },
          pointLabels: {
            font: { size: 11, weight: 400 },
            callback: (val, index) => surveySets[index].label.split("\n").join("\n")
          },
          grid: { circular: false }
        }
      },
      plugins: {
        title: {
          display: true,
          text: constructTitle,
          font: { size: 16, weight: 600 },
          padding: { top: 10, bottom: 15 },
          align: "center"
        },
        legend: {
          position: "top",
          labels: {
            generateLabels: function(chart) {
              const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
              original.forEach(label => {
                const visible = chart.isDatasetVisible(label.datasetIndex);
                label.hidden = false;
                label.fontColor = visible ? '#000' : '#999';
                label.color     = visible ? '#000' : '#999';
                label.fillStyle = visible ? label.fillStyle : '#ccc';
                label.strokeStyle = visible ? label.strokeStyle : '#aaa';
              });
              return original;
            }
          }
        },
        tooltip: { enabled: true }
      }
    }
  });
}
