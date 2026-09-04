import { describe, it, expect } from "vitest";
import { generateDeterministicRecommendations } from "@/services/skill-gap/recommendation-generator";
import type { SkillGapItem } from "@/types/analysis";

describe("Deterministic Recommendations Generator", () => {
  it("should generate traceable HIGH priority recommendations for missing required skills", () => {
    const criticalGaps: SkillGapItem[] = [
      {
        skillName: "PostgreSQL",
        canonicalName: "postgresql",
        type: "REQUIRED",
        status: "MISSING",
        severity: "CRITICAL",
        source: "NONE",
      },
    ];

    const recommendations = generateDeterministicRecommendations({
      criticalGaps,
      importantGaps: [],
      experienceAssessment: {
        status: "EVALUATED",
        score: 100,
        reason: "Matched",
        details: { isMet: true },
      },
      roleAssessment: {
        status: "EVALUATED",
        score: 100,
        reason: "Matched",
        details: { matchType: "EXACT" },
      },
      educationAssessment: {
        status: "EVALUATED",
        score: 100,
        reason: "Matched",
        details: { isDomainMatch: true, isRequirementSatisfied: true },
      },
      locationAssessment: {
        status: "EVALUATED",
        score: 100,
        reason: "Matched",
        details: { isWorkModeCompatible: true, isLocationCompatible: true },
      },
    });

    expect(recommendations.length).toBe(1);
    expect(recommendations[0].priority).toBe("HIGH");
    expect(recommendations[0].category).toBe("REQUIRED_SKILL");
    expect(recommendations[0].target).toBe("PostgreSQL");
    expect(recommendations[0].advice).toContain("PostgreSQL");
  });

  it("should generate experience recommendation when candidate experience is UNAVAILABLE", () => {
    const recommendations = generateDeterministicRecommendations({
      criticalGaps: [],
      importantGaps: [],
      experienceAssessment: {
        status: "UNAVAILABLE",
        score: 0,
        reason: "Candidate experience data not provided",
        details: { isMet: false },
      },
      roleAssessment: {
        status: "EVALUATED",
        score: 100,
        reason: "Matched",
        details: { matchType: "EXACT" },
      },
      educationAssessment: {
        status: "EVALUATED",
        score: 100,
        reason: "Matched",
        details: { isDomainMatch: true, isRequirementSatisfied: true },
      },
      locationAssessment: {
        status: "EVALUATED",
        score: 100,
        reason: "Matched",
        details: { isWorkModeCompatible: true, isLocationCompatible: true },
      },
    });

    const expRec = recommendations.find((r) => r.category === "EXPERIENCE");
    expect(expRec).toBeDefined();
    expect(expRec!.priority).toBe("HIGH");
    expect(expRec!.advice).toContain("employment dates");
  });

  it("should generate MEDIUM priority recommendations for missing preferred skills", () => {
    const importantGaps: SkillGapItem[] = [
      {
        skillName: "Redis",
        canonicalName: "redis",
        type: "PREFERRED",
        status: "MISSING",
        severity: "IMPORTANT",
        source: "NONE",
      },
    ];

    const recommendations = generateDeterministicRecommendations({
      criticalGaps: [],
      importantGaps,
      experienceAssessment: {
        status: "EVALUATED",
        score: 100,
        reason: "Matched",
        details: { isMet: true },
      },
      roleAssessment: {
        status: "EVALUATED",
        score: 100,
        reason: "Matched",
        details: { matchType: "EXACT" },
      },
      educationAssessment: {
        status: "EVALUATED",
        score: 100,
        reason: "Matched",
        details: { isDomainMatch: true, isRequirementSatisfied: true },
      },
      locationAssessment: {
        status: "EVALUATED",
        score: 100,
        reason: "Matched",
        details: { isWorkModeCompatible: true, isLocationCompatible: true },
      },
    });

    expect(recommendations.length).toBe(1);
    expect(recommendations[0].priority).toBe("MEDIUM");
    expect(recommendations[0].category).toBe("PREFERRED_SKILL");
    expect(recommendations[0].target).toBe("Redis");
  });

  it("should generate 0 recommendations when there are no gaps and all signals are satisfied", () => {
    const recommendations = generateDeterministicRecommendations({
      criticalGaps: [],
      importantGaps: [],
      experienceAssessment: {
        status: "EVALUATED",
        score: 100,
        reason: "Matched",
        details: { isMet: true },
      },
      roleAssessment: {
        status: "EVALUATED",
        score: 100,
        reason: "Matched",
        details: { matchType: "EXACT" },
      },
      educationAssessment: {
        status: "EVALUATED",
        score: 100,
        reason: "Matched",
        details: { isDomainMatch: true, isRequirementSatisfied: true },
      },
      locationAssessment: {
        status: "EVALUATED",
        score: 100,
        reason: "Matched",
        details: { isWorkModeCompatible: true, isLocationCompatible: true },
      },
    });

    expect(recommendations.length).toBe(0);
  });
});
