import { describe, it, expect } from "vitest";
import { followUpEngine, MAX_FOLLOW_UP_DEPTH } from "@/services/interview/follow-up-engine";

describe("Dynamic Follow-Up & Answer Evaluation Engine", () => {
  it("should evaluate answer and generate a follow-up at depth 0", async () => {
    const result = await followUpEngine.evaluateAndFollowUp({
      questionContent:
        "Explain how you handled state management in your frontend application.",
      candidateAnswer:
        "I used React Context API for global state and local state with useState.",
      currentFollowUpDepth: 0,
    });

    expect(result.evaluation).toBeDefined();
    expect(result.evaluation.score).toBeGreaterThanOrEqual(0);
    expect(result.evaluation.score).toBeLessThanOrEqual(100);
    expect(result.shouldAskFollowUp).toBe(true);
    expect(result.followUpQuestion).toBeDefined();
    expect(typeof result.followUpQuestion).toBe("string");
  });

  it("should cap follow-up depth and force shouldAskFollowUp to false at MAX_FOLLOW_UP_DEPTH", async () => {
    const result = await followUpEngine.evaluateAndFollowUp({
      questionContent:
        "Explain how you handled state management in your frontend application.",
      candidateAnswer:
        "We switched to Zustand because it avoided unnecessary re-renders that we saw with Context.",
      previousFollowUps: [
        {
          question: "Why did you choose Context over Redux or Zustand?",
          answer: "Context was built-in and didn't require extra bundle size.",
        },
        {
          question: "Did you encounter performance bottlenecks with re-renders?",
          answer: "Yes, deeply nested components were re-rendering.",
        },
      ],
      currentFollowUpDepth: MAX_FOLLOW_UP_DEPTH, // 2
    });

    expect(result.evaluation).toBeDefined();
    // Bounded context constraint: At depth 2, must not spawn further follow-ups
    expect(result.shouldAskFollowUp).toBe(false);
    expect(result.followUpQuestion).toBeNull();
  });
});
