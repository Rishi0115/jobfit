import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LeverAdapter } from "@/services/jobs/adapters/lever-adapter";
import { BaseJobAdapter } from "@/services/jobs/adapters/base-adapter";
import type { LeverBoardConfig } from "@/services/jobs/adapters/ats-board-config";

const TEST_CONFIG: LeverBoardConfig = {
  companySlug: "testcorp",
  companyName: "TestCorp",
  companyWebsite: "https://testcorp.example.com",
};

describe("LeverAdapter", () => {
  let adapter: LeverAdapter;
  const originalFetch = global.fetch;

  beforeEach(() => {
    adapter = new LeverAdapter(TEST_CONFIG);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should satisfy BaseJobAdapter contract with correct metadata", async () => {
    expect(adapter).toBeInstanceOf(BaseJobAdapter);
    expect(adapter.sourceName).toBe("lever:testcorp");
    expect(adapter.sourceType).toBe("ats");
    expect(adapter.displayName).toBe("TestCorp (Lever)");
    expect(adapter.getBaseUrl()).toBe("https://jobs.lever.co/testcorp");
    expect(await adapter.isAvailable()).toBe(true);
  });

  it("should map valid Lever posting response to RawJob format", async () => {
    const mockPayload = [
      {
        id: "abc-def-123",
        text: "Senior QA Engineer",
        hostedUrl: "https://jobs.lever.co/testcorp/abc-def-123",
        applyUrl: "https://jobs.lever.co/testcorp/abc-def-123/apply",
        createdAt: 1724580000000, // epoch ms
        descriptionPlain: "Lead quality engineering efforts.",
        lists: [
          { text: "Requirements", content: "5+ years experience in QA." },
        ],
        additionalPlain: "Benefits: Health insurance.",
        categories: {
          team: "Quality",
          department: "Engineering",
          location: "Bengaluru, India",
          commitment: "Full-time",
          allLocations: ["Bengaluru, India"],
        },
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await adapter.fetchJobs();

    expect(result.jobs).toHaveLength(1);
    const job = result.jobs[0];
    expect(job.externalId).toBe("abc-def-123");
    expect(job.title).toBe("Senior QA Engineer");
    expect(job.company).toBe("TestCorp");
    expect(job.companyWebsite).toBe("https://testcorp.example.com");
    expect(job.location).toBe("Bengaluru, India");
    expect(job.workMode).toBe("ONSITE");
    expect(job.employmentType).toBe("FULL_TIME");
    expect(job.applicationUrl).toBe("https://jobs.lever.co/testcorp/abc-def-123");
    expect(job.description).toContain("Lead quality engineering efforts");
    expect(job.description).toContain("5+ years experience in QA");
    expect(job.postedAt).toEqual(new Date(1724580000000));
    expect(job.metadata?.leverId).toBe("abc-def-123");
    expect(job.metadata?.companySlug).toBe("testcorp");
    expect(job.metadata?.team).toBe("Quality");
    expect(job.metadata?.department).toBe("Engineering");
    expect(job.metadata?.commitment).toBe("Full-time");
  });

  it("should map multiple postings from response", async () => {
    const mockPayload = [
      {
        id: "post-1",
        text: "Frontend Developer",
        hostedUrl: "https://jobs.lever.co/testcorp/post-1",
        categories: { location: "Mumbai" },
      },
      {
        id: "post-2",
        text: "Backend Developer",
        hostedUrl: "https://jobs.lever.co/testcorp/post-2",
        categories: { location: "Remote" },
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toHaveLength(2);
    expect(result.jobs[0].title).toBe("Frontend Developer");
    expect(result.jobs[1].title).toBe("Backend Developer");
  });

  it("should resolve Remote and Hybrid workMode from location/commitment", async () => {
    const mockPayload = [
      {
        id: "wm-1",
        text: "Remote SRE",
        hostedUrl: "https://jobs.lever.co/testcorp/wm-1",
        categories: { location: "Remote - India" },
      },
      {
        id: "wm-2",
        text: "Hybrid Designer",
        hostedUrl: "https://jobs.lever.co/testcorp/wm-2",
        categories: { location: "Pune" },
      },
      {
        id: "wm-3",
        text: "Onsite Tester",
        hostedUrl: "https://jobs.lever.co/testcorp/wm-3",
        categories: { location: "Hyderabad" },
      },
    ];

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

  it("should map commitment to employmentType correctly", async () => {
    const mockPayload = [
      {
        id: "ct-1",
        text: "Contract Dev",
        hostedUrl: "https://jobs.lever.co/testcorp/ct-1",
        categories: { commitment: "Contract" },
      },
      {
        id: "ct-2",
        text: "Part-time Analyst",
        hostedUrl: "https://jobs.lever.co/testcorp/ct-2",
        categories: { commitment: "Part-time" },
      },
      {
        id: "ct-3",
        text: "Intern",
        hostedUrl: "https://jobs.lever.co/testcorp/ct-3",
        categories: { commitment: "Internship" },
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs[0].employmentType).toBe("CONTRACT");
    expect(result.jobs[1].employmentType).toBe("PART_TIME");
    expect(result.jobs[2].employmentType).toBe("INTERNSHIP");
  });

  it("should preserve original application URL and reject unsafe protocols", async () => {
    const mockPayload = [
      {
        id: "url-1",
        text: "Good Role",
        hostedUrl: "https://jobs.lever.co/testcorp/url-1",
      },
      {
        id: "url-2",
        text: "XSS Role",
        hostedUrl: "javascript:evil()",
        applyUrl: "data:text/html,bad",
      },
      {
        id: "url-3",
        text: "No URL Role",
        hostedUrl: "",
        applyUrl: "",
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].applicationUrl).toBe(
      "https://jobs.lever.co/testcorp/url-1"
    );
  });

  it("should preserve non-sensitive metadata", async () => {
    const mockPayload = [
      {
        id: "meta-1",
        text: "Metadata Role",
        hostedUrl: "https://jobs.lever.co/testcorp/meta-1",
        categories: {
          team: "Infrastructure",
          department: "Engineering",
          commitment: "Full-time",
          location: "Bengaluru",
          allLocations: ["Bengaluru", "Pune"],
        },
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await adapter.fetchJobs();
    const meta = result.jobs[0].metadata!;
    expect(meta.leverId).toBe("meta-1");
    expect(meta.companySlug).toBe("testcorp");
    expect(meta.team).toBe("Infrastructure");
    expect(meta.department).toBe("Engineering");
    expect(meta.commitment).toBe("Full-time");
    expect(meta.allLocations).toEqual(["Bengaluru", "Pune"]);
  });

  it("should handle missing optional fields gracefully", async () => {
    const mockPayload = [
      {
        id: "sparse-1",
        text: "Sparse Role",
        hostedUrl: "https://jobs.lever.co/testcorp/sparse-1",
        // No categories, description, lists, createdAt
      },
    ];

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
    expect(job.employmentType).toBeUndefined();
    expect(job.postedAt).toBeUndefined();
    expect(job.requiredSkills).toEqual([]);
    expect(job.salaryMin).toBeUndefined();
  });

  it("should handle malformed response payload safely", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ notAnArray: true }),
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.error).toContain("Unexpected payload structure");
  });

  it("should handle HTTP error responses gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.statusCode).toBe(429);
    expect(result.metadata?.error).toContain("Lever API returned HTTP 429");
  });

  it("should handle timeout gracefully", async () => {
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
      .mockRejectedValue(new Error("Network connection reset"));

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.error).toContain("Network connection reset");
  });

  it("should return unavailable and graceful error when companySlug is empty", async () => {
    const emptyAdapter = new LeverAdapter({
      companySlug: "",
      companyName: "Empty Co",
    });

    expect(await emptyAdapter.isAvailable()).toBe(false);

    const result = await emptyAdapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.error).toContain("Missing Lever company slug");
  });
});
