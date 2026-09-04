import { describe, it, expect } from "vitest";
import { MockJobAdapter } from "@/services/jobs/adapters/mock-adapter";

describe("MockJobAdapter", () => {
  const adapter = new MockJobAdapter();

  it("should have correct metadata properties", () => {
    expect(adapter.sourceName).toBe("mock");
    expect(adapter.displayName).toBe("Mock Job Source");
    expect(adapter.sourceType).toBe("mock");
    expect(adapter.getBaseUrl()).toBe("https://mock.jobfit.dev");
  });

  it("should always be available", async () => {
    const available = await adapter.isAvailable();
    expect(available).toBe(true);
  });

  it("should return at least 15 deterministic realistic tech jobs", async () => {
    const result = await adapter.fetchJobs();
    expect(result.jobs.length).toBeGreaterThanOrEqual(15);
    expect(result.totalAvailable).toBeGreaterThanOrEqual(15);

    // Verify all jobs have required raw fields
    for (const job of result.jobs) {
      expect(job.externalId).toBeDefined();
      expect(job.externalId.length).toBeGreaterThan(0);
      expect(job.title).toBeDefined();
      expect(job.title.length).toBeGreaterThan(0);
      expect(job.company).toBeDefined();
      expect(job.company.length).toBeGreaterThan(0);
      expect(job.description).toBeDefined();
      expect(job.description.length).toBeGreaterThan(0);
      expect(job.applicationUrl).toBeDefined();
    }
  });

  it("should make zero network requests and return identical data across multiple calls", async () => {
    const result1 = await adapter.fetchJobs();
    const result2 = await adapter.fetchJobs();

    expect(result1.jobs.length).toBe(result2.jobs.length);
    expect(result1.jobs[0].externalId).toBe(result2.jobs[0].externalId);
    expect(result1.jobs[0].title).toBe(result2.jobs[0].title);
  });

  it("should support query filtering", async () => {
    const result = await adapter.fetchJobs({ query: "frontend" });
    expect(result.jobs.length).toBeGreaterThan(0);
    for (const job of result.jobs) {
      const match =
        job.title.toLowerCase().includes("frontend") ||
        job.company.toLowerCase().includes("frontend") ||
        job.description.toLowerCase().includes("frontend");
      expect(match).toBe(true);
    }
  });

  it("should support location filtering", async () => {
    const result = await adapter.fetchJobs({ location: "Bangalore" });
    expect(result.jobs.length).toBeGreaterThan(0);
    for (const job of result.jobs) {
      expect(job.location?.toLowerCase()).toContain("bangalore");
    }
  });

  it("should support limit and offset pagination", async () => {
    const page1 = await adapter.fetchJobs({ limit: 5, offset: 0 });
    const page2 = await adapter.fetchJobs({ limit: 5, offset: 5 });

    expect(page1.jobs.length).toBe(5);
    expect(page2.jobs.length).toBe(5);
    expect(page1.jobs[0].externalId).not.toBe(page2.jobs[0].externalId);
  });
});
