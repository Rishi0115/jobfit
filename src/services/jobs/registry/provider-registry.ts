import { BaseJobAdapter } from "@/services/jobs/adapters/base-adapter";
import { MockJobAdapter } from "@/services/jobs/adapters/mock-adapter";
import { RemotiveAdapter } from "@/services/jobs/adapters/remotive-adapter";
import { ArbeitnowAdapter } from "@/services/jobs/adapters/arbeitnow-adapter";
import { AdzunaAdapter } from "@/services/jobs/adapters/adzuna-adapter";
import { GreenhouseAdapter } from "@/services/jobs/adapters/greenhouse-adapter";
import { LeverAdapter } from "@/services/jobs/adapters/lever-adapter";
import {
  GREENHOUSE_BOARDS,
  LEVER_BOARDS,
} from "@/services/jobs/adapters/ats-board-config";

/**
 * Returns the list of job adapters that are available and should be used for a sync run.
 * - Real API adapters (Remotive, Arbeitnow, Adzuna)
 * - Curated ATS job boards (Greenhouse, Lever)
 * - MockJobAdapter is ONLY included in development/test when NODE_ENV !== "production".
 * - Never includes MockJobAdapter in production.
 */
export async function getAvailableJobAdapters(): Promise<BaseJobAdapter[]> {
  const adapters: BaseJobAdapter[] = [];

  const candidateAdapters: BaseJobAdapter[] = [
    new RemotiveAdapter(),
    new ArbeitnowAdapter(),
    new AdzunaAdapter(),
    ...GREENHOUSE_BOARDS.map((config) => new GreenhouseAdapter(config)),
    ...LEVER_BOARDS.map((config) => new LeverAdapter(config)),
  ];

  for (const adapter of candidateAdapters) {
    try {
      const isAvail = await adapter.isAvailable();
      if (isAvail) {
        adapters.push(adapter);
      }
    } catch {
      // Exclude if availability check fails
    }
  }

  // Mock adapter is strictly barred from production
  if (process.env.NODE_ENV !== "production") {
    const mock = new MockJobAdapter();
    try {
      if (await mock.isAvailable()) {
        adapters.push(mock);
      }
    } catch {
      // Ignore
    }
  }

  return adapters;
}

export interface ProviderSyncStats {
  provider: string;
  status: "success" | "failed";
  fetched: number;
  valid: number;
  invalid: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: any[];
}

export interface SyncReport {
  totalProviders: number;
  successfulProviders: number;
  failedProviders: number;
  providerStats: ProviderSyncStats[];
  totalFetched: number;
  totalValid: number;
  totalInvalid: number;
  totalCreated: number;
  totalUpdated: number;
  totalSkipped: number;
  totalFailed: number;
}
