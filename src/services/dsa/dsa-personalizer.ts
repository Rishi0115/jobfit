/**
 * Pure Deterministic DSA Personalization & Recommendation Engine
 *
 * 100% Deterministic:
 * - Maps candidate target role, skills, and skill gaps to DSA topics.
 * - Computes progress, unlocked difficulties, progressive roadmap, and explainable next best question.
 * - Zero AI calls: 100% explainable algorithmic selection.
 */

import {
  DSA_TOPICS,
  DSA_TOPIC_MAP,
  ROADMAP_STAGES,
} from "@/config/dsa-topics";
import {
  DSADifficulty,
  DSAStatus,
  type DSATopicId,
  type DSAQuestionItem,
  type DSATopicProgress,
  type DSADifficultyProgress,
  type DSAProgressOverview,
  type DSARoadmapStage,
  type DSARecommendedQuestion,
} from "@/types/dsa";
import type { DSAProgress } from "@prisma/client";

/**
 * Calculate full DSA progress overview across topics and difficulty tiers.
 */
export function calculateProgressOverview(
  questions: DSAQuestionItem[],
  progressList: DSAProgress[]
): DSAProgressOverview {
  const progressMap = new Map<string, DSAProgress>(
    progressList.map((p) => [p.questionId, p])
  );

  let solvedCount = 0;
  let attemptedCount = 0;
  let incorrectCount = 0;

  // Track per-difficulty
  const diffMap: Record<DSADifficulty, { total: number; solved: number }> = {
    [DSADifficulty.EASY]: { total: 0, solved: 0 },
    [DSADifficulty.MEDIUM]: { total: 0, solved: 0 },
    [DSADifficulty.HARD]: { total: 0, solved: 0 },
  };

  // Track per-topic
  const topicStats = new Map<
    DSATopicId,
    { total: number; solved: number; attempted: number; easySolved: number; easyTotal: number }
  >();

  for (const t of DSA_TOPICS) {
    topicStats.set(t.id, {
      total: 0,
      solved: 0,
      attempted: 0,
      easySolved: 0,
      easyTotal: 0,
    });
  }

  for (const q of questions) {
    const prog = progressMap.get(q.id);
    const isSolved = prog?.status === DSAStatus.SOLVED;
    const isAttempted = prog?.status === DSAStatus.ATTEMPTED;
    const isIncorrect = prog?.status === DSAStatus.INCORRECT;

    if (isSolved) solvedCount++;
    if (isAttempted) attemptedCount++;
    if (isIncorrect) incorrectCount++;

    // Update difficulty
    if (diffMap[q.difficulty]) {
      diffMap[q.difficulty].total++;
      if (isSolved) diffMap[q.difficulty].solved++;
    }

    // Update topic
    const topicId = q.topic as DSATopicId;
    const tStat = topicStats.get(topicId);
    if (tStat) {
      tStat.total++;
      if (isSolved) tStat.solved++;
      if (isAttempted || isIncorrect) tStat.attempted++;
      if (q.difficulty === DSADifficulty.EASY) {
        tStat.easyTotal++;
        if (isSolved) tStat.easySolved++;
      }
    }
  }

  // Compile topic progress array
  const topicsProgress: DSATopicProgress[] = DSA_TOPICS.map((t) => {
    const stat = topicStats.get(t.id)!;
    const percentage =
      stat.total > 0 ? Math.round((stat.solved / stat.total) * 100) : 0;
    // Unlocked rule: Easy questions are always unlocked; Medium unlocked if easy solved >= 50% or if total easy is 0
    const isUnlocked = stat.easyTotal === 0 || stat.easySolved / stat.easyTotal >= 0.5;

    return {
      topicId: t.id,
      topicName: t.name,
      total: stat.total,
      solved: stat.solved,
      attempted: stat.attempted,
      percentage,
      isUnlocked,
    };
  });

  // Compile difficulty progress
  const difficultyProgress: DSADifficultyProgress[] = [
    {
      difficulty: DSADifficulty.EASY,
      total: diffMap[DSADifficulty.EASY].total,
      solved: diffMap[DSADifficulty.EASY].solved,
      percentage:
        diffMap[DSADifficulty.EASY].total > 0
          ? Math.round(
              (diffMap[DSADifficulty.EASY].solved /
                diffMap[DSADifficulty.EASY].total) *
                100
            )
          : 0,
    },
    {
      difficulty: DSADifficulty.MEDIUM,
      total: diffMap[DSADifficulty.MEDIUM].total,
      solved: diffMap[DSADifficulty.MEDIUM].solved,
      percentage:
        diffMap[DSADifficulty.MEDIUM].total > 0
          ? Math.round(
              (diffMap[DSADifficulty.MEDIUM].solved /
                diffMap[DSADifficulty.MEDIUM].total) *
                100
            )
          : 0,
    },
    {
      difficulty: DSADifficulty.HARD,
      total: diffMap[DSADifficulty.HARD].total,
      solved: diffMap[DSADifficulty.HARD].solved,
      percentage:
        diffMap[DSADifficulty.HARD].total > 0
          ? Math.round(
              (diffMap[DSADifficulty.HARD].solved /
                diffMap[DSADifficulty.HARD].total) *
                100
            )
          : 0,
    },
  ];

  const totalQuestions = questions.length;
  const overallPercentage =
    totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0;

  return {
    totalQuestions,
    solvedCount,
    attemptedCount,
    incorrectCount,
    overallPercentage,
    topicsProgress,
    difficultyProgress,
  };
}

/**
 * Generate 4-Stage Progressive Roadmap based on topic completion.
 */
export function generatePersonalizedRoadmap(
  topicsProgress: DSATopicProgress[]
): DSARoadmapStage[] {
  const topicProgressMap = new Map<DSATopicId, DSATopicProgress>(
    topicsProgress.map((tp) => [tp.topicId, tp])
  );

  let firstIncompleteFound = false;

  return ROADMAP_STAGES.map((stage) => {
    const stageTopics = stage.topicIds
      .map((id) => topicProgressMap.get(id))
      .filter((tp): tp is DSATopicProgress => Boolean(tp));

    const totalInStage = stageTopics.reduce((acc, t) => acc + t.total, 0);
    const solvedInStage = stageTopics.reduce((acc, t) => acc + t.solved, 0);
    const isCompleted =
      totalInStage > 0 && solvedInStage / totalInStage >= 0.75;

    let isCurrent = false;
    if (!isCompleted && !firstIncompleteFound) {
      isCurrent = true;
      firstIncompleteFound = true;
    }

    return {
      stageNumber: stage.stageNumber,
      title: stage.title,
      description: stage.description,
      topics: stageTopics,
      isCompleted,
      isCurrent,
    };
  });
}

/**
 * Deterministic "Next Best Question" recommendation algorithm.
 */
export function recommendNextQuestion(params: {
  questions: DSAQuestionItem[];
  progressList: DSAProgress[];
  targetJobSkills?: string[];
  skillGaps?: string[];
  targetRole?: string;
}): DSARecommendedQuestion | null {
  const {
    questions,
    progressList,
    targetJobSkills = [],
    skillGaps = [],
    targetRole,
  } = params;

  if (questions.length === 0) return null;

  const progressMap = new Map<string, DSAProgress>(
    progressList.map((p) => [p.questionId, p])
  );

  // Normalize skill arrays
  const normalizedJobSkills = new Set(
    targetJobSkills.map((s) => s.toLowerCase().trim())
  );
  const normalizedGaps = new Set(
    skillGaps.map((s) => s.toLowerCase().trim())
  );

  // Filter out already solved questions (repetition avoidance)
  const unsolvedQuestions = questions.filter(
    (q) => progressMap.get(q.id)?.status !== DSAStatus.SOLVED
  );

  if (unsolvedQuestions.length === 0) {
    return null; // All questions solved!
  }

  // Score each unsolved question deterministically
  let bestQuestion: DSAQuestionItem | null = null;
  let bestScore = -1;
  let bestRationale = "";
  let bestCategory: DSARecommendedQuestion["reasonCategory"] =
    "UNEXPLORED_FUNDAMENTAL";

  for (const q of unsolvedQuestions) {
    const topicId = q.topic as DSATopicId;
    const topicDef = DSA_TOPIC_MAP.get(topicId);
    const prog = progressMap.get(q.id);

    let score = 0;
    let rationale = "";
    let category: DSARecommendedQuestion["reasonCategory"] =
      "UNEXPLORED_FUNDAMENTAL";

    // 1. Check if topic relates to target job skills (+100)
    const matchesJobSkill = topicDef?.relatedSkills.some((s) =>
      normalizedJobSkills.has(s) || (targetRole && s.includes(targetRole.toLowerCase()))
    );

    // 2. Check if topic relates to Phase 7 skill gaps (+75)
    const matchesGap = topicDef?.relatedSkills.some((s) =>
      normalizedGaps.has(s)
    );

    // 3. Check if candidate previously failed/attempted this question (+50)
    const isWeakAttempt =
      prog?.status === DSAStatus.INCORRECT || prog?.status === DSAStatus.ATTEMPTED;

    if (matchesJobSkill) {
      score += 100;
      category = "TARGET_JOB_CORE";
      rationale = `Recommended because ${topicDef?.name || q.topic} is a core requirement for your target role.`;
    } else if (matchesGap) {
      score += 75;
      category = "SKILL_GAP";
      rationale = `Prioritized because your skill gap analysis identified ${topicDef?.name || q.topic} as an area for improvement.`;
    } else if (isWeakAttempt) {
      score += 50;
      category = "WEAK_AREA";
      rationale = `Recommended for mastery because you previously attempted this ${topicDef?.name || q.topic} problem.`;
    } else {
      score += 25 - (topicDef?.order ?? 10); // earlier fundamental topics get slight boost
      category = "UNEXPLORED_FUNDAMENTAL";
      rationale = `Foundational ${topicDef?.name || q.topic} problem to strengthen your algorithmic base.`;
    }

    // Difficulty balancing
    if (q.difficulty === DSADifficulty.EASY) score += 20;
    else if (q.difficulty === DSADifficulty.MEDIUM) score += 10;

    if (score > bestScore) {
      bestScore = score;
      bestQuestion = q;
      bestRationale = rationale;
      bestCategory = category;
    }
  }

  if (!bestQuestion) return null;

  return {
    question: bestQuestion,
    rationale: bestRationale,
    priorityScore: bestScore,
    reasonCategory: bestCategory,
  };
}
