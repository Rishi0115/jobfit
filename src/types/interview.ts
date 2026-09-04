/**
 * Types — Phase 10: Interview Preparation & Dynamic Follow-ups
 *
 * 100% Prisma-independent interfaces.
 */

import {
  InterviewType,
  InterviewStatus,
  QuestionCategory,
} from "@prisma/client";

export { InterviewType, InterviewStatus, QuestionCategory };

export interface InterviewAnswerEvaluation {
  relevance: string;
  technicalCorrectness: string;
  depth: "SHALLOW" | "MODERATE" | "DEEP";
  clarity: string;
  completeness: string;
  score: number; // 0-100 advisory score
  strengths: string[];
  missingConcepts: string[];
  improvementSuggestions: string[];
}

export interface FollowUpItem {
  id: string;
  parentQuestionId: string;
  content: string;
  answer?: string | null;
  evaluation?: InterviewAnswerEvaluation | null;
  orderIndex: number;
  createdAt: Date;
}

export interface InterviewQuestionItem {
  id: string;
  sessionId: string;
  content: string;
  category: QuestionCategory;
  difficulty?: string | null;
  orderIndex: number;
  source: "RESUME" | "JOB" | "SKILL_GAP" | "BEHAVIORAL";
  targetSkill?: string;
  rationale?: string;
  answer?: {
    id: string;
    content: string;
    evaluation?: InterviewAnswerEvaluation | null;
    createdAt: Date;
  } | null;
  followUps: FollowUpItem[];
}

export interface InterviewSessionConfig {
  questionCount: number;
  categories: QuestionCategory[];
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

export interface InterviewFeedbackSummary {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  detailedFeedback?: string | null;
}

export interface InterviewSessionDetail {
  id: string;
  userId: string;
  jobId?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  type: InterviewType;
  status: InterviewStatus;
  config?: InterviewSessionConfig | null;
  overallScore?: number | null;
  technicalScore?: number | null;
  communicationScore?: number | null;
  feedback?: InterviewFeedbackSummary | null;
  questions: InterviewQuestionItem[];
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
}
