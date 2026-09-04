/**
 * Dynamic Follow-up Engine
 *
 * Evaluates candidate responses for correctness, technical depth, and clarity.
 * Synthesizes intelligent follow-up questions bounded by a strict maximum depth.
 */

import { aiClient } from "@/services/ai/ai-client";
import {
  INTERVIEW_EVALUATION_SYSTEM_PROMPT,
  buildAnswerEvaluationPrompt,
} from "./prompts/interview-prompts";
import {
  aiAnswerEvaluationSchema,
  type AIAnswerEvaluationOutput,
} from "@/lib/validators/interview";
import { isDuplicateFollowUp } from "./evaluation-engine";

export const MAX_FOLLOW_UP_DEPTH = 2;

export class FollowUpEngine {
  /**
   * Evaluate candidate's answer and optionally formulate a dynamic follow-up question.
   */
  async evaluateAndFollowUp(params: {
    questionContent: string;
    candidateAnswer: string;
    previousFollowUps?: Array<{ question: string; answer?: string | null }>;
    currentFollowUpDepth: number;
  }): Promise<AIAnswerEvaluationOutput> {
    const {
      questionContent,
      candidateAnswer,
      previousFollowUps = [],
      currentFollowUpDepth,
    } = params;

    // Deterministic constraint: If max depth reached, do not ask further follow-ups
    if (currentFollowUpDepth >= MAX_FOLLOW_UP_DEPTH) {
      const prompt = buildAnswerEvaluationPrompt({
        questionContent,
        candidateAnswer,
        previousFollowUps,
        currentFollowUpDepth,
        maxFollowUpDepth: MAX_FOLLOW_UP_DEPTH,
      });

      const res = await aiClient.generateStructuredOutput({
        prompt,
        systemPrompt: INTERVIEW_EVALUATION_SYSTEM_PROMPT,
        schema: aiAnswerEvaluationSchema,
        temperature: 0.2,
      });

      return {
        ...res,
        shouldAskFollowUp: false,
        followUpQuestion: null,
      };
    }

    const prompt = buildAnswerEvaluationPrompt({
      questionContent,
      candidateAnswer,
      previousFollowUps,
      currentFollowUpDepth,
      maxFollowUpDepth: MAX_FOLLOW_UP_DEPTH,
    });

    const res = await aiClient.generateStructuredOutput({
      prompt,
      systemPrompt: INTERVIEW_EVALUATION_SYSTEM_PROMPT,
      schema: aiAnswerEvaluationSchema,
      temperature: 0.3,
    });

    // Enforce depth cap deterministically
    if (currentFollowUpDepth >= MAX_FOLLOW_UP_DEPTH) {
      return {
        ...res,
        shouldAskFollowUp: false,
        followUpQuestion: null,
      };
    }

    // Semantic & content duplicate prevention
    const existing = [
      questionContent,
      ...previousFollowUps.map((f) => f.question),
    ];

    if (res.shouldAskFollowUp && res.followUpQuestion) {
      if (isDuplicateFollowUp(res.followUpQuestion, existing)) {
        return {
          ...res,
          shouldAskFollowUp: false,
          followUpQuestion: null,
          followUpRationale: null,
        };
      }
    }

    return res;
  }
}

export const followUpEngine = new FollowUpEngine();
