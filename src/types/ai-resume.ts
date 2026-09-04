/**
 * Types — Phase 8: AI-Powered Resume Improvement
 *
 * 100% Prisma-independent interfaces.
 */

export type ImprovementMode = "GENERAL" | "JOB_TARGETED" | "SECTION_LEVEL";

export type ResumeSectionType =
  | "ALL"
  | "SUMMARY"
  | "EXPERIENCE"
  | "PROJECTS"
  | "SKILLS"
  | "EDUCATION";

export interface ImprovedBulletItem {
  id: string;
  section: "EXPERIENCE" | "PROJECTS" | "OTHER";
  originalText: string;
  improvedText: string;
  factualBasis: string;
  alignmentReason?: string;
  warnings: string[];
  hasMetricPlaceholder: boolean;
}

export interface ClarificationRequest {
  field: string;
  question: string;
  context: string;
}

export interface AtsKeywordSuggestion {
  keyword: string;
  category: "FOUND_IN_JOB" | "RELEVANT_SKILL";
  foundInCandidateResume: boolean;
  advice: string;
}

export interface ResumeImprovementResult {
  mode: ImprovementMode;
  targetSection: ResumeSectionType;
  sourceResumeId: string;
  sourceResumeFileName: string;
  sourceResumeVersion: number;
  targetJobId?: string | null;
  targetJobTitle?: string | null;
  improvedSummary?: {
    originalText?: string;
    improvedText: string;
    explanation: string;
    warnings: string[];
  } | null;
  improvedBullets: ImprovedBulletItem[];
  skillsSuggestions: {
    verifiedSkillsToEmphasize: string[];
    missingSkillsAdvice: Array<{ skill: string; advice: string }>;
  };
  atsSuggestions: AtsKeywordSuggestion[];
  clarificationRequests: ClarificationRequest[];
  factualWarnings: string[];
  // Calculated 100% deterministically by fact-preservation-guard.ts; AI never generates this
  preservationScore: number;
}
