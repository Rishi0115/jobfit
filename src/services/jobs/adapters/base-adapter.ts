/**
 * Job Aggregation Service — Foundation
 * Source-independent job aggregation using the adapter pattern.
 * All sources must implement BaseJobAdapter.
 * 
 * To be implemented in Phase 4 — Job System.
 */

export interface RawJob {
  externalId: string;
  title: string;
  company: string;
  description: string;
  location?: string;
  applicationUrl?: string;
  postedAt?: Date;
}

export abstract class BaseJobAdapter {
  abstract readonly sourceName: string;
  abstract fetchJobs(): Promise<RawJob[]>;
  abstract isAvailable(): Promise<boolean>;
}
