// js/school-system.constructs.js
// jn.112025 — construct-level config (title + subconstruct blurbs)

(function () {
  const CONFIGS = {
    // 1) SCHOOL AND SYSTEM CONDITION
    'school-system': {
      headerTitle: 'SCHOOL AND SYSTEM CONDITION',
      headerSubtitle: 'HQIM implementation is supported by and integrated with existing infrastructure',
      groupA: {
        badgeText: 'A',
        badgeColor: '#A98FD4',
        title: 'HQIM Coherence:',
        description:
          'HQIM is coherent with other systems and instructional vision for student success and equity (assessments, teacher evaluation, RTI, supplemental materials)'
      },
      groupB: {
        badgeText: 'B',
        badgeColor: '#4C9AFF',
        title: 'Foundational Structures:',
        description:
          'Foundational structures for equitable HQIM adoption and implementation are in place (time for PL, access to HQIM materials, messaging, ongoing monitoring, etc.)'
      }
    },

    // 2) PROFESSIONAL LEARNING
    'professional-learning': {
      headerTitle: 'PROFESSIONAL LEARNING',
      headerSubtitle: 'PL engages teachers in opportunities to build core skills for implementing HQIM',
      groupA: {
        badgeText: 'A',
        badgeColor: '#A98FD4',
        title: 'PL Relevance:',
        description:
          'Teachers perceive PL to be relevant to their individual needs'
      },
      groupB: {
        badgeText: 'B',
        badgeColor: '#4C9AFF',
        title: 'PL Utility:',
        description:
          'Teachers perceive PL to be helpful for improving their ability to adapt HQIM for student needs and identities'
      }
    },

    // 3) INSTRUCTIONAL PRACTICE
    'instructional-practice': {
      headerTitle: 'INSTRUCTIONAL PRACTICE',
      headerSubtitle:
        'Teachers implement HQIM with integrity while adapting to their students’ needs and identities',
      groupA: {
        badgeText: 'A',
        badgeColor: '#A98FD4',
        title: 'HQIM Integrity:',
        description:
          'Teachers maintain integrity to core components of HQIM'
      },
      groupB: {
        badgeText: 'B',
        badgeColor: '#4C9AFF',
        title: 'HQIM Flexibility:',
        description:
          'Implementation of HQIM is adapted for student learning needs'
      },
      groupC: {
        badgeText: 'C',
        badgeColor: '#FF9FA9',
        title: 'HQIM Culture:',
        description:
          'HQIM is adapted to be culturally and linguistically responsive and affirming'
      }
    },

    // 4) TEACHER BELIEF AND MINDSETS
    'teacher-belief': {
      headerTitle: 'TEACHER BELIEF AND MINDSETS',
      headerSubtitle:
        'Teachers see adapting HQIM for students’ needs and identities in ways that maintain integrity as a core part of their role',
      groupA: {
        badgeText: 'A',
        badgeColor: '#A98FD4',
        title: 'Belief in Rigor:',
        description:
          'Believe all students can engage in the rigorous grade-level tasks included in HQIM and supporting this engagement is the role of a teacher*'
      },
      groupB: {
        badgeText: 'B',
        badgeColor: '#4C9AFF',
        title: 'Belief in Affirming Instruction:',
        description:
          'Believe in the importance and value of culturally and linguistically affirming instruction*'
      }
    },

    // 5) STUDENT SOCIAL-EMOTIONAL OUTCOMES
    'student-social-outcomes': {
      headerTitle: 'STUDENT SOCIAL-EMOTIONAL OUTCOMES',
      headerSubtitle: 'Students have positive learning experiences',
      groupA: {
        badgeText: 'A',
        badgeColor: '#A98FD4',
        title: 'Classroom Belonging:',
        description:
          'Belonging as part of classroom community'
      },
      groupB: {
        badgeText: 'B',
        badgeColor: '#4C9AFF',
        title: 'Identity Affirmation:',
        description:
          'Feeling affirmed in identity'
      }
    },

    // 6) STUDENT ACADEMIC OUTCOMES
    'student-academic-outcomes': {
      headerTitle: 'STUDENT ACADEMIC OUTCOMES',
      headerSubtitle: 'Students master grade-level content',
      groupA: {
        badgeText: 'A',
        badgeColor: '#A98FD4',
        title: 'Content Engagement:',
        description:
          'Engaging deeply with content through the work of the lesson'
      },
      groupB: {
        badgeText: 'B',
        badgeColor: '#4C9AFF',
        title: 'Proficiency Outcomes:',
        description:
          'Meeting grade-level proficiency standards'
      }
    }
  };

  // Expose helper
  window.getConstructConfig = function getConstructConfig(id) {
    return CONFIGS[id] || CONFIGS['school-system'];
  };
})();
