import { describe, it, expect } from "vitest";
import { calculateMatchScore } from "@/services/matching/engine";
import type { CandidateMatchingInput, JobMatchingInput } from "@/types/matching";

describe("Deterministic Matching Engine", () => {
  const perfectCandidate: CandidateMatchingInput = {
    id: "candidate-1",
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    experienceLevel: "MID",
    yearsOfExperience: 3,
    targetRole: "Full Stack Engineer",
    education: { degree: "B.Tech", field: "Computer Science", isTech: true },
    preferredWorkMode: "REMOTE",
    preferredLocations: ["Bengaluru"],
  };

  const matchingJob: JobMatchingInput = {
    id: "job-1",
    title: "Full Stack Developer",
    requiredSkills: ["React", "TypeScript", "Node.js"],
    preferredSkills: ["PostgreSQL"],
    experienceLevel: "MID",
    minYearsExperience: 3,
    maxYearsExperience: 5,
    educationRequirement: "Computer Science degree",
    workMode: "REMOTE",
    location: "Bengaluru",
  };

  it("should calculate high match score (>= 90%) for strong candidate alignment across all signals", () => {
    const result = calculateMatchScore(perfectCandidate, matchingJob);

    expect(result.overallScore).toBeGreaterThanOrEqual(90);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.matchQuality).toBe("EXCELLENT");
    expect(result.matchedSkills).toContain("React");
    expect(result.matchedSkills).toContain("TypeScript");
    expect(result.matchedSkills).toContain("Node.js");
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.explanation).toContain("Match score is");
  });

  it("should dynamically normalize weights when non-critical signals are unavailable", () => {
    const candidateWithoutEduAndLoc: CandidateMatchingInput = {
      id: "candidate-2",
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      experienceLevel: "MID",
      yearsOfExperience: 3,
      targetRole: "Full Stack Developer",
      education: null, // Unavailable
      preferredWorkMode: null, // Unavailable
      preferredLocations: [],
    };

    const result = calculateMatchScore(candidateWithoutEduAndLoc, matchingJob);

    expect(result.signalAvailability.education).toBe(false);
    expect(result.signalAvailability.location).toBe(false);
    expect(result.unavailableSignals).toContain("education");
    expect(result.unavailableSignals).toContain("location");

    // Normalized weights of available signals should sum to 1.0 (100%)
    const normalizedSum =
      result.breakdown.skills.normalizedWeight +
      result.breakdown.experience.normalizedWeight +
      result.breakdown.role.normalizedWeight;

    expect(Math.round(normalizedSum * 100) / 100).toBe(1.0);

    // Because candidate matches all available signals perfectly (skills=100, exp=100, role=100),
    // overallScore should remain 100 without penalization for missing signals.
    expect(result.overallScore).toBe(100);
    expect(result.explanation).toContain("unavailable in your profile and weights were adjusted");
  });

  it("should respect score boundaries (0 to 100)", () => {
    // Unrelated candidate
    const zeroMatchCandidate: CandidateMatchingInput = {
      id: "candidate-3",
      skills: ["Cobol", "Fortran"],
      experienceLevel: "FRESHER",
      yearsOfExperience: 0,
      targetRole: "Accountant",
      education: { degree: "Accounting", field: "Finance", isTech: false },
      preferredWorkMode: "ONSITE",
      preferredLocations: ["London"],
    };

    const result = calculateMatchScore(zeroMatchCandidate, matchingJob);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThan(40);
    expect(result.matchQuality).toBe("LOW");
    expect(result.gaps.length).toBeGreaterThan(0);
  });

  it("should produce deterministic, identical results across repeated calls", () => {
    const run1 = calculateMatchScore(perfectCandidate, matchingJob);
    const run2 = calculateMatchScore(perfectCandidate, matchingJob);
    const run3 = calculateMatchScore(perfectCandidate, matchingJob);

    expect(run1.overallScore).toBe(run2.overallScore);
    expect(run2.overallScore).toBe(run3.overallScore);
    expect(run1.matchedSkills).toEqual(run2.matchedSkills);
    expect(run1.explanation).toBe(run2.explanation);
  });

  it("should correctly classify match quality tiers based on score thresholds", () => {
    // 1. Excellent Match (90-100)
    const excellentRes = calculateMatchScore(perfectCandidate, matchingJob);
    expect(excellentRes.overallScore).toBeGreaterThanOrEqual(90);
    expect(excellentRes.matchQuality).toBe("EXCELLENT");
    expect(excellentRes.matchLabel).toBe("Excellent Match");

    // 2. Strong Match (75-89)
    // Candidate has 3 of 3 required skills, but lacks preferred PostgreSQL and is stretch experience
    const strongCandidate: CandidateMatchingInput = {
      id: "candidate-strong",
      skills: ["React", "TypeScript", "Node.js"], // 3 of 3 required (80%), 0 of 1 preferred
      experienceLevel: "JUNIOR", // 65% stretch
      yearsOfExperience: 2,
      targetRole: "Full Stack Developer", // 100%
      education: null,
      preferredWorkMode: "REMOTE",
      preferredLocations: ["Bengaluru"],
    };
    const strongRes = calculateMatchScore(strongCandidate, matchingJob);
    expect(strongRes.overallScore).toBeGreaterThanOrEqual(75);
    expect(strongRes.overallScore).toBeLessThanOrEqual(89);
    expect(strongRes.matchQuality).toBe("STRONG");
    expect(strongRes.matchLabel).toBe("Strong Match");

    // 3. Low Match (0-39)
    const lowCandidate: CandidateMatchingInput = {
      id: "candidate-low",
      skills: ["HTML"], // 0 of required
      experienceLevel: "FRESHER",
      yearsOfExperience: 0,
      targetRole: "Designer",
      education: null,
      preferredWorkMode: null,
      preferredLocations: [],
    };
    const lowRes = calculateMatchScore(lowCandidate, matchingJob);
    expect(lowRes.overallScore).toBeLessThan(40);
    expect(lowRes.matchQuality).toBe("LOW");
    expect(lowRes.matchLabel).toBe("Low Match");
  });
});
