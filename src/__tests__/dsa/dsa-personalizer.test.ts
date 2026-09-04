import { describe, it, expect } from "vitest";
import {
  calculateProgressOverview,
  generatePersonalizedRoadmap,
  recommendNextQuestion,
} from "@/services/dsa/dsa-personalizer";
import {
  DSADifficulty,
  DSAStatus,
  type DSAQuestionItem,
} from "@/types/dsa";
import type { DSAProgress } from "@prisma/client";

describe("DSA Personalization & Recommendation Engine", () => {
  const sampleQuestions: DSAQuestionItem[] = [
    {
      id: "q-1",
      title: "Two Sum",
      topic: "arrays",
      difficulty: DSADifficulty.EASY,
      hints: ["Use hash map"],
      tags: ["arrays", "hashing"],
      isGenerated: false,
      problemStatement: "Find two sum",
      createdAt: new Date(),
    },
    {
      id: "q-2",
      title: "3Sum",
      topic: "two_pointers",
      difficulty: DSADifficulty.MEDIUM,
      hints: ["Sort first"],
      tags: ["two_pointers"],
      isGenerated: false,
      problemStatement: "Find triplets",
      createdAt: new Date(),
    },
    {
      id: "q-3",
      title: "Number of Islands",
      topic: "graph",
      difficulty: DSADifficulty.MEDIUM,
      hints: ["DFS flood fill"],
      tags: ["graph", "dfs"],
      isGenerated: false,
      problemStatement: "Count islands",
      createdAt: new Date(),
    },
    {
      id: "q-4",
      title: "Climbing Stairs",
      topic: "dynamic_programming",
      difficulty: DSADifficulty.EASY,
      hints: ["Fibonacci"],
      tags: ["dp"],
      isGenerated: false,
      problemStatement: "Count stair ways",
      createdAt: new Date(),
    },
  ];

  it("should calculate progress overview deterministically", () => {
    const progressList: DSAProgress[] = [
      {
        id: "p-1",
        userId: "u1",
        questionId: "q-1",
        status: DSAStatus.SOLVED,
        userApproach: "Used map",
        attempts: 1,
        solvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "p-2",
        userId: "u1",
        questionId: "q-3",
        status: DSAStatus.INCORRECT,
        userApproach: "DFS timed out",
        attempts: 2,
        solvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const overview = calculateProgressOverview(sampleQuestions, progressList);

    expect(overview.totalQuestions).toBe(4);
    expect(overview.solvedCount).toBe(1);
    expect(overview.incorrectCount).toBe(1);
    expect(overview.overallPercentage).toBe(25);

    // Arrays topic has 1 question and it is solved
    const arrayTopic = overview.topicsProgress.find((t) => t.topicId === "arrays");
    expect(arrayTopic?.solved).toBe(1);
    expect(arrayTopic?.percentage).toBe(100);

    // Graph topic has 1 question and it is attempted/incorrect
    const graphTopic = overview.topicsProgress.find((t) => t.topicId === "graph");
    expect(graphTopic?.solved).toBe(0);
    expect(graphTopic?.attempted).toBe(1);
  });

  it("should generate 4-stage progressive roadmap with stage completion detection", () => {
    const progressList: DSAProgress[] = [
      {
        id: "p-1",
        userId: "u1",
        questionId: "q-1",
        status: DSAStatus.SOLVED,
        userApproach: null,
        attempts: 1,
        solvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const overview = calculateProgressOverview(sampleQuestions, progressList);
    const roadmap = generatePersonalizedRoadmap(overview.topicsProgress);

    expect(roadmap.length).toBe(4);
    expect(roadmap[0].stageNumber).toBe(1);
    expect(roadmap[0].isCurrent).toBe(true); // Stage 1 is current since not fully complete
  });

  it("should recommend target job core skills first and avoid solved questions", () => {
    const progressList: DSAProgress[] = [
      {
        id: "p-1",
        userId: "u1",
        questionId: "q-1", // Two Sum is already solved!
        status: DSAStatus.SOLVED,
        userApproach: null,
        attempts: 1,
        solvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Target job requires graphs
    const recommendation = recommendNextQuestion({
      questions: sampleQuestions,
      progressList,
      targetJobSkills: ["graph", "bfs", "dfs"],
    });

    expect(recommendation).not.toBeNull();
    // Must NOT recommend q-1 because it is already solved
    expect(recommendation?.question.id).not.toBe("q-1");
    // Should recommend graph problem
    expect(recommendation?.question.id).toBe("q-3");
    expect(recommendation?.reasonCategory).toBe("TARGET_JOB_CORE");
    expect(recommendation?.rationale).toContain("core requirement");
  });

  it("should prioritize skill gaps and weak areas when no direct job skill matches", () => {
    const progressList: DSAProgress[] = [
      {
        id: "p-2",
        userId: "u1",
        questionId: "q-3",
        status: DSAStatus.INCORRECT, // User failed graph question previously
        userApproach: null,
        attempts: 1,
        solvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const recommendation = recommendNextQuestion({
      questions: sampleQuestions,
      progressList,
      skillGaps: ["dynamic programming"],
    });

    expect(recommendation).not.toBeNull();
    // Dynamic programming skill gap gets priority
    expect(recommendation?.question.topic).toBe("dynamic_programming");
    expect(recommendation?.reasonCategory).toBe("SKILL_GAP");
  });

  it("should return null when all questions are already solved", () => {
    const allSolvedProgress: DSAProgress[] = sampleQuestions.map((q, idx) => ({
      id: `p-${idx}`,
      userId: "u1",
      questionId: q.id,
      status: DSAStatus.SOLVED,
      userApproach: null,
      attempts: 1,
      solvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const recommendation = recommendNextQuestion({
      questions: sampleQuestions,
      progressList: allSolvedProgress,
    });

    expect(recommendation).toBeNull();
  });
});
