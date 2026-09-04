import { describe, it, expect } from "vitest";
import { matchEducation } from "@/services/matching/education-matcher";

describe("Education Matcher", () => {
  it("should not penalize candidate when job has no education requirement", () => {
    const res = matchEducation(null, null);
    expect(res.score).toBe(100);
    expect(res.isAvailable).toBe(true);
    expect(res.details.isRequirementSatisfied).toBe(true);
  });

  it("should award 100% when candidate technical field matches requirement", () => {
    const res = matchEducation(
      { degree: "B.Tech", field: "Computer Science", isTech: true },
      "B.Tech in Computer Science or related field"
    );
    expect(res.score).toBe(100);
    expect(res.isAvailable).toBe(true);
    expect(res.details.isDomainMatch).toBe(true);
  });

  it("should award partial score (60%) when candidate has a degree in non-tech field", () => {
    const res = matchEducation(
      { degree: "Bachelor of Arts", field: "History", isTech: false },
      "Degree in Computer Science or relevant technical discipline"
    );
    expect(res.score).toBe(60);
    expect(res.isAvailable).toBe(true);
    expect(res.details.isDomainMatch).toBe(false);
  });

  it("should mark signal unavailable when candidate education is missing and job requires it", () => {
    const res = matchEducation(null, "B.S. in Computer Science required");
    expect(res.isAvailable).toBe(false);
    expect(res.score).toBe(0);
    expect(res.details.reason).toContain("not provided");
  });
});
