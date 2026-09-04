/**
 * Data Access Layer — DSA Questions & User Progress
 *
 * Enforces user ownership constraints on all progress mutations.
 */

import { db } from "@/lib/db";
import { DSADifficulty, DSAStatus, type DSAQuestion, type DSAProgress } from "@prisma/client";
import { SEED_DSA_QUESTIONS } from "@/services/dsa/seed-questions";

export const dsaDAL = {
  /**
   * Automatically seed foundational questions if the table is empty.
   */
  async ensureSeedQuestions(): Promise<void> {
    const count = await db.dSAQuestion.count();
    if (count > 0) return;

    for (const q of SEED_DSA_QUESTIONS) {
      await db.dSAQuestion.create({
        data: {
          title: q.title,
          problemStatement: q.problemStatement,
          topic: q.topic,
          difficulty: q.difficulty,
          hints: q.hints,
          expectedApproach: q.expectedApproach,
          solution: q.solution,
          timeComplexity: q.timeComplexity,
          spaceComplexity: q.spaceComplexity,
          relatedConcepts: q.relatedConcepts,
          tags: q.tags,
          isGenerated: false,
        },
      });
    }
  },

  /**
   * Fetch all DSA questions with optional topic or difficulty filter.
   */
  async getQuestions(filters?: {
    topic?: string;
    difficulty?: DSADifficulty;
  }): Promise<DSAQuestion[]> {
    await this.ensureSeedQuestions();

    return db.dSAQuestion.findMany({
      where: {
        ...(filters?.topic ? { topic: filters.topic } : {}),
        ...(filters?.difficulty ? { difficulty: filters.difficulty } : {}),
      },
      orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
    });
  },

  /**
   * Fetch a single question by ID.
   */
  async getQuestionById(id: string): Promise<DSAQuestion | null> {
    return db.dSAQuestion.findUnique({
      where: { id },
    });
  },

  /**
   * Fetch all DSA progress records for a user.
   */
  async getUserProgress(userId: string): Promise<DSAProgress[]> {
    return db.dSAProgress.findMany({
      where: { userId },
    });
  },

  /**
   * Fetch progress for a single question for a user.
   */
  async getUserQuestionProgress(
    userId: string,
    questionId: string
  ): Promise<DSAProgress | null> {
    return db.dSAProgress.findUnique({
      where: {
        userId_questionId: {
          userId,
          questionId,
        },
      },
    });
  },

  /**
   * Atomically upsert a user's DSA progress on a question.
   * Increments attempts count and sets solvedAt on SOLVED.
   */
  async upsertProgress(params: {
    userId: string;
    questionId: string;
    status: DSAStatus;
    userApproach?: string;
  }): Promise<DSAProgress> {
    const { userId, questionId, status, userApproach } = params;

    const existing = await db.dSAProgress.findUnique({
      where: {
        userId_questionId: {
          userId,
          questionId,
        },
      },
    });

    const isNowSolved = status === DSAStatus.SOLVED;
    const solvedAt = isNowSolved ? (existing?.solvedAt ?? new Date()) : null;

    if (existing) {
      return db.dSAProgress.update({
        where: { id: existing.id },
        data: {
          status,
          userApproach: userApproach ?? existing.userApproach,
          attempts: { increment: 1 },
          solvedAt,
        },
      });
    }

    return db.dSAProgress.create({
      data: {
        userId,
        questionId,
        status,
        userApproach,
        attempts: 1,
        solvedAt,
      },
    });
  },
};
