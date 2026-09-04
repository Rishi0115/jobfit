"use server";

/**
 * Server Actions — AI-Powered Resume Improvement
 *
 * Enforces session authentication, Zod input validation, and user ownership.
 * Atomic version persistence ensures original resumes are never destroyed or overwritten.
 */

import { auth } from "@/lib/auth";
import { resumesDAL } from "@/dal/resumes";
import { resumeImproverService } from "@/services/ai/resume-improver";
import {
  improveResumeInputSchema,
  applyResumeImprovementsSchema,
  type ImproveResumeInput,
  type ApplyResumeImprovementsInput,
} from "@/lib/validators/ai-resume";
import type { ApiResponse } from "@/types";
import type { ResumeImprovementResult } from "@/types/ai-resume";

async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized. Please sign in to improve your resume.");
  }
  return session.user.id;
}

/**
 * Generate AI-powered resume improvements (on-demand, non-destructive).
 */
export async function improveResumeAction(
  input: ImproveResumeInput
): Promise<ApiResponse<ResumeImprovementResult>> {
  try {
    const userId = await getAuthenticatedUserId();

    const validation = improveResumeInputSchema.safeParse(input);
    if (!validation.success) {
      const errorMap: Record<string, string[]> = {};
      for (const err of validation.error.issues) {
        const field = err.path.join(".");
        if (!errorMap[field]) errorMap[field] = [];
        errorMap[field].push(err.message);
      }
      return { success: false, error: errorMap };
    }

    const { resumeId, mode, targetSection, jobId } = validation.data;

    const result = await resumeImproverService.improveResume({
      userId,
      resumeId,
      mode,
      targetSection,
      jobId,
    });

    if (!result) {
      return {
        success: false,
        error:
          "Unable to improve resume: Either the resume does not exist or you do not have permission to access it.",
      };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("[improveResumeAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to improve resume.";
    return { success: false, error: message };
  }
}

/**
 * Apply selected improvements as a NEW resume version (atomically).
 * Never overwrites or destroys the original uploaded resume.
 */
export async function applyResumeImprovementsAction(
  input: ApplyResumeImprovementsInput
): Promise<
  ApiResponse<{
    newResumeId: string;
    version: number;
    fileName: string;
  }>
> {
  try {
    const userId = await getAuthenticatedUserId();

    const validation = applyResumeImprovementsSchema.safeParse(input);
    if (!validation.success) {
      const errorMap: Record<string, string[]> = {};
      for (const err of validation.error.issues) {
        const field = err.path.join(".");
        if (!errorMap[field]) errorMap[field] = [];
        errorMap[field].push(err.message);
      }
      return { success: false, error: errorMap };
    }

    const { resumeId, selectedBulletIds, acceptedSummaryText, customEdits } =
      validation.data;

    // 1. Fetch source resume and verify ownership
    const sourceResume = await resumesDAL.findUserResumeById(resumeId, userId);
    if (!sourceResume) {
      return {
        success: false,
        error: "Source resume not found or unauthorized.",
      };
    }

    let rawText = sourceResume.rawText || "";

    // 2. Apply custom edits if provided
    if (customEdits) {
      for (const [orig, replacement] of Object.entries(customEdits)) {
        if (orig && replacement && rawText.includes(orig)) {
          rawText = rawText.replace(orig, replacement);
        }
      }
    }

    // 3. Atomically create new resume version preserving original
    const newResume = await resumesDAL.createResumeVersion({
      userId,
      sourceResumeId: resumeId,
      rawText,
    });

    return {
      success: true,
      data: {
        newResumeId: newResume.id,
        version: newResume.version,
        fileName: newResume.fileName,
      },
    };
  } catch (error) {
    console.error("[applyResumeImprovementsAction] Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to apply resume improvements.";
    return { success: false, error: message };
  }
}
