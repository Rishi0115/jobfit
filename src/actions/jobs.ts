"use server";

/**
 * Server Actions — Jobs
 * Secure, server-side operations for job discovery.
 */

import { auth } from "@/lib/auth";
import { jobsDAL } from "@/dal/jobs";
import type {
  JobFilters,
  JobSortOptions,
  PaginationOptions,
  PaginatedResult,
  JobWithRelations,
  NormalizedWorkMode,
  NormalizedEmploymentType,
  NormalizedExperienceLevel,
} from "@/types/job";

const VALID_WORK_MODES = new Set(["REMOTE", "HYBRID", "ONSITE"]);
const VALID_EMPLOYMENT_TYPES = new Set([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
]);
const VALID_EXPERIENCE_LEVELS = new Set([
  "FRESHER",
  "JUNIOR",
  "MID",
  "SENIOR",
  "LEAD",
]);
const VALID_SORT_FIELDS = new Set(["postedAt", "createdAt", "title"]);
const VALID_SORT_DIRECTIONS = new Set(["asc", "desc"]);

/**
 * Get paginated jobs with filters and sorting.
 * Available to authenticated students and admins.
 */
export async function getJobs(
  filters?: JobFilters,
  pagination?: PaginationOptions,
  sort?: JobSortOptions
): Promise<PaginatedResult<JobWithRelations>> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Sanitize filters
  const sanitizedFilters: JobFilters = {
    status: "ACTIVE",
    search:
      typeof filters?.search === "string"
        ? filters.search.slice(0, 200).trim()
        : undefined,
    workMode:
      filters?.workMode && VALID_WORK_MODES.has(filters.workMode)
        ? (filters.workMode as NormalizedWorkMode)
        : undefined,
    employmentType:
      filters?.employmentType &&
      VALID_EMPLOYMENT_TYPES.has(filters.employmentType)
        ? (filters.employmentType as NormalizedEmploymentType)
        : undefined,
    experienceLevel:
      filters?.experienceLevel &&
      VALID_EXPERIENCE_LEVELS.has(filters.experienceLevel)
        ? (filters.experienceLevel as NormalizedExperienceLevel)
        : undefined,
    location:
      typeof filters?.location === "string"
        ? filters.location.slice(0, 100).trim()
        : undefined,
    skills: Array.isArray(filters?.skills)
      ? filters.skills
          .filter((s): s is string => typeof s === "string")
          .map((s) => s.slice(0, 50).toLowerCase().trim())
          .filter(Boolean)
      : undefined,
  };

  // Sanitize pagination
  const page = Math.max(1, Math.min(10000, Number(pagination?.page) || 1));
  const pageSize = Math.max(
    1,
    Math.min(50, Number(pagination?.pageSize) || 12)
  );

  // Sanitize sort
  const sanitizedSort: JobSortOptions | undefined =
    sort &&
    VALID_SORT_FIELDS.has(sort.field) &&
    VALID_SORT_DIRECTIONS.has(sort.direction)
      ? sort
      : undefined;

  return jobsDAL.listJobs(
    sanitizedFilters,
    { page, pageSize },
    sanitizedSort
  );
}

/**
 * Get a single job by ID with all relations.
 * Available to authenticated students and admins.
 */
export async function getJobById(
  id: string
): Promise<JobWithRelations | null> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!id || typeof id !== "string" || id.trim().length === 0 || id.length > 100) {
    return null;
  }

  return jobsDAL.getJobById(id.trim());
}
