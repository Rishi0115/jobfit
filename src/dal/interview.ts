/**
 * Data Access Layer — Interview Preparation Sessions & Follow-ups
 *
 * Enforces user ownership constraints on all session queries and mutations.
 */

import { db } from "@/lib/db";
import {
  InterviewType,
  InterviewStatus,
  QuestionCategory,
  type InterviewSession,
} from "@prisma/client";

export const interviewDAL = {
  /**
   * Create a new interview session.
   */
  async createSession(params: {
    userId: string;
    type: InterviewType;
    jobId?: string;
    config?: any;
  }): Promise<InterviewSession> {
    const { userId, type, jobId, config } = params;

    return db.interviewSession.create({
      data: {
        userId,
        type,
        jobId: jobId || null,
        status: InterviewStatus.SETUP,
        config: config || {},
      },
    });
  },

  /**
   * Get an interview session by ID with questions, answers, and follow-ups.
   * Strictly enforces user ownership.
   */
  async getSessionById(sessionId: string, userId: string) {
    return db.interviewSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: { select: { name: true } },
          },
        },
        questions: {
          orderBy: { orderIndex: "asc" },
          include: {
            answer: true,
            followUps: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    });
  },

  /**
   * Fetch all interview sessions for a user.
   */
  async getUserSessions(userId: string) {
    return db.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: { select: { name: true } },
          },
        },
        _count: {
          select: { questions: true },
        },
      },
    });
  },

  /**
   * Add generated questions to an existing session.
   */
  async addQuestionsToSession(
    sessionId: string,
    questions: Array<{
      content: string;
      category: QuestionCategory;
      difficulty?: string;
      orderIndex: number;
    }>
  ) {
    return db.$transaction(
      questions.map((q) =>
        db.interviewQuestion.create({
          data: {
            sessionId,
            content: q.content,
            category: q.category,
            difficulty: q.difficulty || "medium",
            orderIndex: q.orderIndex,
          },
        })
      )
    );
  },

  /**
   * Save user's answer and AI evaluation for a primary question.
   */
  async saveAnswer(params: {
    questionId: string;
    content: string;
    evaluation?: any;
  }) {
    const { questionId, content, evaluation } = params;

    return db.interviewAnswer.upsert({
      where: { questionId },
      update: {
        content,
        evaluation: evaluation || undefined,
      },
      create: {
        questionId,
        content,
        evaluation: evaluation || undefined,
      },
    });
  },

  /**
   * Save a dynamic follow-up question.
   */
  async createFollowUp(params: {
    parentQuestionId: string;
    content: string;
    orderIndex: number;
  }) {
    const { parentQuestionId, content, orderIndex } = params;

    return db.followUpQuestion.create({
      data: {
        parentQuestionId,
        content,
        orderIndex,
      },
    });
  },

  /**
   * Save user's answer and evaluation for a follow-up question.
   */
  async saveFollowUpAnswer(params: {
    followUpId: string;
    answer: string;
    evaluation?: any;
  }) {
    const { followUpId, answer, evaluation } = params;

    return db.followUpQuestion.update({
      where: { id: followUpId },
      data: {
        answer,
        evaluation: evaluation || undefined,
      },
    });
  },

  /**
   * Update session status, scores, and feedback.
   */
  async updateSessionStatus(params: {
    sessionId: string;
    userId: string;
    status: InterviewStatus;
    overallScore?: number;
    technicalScore?: number;
    communicationScore?: number;
    feedback?: any;
  }) {
    const {
      sessionId,
      userId,
      status,
      overallScore,
      technicalScore,
      communicationScore,
      feedback,
    } = params;

    return db.interviewSession.updateMany({
      where: { id: sessionId, userId },
      data: {
        status,
        overallScore: overallScore ?? undefined,
        technicalScore: technicalScore ?? undefined,
        communicationScore: communicationScore ?? undefined,
        feedback: feedback ?? undefined,
        completedAt:
          status === InterviewStatus.COMPLETED ? new Date() : undefined,
      },
    });
  },

  /**
   * Save or update structured InterviewFeedback record.
   */
  async saveInterviewFeedback(params: {
    sessionId: string;
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    detailedFeedback?: string;
  }) {
    const {
      sessionId,
      overallScore,
      technicalScore,
      communicationScore,
      strengths,
      weaknesses,
      suggestions,
      detailedFeedback,
    } = params;

    return db.interviewFeedback.upsert({
      where: { sessionId },
      update: {
        overallScore,
        technicalScore,
        communicationScore,
        strengths,
        weaknesses,
        suggestions,
        detailedFeedback: detailedFeedback || null,
      },
      create: {
        sessionId,
        overallScore,
        technicalScore,
        communicationScore,
        strengths,
        weaknesses,
        suggestions,
        detailedFeedback: detailedFeedback || null,
      },
    });
  },

  /**
   * Fetch InterviewFeedback by session ID with user ownership verification.
   */
  async getInterviewFeedback(sessionId: string, userId: string) {
    const session = await db.interviewSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) return null;

    return db.interviewFeedback.findUnique({
      where: { sessionId },
    });
  },
};
