import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GreenhouseAdapter } from "@/services/jobs/adapters/greenhouse-adapter";
import { BaseJobAdapter } from "@/services/jobs/adapters/base-adapter";
import type { GreenhouseBoardConfig } from "@/services/jobs/adapters/ats-board-config";

const TEST_CONFIG: GreenhouseBoardConfig = {
  boardToken: "testcompany",
  companyName: "TestCo",
  companyWebsite: "https://testco.example.com",
};

describe("GreenhouseAdapter", () => {
  let adapter: GreenhouseAdapter;
  const originalFetch = global.fetch;

  beforeEach(() => {
    adapter = new GreenhouseAdapter(TEST_CONFIG);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should satisfy BaseJobAdapter contract with correct metadata", async () => {
    expect(adapter).toBeInstanceOf(BaseJobAdapter);
    expect(adapter.sourceName).toBe("greenhouse:testcompany");
    expect(adapter.sourceType).toBe("ats");
    expect(adapter.displayName).toBe("TestCo (Greenhouse)");
    expect(adapter.getBaseUrl()).toBe("https://boards.greenhouse.io/testcompany");
    expect(await adapter.isAvailable()).toBe(true);
  });

  it("should map valid Greenhouse job response to RawJob format", async () => {
    const mockPayload = {
      jobs: [
        {
          id: 4501234,
          title: "Senior Software Engineer - Platform",
          absolute_url: "https://boards.greenhouse.io/testcompany/jobs/4501234",
          updated_at: "2026-08-25T14:30:00-04:00",
          location: { name: "Bengaluru, India" },
          content: "<p>Build scalable platform services.</p>",
          departments: [{ name: "Engineering" }],
          offices: [{ name: "Bengaluru" }],
          internal_job_id: 87654,
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
    expect(job.externalId).toBe("4501234");
    expect(job.title).toBe("Senior Software Engineer - Platform");
    expect(job.company).toBe("TestCo");
    expect(job.companyWebsite).toBe("https://testco.example.com");
    expect(job.location).toBe("Bengaluru, India");
    expect(job.workMode).toBe("ONSITE");
    expect(job.applicationUrl).toBe("https://boards.greenhouse.io/testcompany/jobs/4501234");
    expect(job.description).toContain("Build scalable platform services");
    expect(job.postedAt).toEqual(new Date("2026-08-25T14:30:00-04:00"));
    expect(job.metadata?.greenhouseId).toBe(4501234);
    expect(job.metadata?.boardToken).toBe("testcompany");
    expect(job.metadata?.departments).toEqual(["Engineering"]);
    expect(job.metadata?.offices).toEqual(["Bengaluru"]);
  });

  it("should map multiple jobs from response", async () => {
    const mockPayload = {
      jobs: [
        {
          id: 1001,
          title: "Frontend Engineer",
          absolute_url: "https://boards.greenhouse.io/testcompany/jobs/1001",
          location: { name: "Mumbai, India" },
        },
        {
          id: 1002,
          title: "Backend Engineer",
          absolute_url: "https://boards.greenhouse.io/testcompany/jobs/1002",
          location: { name: "Remote" },
        },
        {
          id: 1003,
          title: "Data Scientist",
          absolute_url: "https://boards.greenhouse.io/testcompany/jobs/1003",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toHaveLength(3);
    expect(result.jobs[0].company).toBe("TestCo");
    expect(result.jobs[1].company).toBe("TestCo");
    expect(result.jobs[2].company).toBe("TestCo");
  });

  it("should resolve Remote and Hybrid workMode from location text", async () => {
    const mockPayload = {
      jobs: [
        {
          id: 2001,
          title: "Engineer",
          absolute_url: "https://boards.greenhouse.io/testcompany/jobs/2001",
          location: { name: "Remote - India" },
        },
        {
          id: 2002,
          title: "Hybrid Product Manager",
          absolute_url: "https://boards.greenhouse.io/testcompany/jobs/2002",
          location: { name: "Bengaluru" },
        },
        {
          id: 2003,
          title: "Onsite Role",
          absolute_url: "https://boards.greenhouse.io/testcompany/jobs/2003",
          location: { name: "Pune, India" },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs[0].workMode).toBe("REMOTE");
    expect(result.jobs[1].workMode).toBe("HYBRID");
    expect(result.jobs[2].workMode).toBe("ONSITE");
  });

  it("should preserve original application URL and reject unsafe protocols", async () => {
    const mockPayload = {
      jobs: [
        {
          id: 3001,
          title: "Safe Role",
          absolute_url: "https://boards.greenhouse.io/testcompany/jobs/3001",
        },
        {
          id: 3002,
          title: "Evil Role",
          absolute_url: "javascript:alert(1)",
        },
        {
          id: 3003,
          title: "Missing URL",
          absolute_url: "",
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
    expect(result.jobs[0].applicationUrl).toBe(
      "https://boards.greenhouse.io/testcompany/jobs/3001"
    );
  });

  it("should handle missing optional fields gracefully", async () => {
    const mockPayload = {
      jobs: [
        {
          id: 5001,
          title: "Minimal Role",
          absolute_url: "https://boards.greenhouse.io/testcompany/jobs/5001",
          // No location, content, departments, offices, updated_at
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
    expect(job.location).toBeUndefined();
    expect(job.workMode).toBeUndefined();
    expect(job.postedAt).toBeUndefined();
    expect(job.requiredSkills).toEqual([]);
    expect(job.salaryMin).toBeUndefined();
    expect(job.salaryMax).toBeUndefined();
  });

  it("should preserve non-sensitive metadata without leaking config", async () => {
    const mockPayload = {
      jobs: [
        {
          id: 6001,
          title: "Meta Role",
          absolute_url: "https://boards.greenhouse.io/testcompany/jobs/6001",
          departments: [{ name: "Platform" }],
          offices: [{ name: "Remote" }],
          internal_job_id: 99999,
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await adapter.fetchJobs();
    const meta = result.jobs[0].metadata!;
    expect(meta.boardToken).toBe("testcompany");
    expect(meta.departments).toEqual(["Platform"]);
    expect(meta.offices).toEqual(["Remote"]);
    expect(meta.internal_job_id).toBe(99999);
  });

  it("should handle malformed response payload safely", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ wrongField: "oops" }),
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.error).toContain("Unexpected payload structure");
  });

  it("should handle HTTP error responses gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.statusCode).toBe(404);
    expect(result.metadata?.error).toContain("Greenhouse API returned HTTP 404");
  });

  it("should handle timeout or network failure gracefully", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error("The operation was aborted due to timeout"));

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.error).toContain("aborted due to timeout");
  });

  it("should handle network failure gracefully", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error("Network request failed"));

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.error).toContain("Network request failed");
  });

  it("should return unavailable and graceful error when boardToken is empty", async () => {
    const emptyAdapter = new GreenhouseAdapter({
      boardToken: "",
      companyName: "Empty",
    });

    expect(await emptyAdapter.isAvailable()).toBe(false);

    const result = await emptyAdapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.error).toContain("Missing Greenhouse board token");
  });
});
