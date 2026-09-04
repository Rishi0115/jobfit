/**
 * Pure Education Matching Engine
 *
 * Evaluates candidate degree/field against job education requirements.
 * When job has no education requirement, candidate is not penalized.
 * When candidate education data is missing, signal is explicitly marked unavailable.
 */

import type { EducationMatchDetails } from "@/types/matching";

const TECH_FIELDS = new Set([
  "computer science",
  "cs",
  "information technology",
  "it",
  "software engineering",
  "computer engineering",
  "data science",
  "artificial intelligence",
  "electrical engineering",
  "electronics",
  "mathematics",
  "statistics",
  "information systems",
  "bca",
  "mca",
  "b.tech",
  "btech",
  "m.tech",
  "mtech",
  "b.e",
  "be",
  "bs",
  "ms",
]);

export function isTechnicalField(fieldOrDegree?: string | null): boolean {
  if (!fieldOrDegree) return false;
  const lower = fieldOrDegree.toLowerCase().trim();

  for (const tech of TECH_FIELDS) {
    if (lower.includes(tech)) return true;
  }

  return false;
}

export function matchEducation(
  candidateEducation?: {
    degree?: string | null;
    field?: string | null;
    isTech?: boolean | null;
  } | null,
  jobRequirement?: string | null
): { score: number; isAvailable: boolean; details: EducationMatchDetails } {
  // If the job has no explicit education requirement, the candidate is NOT penalized.
  if (!jobRequirement || !jobRequirement.trim()) {
    return {
      score: 100,
      isAvailable: true,
      details: {
        candidateDegree: candidateEducation?.degree || null,
        candidateField: candidateEducation?.field || null,
        jobRequirement: null,
        isDomainMatch: true,
        isRequirementSatisfied: true,
        reason: "Job does not specify a mandatory education requirement.",
      },
    };
  }

  // Job requires education: check candidate data availability
  const hasDegree = Boolean(candidateEducation?.degree && candidateEducation.degree.trim());
  const hasField = Boolean(candidateEducation?.field && candidateEducation.field.trim());

  if (!candidateEducation || (!hasDegree && !hasField)) {
    return {
      score: 0,
      isAvailable: false,
      details: {
        candidateDegree: null,
        candidateField: null,
        jobRequirement,
        isDomainMatch: false,
        isRequirementSatisfied: false,
        reason: "Candidate education details are not provided.",
      },
    };
  }

  const isTech =
    candidateEducation.isTech ??
    (isTechnicalField(candidateEducation.degree) ||
      isTechnicalField(candidateEducation.field));

  if (isTech) {
    return {
      score: 100,
      isAvailable: true,
      details: {
        candidateDegree: candidateEducation.degree || null,
        candidateField: candidateEducation.field || null,
        jobRequirement,
        isDomainMatch: true,
        isRequirementSatisfied: true,
        reason: "Candidate degree/field aligns with technical discipline requirements.",
      },
    };
  }

  // Candidate has non-tech degree
  return {
    score: 60,
    isAvailable: true,
    details: {
      candidateDegree: candidateEducation.degree || null,
      candidateField: candidateEducation.field || null,
      jobRequirement,
      isDomainMatch: false,
      isRequirementSatisfied: true,
      reason: "Candidate has a degree, though outside the direct technical field.",
    },
  };
}
