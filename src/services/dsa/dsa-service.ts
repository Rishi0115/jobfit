/**
 * DSA Service Orchestrator
 *
 * Coordinates question loading, candidate profile fetching,
 * deterministic personalization, and roadmap generation.
 */

import { dsaDAL } from "@/dal/dsa";
import { matchingDAL } from "@/dal/matching";
import {
  calculateProgressOverview,
  generatePersonalizedRoadmap,
  recommendNextQuestion,
} from "./dsa-personalizer";
import { SEED_PRACTICE_LINKS } from "./seed-questions";
import type {
  DSADashboardData,
  DSAQuestionItem,
} from "@/types/dsa";
import { DSAStatus, type DSAQuestion } from "@prisma/client";

function mapToQuestionItem(
  q: DSAQuestion,
  progressMap: Map<string, any>
): DSAQuestionItem {
  const prog = progressMap.get(q.id);

  return {
    id: q.id,
    title: q.title,
    problemStatement: q.problemStatement,
    topic: q.topic,
    difficulty: q.difficulty,
    hints: Array.isArray(q.hints) ? (q.hints as string[]) : [],
    expectedApproach: q.expectedApproach,
    solution: q.solution,
    timeComplexity: q.timeComplexity,
    spaceComplexity: q.spaceComplexity,
    relatedConcepts: Array.isArray(q.relatedConcepts)
      ? (q.relatedConcepts as string[])
      : [],
    tags: q.tags,
    isGenerated: q.isGenerated,
    createdAt: q.createdAt,
    practiceLinks: SEED_PRACTICE_LINKS[q.title] || [],
    userProgress: prog
      ? {
          status: prog.status,
          userApproach: prog.userApproach,
          attempts: prog.attempts,
          solvedAt: prog.solvedAt,
        }
      : null,
  };
}

export class DSAService {
  /**
   * Assemble full personalized DSA Dashboard for the authenticated user.
   */
  async getDashboardData(userId: string): Promise<DSADashboardData> {
    // 1. Fetch all questions and user progress
    const [rawQuestions, rawProgress] = await Promise.all([
      dsaDAL.getQuestions(),
      dsaDAL.getUserProgress(userId),
    ]);

    const progressMap = new Map<string, any>(
      rawProgress.map((p) => [p.questionId, p])
    );

    const questions: DSAQuestionItem[] = rawQuestions.map((q) =>
      mapToQuestionItem(q, progressMap)
    );

    // 2. Fetch candidate profile for personalization context (skills, target role)
    const candidateProfile = await matchingDAL.getCandidateProfile(userId);

    // 3. Compute deterministic progress overview
    const overview = calculateProgressOverview(questions, rawProgress);

    // 4. Generate progressive roadmap
    const roadmap = generatePersonalizedRoadmap(overview.topicsProgress);

    // 5. Compute "Next Best Question" recommendation
    const recommendedQuestion = recommendNextQuestion({
      questions,
      progressList: rawProgress,
      targetJobSkills: candidateProfile?.skills || [],
      targetRole: candidateProfile?.targetRole || undefined,
    });

    // 6. Recent attempts
    const recentAttempts = questions
      .filter((q) => q.userProgress && q.userProgress.attempts > 0)
      .sort((a, b) => {
        const dateA = a.userProgress?.solvedAt ? new Date(a.userProgress.solvedAt).getTime() : 0;
        const dateB = b.userProgress?.solvedAt ? new Date(b.userProgress.solvedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);

    return {
      overview,
      roadmap,
      recommendedQuestion,
      recentAttempts,
      allQuestions: questions,
    };
  }

  /**
   * Fetch single question with user progress.
   */
  async getQuestionDetail(
    userId: string,
    questionId: string
  ): Promise<DSAQuestionItem | null> {
    const [question, progress] = await Promise.all([
      dsaDAL.getQuestionById(questionId),
      dsaDAL.getUserQuestionProgress(userId, questionId),
    ]);

    if (!question) return null;

    const progressMap = new Map<string, any>();
    if (progress) progressMap.set(progress.questionId, progress);

    return mapToQuestionItem(question, progressMap);
  }
}

export const dsaService = new DSAService();
