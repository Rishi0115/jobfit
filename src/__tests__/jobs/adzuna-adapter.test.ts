import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AdzunaAdapter } from "@/services/jobs/adapters/adzuna-adapter";
import { BaseJobAdapter } from "@/services/jobs/adapters/base-adapter";

describe("AdzunaAdapter (India Market)", () => {
  let adapter: AdzunaAdapter;
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ADZUNA_APP_ID: "mock-app-id-123",
      ADZUNA_APP_KEY: "mock-app-key-xyz",
    };
    adapter = new AdzunaAdapter();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it("1. should satisfy BaseJobAdapter contract and declare correct sourceName & metadata", async () => {
    expect(adapter).toBeInstanceOf(BaseJobAdapter);
    expect(adapter.sourceName).toBe("adzuna-in");
    expect(adapter.sourceType).toBe("api");
    expect(adapter.displayName).toBe("Adzuna India");
    expect(adapter.getBaseUrl()).toBe("https://www.adzuna.in");
    expect(await adapter.isAvailable()).toBe(true);
  });

  it("2. should map valid Adzuna India job response to RawJob format", async () => {
    const mockPayload = {
      count: 1,
      results: [
        {
          id: "4920192831",
          title: "Senior Full Stack Engineer (Node / React)",
          company: { display_name: "Swiggy" },
          description: "Develop high-scale food delivery backend and web platforms.",
          location: {
            display_name: "Bengaluru, Karnataka",
            area: ["India", "Karnataka", "Bengaluru"],
          },
          salary_min: 1800000,
          salary_max: 2800000,
          salary_is_predicted: 0,
          contract_type: "permanent",
          contract_time: "full_time",
          category: { label: "IT Jobs", tag: "it-jobs" },
          redirect_url: "https://www.adzuna.in/land/ad/4920192831?v=ABC123XYZ",
          created: "2026-08-20T10:30:00Z",
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
    expect(job.externalId).toBe("4920192831");
    expect(job.title).toBe("Senior Full Stack Engineer (Node / React)");
    expect(job.company).toBe("Swiggy");
    expect(job.location).toBe("Bengaluru, Karnataka");
    expect(job.workMode).toBe("ONSITE");
    expect(job.employmentType).toBe("FULL_TIME");
    expect(job.salaryMin).toBe(1800000);
    expect(job.salaryMax).toBe(2800000);
    expect(job.salaryCurrency).toBe("INR");
    expect(job.applicationUrl).toBe("https://www.adzuna.in/land/ad/4920192831?v=ABC123XYZ");
    expect(job.sourceUrl).toBe("https://www.adzuna.in/land/ad/4920192831?v=ABC123XYZ");
    expect(job.postedAt).toEqual(new Date("2026-08-20T10:30:00Z"));
    expect(job.metadata?.adzunaId).toBe("4920192831");
    expect(job.metadata?.category).toBe("IT Jobs");
  });

  it("3. should map multiple jobs from response correctly", async () => {
    const mockPayload = {
      count: 2,
      results: [
        {
          id: "101",
          title: "Frontend Developer",
          company: { display_name: "Razorpay" },
          redirect_url: "https://www.adzuna.in/land/ad/101",
        },
        {
          id: "102",
          title: "Backend Developer",
          company: { display_name: "Zepto" },
          redirect_url: "https://www.adzuna.in/land/ad/102",
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
    expect(result.jobs[0].title).toBe("Frontend Developer");
    expect(result.jobs[1].title).toBe("Backend Developer");
  });

  it("4. should resolve remote vs hybrid vs onsite workMode appropriately", async () => {
    const mockPayload = {
      results: [
        {
          id: "w-1",
          title: "Remote React Developer (Work from Home)",
          company: { display_name: "Tech Co" },
          redirect_url: "https://www.adzuna.in/land/ad/w-1",
          location: { display_name: "India" },
        },
        {
          id: "w-2",
          title: "Hybrid Java Engineer",
          company: { display_name: "Finance Co" },
          redirect_url: "https://www.adzuna.in/land/ad/w-2",
          location: { display_name: "Hyderabad, Telangana" },
        },
        {
          id: "w-3",
          title: "Software Engineer",
          company: { display_name: "Product Co" },
          redirect_url: "https://www.adzuna.in/land/ad/w-3",
          location: { display_name: "Pune, Maharashtra" },
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

  it("5. should accurately map contract time and contract type to employmentType", async () => {
    const mockPayload = {
      results: [
        {
          id: "e-1",
          title: "Contract DevOps Engineer",
          company: { display_name: "Co A" },
          redirect_url: "https://www.adzuna.in/land/ad/e-1",
          contract_type: "contract",
        },
        {
          id: "e-2",
          title: "Part-Time QA Engineer",
          company: { display_name: "Co B" },
          redirect_url: "https://www.adzuna.in/land/ad/e-2",
          contract_time: "part_time",
        },
        {
          id: "e-3",
          title: "Software Engineer Intern",
          company: { display_name: "Co C" },
          redirect_url: "https://www.adzuna.in/land/ad/e-3",
          contract_type: "internship",
        },
      ],
    };

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

  it("6. should preserve original valid application URL and reject unsafe protocols", async () => {
    const mockPayload = {
      results: [
        {
          id: "safe-1",
          title: "Good Job",
          company: { display_name: "Good Inc" },
          redirect_url: "https://www.adzuna.in/land/ad/safe-1",
        },
        {
          id: "bad-1",
          title: "XSS Job",
          company: { display_name: "Evil Inc" },
          redirect_url: "javascript:evil()",
        },
        {
          id: "bad-2",
          title: "Relative Job",
          company: { display_name: "Relative Inc" },
          redirect_url: "/local/link",
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
    expect(result.jobs[0].externalId).toBe("safe-1");
    expect(result.jobs[0].applicationUrl).toBe("https://www.adzuna.in/land/ad/safe-1");
  });

  it("7. should NEVER leak API credentials in returned metadata", async () => {
    const mockPayload = {
      count: 1,
      results: [
        {
          id: "sec-1",
          title: "Security Engineer",
          company: { display_name: "Secure Co" },
          redirect_url: "https://www.adzuna.in/land/ad/sec-1",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await adapter.fetchJobs();
    const metadataStr = JSON.stringify(result.jobs[0].metadata || {});
    expect(metadataStr).not.toContain("mock-app-id-123");
    expect(metadataStr).not.toContain("mock-app-key-xyz");
  });

  it("8. should handle missing credentials by returning false for isAvailable and graceful error in fetchJobs", async () => {
    delete process.env.ADZUNA_APP_ID;
    delete process.env.ADZUNA_APP_KEY;

    const noKeyAdapter = new AdzunaAdapter();
    expect(await noKeyAdapter.isAvailable()).toBe(false);

    const result = await noKeyAdapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.error).toContain("Missing Adzuna credentials");
  });

  it("9. should encode search query and apply limit correctly to request URL", async () => {
    let capturedUrl = "";
    global.fetch = vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ count: 0, results: [] }),
      } as Response);
    });

    await adapter.fetchJobs({ query: "React & Node.js Developer", limit: 35 });

    expect(capturedUrl).toContain("what=React+%26+Node.js+Developer");
    expect(capturedUrl).toContain("results_per_page=35");
    expect(capturedUrl).toContain("app_id=mock-app-id-123");
    expect(capturedUrl).toContain("app_key=mock-app-key-xyz");
  });

  it("10. should handle missing optional fields gracefully without fabricating data", async () => {
    const mockPayload = {
      results: [
        {
          id: "sparse-1",
          title: "Junior Developer",
          company: { display_name: "Startup" },
          redirect_url: "https://www.adzuna.in/land/ad/sparse-1",
          // No salary, location, contract_type, description, or created
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
    expect(job.salaryMin).toBeUndefined();
    expect(job.salaryMax).toBeUndefined();
    expect(job.salaryCurrency).toBeUndefined();
    expect(job.employmentType).toBeUndefined();
    expect(job.postedAt).toBeUndefined();
  });

  it("11. should handle malformed response payload safely", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ wrongProperty: [] }),
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.error).toContain("Unexpected payload structure");
  });

  it("12. should handle HTTP 400 Bad Request gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.statusCode).toBe(400);
  });

  it("13. should handle HTTP 401 Unauthorized gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.statusCode).toBe(401);
  });

  it("14. should handle HTTP 429 Rate Limit Exceeded gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.statusCode).toBe(429);
  });

  it("15. should handle HTTP 500 Internal Server Error gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.statusCode).toBe(500);
  });

  it("16. should handle timeout or network abort gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("The operation was aborted due to timeout"));

    const result = await adapter.fetchJobs();
    expect(result.jobs).toEqual([]);
    expect(result.metadata?.error).toContain("aborted due to timeout");
  });
});
