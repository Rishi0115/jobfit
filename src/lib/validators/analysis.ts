import { z } from "zod";

export const analyzeResumeJobSchema = z.object({
  jobId: z
    .string()
    .transform((v) => v.trim())
    .pipe(
      z
        .string()
        .min(1, "Job ID is required.")
        .max(100, "Job ID exceeds maximum allowed length.")
    ),
  resumeId: z
    .string()
    .transform((v) => v.trim())
    .pipe(
      z
        .string()
        .min(1, "Resume ID cannot be empty.")
        .max(100, "Resume ID exceeds maximum allowed length.")
    )
    .optional(),
});

export type AnalyzeResumeJobInput = z.infer<typeof analyzeResumeJobSchema>;
