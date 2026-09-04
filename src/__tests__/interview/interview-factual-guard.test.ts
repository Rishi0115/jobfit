import { describe, it, expect } from "vitest";
import { auditInterviewQuestions } from "@/services/interview/guardrails/interview-factual-guard";
import { QuestionCategory } from "@prisma/client";

describe("Interview Question Factual Guardrail", () => {
  const baseVerifiedFacts = {
    rawResumeText:
      "Frontend developer building web applications with React, TypeScript, and Redux for an internal tools dashboard.",
    skills: ["React", "TypeScript", "Redux"],
  };

  it("should sanitize presumptive scale/metric hallucinations not found in candidate facts", () => {
    const rawQuestions = [
      {
        content:
          "In your React dashboard project, how did you architect the system to handle 100k users concurrently?",
        category: QuestionCategory.PROJECT,
        difficulty: "medium",
        source: "RESUME" as const,
      },
    ];

    const audited = auditInterviewQuestions(baseVerifiedFacts, rawQuestions);

    expect(audited.length).toBe(1);
    expect(audited[0].wasModified).toBe(true);
    // Presumptive "100k users" should be neutralized
    expect(audited[0].content).not.toContain("100k users");
    expect(audited[0].content).toContain("your application");
  });

  it("should preserve questions that only reference verified candidate facts", () => {
    const rawQuestions = [
      {
        content:
          "Can you explain your state management strategy using Redux in your React dashboard project?",
        category: QuestionCategory.TECHNICAL,
        difficulty: "medium",
        source: "RESUME" as const,
      },
    ];

    const audited = auditInterviewQuestions(baseVerifiedFacts, rawQuestions);

    expect(audited.length).toBe(1);
    expect(audited[0].wasModified).toBe(false);
    expect(audited[0].content).toBe(rawQuestions[0].content);
  });

  it("should allow verified numbers when they actually exist in the resume text", () => {
    const factsWithMetric = {
      rawResumeText:
        "Engineered streaming pipeline processing 50k requests per minute.",
      skills: ["Kafka", "Go"],
    };

    const rawQuestions = [
      {
        content:
          "How did you monitor the pipeline processing 50k requests to ensure zero data loss?",
        category: QuestionCategory.PROJECT,
        difficulty: "hard",
        source: "RESUME" as const,
      },
    ];

    const audited = auditInterviewQuestions(factsWithMetric, rawQuestions);

    expect(audited[0].wasModified).toBe(false);
    expect(audited[0].content).toContain("50k requests");
  });
});
