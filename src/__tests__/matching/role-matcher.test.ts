import { describe, it, expect } from "vitest";
import { matchRole } from "@/services/matching/role-matcher";

describe("Role Relevance Matcher", () => {
  it("should award 100% for exact role title match", () => {
    const res = matchRole("Software Engineer", "Software Engineer");
    expect(res.score).toBe(100);
    expect(res.isAvailable).toBe(true);
    expect(res.details.matchType).toBe("EXACT");
  });

  it("should match roles with same specialization within family (e.g. Frontend Engineer <-> Frontend Developer)", () => {
    const res = matchRole("Frontend Developer", "Senior Frontend Engineer");
    expect(res.score).toBe(95);
    expect(res.isAvailable).toBe(true);
    expect(res.details.matchType).toBe("SPECIALIZATION");
  });

  it("should recognize Full-Stack to Frontend/Backend alignment with high score (85%)", () => {
    const res1 = matchRole("Full Stack Developer", "Frontend Engineer");
    expect(res1.score).toBe(85);
    expect(res1.isAvailable).toBe(true);

    const res2 = matchRole("Backend Developer", "Fullstack Engineer");
    expect(res2.score).toBe(85);
    expect(res2.isAvailable).toBe(true);
  });

  it("should recognize General Software Engineer to specialized development (80%)", () => {
    const res = matchRole("Software Engineer", "Backend Developer");
    expect(res.score).toBe(80);
    expect(res.isAvailable).toBe(true);
  });

  it("should score cross-specialization within SWE fairly (60%)", () => {
    const res = matchRole("Frontend Developer", "Backend Developer");
    expect(res.score).toBe(60);
    expect(res.isAvailable).toBe(true);
  });

  it("should award low score for unrelated role disciplines", () => {
    const res = matchRole("Data Scientist", "Frontend Developer");
    expect(res.score).toBe(20);
    expect(res.details.matchType).toBe("UNRELATED");
  });

  it("should mark signal unavailable when candidate target role is missing", () => {
    const res = matchRole(null, "Software Engineer");
    expect(res.isAvailable).toBe(false);
    expect(res.score).toBe(0);
    expect(res.details.matchType).toBe("UNAVAILABLE");
  });
});
