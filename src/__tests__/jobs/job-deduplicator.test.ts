import { describe, it, expect } from "vitest";
import {
  deduplicateJobs,
  createDeduplicationKey,
} from "@/services/jobs/ingestion/job-deduplicator";
import type { NormalizedJob } from "@/types/job";

function makeJob(source: string, externalJobId: string, title: string): NormalizedJob {
  return {
    source,
    externalJobId,
    title,
    description: "Sample description",
    company: "Acme",
    applicationUrl: "https://example.com/apply",
  };
}

describe("Job Deduplicator", () => {
  describe("createDeduplicationKey", () => {
    it("should generate a lowercased composite key", () => {
      expect(createDeduplicationKey("Mock", "job-123")).toBe("mock::job-123");
      expect(createDeduplicationKey("ADZUNA", "EXT-999")).toBe("adzuna::EXT-999");
    });
  });

  describe("deduplicateJobs", () => {
    it("should preserve all jobs when there are no duplicates", () => {
      const jobs = [
        makeJob("mock", "job-1", "Frontend Dev"),
        makeJob("mock", "job-2", "Backend Dev"),
        makeJob("mock", "job-3", "DevOps Engineer"),
      ];

      const { unique, duplicatesRemoved } = deduplicateJobs(jobs);

      expect(unique).toHaveLength(3);
      expect(duplicatesRemoved).toBe(0);
    });

    it("should remove duplicates with the same source and externalJobId", () => {
      const jobs = [
        makeJob("mock", "job-1", "Initial Title"),
        makeJob("mock", "job-1", "Updated Title"),
      ];

      const { unique, duplicatesRemoved } = deduplicateJobs(jobs);

      expect(unique).toHaveLength(1);
      expect(duplicatesRemoved).toBe(1);
      // Last-write-wins: latest entry should overwrite earlier one
      expect(unique[0].title).toBe("Updated Title");
    });

    it("should allow the same externalJobId across different sources", () => {
      const jobs = [
        makeJob("adzuna", "100", "Job from Adzuna"),
        makeJob("remotive", "100", "Job from Remotive"),
      ];

      const { unique, duplicatesRemoved } = deduplicateJobs(jobs);

      expect(unique).toHaveLength(2);
      expect(duplicatesRemoved).toBe(0);
    });

    it("should handle empty batch", () => {
      const { unique, duplicatesRemoved } = deduplicateJobs([]);
      expect(unique).toEqual([]);
      expect(duplicatesRemoved).toBe(0);
    });
  });
});
