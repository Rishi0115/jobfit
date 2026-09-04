/**
 * Job Matching Engine — Pure Deterministic Implementation
 *
 * Combines 5 explainable signals:
 * 1. Skills Match (60%) — Distinguishing required vs preferred skills
 * 2. Experience Match (15%) — Evaluating seniority level and years
 * 3. Role / Title Relevance (15%) — Evaluating functional domain alignment
 * 4. Education Match (5%) — Evaluating technical qualification where relevant
 * 5. Location / Work Mode (5%) — Evaluating geographic & mode compatibility
 *
 * Fully deterministic, explainable, testable, and Prisma-independent.
 * No AI/LLM calls are made in this engine.
 */

import {
  DEFAULT_MATCHING_WEIGHTS,
  getMatchQuality,
  type MatchingWeights,
} from "@/config/matching-weights";
import type {
  CandidateMatchingInput,
  JobMatchingInput,
  MatchBreakdown,
  MatchResult,
} from "@/types/matching";
import { matchSkills } from "./skill-matcher";
import { matchExperience } from "./experience-matcher";
import { matchRole } from "./role-matcher";
import { matchEducation } from "./education-matcher";
import { matchLocation } from "./location-matcher";

export { DEFAULT_MATCHING_WEIGHTS };

/**
 * Calculate deterministic match score for a candidate and job pair.
 */
export function calculateMatchScore(
  candidate: CandidateMatchingInput,
  job: JobMatchingInput,
  customWeights?: Partial<MatchingWeights>
): MatchResult {
  const weights: MatchingWeights = {
    ...DEFAULT_MATCHING_WEIGHTS,
    ...customWeights,
  };

  // 1. Evaluate individual signals
  const skillRes = matchSkills(
    candidate.skills,
    job.requiredSkills,
    job.preferredSkills
  );

  const expRes = matchExperience(
    candidate.experienceLevel,
    candidate.yearsOfExperience,
    job.experienceLevel,
    job.minYearsExperience,
    job.maxYearsExperience
  );

  const roleRes = matchRole(candidate.targetRole, job.title);

  const eduRes = matchEducation(candidate.education, job.educationRequirement);

  const locRes = matchLocation(
    candidate.preferredWorkMode,
    candidate.preferredLocations || [],
    job.workMode,
    job.location
  );

  // 2. Track signal availability
  const availability = {
    skills: true, // Skills are always evaluated
    experience: expRes.isAvailable,
    role: roleRes.isAvailable,
    education: eduRes.isAvailable,
    location: locRes.isAvailable,
  };

  const unavailableSignals: string[] = [];
  if (!availability.experience) unavailableSignals.push("experience");
  if (!availability.role) unavailableSignals.push("role");
  if (!availability.education) unavailableSignals.push("education");
  if (!availability.location) unavailableSignals.push("location");

  // 3. Dynamic Weight Redistribution (Weight Normalization)
  // If a signal cannot be calculated, redistribute weights among available signals.
  let availableWeightSum = 0;
  if (availability.skills) availableWeightSum += weights.skills;
  if (availability.experience) availableWeightSum += weights.experience;
  if (availability.role) availableWeightSum += weights.role;
  if (availability.education) availableWeightSum += weights.education;
  if (availability.location) availableWeightSum += weights.location;

  const normalize = (baseWeight: number, isAvail: boolean) =>
    isAvail && availableWeightSum > 0 ? baseWeight / availableWeightSum : 0;

  const normalizedWeights = {
    skills: normalize(weights.skills, availability.skills),
    experience: normalize(weights.experience, availability.experience),
    role: normalize(weights.role, availability.role),
    education: normalize(weights.education, availability.education),
    location: normalize(weights.location, availability.location),
  };

  // 4. Calculate weighted scores
  const weightedScores = {
    skills: skillRes.score * normalizedWeights.skills,
    experience: expRes.score * normalizedWeights.experience,
    role: roleRes.score * normalizedWeights.role,
    education: eduRes.score * normalizedWeights.education,
    location: locRes.score * normalizedWeights.location,
  };

  const rawOverall =
    weightedScores.skills +
    weightedScores.experience +
    weightedScores.role +
    weightedScores.education +
    weightedScores.location;

  const overallScore = Math.max(0, Math.min(100, Math.round(rawOverall)));
  const qualityThreshold = getMatchQuality(overallScore);

  // 5. Construct Match Breakdown
  const breakdown: MatchBreakdown = {
    skills: {
      score: skillRes.score,
      isAvailable: availability.skills,
      baseWeight: weights.skills,
      normalizedWeight: normalizedWeights.skills,
      weightedScore: Math.round(weightedScores.skills * 10) / 10,
      details: skillRes.details,
    },
    experience: {
      score: expRes.score,
      isAvailable: availability.experience,
      baseWeight: weights.experience,
      normalizedWeight: normalizedWeights.experience,
      weightedScore: Math.round(weightedScores.experience * 10) / 10,
      details: expRes.details,
    },
    role: {
      score: roleRes.score,
      isAvailable: availability.role,
      baseWeight: weights.role,
      normalizedWeight: normalizedWeights.role,
      weightedScore: Math.round(weightedScores.role * 10) / 10,
      details: roleRes.details,
    },
    education: {
      score: eduRes.score,
      isAvailable: availability.education,
      baseWeight: weights.education,
      normalizedWeight: normalizedWeights.education,
      weightedScore: Math.round(weightedScores.education * 10) / 10,
      details: eduRes.details,
    },
    location: {
      score: locRes.score,
      isAvailable: availability.location,
      baseWeight: weights.location,
      normalizedWeight: normalizedWeights.location,
      weightedScore: Math.round(weightedScores.location * 10) / 10,
      details: locRes.details,
    },
  };

  // 6. Generate Explainable Strengths & Gaps
  const strengths: string[] = [];
  const gaps: string[] = [];

  // Skill signal insights
  if (skillRes.details.totalRequired > 0) {
    if (skillRes.details.missingRequired.length === 0) {
      strengths.push(
        `All ${skillRes.details.totalRequired} required skills matched (${skillRes.details.matchedRequired.join(", ")}).`
      );
    } else if (skillRes.details.matchedRequired.length > 0) {
      strengths.push(
        `Matched ${skillRes.details.matchedRequired.length} of ${skillRes.details.totalRequired} required skills.`
      );
      gaps.push(
        `Missing required skills: ${skillRes.details.missingRequired.slice(0, 3).join(", ")}${
          skillRes.details.missingRequired.length > 3 ? "..." : ""
        }.`
      );
    } else {
      gaps.push(
        `None of the ${skillRes.details.totalRequired} required skills matched in resume.`
      );
    }
  }

  if (skillRes.details.matchedPreferred.length > 0) {
    strengths.push(
      `Bonus: matched ${skillRes.details.matchedPreferred.length} preferred skill(s) (${skillRes.details.matchedPreferred.slice(0, 3).join(", ")}).`
    );
  }

  // Experience signal insights
  if (availability.experience) {
    if (expRes.details.isMet) {
      strengths.push(expRes.details.reason);
    } else {
      gaps.push(expRes.details.reason);
    }
  }

  // Role signal insights
  if (availability.role) {
    if (roleRes.score >= 75) {
      strengths.push(`Role alignment: ${roleRes.details.reason}`);
    } else if (roleRes.score < 50) {
      gaps.push(`Role alignment: ${roleRes.details.reason}`);
    }
  }

  // Location signal insights
  if (availability.location) {
    if (locRes.details.isWorkModeCompatible && locRes.score >= 80) {
      strengths.push(locRes.details.reason);
    } else if (!locRes.details.isWorkModeCompatible) {
      gaps.push(locRes.details.reason);
    }
  }

  // 7. Human-Readable Explanation
  let explanation = `Match score is ${overallScore}% (${qualityThreshold.label}). `;
  if (skillRes.details.totalRequired > 0) {
    explanation += `You match ${skillRes.details.matchedRequired.length} of ${skillRes.details.totalRequired} required skills. `;
  }
  if (availability.experience && expRes.details.isMet) {
    explanation += `Your experience meets the position's requirements. `;
  } else if (availability.experience && !expRes.details.isMet) {
    explanation += `The required seniority is higher than your current profile. `;
  }
  if (unavailableSignals.length > 0) {
    explanation += `(Note: ${unavailableSignals.join(", ")} signal(s) were unavailable in your profile and weights were adjusted accordingly).`;
  }

  return {
    overallScore,
    matchQuality: qualityThreshold.quality,
    matchLabel: qualityThreshold.label,
    signalAvailability: availability,
    unavailableSignals,
    breakdown,
    matchedSkills: skillRes.details.allMatchedSkills,
    missingSkills: skillRes.details.allMissingSkills,
    strengths,
    gaps,
    explanation: explanation.trim(),
  };
}
