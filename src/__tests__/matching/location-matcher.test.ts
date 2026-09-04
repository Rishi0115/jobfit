import { describe, it, expect } from "vitest";
import { matchLocation } from "@/services/matching/location-matcher";

describe("Location and Work Mode Matcher", () => {
  it("should award 100% for Remote jobs regardless of physical candidate location", () => {
    const res = matchLocation("REMOTE", ["Bengaluru"], "REMOTE", "Anywhere");
    expect(res.score).toBe(100);
    expect(res.isAvailable).toBe(true);
    expect(res.details.isWorkModeCompatible).toBe(true);
  });

  it("should award 100% when candidate work mode and location match job requirements", () => {
    const res = matchLocation("HYBRID", ["Bengaluru"], "HYBRID", "Bengaluru");
    expect(res.score).toBe(100);
    expect(res.isAvailable).toBe(true);
    expect(res.details.isWorkModeCompatible).toBe(true);
    expect(res.details.isLocationCompatible).toBe(true);
  });

  it("should penalize incompatible work modes (e.g. Remote-only candidate for Onsite job)", () => {
    const res = matchLocation("REMOTE", ["Bengaluru"], "ONSITE", "Bengaluru");
    expect(res.details.isWorkModeCompatible).toBe(false);
    expect(res.score).toBeLessThanOrEqual(55);
  });

  it("should not penalize candidate when job specifies no location constraints", () => {
    const res = matchLocation("HYBRID", ["Mumbai"], null, null);
    expect(res.score).toBe(100);
    expect(res.isAvailable).toBe(true);
  });

  it("should explicitly mark signal unavailable when candidate preferences are missing", () => {
    const res = matchLocation(null, [], "ONSITE", "Bengaluru");
    expect(res.isAvailable).toBe(false);
    expect(res.score).toBe(0);
  });
});
