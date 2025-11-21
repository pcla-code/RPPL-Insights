# RPPL Insights (RPPL Visualizer v2.0)

https://github.com/user-attachments/assets/6bd5f097-f204-4130-8265-af0255d593a4

The **RPPL Insights (RPPL Visualizer v2.0)** platform is a fully modular, ELA-aligned data visualization system designed for secure research environments such as Stronghold. This version introduces a construct-driven architecture, modular chart pipelines, stronger local security via a custom Python server, and support for multiple interactive chart types including radar charts, trends-over-time line charts, milestone threshold charts, and scatterplots, all operating on locally stored survey data aligned to the ELA Instructional Framework.

## ⚙️ Installation & Requirements

RPPL Insights v2.0 runs entirely on a **local Python server** and serves fully static HTML/CSS/JS files. No internet access or external APIs are required. The system is designed to operate inside restricted research environments (including Stronghold) where data files must never be directly accessible through the browser.

### Requirements
- **Python 3.8+** (already installed in Stronghold)
- **Modern browser** (Edge or Chrome recommended)
- Ability to run local `.bat` scripts inside the environment

### Folder Structure (Simplified)
```
RPPL-Insights/
├─ assets/                     # Background images, explainer videos
│  ├─ (various .mp4/.png files)
│
├─ config/
│  └─ usermap.csv              # Maps username → password → org
│
├─ js/                         # Main modular JS files (v2.0)
│  ├─ login.js
│  ├─ rpplmasterscripts.js
│  ├─ school-system.constructs.js
│  ├─ school-system.data.js
│  ├─ school-system.index.js
│  ├─ school-system.milestone.js
│  ├─ school-system.org.js
│  ├─ school-system.overall.js
│  ├─ school-system.radar.js
│  ├─ school-system.scatter.js
│  └─ school-system.tutorial.js
│
├─ legacy/                     # Old non-modularized v1 files (kept for reference)
│  └─ (archived .js files)
│
├─ libraries/                  # Chart.js, Luxon, PapaParse, Python server logic
│  ├─ chart.js
│  ├─ chart.umd.js
│  ├─ chartjs-adapter-luxon@1.js
│  ├─ luxon.min.js
│  ├─ papaparse.min.js
│  ├─ client.py                # Client-side Python helper (Stronghold)
│  └─ server.py                # Secure Python server (blocks direct CSV access)
│
├─ orgdata/                    # Organization CSV files (ELA framework aligned)
│  └─ (org-specific CSV files placed here)
│
├─ styles/
│  ├─ rpplmasterstyles.css     # Main layout styles
│  └─ school-system.css        # Visualizer interface + dynamic modal styling
│
├─ favicon.ico
│
├─ index.html                  # Home page (Dimensions → Constructs menu)
└─ visualizer.html             # Visualization engine (Radar / Trends / Milestone / Scatter)

```

### How It Works
When launched, the Python server:
- Serves only the approved HTML/CSS/JS assets  
- **Blocks all directory access** (no folder listings)  
- **Blocks all file-level access** under `orgdata/`  
- Allows the JavaScript visualizer to read CSVs internally via `fetch()` without exposing them to the browser  

This ensures maximum compatibility with Stronghold’s isolation requirements while keeping the visualization fast and fully local.

