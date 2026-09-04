"use server";

/**
 * Server Actions — Resume vs Job Analysis & Skill Gap Analysis
 *
 * Enforces strict session authentication and Zod input validation.
 * No user-supplied IDs are trusted for candidate data access.
 */

import { auth } from "@/lib/auth";
import { resumeJobService } from "@/services/resume-analysis/resume-job-service";
import {
  analyzeResumeJobSchema,
  type AnalyzeResumeJobInput,
} from "@/lib/validators/analysis";
import type { ApiResponse } from "@/types";
import type { ResumeJobAnalysisResult } from "@/types/analysis";

async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized. Please sign in to analyze your resume.");
  }
  return session.user.id;
}

/**
 * Server Action to analyze a user's active (or specified) resume against a job.
 */
export async function analyzeResumeJobAction(
  input: AnalyzeResumeJobInput
): Promise<ApiResponse<ResumeJobAnalysisResult>> {
  try {
    const userId = await getAuthenticatedUserId();

    const validation = analyzeResumeJobSchema.safeParse(input);
    if (!validation.success) {
      const errorMap: Record<string, string[]> = {};
      for (const err of validation.error.issues) {
        const field = err.path.join(".");
        if (!errorMap[field]) errorMap[field] = [];
        errorMap[field].push(err.message);
      }
      return { success: false, error: errorMap };
    }

    const { jobId, resumeId } = validation.data;

    const result = await resumeJobService.analyzeResumeAgainstJob(
      userId,
      jobId,
      resumeId
    );

    if (!result) {
      return {
        success: false,
        error:
          "Unable to perform analysis: Either the job does not exist or you do not have an active resume uploaded.",
      };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("[analyzeResumeJobAction] Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to perform Resume vs Job analysis.";
    return { success: false, error: message };
  }
}
