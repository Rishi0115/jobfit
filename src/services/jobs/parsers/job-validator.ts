/**
 * Job Validator — Zod-based validation for normalized jobs.
 *
 * Validates that a NormalizedJob has all required fields and proper formats
 * before persistence. Returns structured error messages.
 */

import { z } from "zod";
import type { NormalizedJob, JobValidationResult } from "@/types/job";

// ─── Zod Schema ───

const normalizedJobSchema = z.object({
  externalJobId: z
    .string()
    .min(1, "External job ID is required"),
  title: z
    .string()
    .min(1, "Job title is required")
    .max(500, "Job title is too long"),
  description: z
    .string()
    .min(1, "Job description is required")
    .max(50000, "Job description is too long"),
  company: z
    .string()
    .min(1, "Company name is required")
    .max(500, "Company name is too long"),
  companyWebsite: z
    .string()
    .url("Company website must be a valid URL")
    .optional(),
  location: z.string().max(500, "Location is too long").optional(),
  workMode: z.enum(["REMOTE", "HYBRID", "ONSITE"]).optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"])
    .optional(),
  experienceLevel: z
    .enum(["FRESHER", "JUNIOR", "MID", "SENIOR", "LEAD"])
    .optional(),
  salaryMin: z
    .number()
    .positive("Minimum salary must be positive")
    .optional(),
  salaryMax: z
    .number()
    .positive("Maximum salary must be positive")
    .optional(),
  salaryCurrency: z.string().max(10).optional(),
  applicationUrl: z
    .string()
    .min(1, "Application URL is required")
    .url("Application URL must be a valid URL"),
  source: z.string().min(1, "Source is required"),
  sourceUrl: z
    .string()
    .url("Source URL must be a valid URL")
    .optional(),
  postedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  skills: z.array(z.string()).optional(),
  sourceMetadata: z.record(z.string(), z.unknown()).optional(),
});

// ─── Validation Function ───

/**
 * Validate a NormalizedJob using the Zod schema.
 * Returns a structured result with field-level errors.
 */
export function validateJob(job: NormalizedJob): JobValidationResult {
  const result = normalizedJobSchema.safeParse(job);

  if (result.success) {
    return {
      success: true,
      data: result.data as NormalizedJob,
    };
  }

  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

  return {
    success: false,
    errors,
  };
}

/**
 * Validate a batch of jobs.
 * Returns separate arrays of valid and invalid jobs.
 */
export function validateJobs(jobs: NormalizedJob[]): {
  valid: NormalizedJob[];
  invalid: Array<{ job: NormalizedJob; errors: Array<{ field: string; message: string }> }>;
} {
  const valid: NormalizedJob[] = [];
  const invalid: Array<{
    job: NormalizedJob;
    errors: Array<{ field: string; message: string }>;
  }> = [];

  for (const job of jobs) {
    const result = validateJob(job);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({ job, errors: result.errors });
    }
  }

  return { valid, invalid };
}
