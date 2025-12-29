# RPPL Insights (RPPL Visualizer & Converter v2.0)

[![Chart.js](https://badgen.net/badge/Chart.js/4.4.0/blue)](https://www.chartjs.org/)
[![Luxon](https://badgen.net/badge/Luxon/3.4.4/purple)](https://moment.github.io/luxon/)
[![PapaParse](https://badgen.net/badge/PapaParse/5.4.1/green)](https://www.papaparse.com/)
[![Python](https://badgen.net/badge/Python/3.10+/yellow)](https://www.python.org/)

https://github.com/user-attachments/assets/6bd5f097-f204-4130-8265-af0255d593a4

The **RPPL Insights (RPPL Visualizer v2.0)** platform is a fully modular, ELA Shared Measures-aligned data visualization system designed for secure research environments such as Stronghold. This version introduces a construct-driven architecture, modular chart pipelines, stronger local security via a custom Python server, and support for multiple interactive chart types including radar charts, trends-over-time line charts, milestone threshold charts, and scatterplots, all operating on locally stored survey data aligned to the first version of the ELA Shared Measures Toolkit.

Together, the four views give teams a complete understanding of their CBPL and HQIM implementation:

- **Radar (Org Snapshot):** Where are we today?
- **Overall (Trends Over Time):** How are we changing?
- **Milestone (Progress Towards Goals):** Did we accomplish our goals?
- **Scatterplot (Item-Level Relationships):** How do we compare to others?

[![Radar – Org Snapshot](https://badgen.net/badge/View/Radar%20-%20Org%20Snapshot/purple)](#1-org-snapshot-radar-chart)
[![Overall – Trends Over Time](https://badgen.net/badge/View/Trends%20Over%20Time/blue)](#2-trends-over-time-chart)
[![Milestone – Goal Tracking](https://badgen.net/badge/View/Progress%20Towards%20Goals/green)](#3-progress-towards-goals-chart)
[![Scatterplot – Item Relationships](https://badgen.net/badge/View/Item%20Level%20Relationships/orange)](#4-scatterplot--org-vs-global-relationship-view)

## Using the tool

### Step 1) Decide who can access which org data (the **usermap**)
1. Open the usermap file at `config/usermap` (this is essentially your “permissions list”).
2. Add a user if you want them to access an org’s dataset by adding a new line in this format:  
   `username,org,password`  
   Example: `Neithan,org5,v9D2Q`
3. Remove a user if you want to revoke access by deleting that user’s entire line (including the newline).
4. Save the file.

**What the usermap does (in plain terms):**  
It tells the Visualizer: *“When this person logs in, which org dataset(s) are they allowed to see?”*

**Do / Don’t**
- ✅ Do: keep names exactly as used for login.
- ✅ Do: double-check spelling (one typo = no access).
- ❌ Don’t: rename the usermap file unless the code explicitly points to the new name.

---

### Step 2) Prepare your org data file (this is what the Visualizer reads)

There are two important files that define the “rules”:

#### `school-system.constructs.js` (the “framework dictionary”)
This file defines the measurement model:
- which **Constructs** exist
- which **Subconstructs** belong to each construct
- which **Items/Questions** belong to each subconstruct
- what each item is called (and what the Visualizer uses as the key)

**Translation:** this file decides what the Visualizer thinks the framework *is*.

**Quick example (what it means in practice):**
- If `school-system.constructs.js` says the item is called `I feel safe at school`, then your CSV must have a column header that matches that (exactly).
- If it says the item key is `TS_Q12`, then your CSV must have a column called `TS_Q12`.

#### `school-system.data.js` (the “data wiring”)
This file tells the Visualizer:
- what your **data file is named**
- where your data lives (path/location)
- what **columns the Visualizer will look for**
- how to interpret key fields (date/org identifiers/etc.)

**Translation:** this file decides how the Visualizer reads *your CSVs*.

**Quick example (what it means in practice):**
- If `school-system.data.js` points to `data/org5_ELA_V1.csv`, then that file must exist in that folder.
- If it expects a column named `date`, your CSV needs a `date` column.

---

### Step 3) Name your data files correctly (so the Visualizer finds them)
1. Put your CSV files in the expected data folder (where `school-system.data.js` says they should be).
2. Use the exact file naming pattern the Visualizer expects.  
   This version is limited to expecting:  
   `org<number>_NameOfDataAlignedWithELAMeasuresV1_csv`
3. For this version, you cannot invent a new naming scheme unless you also update `school-system.data.js`.

**Quick example**
- ✅ `org5_TeacherSurveyAlignedWithELAMeasuresV1_csv`
- ✅ `org12_LeaderSurveyAlignedWithELAMeasuresV1_csv`
- ❌ `Org5 Teacher Survey.csv` (wrong pattern)
- ❌ `org5_teachersurvey.csv` (wrong pattern)

**If you’re not sure:** open `school-system.data.js` and copy the existing pattern.

---

### Step 4) Name your columns correctly (this is the #1 reason things don’t show up)
1. Open your CSV.
2. Make sure column headers match what the Visualizer expects **exactly**.

Most important column rules for V1:
- If the Visualizer expects a column called `date`, it must be `date` (not `Date`, not `DATE`).
- If items are keyed by exact question text, your column header must match the exact question text.
- If items are keyed by item codes, your column header must match the item code.

**If your columns don’t match, the Visualizer won’t “guess.”** It will just show blanks.

---

### Step 5) Don’t edit the wrong files (so you don’t break the app)
**Files you usually change:**
- ✅ `config/usermap` (permissions)
- ✅ your org CSV data files
- ✅ (only if needed) `school-system.data.js` to point to new filenames/paths

**Files you should NOT change unless you’re updating the measurement model:**
- ❌ `school-system.constructs.js` (this defines the framework; changing it changes the model)
- ❌ core Visualizer graph code (unless you are doing dev work)

---

### Step 6) Quick sanity check (the “did I wire it right?” test)
1. Log in as a user who should have access (per usermap).
2. Check that the org dataset appears.
3. Open a basic graph:
   - if nothing shows up, it’s usually:
     - wrong filename
     - wrong folder/path
     - wrong column headers
     - user not included in usermap

---

### Step 7) You are now ready to run 🚀

#### Option A) Run the server (backend)
1. Double-click `runserver.bat`
2. Leave that window open (don’t close it).
3. If it shows an error, copy-paste the last lines into chat so we can diagnose.

#### Option B) Run the client (frontend)
1. Double-click `runclient.bat`
2. A browser tab should open automatically (or it will print a local URL like `http://localhost:____`).
3. Keep that window open while you use the Visualizer.

#### Most common “oops” when running
- If the client runs but nothing loads, the server might not be running.
- If you get a port error, it usually means something else is already using that port.

That's about everything :)
if usermap + file names + column names match what the Visualizer expects, it will load.

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
Users can also enter a specific month in the Month input box in the format, “November 2025” or “11/2025”, and the chart will place a marker on that month.
If the entered month is in the future (i.e., not present in the dataset yet), the chart will extend the timeline to include it and place the marker there.

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

### **4. Item Level Relationships Chart**

https://github.com/user-attachments/assets/9a724293-d1c3-4730-8362-e0ace6287d61

The scatterplot shows the relationship between **two selected measures at the item level**.

Each point represents an **item** (i.e., a question / rubric item).  
**X =** Item score for Measure A  
**Y =** Item score for Measure B  
A diagonal identity line marks parity (**X = Y**).

### What it shows
- Which items score higher on Measure A vs Measure B
- Whether the same items tend to be high/low together (alignment)
- Clusters (items behaving similarly) and outliers (items diverging sharply)
- Where strengths and gaps live **at the item level**, not averaged away

### What users can do
- Choose the two measures to compare (e.g., Subconstruct A vs Subconstruct B, or Construct vs Construct)
- Switch which item set is being plotted (ELA surveys vs Classroom Observations, depending on what’s selected/available)
- Hover items to see exact item text / item code

### When to use it
- Checking if two subconstructs “move together” at the item level
- Finding items where performance is strong in one measure but weak in the other
- Spotting misalignment (e.g., strong planning items but weak enactment items)
- Prioritizing action: outlier items are often the most actionable targets

---

Together, the four views give teams a complete understanding of their CBPL and HQIM implementation:

- **Radar (Org Snapshot):** Where are we today?  
- **Overall (Trends Over Time):** How are we changing?  
- **Milestone (Progress Towards Goals):** Did we accomplish our goals? 
- **Scatterplot (Item-Level Relationships):** How do we compare to others?

## 🧰 RPPL Data Converter (CSV/XLS/XLSX Normalizer)

https://github.com/user-attachments/assets/2f1ca592-2e76-43c8-8132-5e36a58bf301

[![PapaParse](https://badgen.net/badge/PapaParse/5.4.1/green)](https://www.papaparse.com/)
[![SheetJS](https://badgen.net/badge/SheetJS/xlsx.full.min.js/orange)](https://sheetjs.com/)
[![File System Access API](https://badgen.net/badge/Web%20API/File%20System%20Access/gray)](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)

The **RPPL Data Converter** is a local-only, browser-based tool that takes *messy*, org-specific source files (CSV / XLS / XLSX) and converts them into **clean, Visualizer-ready CSVs** with:

- Consistent **date format** (`DD/MM/YYYY`)
- Standardized **Likert / numeric values**
- Framework-aligned **question text headers**
- One **output file per org** that the Visualizer can read directly

It is intentionally **non-hard-coded**: as long as a file has a date column and question columns with numeric or Likert responses, the converter can reshape it to match whatever question labels you’ve defined in `school-system.data.js`. This lets different organizations (with different export formats) all end up with the same normalized schema.

---

### 📁 Converter Files & Location

```text
RPPL-Insights/
├─ converter/
│  ├─ index.html                # Converter UI (can be renamed <preferred name>.html)
│  ├─ converter.css             # Layout & theming
│  └─ converter.js              # All converter logic (parsing, mapping, queue, export)
```

## 🧱 High-Level Workflow

1. **Upload** a source file (CSV/XLS/XLSX).
2. **Select** which rows & columns to keep and how each question should be labeled.
3. **Generate a preview** of the converted dataset.
4. **Download** a single CSV or **add it to a conversion queue**.
5. Use **Convert All** to batch-export multiple org files into folders, ready for `orgdata/`.

The converter does **not** need to know anything about constructs/groups; it only needs:

- A **date** column  
- A set of **question columns**  
- The **final question labels** you want those columns to become  

The Visualizer then handles which constructs/subconstructs those labels belong to.

---

## 🧩 Panels & Features

The Data Converter UI is organized into four horizontal panels:

1. **Upload Source File**
2. **Map to Framework**
3. **Preview & Download**
4. **Conversion Queue**

The entire workspace scrolls horizontally so each panel has comfortable width and breathing room.

---




### 1️⃣ Panel: Upload Source File
<img width="903" height="750" alt="image" src="https://github.com/user-attachments/assets/acd52b18-5d5c-4717-a57b-92adea247f29" />

**Goal:** Load and inspect raw data from CSV/XLS/XLSX.

#### Supported formats

- `.csv` via **PapaParse**
- `.xlsx` / `.xls` via **SheetJS** (`xlsx.full.min.js`)

#### Key features

- **Modern upload control**  
  A clean “Choose file” picker with inline status  
  *(e.g., `myfile.xlsx loaded. 532 rows detected.`)*

- **Live table preview with horizontal + vertical scroll**
  - Displays headers and up to N rows (configurable)
  - Thin custom scrollbars with RPPL accent colors
  - Sticky header row

- **Row exclusion control**
  - Each row has a checkbox in the first column
  - Uncheck rows to **exclude** them from the conversion pipeline
  - Excluded rows never appear in the preview or exports

- **Editable cells**
  - Double-click any cell to edit its value in place
  - Edits are persisted into `sourceRows` and flow through to preview / export
  - Useful for fixing typos, cleaning weird values, or correcting dates

- **Column selection (for questions)**
  - Click any header to toggle selection for that column
  - Selected columns are highlighted (header + all cells) with a darker accent background
  - Selected question columns drive what appears in the mapping panel

#### Under the hood (simplified)

```js
// On file input change:
if (ext === 'csv') {
  Papa.parse(file, { header: true, /* ... */ });
} else if (ext === 'xlsx' || ext === 'xls') {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  sourceRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
}

renderSourceTable();
populateDateSelect();
updateColumnMappingsUI();
```




### 2️⃣ Panel: Map to Framework
<img width="426" height="749" alt="image" src="https://github.com/user-attachments/assets/7a9a5a0e-9dee-453e-9ac6-82848d87b2db" />

**Goal:** Say which org this file belongs to, how the final filename should look, which date column to use, and how to label each question.

---

### a. Target Org ID + Filename Builder

- **Target Org ID input** (e.g., `org1`, `org2`, `districtA`)
- **Filename input with live prefix/suffix lock**

When you type `org1` in the Org ID box:

`org1_<your_file_name>.csv`

- Only the **middle part** (the editable filename) can be typed.
- The **prefix (`org1_`)** and **suffix (`.csv`)** are locked/controlled by the tool.

**Example:**

- Target Org ID: `org1`  
- Output filename display: `org1_teacher_survey_may.csv`

The computed **final filename** is stored internally and used by:

- **Download CSV**
- **Conversion Queue**

---

### b. Date Column & Input Format

#### Date Column select

- A dropdown of all headers.  
- The selected header becomes the `date` column in the output file.

#### Input Date Format select

- `MM/DD/YYYY (mdy)`
- `DD/MM/YYYY (dmy)`

The converter normalizes all dates to:

`DD/MM/YYYY`

Used by the Visualizer.

Example helper:

```js
function normalizeDate(value, inputFormat) {
  // ...split, reorder, and return DD/MM/YYYY
}
```

### c. Question Mapping List

Shows every selected column (except the chosen date column).

For each mapping entry:

- `Source column: [original header]`
- `[ Input box: "Framework-aligned question text" ]`

You can:

- Keep the original column header, **or**
- Type the exact question wording used in `school-system.data.js`.

This allows widely different exports (Qualtrics, Google Forms, SIS exports, etc.) to be renamed into a single canonical question set that the Visualizer understands.

### 3️⃣ Panel: Preview & Download
<img width="896" height="746" alt="image" src="https://github.com/user-attachments/assets/a4989c84-9d5f-4572-94c3-25cb7ff47185" />


**Goal:** Show exactly what the final converted CSV will look like.

Triggered by:

- **Generate Preview**

The converter validates:

- A file is loaded  
- Org ID is set  
- Filename middle is non-empty  
- At least one question column is mapped  

Then it builds a normalized dataset:

- Dates → always `DD/MM/YYYY`
- Likert text → numeric (`1–5`)
- Numeric values preserved
- Output stored in `previewData`

The preview table:

- Displays normalized headers + rows  
- Read-only  
- Uses dashed borders + thin accent scrollbars  

Actions:

- **Download Converted CSV**  
  Exports using:  
  `orgId_<filename>.csv`

- **Add to Conversion Queue**  
  Stores `previewData` under the selected org for batch export.

### 4️⃣ Panel: Conversion Queue
<img width="398" height="522" alt="image" src="https://github.com/user-attachments/assets/82f05c1b-04c5-49e2-b6fe-ae0fac490042" />

**Goal:** Batch-export multiple converted files for one or many orgs.

Displayed as a tree:

- Each **org** becomes a parent folder  
- Each **converted CSV** appears as a child item  

Features:

- **Click to preview** any queued file (loads it back into Preview panel)
- **Remove** an org or individual file (each has a small ✕)
- **Convert All**:
  - Prompts for a destination folder
  - Creates subfolders per org
  - Writes each queued CSV using its final filename
  - Can be run repeatedly (queue is not cleared automatically)

## 📬 Contact & Support

For questions, suggestions, or requests for framework integration,
please reach out to the RPPL team or your project lead.

If you encounter issues running the Visualizer inside Stronghold
or need help preparing CSVs for your framework, we’re happy to help.


## 🔒 Security Notes

RPPL Insights v2.0 is built for secure, offline environments.
All CSV data is kept locally inside `orgdata/`, never transmitted,
and fully protected by a custom Python server that blocks direct access.

For any deployment involving real student or teacher data,
ensure machines remain within the approved research environment
and follow all relevant data governance policies.

## 📎 License
This project is licensed for internal use within RPPL and Brown University’s Stronghold environment.
