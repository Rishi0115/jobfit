import { describe, it, expect } from "vitest";
import { validateJob, validateJobs } from "@/services/jobs/parsers/job-validator";
import type { NormalizedJob } from "@/types/job";

// ─── Helper ───

function makeValidJob(overrides: Partial<NormalizedJob> = {}): NormalizedJob {
  return {
    externalJobId: "test-001",
    title: "Software Engineer",
    description: "A great role building software.",
    company: "TestCorp",
    applicationUrl: "https://testcorp.com/apply",
    source: "mock",
    ...overrides,
  };
}

describe("Job Validator", () => {
  describe("validateJob", () => {
    it("should pass for a valid job with required fields", () => {
      const result = validateJob(makeValidJob());
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Software Engineer");
      }
    });

    it("should pass for a job with all optional fields", () => {
      const result = validateJob(
        makeValidJob({
          location: "Bangalore, India",
          workMode: "REMOTE",
          employmentType: "FULL_TIME",
          experienceLevel: "SENIOR",
          salaryMin: 2000000,
          salaryMax: 3500000,
          salaryCurrency: "INR",
          sourceUrl: "https://example.com/jobs/1",
          companyWebsite: "https://testcorp.com",
          postedAt: new Date(),
          expiresAt: new Date(),
          skills: ["React", "TypeScript"],
        })
      );
      expect(result.success).toBe(true);
    });

    it("should fail when title is missing", () => {
      const result = validateJob(makeValidJob({ title: "" }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.field === "title")).toBe(true);
      }
    });

    it("should fail when description is missing", () => {
      const result = validateJob(makeValidJob({ description: "" }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.field === "description")).toBe(true);
      }
    });

    it("should fail when company is missing", () => {
      const result = validateJob(makeValidJob({ company: "" }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.field === "company")).toBe(true);
      }
    });

    it("should fail when applicationUrl is missing", () => {
      const result = validateJob(makeValidJob({ applicationUrl: "" }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.field === "applicationUrl")).toBe(true);
      }
    });

    it("should fail when applicationUrl is invalid", () => {
      const result = validateJob(
        makeValidJob({ applicationUrl: "not-a-url" })
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.field === "applicationUrl")).toBe(true);
      }
    });

    it("should fail when source is missing", () => {
      const result = validateJob(makeValidJob({ source: "" }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.field === "source")).toBe(true);
      }
    });

    it("should fail when externalJobId is missing", () => {
      const result = validateJob(makeValidJob({ externalJobId: "" }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.field === "externalJobId")).toBe(true);
      }
    });

    it("should fail when companyWebsite is not a valid URL", () => {
      const result = validateJob(
        makeValidJob({ companyWebsite: "not-a-url" })
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.field === "companyWebsite")).toBe(true);
      }
    });

    it("should fail when sourceUrl is not a valid URL", () => {
      const result = validateJob(makeValidJob({ sourceUrl: "bad-url" }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.field === "sourceUrl")).toBe(true);
      }
    });

    it("should fail when workMode is invalid", () => {
      const result = validateJob(
        makeValidJob({ workMode: "NOWHERE" as "REMOTE" })
      );
      expect(result.success).toBe(false);
    });

    it("should fail when salaryMin is negative", () => {
      const result = validateJob(makeValidJob({ salaryMin: -1000 }));
      expect(result.success).toBe(false);
    });

    it("should provide useful error messages", () => {
      const result = validateJob(
        makeValidJob({ title: "", applicationUrl: "not-a-url" })
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThanOrEqual(2);
        const messages = result.errors.map((e) => e.message);
        expect(messages.some((m) => m.toLowerCase().includes("required") || m.toLowerCase().includes("url"))).toBe(true);
      }
    });
  });

  describe("validateJobs", () => {
    it("should separate valid and invalid jobs", () => {
      const jobs: NormalizedJob[] = [
        makeValidJob({ externalJobId: "1" }),
        makeValidJob({ externalJobId: "2", title: "" }), // Invalid
        makeValidJob({ externalJobId: "3" }),
      ];

      const result = validateJobs(jobs);
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].errors.length).toBeGreaterThan(0);
    });

    it("should return all valid when no invalid", () => {
      const jobs = [
        makeValidJob({ externalJobId: "1" }),
        makeValidJob({ externalJobId: "2" }),
      ];
      const result = validateJobs(jobs);
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(0);
    });

    it("should return all invalid when all fail", () => {
      const jobs: NormalizedJob[] = [
        makeValidJob({ externalJobId: "1", title: "" }),
        makeValidJob({ externalJobId: "2", source: "" }),
      ];
      const result = validateJobs(jobs);
      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(2);
    });
  });
});
