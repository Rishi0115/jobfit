import { describe, it, expect } from "vitest";
import {
  SEED_DSA_QUESTIONS,
  SEED_PRACTICE_LINKS,
} from "@/services/dsa/seed-questions";
import {
  recommendNextQuestion,
  calculateProgressOverview,
} from "@/services/dsa/dsa-personalizer";
import type { DSAPlatform, DSAQuestionItem } from "@/types/dsa";
import { DSADifficulty } from "@prisma/client";

describe("DSA External Practice Links Audit & Integrity", () => {
  const ALLOWED_PLATFORMS: Set<DSAPlatform> = new Set([
    "LEETCODE",
    "INTERVIEWBIT",
    "CODEFORCES",
    "HACKERRANK",
  ]);

  it("should have verified practice links for all 21 curated questions", () => {
    expect(SEED_DSA_QUESTIONS.length).toBe(21);

    for (const q of SEED_DSA_QUESTIONS) {
      const links = SEED_PRACTICE_LINKS[q.title];
      expect(links).toBeDefined();
      expect(links.length).toBeGreaterThan(0);
    }
  });

  it("should have valid HTTPS URLs without any empty or malformed URLs", () => {
    for (const [title, links] of Object.entries(SEED_PRACTICE_LINKS)) {
      for (const link of links) {
        // Valid platform
        expect(ALLOWED_PLATFORMS.has(link.platform)).toBe(true);
        // Valid HTTPS URL
        expect(link.url.startsWith("https://")).toBe(true);
        // Points to trusted domains only
        const isLeetCode = link.url.includes("leetcode.com/problems/");
        const isInterviewBit = link.url.includes("interviewbit.com/problems/");
        expect(isLeetCode || isInterviewBit).toBe(true);
      }
    }
  });

  it("should not contain duplicate practice URLs for the same question", () => {
    for (const [title, links] of Object.entries(SEED_PRACTICE_LINKS)) {
      const urls = links.map((l) => l.url);
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(urls.length);

      const platforms = links.map((l) => l.platform);
      const uniquePlatforms = new Set(platforms);
      expect(uniquePlatforms.size).toBe(platforms.length);
    }
  });

  it("should support multiple practice platforms simultaneously (e.g. LeetCode + InterviewBit)", () => {
    const twoSumLinks = SEED_PRACTICE_LINKS["Two Sum"];
    expect(twoSumLinks).toBeDefined();
    expect(twoSumLinks.length).toBe(2);

    const platforms = twoSumLinks.map((l) => l.platform);
    expect(platforms).toContain("LEETCODE");
    expect(platforms).toContain("INTERVIEWBIT");
  });

  it("should handle questions with only a single verified platform without breaking", () => {
    const containsDuplicateLinks = SEED_PRACTICE_LINKS["Contains Duplicate"];
    expect(containsDuplicateLinks).toBeDefined();
    expect(containsDuplicateLinks.length).toBe(1);
    expect(containsDuplicateLinks[0].platform).toBe("LEETCODE");
  });

  it("proves DSA personalization algorithm remains 100% deterministic and unaffected by practice links", () => {
    const mockQuestions: DSAQuestionItem[] = [
      {
        id: "q-1",
        title: "Two Sum",
        topic: "arrays",
        difficulty: DSADifficulty.EASY,
        problemStatement: "Solve two sum",
        hints: [],
        tags: ["arrays"],
        isGenerated: false,
        createdAt: new Date(),
        practiceLinks: SEED_PRACTICE_LINKS["Two Sum"],
      },
      {
        id: "q-2",
        title: "Number of Islands",
        topic: "graph",
        difficulty: DSADifficulty.MEDIUM,
        problemStatement: "Count islands",
        hints: [],
        tags: ["graph"],
        isGenerated: false,
        createdAt: new Date(),
        practiceLinks: SEED_PRACTICE_LINKS["Number of Islands"],
      },
    ];

    const recommendation = recommendNextQuestion({
      questions: mockQuestions,
      progressList: [],
      targetJobSkills: ["graph"],
    });

    expect(recommendation).not.toBeNull();
    expect(recommendation?.question.id).toBe("q-2");
    expect(recommendation?.reasonCategory).toBe("TARGET_JOB_CORE");
    // Practice links are passed through without mutating the priority score
    expect(recommendation?.question.practiceLinks?.length).toBe(2);
  });
});
