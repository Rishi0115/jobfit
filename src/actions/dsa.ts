"use server";

/**
 * Server Actions — Personalized DSA Preparation
 *
 * Enforces session authentication, Zod input validation, and user ownership.
 */

import { auth } from "@/lib/auth";
import { dsaDAL } from "@/dal/dsa";
import { dsaService } from "@/services/dsa/dsa-service";
import {
  updateDSAProgressSchema,
  type UpdateDSAProgressInput,
} from "@/lib/validators/dsa";
import type { ApiResponse } from "@/types";
import type {
  DSADashboardData,
  DSAQuestionItem,
  DSAStatus,
} from "@/types/dsa";

async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized. Please sign in to access DSA preparation.");
  }
  return session.user.id;
}

/**
 * Fetch personalized DSA dashboard data for authenticated student.
 */
export async function getDSADashboardAction(): Promise<
  ApiResponse<DSADashboardData>
> {
  try {
    const userId = await getAuthenticatedUserId();
    const data = await dsaService.getDashboardData(userId);
    return { success: true, data };
  } catch (error) {
    console.error("[getDSADashboardAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load DSA dashboard.";
    return { success: false, error: message };
  }
}

/**
 * Fetch a single DSA question detail with user's progress.
 */
export async function getDSAQuestionDetailAction(
  questionId: string
): Promise<ApiResponse<DSAQuestionItem>> {
  try {
    const userId = await getAuthenticatedUserId();
    const trimmedId = questionId?.trim();
    if (!trimmedId) {
      return { success: false, error: "Question ID is required." };
    }

    const question = await dsaService.getQuestionDetail(userId, trimmedId);
    if (!question) {
      return { success: false, error: "DSA question not found." };
    }

    return { success: true, data: question };
  } catch (error) {
    console.error("[getDSAQuestionDetailAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load question.";
    return { success: false, error: message };
  }
}

/**
 * Update user progress on a DSA question (isolated by userId).
 */
export async function updateDSAProgressAction(
  input: UpdateDSAProgressInput
): Promise<
  ApiResponse<{
    id: string;
    status: DSAStatus;
    attempts: number;
  }>
> {
  try {
    const userId = await getAuthenticatedUserId();

    const validation = updateDSAProgressSchema.safeParse(input);
    if (!validation.success) {
      const errorMap: Record<string, string[]> = {};
      for (const err of validation.error.issues) {
        const field = err.path.join(".");
        if (!errorMap[field]) errorMap[field] = [];
        errorMap[field].push(err.message);
      }
      return { success: false, error: errorMap };
    }

    const { questionId, status, userApproach } = validation.data;

    // Verify question exists
    const question = await dsaDAL.getQuestionById(questionId);
    if (!question) {
      return { success: false, error: "DSA question not found." };
    }

    const progress = await dsaDAL.upsertProgress({
      userId,
      questionId,
      status,
      userApproach,
    });

    return {
      success: true,
      data: {
        id: progress.id,
        status: progress.status,
        attempts: progress.attempts,
      },
    };
  } catch (error) {
    console.error("[updateDSAProgressAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update DSA progress.";
    return { success: false, error: message };
  }
}
