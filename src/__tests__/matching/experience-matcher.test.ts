import { describe, it, expect } from "vitest";
import {
  matchExperience,
  parseExperienceRange,
} from "@/services/matching/experience-matcher";

describe("Experience Matcher", () => {
  describe("parseExperienceRange", () => {
    it("should parse standard year ranges", () => {
      expect(parseExperienceRange("1-3 years")).toEqual({ minYears: 1, maxYears: 3 });
      expect(parseExperienceRange("2+ years")).toEqual({ minYears: 2 });
      expect(parseExperienceRange("0 years")).toEqual({ minYears: 0 });
      expect(parseExperienceRange("fresher")).toEqual({ minYears: 0, maxYears: 1 });
    });
  });

  describe("matchExperience", () => {
    it("should award 100% when candidate matches exact experience level", () => {
      const res = matchExperience("MID", null, "MID");
      expect(res.score).toBe(100);
      expect(res.isAvailable).toBe(true);
      expect(res.details.isMet).toBe(true);
    });

    it("should award high score (95%) when candidate is 1 level above job requirement", () => {
      const res = matchExperience("MID", null, "JUNIOR");
      expect(res.score).toBe(95);
      expect(res.details.isMet).toBe(true);
    });

    it("should award partial score (65%) for stretch candidate 1 level below requirement", () => {
      const res = matchExperience("JUNIOR", null, "MID");
      expect(res.score).toBe(65);
      expect(res.details.isMet).toBe(false);
    });

    it("should award low score (25%) when candidate is 2 levels below requirement", () => {
      const res = matchExperience("FRESHER", null, "MID");
      expect(res.score).toBe(25);
      expect(res.details.isMet).toBe(false);
    });

    it("should award 100% for zero-year / fresher requirements", () => {
      const res1 = matchExperience("FRESHER", 0, "FRESHER", 0);
      expect(res1.score).toBe(100);
      expect(res1.details.isMet).toBe(true);

      const res2 = matchExperience("JUNIOR", 1, null, 0);
      expect(res2.score).toBe(100);
      expect(res2.details.isMet).toBe(true);
    });

    it("should compare numeric years accurately when job minYears is specified", () => {
      // Job requires 3+ years
      const meets = matchExperience(null, 4, null, 3);
      expect(meets.score).toBe(100);
      expect(meets.details.isMet).toBe(true);

      const slightlyBelow = matchExperience(null, 2, null, 3);
      expect(slightlyBelow.score).toBe(70);
      expect(slightlyBelow.details.isMet).toBe(false);

      const farBelow = matchExperience(null, 0, null, 3);
      expect(farBelow.score).toBe(15);
      expect(farBelow.details.isMet).toBe(false);
    });

    it("should explicitly mark signal unavailable when candidate experience is missing", () => {
      const res = matchExperience(null, null, "SENIOR", 5);
      expect(res.isAvailable).toBe(false);
      expect(res.score).toBe(0);
      expect(res.details.reason).toContain("not provided");
    });

    it("should award 100% when job has no experience requirement specified", () => {
      const res = matchExperience("JUNIOR", 2, null, null);
      expect(res.score).toBe(100);
      expect(res.isAvailable).toBe(true);
      expect(res.details.isMet).toBe(true);
    });
  });
});
