import { describe, it, expect, vi, beforeEach } from "vitest";
import { JobSyncService } from "@/services/jobs/sync/job-sync-service";
import { BaseJobAdapter } from "@/services/jobs/adapters/base-adapter";
import type { AdapterResult, FetchOptions } from "@/services/jobs/adapters/types";

class DummyAdapter extends BaseJobAdapter {
  readonly sourceType = "api";
  readonly displayName = "Dummy Adapter";
  constructor(
    readonly sourceName: string,
    private readonly mockResult: () => Promise<AdapterResult>
  ) {
    super();
  }
  fetchJobs(_options?: FetchOptions): Promise<AdapterResult> {
    return this.mockResult();
  }
  async isAvailable(): Promise<boolean> {
    return true;
  }
}

describe("JobSyncService", () => {
  let mockIngest: any;
  let mockMarkExpired: any;
  let mockIngestionService: any;
  let mockExpirationService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockIngest = vi.fn();
    mockMarkExpired = vi.fn().mockResolvedValue({ expiredCount: 0 });

    mockIngestionService = {
      ingest: mockIngest,
    };
    mockExpirationService = {
      markExpiredJobs: mockMarkExpired,
    };
  });

  it("orchestrates multiple providers and aggregates statistics accurately", async () => {
    const adapterA = new DummyAdapter("provider-a", async () => ({ jobs: [] }));
    const adapterB = new DummyAdapter("provider-b", async () => ({ jobs: [] }));

    mockIngest.mockImplementation(async (adapter: BaseJobAdapter) => {
      if (adapter.sourceName === "provider-a") {
        return {
          source: "provider-a",
          fetched: 10,
          valid: 10,
          invalid: 0,
          created: 8,
          updated: 2,
          skipped: 0,
          failed: 0,
          errors: [],
          durationMs: 50,
        };
      }
      return {
        source: "provider-b",
        fetched: 5,
        valid: 4,
        invalid: 1,
        created: 4,
        updated: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        durationMs: 30,
      };
    });

    const syncService = new JobSyncService(
      async () => [adapterA, adapterB],
      mockIngestionService,
      mockExpirationService
    );

    const report = await syncService.runSync();

    expect(report.totalProviders).toBe(2);
    expect(report.successfulProviders).toBe(2);
    expect(report.failedProviders).toBe(0);
    expect(report.totalFetched).toBe(15);
    expect(report.totalValid).toBe(14);
    expect(report.totalInvalid).toBe(1);
    expect(report.totalCreated).toBe(12);
    expect(report.totalUpdated).toBe(2);
    expect(report.totalFailed).toBe(0);
    expect(mockMarkExpired).toHaveBeenCalledTimes(1);
  });

  it("isolates provider failures so one failure does not abort other providers", async () => {
    const failingAdapter = new DummyAdapter("broken-provider", async () => {
      throw new Error("Network timeout");
    });
    const healthyAdapter = new DummyAdapter("healthy-provider", async () => ({ jobs: [] }));

    mockIngest.mockImplementation(async (adapter: BaseJobAdapter) => {
      if (adapter.sourceName === "broken-provider") {
        throw new Error("Fatal fetch crash");
      }
      return {
        source: "healthy-provider",
        fetched: 3,
        valid: 3,
        invalid: 0,
        created: 3,
        updated: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        durationMs: 40,
      };
    });

    const syncService = new JobSyncService(
      async () => [failingAdapter, healthyAdapter],
      mockIngestionService,
      mockExpirationService
    );

    const report = await syncService.runSync();

    expect(report.totalProviders).toBe(2);
    expect(report.successfulProviders).toBe(1);
    expect(report.failedProviders).toBe(1);
    expect(report.totalFetched).toBe(3);
    expect(report.totalCreated).toBe(3);
    expect(report.totalFailed).toBe(1);

    const brokenStats = report.providerStats.find((p) => p.provider === "broken-provider");
    expect(brokenStats?.status).toBe("failed");
    expect(brokenStats?.failed).toBe(1);

    const healthyStats = report.providerStats.find((p) => p.provider === "healthy-provider");
    expect(healthyStats?.status).toBe("success");
    expect(healthyStats?.created).toBe(3);
  });

  it("does NOT falsely report a provider as successful when it returned zero jobs due to failure/error", async () => {
    const errorAdapter = new DummyAdapter("failing-api", async () => ({ jobs: [] }));

    mockIngest.mockResolvedValue({
      source: "failing-api",
      fetched: 0,
      valid: 0,
      invalid: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [
        {
          title: "API Error",
          errors: ["Adzuna API returned HTTP 500"],
        },
      ],
      durationMs: 20,
    });

    const syncService = new JobSyncService(
      async () => [errorAdapter],
      mockIngestionService,
      mockExpirationService
    );

    const report = await syncService.runSync();

    expect(report.totalProviders).toBe(1);
    expect(report.successfulProviders).toBe(0);
    expect(report.failedProviders).toBe(1);
    expect(report.providerStats[0].status).toBe("failed");
    expect(report.providerStats[0].errors).toHaveLength(1);
  });

  it("handles expiration errors gracefully without failing the sync run", async () => {
    const healthyAdapter = new DummyAdapter("provider-1", async () => ({ jobs: [] }));

    mockIngest.mockResolvedValue({
      source: "provider-1",
      fetched: 1,
      valid: 1,
      invalid: 0,
      created: 1,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      durationMs: 10,
    });

    mockMarkExpired.mockRejectedValue(new Error("Database deadlock during expiration"));

    const syncService = new JobSyncService(
      async () => [healthyAdapter],
      mockIngestionService,
      mockExpirationService
    );

    const report = await syncService.runSync();

    expect(report.successfulProviders).toBe(1);
    expect(report.totalCreated).toBe(1);
  });
});
