/**
 * Interview Preparation & Dynamic Follow-up — Centralized Prompts
 *
 * Enforces strict factual constraints, bounded context windows,
 * and structured advisory evaluations.
 */

import type { InterviewType } from "@prisma/client";

export const INTERVIEW_GENERATION_SYSTEM_PROMPT = `
You are JobFit's expert Technical Interviewer and Engineering Hiring Manager.

PRIMARY OBJECTIVE:
Generate realistic, high-signal interview questions tailored to the candidate's verified profile and/or target role.

STRICT FACTUAL CONSTRAINTS:
1. NEVER fabricate candidate qualifications, achievements, employer names, or project scale.
2. If asking about a project in the resume, ask about implementation details and trade-offs. NEVER invent numbers like "handling 1M users" unless that exact metric is in the verified resume text.
3. For skill gaps or target job skills the candidate does not have: Ask conceptual or architectural questions (e.g. "How would you design..." or "What are the trade-offs of..."), NEVER claim the candidate has production experience in it.
4. Categorize each question strictly as TECHNICAL, PROJECT, or BEHAVIORAL.

OUTPUT FORMAT:
Respond strictly with valid JSON matching the required schema.
`.trim();

export const INTERVIEW_EVALUATION_SYSTEM_PROMPT = `
You are JobFit's senior Engineering Interviewer conducting a live technical interview.

YOUR TASK:
1. Evaluate the candidate's answer for:
   - Relevance (Does it directly address the prompt?)
   - Technical Correctness (Are concepts and terms used accurately?)
   - Depth (SHALLOW, MODERATE, or DEEP)
   - Clarity and Completeness
2. Provide a 0-100 advisory score, key strengths, missing concepts, and improvement suggestions according to this strict rubric:
   - Empty, blank, or whitespace-only answers: Score 0-10.
   - Garbage, single-character, gibberish, or irrelevant deflections (e.g. "j", "hello", "abc", "jnedckj"): Score 5-20. Never award a passing or high score.
   - Shallow or incomplete answers (lacking technical detail): Score 25-50.
   - Solid technical answers with clear explanations and trade-offs: Score 70-95.
3. Decide if a dynamic follow-up is warranted:
   - If the candidate's answer is garbage or empty, set shouldAskFollowUp: false and followUpQuestion: null.
   - If max follow-up depth (2) is reached, set shouldAskFollowUp: false and followUpQuestion: null.
   - For substantive answers where trade-offs, edge cases, scale, or failure modes remain unexplored, formulate a tailored follow-up question.
   - Follow-up probe #2 MUST NOT repeat or duplicate follow-up probe #1.
   - Different primary questions should produce contextually distinct follow-ups.

STRICT CONTEXT BOUNDS:
Base your follow-up strictly on the candidate's answer, the primary question, and the verified technical scope. Do NOT assume unverified qualifications or hallucinate candidate metrics.

OUTPUT FORMAT:
Respond strictly with valid JSON matching the required schema.
`.trim();

export function buildQuestionGenerationPrompt(params: {
  type: InterviewType;
  questionCount: number;
  verifiedFacts: {
    rawResumeText?: string | null;
    skills: string[];
    experienceLevel?: string | null;
    targetRole?: string | null;
  };
  targetJob?: {
    title: string;
    description: string;
    requiredSkills: string[];
    preferredSkills: string[];
  } | null;
  skillGaps?: string[];
}): string {
  const { type, questionCount, verifiedFacts, targetJob, skillGaps = [] } =
    params;

  let prompt = `=== CANDIDATE VERIFIED FACTS (GROUND TRUTH) ===\n`;
  prompt += `Skills: ${verifiedFacts.skills.join(", ") || "General Engineering"}\n`;
  if (verifiedFacts.experienceLevel) {
    prompt += `Seniority: ${verifiedFacts.experienceLevel}\n`;
  }
  if (verifiedFacts.targetRole) {
    prompt += `Target Role: ${verifiedFacts.targetRole}\n`;
  }
  if (verifiedFacts.rawResumeText) {
    prompt += `\nResume Excerpt:\n${verifiedFacts.rawResumeText.slice(0, 3000)}\n`;
  }

  if (targetJob) {
    prompt += `\n=== TARGET JOB CONTEXT ===\n`;
    prompt += `Job Title: ${targetJob.title}\n`;
    prompt += `Required Skills: ${targetJob.requiredSkills.join(", ")}\n`;
    prompt += `Description Excerpt:\n${targetJob.description.slice(0, 1500)}\n`;
  }

  if (skillGaps.length > 0) {
    prompt += `\nIdentified Skill Gaps (Ask conceptual questions only): ${skillGaps.join(", ")}\n`;
  }

  prompt += `\n=== GENERATION REQUEST ===\n`;
  prompt += `Interview Type: ${type}\n`;
  prompt += `Number of Questions: ${questionCount}\n`;
  prompt += `Generate ${questionCount} diverse questions (Technical, Project, Behavioral) formatted in JSON.`;

  return prompt;
}

export function buildAnswerEvaluationPrompt(params: {
  questionContent: string;
  candidateAnswer: string;
  previousFollowUps?: Array<{ question: string; answer?: string | null }>;
  currentFollowUpDepth: number;
  maxFollowUpDepth: number;
}): string {
  const {
    questionContent,
    candidateAnswer,
    previousFollowUps = [],
    currentFollowUpDepth,
    maxFollowUpDepth,
  } = params;

  let prompt = `=== PRIMARY INTERVIEW QUESTION ===\n${questionContent}\n\n`;

  if (previousFollowUps.length > 0) {
    prompt += `=== PREVIOUS FOLLOW-UP CONVERSATION ===\n`;
    for (const f of previousFollowUps) {
      prompt += `Q: ${f.question}\nA: ${f.answer || "No answer provided"}\n\n`;
    }
  }

  prompt += `=== CANDIDATE'S CURRENT ANSWER ===\n${candidateAnswer}\n\n`;
  prompt += `=== CONSTRAINTS ===\n`;
  prompt += `Current Follow-up Depth: ${currentFollowUpDepth} of ${maxFollowUpDepth}\n`;
  if (currentFollowUpDepth >= maxFollowUpDepth) {
    prompt += `CRITICAL: Maximum follow-up depth reached. You MUST set shouldAskFollowUp: false and followUpQuestion: null.\n`;
  } else {
    prompt += `If candidate answer is shallow or leaves interesting trade-offs unexplored, set shouldAskFollowUp: true and provide a followUpQuestion.\n`;
  }

  return prompt;
}
