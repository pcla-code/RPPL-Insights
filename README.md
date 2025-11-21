# RPPL Insights (RPPL Visualizer v2.0)

https://github.com/user-attachments/assets/6bd5f097-f204-4130-8265-af0255d593a4

The **RPPL Insights (RPPL Visualizer v2.0)** platform is a fully modular, ELA-aligned data visualization system designed for secure research environments such as Stronghold. This version introduces a construct-driven architecture, modular chart pipelines, stronger local security via a custom Python server, and support for multiple interactive chart types including radar charts, trends-over-time line charts, milestone threshold charts, and scatterplots, all operating on locally stored survey data aligned to the ELA Instructional Framework.

Together, the four views give teams a complete analytical toolkit:

- **Radar (Org Snapshot):** Where are we today?  
- **Overall (Trends Over Time):** How are we changing?  
- **Milestone (Progress Towards Goals):** When did we hit targets?  
- **Scatterplot (Item-Level Relationships):** How do we compare to others?

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

## 🛠️ Making the Visualizer Work with Frameworks

RPPL Insights is designed so that **framework logic lives in two files**:

- `js/school-system.constructs.js` — *What* the constructs are, how they’re named, and how the UI displays them.
- `js/school-system.data.js` — *Which data each construct uses* (CSV file, label, color, questions).

Understanding these two files gives you full control to adapt the visualizer to any instructional framework.

---

### `school-system.constructs.js` — Defining Constructs & Subconstructs

<img width="1911" height="972" alt="constructsMapper" src="https://github.com/user-attachments/assets/f8106e5c-0a15-4298-b59e-422649b6d9eb" />

This file is the **content map** of the framework. It registers each construct by a stable `id` (e.g., `school-system`, `professional-learning`, `instructional-practice`, etc.) and defines:

- The construct’s dimension, title, and subtitle
- Subconstruct groups A, B, and optionally C  
  (with a badge color, badge text, title, and description)

Example structure:

```js
const CONSTRUCTS = {
  'school-system': {
    id: 'school-system',
    dimension: 'System Conditions',
    title: 'School & System Conditions',
    subtitle: 'HQIM implementation is supported by and integrated with existing infrastructure.',
    groupA: {
      badgeText: 'A',
      badgeColor: '#A98FD4',
      title: 'HQIM Coherence',
      description: 'Alignment between vision, curriculum, and other systems.'
    },
    groupB: {
      badgeText: 'B',
      badgeColor: '#4C9AFF',
      title: 'Foundational Structures',
      description: 'Time, processes, and routines that support implementation.'
    }
    // groupC: {...} if needed
  }
};
```

When a user clicks a box in `index.html`, the app calls:

```js
setCurrentConstructAndRefresh('school-system');
```

`visualizer.html` then reads the construct config and automatically updates the headers, subconstruct badges, and radar chart title.

---

### `school-system.data.js` — Wiring Constructs to CSV Data

<img width="1911" height="949" alt="orgFilesAndQuestionsMapping" src="https://github.com/user-attachments/assets/d2405f7b-a4db-44e1-8ae9-5f4a0fe45db6" />

This file defines a single `DATA_CONFIGS` object that drives **exactly which CSVs** the visualizer loads and **which questions** each chart calculates averages for.

```js
const DATA_CONFIGS = {
  'school-system': {
    radar: { surveySets: [...] },
    overall: { surveySets: [...] },
    milestone: { sets: [...] },
    scatter: { SURVEY_SETS: [...] }
  },

  'professional-learning': { ... },
  'instructional-practice': { ... },
  'teacher-beliefs': { ... }
};
```

The four visualizer views are always expressed in one of these schemas:

#### 1. Radar View

```js
radar: {
  surveySets: [
    {
      label: "(A) HQIM Coherence - Teacher Survey",
      fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
      questions: [
        "How well does your school leaders' vision for instruction align with your adopted curriculum?"
      ]
    },
    // more...
  ]
}
```

Each `surveySets[]` entry tells the visualizer:

- **label** → text on the radar axis  
- **fileOf(org)** → which CSV to load  
- **questions[]** → exact column names to average

#### 2. Overall / Networth (Trends Over Time)

```js
overall: {
  surveySets: [
    {
      label: '(A) HQIM Coherence - Teacher Survey',
      color: '#A98FD4',
      fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
      questions: [ "…" ]
    },
    // more...
  ]
}
```

This works exactly like radar but adds:

- **color** → controls line colors in the trend chart  
- Support for global averages depending on `GLOBAL_BASELINE` and the “Include my org in global” toggle

#### 3. Milestone View

```js
milestone: {
  sets: [
    {
      label: '(A) HQIM Coherence - Teacher Survey',
      color: '#A98FD4',
      fileOf: (org)=>`orgdata/${org}_teacher_survey.csv`,
      questions: [ "…" ]
    },
    // more...
  ]
}
```

Formula is the same — `sets[]` instead of `surveySets[]`.

#### 4. Scatter View

```js
scatter: {
  SURVEY_SETS: [
    {
      label: "(A) HQIM Coherence — Teacher",
      fileOf: (org)=>`orgdata/${org}_teacher_survey.csv`,
      questions: [ "…" ]
    },
    // more...
  ]
}
```

Again same structure, but optimized for org-vs-global monthly pairings and LOESS smoothing.

---

## 📟 Dev FAQs: Customizing the Visualizer for New Frameworks

### **Q: I want to add a new construct. What do I edit?**
**A:** Two files:

1. `school-system.constructs.js` — add a new construct entry with A/B/C groups  
2. `school-system.data.js` — add a matching entry inside `DATA_CONFIGS` with radar/overall/milestone/scatter blocks

And make sure your homepage button calls:

```js
setCurrentConstructAndRefresh('new-construct-id');
```

---

### **Q: I want to add a question to an existing construct.**

Edit **only** `school-system.data.js`.

Find the correct view:

- `radar.surveySets[x].questions[]`
- `overall.surveySets[x].questions[]`
- `milestone.sets[x].questions[]`
- `scatter.SURVEY_SETS[x].questions[]`

Add your new question text **exactly matching the CSV column header**.

No other files need changes.

---

### **Q: My construct now uses a different CSV source.**

Change the `fileOf(org)` function in `school-system.data.js`.

Example:

```js
fileOf: (org) => `orgdata/${org}_teacher_survey_2025.csv`
```

Make sure the CSV exists for each org.

---

### **Q: My new instructional framework doesn’t map neatly into this structure. What can I do?**

You can often reshape your framework into:

```
construct
  → radar: surveySets[]
  → overall: surveySets[]
  → milestone: sets[]
  → scatter: SURVEY_SETS[]
```

Each entry defines:

- A label  
- A CSV source  
- A list of questions to aggregate  

If your data **can** be reorganized into:

```
date, org, Question1, Question2, ...
```

…then the visualizer will work automatically.

If your framework has more complex structure (multiple levels, logs, coded events), you should:

- Preprocess your raw data into CSV files that fit this schema  
- OR write a short cleaning script that outputs the appropriate columns  

**As long as your CSVs match:**

```
fileOf(org) → CSV
questions[] → exact column names with numeric values
```

the visualizer will fully support the framework — no chart code modifications required.


## 📊 Interactive Graph Types in RPPL Insights

RPPL Insights v2.0 includes four fully modular visualization types. Each one answers a different kind of instructional question and pulls data dynamically from the framework definitions in `school-system.data.js`. Below is an overview of what each chart shows, what users can do with it, and how it supports instructional insight-making.

---

### **1. Org Snapshot Radar Chart**

https://github.com/user-attachments/assets/d44750c4-61ae-4ee2-b6f7-d15f979c4f29

The Org Snapshot Radar Chart gives a **one-screen snapshot** of how an organization performs across the subconstructs (A/B/C) within a dimension. Each axis corresponds to a survey set defined in `surveySets[]`.

**What it shows**
- The **average score** for your organization on each subconstruct  
- The **global average** across all other organizations  
- A visual comparison of strengths and areas for improvement  

**What users can do**
- Hover for exact values  
- Toggle subconstruct groups (A, B, C)  
- Use dynamic radar titles (pulled from constructs.js)  

**When to use it**
- Start-of-session overview  
- Quick comparative diagnostic  
- Presenting construct summaries in meetings or reports  

---

### **2. Trends Over Time Chart**

https://github.com/user-attachments/assets/11ce43f4-1319-4548-bb5d-ccd948fea64e

This chart shows how scores evolve **month-by-month**, letting leaders track change, momentum, and implementation stability.

**What it shows**
- Line for **Your Org**  
- Line for **Global Average**  
- Distinct dash patterns per subconstruct  
- Optional “Net Difference” mode (Your Org minus Global Average)  

**What users can do**
- Switch chart modes using **Chart Mode**:  
  - `lines` (simple timeline)  
  - `net` (difference timeline)  
- Toggle subconstruct groups A/B/C  
- Enable/disable **“Include my org in global average”**  
- Access detailed tooltips including per-question breakdowns  

**When to use it**
- Monitoring implementation trends  
- Presenting progress across the school year  
- Comparing trajectory across subconstructs  

---

### **3. Progress Towards Goals Chart**

https://github.com/user-attachments/assets/db435388-3efc-4819-b4d7-3fd4e31534bc

The Progress Towards Goals view answers:

> **“When did we first meet our target?”**

Users define a condition (e.g., `>= 3.4`) and the chart identifies the first month when that threshold is met for each survey set.

**What it shows**
- First month each group meets the threshold  
- Color coding per subconstruct  
- Month filtering and dynamic recalculation  

**What users can do**
- Enter milestone thresholds using `<`, `>`, `<=`, `>=`  
- Pick which survey set to analyze  
- Use the milestone month slider to refine the view  

**When to use it**
- Accountability metrics  
- Reporting district progress goals  
- Tracking improvement over time  

---

### **4. Scatterplot — Org vs Global Relationship View**

https://github.com/user-attachments/assets/9a724293-d1c3-4730-8362-e0ace6287d61

The scatterplot shows the relationship between **your organization’s monthly scores** and the **global averages**.

Each point represents a month.  
X = Your Org  
Y = Global Average  
A diagonal identity line marks parity.

**What it shows**
- How your org compares to global peers  
- Whether scores trend above, below, or around parity  
- Jittered points when multiple questions are selected  

**What users can do**
- Select which survey sets to plot  
- Highlight specific groups  
- Explore outlier months or divergence patterns  

**When to use it**
- Comparing your org’s performance to global trends  
- Identifying unusually strong or weak months  
- Understanding subconstruct alignment  

---

Together, the four views give teams a complete analytical toolkit:

- **Radar:** Where are we today?  
- **Overall:** How are we changing?  
- **Milestone:** When did we hit targets?  
- **Scatter:** How do we compare to others?
