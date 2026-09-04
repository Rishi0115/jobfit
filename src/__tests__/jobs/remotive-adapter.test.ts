import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RemotiveAdapter } from "@/services/jobs/adapters/remotive-adapter";
import { BaseJobAdapter } from "@/services/jobs/adapters/base-adapter";

describe("RemotiveAdapter", () => {
  let adapter: RemotiveAdapter;
  const originalFetch = global.fetch;

  beforeEach(() => {
    adapter = new RemotiveAdapter();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should implement the BaseJobAdapter contract with correct metadata", async () => {
    expect(adapter).toBeInstanceOf(BaseJobAdapter);
    expect(adapter.sourceName).toBe("remotive");
    expect(adapter.sourceType).toBe("api");
    expect(adapter.displayName).toBe("Remotive Remote Jobs");
    expect(adapter.getBaseUrl()).toBe("https://remotive.com");
    expect(await adapter.isAvailable()).toBe(true);
  });

  it("should map valid single job response to RawJob format", async () => {
    const mockPayload = {
      "job-count": 1,
      jobs: [
        {
          id: 198234,
          url: "https://remotive.com/remote-jobs/software-dev/fullstack-engineer-198234",
          title: "Senior Fullstack Engineer",
          company_name: "Stripe",
          category: "Software Development",
          tags: ["react", "typescript", "node.js"],
          job_type: "full_time",
          publication_date: "2026-08-15T10:00:00",
          candidate_required_location: "Worldwide",
          salary: "$120k - $140k",
          description: "Build payment infrastructure with React and Node.",
          company_logo: "https://remotive.com/logo.png",
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
    const job = result.jobs[0];
    expect(job.externalId).toBe("198234");
    expect(job.title).toBe("Senior Fullstack Engineer");
    expect(job.company).toBe("Stripe");
    expect(job.workMode).toBe("REMOTE");
    expect(job.employmentType).toBe("FULL_TIME");
    expect(job.requiredSkills).toEqual(["react", "typescript", "node.js"]);
    expect(job.applicationUrl).toBe(
      "https://remotive.com/remote-jobs/software-dev/fullstack-engineer-198234"
    );
    expect(job.location).toBe("Worldwide");
    expect(job.postedAt).toEqual(new Date("2026-08-15T10:00:00"));
    expect(job.metadata?.remotiveId).toBe(198234);
    expect(job.metadata?.companyLogo).toBe("https://remotive.com/logo.png");
  });

  it("should map multiple jobs from response correctly", async () => {
    const mockPayload = {
      "job-count": 2,
      jobs: [
        {
          id: 1,
          url: "https://remotive.com/remote-jobs/software-dev/job-1",
          title: "Frontend Dev",
          company_name: "Company A",
          job_type: "contract",
          tags: ["vue"],
        },
        {
          id: 2,
          url: "https://remotive.com/remote-jobs/software-dev/job-2",
          title: "Backend Dev",
          company_name: "Company B",
          job_type: "part_time",
          tags: ["go", "docker"],
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
    expect(result.jobs[0].employmentType).toBe("CONTRACT");
    expect(result.jobs[1].employmentType).toBe("PART_TIME");
  });

  it("should preserve original valid HTTPS application URLs and reject unsafe protocols", async () => {
    const mockPayload = {
      jobs: [
        {
          id: 10,
          url: "https://remotive.com/jobs/safe-1",
          title: "Safe Job",
          company_name: "Good Corp",
        },
        {
          id: 11,
          url: "javascript:alert(1)",
          title: "Malicious Job",
          company_name: "Bad Corp",
        },
        {
          id: 12,
          url: "/relative/path/job",
          title: "Relative Job",
          company_name: "Ugly Corp",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await adapter.fetchJobs();
    // Only the job with a safe, absolute HTTP(S) URL should be included
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].externalId).toBe("10");
    expect(result.jobs[0].applicationUrl).toBe("https://remotive.com/jobs/safe-1");
  });

  it("should handle missing optional fields gracefully without fabricating data", async () => {
    const mockPayload = {
      jobs: [
        {
          id: 555,
          url: "https://remotive.com/jobs/minimal",
          title: "Minimal Job",
          company_name: "Minimal Corp",
          // No tags, salary, job_type, publication_date, or description
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
    const job = result.jobs[0];
    expect(job.title).toBe("Minimal Job");
    expect(job.requiredSkills).toEqual([]);
    expect(job.employmentType).toBeUndefined();
    expect(job.postedAt).toBeUndefined();
  });

  it("should handle malformed payload without throwing", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ notJobs: "random-string" }),
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.error).toContain("Unexpected payload structure");
  });

  it("should handle HTTP 4xx/5xx responses gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.statusCode).toBe(503);
    expect(result.metadata?.error).toContain("Remotive API error");
  });

  it("should handle timeout or network abort gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("The operation was aborted due to timeout"));

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.error).toContain("aborted due to timeout");
  });
});
