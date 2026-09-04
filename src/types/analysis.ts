/**
 * Analysis Types — Phase 7: Resume vs Job Analysis & Skill Gap Analysis
 *
 * 100% Prisma-independent interfaces.
 * Uses explicit evaluation status rather than null ambiguity.
 */

import type { MatchQuality, MatchResult } from "@/types/matching";

export type EvaluationStatus = "EVALUATED" | "UNAVAILABLE" | "NOT_APPLICABLE";

export type SkillGapSeverity = "CRITICAL" | "IMPORTANT" | "LOW" | "NONE";
export type SkillGapStatus = "COVERED" | "NEEDS_IMPROVEMENT" | "MISSING";
export type SkillRequirementType = "REQUIRED" | "PREFERRED";
export type SkillSource =
  | "USER_SKILL"
  | "RESUME_EXTRACTED"
  | "RESUME_TEXT"
  | "NONE";

/**
 * Granular skill gap item representing a single job skill.
 */
export interface SkillGapItem {
  skillName: string;
  canonicalName: string;
  type: SkillRequirementType; // Strictly REQUIRED or PREFERRED
  status: SkillGapStatus;
  severity: SkillGapSeverity;
  source: SkillSource;
  proficiency?: string | null;
  recommendation?: string | null;
}

/**
 * Signal assessment with explicit EvaluationStatus.
 */
export interface AssessmentSignal<T = Record<string, unknown>> {
  status: EvaluationStatus; // EVALUATED | UNAVAILABLE | NOT_APPLICABLE
  score: number;
  reason: string;
  details: T;
}

export type RecommendationPriority = "HIGH" | "MEDIUM" | "LOW";
export type RecommendationCategory =
  | "REQUIRED_SKILL"
  | "PREFERRED_SKILL"
  | "EXPERIENCE"
  | "EDUCATION"
  | "PROFILE";

export interface ActionableRecommendation {
  priority: RecommendationPriority;
  category: RecommendationCategory;
  target: string; // The concrete missing skill or signal
  advice: string;
}

/**
 * Complete strongly-typed contract for Resume vs Job Analysis.
 */
export interface ResumeJobAnalysisResult {
  // Phase 6 Single Source of Truth
  overallScore: number;
  scoreLabel: string;
  matchQuality: MatchQuality;
  phase6MatchResult: MatchResult;

  // Analyzed Context
  analyzedResumeId: string | null;
  analyzedResumeFileName: string | null;
  isResumeActive: boolean;
  analyzedJobId: string;
  analyzedJobTitle: string;

  // Strict Required vs Preferred Separation
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  missingPreferredSkills: string[];

  // Granular Skill Gap Itemization
  criticalGaps: SkillGapItem[]; // Missing REQUIRED skills
  importantGaps: SkillGapItem[]; // Missing PREFERRED skills
  coveredSkills: SkillGapItem[]; // Candidate HAS skill

  // Signal Assessments with explicit EvaluationStatus
  experienceAssessment: AssessmentSignal<{
    isMet: boolean;
    isOverqualified: boolean;
    candidateYears?: number | null;
    requiredYearsRange?: string | null;
    candidateLevel?: string | null;
    jobLevel?: string | null;
  }>;
  roleAssessment: AssessmentSignal<{
    matchType: string;
    roleFamily?: string | null;
  }>;
  educationAssessment: AssessmentSignal<{
    isDomainMatch: boolean;
    isRequirementSatisfied: boolean;
    candidateDegree?: string | null;
  }>;
  locationAssessment: AssessmentSignal<{
    isWorkModeCompatible: boolean;
    isLocationCompatible: boolean;
  }>;

  // Insights & Deterministic Recommendations
  strengths: string[];
  recommendations: ActionableRecommendation[];
  explanation: string;
}
