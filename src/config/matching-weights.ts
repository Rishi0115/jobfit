/**
 * Matching Algorithm Weights & Thresholds Configuration
 *
 * Centralized, configurable weights for deterministic job matching.
 * Sum of base weights equals 1.0 (100%).
 */

export interface MatchingWeights {
  skills: number;
  experience: number;
  role: number;
  education: number;
  location: number;
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  skills: 0.60,      // 60% — Primary signal
  experience: 0.15,  // 15% — Years / Seniority
  role: 0.15,        // 15% — Title / Functional alignment
  education: 0.05,   // 5%  — Domain qualification
  location: 0.05,    // 5%  — Work mode / Location compatibility
} as const;

/**
 * Within skill scoring: relative weighting when both required and preferred skills are specified.
 */
export const SKILL_SUB_WEIGHTS = {
  required: 0.80,    // 80% of skill score
  preferred: 0.20,   // 20% of skill score
} as const;

/**
 * Match Quality Tier Definitions
 */
export type MatchQuality = "EXCELLENT" | "STRONG" | "GOOD" | "PARTIAL" | "LOW";

export interface MatchQualityThreshold {
  quality: MatchQuality;
  minScore: number;
  maxScore: number;
  label: string;
  color: string;
  variant: "success" | "info" | "default" | "warning" | "destructive" | "secondary";
}

export const MATCH_QUALITY_THRESHOLDS: MatchQualityThreshold[] = [
  {
    quality: "EXCELLENT",
    minScore: 90,
    maxScore: 100,
    label: "Excellent Match",
    color: "emerald",
    variant: "success",
  },
  {
    quality: "STRONG",
    minScore: 75,
    maxScore: 89,
    label: "Strong Match",
    color: "blue",
    variant: "info",
  },
  {
    quality: "GOOD",
    minScore: 60,
    maxScore: 74,
    label: "Good Match",
    color: "indigo",
    variant: "default",
  },
  {
    quality: "PARTIAL",
    minScore: 40,
    maxScore: 59,
    label: "Partial Match",
    color: "amber",
    variant: "warning",
  },
  {
    quality: "LOW",
    minScore: 0,
    maxScore: 39,
    label: "Low Match",
    color: "rose",
    variant: "destructive",
  },
];

export function getMatchQuality(score: number): MatchQualityThreshold {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const found = MATCH_QUALITY_THRESHOLDS.find(
    (t) => clamped >= t.minScore && clamped <= t.maxScore
  );
  return found || MATCH_QUALITY_THRESHOLDS[MATCH_QUALITY_THRESHOLDS.length - 1];
}
