/**
 * SpecForge Academic Workbench - Core Type Definitions
 */

export type UserRole = 'author' | 'reviewer' | 'hod' | 'dean';

export type BloomLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';

export interface CourseOutcome {
  id: string; // e.g. "CO1"
  bloom: BloomLevel;
  bloomTitle: string; // e.g. "L4 - Analyze"
  verb: string; // e.g. "Analyze"
  description: string;
}

export interface UnitModule {
  unit: number; // e.g. 1
  title: string; // e.g. "Unit I: Divide & Conquer Strategies"
  hours: number; // e.g. 9
  topics: string;
}

export type MatrixStrength = 0 | 1 | 2 | 3;

export interface MatrixCellRationale {
  coId: string;
  targetId: string; // e.g. "PO1", "PSO1"
  strength: MatrixStrength;
  rationale: string;
}

export interface CourseMetadata {
  courseCode: string; // e.g. "CS304"
  title: string; // e.g. "Advanced Algorithms & Complexity"
  department: string; // e.g. "Computer Science & Engineering"
  accreditationStandard: string; // e.g. "ABET CAC-201 / NBA Tier-1"
  semester: string; // e.g. "AUT-2025"
  classification: string; // e.g. "Professional Core / Theory"
  credits: {
    lecture: number; // L
    tutorial: number; // T
    practical: number; // P
    total: number;
  };
  prerequisites: string; // e.g. "CS201 & CS240"
  hours: {
    lecture: number; // e.g. 45
    tutorial: number; // e.g. 15
    practical: number; // e.g. 0
    totalContact: number;
  };
  evaluation: {
    cia: number; // internal 40%
    ese: number; // end sem 60%
  };
  prescribedLiterature: Array<{
    id: string;
    title: string;
    authors: string;
    publisher: string;
    year: number;
    type: 'Textbook' | 'Reference';
  }>;
}

export type DefectSeverity = 'High' | 'Medium' | 'Low';

export interface ValidationDefect {
  id: string; // e.g. "V1"
  code: string; // e.g. "CO_MISSING_IN_TABLE"
  ruleName: string;
  section: string; // e.g. "Course Learning Outcomes (CLOs)"
  sectionNumber?: number | null; // e.g. 1-12
  source: string; // e.g. "spec", "blueprint", "template"
  refs?: string[]; // e.g. ['CO-5', 'PSO-3']
  severity: DefectSeverity;
  passed: boolean;
  whatIsWrong: string; // Exactly what is wrong in one sentence
  fixApplied: string; // The fix that was applied
  valueChosen?: string; // Reconciled value chosen
  reason?: string; // Rationale for the rule and fix
  affectedField?: string;
  category?: string;
  message?: string;
  remediation?: string;
}

export type LifecycleStage = 'draft' | 'submitted' | 'under_review' | 'pending_hod' | 'approved' | 'returned' | 'approved_sealed';

export interface AuditHistoryLog {
  id: string;
  stage: LifecycleStage;
  timestamp: string;
  actor: string;
  role: UserRole;
  action: string;
  note: string;
}

export interface SectionComment {
  id: string;
  sectionNumber: number;
  sectionTitle: string;
  authorName: string;
  authorRole: UserRole;
  timestamp: string;
  comment: string;
  resolved: boolean;
  replies?: Array<{
    id: string;
    authorName: string;
    authorRole: UserRole;
    timestamp: string;
    comment: string;
  }>;
}

export interface SpecRegistryItem {
  id: string;
  code: string;
  title: string;
  department: string;
  author: string;
  credits: string;
  unitsCount: number;
  outcomesCount: number;
  status: LifecycleStage;
  lastUpdated: string;
  notes?: string;
}

export interface LLMSettings {
  provider: 'anthropic' | 'openai' | 'gemini';
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export type ActiveScreen = 'builder' | 'intake' | 'templates' | 'matrix' | 'audit' | 'governance' | 'export';

