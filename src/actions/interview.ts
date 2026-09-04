"use server";

/**
 * Server Actions — Interview Preparation & Dynamic Follow-ups
 *
 * Enforces session authentication, Zod input validation, and user ownership.
 */

import { auth } from "@/lib/auth";
import { interviewDAL } from "@/dal/interview";
import { interviewService } from "@/services/interview/interview-service";
import {
  startInterviewSessionSchema,
  submitInterviewAnswerSchema,
  type StartInterviewSessionInput,
  type SubmitInterviewAnswerInput,
} from "@/lib/validators/interview";
import type { ApiResponse } from "@/types";
import type { InterviewSessionDetail } from "@/types/interview";
import { InterviewType } from "@prisma/client";

async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error(
      "Unauthorized. Please sign in to access interview preparation."
    );
  }
  return session.user.id;
}

/**
 * Start a new interview preparation session.
 */
export async function startInterviewSessionAction(
  input: StartInterviewSessionInput
): Promise<ApiResponse<InterviewSessionDetail>> {
  try {
    const userId = await getAuthenticatedUserId();

    const validation = startInterviewSessionSchema.safeParse(input);
    if (!validation.success) {
      const errorMap: Record<string, string[]> = {};
      for (const err of validation.error.issues) {
        const field = err.path.join(".");
        if (!errorMap[field]) errorMap[field] = [];
        errorMap[field].push(err.message);
      }
      return { success: false, error: errorMap };
    }

    const { type, mode, jobId, questionCount, difficulty } = validation.data;

    let interviewType: InterviewType;
    if (mode) {
      if (mode === "RESUME") {
        interviewType = InterviewType.RESUME_BASED;
      } else if (mode === "JOB") {
        interviewType = InterviewType.JOB_BASED;
      } else {
        interviewType = InterviewType.MOCK;
      }
    } else {
      interviewType = type!;
    }

    const detail = await interviewService.startSession({
      userId,
      type: interviewType,
      jobId: jobId || undefined,
      questionCount,
      difficulty,
    });

    if (!detail) {
      return {
        success: false,
        error: "Failed to initialize interview session.",
      };
    }

    return { success: true, data: detail };
  } catch (error) {
    console.error("[startInterviewSessionAction] Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to start interview session.";
    return { success: false, error: message };
  }
}

/**
 * Fetch an existing interview session detail by ID (user isolated).
 */
export async function getInterviewSessionAction(
  sessionId: string
): Promise<ApiResponse<InterviewSessionDetail>> {
  try {
    const userId = await getAuthenticatedUserId();
    const trimmedId = sessionId?.trim();
    if (!trimmedId) {
      return { success: false, error: "Session ID is required." };
    }

    const detail = await interviewService.getSessionDetail(trimmedId, userId);
    if (!detail) {
      return { success: false, error: "Interview session not found or unauthorized." };
    }

    return { success: true, data: detail };
  } catch (error) {
    console.error("[getInterviewSessionAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load session.";
    return { success: false, error: message };
  }
}

/**
 * Submit an answer to a primary or follow-up question.
 */
export async function submitInterviewAnswerAction(
  input: SubmitInterviewAnswerInput
): Promise<
  ApiResponse<{
    session: InterviewSessionDetail;
    evaluation: any;
    newFollowUp?: string | null;
  }>
> {
  try {
    const userId = await getAuthenticatedUserId();

    const validation = submitInterviewAnswerSchema.safeParse(input);
    if (!validation.success) {
      const errorMap: Record<string, string[]> = {};
      for (const err of validation.error.issues) {
        const field = err.path.join(".");
        if (!errorMap[field]) errorMap[field] = [];
        errorMap[field].push(err.message);
      }
      return { success: false, error: errorMap };
    }

    const { sessionId, questionId, answerText, isFollowUp, followUpId } =
      validation.data;

    const result = await interviewService.submitAnswer({
      sessionId,
      userId,
      questionId,
      answerText,
      isFollowUp,
      followUpId,
    });

    if (!result) {
      return {
        success: false,
        error: "Failed to evaluate answer or session not found.",
      };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("[submitInterviewAnswerAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit answer.";
    return { success: false, error: message };
  }
}

/**
 * Complete an interview session and generate the final diagnostic scorecard.
 */
export async function completeInterviewSessionAction(
  sessionId: string
): Promise<ApiResponse<InterviewSessionDetail>> {
  try {
    const userId = await getAuthenticatedUserId();
    const trimmedId = sessionId?.trim();
    if (!trimmedId) {
      return { success: false, error: "Session ID is required." };
    }

    const session = await interviewService.completeSession(trimmedId, userId);
    if (!session) {
      return { success: false, error: "Session not found." };
    }

    return { success: true, data: session };
  } catch (error) {
    console.error("[completeInterviewSessionAction] Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to complete interview session.";
    return { success: false, error: message };
  }
}

/**
 * Fetch list of recent sessions for authenticated student.
 */
export async function getUserInterviewSessionsAction(): Promise<
  ApiResponse<any[]>
> {
  try {
    const userId = await getAuthenticatedUserId();
    const sessions = await interviewDAL.getUserSessions(userId);
    return { success: true, data: sessions };
  } catch (error) {
    console.error("[getUserInterviewSessionsAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load sessions.";
    return { success: false, error: message };
  }
}

/**
 * Fetch detailed InterviewFeedback record for a completed session (user isolated).
 */
export async function getInterviewFeedbackAction(
  sessionId: string
): Promise<ApiResponse<any>> {
  try {
    const userId = await getAuthenticatedUserId();
    const trimmedId = sessionId?.trim();
    if (!trimmedId) {
      return { success: false, error: "Session ID is required." };
    }

    const feedback = await interviewDAL.getInterviewFeedback(trimmedId, userId);
    if (!feedback) {
      // Fallback: check session feedback field directly
      const session = await interviewService.getSessionDetail(trimmedId, userId);
      if (session?.feedback) {
        return {
          success: true,
          data: {
            sessionId: session.id,
            overallScore: session.overallScore || 0,
            technicalScore: session.technicalScore || 0,
            communicationScore: session.communicationScore || 0,
            strengths: session.feedback.strengths || [],
            weaknesses: session.feedback.weaknesses || [],
            suggestions: session.feedback.suggestions || [],
            detailedFeedback: session.feedback.detailedFeedback || null,
          },
        };
      }
      return { success: false, error: "Interview feedback not found." };
    }

    return { success: true, data: feedback };
  } catch (error) {
    console.error("[getInterviewFeedbackAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load feedback.";
    return { success: false, error: message };
  }
}
