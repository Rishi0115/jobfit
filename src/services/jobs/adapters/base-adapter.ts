/**
 * Base Job Adapter — Abstract interface for all job source adapters.
 *
 * Every external job source (API, feed, ATS, mock) must implement this interface.
 * Adapters are replaceable and must NOT know about Prisma persistence.
 *
 * To be implemented in Phase 5 — Job Aggregation.
 */

import type { RawJob, FetchOptions, AdapterResult } from "./types";

// Re-export types for convenience
export type { RawJob, FetchOptions, AdapterResult };

export abstract class BaseJobAdapter {
  /** Unique identifier for this source (matches JobSource.name in DB) */
  abstract readonly sourceName: string;

  /** Human-readable display name */
  abstract readonly displayName: string;

  /** Source type: "api", "feed", "recruiter", "ats", "mock" */
  abstract readonly sourceType: string;

  /**
   * Fetch jobs from this source.
   * @param options - Optional fetch parameters (limit, offset, query, location)
   * @returns AdapterResult with array of RawJob
   */
  abstract fetchJobs(options?: FetchOptions): Promise<AdapterResult>;

  /**
   * Check if this adapter is currently available/configured.
   * For API adapters, this may check for required API keys.
   * For mock adapters, this always returns true.
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Optional: Get the base URL for this source (for display/linking purposes).
   */
  getBaseUrl(): string | undefined {
    return undefined;
  }
}
