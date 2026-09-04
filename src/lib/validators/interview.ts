import { z } from "zod";
import { InterviewType, QuestionCategory } from "@prisma/client";

export const startInterviewSessionSchema = z
  .object({
    type: z.nativeEnum(InterviewType).optional(),
    mode: z.enum(["RESUME", "JOB", "MIXED"]).optional(),
    jobId: z
      .string()
      .transform((v) => v.trim())
      .pipe(z.string().min(1))
      .optional()
      .nullable(),
    questionCount: z.number().int().min(3).max(10).optional().default(5),
    difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
  })
  .refine(
    (data) => Boolean(data.type || data.mode),
    { message: "Either interview type or mode must be provided." }
  )
  .refine(
    (data) => {
      const isJobBased =
        data.mode === "JOB" || data.type === InterviewType.JOB_BASED;
      if (isJobBased) {
        return Boolean(data.jobId && data.jobId.trim().length > 0);
      }
      return true;
    },
    {
      message: "A target job must be selected for job-based interviews.",
      path: ["jobId"],
    }
  );

export type StartInterviewSessionInput = z.input<
  typeof startInterviewSessionSchema
>;

export const submitInterviewAnswerSchema = z.object({
  sessionId: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, "Session ID is required.")),
  questionId: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, "Question ID is required.")),
  answerText: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(3, "Answer must be at least 3 characters long.").max(4000)),
  isFollowUp: z.boolean().optional().default(false),
  followUpId: z.string().optional(),
});

export type SubmitInterviewAnswerInput = z.input<
  typeof submitInterviewAnswerSchema
>;

/**
 * Zod schema for structured output from AI question generation.
 */
export const aiGeneratedQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      content: z.string().min(10),
      category: z.nativeEnum(QuestionCategory),
      difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
      source: z.enum(["RESUME", "JOB", "SKILL_GAP", "BEHAVIORAL"]),
      targetSkill: z.string().optional(),
      rationale: z.string().optional(),
    })
  ),
});

export type AIGeneratedQuestionsOutput = z.infer<
  typeof aiGeneratedQuestionsSchema
>;

/**
 * Zod schema for structured answer evaluation and dynamic follow-up.
 */
export const aiAnswerEvaluationSchema = z.object({
  evaluation: z.object({
    relevance: z.string(),
    technicalCorrectness: z.string(),
    depth: z.enum(["SHALLOW", "MODERATE", "DEEP"]),
    clarity: z.string(),
    completeness: z.string(),
    score: z.number().min(0).max(100),
    strengths: z.array(z.string()),
    missingConcepts: z.array(z.string()),
    improvementSuggestions: z.array(z.string()),
  }),
  shouldAskFollowUp: z.boolean(),
  followUpQuestion: z.string().nullable().optional(),
  followUpRationale: z.string().nullable().optional(),
});

export type AIAnswerEvaluationOutput = z.infer<
  typeof aiAnswerEvaluationSchema
>;
