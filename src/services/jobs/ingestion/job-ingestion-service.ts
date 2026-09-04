/**
 * Job Ingestion Service — Orchestrates the full job ingestion pipeline.
 *
 * Pipeline: Fetch → Parse → Normalize → Validate → Deduplicate → Persist
 *
 * Features:
 * - Transaction-safe database persistence
 * - In-batch company caching to prevent duplicate company creation
 * - Non-destructive skill synchronization (does not delete existing JobSkill records)
 * - Individual error handling (one bad job does not abort the batch)
 * - Accurate counts: fetched, valid, invalid, created, updated, skipped, failed
 */

import { db } from "@/lib/db";
import type { BaseJobAdapter } from "@/services/jobs/adapters/base-adapter";
import type { FetchOptions } from "@/services/jobs/adapters/types";
import type {
  NormalizedJob,
  IngestionResult,
  IngestionError,
} from "@/types/job";
import { parseRawJobs } from "@/services/jobs/parsers/job-parser";
import {
  normalizeJob,
  normalizeCompanyNameForComparison,
  normalizeSkills,
} from "@/services/jobs/ingestion/job-normalizer";
import { validateJobs } from "@/services/jobs/parsers/job-validator";
import { deduplicateJobs } from "@/services/jobs/ingestion/job-deduplicator";
import type { Company, PrismaClient } from "@prisma/client";

export class JobIngestionService {
  /**
   * Run the full ingestion pipeline for a given adapter.
   */
  async ingest(
    adapter: BaseJobAdapter,
    fetchOptions?: FetchOptions
  ): Promise<IngestionResult> {
    const startTime = Date.now();
    const errors: IngestionError[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    // 1. Fetch raw jobs from adapter
    const adapterResult = await adapter.fetchJobs(fetchOptions);
    const fetched = adapterResult.jobs.length;

    if (adapterResult.metadata?.error) {
      errors.push({
        externalJobId: "N/A",
        title: `${adapter.displayName || adapter.sourceName} Fetch Error`,
        errors: [String(adapterResult.metadata.error)],
      });
    }

    if (fetched === 0) {
      return {
        source: adapter.sourceName,
        fetched: 0,
        valid: 0,
        invalid: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        errors,
        durationMs: Date.now() - startTime,
      };
    }

    // 2. Parse raw jobs → NormalizedJob
    const parsed = parseRawJobs(adapterResult.jobs, adapter.sourceName);

    // 3. Normalize all jobs
    const normalized = parsed.map(normalizeJob);

    // 4. Validate
    const { valid, invalid } = validateJobs(normalized);

    // Track invalid jobs
    for (const { job, errors: jobErrors } of invalid) {
      errors.push({
        externalJobId: job.externalJobId,
        title: job.title,
        errors: jobErrors.map((e) => `${e.field}: ${e.message}`),
      });
    }

    // 5. Deduplicate batch
    const { unique } = deduplicateJobs(valid);

    // 6. Ensure job source exists
    const jobSource = await db.jobSource.upsert({
      where: { name: adapter.sourceName },
      create: {
        name: adapter.sourceName,
        type: adapter.sourceType,
        baseUrl: adapter.getBaseUrl(),
        isActive: true,
      },
      update: {
        lastSyncAt: new Date(),
      },
    });

    // In-batch company cache: normalizedName -> Company
    const companyCache = new Map<string, Company>();

    // 7. Persist each job with individual error handling and transaction safety
    for (const job of unique) {
      try {
        const result = await this.persistJobTransaction(
          job,
          jobSource.id,
          companyCache
        );
        if (result === "created") created++;
        else if (result === "updated") updated++;
        else skipped++;
      } catch (error) {
        failed++;
        errors.push({
          externalJobId: job.externalJobId,
          title: job.title,
          errors: [
            error instanceof Error
              ? error.message
              : "Unknown persistence error",
          ],
        });
      }
    }

    return {
      source: adapter.sourceName,
      fetched,
      valid: valid.length,
      invalid: invalid.length,
      created,
      updated,
      skipped,
      failed,
      errors,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Persist a single normalized job within a database transaction.
   * Ensures company resolution, job upsert, and skill linkage are atomic.
   */
  private async persistJobTransaction(
    job: NormalizedJob,
    sourceId: string,
    companyCache: Map<string, Company>
  ): Promise<"created" | "updated" | "skipped"> {
    return db.$transaction(async (tx) => {
      // 1. Resolve or create company (using in-batch cache to prevent duplicates)
      const companyNormalized = normalizeCompanyNameForComparison(job.company);
      let company = companyCache.get(companyNormalized);

      if (!company) {
        company = await tx.company.findFirst({
          where: { normalizedName: companyNormalized, deletedAt: null },
        }) ?? undefined;

        if (!company) {
          company = await tx.company.create({
            data: {
              name: job.company,
              normalizedName: companyNormalized,
              website: job.companyWebsite || null,
            },
          });
        } else if (job.companyWebsite && !company.website) {
          // Update website only if existing is empty and we have a new value
          company = await tx.company.update({
            where: { id: company.id },
            data: { website: job.companyWebsite },
          });
        }

        companyCache.set(companyNormalized, company);
      }

      // 2. Check if job already exists via unique constraint (sourceId, externalJobId)
      const existing = await tx.job.findFirst({
        where: {
          sourceId,
          externalJobId: job.externalJobId,
        },
      });

      let jobId: string;
      let action: "created" | "updated";

      if (existing) {
        // Update mutable fields; stable identity (id, sourceId, externalJobId) is NEVER changed
        await tx.job.update({
          where: { id: existing.id },
          data: {
            title: job.title,
            description: job.description,
            companyName: job.company,
            companyId: company.id,
            location: job.location,
            workMode: job.workMode,
            employmentType: job.employmentType,
            experienceLevel: job.experienceLevel,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            salaryCurrency: job.salaryCurrency,
            applicationUrl: job.applicationUrl,
            sourceMetadata: (job.sourceMetadata as object) ?? undefined,
            postedAt: job.postedAt,
            expiresAt: job.expiresAt,
          },
        });
        jobId = existing.id;
        action = "updated";
      } else {
        // Create new job
        const newJob = await tx.job.create({
          data: {
            title: job.title,
            description: job.description,
            companyName: job.company,
            companyId: company.id,
            location: job.location,
            workMode: job.workMode,
            employmentType: job.employmentType,
            experienceLevel: job.experienceLevel,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            salaryCurrency: job.salaryCurrency,
            sourceId,
            externalJobId: job.externalJobId,
            applicationUrl: job.applicationUrl,
            sourceMetadata: (job.sourceMetadata as object) ?? undefined,
            postedAt: job.postedAt ?? new Date(),
            expiresAt: job.expiresAt,
            status: "ACTIVE",
          },
        });
        jobId = newJob.id;
        action = "created";
      }

      // 3. Non-destructively sync skills (adds missing skills, never deletes existing JobSkill relations)
      if (job.skills && job.skills.length > 0) {
        await this.syncJobSkillsTx(tx, jobId, job.skills);
      }

      return action;
    });
  }

  /**
   * Non-destructively link skills to a job within the transaction.
   * Never deletes existing JobSkill records!
   */
  private async syncJobSkillsTx(
    tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0],
    jobId: string,
    skillNames: string[]
  ): Promise<void> {
    const normalized = normalizeSkills(skillNames);
    if (normalized.length === 0) return;

    // Find existing skills by normalizedName
    const existingSkills = await tx.skill.findMany({
      where: { normalizedName: { in: normalized } },
    });

    const existingNormalized = new Set(
      existingSkills.map((s) => s.normalizedName)
    );
    const toCreate = normalized.filter((n) => !existingNormalized.has(n));

    // Create missing Skill records
    if (toCreate.length > 0) {
      await tx.skill.createMany({
        data: toCreate.map((normalizedName) => ({
          name: toDisplayName(normalizedName),
          normalizedName,
        })),
        skipDuplicates: true,
      });
    }

    // Fetch all skills for these normalized names (existing + newly created)
    const allSkills = await tx.skill.findMany({
      where: { normalizedName: { in: normalized } },
      select: { id: true },
    });

    // Check which JobSkills already exist for this job
    const existingJobSkills = await tx.jobSkill.findMany({
      where: { jobId },
      select: { skillId: true },
    });
    const alreadyLinkedIds = new Set(existingJobSkills.map((js) => js.skillId));

    // Only add skills that are NOT already linked to this job
    const newSkillsToLink = allSkills.filter(
      (s) => !alreadyLinkedIds.has(s.id)
    );

    if (newSkillsToLink.length > 0) {
      await tx.jobSkill.createMany({
        data: newSkillsToLink.map((skill) => ({
          jobId,
          skillId: skill.id,
          isRequired: true,
        })),
        skipDuplicates: true,
      });
    }
  }
}

/**
 * Generate a canonical display name from a normalized skill name.
 */
function toDisplayName(normalized: string): string {
  const specialCases: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    postgresql: "PostgreSQL",
    mongodb: "MongoDB",
    graphql: "GraphQL",
    "node.js": "Node.js",
    "react.js": "React.js",
    "vue.js": "Vue.js",
    "next.js": "Next.js",
    css: "CSS",
    html: "HTML",
    sql: "SQL",
    "rest api": "REST API",
    api: "API",
    "ci/cd": "CI/CD",
    aws: "AWS",
    gcp: "GCP",
    azure: "Azure",
    devops: "DevOps",
    mlops: "MLOps",
    ios: "iOS",
    grpc: "gRPC",
  };

  if (specialCases[normalized]) return specialCases[normalized];

  return normalized
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
