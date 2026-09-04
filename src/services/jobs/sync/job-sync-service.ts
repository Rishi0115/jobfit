// src/services/jobs/sync/job-sync-service.ts
import { BaseJobAdapter } from "@/services/jobs/adapters/base-adapter";
import { JobIngestionService } from "@/services/jobs/ingestion/job-ingestion-service";
import { JobExpirationService } from "@/services/jobs/job-expiration-service";
import {
  getAvailableJobAdapters,
  ProviderSyncStats,
  SyncReport,
} from "@/services/jobs/registry/provider-registry";

export class JobSyncService {
  private readonly adaptersProvider: () => Promise<BaseJobAdapter[]>;
  private readonly ingestionService: JobIngestionService;
  private readonly expirationService: JobExpirationService;

  constructor(
    adaptersProvider: () => Promise<BaseJobAdapter[]> = getAvailableJobAdapters,
    ingestionService: JobIngestionService = new JobIngestionService(),
    expirationService: JobExpirationService = new JobExpirationService()
  ) {
    this.adaptersProvider = adaptersProvider;
    this.ingestionService = ingestionService;
    this.expirationService = expirationService;
  }

  async runSync(): Promise<SyncReport> {
    const adapters = await this.adaptersProvider();
    const providerStats: ProviderSyncStats[] = [];
    let totalFetched = 0,
      totalValid = 0,
      totalInvalid = 0,
      totalCreated = 0,
      totalUpdated = 0,
      totalSkipped = 0,
      totalFailed = 0;

    for (const adapter of adapters) {
      const stats: ProviderSyncStats = {
        provider: adapter.sourceName,
        status: "success",
        fetched: 0,
        valid: 0,
        invalid: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      };

      try {
        const result = await this.ingestionService.ingest(adapter);
        stats.fetched = result.fetched;
        stats.valid = result.valid;
        stats.invalid = result.invalid;
        stats.created = result.created;
        stats.updated = result.updated;
        stats.skipped = result.skipped;
        stats.failed = result.failed;
        stats.errors = result.errors ?? [];

        // If provider returned errors or failed persistence items, mark as failed
        if (result.errors.length > 0 || result.failed > 0) {
          stats.status = "failed";
        }

        totalFetched += result.fetched;
        totalValid += result.valid;
        totalInvalid += result.invalid;
        totalCreated += result.created;
        totalUpdated += result.updated;
        totalSkipped += result.skipped;
        totalFailed += result.failed;
      } catch (err) {
        stats.status = "failed";
        stats.failed = 1;
        stats.errors = [
          { error: err instanceof Error ? err.message : String(err) },
        ];
        totalFailed += 1;
      }

      providerStats.push(stats);
    }

    try {
      await this.expirationService.markExpiredJobs();
    } catch (e) {
      console.warn("[JobSyncService] Expiration failed:", e);
    }

    const successfulProviders = providerStats.filter(
      (s) => s.status === "success"
    ).length;
    const failedProviders = providerStats.length - successfulProviders;

    return {
      totalProviders: providerStats.length,
      successfulProviders,
      failedProviders,
      providerStats,
      totalFetched,
      totalValid,
      totalInvalid,
      totalCreated,
      totalUpdated,
      totalSkipped,
      totalFailed,
    };
  }
}
