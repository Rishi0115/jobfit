/**
 * Job Adapter Types — Shared types for all job source adapters.
 *
 * 100% Prisma-independent. Adapters produce RawJob objects.
 */

import type {
  NormalizedWorkMode,
  NormalizedEmploymentType,
  NormalizedExperienceLevel,
} from "@/types/job";

/**
 * Raw job data as received from an external source.
 * Adapters produce these; the parser transforms them into NormalizedJob.
 */
export interface RawJob {
  externalId: string;
  title: string;
  company: string;
  companyWebsite?: string;
  description: string;
  location?: string;
  workMode?: NormalizedWorkMode | string;
  employmentType?: NormalizedEmploymentType | string;
  experienceLevel?: NormalizedExperienceLevel | string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  applicationUrl?: string;
  sourceUrl?: string;
  postedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Options for fetching jobs from an adapter.
 */
export interface FetchOptions {
  /** Maximum number of jobs to fetch */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Optional search query */
  query?: string;
  /** Optional location filter */
  location?: string;
}

/**
 * Result from an adapter fetch operation.
 */
export interface AdapterResult {
  jobs: RawJob[];
  totalAvailable?: number;
  hasMore?: boolean;
  metadata?: Record<string, unknown>;
}
