import { describe, it, expect } from "vitest";
import {
  RESUME_IMPROVEMENT_SYSTEM_PROMPT,
  buildResumeImprovementPrompt,
} from "@/services/ai/prompts/resume-prompts";

describe("Resume Improvement Prompt Builder", () => {
  const verifiedFacts = {
    rawResumeText: "Frontend Developer skilled in React and TypeScript.",
    skills: ["React", "TypeScript"],
    experienceLevel: "MID",
    yearsOfExperience: 3,
    targetRole: "Frontend Engineer",
  };

  it("should contain strict anti-hallucination and metric placeholder rules in system prompt", () => {
    expect(RESUME_IMPROVEMENT_SYSTEM_PROMPT).toContain("NEVER INVENT, FABRICATE, OR EXTRAPOLATE");
    expect(RESUME_IMPROVEMENT_SYSTEM_PROMPT).toContain("Never invent numbers, percentages, currencies");
    expect(RESUME_IMPROVEMENT_SYSTEM_PROMPT).toContain("[Add metric, e.g. % speedup or active users]");
    expect(RESUME_IMPROVEMENT_SYSTEM_PROMPT).toContain("TARGET CONTEXT IS NOT CANDIDATE EXPERIENCE");
  });

  it("should include verified candidate facts and exclude job context in GENERAL mode", () => {
    const prompt = buildResumeImprovementPrompt({
      verifiedFacts,
      mode: "GENERAL",
      targetSection: "ALL",
    });

    expect(prompt).toContain("VERIFIED CANDIDATE FACTS");
    expect(prompt).toContain("React, TypeScript");
    expect(prompt).toContain("Mode: GENERAL");
    expect(prompt).toContain("Target Scope: ALL");
    expect(prompt).not.toContain("TARGET JOB CONTEXT");
    expect(prompt).not.toContain("PHASE 7 RESUME VS JOB ANALYSIS");
  });

  it("should include target job and Phase 7 analysis in JOB_TARGETED mode", () => {
    const prompt = buildResumeImprovementPrompt({
      verifiedFacts,
      mode: "JOB_TARGETED",
      targetSection: "ALL",
      targetJob: {
        id: "job-1",
        title: "Senior React Engineer",
        description: "Must know Next.js and Redux.",
        requiredSkills: ["React", "Next.js"],
        preferredSkills: ["Redux"],
      },
      phase7Analysis: {
        overallScore: 84,
        scoreLabel: "Strong Match",
        matchQuality: "STRONG",
        coveredSkills: [{ skillName: "React" } as any],
        criticalGaps: [{ skillName: "Next.js" } as any],
        importantGaps: [{ skillName: "Redux" } as any],
        strengths: ["Strong React proficiency"],
      } as any,
    });

    expect(prompt).toContain("TARGET JOB CONTEXT");
    expect(prompt).toContain("Senior React Engineer");
    expect(prompt).toContain("PHASE 7 RESUME VS JOB ANALYSIS");
    expect(prompt).toContain("Overall Match Score: 84%");
    expect(prompt).toContain("Critical Gaps");
    expect(prompt).toContain("Next.js");
  });

  it("should restrict scope instruction when targetSection is specific", () => {
    const prompt = buildResumeImprovementPrompt({
      verifiedFacts,
      mode: "SECTION_LEVEL",
      targetSection: "EXPERIENCE",
    });

    expect(prompt).toContain('Focus your improvements exclusively on the "EXPERIENCE" section');
  });
});
