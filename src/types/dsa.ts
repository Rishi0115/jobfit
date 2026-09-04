/**
 * Types — Phase 9: Personalized DSA Preparation
 *
 * 100% Prisma-independent interfaces.
 */

import { DSADifficulty, DSAStatus } from "@prisma/client";

export { DSADifficulty, DSAStatus };

export type DSATopicId =
  | "arrays"
  | "strings"
  | "linked_list"
  | "stack"
  | "queue"
  | "hashing"
  | "recursion"
  | "trees"
  | "bst"
  | "heap"
  | "graph"
  | "dynamic_programming"
  | "greedy"
  | "binary_search"
  | "sorting"
  | "sliding_window"
  | "two_pointers"
  | "backtracking";

export interface DSATopicDefinition {
  id: DSATopicId;
  name: string;
  order: number;
  description: string;
  relatedSkills: string[];
}

export type DSAPlatform =
  | "LEETCODE"
  | "INTERVIEWBIT"
  | "CODEFORCES"
  | "HACKERRANK";

export interface DSAPracticeLink {
  platform: DSAPlatform;
  url: string;
}

export interface DSAQuestionItem {
  id: string;
  title: string;
  problemStatement: string;
  topic: string;
  difficulty: DSADifficulty;
  hints: string[];
  expectedApproach?: string | null;
  solution?: string | null;
  timeComplexity?: string | null;
  spaceComplexity?: string | null;
  relatedConcepts?: string[] | null;
  tags: string[];
  isGenerated: boolean;
  createdAt: Date;
  practiceLinks?: DSAPracticeLink[];
  userProgress?: {
    status: DSAStatus;
    userApproach?: string | null;
    attempts: number;
    solvedAt?: Date | null;
  } | null;
}

export interface DSATopicProgress {
  topicId: DSATopicId;
  topicName: string;
  total: number;
  solved: number;
  attempted: number;
  percentage: number;
  isUnlocked: boolean;
}

export interface DSADifficultyProgress {
  difficulty: DSADifficulty;
  total: number;
  solved: number;
  percentage: number;
}

export interface DSAProgressOverview {
  totalQuestions: number;
  solvedCount: number;
  attemptedCount: number;
  incorrectCount: number;
  overallPercentage: number;
  topicsProgress: DSATopicProgress[];
  difficultyProgress: DSADifficultyProgress[];
}

export interface DSARoadmapStage {
  stageNumber: number;
  title: string;
  description: string;
  topics: DSATopicProgress[];
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface DSARecommendedQuestion {
  question: DSAQuestionItem;
  rationale: string;
  priorityScore: number;
  reasonCategory:
    | "TARGET_JOB_CORE"
    | "SKILL_GAP"
    | "WEAK_AREA"
    | "UNEXPLORED_FUNDAMENTAL";
}

export interface DSADashboardData {
  overview: DSAProgressOverview;
  roadmap: DSARoadmapStage[];
  recommendedQuestion: DSARecommendedQuestion | null;
  recentAttempts: DSAQuestionItem[];
  allQuestions: DSAQuestionItem[];
}
