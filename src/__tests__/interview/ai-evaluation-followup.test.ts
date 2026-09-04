import { describe, it, expect } from "vitest";
import {
  evaluateInterviewAnswerDeterministically,
  isDuplicateFollowUp,
} from "@/services/interview/evaluation-engine";
import { followUpEngine, MAX_FOLLOW_UP_DEPTH } from "@/services/interview/follow-up-engine";
import { MockAIClient } from "@/services/ai/ai-client";
import { aiAnswerEvaluationSchema } from "@/lib/validators/interview";

describe("AI Mock Interview Evaluation & Follow-Up Logic Regression Suite", () => {
  const primaryQuestion1 =
    "Explain how you optimized database queries using indexes in PostgreSQL.";
  const primaryQuestion2 =
    "Explain how you handled complex state management and re-renders in your React frontend.";

  // 1. Blank answer cannot score 85 or high
  it("1. blank or whitespace-only answer cannot score 85 or high", () => {
    const res1 = evaluateInterviewAnswerDeterministically({
      questionContent: primaryQuestion1,
      candidateAnswer: "   ",
      currentFollowUpDepth: 0,
    });

    expect(res1.evaluation.score).toBeLessThanOrEqual(10);
    expect(res1.evaluation.score).not.toBe(85);
    expect(res1.shouldAskFollowUp).toBe(false);
    expect(res1.followUpQuestion).toBeNull();
  });

  // 2. Garbage answer scores low
  it("2. garbage or non-responsive answer scores low (e.g. 'j', 'jnedckj', 'hello')", () => {
    const garbageInputs = ["j", "hello", "abc", "jnedckj", "qwertyuiop"];

    for (const garbage of garbageInputs) {
      const res = evaluateInterviewAnswerDeterministically({
        questionContent: primaryQuestion1,
        candidateAnswer: garbage,
        currentFollowUpDepth: 0,
      });

      expect(res.evaluation.score).toBeLessThanOrEqual(20);
      expect(res.evaluation.score).not.toBe(85);
      expect(res.shouldAskFollowUp).toBe(false);
    }
  });

  // 3. Relevant answer scores materially higher than garbage
  it("3. relevant answer scores materially higher than garbage", () => {
    const garbageRes = evaluateInterviewAnswerDeterministically({
      questionContent: primaryQuestion1,
      candidateAnswer: "jnedckj",
      currentFollowUpDepth: 0,
    });

    const relevantAnswer =
      "I identified slow query execution using EXPLAIN ANALYZE in PostgreSQL. We added composite B-Tree indexes on foreign keys and tenant ID, which reduced sequential scans and lowered query latency from 800ms to 25ms.";

    const relevantRes = evaluateInterviewAnswerDeterministically({
      questionContent: primaryQuestion1,
      candidateAnswer: relevantAnswer,
      currentFollowUpDepth: 0,
    });

    expect(relevantRes.evaluation.score).toBeGreaterThanOrEqual(70);
    expect(relevantRes.evaluation.score).toBeGreaterThan(garbageRes.evaluation.score + 50);
    expect(relevantRes.evaluation.depth).toBe("DEEP");
    expect(relevantRes.evaluation.strengths.length).toBeGreaterThan(0);
  });

  // 4. Same question with different answers produces different evaluations
  it("4. same question with different answers produces different evaluations", () => {
    const shallowAnswer = "I just created some indexes on the database tables.";
    const deepAnswer =
      "We resolved query bottlenecks in PostgreSQL by analyzing slow query logs. By introducing partial indexes for active records and adjusting the work_mem allocation, we prevented disk spilling and achieved a 4x throughput gain.";

    const shallowEval = evaluateInterviewAnswerDeterministically({
      questionContent: primaryQuestion1,
      candidateAnswer: shallowAnswer,
      currentFollowUpDepth: 0,
    });

    const deepEval = evaluateInterviewAnswerDeterministically({
      questionContent: primaryQuestion1,
      candidateAnswer: deepAnswer,
      currentFollowUpDepth: 0,
    });

    expect(deepEval.evaluation.score).toBeGreaterThan(shallowEval.evaluation.score);
    expect(deepEval.evaluation.missingConcepts).not.toEqual(shallowEval.evaluation.missingConcepts);
  });

  // 5. Different questions produce different follow-ups
  it("5. different primary questions produce contextually different follow-ups", () => {
    const dbAnswer =
      "In PostgreSQL, I added composite indexes and checked table bloat using pg_stat_user_tables.";
    const reactAnswer =
      "In React, I used Zustand for global store and memoized selectors to avoid re-rendering entire component trees.";

    const dbEval = evaluateInterviewAnswerDeterministically({
      questionContent: primaryQuestion1,
      candidateAnswer: dbAnswer,
      currentFollowUpDepth: 0,
    });

    const reactEval = evaluateInterviewAnswerDeterministically({
      questionContent: primaryQuestion2,
      candidateAnswer: reactAnswer,
      currentFollowUpDepth: 0,
    });

    expect(dbEval.followUpQuestion).toBeTruthy();
    expect(reactEval.followUpQuestion).toBeTruthy();
    expect(dbEval.followUpQuestion).not.toBe(reactEval.followUpQuestion);
    expect(dbEval.followUpQuestion?.toLowerCase()).toContain("index");
    expect(reactEval.followUpQuestion?.toLowerCase()).toContain("render");
  });

  // 6. Depth 2 follow-up differs from depth 1
  it("6. depth 2 follow-up differs from depth 1", () => {
    const dbAnswer1 =
      "I optimized queries using PostgreSQL indexes and examined execution plans.";

    const depth1Result = evaluateInterviewAnswerDeterministically({
      questionContent: primaryQuestion1,
      candidateAnswer: dbAnswer1,
      currentFollowUpDepth: 0,
    });

    expect(depth1Result.shouldAskFollowUp).toBe(true);
    const fu1 = depth1Result.followUpQuestion!;

    const depth2Result = evaluateInterviewAnswerDeterministically({
      questionContent: primaryQuestion1,
      candidateAnswer: "I inspect shared buffer hits and look for index scans instead of seq scans.",
      previousFollowUps: [{ question: fu1, answer: "I look at execution time and buffer usage." }],
      currentFollowUpDepth: 1,
    });

    expect(depth2Result.shouldAskFollowUp).toBe(true);
    const fu2 = depth2Result.followUpQuestion!;

    expect(fu2).not.toBe(fu1);
    expect(isDuplicateFollowUp(fu2, [fu1, primaryQuestion1])).toBe(false);
  });

  // 7. Follow-up generation uses previous answer/context
  it("7. follow-up generation uses previous answer and context", () => {
    const resultWithCacheContext = evaluateInterviewAnswerDeterministically({
      questionContent: primaryQuestion1,
      candidateAnswer: "We mitigated slow queries by putting a Redis cache in front of Postgres.",
      previousFollowUps: [
        {
          question: "How do you handle heavy database reads?",
          answer: "We implemented distributed caching with Redis.",
        },
      ],
      currentFollowUpDepth: 1,
    });

    expect(resultWithCacheContext.followUpQuestion).toBeTruthy();
    expect(resultWithCacheContext.followUpQuestion?.toLowerCase()).toMatch(/cache|traffic|stampede|herd/);
  });

  // 8. Duplicate follow-ups are rejected/prevented
  it("8. duplicate follow-ups are detected and prevented", () => {
    const questionA = "Why did you choose that approach over alternative solutions?";
    const existing = [
      "Explain your system design.",
      "Why did you choose that approach over alternative solutions?",
    ];

    expect(isDuplicateFollowUp(questionA, existing)).toBe(true);

    // Minor case/whitespace differences must also be caught
    const questionWithSpaces = "   why did you choose that approach over alternative solutions?  ";
    expect(isDuplicateFollowUp(questionWithSpaces, existing)).toBe(true);
  });

  // 9. Max follow-up depth remains 2
  it("9. maximum follow-up depth remains 2 and stops spawning follow-ups at depth 2", async () => {
    expect(MAX_FOLLOW_UP_DEPTH).toBe(2);

    const resultAtMax = await followUpEngine.evaluateAndFollowUp({
      questionContent: primaryQuestion1,
      candidateAnswer: "We set up automated failover and read replicas.",
      previousFollowUps: [
        { question: "Probe 1?", answer: "Answer 1" },
        { question: "Probe 2?", answer: "Answer 2" },
      ],
      currentFollowUpDepth: 2, // At maximum depth
    });

    expect(resultAtMax.shouldAskFollowUp).toBe(false);
    expect(resultAtMax.followUpQuestion).toBeNull();
  });

  // 10. MockAIClient integration behaves realistically and deterministically
  it("10. MockAIClient uses deterministic evaluator and does not return constant 85", async () => {
    const client = new MockAIClient();

    // Test with garbage answer in prompt
    const garbagePrompt = `=== PRIMARY INTERVIEW QUESTION ===
${primaryQuestion1}

=== CANDIDATE'S CURRENT ANSWER ===
jnedckj

=== CONSTRAINTS ===
Current Follow-up Depth: 0 of 2`;

    const resGarbage = await client.generateStructuredOutput({
      prompt: garbagePrompt,
      systemPrompt: "You are JobFit's senior Engineering Interviewer",
      schema: aiAnswerEvaluationSchema,
    });

    expect(resGarbage.evaluation.score).toBeLessThanOrEqual(20);
    expect(resGarbage.evaluation.score).not.toBe(85);

    // Test with substantive answer in prompt
    const goodPrompt = `=== PRIMARY INTERVIEW QUESTION ===
${primaryQuestion1}

=== CANDIDATE'S CURRENT ANSWER ===
In PostgreSQL, I analyzed query execution plans using EXPLAIN ANALYZE and created B-Tree indexes on indexed fields to eliminate sequential scans, decreasing latency by 90%.

=== CONSTRAINTS ===
Current Follow-up Depth: 0 of 2`;

    const resGood = await client.generateStructuredOutput({
      prompt: goodPrompt,
      systemPrompt: "You are JobFit's senior Engineering Interviewer",
      schema: aiAnswerEvaluationSchema,
    });

    expect(resGood.evaluation.score).toBeGreaterThanOrEqual(70);
    expect(resGood.shouldAskFollowUp).toBe(true);
    expect(resGood.followUpQuestion).toBeTruthy();
  });
});
