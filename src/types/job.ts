/**
 * Job Types — Normalized internal representations
 *
 * These types are 100% Prisma-independent. Adapters produce NormalizedJob,
 * and the ingestion service maps them to Prisma models.
 */

// ─── Prisma-Independent Enums / Unions ───

export type NormalizedWorkMode = "REMOTE" | "HYBRID" | "ONSITE";

export type NormalizedEmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP";

export type NormalizedExperienceLevel =
  | "FRESHER"
  | "JUNIOR"
  | "MID"
  | "SENIOR"
  | "LEAD";

export type NormalizedJobStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "EXPIRED";

// ─── Normalized Job ───

/**
 * The canonical internal representation of a job from any source.
 * Adapters produce RawJob → parser maps to NormalizedJob → validator checks → ingestion persists.
 */
export interface NormalizedJob {
  externalJobId: string;
  title: string;
  description: string;
  company: string;
  companyWebsite?: string;
  location?: string;
  workMode?: NormalizedWorkMode;
  employmentType?: NormalizedEmploymentType;
  experienceLevel?: NormalizedExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  applicationUrl?: string;
  source: string;
  sourceUrl?: string;
  postedAt?: Date;
  expiresAt?: Date;
  skills?: string[];
  sourceMetadata?: Record<string, unknown>;
}

// ─── Ingestion Result ───

export interface IngestionError {
  externalJobId?: string;
  title?: string;
  errors: string[];
}

export interface IngestionResult {
  source: string;
  fetched: number;
  valid: number;
  invalid: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: IngestionError[];
  durationMs: number;
}

// ─── Validation Result ───

export interface JobValidationSuccess {
  success: true;
  data: NormalizedJob;
}

export interface JobValidationFailure {
  success: false;
  errors: Array<{ field: string; message: string }>;
}

export type JobValidationResult = JobValidationSuccess | JobValidationFailure;

// ─── Job Filters (for DAL / UI) ───

export interface JobFilters {
  search?: string;
  workMode?: NormalizedWorkMode;
  employmentType?: NormalizedEmploymentType;
  experienceLevel?: NormalizedExperienceLevel;
  location?: string;
  skills?: string[];
  status?: NormalizedJobStatus;
}

export interface JobSortOptions {
  field: "postedAt" | "createdAt" | "title";
  direction: "asc" | "desc";
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ─── Job with Relations (for UI display) ───

export interface JobWithRelations {
  id: string;
  title: string;
  description: string;
  companyId: string | null;
  companyName: string;
  location: string | null;
  workMode: NormalizedWorkMode | null;
  employmentType: NormalizedEmploymentType | null;
  experienceLevel: NormalizedExperienceLevel | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  applicationUrl: string | null;
  postedAt: Date | null;
  expiresAt: Date | null;
  status: NormalizedJobStatus;
  createdAt: Date;
  updatedAt: Date;
  company: {
    id: string;
    name: string;
    website: string | null;
    logoUrl: string | null;
  } | null;
  source: {
    id: string;
    name: string;
    type: string;
  };
  jobSkills: Array<{
    id: string;
    isRequired: boolean;
    skill: {
      id: string;
      name: string;
      normalizedName: string;
      category: string;
    };
  }>;
}
