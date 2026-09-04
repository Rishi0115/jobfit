import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JobIngestionService } from "@/services/jobs/ingestion/job-ingestion-service";
import { RemotiveAdapter } from "@/services/jobs/adapters/remotive-adapter";
import { ArbeitnowAdapter } from "@/services/jobs/adapters/arbeitnow-adapter";
import { AdzunaAdapter } from "@/services/jobs/adapters/adzuna-adapter";
import { GreenhouseAdapter } from "@/services/jobs/adapters/greenhouse-adapter";
import { LeverAdapter } from "@/services/jobs/adapters/lever-adapter";
import { BaseJobAdapter } from "@/services/jobs/adapters/base-adapter";

// Mock database transactions
vi.mock("@/lib/db", () => {
  const mockCompany = {
    id: "comp-1",
    name: "Tech Solutions",
    normalizedName: "techsolutions",
    website: "https://example.com",
  };

  const mockJobSource = {
    id: "source-1",
    name: "remotive",
    type: "api",
  };

  const mockJob = {
    id: "job-1",
    title: "Fullstack Engineer",
  };

  const txMock = {
    company: {
      findFirst: vi.fn().mockResolvedValue(mockCompany),
      create: vi.fn().mockResolvedValue(mockCompany),
      update: vi.fn().mockResolvedValue(mockCompany),
    },
    job: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(mockJob),
      update: vi.fn().mockResolvedValue(mockJob),
    },
    skill: {
      findMany: vi.fn().mockResolvedValue([{ id: "sk-1", normalizedName: "react" }]),
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
        upsert: vi.fn().mockImplementation(({ where }) =>
          Promise.resolve({ ...mockJobSource, name: where.name })
        ),
      },
      $transaction: vi.fn(async (callback: (tx: typeof txMock) => unknown) => {
        return callback(txMock);
      }),
      _txMock: txMock,
    },
  };
});

describe("Real Job Providers Ingestion Integration", () => {
  let service: JobIngestionService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new JobIngestionService();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should verify both real adapters extend BaseJobAdapter", () => {
    const remotive = new RemotiveAdapter();
    const arbeitnow = new ArbeitnowAdapter();

    expect(remotive).toBeInstanceOf(BaseJobAdapter);
    expect(arbeitnow).toBeInstanceOf(BaseJobAdapter);
  });

  it("should successfully ingest jobs from Remotive through JobIngestionService", async () => {
    const mockRemotivePayload = {
      "job-count": 1,
      jobs: [
        {
          id: 7771,
          url: "https://remotive.com/remote-jobs/software-dev/react-lead-7771",
          title: "Lead Frontend Engineer",
          company_name: "Remotive Partner",
          tags: ["react", "typescript"],
          job_type: "full_time",
          description: "Develop enterprise UI components.",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRemotivePayload,
    } as Response);

    const adapter = new RemotiveAdapter();
    const result = await service.ingest(adapter);

    expect(result.source).toBe("remotive");
    expect(result.fetched).toBe(1);
    expect(result.valid).toBe(1);
    expect(result.created).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("should successfully ingest jobs from Arbeitnow through JobIngestionService", async () => {
    const mockArbeitnowPayload = {
      data: [
        {
          slug: "senior-devops-engineer-992",
          company_name: "Cloud Scaling GmbH",
          title: "Senior DevOps Engineer",
          description: "Maintain Kubernetes and Terraform pipelines.",
          remote: true,
          url: "https://www.arbeitnow.com/jobs/companies/cloud/devops-992",
          tags: ["Docker", "Kubernetes", "AWS"],
          job_types: ["full_time"],
        },
      ],
      links: {},
      meta: { total: 1 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockArbeitnowPayload,
    } as Response);

    const adapter = new ArbeitnowAdapter();
    const result = await service.ingest(adapter);

    expect(result.source).toBe("arbeitnow");
    expect(result.fetched).toBe(1);
    expect(result.valid).toBe(1);
    expect(result.created).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("should isolate provider failure so that an error in one provider does not crash the pipeline", async () => {
    // 1. Remotive returns 500 error
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    const remotiveAdapter = new RemotiveAdapter();
    const remotiveResult = await service.ingest(remotiveAdapter);

    expect(remotiveResult.fetched).toBe(0);
    expect(remotiveResult.created).toBe(0);
    expect(remotiveResult.failed).toBe(0); // Gracefully returns 0 jobs without throwing

    // 2. Next, Arbeitnow runs and succeeds normally
    const mockArbeitnowPayload = {
      data: [
        {
          slug: "python-backend-engineer-331",
          company_name: "Fintech Co",
          title: "Python Backend Engineer",
          description: "Build payment APIs with FastAPI.",
          remote: true,
          url: "https://www.arbeitnow.com/jobs/fintech/python-331",
          tags: ["Python", "FastAPI"],
          job_types: ["full_time"],
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockArbeitnowPayload,
    } as Response);

    const arbeitnowAdapter = new ArbeitnowAdapter();
    const arbeitnowResult = await service.ingest(arbeitnowAdapter);

    expect(arbeitnowResult.fetched).toBe(1);
    expect(arbeitnowResult.created).toBe(1);
  });

  it("should successfully ingest jobs from Adzuna through JobIngestionService", async () => {
    process.env.ADZUNA_APP_ID = "mock-id";
    process.env.ADZUNA_APP_KEY = "mock-key";

    const mockAdzunaPayload = {
      count: 1,
      results: [
        {
          id: "adzuna-881",
          title: "Fullstack Developer",
          company: { display_name: "TCS" },
          description: "Build frontend in React and backend in Spring.",
          location: { display_name: "Pune, Maharashtra" },
          salary_min: 700000,
          salary_max: 1200000,
          redirect_url: "https://www.adzuna.in/land/ad/881",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockAdzunaPayload,
    } as Response);

    const adapter = new AdzunaAdapter();
    const result = await service.ingest(adapter);

    expect(result.source).toBe("adzuna-in");
    expect(result.fetched).toBe(1);
    expect(result.valid).toBe(1);
    expect(result.created).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("should successfully ingest jobs from Greenhouse through JobIngestionService", async () => {
    const mockGreenhousePayload = {
      jobs: [
        {
          id: 9901,
          title: "Platform Engineer",
          absolute_url: "https://boards.greenhouse.io/testco/jobs/9901",
          location: { name: "Bengaluru, India" },
          content: "<p>Build platform services.</p>",
          departments: [{ name: "Engineering" }],
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockGreenhousePayload,
    } as Response);

    const adapter = new GreenhouseAdapter({
      boardToken: "testco",
      companyName: "TestCo",
    });
    const result = await service.ingest(adapter);

    expect(result.source).toBe("greenhouse:testco");
    expect(result.fetched).toBe(1);
    expect(result.valid).toBe(1);
    expect(result.created).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("should successfully ingest jobs from Lever through JobIngestionService", async () => {
    const mockLeverPayload = [
      {
        id: "lever-uuid-001",
        text: "Mobile Engineer",
        hostedUrl: "https://jobs.lever.co/testcorp/lever-uuid-001",
        categories: {
          team: "Mobile",
          location: "Hyderabad, India",
          commitment: "Full-time",
        },
        descriptionPlain: "Build native apps.",
        createdAt: 1724580000000,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockLeverPayload,
    } as Response);

    const adapter = new LeverAdapter({
      companySlug: "testcorp",
      companyName: "TestCorp",
    });
    const result = await service.ingest(adapter);

    expect(result.source).toBe("lever:testcorp");
    expect(result.fetched).toBe(1);
    expect(result.valid).toBe(1);
    expect(result.created).toBe(1);
    expect(result.failed).toBe(0);
  });
});
