import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ArbeitnowAdapter } from "@/services/jobs/adapters/arbeitnow-adapter";
import { BaseJobAdapter } from "@/services/jobs/adapters/base-adapter";

describe("ArbeitnowAdapter", () => {
  let adapter: ArbeitnowAdapter;
  const originalFetch = global.fetch;

  beforeEach(() => {
    adapter = new ArbeitnowAdapter();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should implement the BaseJobAdapter contract with correct metadata", async () => {
    expect(adapter).toBeInstanceOf(BaseJobAdapter);
    expect(adapter.sourceName).toBe("arbeitnow");
    expect(adapter.sourceType).toBe("api");
    expect(adapter.displayName).toBe("Arbeitnow Job Board");
    expect(adapter.getBaseUrl()).toBe("https://www.arbeitnow.com");
    expect(await adapter.isAvailable()).toBe(true);
  });

  it("should map valid single job response to RawJob format", async () => {
    const mockPayload = {
      data: [
        {
          slug: "senior-backend-engineer-berlin-991",
          company_name: "Delivery Hero",
          title: "Senior Backend Engineer",
          description: "Develop scalable Go microservices on Kubernetes.",
          remote: true,
          url: "https://www.arbeitnow.com/jobs/companies/delivery-hero/senior-backend-engineer-991",
          tags: ["Go", "Kubernetes", "PostgreSQL"],
          job_types: ["full_time"],
          location: "Berlin, Germany",
          created_at: 1693742400, // 2023-09-03T12:00:00.000Z
        },
      ],
      links: { next: "https://www.arbeitnow.com/api/job-board-api?page=2" },
      meta: { total: 100 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await adapter.fetchJobs();

    expect(result.jobs).toHaveLength(1);
    const job = result.jobs[0];
    expect(job.externalId).toBe("senior-backend-engineer-berlin-991");
    expect(job.title).toBe("Senior Backend Engineer");
    expect(job.company).toBe("Delivery Hero");
    expect(job.workMode).toBe("REMOTE");
    expect(job.employmentType).toBe("FULL_TIME");
    expect(job.requiredSkills).toEqual(["Go", "Kubernetes", "PostgreSQL"]);
    expect(job.applicationUrl).toBe(
      "https://www.arbeitnow.com/jobs/companies/delivery-hero/senior-backend-engineer-991"
    );
    expect(job.location).toBe("Berlin, Germany");
    expect(job.postedAt).toEqual(new Date(1693742400 * 1000));
    expect(result.hasMore).toBe(true);
  });

  it("should map multiple jobs and handle onsite workMode", async () => {
    const mockPayload = {
      data: [
        {
          slug: "job-onsite",
          company_name: "Hardware Corp",
          title: "Embedded Engineer",
          remote: false,
          location: "Munich, Germany",
          url: "https://www.arbeitnow.com/jobs/job-onsite",
          job_types: ["contract"],
        },
        {
          slug: "job-remote",
          company_name: "Cloud Corp",
          title: "Cloud Architect",
          remote: true,
          url: "https://www.arbeitnow.com/jobs/job-remote",
          job_types: ["part_time"],
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toHaveLength(2);
    expect(result.jobs[0].workMode).toBe("ONSITE");
    expect(result.jobs[0].employmentType).toBe("CONTRACT");
    expect(result.jobs[1].workMode).toBe("REMOTE");
    expect(result.jobs[1].employmentType).toBe("PART_TIME");
  });

  it("should preserve original valid HTTPS application URLs and reject unsafe protocols", async () => {
    const mockPayload = {
      data: [
        {
          slug: "valid-job",
          company_name: "Legit Co",
          title: "Legit Job",
          url: "https://www.arbeitnow.com/jobs/valid-job",
        },
        {
          slug: "evil-job",
          company_name: "Evil Co",
          title: "XSS Job",
          url: "javascript:doEvil()",
        },
        {
          slug: "relative-job",
          company_name: "Relative Co",
          title: "Incomplete Job",
          url: "careers/view/123",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].externalId).toBe("valid-job");
    expect(result.jobs[0].applicationUrl).toBe("https://www.arbeitnow.com/jobs/valid-job");
  });

  it("should handle missing optional fields gracefully", async () => {
    const mockPayload = {
      data: [
        {
          slug: "barebones",
          company_name: "Bare Co",
          title: "Minimal Role",
          url: "https://www.arbeitnow.com/jobs/barebones",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].requiredSkills).toEqual([]);
    expect(result.jobs[0].workMode).toBeUndefined();
    expect(result.jobs[0].employmentType).toBeUndefined();
  });

  it("should handle malformed payload without throwing", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ invalidKey: [] }),
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.error).toContain("Unexpected payload structure");
  });

  it("should handle HTTP 4xx/5xx responses gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.statusCode).toBe(429);
    expect(result.metadata?.error).toContain("Arbeitnow API error");
  });

  it("should handle timeout or network abort gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network connection reset"));

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.error).toContain("Network connection reset");
  });
});
