/**
 * Pure Deterministic Recommendation Generator
 *
 * 100% traceable recommendations based strictly on verified gaps or unavailable signals.
 * No generic or hallucinated advice.
 */

import type {
  ActionableRecommendation,
  AssessmentSignal,
  SkillGapItem,
} from "@/types/analysis";

export interface RecommendationInputs {
  criticalGaps: SkillGapItem[];
  importantGaps: SkillGapItem[];
  experienceAssessment: AssessmentSignal<{
    isMet: boolean;
    candidateYears?: number | null;
    requiredYearsRange?: string | null;
  }>;
  roleAssessment: AssessmentSignal<{ matchType: string }>;
  educationAssessment: AssessmentSignal<{
    isDomainMatch: boolean;
    isRequirementSatisfied: boolean;
  }>;
  locationAssessment: AssessmentSignal<{
    isWorkModeCompatible: boolean;
    isLocationCompatible: boolean;
  }>;
}

export function generateDeterministicRecommendations(
  inputs: RecommendationInputs
): ActionableRecommendation[] {
  const recommendations: ActionableRecommendation[] = [];

  // 1. Missing REQUIRED skills -> HIGH priority
  for (const gap of inputs.criticalGaps) {
    recommendations.push({
      priority: "HIGH",
      category: "REQUIRED_SKILL",
      target: gap.skillName,
      advice: `Missing required skill "${gap.skillName}": Build a demo project or highlight relevant coursework showing competency with ${gap.skillName} prior to applying.`,
    });
  }

  // 2. Experience Gaps or Unavailable -> HIGH / MEDIUM priority
  if (inputs.experienceAssessment.status === "UNAVAILABLE") {
    recommendations.push({
      priority: "HIGH",
      category: "EXPERIENCE",
      target: "Experience History",
      advice:
        "Experience data was unavailable: Ensure your resume includes explicit employment dates, internships, or years of project experience so the system and recruiters can evaluate your seniority.",
    });
  } else if (
    inputs.experienceAssessment.status === "EVALUATED" &&
    !inputs.experienceAssessment.details.isMet
  ) {
    const range = inputs.experienceAssessment.details.requiredYearsRange || "required seniority";
    recommendations.push({
      priority: "MEDIUM",
      category: "EXPERIENCE",
      target: "Experience Level",
      advice: `Role requires ${range}: Emphasize high-impact contributions, production ownership, or complex projects to demonstrate readiness for this position.`,
    });
  }

  // 3. Missing PREFERRED skills -> MEDIUM priority
  for (const gap of inputs.importantGaps) {
    recommendations.push({
      priority: "MEDIUM",
      category: "PREFERRED_SKILL",
      target: gap.skillName,
      advice: `Preferred skill "${gap.skillName}": Consider familiarizing yourself with ${gap.skillName} to stand out against other qualified candidates.`,
    });
  }

  // 4. Role alignment gaps
  if (
    inputs.roleAssessment.status === "EVALUATED" &&
    inputs.roleAssessment.details.matchType === "UNRELATED"
  ) {
    recommendations.push({
      priority: "MEDIUM",
      category: "PROFILE",
      target: "Target Role",
      advice:
        "Your stated target role does not closely align with this job title: Tailor your resume summary and headline to reflect interest and relevant skills for this specific job track.",
    });
  }

  // 5. Education requirement gaps
  if (
    inputs.educationAssessment.status === "UNAVAILABLE" &&
    inputs.educationAssessment.reason.includes("required")
  ) {
    recommendations.push({
      priority: "LOW",
      category: "EDUCATION",
      target: "Education",
      advice:
        "Job lists an education qualification: Ensure your degree and major (e.g. Computer Science) are clearly stated in your resume education section.",
    });
  }

  // 6. Location / Work Mode gaps
  if (
    inputs.locationAssessment.status === "EVALUATED" &&
    !inputs.locationAssessment.details.isWorkModeCompatible
  ) {
    recommendations.push({
      priority: "LOW",
      category: "PROFILE",
      target: "Work Mode Preference",
      advice:
        "Work mode differs from your profile preference: Confirm your willingness to accommodate the job's work arrangement (Remote, Hybrid, or On-site) before submitting.",
    });
  }

  return recommendations;
}
