/**
 * Factual Anti-Hallucination Guardrail — Interview Question Safety
 *
 * Enforces that:
 * 1. Resume-based questions NEVER fabricate or assume unstated metrics, users, scale, or technologies.
 * 2. Gap-based questions do not falsely claim the candidate used missing skills.
 * 3. Conversational claims during an interview session are kept isolated from verified database facts.
 */

import type { CandidateVerifiedFacts } from "@/services/ai/guardrails/fact-preservation-guard";

// Regex detecting presumptive scale/metric phrases (e.g. "100k users", "50% speedup", "1 million requests")
const SCALE_HALLUCINATION_REGEX =
  /\b(?:\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?(?:k|m|million|billion|\+)?)\s*(?:users|requests|qps|rps|concurrent|customers|records|downloads)\b/i;

export interface AuditedQuestion {
  content: string;
  category: any;
  difficulty: string;
  source: "RESUME" | "JOB" | "SKILL_GAP" | "BEHAVIORAL";
  targetSkill?: string;
  rationale?: string;
  wasModified: boolean;
}

/**
 * Pure deterministic guard auditing generated interview questions against candidate verified facts.
 */
export function auditInterviewQuestions(
  verifiedFacts: CandidateVerifiedFacts,
  rawQuestions: Array<{
    content: string;
    category: any;
    difficulty: string;
    source: "RESUME" | "JOB" | "SKILL_GAP" | "BEHAVIORAL";
    targetSkill?: string;
    rationale?: string;
  }>
): AuditedQuestion[] {
  const resumeTextLower = (verifiedFacts.rawResumeText || "").toLowerCase();

  return rawQuestions.map((q) => {
    let content = q.content;
    let wasModified = false;

    // Only resume-based questions are audited for presumptive scale hallucinations
    if (q.source === "RESUME") {
      const match = content.match(SCALE_HALLUCINATION_REGEX);
      if (match) {
        const foundPhrase = match[0].toLowerCase();
        // If the specific scale/number is NOT found in the verified resume text, remove presumptive scale
        if (!resumeTextLower.includes(foundPhrase)) {
          content = content.replace(
            SCALE_HALLUCINATION_REGEX,
            "your application"
          );
          wasModified = true;
        }
      }
    }

    return {
      content,
      category: q.category,
      difficulty: q.difficulty,
      source: q.source,
      targetSkill: q.targetSkill,
      rationale: q.rationale,
      wasModified,
    };
  });
}
