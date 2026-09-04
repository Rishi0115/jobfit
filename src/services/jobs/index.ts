/**
 * Job Services — Public API barrel file.
 *
 * Exports all job-related services, adapters, and utilities.
 */

// Adapters
export { BaseJobAdapter } from "./adapters/base-adapter";
export { MockJobAdapter } from "./adapters/mock-adapter";
export { RemotiveAdapter } from "./adapters/remotive-adapter";
export { ArbeitnowAdapter } from "./adapters/arbeitnow-adapter";
export { AdzunaAdapter } from "./adapters/adzuna-adapter";
export { GreenhouseAdapter } from "./adapters/greenhouse-adapter";
export { LeverAdapter } from "./adapters/lever-adapter";
export { sanitizeApplicationUrl } from "./adapters/url-sanitizer";
export { CompanyCareersAdapter } from "./adapters/company-careers-adapter";
export type { RawJob, FetchOptions, AdapterResult } from "./adapters/types";
export type { CompanyCareersConfig } from "./adapters/company-careers-adapter";
export type { GreenhouseBoardConfig, LeverBoardConfig } from "./adapters/ats-board-config";
export { GREENHOUSE_BOARDS, LEVER_BOARDS } from "./adapters/ats-board-config";

// Ingestion
export { JobIngestionService } from "./ingestion/job-ingestion-service";
export { normalizeJob, normalizeTitle, normalizeCompanyName, normalizeSkills } from "./ingestion/job-normalizer";
export { deduplicateJobs } from "./ingestion/job-deduplicator";

// Parsers
export { validateJob, validateJobs } from "./parsers/job-validator";
export { parseRawJob, parseRawJobs } from "./parsers/job-parser";

// Expiration
export { JobExpirationService } from "./job-expiration-service";

// Sync & Registry
export { JobSyncService } from "./sync/job-sync-service";
export { getAvailableJobAdapters } from "./registry/provider-registry";
export type { ProviderSyncStats, SyncReport } from "./registry/provider-registry";
