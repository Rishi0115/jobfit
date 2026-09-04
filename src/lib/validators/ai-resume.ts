import { z } from "zod";

export const improveResumeInputSchema = z.object({
  resumeId: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, "Resume ID is required.")),
  mode: z.enum(["GENERAL", "JOB_TARGETED", "SECTION_LEVEL"]),
  targetSection: z.enum([
    "ALL",
    "SUMMARY",
    "EXPERIENCE",
    "PROJECTS",
    "SKILLS",
    "EDUCATION",
  ]),
  jobId: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, "Job ID cannot be empty."))
    .optional(),
});

export type ImproveResumeInput = z.infer<typeof improveResumeInputSchema>;

export const applyResumeImprovementsSchema = z.object({
  resumeId: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, "Resume ID is required.")),
  selectedBulletIds: z.array(z.string()),
  acceptedSummaryText: z.string().optional(),
  customEdits: z.record(z.string(), z.string()).optional(),
});

export type ApplyResumeImprovementsInput = z.infer<
  typeof applyResumeImprovementsSchema
>;

/**
 * Strict Zod schema for validating the structured JSON output from the AI model.
 * Does NOT contain preservationScore — preservationScore is calculated deterministically by code.
 */
export const aiStructuredOutputSchema = z.object({
  improvedSummary: z
    .object({
      originalText: z.string().optional(),
      improvedText: z.string(),
      explanation: z.string(),
    })
    .nullable()
    .optional(),
  improvedBullets: z.array(
    z.object({
      id: z.string(),
      section: z.enum(["EXPERIENCE", "PROJECTS", "OTHER"]),
      originalText: z.string(),
      improvedText: z.string(),
      factualBasis: z.string(),
      alignmentReason: z.string().optional(),
    })
  ),
  skillsSuggestions: z.object({
    verifiedSkillsToEmphasize: z.array(z.string()),
    missingSkillsAdvice: z.array(
      z.object({
        skill: z.string(),
        advice: z.string(),
      })
    ),
  }),
  atsSuggestions: z.array(
    z.object({
      keyword: z.string(),
      category: z.enum(["FOUND_IN_JOB", "RELEVANT_SKILL"]),
      foundInCandidateResume: z.boolean(),
      advice: z.string(),
    })
  ),
  clarificationRequests: z.array(
    z.object({
      field: z.string(),
      question: z.string(),
      context: z.string(),
    })
  ),
});

export type AIStructuredOutput = z.infer<typeof aiStructuredOutputSchema>;
