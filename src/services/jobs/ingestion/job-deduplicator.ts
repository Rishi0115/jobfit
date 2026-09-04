/**
 * Job Deduplicator — In-batch deduplication for job ingestion.
 *
 * Uses source + externalJobId as the primary identity key.
 * Database-level deduplication relies on @@unique([sourceId, externalJobId]).
 */

import type { NormalizedJob } from "@/types/job";

export interface DeduplicationResult {
  unique: NormalizedJob[];
  duplicatesRemoved: number;
}

/**
 * Deduplicate a batch of jobs by source + externalJobId.
 * Last occurrence wins (later entries override earlier ones).
 */
export function deduplicateJobs(jobs: NormalizedJob[]): DeduplicationResult {
  const seen = new Map<string, NormalizedJob>();

  for (const job of jobs) {
    const key = createDeduplicationKey(job.source, job.externalJobId);
    seen.set(key, job); // Last write wins
  }

  const unique = Array.from(seen.values());
  const duplicatesRemoved = jobs.length - unique.length;

  return { unique, duplicatesRemoved };
}

/**
 * Create a deduplication key from source and external job ID.
 */
export function createDeduplicationKey(
  source: string,
  externalJobId: string
): string {
  return `${source.toLowerCase()}::${externalJobId}`;
}
