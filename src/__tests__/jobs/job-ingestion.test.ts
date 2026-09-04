import { describe, it, expect, vi, beforeEach } from "vitest";
import { JobIngestionService } from "@/services/jobs/ingestion/job-ingestion-service";
import { BaseJobAdapter } from "@/services/jobs/adapters/base-adapter";
import type { AdapterResult, RawJob } from "@/services/jobs/adapters/types";

// Mock the database client
vi.mock("@/lib/db", () => {
  const mockCompany = {
    id: "comp-1",
    name: "TechCorp Solutions",
    normalizedName: "techcorp",
    website: "https://techcorp.example.com",
  };

  const mockJobSource = {
    id: "source-1",
    name: "test-adapter",
    type: "mock",
  };

  const mockJob = {
    id: "job-1",
    title: "Software Engineer",
  };

  const txMock = {
    company: {
      findFirst: vi.fn().mockResolvedValue(mockCompany),
      create: vi.fn().mockResolvedValue(mockCompany),
      update: vi.fn().mockResolvedValue(mockCompany),
    },
    job: {
      findFirst: vi.fn().mockResolvedValue(null), // simulate new job
      create: vi.fn().mockResolvedValue(mockJob),
      update: vi.fn().mockResolvedValue(mockJob),
    },
    skill: {
      findMany: vi.fn().mockResolvedValue([{ id: "skill-1", normalizedName: "react" }]),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    jobSkill: {
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };

  return {
    db: {
      jobSource: {
        upsert: vi.fn().mockResolvedValue(mockJobSource),
      },
      $transaction: vi.fn(async (callback: (tx: typeof txMock) => unknown) => {
        return callback(txMock);
      }),
      _txMock: txMock,
    },
  };
});

// A test adapter with controlled data
class TestAdapter extends BaseJobAdapter {
  readonly sourceName = "test-adapter";
  readonly displayName = "Test Adapter";
  readonly sourceType = "mock";
  private mockJobs: RawJob[];

  constructor(jobs: RawJob[]) {
    super();
    this.mockJobs = jobs;
  }

  async fetchJobs(): Promise<AdapterResult> {
    return {
      jobs: this.mockJobs,
      totalAvailable: this.mockJobs.length,
      hasMore: false,
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

describe("Job Ingestion Pipeline", () => {
  let service: JobIngestionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new JobIngestionService();
  });

  it("should handle empty adapter output gracefully", async () => {
    const adapter = new TestAdapter([]);
    const result = await service.ingest(adapter);

    expect(result.source).toBe("test-adapter");
    expect(result.fetched).toBe(0);
    expect(result.valid).toBe(0);
    expect(result.created).toBe(0);
    expect(result.errors).toEqual([]);
  });

  it("should process valid jobs and report accurate counts", async () => {
    const jobs: RawJob[] = [
      {
        externalId: "test-001",
        title: "Frontend Developer",
        company: "TechCorp Solutions",
        description: "Build interfaces with React and TypeScript.",
        applicationUrl: "https://example.com/apply/1",
        requiredSkills: ["React", "TypeScript"],
      },
      {
        externalId: "test-002",
        title: "Backend Engineer",
        company: "TechCorp Solutions",
        description: "Build services with Node.js and PostgreSQL.",
        applicationUrl: "https://example.com/apply/2",
        requiredSkills: ["Node.js", "PostgreSQL"],
      },
    ];

    const adapter = new TestAdapter(jobs);
    const result = await service.ingest(adapter);

    expect(result.fetched).toBe(2);
    expect(result.valid).toBe(2);
    expect(result.invalid).toBe(0);
    expect(result.created).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should isolate invalid jobs without aborting the batch", async () => {
    const jobs: RawJob[] = [
      {
        externalId: "valid-001",
        title: "Valid Developer",
        company: "GoodCo",
        description: "Valid job description.",
        applicationUrl: "https://goodco.com/apply",
      },
      {
        externalId: "invalid-002",
        title: "", // Missing required title
        company: "BadCo",
        description: "No title provided.",
        applicationUrl: "https://badco.com/apply",
      },
      {
        externalId: "invalid-003",
        title: "Bad URL Job",
        company: "BadCo",
        description: "Invalid URL.",
        applicationUrl: "not-a-url",
      },
    ];

    const adapter = new TestAdapter(jobs);
    const result = await service.ingest(adapter);

    expect(result.fetched).toBe(3);
    expect(result.valid).toBe(1);
    expect(result.invalid).toBe(2);
    expect(result.created).toBe(1);
    expect(result.errors.length).toBe(2);

    const errorIds = result.errors.map((e) => e.externalJobId);
    expect(errorIds).toContain("invalid-002");
    expect(errorIds).toContain("invalid-003");
  });

  it("should deduplicate jobs within the same batch before persistence", async () => {
    const jobs: RawJob[] = [
      {
        externalId: "dup-001",
        title: "Original Title",
        company: "Acme",
        description: "First version",
        applicationUrl: "https://acme.com/apply",
      },
      {
        externalId: "dup-001", // Duplicate ID
        title: "Updated Title",
        company: "Acme",
        description: "Second version",
        applicationUrl: "https://acme.com/apply",
      },
    ];

    const adapter = new TestAdapter(jobs);
    const result = await service.ingest(adapter);

    expect(result.fetched).toBe(2);
    expect(result.valid).toBe(2);
    // After batch dedup, only 1 unique job should be persisted
    expect(result.created).toBe(1);
  });
});
