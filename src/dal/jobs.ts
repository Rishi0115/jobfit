/**
 * Data Access Layer — Jobs
 * All Job-related database operations are centralized here.
 * No Prisma calls should be made directly from Server Actions or components.
 */
import { db } from "@/lib/db";
import type { Prisma, JobStatus } from "@prisma/client";
import type {
  JobFilters,
  JobSortOptions,
  PaginationOptions,
  PaginatedResult,
  JobWithRelations,
  NormalizedJobStatus,
} from "@/types/job";

// ─── Default Values ───

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

// ─── Include for full job relations ───

const jobWithRelationsInclude = {
  company: {
    select: {
      id: true,
      name: true,
      website: true,
      logoUrl: true,
    },
  },
  source: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
  jobSkills: {
    include: {
      skill: {
        select: {
          id: true,
          name: true,
          normalizedName: true,
          category: true,
        },
      },
    },
  },
} satisfies Prisma.JobInclude;

// ─── Filter Builder ───

function buildWhereClause(filters?: JobFilters): Prisma.JobWhereInput {
  const where: Prisma.JobWhereInput = {
    deletedAt: null,
  };

  if (!filters) return where;

  if (filters.status) {
    where.status = filters.status as JobStatus;
  }

  if (filters.workMode) {
    where.workMode = filters.workMode;
  }

  if (filters.employmentType) {
    where.employmentType = filters.employmentType;
  }

  if (filters.experienceLevel) {
    where.experienceLevel = filters.experienceLevel;
  }

  if (filters.location) {
    where.location = {
      contains: filters.location.trim(),
      mode: "insensitive",
    };
  }

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { companyName: { contains: term, mode: "insensitive" } },
    ];
  }

  if (filters.skills && filters.skills.length > 0) {
    where.jobSkills = {
      some: {
        skill: {
          normalizedName: { in: filters.skills.map((s) => s.toLowerCase().trim()) },
        },
      },
    };
  }

  return where;
}

// ─── Sort Builder ───

function buildOrderBy(
  sort?: JobSortOptions
): Prisma.JobOrderByWithRelationInput {
  if (!sort) {
    return { postedAt: "desc" };
  }

  return { [sort.field]: sort.direction };
}

// ─── DAL Functions ───

export const jobsDAL = {
  /**
   * List jobs with filters, pagination, and sorting.
   * Excludes sourceMetadata to keep payloads lean.
   */
  async listJobs(
    filters?: JobFilters,
    pagination?: PaginationOptions,
    sort?: JobSortOptions
  ): Promise<PaginatedResult<JobWithRelations>> {
    const page = Math.max(1, pagination?.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, pagination?.pageSize ?? DEFAULT_PAGE_SIZE)
    );
    const skip = (page - 1) * pageSize;

    const where = buildWhereClause(filters);
    const orderBy = buildOrderBy(sort);

    const [data, total] = await Promise.all([
      db.job.findMany({
        where,
        include: jobWithRelationsInclude,
        orderBy,
        skip,
        take: pageSize,
      }),
      db.job.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: data as unknown as JobWithRelations[],
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  },

  /**
   * Get a single job by ID with all relations.
   */
  async getJobById(id: string): Promise<JobWithRelations | null> {
    if (!id || typeof id !== "string") return null;

    const job = await db.job.findFirst({
      where: { id, deletedAt: null },
      include: jobWithRelationsInclude,
    });

    return job as unknown as JobWithRelations | null;
  },

  /**
   * Get active jobs with optional filters.
   */
  async getActiveJobs(
    filters?: Omit<JobFilters, "status">,
    pagination?: PaginationOptions,
    sort?: JobSortOptions
  ): Promise<PaginatedResult<JobWithRelations>> {
    return this.listJobs(
      { ...filters, status: "ACTIVE" as NormalizedJobStatus },
      pagination,
      sort
    );
  },

  /**
   * Search jobs by text query across title, description, and company name.
   */
  async searchJobs(
    query: string,
    filters?: Omit<JobFilters, "search">,
    pagination?: PaginationOptions,
    sort?: JobSortOptions
  ): Promise<PaginatedResult<JobWithRelations>> {
    return this.listJobs(
      { ...filters, search: query },
      pagination,
      sort
    );
  },

  /**
   * Count jobs matching filters.
   */
  async countJobs(filters?: JobFilters): Promise<number> {
    const where = buildWhereClause(filters);
    return db.job.count({ where });
  },

  /**
   * Find a job by source and external job ID (for upsert during ingestion).
   */
  async findBySourceAndExternalId(sourceId: string, externalJobId: string) {
    return db.job.findFirst({
      where: {
        sourceId,
        externalJobId,
      },
      include: {
        jobSkills: true,
      },
    });
  },

  /**
   * Find or get the JobSource by name.
   */
  async findJobSourceByName(name: string) {
    return db.jobSource.findUnique({
      where: { name },
    });
  },

  /**
   * Create or update a job source.
   */
  async upsertJobSource(data: {
    name: string;
    type: string;
    baseUrl?: string;
  }) {
    return db.jobSource.upsert({
      where: { name: data.name },
      create: {
        name: data.name,
        type: data.type,
        baseUrl: data.baseUrl,
        isActive: true,
      },
      update: {
        type: data.type,
        baseUrl: data.baseUrl,
        lastSyncAt: new Date(),
      },
    });
  },

  /**
   * Mark expired jobs: set ACTIVE jobs past expiresAt to EXPIRED.
   */
  async markExpiredJobs(): Promise<number> {
    const result = await db.job.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: {
          lt: new Date(),
        },
        deletedAt: null,
      },
      data: {
        status: "EXPIRED",
      },
    });

    return result.count;
  },
};
