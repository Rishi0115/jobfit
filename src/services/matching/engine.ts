/**
 * Job Matching Engine — Foundation
 * Deterministic scoring engine (skills, experience, education, other factors).
 * AI-based semantic enhancement is optional and additive only.
 * 
 * To be implemented in Phase 5 — Matching.
 */

export const MATCHING_WEIGHTS = {
  skills: 0.70,
  experience: 0.15,
  education: 0.05,
  other: 0.10,
} as const;

export interface MatchResult {
  score: number;
  breakdown: {
    skills: number;
    experience: number;
    education: number;
    other: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
}

// Placeholder — will be implemented in Phase 5
export function calculateMatchScore(): MatchResult {
  throw new Error("Matching engine not yet implemented. See Phase 5.");
}
