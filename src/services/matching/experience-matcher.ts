/**
 * Pure Experience Matching Engine
 *
 * Evaluates candidate seniority / years of experience against job requirements.
 * Handles missing experience data without inventing points.
 */

import type { ExperienceMatchDetails } from "@/types/matching";

export const EXPERIENCE_LEVEL_RANKS: Record<string, number> = {
  FRESHER: 0,
  JUNIOR: 1,
  MID: 2,
  SENIOR: 3,
  LEAD: 4,
};

export const EXPERIENCE_LEVEL_DISPLAY: Record<string, string> = {
  FRESHER: "Fresher (0–1 years)",
  JUNIOR: "Junior (1–3 years)",
  MID: "Mid-level (3–5 years)",
  SENIOR: "Senior (5–8 years)",
  LEAD: "Lead (8+ years)",
};

/**
 * Parse numeric years from common string patterns (e.g. "2+ years", "1-3 years", "0 years")
 */
export function parseExperienceRange(text?: string | null): {
  minYears: number;
  maxYears?: number;
} | null {
  if (!text || typeof text !== "string") return null;

  const trimmed = text.trim().toLowerCase();

  // Pattern: "1-3 years", "1 to 3 years"
  const rangeMatch = trimmed.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*(?:year|yr)/i);
  if (rangeMatch) {
    return {
      minYears: parseInt(rangeMatch[1], 10),
      maxYears: parseInt(rangeMatch[2], 10),
    };
  }

  // Pattern: "2+ years", "at least 3 years", "3+ yrs"
  const plusMatch = trimmed.match(/(\d+)\s*\+?\s*(?:year|yr)/i);
  if (plusMatch) {
    return { minYears: parseInt(plusMatch[1], 10) };
  }

  // Pattern: "fresher" or "entry"
  if (trimmed.includes("fresher") || trimmed.includes("entry")) {
    return { minYears: 0, maxYears: 1 };
  }

  return null;
}

/**
 * Match candidate experience against job experience level and requirements.
 */
export function matchExperience(
  candidateLevel?: string | null,
  candidateYears?: number | null,
  jobLevel?: string | null,
  jobMinYears?: number | null,
  jobMaxYears?: number | null
): { score: number; isAvailable: boolean; details: ExperienceMatchDetails } {
  // Check if candidate experience data is provided
  const hasLevel = Boolean(candidateLevel && EXPERIENCE_LEVEL_RANKS[candidateLevel.toUpperCase()] !== undefined);
  const hasYears = candidateYears !== undefined && candidateYears !== null && !isNaN(candidateYears);

  if (!hasLevel && !hasYears) {
    return {
      score: 0,
      isAvailable: false,
      details: {
        candidateLevel: null,
        jobLevel: jobLevel || null,
        candidateYears: null,
        requiredYearsRange: jobMinYears !== undefined && jobMinYears !== null
          ? `${jobMinYears}${jobMaxYears ? `–${jobMaxYears}` : "+"} years`
          : null,
        isMet: false,
        isOverqualified: false,
        reason: "Candidate experience data is not provided in resume or profile.",
      },
    };
  }

  const normCandidateLevel = candidateLevel?.toUpperCase();
  const normJobLevel = jobLevel?.toUpperCase();

  // If job has no explicit requirement and no minYears
  if (!normJobLevel && (jobMinYears === undefined || jobMinYears === null)) {
    return {
      score: 100,
      isAvailable: true,
      details: {
        candidateLevel: normCandidateLevel || null,
        jobLevel: null,
        candidateYears: candidateYears ?? null,
        requiredYearsRange: "Not specified",
        isMet: true,
        isOverqualified: false,
        reason: "Job does not specify an experience requirement.",
      },
    };
  }

  // Path A: Numeric years comparison if job minYears is specified
  if (jobMinYears !== undefined && jobMinYears !== null) {
    const years = hasYears ? (candidateYears as number) : (EXPERIENCE_LEVEL_RANKS[normCandidateLevel!] ?? 0) * 2;
    const isMet = years >= jobMinYears;
    const isOverqualified = jobMaxYears ? years > jobMaxYears + 2 : false;

    let score = 100;
    let reason = "";

    if (jobMinYears === 0) {
      score = 100;
      isMet === true;
      reason = "Requirement is 0 years (Fresher/Entry level) — candidate qualifies.";
    } else if (years >= jobMinYears) {
      if (isOverqualified) {
        score = 85;
        reason = `Candidate experience (${years} yrs) exceeds requirement (${jobMinYears}${jobMaxYears ? `–${jobMaxYears}` : "+"} yrs). May be overqualified.`;
      } else {
        score = 100;
        reason = `Candidate has ${years} years, meeting the ${jobMinYears}${jobMaxYears ? `–${jobMaxYears}` : "+"} years requirement.`;
      }
    } else {
      const diff = jobMinYears - years;
      if (diff === 1) {
        score = 70;
        reason = `Candidate has ${years} years, slightly below the ${jobMinYears}+ years required (potential stretch role).`;
      } else if (diff === 2) {
        score = 40;
        reason = `Candidate has ${years} years, below the ${jobMinYears}+ years required.`;
      } else {
        score = 15;
        reason = `Candidate has ${years} years, significantly below the ${jobMinYears}+ years required.`;
      }
    }

    return {
      score,
      isAvailable: true,
      details: {
        candidateLevel: normCandidateLevel || null,
        jobLevel: normJobLevel || null,
        candidateYears: years,
        requiredYearsRange: `${jobMinYears}${jobMaxYears ? `–${jobMaxYears}` : "+"} years`,
        isMet,
        isOverqualified,
        reason,
      },
    };
  }

  // Path B: Level ranks comparison (FRESHER=0, JUNIOR=1, MID=2, SENIOR=3, LEAD=4)
  const candidateRank = normCandidateLevel
    ? EXPERIENCE_LEVEL_RANKS[normCandidateLevel] ?? 0
    : Math.min(4, Math.floor((candidateYears ?? 0) / 2));

  const jobRank = normJobLevel
    ? EXPERIENCE_LEVEL_RANKS[normJobLevel] ?? 1
    : 1;

  const diff = candidateRank - jobRank;
  let score = 100;
  let isMet = false;
  let isOverqualified = false;
  let reason = "";

  if (diff === 0) {
    score = 100;
    isMet = true;
    reason = `Exact experience level match: ${EXPERIENCE_LEVEL_DISPLAY[normJobLevel || "JUNIOR"] || normJobLevel}.`;
  } else if (diff === 1) {
    score = 95;
    isMet = true;
    reason = `Candidate is qualified with slightly more experience than required level (${normJobLevel}).`;
  } else if (diff >= 2) {
    score = 80;
    isMet = true;
    isOverqualified = true;
    reason = `Candidate is significantly more experienced than required level (${normJobLevel}).`;
  } else if (diff === -1) {
    score = 65;
    isMet = false;
    reason = `Candidate is one level below required experience level (${normJobLevel}). Possible stretch role.`;
  } else if (diff === -2) {
    score = 25;
    isMet = false;
    reason = `Candidate experience is notably below required level (${normJobLevel}).`;
  } else {
    score = 10;
    isMet = false;
    reason = `Candidate experience does not meet required level (${normJobLevel}).`;
  }

  return {
    score,
    isAvailable: true,
    details: {
      candidateLevel: normCandidateLevel || null,
      jobLevel: normJobLevel || null,
      candidateYears: candidateYears ?? null,
      requiredYearsRange: EXPERIENCE_LEVEL_DISPLAY[normJobLevel || ""] || null,
      isMet,
      isOverqualified,
      reason,
    },
  };
}
