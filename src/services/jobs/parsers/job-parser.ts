/**
 * Job Parser — Maps RawJob (adapter output) to NormalizedJob.
 *
 * Acts as the translation layer between the adapter-specific format
 * and the internal normalized representation.
 */

import type { RawJob } from "@/services/jobs/adapters/types";
import type { NormalizedJob } from "@/types/job";
import {
  normalizeWorkMode,
  normalizeEmploymentType,
  normalizeExperienceLevel,
} from "@/services/jobs/ingestion/job-normalizer";

/**
 * Parse a single RawJob into a NormalizedJob.
 * Combines required and preferred skills into a single skills list.
 */
export function parseRawJob(raw: RawJob, sourceName: string): NormalizedJob {
  // Combine required and preferred skills
  const allSkills: string[] = [
    ...(raw.requiredSkills ?? []),
    ...(raw.preferredSkills ?? []),
  ];

  const parsed: NormalizedJob = {
    externalJobId: raw.externalId,
    title: raw.title,
    description: raw.description,
    company: raw.company,
    companyWebsite: raw.companyWebsite,
    location: raw.location,
    workMode:
      typeof raw.workMode === "string"
        ? normalizeWorkMode(raw.workMode)
        : raw.workMode ?? undefined,
    employmentType:
      typeof raw.employmentType === "string"
        ? normalizeEmploymentType(raw.employmentType)
        : raw.employmentType ?? undefined,
    experienceLevel:
      typeof raw.experienceLevel === "string"
        ? normalizeExperienceLevel(raw.experienceLevel)
        : raw.experienceLevel ?? undefined,
    salaryMin: raw.salaryMin,
    salaryMax: raw.salaryMax,
    salaryCurrency: raw.salaryCurrency,
    applicationUrl: raw.applicationUrl,
    source: sourceName,
    sourceUrl: raw.sourceUrl,
    postedAt: raw.postedAt,
    expiresAt: raw.expiresAt,
    skills: allSkills.length > 0 ? allSkills : undefined,
    sourceMetadata: {
      ...raw.metadata,
      requiredSkills: raw.requiredSkills,
      preferredSkills: raw.preferredSkills,
    },
  };

  return parsed;
}

/**
 * Parse a batch of RawJobs into NormalizedJobs.
 */
export function parseRawJobs(
  rawJobs: RawJob[],
  sourceName: string
): NormalizedJob[] {
  return rawJobs.map((raw) => parseRawJob(raw, sourceName));
}
