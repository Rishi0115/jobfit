/**
 * Matching Engine Types — Pure, Prisma-Independent Interfaces
 */

import type { MatchQuality, MatchingWeights } from "@/config/matching-weights";
import type { JobWithRelations } from "@/types/job";

export type { MatchQuality, MatchingWeights };

/**
 * Normalized candidate data input for matching.
 */
export interface CandidateMatchingInput {
  id: string;
  skills: string[];
  experienceLevel?: string | null;
  yearsOfExperience?: number | null;
  targetRole?: string | null;
  education?: {
    degree?: string | null;
    field?: string | null;
    isTech?: boolean | null;
  } | null;
  preferredWorkMode?: string | null;
  preferredLocations?: string[];
  resumeContext?: {
    id: string;
    fileName: string;
    isActive: boolean;
  } | null;
  skillSourceMap?: Map<
    string,
    {
      source: "USER_SKILL" | "RESUME_EXTRACTED" | "RESUME_TEXT" | "NONE";
      proficiency?: string | null;
    }
  >;
}

/**
 * Normalized job data input for matching.
 */
export interface JobMatchingInput {
  id: string;
  title: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel?: string | null;
  minYearsExperience?: number | null;
  maxYearsExperience?: number | null;
  educationRequirement?: string | null;
  workMode?: string | null;
  location?: string | null;
}

/**
 * Generic container for a signal's score, availability, and audit trail.
 */
export interface SignalScore<T = Record<string, unknown>> {
  score: number; // 0 to 100
  isAvailable: boolean;
  baseWeight: number; // e.g. 0.60
  normalizedWeight: number; // adjusted weight when some signals are missing
  weightedScore: number; // (score * normalizedWeight)
  details: T;
}

/**
 * Skill match specific breakdown.
 */
export interface SkillMatchDetails {
  totalRequired: number;
  matchedRequired: string[];
  missingRequired: string[];
  totalPreferred: number;
  matchedPreferred: string[];
  missingPreferred: string[];
  requiredScore: number;
  preferredScore: number;
  allMatchedSkills: string[];
  allMissingSkills: string[];
}

/**
 * Experience match specific breakdown.
 */
export interface ExperienceMatchDetails {
  candidateLevel?: string | null;
  jobLevel?: string | null;
  candidateYears?: number | null;
  requiredYearsRange?: string | null;
  isMet: boolean;
  isOverqualified: boolean;
  reason: string;
}

/**
 * Role / Title relevance specific breakdown.
 */
export interface RoleMatchDetails {
  candidateRole?: string | null;
  jobTitle: string;
  roleFamily?: string | null;
  matchType: "EXACT" | "FAMILY" | "SPECIALIZATION" | "TOKEN_OVERLAP" | "UNRELATED" | "UNAVAILABLE";
  reason: string;
}

/**
 * Education match specific breakdown.
 */
export interface EducationMatchDetails {
  candidateDegree?: string | null;
  candidateField?: string | null;
  jobRequirement?: string | null;
  isDomainMatch: boolean;
  isRequirementSatisfied: boolean;
  reason: string;
}

/**
 * Location and work mode specific breakdown.
 */
export interface LocationMatchDetails {
  candidateWorkMode?: string | null;
  jobWorkMode?: string | null;
  isWorkModeCompatible: boolean;
  candidateLocations: string[];
  jobLocation?: string | null;
  isLocationCompatible: boolean;
  reason: string;
}

/**
 * Breakdown of all signals evaluated by the matching engine.
 */
export interface MatchBreakdown {
  skills: SignalScore<SkillMatchDetails>;
  experience: SignalScore<ExperienceMatchDetails>;
  role: SignalScore<RoleMatchDetails>;
  education: SignalScore<EducationMatchDetails>;
  location: SignalScore<LocationMatchDetails>;
}

/**
 * Complete, explainable result produced by the matching engine.
 */
export interface MatchResult {
  overallScore: number; // 0 to 100 (integer)
  matchQuality: MatchQuality;
  matchLabel: string;
  signalAvailability: {
    skills: boolean;
    experience: boolean;
    role: boolean;
    education: boolean;
    location: boolean;
  };
  unavailableSignals: string[];
  breakdown: MatchBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  gaps: string[];
  explanation: string;
}

/**
 * Top Job Match wrapper for student top recommendations.
 */
export interface TopJobMatch {
  job: JobWithRelations;
  match: MatchResult;
}
