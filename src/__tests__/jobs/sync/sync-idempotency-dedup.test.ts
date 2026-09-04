import { describe, it, expect, vi, beforeEach } from "vitest";
import { JobIngestionService } from "@/services/jobs/ingestion/job-ingestion-service";
import { BaseJobAdapter } from "@/services/jobs/adapters/base-adapter";
import type { RawJob, AdapterResult } from "@/services/jobs/adapters/types";

// Mock database transactions
let dbJobs: any[] = [];
let dbCompanies: any[] = [];
let dbSkills: any[] = [];
let dbJobSkills: any[] = [];
let dbSources: any[] = [];

vi.mock("@/lib/db", () => {
  const txMock = {
    company: {
      findFirst: vi.fn(async ({ where }) => {
        return (
          dbCompanies.find(
            (c) => c.normalizedName === where.normalizedName && !c.deletedAt
          ) || null
        );
      }),
      create: vi.fn(async ({ data }) => {
        const comp = { id: `comp-${dbCompanies.length + 1}`, ...data };
        dbCompanies.push(comp);
        return comp;
      }),
      update: vi.fn(async ({ where, data }) => {
        const comp = dbCompanies.find((c) => c.id === where.id);
        if (comp) Object.assign(comp, data);
        return comp;
      }),
    },
    job: {
      findFirst: vi.fn(async ({ where }) => {
        return (
          dbJobs.find(
            (j) =>
              j.sourceId === where.sourceId &&
              j.externalJobId === where.externalJobId
          ) || null
        );
      }),
      create: vi.fn(async ({ data }) => {
        const job = { id: `job-${dbJobs.length + 1}`, ...data };
        dbJobs.push(job);
        return job;
      }),
      update: vi.fn(async ({ where, data }) => {
        const job = dbJobs.find((j) => j.id === where.id);
        if (job) Object.assign(job, data);
        return job;
      }),
    },
    skill: {
      findMany: vi.fn(async () => dbSkills),
      createMany: vi.fn(async ({ data }) => {
        for (const s of data) {
          dbSkills.push({ id: `sk-${dbSkills.length + 1}`, ...s });
        }
        return { count: data.length };
      }),
    },
    jobSkill: {
      findMany: vi.fn(async ({ where }) =>
        dbJobSkills.filter((js) => js.jobId === where.jobId)
      ),
      createMany: vi.fn(async ({ data }) => {
        dbJobSkills.push(...data);
        return { count: data.length };
      }),
    },
  };

  return {
    db: {
      jobSource: {
        upsert: vi.fn(async ({ where, create }) => {
          let source = dbSources.find((s) => s.name === where.name);
          if (!source) {
            source = { id: `src-${dbSources.length + 1}`, ...create };
            dbSources.push(source);
          }
          return source;
        }),
      },
      $transaction: vi.fn(async (callback: (tx: typeof txMock) => unknown) => {
        return callback(txMock);
      }),
    },
  };
});

class TestAdapter extends BaseJobAdapter {
  readonly sourceType = "api";
  readonly displayName = "Test Adapter";
  constructor(
    readonly sourceName: string,
    private readonly jobsToReturn: RawJob[]
  ) {
    super();
  }
  async fetchJobs(): Promise<AdapterResult> {
    return { jobs: this.jobsToReturn };
  }
  async isAvailable(): Promise<boolean> {
    return true;
  }
}

describe("Sync Idempotency and Provider-Scoped Deduplication", () => {
  let ingestionService: JobIngestionService;

  beforeEach(() => {
    dbJobs = [];
    dbCompanies = [];
    dbSkills = [];
    dbJobSkills = [];
    dbSources = [];
    ingestionService = new JobIngestionService();
  });

  it("treats externalId as provider-scoped: identical externalId from two different providers are NOT merged", async () => {
    // Provider 1: Remotive with externalId 'job-100'
    const remotiveJob: RawJob = {
      externalId: "job-100",
      title: "Backend Engineer",
      company: "Acme Corp",
      description: "Remotive job description",
      applicationUrl: "https://remotive.com/job-100",
    };
    const remotiveAdapter = new TestAdapter("remotive", [remotiveJob]);

    // Provider 2: Adzuna with the EXACT SAME externalId 'job-100'
    const adzunaJob: RawJob = {
      externalId: "job-100",
      title: "Data Engineer",
      company: "Beta Inc",
      description: "Adzuna job description",
      applicationUrl: "https://adzuna.in/job-100",
    };
    const adzunaAdapter = new TestAdapter("adzuna-in", [adzunaJob]);

    // Ingest both
    const res1 = await ingestionService.ingest(remotiveAdapter);
    const res2 = await ingestionService.ingest(adzunaAdapter);

    expect(res1.created).toBe(1);
    expect(res2.created).toBe(1);

    // Both jobs exist independently in dbJobs with different sourceId
    expect(dbJobs).toHaveLength(2);
    expect(dbJobs[0].externalJobId).toBe("job-100");
    expect(dbJobs[1].externalJobId).toBe("job-100");
    expect(dbJobs[0].sourceId).not.toBe(dbJobs[1].sourceId);
    expect(dbJobs[0].title).toBe("Backend Engineer");
    expect(dbJobs[1].title).toBe("Data Engineer");
  });

  it("re-running the same provider sync is idempotent: updates existing jobs rather than duplicating", async () => {
    const originalJob: RawJob = {
      externalId: "job-200",
      title: "Frontend Developer",
      company: "Stripe",
      description: "Initial description",
      applicationUrl: "https://stripe.com/jobs/200",
    };
    const adapter1 = new TestAdapter("greenhouse:stripe", [originalJob]);

    // First ingestion: created
    const res1 = await ingestionService.ingest(adapter1);
    expect(res1.created).toBe(1);
    expect(res1.updated).toBe(0);
    expect(dbJobs).toHaveLength(1);
    expect(dbJobs[0].description).toBe("Initial description");

    // Second ingestion with updated description
    const updatedJob: RawJob = {
      externalId: "job-200",
      title: "Frontend Developer",
      company: "Stripe",
      description: "Updated description with more details",
      applicationUrl: "https://stripe.com/jobs/200",
    };
    const adapter2 = new TestAdapter("greenhouse:stripe", [updatedJob]);

    const res2 = await ingestionService.ingest(adapter2);
    expect(res2.created).toBe(0);
    expect(res2.updated).toBe(1);

    // Still only 1 job in database, but updated!
    expect(dbJobs).toHaveLength(1);
    expect(dbJobs[0].description).toBe("Updated description with more details");
  });

  it("reuses existing company record based on normalized company name", async () => {
    const job1: RawJob = {
      externalId: "job-301",
      title: "Fullstack Engineer",
      company: "Google LLC",
      description: "Desc",
      applicationUrl: "https://example.com/1",
    };
    const job2: RawJob = {
      externalId: "job-302",
      title: "Cloud Architect",
      company: "Google Inc.", // Alternate suffix normalizes to same company "google"
      description: "Desc",
      applicationUrl: "https://example.com/2",
    };

    const adapter = new TestAdapter("remotive", [job1, job2]);
    await ingestionService.ingest(adapter);

    expect(dbJobs).toHaveLength(2);
    // Both jobs point to the single normalized Company record
    expect(dbCompanies).toHaveLength(1);
    expect(dbJobs[0].companyId).toBe(dbJobs[1].companyId);
  });
});
