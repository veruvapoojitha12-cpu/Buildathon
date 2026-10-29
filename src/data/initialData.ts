/**
 * Initial Academic Curriculum Data for SpecForge Workbench
 * Course: CS304 - Advanced Algorithms & Complexity
 */

import {
  CourseMetadata,
  CourseOutcome,
  UnitModule,
  MatrixCellRationale,
  ValidationDefect,
  AuditHistoryLog,
} from '../types';

export const INITIAL_METADATA: CourseMetadata = {
  courseCode: 'CS304',
  title: 'Advanced Algorithms & Complexity',
  department: 'Computer Science & Engineering',
  accreditationStandard: 'ABET CAC-201 / NBA Tier-1 Standard',
  semester: 'AUT-2025',
  classification: 'Professional Core / Theory',
  credits: {
    lecture: 3,
    tutorial: 1,
    practical: 0,
    total: 4,
  },
  prerequisites: 'CS201 (Data Structures) & CS240 (Discrete Math)',
  hours: {
    lecture: 45,
    tutorial: 15,
    practical: 0,
    totalContact: 60,
  },
  evaluation: {
    cia: 40,
    ese: 60,
  },
  prescribedLiterature: [
    {
      id: 'lit-1',
      title: 'Introduction to Algorithms (4th Edition)',
      authors: 'Cormen, Leiserson, Rivest, Stein',
      publisher: 'MIT Press',
      year: 2022,
      type: 'Textbook',
    },
    {
      id: 'lit-2',
      title: 'Algorithm Design',
      authors: 'Kleinberg & Tardos',
      publisher: 'Pearson Education',
      year: 2013,
      type: 'Reference',
    },
    {
      id: 'lit-3',
      title: 'Computers and Intractability: A Guide to the Theory of NP-Completeness',
      authors: 'Garey & Johnson',
      publisher: 'W. H. Freeman',
      year: 1979,
      type: 'Reference',
    },
  ],
};

export const INITIAL_COURSE_OUTCOMES: CourseOutcome[] = [
  {
    id: 'CO1',
    bloom: 'L4',
    bloomTitle: 'L4 - Analyze',
    verb: 'Analyze',
    description:
      'Analyze asymptotic runtime bounds of divide-and-conquer algorithms and recurrent relations using the Akra-Bazzi method and master theorem paradigms.',
  },
  {
    id: 'CO2',
    bloom: 'L5',
    bloomTitle: 'L5 - Evaluate/Design',
    verb: 'Design',
    description:
      'Design dynamic programming formulations and poly-time reductions for combinatorial optimizations, amortized bounds, and randomized verification.',
  },
  {
    id: 'CO3',
    bloom: 'L3',
    bloomTitle: 'L3 - Apply',
    verb: 'Implement',
    description:
      'Implement network flow max-flow min-cut formulations for bipartite matching, circulation with demands, and push-relabel computational constraints.',
  },
  {
    id: 'CO4',
    bloom: 'L4',
    bloomTitle: 'L4 - Analyze',
    verb: 'Formulate',
    description:
      'Formulate linear programming relaxations and dual certificate bounds for vertex cover, set cover, and metric traveling salesperson approximations.',
  },
  {
    id: 'CO5',
    bloom: 'L5',
    bloomTitle: 'L5 - Evaluate',
    verb: 'Evaluate',
    description:
      'Evaluate complexity class memberships (P, NP, NP-Hard, PSPACE) via formal polynomial-time reductions from 3-SAT, Hamiltonian Cycle, and Subset Sum.',
  },
  {
    id: 'CO6',
    bloom: 'L6',
    bloomTitle: 'L6 - Create',
    verb: 'Synthesize',
    description:
      'Synthesize randomized algorithms and derandomization techniques (Chernoff bounds, Markov inequality, min-cut Karger contraction) for intractable domains.',
  },
];

export const INITIAL_UNITS: UnitModule[] = [
  {
    unit: 1,
    title: 'Unit I: Divide & Conquer Strategies & Recurrences',
    hours: 9,
    topics:
      'Recurrence relations, Akra-Bazzi theorem, Strassen matrix multiplication, Fast Fourier Transform (FFT) polynomial products, randomized quickselect median analysis.',
  },
  {
    unit: 2,
    title: 'Unit II: Dynamic Programming & Greedy Models',
    hours: 11,
    topics:
      'Matrix chain multiplication, optimal binary search trees, all-pairs shortest paths, amortized potential bounds, disjoint set forests, Fibonacci heaps.',
  },
  {
    unit: 3,
    title: 'Unit III: Network Flow & Matching',
    hours: 10,
    topics:
      'Max-Flow Min-Cut Theorem, Ford-Fulkerson, Edmonds-Karp, push-relabel algorithm, maximum bipartite matching formulations, circulation with lower bounds.',
  },
  {
    unit: 4,
    title: 'Unit IV: Linear Programming & Approximation Algorithms',
    hours: 8,
    topics:
      'Linear programming formulations, duality theorem, simplex geometry, rounding schemes for Vertex Cover and Set Cover, metric TSP 1.5-approximation (Christofides).',
  },
  {
    unit: 5,
    title: 'Unit V: Intractability & NP-Completeness',
    hours: 7,
    topics:
      'Turing reducibility, Cook-Levin theorem, 3-SAT to Clique, Vertex Cover to Hamiltonian Cycle reductions, randomized verification, zero-knowledge intuition.',
  },
];

// Mapping matrix CO1-CO6 to PO1-PO12 and PSO1-PSO3
export const PO_LABELS = [
  { id: 'PO1', title: 'Engineering Knowledge' },
  { id: 'PO2', title: 'Problem Analysis' },
  { id: 'PO3', title: 'Design / Development' },
  { id: 'PO4', title: 'Investigations' },
  { id: 'PO5', title: 'Modern Tool Usage' },
  { id: 'PO6', title: 'Engineer & Society' },
  { id: 'PO7', title: 'Environment & Sustainability' },
  { id: 'PO8', title: 'Ethics' },
  { id: 'PO9', title: 'Individual & Team Work' },
  { id: 'PO10', title: 'Communication' },
  { id: 'PO11', title: 'Project Management' },
  { id: 'PO12', title: 'Life-long Learning' },
];

export const PSO_LABELS = [
  { id: 'PSO1', title: 'Core Algorithms & Systems' },
  { id: 'PSO2', title: 'Software Engineering & Scalability' },
  { id: 'PSO3', title: 'AI & Computational Intelligence' },
];

export const INITIAL_RATIONALES: MatrixCellRationale[] = [
  // CO1
  { coId: 'CO1', targetId: 'PO1', strength: 3, rationale: 'Asymptotic mathematical proofs require deep foundation in computational mathematics.' },
  { coId: 'CO1', targetId: 'PO2', strength: 3, rationale: 'Complexity bounds provide direct formal analysis of computational bottlenecks.' },
  { coId: 'CO1', targetId: 'PO3', strength: 2, rationale: 'Provides algorithmic design paradigm for recursive subproblem formulation.' },
  { coId: 'CO1', targetId: 'PO5', strength: 1, rationale: 'Utilizes profiling harness to observe amortized runs.' },
  { coId: 'CO1', targetId: 'PO12', strength: 2, rationale: 'Establishes continuous analytical foundation for advanced computing literature.' },
  { coId: 'CO1', targetId: 'PSO1', strength: 3, rationale: 'Core foundation of computational asymptotic efficiency.' },
  { coId: 'CO1', targetId: 'PSO2', strength: 2, rationale: 'Informs production system scaling and Big-O budget planning.' },

  // CO2
  { coId: 'CO2', targetId: 'PO1', strength: 3, rationale: 'Optimal substructure and overlapping subproblems require solid discrete proofs.' },
  { coId: 'CO2', targetId: 'PO2', strength: 3, rationale: 'Identifies mathematical state-space recurrence relations.' },
  { coId: 'CO2', targetId: 'PO3', strength: 3, rationale: 'Directly engineers optimal algorithms for complex computational challenges.' },
  { coId: 'CO2', targetId: 'PO4', strength: 2, rationale: 'Investigates tradeoff between memoization space and iterative cache locality.' },
  { coId: 'CO2', targetId: 'PSO1', strength: 3, rationale: 'Pivotal skill for technical coding interviews and competitive systems design.' },
  { coId: 'CO2', targetId: 'PSO3', strength: 2, rationale: 'Dynamic programming underpins reinforcement learning value iteration.' },

  // CO3
  { coId: 'CO3', targetId: 'PO1', strength: 2, rationale: 'Applies graph theory cut principles and conservation constraints.' },
  { coId: 'CO3', targetId: 'PO2', strength: 3, rationale: 'Transforms real-world resource matching problems into residual network models.' },
  { coId: 'CO3', targetId: 'PO3', strength: 3, rationale: 'Builds scalable bipartite matching and circulation algorithms.' },
  { coId: 'CO3', targetId: 'PO4', strength: 3, rationale: 'Analyzes augmenting path invariants and push-relabel distance labels.' },
  { coId: 'CO3', targetId: 'PO5', strength: 2, rationale: 'Uses graph visualizers and network flow testbeds.' },
  { coId: 'CO3', targetId: 'PSO1', strength: 3, rationale: 'Essential algorithmic technique for distributed routing and network operations.' },
  { coId: 'CO3', targetId: 'PSO2', strength: 2, rationale: 'Applies to backend request dispatching and microservice load distribution.' },

  // CO4
  { coId: 'CO4', targetId: 'PO1', strength: 3, rationale: 'Requires matrix algebra, polyhedral geometry, and dual certificate theory.' },
  { coId: 'CO4', targetId: 'PO2', strength: 3, rationale: 'Formulates constraint optimization and gap analysis.' },
  { coId: 'CO4', targetId: 'PO3', strength: 2, rationale: 'Designs bounded approximation algorithms for intractable instances.' },
  { coId: 'CO4', targetId: 'PO5', strength: 2, rationale: 'Leverages modern LP solvers (GLPK, Gurobi) for dual verification.' },
  { coId: 'CO4', targetId: 'PSO1', strength: 3, rationale: 'Underpins advanced computational combinatorial optimization.' },
  { coId: 'CO4', targetId: 'PSO3', strength: 3, rationale: 'Convex optimization is the mathematical engine of neural network training.' },

  // CO5
  { coId: 'CO5', targetId: 'PO1', strength: 3, rationale: 'Requires mastery of formal language theory and non-deterministic machines.' },
  { coId: 'CO5', targetId: 'PO2', strength: 3, rationale: 'Establishes formal reduction proofs demonstrating NP-completeness.' },
  { coId: 'CO5', targetId: 'PO4', strength: 3, rationale: 'Evaluates intractability boundaries and algorithm feasibility limits.' },
  { coId: 'CO5', targetId: 'PO12', strength: 3, rationale: 'Critical thinking habit for recognizing computationally unsolvable problems.' },
  { coId: 'CO5', targetId: 'PSO1', strength: 3, rationale: 'Distinguishes between polynomial solutions and heuristic approximations.' },

  // CO6
  { coId: 'CO6', targetId: 'PO1', strength: 3, rationale: 'Requires probability theory, indicator random variables, and tail bounds.' },
  { coId: 'CO6', targetId: 'PO2', strength: 3, rationale: 'Analyzes expected runtime vs worst-case probability distributions.' },
  { coId: 'CO6', targetId: 'PO3', strength: 3, rationale: 'Synthesizes randomized data structures (Skip Lists, Bloom Filters).' },
  { coId: 'CO6', targetId: 'PO5', strength: 2, rationale: 'Employs Monte Carlo simulations to empirically verify convergence.' },
  { coId: 'CO6', targetId: 'PSO1', strength: 3, rationale: 'Core foundation for big data streaming and probabilistic hashing.' },
  { coId: 'CO6', targetId: 'PSO3', strength: 3, rationale: 'Probabilistic modeling aligns directly with modern generative AI architectures.' },
];

export const INITIAL_DEFECTS: ValidationDefect[] = [
  // High Severity Defects (Errors)
  {
    id: 'V1',
    code: 'CREDIT_HOURS_MISMATCH',
    ruleName: 'Credit Vector (L+T+P) vs Total Hours Consistency',
    section: 'Credit & Workload Vector',
    source: 'Syllabus Source (Section 1.2: Course Credits)',
    severity: 'High',
    passed: false,
    whatIsWrong: 'The 3-0-2 credit specification calculates to 4 academic units while contact lecture hours are listed as only 45h instead of the required 48h.',
    fixApplied: 'Harmonized contact hours to 48 hours to meet the institutional 16-week delivery formula.',
    remediation: 'Adjust lecture hours from 45h to 48h (3 hrs/week * 16 weeks) or amend credit matrix to 3:0:2.',
    affectedField: 'credits.lecture & hours.lecture',
  },
  {
    id: 'V2',
    code: 'CO_MISSING_IN_TABLE',
    ruleName: 'Course Outcome Missing in Primary Definition Table',
    section: 'Course Learning Outcomes (CLOs)',
    source: 'Syllabus Source (Section 2.3 & Table 1)',
    severity: 'High',
    passed: false,
    whatIsWrong: 'Course outcome statement CO4 is referenced in Unit IV but missing from the primary outcomes definition table.',
    fixApplied: 'Appended CO4 statement with Bloom level L4 (Analyze) and integrated into the curriculum definition table.',
    remediation: 'Attach complete outcome statement and ensure presence across both syllabus text and curriculum rubric.',
    affectedField: 'courseOutcomes[3]',
  },
  {
    id: 'V5',
    code: 'UNMAPPED_PO_CORRELATION',
    ruleName: 'Unmapped / Isolated Program Outcome (Zero Correlation)',
    section: 'CO-PO-PSO Alignment Matrix',
    source: 'Accreditation Mapping Grid (Table 3.1: PO8 Row)',
    severity: 'High',
    passed: false,
    whatIsWrong: 'Program Outcome PO8 (Professional Ethics) has zero correlation mapped across all declared course learning outcomes.',
    fixApplied: 'Introduced algorithmic bias and data ethics case study in Unit V to map CO5 to PO8 with substantial correlation.',
    remediation: 'Add algorithmic ethics / algorithmic bias case study in Unit V to map CO5 to PO8.',
    affectedField: 'coPoMatrix[PO8]',
  },

  // Medium Severity Defects (Warnings)
  {
    id: 'V4',
    code: 'BLOOM_VERB_AMBIGUOUS',
    ruleName: 'Course Outcome Measurable Verb Strictness',
    section: 'Course Learning Outcomes (CLOs)',
    source: 'Syllabus Source (Section 2.3: CO3 Specification)',
    severity: 'Medium',
    passed: false,
    whatIsWrong: 'CO3 uses the non-measurable operational verb "Understand" which fails ABET measurable outcome criterion 3.',
    fixApplied: 'Replaced passive verb with measurable cognitive verb "Formulate" aligned with Bloom level L4.',
    remediation: 'Replace "Understand" with "Formulate" or "Compute" for non-lab theory tracks, or activate integrated lab template.',
    affectedField: 'courseOutcomes[2].verb',
  },
  {
    id: 'V7',
    code: 'LITERATURE_OUTDATED_RECENCY',
    ruleName: 'Prescribed Literature Recency (5-Year Window)',
    section: 'Prescribed Literature',
    source: 'Curriculum Resources (Section 5: Recommended References)',
    severity: 'Medium',
    passed: false,
    whatIsWrong: 'Primary reference textbook Garey & Johnson (1979) exceeds the mandatory 10-year recency window for core references.',
    fixApplied: 'Added 2024 contemporary algorithmic systems monograph (Vempala & Blum, Cambridge University Press).',
    remediation: 'Add at least one post-2020 monograph or modern algorithmic systems research survey.',
    affectedField: 'prescribedLiterature[2]',
  },

  // Low Severity Defects (Advisory / AST Reconciled)
  {
    id: 'V10',
    code: 'LEGACY_AST_PRUNED',
    ruleName: 'Schema AST Compliance & Required Field Coverage',
    section: 'Schema AST & Structure',
    source: 'Ingestion Parser (AST Node: suggestedPedagogyNotes)',
    severity: 'Low',
    passed: false,
    whatIsWrong: 'Document AST contains deprecated proprietary metadata attribute from legacy 2018 syllabus template.',
    fixApplied: 'Safely pruned legacy non-standard attributes during Zod schema reconciliation.',
    remediation: 'Safely pruned during Zod schema reconciliation without loss of normative syllabus content.',
    affectedField: 'schemaAST',
  },

  // Passed Checks (Collapsed at the bottom)
  {
    id: 'V6',
    code: 'PREREQ_NO_CYCLE_CHECK',
    ruleName: 'Prerequisite Dependency Cycle & Fulfillment Check',
    section: 'Prerequisites & Catalog',
    source: 'Department Catalog (Course Dependency Graph)',
    severity: 'Low',
    passed: true,
    whatIsWrong: 'No defect detected; prerequisite requirements CS201 and CS240 are active and verified in the catalog.',
    fixApplied: 'Dependency graph validated with zero circular references.',
    remediation: 'Prerequisites valid.',
    affectedField: 'prerequisites',
  },
  {
    id: 'V3',
    code: 'BLOOM_COGNITIVE_BALANCE',
    ruleName: "Bloom's Taxonomy Higher-Order Cognitive Balance",
    section: 'Course Learning Outcomes (CLOs)',
    source: 'Cognitive Distribution Analyzer (Bloom L1-L6)',
    severity: 'Medium',
    passed: true,
    whatIsWrong: 'No defect detected; higher-order thinking skills (L4–L6) constitute 67% of total course objectives.',
    fixApplied: 'Cognitive rigor validated exceeding the 50% ABET threshold.',
    remediation: 'Compliant. Maintain distribution across formative assessments.',
    affectedField: 'courseOutcomes.bloom',
  },
  {
    id: 'V8',
    code: 'ASSESSMENT_SUM_100',
    ruleName: 'Assessment Weightage Distribution (CIA + ESE = 100%)',
    section: 'Assessment Breakdown',
    source: 'Evaluation Scheme (CIA & ESE Split Table)',
    severity: 'High',
    passed: true,
    whatIsWrong: 'No defect detected; Continuous Internal Assessment (40%) and End-Semester Exam (60%) strictly sum to 100%.',
    fixApplied: 'Evaluation percentages verified against university examination bylaws.',
    remediation: 'Compliant with university examination bylaws.',
    affectedField: 'evaluation',
  },
  {
    id: 'V9',
    code: 'TOPIC_COVERAGE_DENSITY',
    ruleName: 'Module Topic Coverage Density Threshold',
    section: 'Module Syllabus Pacing',
    source: 'Curriculum Module Specification (Units I–V)',
    severity: 'Low',
    passed: true,
    whatIsWrong: 'No defect detected; module lecture hours range between 7h and 11h per unit, within standard variance.',
    fixApplied: 'Unit pacing verified across all 5 curricular blocks.',
    remediation: 'Balanced pacing.',
    affectedField: 'units',
  },
  {
    id: 'V11',
    code: 'PSO_ATTAINMENT_THRESHOLD',
    ruleName: 'Program Specific Outcomes Correlation Attainment',
    section: 'CO-PO-PSO Alignment Matrix',
    source: 'Program Specific Outcomes (PSO1–PSO3 Vector)',
    severity: 'Medium',
    passed: true,
    whatIsWrong: 'No defect detected; all three Program Specific Outcomes achieve average correlation exceeding 2.0.',
    fixApplied: 'Target attainment thresholds validated for computing accreditation.',
    remediation: 'PSO alignment robust.',
    affectedField: 'coPoMatrix.PSO',
  },
  {
    id: 'V12',
    code: 'LABORATORY_HOURS_COMPLIANT',
    ruleName: 'Integrated Laboratory Workload Compliance',
    section: 'Credit & Workload Vector',
    source: 'Integrated Syllabus Schedule (Practical Track)',
    severity: 'Low',
    passed: true,
    whatIsWrong: 'No defect detected; student contact hours comply with laboratory safety and seat ratio limits.',
    fixApplied: 'Practical contact scheduling confirmed with department timetable.',
    remediation: 'Workload within ceiling.',
    affectedField: 'hours.practical',
  },
];

export const INITIAL_AUDIT_LOG: AuditHistoryLog[] = [
  {
    id: 'log-1',
    stage: 'draft',
    timestamp: '2025-08-12 10:30',
    actor: 'Dr. Sarah Lin (Course Author)',
    role: 'author',
    action: 'Initial Specification Draft Created',
    note: 'Imported syllabus source docx and extracted AST course outcomes and units.',
  },
  {
    id: 'log-2',
    stage: 'submitted',
    timestamp: '2025-08-14 14:15',
    actor: 'Dr. Sarah Lin (Course Author)',
    role: 'author',
    action: 'Submitted for Departmental Review',
    note: 'Completed Bloom level mapping and initial CO-PO alignment matrix.',
  },
  {
    id: 'log-3',
    stage: 'under_review',
    timestamp: '2025-08-18 11:00',
    actor: 'Prof. David Marcus (Curriculum Reviewer)',
    role: 'reviewer',
    action: 'Audit Review Completed with Notes',
    note: 'Verified CO-PO matrix. Recommended clarifying tutorial contact hours and adding modern approximation references.',
  },
  {
    id: 'log-4',
    stage: 'pending_hod',
    timestamp: '2025-08-20 09:45',
    actor: 'Prof. David Marcus (Curriculum Reviewer)',
    role: 'reviewer',
    action: 'Forwarded to HOD for BOS Endorsement',
    note: 'Pre-audit defects reduced to 3 non-blocking items. Ready for Board of Studies consideration.',
  },
];
