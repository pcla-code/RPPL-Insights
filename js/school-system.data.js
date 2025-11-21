// js/school-system.data.js — shared CSV + aggregation helpers
// jn.112025


// js/school-system.data.js
// jn.112025 — per-construct data config for all 4 charts

(function () {
  const DATA_CONFIGS = {
    // SCHOOL & SYSTEM CONDITION 
		'school-system': {

			radar: {
				surveySets: [
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
				]
			},

			overall: {
				surveySets: [
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
				]
			},

			milestone: {
				sets: [
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
				]
			},

			scatter: {
				SURVEY_SETS: [
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
				]
			}
		},


    // PROFESSIONAL LEARNING 
    'professional-learning': {
      radar: {
        surveySets: [
          {
            label: "(A) PL Relevance - Teacher Pulse Check",
            fileOf: (org) => `orgdata/${org}_teacher_pulse_check.csv`,
            questions: [
              "How relevant was today's session to your work as a teacher?"
            ]
          },
          {
            label: "(A) PL Relevance - Admin Pulse Check",
            fileOf: (org) => `orgdata/${org}_admin_pulse_check.csv`,
            questions: [
              "How relevant was today's session to your work?"
            ]
          },
          {
            label: "(B) PL Utility - Teacher Survey",
            fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
            questions: [
              "To what extent have [professional learning activities] helped you use [curriculum] more effectively to meet student needs?"
            ]
          }
        ]
      },

      overall: {
        surveySets: [
          {
            label: '(A) PL Relevance - Teacher Pulse Check',
            color: '#A98FD4',
            fileOf: (org) => `orgdata/${org}_teacher_pulse_check.csv`,
            questions: [
              "How relevant was today's session to your work as a teacher?"
            ]
          },
          {
            label: '(A) PL Relevance - Admin Pulse Check',
            color: '#A98FD4',
            fileOf: (org) => `orgdata/${org}_admin_pulse_check.csv`,
            questions: [
              "How relevant was today's session to your work?",
              "To what extent was today's sesssion tailored in ways that reflected your individual needs?",
              "To what extent did today's session deepen your understanding of [Name of Curriculum]"
            ]
          },
          {
            label: '(B) PL Utility - Teacher Survey',
            color: '#4C9AFF',
            fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
            questions: [
              "To what extent have [professional learning activities] helped you use [curriculum] more effectively to meet student needs?"
            ]
          }
        ]
      },

      milestone: {
        sets: [
          {
            label: '(A) PL Relevance - Teacher Pulse Check',
            color: '#A98FD4',
            fileOf: (org) => `orgdata/${org}_teacher_pulse_check.csv`,
            questions: [
              "How relevant was today's session to your work as a teacher?"
            ]
          },
          {
            label: '(A) PL Relevance - Admin Pulse Check',
            color: '#A98FD4',
            fileOf: (org) => `orgdata/${org}_admin_pulse_check.csv`,
            questions: [
              "How relevant was today's session to your work?",
              "To what extent was today's sesssion tailored in ways that reflected your individual needs?",
              "To what extent did today's session deepen your understanding of [Name of Curriculum]"
            ]
          },
          {
            label: '(B) PL Utility - Teacher Survey',
            color: '#4C9AFF',
            fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
            questions: [
              "To what extent have [professional learning activities] helped you use [curriculum] more effectively to meet student needs?"
            ]
          }
        ]
      },

      scatter: {
        SURVEY_SETS: [
          {
            label: "(A) Teacher Pulse Check",
            fileOf: (org) => `orgdata/${org}_teacher_pulse_check.csv`,
            questions: [
              "How relevant was today's session to your work as a teacher?",
              "To what extent was today's sesssion tailored in ways that reflected your individual needs as a teacher?",
              "To what extent did today's session deepen your understanding of [Name of Curriculum]"
            ]
          },
          {
            label: "(B) Admin Pulse Check",
            fileOf: (org) => `orgdata/${org}_admin_pulse_check.csv`,
            questions: [
              "How relevant was today's session to your work?",
              "To what extent was today's sesssion tailored in ways that reflected your individual needs?",
              "To what extent did today's session deepen your understanding of [Name of Curriculum]"
            ]
          }
        ]
      }
    },

		// INSTRUCTIONAL PRACTICE
		'instructional-practice': {
			radar: {
				surveySets: [
					{
						label: "(A) HQIM Integrity - Classroom Observation",
						fileOf: (org) => `orgdata/${org}_classroom_observation.csv`,
						questions: [
							"students interact with core grade-level texts from the curriculum during the lesson"
						]
					},
					{
						label: "(B) HQIM Flexibility - Classroom Observation",
						fileOf: (org) => `orgdata/${org}_classroom_observation.csv`,
						questions: [
							"The teacher checks for understanding throughout the lesson and makes adaptations according to student understanding"
						]
					},
					{
						label: "(C) HQIM Culture - Classroom Observation",
						fileOf: (org) => `orgdata/${org}_classroom_observation.csv`,
						questions: [
							"The teacher incorporates issues important to the classroom school and community"
						]
					}
				]
			},

			overall: {
				surveySets: [
					{
						label: '(A) Classroom Observation (Core Component Integrity)',
						color: '#A98FD4',
						fileOf: (org) => `orgdata/${org}_classroom_observation.csv`,
						questions: [
							"students interact with core grade-level texts from the curriculum during the lesson"
						]
					},
					{
						label: '(B) Classroom Observation (HQIM Flexibility)',
						color: '#4C9AFF',
						fileOf: (org) => `orgdata/${org}_classroom_observation.csv`,
						questions: [
							"The teacher checks for understanding throughout the lesson and makes adaptations according to student understanding"
						]
					},
					{
						label: '(C) Classroom Observation (Culture Adaptability)',
						color: '#FF9FA9',
						fileOf: (org) => `orgdata/${org}_classroom_observation.csv`,
						questions: [
							"The teacher incorporates issues important to the classroom school and community"
						]
					}
				]
			},

			milestone: {
				sets: [
					{
						label: '(A) Classroom Observation - Core Component Integrity',
						color: '#A98FD4',
						fileOf: (org) => `orgdata/${org}_classroom_observation.csv`,
						questions: [
							"students interact with core grade-level texts from the curriculum during the lesson"
						]
					},
					{
						label: '(B) Classroom Observation - HQIM Flexibility',
						color: '#4C9AFF',
						fileOf: (org) => `orgdata/${org}_classroom_observation.csv`,
						questions: [
							"The teacher checks for understanding throughout the lesson and makes adaptations according to student understanding"
						]
					},
					{
						label: '(C) Classroom Observation - Culture Adaptability',
						color: '#FF9FA9',
						fileOf: (org) => `orgdata/${org}_classroom_observation.csv`,
						questions: [
							"The teacher incorporates issues important to the classroom school and community"
						]
					}
				]
			},

			scatter: {
				SURVEY_SETS: [
					{
						label: "(A) Classroom Observation (Core Component Integrity)",
						fileOf: (org) => `orgdata/${org}_classroom_observation.csv`,
						questions: [
							"students interact with core grade-level texts from the curriculum during the lesson"
						]
					},
					{
						label: "(B) Classroom Observation (HQIM Flexibility)",
						fileOf: (org) => `orgdata/${org}_classroom_observation.csv`,
						questions: [
							"The teacher checks for understanding throughout the lesson and makes adaptations according to student understanding"
						]
					},
					{
						label: "(C) Classroom Observation (Culture Adaptability)",
						fileOf: (org) => `orgdata/${org}_classroom_observation.csv`,
						questions: [
							"The teacher incorporates issues important to the classroom school and community"
						]
					}
				]
			}
		},



		// TEACHER BELIEF & MINDSETS
		'teacher-belief': {
			radar: {
				surveySets: [
					{
						label: "(A) Belief in Rigor - Teacher Survey",
						fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
						questions: [
							"How well does your school leaders' vision for instruction align with your adopted curriculum?"
						]
					},
					{
						label: "(B) Belief in Affirming Instruction - Teacher Survey",
						fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
						questions: [
							"Do you have sufficient time to engage in professional learning focused on [curriculum]?"
						]
					},
					{
						label: "(A) Belief in Rigor - School Leader Survey",
						fileOf: (org) => `orgdata/${org}_school_leader_survey.csv`,
						questions: [
							"How much of a priority is implementation of [curriculum] for your school?"
						]
					},
					{
						label: "(B) Belief in Affirming Instruction - School Leader Survey",
						fileOf: (org) => `orgdata/${org}_school_leader_survey.csv`,
						questions: [
							"How often does school leadership review data on implementation of [curriculum] to support continuous improvement?"
						]
					},
					{
						label: "(A) Belief in Rigor - Non-Teacher PL",
						fileOf: (org) => `orgdata/${org}_non_teacher_pl_participant.csv`,
						questions: [
							"How well does your school's vision for instruction align with [adopted curriculum]?"
						]
					},
					{
						label: "(B) Belief in Affirming Instruction - Non-Teacher PL",
						fileOf: (org) => `orgdata/${org}_non_teacher_pl_participant.csv`,
						questions: [
							"Do teachers in your school have sufficient time to engage in professional learning focused on [curriculum]?"
						]
					}
				]
			},

			overall: {
				surveySets: [
					{
						label: '(A) Belief in Rigor - Teacher Survey',
						color: '#A98FD4',
						fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
						questions: [
							"How well does your school leaders' vision for instruction align with your adopted curriculum?"
						]
					},
					{
						label: '(A) Belief in Rigor - School Leader Survey',
						color: '#A98FD4',
						fileOf: (org) => `orgdata/${org}_school_leader_survey.csv`,
						questions: [
							"How much of a priority is implementation of [curriculum] for your school?",
							"How aligned is your HQIM To what extent are teachers held accountable to implementing [curriculum] through performance evaluations?",
							"To what extent is implementation of [curriculum] integrated with other school systems and initiatives (e.g. assessments and RTI)?"
						]
					},
					{
						label: '(B) Belief in Affirming Instruction - School Leader Survey',
						color: '#4C9AFF',
						fileOf: (org) => `orgdata/${org}_school_leader_survey.csv`,
						questions: [
							"How often does school leadership review data on implementation of [curriculum] to support continuous improvement?"
						]
					},
					{
						label: '(B) Belief in Affirming Instruction - Teacher Survey',
						color: '#4C9AFF',
						fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
						questions: [
							"Do you have sufficient time to engage in professional learning focused on [curriculum]?"
						]
					}
				]
			},

			milestone: {
				sets: [
					{
						label: '(A) Belief in Rigor - Teacher Survey',
						color: '#A98FD4',
						fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
						questions: [
							"How well does your school leaders' vision for instruction align with your adopted curriculum?"
						]
					},
					{
						label: '(A) Belief in Rigor - School Leader Survey',
						color: '#A98FD4',
						fileOf: (org) => `orgdata/${org}_school_leader_survey.csv`,
						questions: [
							"How much of a priority is implementation of [curriculum] for your school?",
							"How aligned is your HQIM To what extent are teachers held accountable to implementing [curriculum] through performance evaluations?",
							"To what extent is implementation of [curriculum] integrated with other school systems and initiatives (e.g. assessments and RTI)?"
						]
					},
					{
						label: '(B) Belief in Affirming Instruction - School Leader Survey',
						color: '#4C9AFF',
						fileOf: (org) => `orgdata/${org}_school_leader_survey.csv`,
						questions: [
							"How often does school leadership review data on implementation of [curriculum] to support continuous improvement?"
						]
					},
					{
						label: '(B) Belief in Affirming Instruction - Teacher Survey',
						color: '#4C9AFF',
						fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
						questions: [
							"Do you have sufficient time to engage in professional learning focused on [curriculum]?"
						]
					}
				]
			},

			scatter: {
				SURVEY_SETS: [
					{
						label: "(A) Teacher Survey",
						fileOf: (org) => `orgdata/${org}_teacher_survey.csv`,
						questions: [
							"How well does your school leaders' vision for instruction align with your adopted curriculum?",
							"Do you have sufficient time to engage in professional learning focused on [curriculum]?"
						]
					},
					{
						label: "(B) School Leader Survey",
						fileOf: (org) => `orgdata/${org}_school_leader_survey.csv`,
						questions: [
							"How much of a priority is implementation of [curriculum] for your school?",
							"How aligned is your HQIM To what extent are teachers held accountable to implementing [curriculum] through performance evaluations? with your school’s instructional vision?",
							"To what extent is implementation of [curriculum] integrated with other school systems and initiatives (e.g. assessments and RTI)?",
							"How often does school leadership review data on implementation of [curriculum] to support continuous improvement?"
						]
					}
				]
			}
		},


    // STUDENT SOCIAL-EMOTIONAL OUTCOMES
    'student-social-outcomes': {
      radar: { /* TODO */ },
      overall: { /* TODO */ },
      milestone: { /* TODO */ },
      scatter: { /* TODO */ }
    },

    // STUDENT ACADEMIC OUTCOMES
    'student-academic-outcomes': {
      radar: { /* TODO */ },
      overall: { /* TODO */ },
      milestone: { /* TODO */ },
      scatter: { /* TODO */ }
    }
  };

  // Simple getters the chart modules can call
  window.getDataConfigForConstruct = function getDataConfigForConstruct(id) {
    return DATA_CONFIGS[id] || DATA_CONFIGS['school-system'];
  };

  window.getRadarDataForConstruct = function (id) {
    return (DATA_CONFIGS[id] || DATA_CONFIGS['school-system']).radar;
  };

  window.getOverallDataForConstruct = function (id) {
    return (DATA_CONFIGS[id] || DATA_CONFIGS['school-system']).overall;
  };

  window.getMilestoneDataForConstruct = function (id) {
    return (DATA_CONFIGS[id] || DATA_CONFIGS['school-system']).milestone;
  };

  window.getScatterDataForConstruct = function (id) {
    return (DATA_CONFIGS[id] || DATA_CONFIGS['school-system']).scatter;
  };
})();


// --- jn.112025: safety shims for org helpers used by the chart files ---
if (!window.resolveCurrentOrgId) {
  window.resolveCurrentOrgId = async function resolveCurrentOrgId() {
    // Prefer whatever the main index script already set
    if (window.__CURRENT_ORG) return window.__CURRENT_ORG;
    return 'org1'; // fallback
  };
}

if (!window.getAllOrgIds) {
  window.getAllOrgIds = async function getAllOrgIds() {
    // If the main script stored a list, use that; otherwise fallback to single org
    if (Array.isArray(window.__ALL_ORGS) && window.__ALL_ORGS.length) {
      return window.__ALL_ORGS;
    }
    const org = window.__CURRENT_ORG || 'org1';
    return [org];
  };
}



// ✅ Load a CSV and return an array of row objects
//    Depends on PapaParse (papaparse.min.js) being loaded first.
/*
async function loadCSV(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load CSV at ${path}: HTTP ${response.status}`);
  }

  const text = await response.text();
  return Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  }).data;
}
*/

// ✅ Load a CSV and return an array of row objects
//    Depends on PapaParse (papaparse.min.js) being loaded first.
async function loadCSV(path) {
  const response = await fetch(path, {
    headers: {
      // This tells our Python server: "it's okay, this is the visualizer."
      "X-Visualizer-Fetch": "1"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load CSV at ${path}: HTTP ${response.status}`);
  }

  const text = await response.text();
  return Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  }).data;
}



// ✅ Convert DD/MM/YYYY → "Month YYYY" using local time
function formatMonth(dateStr) {
  if (!dateStr) return '';

  const [day, month, year] = dateStr.split('/').map(x => parseInt(x, 10));
  // Local date, no UTC shift
  const date = new Date(year, month - 1, day);

  return date.toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  });
}

// ✅ Simple numeric average
function average(arr) {
  return arr.length
    ? arr.reduce((a, b) => a + b, 0) / arr.length
    : 0;
}

// ✅ Group rows by month and compute monthly averages
//    allowedQuestions: array of column names to include (or null for “all except date”)
function groupAndAverage(data, allowedQuestions = null) {
  const grouped = {};

  data.forEach(row => {
    const month = formatMonth(row.date);

    const values = Object.entries(row)
      .filter(([key]) =>
        key !== 'date' &&
        (!allowedQuestions || allowedQuestions.includes(key.trim()))
      )
      .map(([, val]) => parseFloat(val))
      .filter(v => !isNaN(v));

    const dailyAvg = values.length ? average(values) : null;

    if (!grouped[month]) grouped[month] = [];
    if (dailyAvg !== null) grouped[month].push(dailyAvg);
  });

  const out = {};
  Object.entries(grouped).forEach(([m, vals]) => {
    out[m] = average(vals);
  });

  return out;
}
