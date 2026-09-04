/**
 * AI Resume Improvement — Centralized Prompts
 *
 * Implements strict anti-hallucination instructions, metric placeholder rules,
 * and context partitioning between Verified Facts and Target Context.
 */

import type {
  ImprovementMode,
  ResumeSectionType,
} from "@/types/ai-resume";
import type { ResumeJobAnalysisResult } from "@/types/analysis";

export const RESUME_IMPROVEMENT_SYSTEM_PROMPT = `
You are JobFit's expert AI Career Coach and Resume Optimizer.

PRIMARY DIRECTIVE:
Improve the presentation, active voice, bullet clarity, and job alignment of VERIFIED CANDIDATE FACTS ONLY.
NEVER INVENT, FABRICATE, OR EXTRAPOLATE QUALIFICATIONS.

STRICT PROHIBITED BEHAVIORS:
1. Never fabricate companies, employers, or clients.
2. Never fabricate job titles or seniority levels.
3. Never fabricate employment dates or years of experience.
4. Never invent numbers, percentages, currencies, multipliers (e.g., 40%, $100k, 10x, 500+ users) unless that exact figure exists in the candidate's verified facts.
5. If a bullet would benefit from quantifiable metrics, insert an explicit placeholder: "[Add metric, e.g. % speedup or active users]".
6. Never fabricate technologies, frameworks, or tools not found in verified facts.
7. TARGET CONTEXT IS NOT CANDIDATE EXPERIENCE: If the job requires a skill that the candidate does not have, DO NOT claim the candidate used it. Instead, suggest they acquire it in missingSkillsAdvice.

OUTPUT FORMAT:
Respond with a single valid JSON object strictly matching the required schema. Do not include markdown code blocks or conversational text outside the JSON object.
`.trim();

export interface BuildPromptParams {
  verifiedFacts: {
    rawResumeText?: string | null;
    skills: string[];
    experienceLevel?: string | null;
    yearsOfExperience?: number | null;
    targetRole?: string | null;
    education?: {
      degree?: string | null;
      field?: string | null;
    } | null;
  };
  mode: ImprovementMode;
  targetSection: ResumeSectionType;
  targetJob?: {
    id: string;
    title: string;
    description: string;
    requiredSkills: string[];
    preferredSkills: string[];
  } | null;
  phase7Analysis?: ResumeJobAnalysisResult | null;
}

export function buildResumeImprovementPrompt(params: {
  verifiedFacts: BuildPromptParams["verifiedFacts"];
  mode: ImprovementMode;
  targetSection: ResumeSectionType;
  targetJob?: BuildPromptParams["targetJob"];
  phase7Analysis?: BuildPromptParams["phase7Analysis"];
}): string {
  const { verifiedFacts, mode, targetSection, targetJob, phase7Analysis } =
    params;

  let prompt = "=== VERIFIED CANDIDATE FACTS (SOURCE OF TRUTH) ===\n";
  prompt += `Verified Skills: ${verifiedFacts.skills.length > 0 ? verifiedFacts.skills.join(", ") : "None detected"}\n`;
  if (verifiedFacts.experienceLevel) {
    prompt += `Seniority Level: ${verifiedFacts.experienceLevel}\n`;
  }
  if (verifiedFacts.yearsOfExperience !== null && verifiedFacts.yearsOfExperience !== undefined) {
    prompt += `Years of Experience: ${verifiedFacts.yearsOfExperience} years\n`;
  }
  if (verifiedFacts.targetRole) {
    prompt += `Target Role: ${verifiedFacts.targetRole}\n`;
  }
  if (verifiedFacts.education?.degree) {
    prompt += `Education: ${verifiedFacts.education.degree} in ${verifiedFacts.education.field || "relevant field"}\n`;
  }

  prompt += "\n--- ORIGINAL RESUME CONTENT ---\n";
  prompt += verifiedFacts.rawResumeText
    ? verifiedFacts.rawResumeText.slice(0, 4000)
    : "No raw text available.";

  prompt += `\n\n=== REQUESTED OPERATION ===\n`;
  prompt += `Mode: ${mode}\n`;
  prompt += `Target Scope: ${targetSection}\n`;

  if (mode === "JOB_TARGETED" && targetJob) {
    prompt += "\n=== TARGET JOB CONTEXT (FOR ALIGNMENT & PRIORITIZATION ONLY) ===\n";
    prompt += `Job Title: ${targetJob.title}\n`;
    prompt += `Required Skills: ${targetJob.requiredSkills.join(", ")}\n`;
    if (targetJob.preferredSkills.length > 0) {
      prompt += `Preferred Skills: ${targetJob.preferredSkills.join(", ")}\n`;
    }
    prompt += `Job Description Excerpt: ${targetJob.description.slice(0, 1500)}\n`;

    if (phase7Analysis) {
      prompt += "\n=== PHASE 7 RESUME VS JOB ANALYSIS ===\n";
      prompt += `Overall Match Score: ${phase7Analysis.overallScore}%\n`;
      prompt += `Covered Skills: ${phase7Analysis.coveredSkills.map((s) => s.skillName).join(", ") || "None"}\n`;
      prompt += `Missing Required Skills (Critical Gaps): ${phase7Analysis.criticalGaps.map((s) => s.skillName).join(", ") || "None"}\n`;
      prompt += `Missing Preferred Skills: ${phase7Analysis.importantGaps.map((s) => s.skillName).join(", ") || "None"}\n`;
      if (phase7Analysis.strengths.length > 0) {
        prompt += `Key Strengths: ${phase7Analysis.strengths.join("; ")}\n`;
      }
    }
  }

  prompt += "\n=== SPECIFIC INSTRUCTIONS ===\n";
  if (targetSection !== "ALL") {
    prompt += `Focus your improvements exclusively on the "${targetSection}" section. Do not alter other sections.\n`;
  }
  if (mode === "JOB_TARGETED") {
    prompt += "Reorder and emphasize verified achievements relevant to the target job. Do NOT invent missing required skills.\n";
  } else {
    prompt += "Focus on active verbs, readability, structural clarity, and ATS formatting.\n";
  }
  prompt += "Return the required JSON object now.";

  return prompt;
}
