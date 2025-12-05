// converter/converter.js
// RPPL Insights Data Converter
// jn.120325 — First-pass UI for mapping client CSVs into orgdata-ready format.

/* ===========================
   Global state
   =========================== */

let conversionQueue = {}; // global queue
let sourceHeaders = [];
let sourceRows = [];        // array of objects (Papa header:true)
let selectedCols = new Set();
let excludedRows = new Set();
let dateColIndex = 0;
let previewData = null;
// let newOrgDataDir = null;

// ---------------------------------------------
// Likert-style mappings (text → 1..5)
// Easy to extend: just add more 5-point arrays
// ---------------------------------------------

// Normalize labels so variants like "Not at all" / "not  at ALL"
// map to the same key.
function normalizeLikert(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " "); // collapse multiple spaces
}

// Each inner array is a 5-point scale in order 1..5
const LIKERT_SCALES = [
  [
    "Strongly Disagree",
    "Disagree",
    "Neutral",
    "Agree",
    "Strongly Agree"
  ],
  [
    "not a priority",
    "very low priority",
    "low priority",
    "high priority",
    "very high priority"
  ],
  [
    "not at all",
    "minimally",
    "somewhat",
    "to a great extent",
    "to a very great extent"
  ],
  [
    "not at all integrated",
    "minimally integrated",
    "somewhat integrated",
    "highly integrated",
    "very highly integrated"
  ],
  [
    "very poorly aligned",
    "poorly aligned",
    "somewhat aligned",
    "well aligned",
    "very well aligned"
  ],
  [
    "not at all",
    "once a year",
    "every few months",
    "once a month",
    "more than once a month"
  ],
  [
    "no time",
    "minimal time",
    "some time",
    "a lot of time",
    "nearly all of the time"
  ],
  [
    "no",
    "rarely",
    "sometimes",
    "often",
    "consistently"
  ],
  [
    "I have none of the materials and resources I need",
    "I have few of the materials and resources I need",
    "I have some of the materials and resources I need",
    "I have most of the materials and resources I need",
    "I have all the materials and resources I need"
  ],
  [
    "no",
    "not really",
    "somewhat",
    "for the most part",
    "absolutely"
  ]
];

// Build a map of normalized text → numeric value (1..5)
const LIKERT_MAP = (() => {
  const map = {};

  LIKERT_SCALES.forEach(scale => {
    scale.forEach((label, index) => {
      const key = normalizeLikert(label);
      // Only set if not already present so duplicates don't matter
      if (!(key in map)) {
        map[key] = index + 1; // 1..5
      }
    });
  });

  return map;
})();

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const fileStatus = document.getElementById("fileStatus");
  const sourceTable = document.getElementById("sourceTable");
  const sourcePlaceholder = document.getElementById("sourceTablePlaceholder");

  const dateSelect = document.getElementById("dateColumnSelect");
  const dateFormatSelect = document.getElementById("dateFormatSelect");
  const mappingsContainer = document.getElementById("columnMappings");

  const previewTable = document.getElementById("previewTable");
  const previewPlaceholder = document.getElementById("previewPlaceholder");
  const generatePreviewBtn = document.getElementById("generatePreviewBtn");
  const downloadCsvBtn = document.getElementById("downloadCsvBtn");

  const orgIdInput = document.getElementById("orgIdInput");
  const targetFileNameInput = document.getElementById("targetFileName");
	
	const addToQueueBtn = document.getElementById("addToQueueBtn");

	const filenameMiddle = document.getElementById("filenameMiddle");
	const filenamePrefix = document.getElementById("filenamePrefix");
	const filenameSuffix = document.getElementById("filenameSuffix");
	const finalFilenameDisplay = document.getElementById("finalFilenameDisplay");

	function updateFilenameFinal() {
		const org = orgIdInput.value.trim();
		const mid = filenameMiddle.value.trim();

		filenamePrefix.textContent = org ? org + "_" : "";
		const finalName = (org ? org + "_" : "") + mid + ".csv";

		finalFilenameDisplay.textContent = finalName;

		// store the final computed filename globally
		window.__FINAL_FILENAME__ = finalName;
	}

	orgIdInput.addEventListener("input", updateFilenameFinal);
	filenameMiddle.addEventListener("input", updateFilenameFinal);


	/* ========= File upload & parsing (CSV + XLSX) ========= */

	fileInput.addEventListener("change", async (e) => {
		const file = e.target.files?.[0];
		if (!file) {
			fileStatus.textContent = "No file loaded.";
			return;
		}

		fileStatus.textContent = `Loading: ${file.name} ...`;

		const ext = file.name.toLowerCase().split(".").pop();

		try {
			if (ext === "csv") {
				// ----------- CSV via PapaParse -----------
				Papa.parse(file, {
					header: true,
					skipEmptyLines: true,
					complete: (results) => {
						sourceHeaders = results.meta.fields || [];
						sourceRows = results.data || [];
						selectedCols = new Set();
						excludedRows = new Set();
						dateColIndex = 0;

						renderSourceTable(sourceTable, sourcePlaceholder);
						populateDateSelect(dateSelect);
						updateColumnMappingsUI(mappingsContainer);

						fileStatus.textContent = `${file.name} loaded. ${sourceRows.length} rows detected.`;
					},
					error: (err) => {
						console.error("CSV parse error:", err);
						fileStatus.textContent = "Error reading CSV.";
					}
				});

			} else if (ext === "xlsx" || ext === "xls") {
				// ----------- XLSX/XLS via SheetJS -----------
				const data = await file.arrayBuffer();
				const workbook = XLSX.read(data, { type: "array" });

				// Use first sheet
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];

				// Convert to objects with headers
				const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

				if (!json.length) {
					fileStatus.textContent = "Excel file is empty.";
					return;
				}

				// Extract headers from first row’s keys
				sourceHeaders = Object.keys(json[0]);
				sourceRows = json; // rows already objects like PapaParse output
				selectedCols = new Set();
				excludedRows = new Set();
				dateColIndex = 0;

				renderSourceTable(sourceTable, sourcePlaceholder);
				populateDateSelect(dateSelect);
				updateColumnMappingsUI(mappingsContainer);

				fileStatus.textContent = `${file.name} loaded (Excel). ${sourceRows.length} rows detected.`;

			} else {
				alert("Unsupported file type. Please upload CSV or XLSX.");
				fileStatus.textContent = "Unsupported file type.";
			}
		} catch (err) {
			console.error("File load error:", err);
			fileStatus.textContent = "Error loading file.";
		}
	});


  /* ========= Date column / format changes ========= */

  dateSelect.addEventListener("change", () => {
    const idx = Number(dateSelect.value);
    if (!Number.isNaN(idx)) {
      dateColIndex = idx;
      // Refresh mapping panel to hide date column in question list, if needed
      updateColumnMappingsUI(mappingsContainer);
    }
  });

  /* ========= Generate Preview ========= */

  generatePreviewBtn.addEventListener("click", () => {
    if (!sourceHeaders.length || !sourceRows.length) {
      alert("Please upload a CSV file first.");
      return;
    }

    const orgId = orgIdInput.value.trim();
		
		/*
    const targetName = targetFileNameInput.value.trim();

    if (!orgId) {
      alert("Please enter a Target Org ID (e.g., org1).");
      return;
    }

    if (!targetName) {
      alert("Please enter a Target Output File Name (e.g., org1_teacher_pulse_check.csv).");
      return;
    }
		*/
		
		const finalName = window.__FINAL_FILENAME__?.trim();
		const mid = filenameMiddle.value.trim();

		if (!orgId) {
			alert("Please enter a Target Org ID (e.g., org1).");
			return;
		}

		if (!mid) {
			alert("Please enter a filename (the middle section).");
			return;
		}


    const mappingResult = collectMappings(mappingsContainer);
    if (!mappingResult || !mappingResult.questionCols.length) {
      alert("Please select at least one question column (click headers in the left grid) and provide question labels.");
      return;
    }

    const inputFormat = dateFormatSelect.value === "dmy" ? "dmy" : "mdy";
    
		/*
		previewData = runConversion({
      orgId,
      targetName,
      dateFormatIn: inputFormat,
      dateColIndex,
      questionCols: mappingResult.questionCols,
      newHeaders: mappingResult.newHeaders
    });
		*/
		
		previewData = runConversion({
			orgId,
			targetName: finalName,
			dateFormatIn: inputFormat,
			dateColIndex,
			questionCols: mappingResult.questionCols,
			newHeaders: mappingResult.newHeaders
		});


    renderPreviewTable(previewTable, previewPlaceholder);
    downloadCsvBtn.disabled = false;
		addToQueueBtn.disabled = false;

  });

  /* ========= Download CSV ========= */

  downloadCsvBtn.addEventListener("click", () => {
    if (!previewData) return;

    // const targetName = (document.getElementById("targetFileName").value || "converted.csv").trim();
    const targetName = (window.__FINAL_FILENAME__ || "converted.csv").trim();
    const csv = buildCsv(previewData.headers, previewData.rows);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = targetName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
	
	addToQueueBtn.addEventListener("click", () => {
		if (!window.conversionQueue) window.conversionQueue = conversionQueue;
		if (!previewData) return;

		const orgId = document.getElementById("orgIdInput").value.trim();
		// const targetName = document.getElementById("targetFileName").value.trim();
		const targetName = window.__FINAL_FILENAME__.trim();


		if (!conversionQueue[orgId]) conversionQueue[orgId] = [];
		conversionQueue[orgId].push({
			orgId,
			targetName,
			previewData
		});

		renderQueueTree();
	});



  /* ========= Helper: render source table ========= */

	/*
  function renderSourceTable(tableEl, placeholderEl) {
    tableEl.innerHTML = "";
    if (!sourceHeaders.length) {
      placeholderEl.style.display = "flex";
      return;
    }
    placeholderEl.style.display = "none";

    const thead = document.createElement("thead");
    const hr = document.createElement("tr");

    sourceHeaders.forEach((header, colIdx) => {
      const th = document.createElement("th");
      th.textContent = header || `(Column ${colIdx + 1})`;
      th.dataset.colIndex = String(colIdx);
      th.title = "Click to select/deselect this column for conversion";
      th.addEventListener("click", () => toggleColumnSelection(colIdx));
      hr.appendChild(th);
    });
    thead.appendChild(hr);

    const tbody = document.createElement("tbody");
    const maxRows = Math.min(60, sourceRows.length);
    for (let r = 0; r < maxRows; r++) {
      const rowObj = sourceRows[r];
      const tr = document.createElement("tr");
      sourceHeaders.forEach((h, cIdx) => {
        const td = document.createElement("td");
        const cellVal = rowObj[h] ?? "";
        td.textContent = cellVal;
        td.dataset.colIndex = String(cIdx);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }

    tableEl.appendChild(thead);
    tableEl.appendChild(tbody);

    // Initially no selection, but keep dateColIndex tracked
    highlightSelections();
  }
	*/
	
	/*
	function renderSourceTable(tableEl, placeholderEl) {
		tableEl.innerHTML = "";
		if (!sourceHeaders.length) {
			placeholderEl.style.display = "flex";
			return;
		}
		placeholderEl.style.display = "none";

		const thead = document.createElement("thead");
		const hr = document.createElement("tr");

		// --- NEW: left "row" header (not clickable) ---
		const thRow = document.createElement("th");
		thRow.textContent = ""; // ❌ #
		thRow.className = "row-selector-header";
		hr.appendChild(thRow);

		// Existing header cells (clickable for column selection)
		sourceHeaders.forEach((header, colIdx) => {
			const th = document.createElement("th");
			th.textContent = header || `(Column ${colIdx + 1})`;
			th.dataset.colIndex = String(colIdx);
			th.title = "Click to select/deselect this column for conversion";
			th.addEventListener("click", () => toggleColumnSelection(colIdx));
			hr.appendChild(th);
		});
		thead.appendChild(hr);

		const tbody = document.createElement("tbody");
		const maxRows = Math.min(60, sourceRows.length);
		for (let r = 0; r < maxRows; r++) {
			const rowObj = sourceRows[r];
			const tr = document.createElement("tr");

			// --- NEW: row selector cell ---
			const sel = document.createElement("td");
			sel.className = "row-selector-cell";
			sel.dataset.rowIndex = String(r);
			sel.title = "Click to exclude/include this row";
			sel.textContent = excludedRows.has(r) ? "✕" : "";
			sel.addEventListener("click", (ev) => {
				ev.stopPropagation(); // don't interfere with cell clicks
				toggleRowExclusion(r, tr, sel);
			});
			tr.appendChild(sel);

			// Existing data cells
			sourceHeaders.forEach((h, cIdx) => {
				const td = document.createElement("td");
				const cellVal = rowObj[h] ?? "";
				td.textContent = cellVal;
				td.dataset.colIndex = String(cIdx);
				tr.appendChild(td);
			});

			if (excludedRows.has(r)) {
				tr.classList.add("row-excluded");
			}

			tbody.appendChild(tr);
		}

		tableEl.appendChild(thead);
		tableEl.appendChild(tbody);

		// Initially no selection, but keep dateColIndex tracked
		highlightSelections();
	}
	*/
	
	function renderSourceTable(tableEl, placeholderEl) {
		tableEl.innerHTML = "";
		if (!sourceHeaders.length) {
			placeholderEl.style.display = "flex";
			return;
		}
		placeholderEl.style.display = "none";

		const thead = document.createElement("thead");
		const hr = document.createElement("tr");

		// Row selector header
		const thRow = document.createElement("th");
		thRow.textContent = "#";
		thRow.className = "row-selector-header";
		hr.appendChild(thRow);

		// Column headers
		sourceHeaders.forEach((header, colIdx) => {
			const th = document.createElement("th");
			th.textContent = header || `(Column ${colIdx + 1})`;
			th.dataset.colIndex = String(colIdx);
			th.title = "Click to select/deselect this column for conversion";
			th.addEventListener("click", () => toggleColumnSelection(colIdx));
			hr.appendChild(th);
		});
		thead.appendChild(hr);

		const tbody = document.createElement("tbody");
		const maxRows = Math.min(60, sourceRows.length);
		for (let r = 0; r < maxRows; r++) {
			const rowObj = sourceRows[r];
			const tr = document.createElement("tr");

			// Row selector cell
			const sel = document.createElement("td");
			sel.className = "row-selector-cell";
			sel.dataset.rowIndex = String(r);
			sel.title = "Click to exclude/include this row";
			sel.textContent = excludedRows.has(r) ? "✕" : "";
			sel.addEventListener("click", (ev) => {
				ev.stopPropagation();
				toggleRowExclusion(r, tr, sel);
			});
			tr.appendChild(sel);

			// Data cells (editable)
			sourceHeaders.forEach((h, cIdx) => {
				const td = document.createElement("td");
				const cellVal = rowObj[h] ?? "";
				td.textContent = cellVal;
				td.dataset.colIndex = String(cIdx);
				td.dataset.rowIndex = String(r);
				td.classList.add("editable-cell");
				td.contentEditable = "true";

				// Update sourceRows when the user edits the cell
				td.addEventListener("blur", handleCellEdit);
				td.addEventListener("keydown", (evt) => {
					if (evt.key === "Enter") {
						evt.preventDefault();
						td.blur();
					}
				});

				tr.appendChild(td);
			});

			if (excludedRows.has(r)) {
				tr.classList.add("row-excluded");
			}

			tbody.appendChild(tr);
		}

		tableEl.appendChild(thead);
		tableEl.appendChild(tbody);

		highlightSelections();
	}


  function toggleColumnSelection(colIdx) {
    if (selectedCols.has(colIdx)) {
      selectedCols.delete(colIdx);
    } else {
      selectedCols.add(colIdx);
    }
    highlightSelections();
    updateColumnMappingsUI(mappingsContainer);
  }

  function highlightSelections() {
    const tableEl = document.getElementById("sourceTable");
    if (!tableEl) return;

    const ths = tableEl.querySelectorAll("th");
    ths.forEach((th) => {
      const idx = Number(th.dataset.colIndex);
      th.classList.toggle("conv-col-header-selected", selectedCols.has(idx));
    });

    const tds = tableEl.querySelectorAll("td");
    tds.forEach((td) => {
      const idx = Number(td.dataset.colIndex);
      td.classList.toggle("conv-col-cell-selected", selectedCols.has(idx));
    });
  }

	function handleCellEdit(e) {
		const td = e.target;
		const rowIdx = Number(td.dataset.rowIndex);
		const colIdx = Number(td.dataset.colIndex);

		if (Number.isNaN(rowIdx) || Number.isNaN(colIdx)) return;

		const header = sourceHeaders[colIdx];
		if (!header || !sourceRows[rowIdx]) return;

		sourceRows[rowIdx][header] = td.textContent.trim();
	}


	function toggleRowExclusion(rowIndex, tr, selectorCell) {
		if (excludedRows.has(rowIndex)) {
			excludedRows.delete(rowIndex);
		} else {
			excludedRows.add(rowIndex);
		}
		applyRowExclusionStyles(rowIndex, tr, selectorCell);
	}

	function applyRowExclusionStyles(rowIndex, tr, selectorCell) {
		const isExcluded = excludedRows.has(rowIndex);
		if (isExcluded) {
			tr.classList.add("row-excluded");
			if (selectorCell) selectorCell.textContent = "✕";
		} else {
			tr.classList.remove("row-excluded");
			if (selectorCell) selectorCell.textContent = "";
		}
	}


  /* ========= Populate date column select ========= */

  function populateDateSelect(selectEl) {
    selectEl.innerHTML = "";
    if (!sourceHeaders.length) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "(no columns yet)";
      selectEl.appendChild(opt);
      return;
    }

    sourceHeaders.forEach((h, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = h || `(Column ${i + 1})`;
      selectEl.appendChild(opt);
    });

    // default date column = 0
    selectEl.value = "0";
    dateColIndex = 0;
  }

  /* ========= Column mappings panel ========= */

  function updateColumnMappingsUI(container) {
    container.innerHTML = "";
    if (!sourceHeaders.length) return;

    // Question columns = selected columns that are NOT the date column
    const sortedCols = Array.from(selectedCols).sort((a, b) => a - b);
    const questionCols = sortedCols.filter((idx) => idx !== dateColIndex);

    if (!questionCols.length) {
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "conv-help";
      emptyMsg.textContent = "No question columns selected yet. Click headers in the left grid.";
      container.appendChild(emptyMsg);
      return;
    }

    questionCols.forEach((idx) => {
      const originalHeader = sourceHeaders[idx] || `(Column ${idx + 1})`;

      const item = document.createElement("div");
      item.className = "conv-mapping-item";
      item.dataset.colIndex = String(idx);

      const original = document.createElement("div");
      original.className = "conv-mapping-original";
      original.textContent = `Source column: ${originalHeader}`;

      const targetLabel = document.createElement("div");
      targetLabel.className = "conv-mapping-target-label";
      targetLabel.textContent = "Framework-aligned question text:";

      const input = document.createElement("input");
      input.type = "text";
      input.className = "conv-mapping-input";
      input.value = originalHeader; // default: keep same
      input.placeholder = "Enter the exact question wording used in school-system.data.js / professional-learning.data.js, etc.";

      item.appendChild(original);
      item.appendChild(targetLabel);
      item.appendChild(input);
      container.appendChild(item);
    });
  }

  function collectMappings(container) {
    const items = container.querySelectorAll(".conv-mapping-item");
    if (!items.length) return null;

    const questionCols = [];
    const newHeaders = [];

    items.forEach((item) => {
      const idx = Number(item.dataset.colIndex);
      const input = item.querySelector(".conv-mapping-input");
      const text = (input?.value || "").trim();
      if (!Number.isNaN(idx) && text) {
        questionCols.push(idx);
        newHeaders.push(text);
      }
    });

    return { questionCols, newHeaders };
  }

  /* ========= Conversion core ========= */

  function runConversion({ orgId, targetName, dateFormatIn, dateColIndex, questionCols, newHeaders }) {
    // Build header row: "date" + new question labels
    const headersOut = ["date", ...newHeaders];

    const dateHeader = sourceHeaders[dateColIndex];
    const rowsOut = [];

		/*
    sourceRows.forEach((rowObj) => {
      const rawDate = rowObj[dateHeader] || "";
      const convertedDate = normalizeDate(rawDate, dateFormatIn); // -> DD/MM/YYYY or ""

      const outRow = [convertedDate];

      questionCols.forEach((qIdx) => {
        const h = sourceHeaders[qIdx];
        const rawVal = (rowObj[h] ?? "").trim();
        const mapped = mapLikertValue(rawVal);
        outRow.push(mapped);
      });

      rowsOut.push(outRow);
    });
		*/
		
		sourceRows.forEach((rowObj, rowIdx) => {
			// Skip rows the user excluded in the source table
			if (excludedRows.has(rowIdx)) return;

			const rawDate = rowObj[dateHeader] || "";
			const convertedDate = normalizeDate(rawDate, dateFormatIn); // -> DD/MM/YYYY or ""

			const outRow = [convertedDate];

			questionCols.forEach((qIdx) => {
				const h = sourceHeaders[qIdx];
				const rawVal = (rowObj[h] ?? "").trim();
				const mapped = mapLikertValue(rawVal);
				outRow.push(mapped);
			});

			rowsOut.push(outRow);
		});


    return {
      orgId,
      targetName,
      headers: headersOut,
      rows: rowsOut
    };
  }

  function normalizeDate(value, inputFormat) {
    if (!value) return "";

    // Expect either MM/DD/YYYY or DD/MM/YYYY
    const parts = value.split(/[\/\-]/);
    if (parts.length < 3) {
      return value; // unknown format, return as-is
    }

    let m, d, y;
    if (inputFormat === "dmy") {
      d = parts[0];
      m = parts[1];
      y = parts[2];
    } else {
      // default: mdy
      m = parts[0];
      d = parts[1];
      y = parts[2];
    }

    // zero-pad
    const dd = d.padStart(2, "0");
    const mm = m.padStart(2, "0");
    return `${dd}/${mm}/${y}`;
  }

	/*
  function mapLikertValue(raw) {
    if (!raw) return "";
    if (LIKERT_MAP.hasOwnProperty(raw)) {
      return LIKERT_MAP[raw];
    }
    // If the raw value is already numeric-ish, pass it through
    const num = Number(raw);
    if (!Number.isNaN(num)) return num;
    // Fallback: return original text (you can refine this behavior)
    return raw;
  }
	*/
	
	// ---------------------------------------------
	// mapLikertValue: use text map, fallback to number
	// ---------------------------------------------
	function mapLikertValue(raw) {
		if (raw == null) return "";

		const str = String(raw).trim();
		if (!str) return "";

		// 1) Try mapped text (case/whitespace-insensitive)
		const norm = normalizeLikert(str);
		if (Object.prototype.hasOwnProperty.call(LIKERT_MAP, norm)) {
			return LIKERT_MAP[norm];
		}

		// 2) If already numeric-ish, pass through
		const num = Number(str);
		if (!Number.isNaN(num)) return num;

		// 3) Fallback: keep original text
		return str;
	}

  /* ========= Preview rendering ========= */

  function renderPreviewTable(tableEl, placeholderEl) {
    tableEl.innerHTML = "";
    if (!previewData || !previewData.headers.length) {
      placeholderEl.style.display = "flex";
      return;
    }
    placeholderEl.style.display = "none";

    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    previewData.headers.forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h;
      hr.appendChild(th);
    });
    thead.appendChild(hr);

    const tbody = document.createElement("tbody");
    const maxPreviewRows = Math.min(40, previewData.rows.length);
    for (let i = 0; i < maxPreviewRows; i++) {
      const rowArr = previewData.rows[i];
      const tr = document.createElement("tr");
      rowArr.forEach((cell) => {
        const td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }

    tableEl.appendChild(thead);
    tableEl.appendChild(tbody);
  }

  /* ========= CSV builder ========= */

  function buildCsv(headers, rows) {
    const escape = (val) => {
      if (val == null) return "";
      const s = String(val);
      if (s.includes('"') || s.includes(",") || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const lines = [];
    lines.push(headers.map(escape).join(","));
    rows.forEach((row) => {
      lines.push(row.map(escape).join(","));
    });
    return lines.join("\n");
  }
	
	/*
	function renderQueueTree() {
		const wrap = document.getElementById("queueContainer");
		wrap.innerHTML = "";

		Object.keys(conversionQueue).forEach(org => {
			const orgDiv = document.createElement("div");
			orgDiv.className = "queue-org";
			orgDiv.textContent = org;
			wrap.appendChild(orgDiv);

			conversionQueue[org].forEach((item, idx) => {
				const div = document.createElement("div");
				div.className = "queue-item";
				div.textContent = item.targetName;

				div.addEventListener("click", () => {
					previewData = item.previewData;
					renderPreviewTable(
						document.getElementById("previewTable"),
						document.getElementById("previewPlaceholder")
					);
				});

				wrap.appendChild(div);
			});
		});
	}
	*/
	
	function renderQueueTree() {
		const wrap = document.getElementById("queueContainer");
		wrap.innerHTML = "";

		const orgKeys = Object.keys(conversionQueue);
		if (!orgKeys.length) {
			const empty = document.createElement("div");
			empty.className = "conv-help";
			empty.textContent = "Queue is empty. Add items after generating preview.";
			wrap.appendChild(empty);
			return;
		}

		orgKeys.forEach(org => {
			const orgRow = document.createElement("div");
			orgRow.className = "queue-org";

			const orgLabel = document.createElement("span");
			orgLabel.textContent = org;

			const orgRemove = document.createElement("button");
			orgRemove.className = "queue-remove-btn";
			orgRemove.type = "button";
			orgRemove.title = "Remove all items for this org";
			orgRemove.textContent = "✕";
			orgRemove.addEventListener("click", (e) => {
				e.stopPropagation();
				delete conversionQueue[org];
				renderQueueTree();
			});

			orgRow.appendChild(orgLabel);
			orgRow.appendChild(orgRemove);
			wrap.appendChild(orgRow);

			conversionQueue[org].forEach((item, idx) => {
				const div = document.createElement("div");
				div.className = "queue-item";

				const nameSpan = document.createElement("span");
				nameSpan.textContent = item.targetName;

				const itemRemove = document.createElement("button");
				itemRemove.className = "queue-remove-btn";
				itemRemove.type = "button";
				itemRemove.title = "Remove this file from the queue";
				itemRemove.textContent = "✕";
				itemRemove.addEventListener("click", (e) => {
					e.stopPropagation();
					conversionQueue[org].splice(idx, 1);
					if (!conversionQueue[org].length) {
						delete conversionQueue[org];
					}
					renderQueueTree();
				});

				// clicking the row (not the X) previews that item
				div.addEventListener("click", () => {
					previewData = item.previewData;
					renderPreviewTable(
						document.getElementById("previewTable"),
						document.getElementById("previewPlaceholder")
					);
				});

				div.appendChild(nameSpan);
				div.appendChild(itemRemove);
				wrap.appendChild(div);
			});
		});
	}

	
	/*
	document.getElementById("convertAllBtn").addEventListener("click", async () => {
		if (!Object.keys(conversionQueue).length) {
			alert("Nothing in queue.");
			return;
		}

		const root = await ensureNewOrgDataDir();

		for (const org of Object.keys(conversionQueue)) {
			// ensure subfolder exists
			let sub = null;
			try {
				sub = await root.getDirectoryHandle(org, { create: true });
			} catch (e) {
				sub = await root.getDirectoryHandle(org);
			}

			for (const item of conversionQueue[org]) {
				const csv = buildCsv(item.previewData.headers, item.previewData.rows);

				const fileHandle = await sub.getFileHandle(item.targetName, { create: true });
				const writable = await fileHandle.createWritable();
				await writable.write(csv);
				await writable.close();
			}
		}

		alert("All files written to selected folder.");
	});
	*/
	
	document.getElementById("convertAllBtn").addEventListener("click", async () => {
		if (!Object.keys(conversionQueue).length) {
			alert("Nothing in queue.");
			return;
		}

		let root;
		try {
			// Ask user where to write files on every Convert All
			root = await window.showDirectoryPicker();
		} catch (e) {
			console.error("User canceled folder selection or error:", e);
			return;
		}

		for (const org of Object.keys(conversionQueue)) {
			let sub;
			try {
				sub = await root.getDirectoryHandle(org, { create: true });
			} catch (e) {
				// Fallback if create option behaves oddly
				sub = await root.getDirectoryHandle(org);
			}

			for (const item of conversionQueue[org]) {
				const csv = buildCsv(item.previewData.headers, item.previewData.rows);

				const fileHandle = await sub.getFileHandle(item.targetName, { create: true });
				const writable = await fileHandle.createWritable();
				await writable.write(csv);
				await writable.close();
			}
		}

		alert("All files written to selected folder.");
	});



	/*
	async function ensureNewOrgDataDir() {
		if (newOrgDataDir) return newOrgDataDir;

		const dir = await window.showDirectoryPicker();
		newOrgDataDir = dir;
		return dir;
	}
	*/
	

});

