import { describe, it, expect } from "vitest";
import { auditFactualPreservation } from "@/services/ai/guardrails/fact-preservation-guard";
import type { AIStructuredOutput } from "@/lib/validators/ai-resume";

describe("Fact Preservation Guardrail", () => {
  const baseVerifiedFacts = {
    rawResumeText:
      "Software Engineer with 2 years of experience building web apps in React, Node.js, and TypeScript at Acme Corp. Graduated with B.Tech in 2022.",
    skills: ["React", "Node.js", "TypeScript"],
  };

  it("should calculate preservationScore deterministically and award 100 for factual bullets with valid placeholders", () => {
    const aiOutput: AIStructuredOutput = {
      improvedSummary: {
        originalText: "Software developer with React.",
        improvedText:
          "Software engineer with demonstrated experience delivering scalable React components.",
        explanation: "Refined tone.",
      },
      improvedBullets: [
        {
          id: "b-1",
          section: "EXPERIENCE",
          originalText: "Built web apps in React at Acme Corp.",
          improvedText:
            "Engineered responsive web applications utilizing React and TypeScript at Acme Corp, increasing user engagement [Add metric, e.g. % faster load].",
          factualBasis: "Verified React, TypeScript, and Acme Corp.",
        },
      ],
      skillsSuggestions: {
        verifiedSkillsToEmphasize: ["React"],
        missingSkillsAdvice: [],
      },
      atsSuggestions: [],
      clarificationRequests: [],
    };

    const audit1 = auditFactualPreservation(baseVerifiedFacts, aiOutput);
    const audit2 = auditFactualPreservation(baseVerifiedFacts, aiOutput);

    // Strictly deterministic
    expect(audit1.preservationScore).toBe(100);
    expect(audit1.preservationScore).toBe(audit2.preservationScore);
    expect(audit1.factualWarnings.length).toBe(0);
    expect(audit1.auditedBullets[0].hasMetricPlaceholder).toBe(true);
    expect(audit1.auditedBullets[0].warnings.length).toBe(0);
  });

  it("should detect invented numbers/percentages without placeholders and penalize preservationScore", () => {
    const aiOutputWithHallucinatedMetric: AIStructuredOutput = {
      improvedSummary: null,
      improvedBullets: [
        {
          id: "b-2",
          section: "EXPERIENCE",
          originalText: "Built web apps in React.",
          improvedText:
            "Architected web apps in React, reducing load times by 45% and saving $80,000 annually.", // 45% and $80,000 are fabricated!
          factualBasis: "Fabricated metric",
        },
      ],
      skillsSuggestions: {
        verifiedSkillsToEmphasize: [],
        missingSkillsAdvice: [],
      },
      atsSuggestions: [],
      clarificationRequests: [],
    };

    const audit = auditFactualPreservation(
      baseVerifiedFacts,
      aiOutputWithHallucinatedMetric
    );

    // Violations should be flagged and score penalized
    expect(audit.preservationScore).toBeLessThan(100);
    expect(audit.factualWarnings.length).toBeGreaterThan(0);
    expect(audit.auditedBullets[0].warnings.some((w) => w.includes("45%"))).toBe(
      true
    );
    expect(
      audit.auditedBullets[0].warnings.some((w) => w.includes("$80,000"))
    ).toBe(true);
  });

  it("should flag unverified technologies introduced into candidate bullet text", () => {
    const aiOutputWithUnverifiedTech: AIStructuredOutput = {
      improvedSummary: null,
      improvedBullets: [
        {
          id: "b-3",
          section: "EXPERIENCE",
          originalText: "Built web apps in React.",
          // Kubernetes and Docker were not in verified candidate skills!
          improvedText:
            "Orchestrated containerized microservices utilizing Kubernetes and Docker for frontend deployments.",
          factualBasis: "Target job requirement",
        },
      ],
      skillsSuggestions: {
        verifiedSkillsToEmphasize: [],
        missingSkillsAdvice: [],
      },
      atsSuggestions: [],
      clarificationRequests: [],
    };

    const audit = auditFactualPreservation(
      baseVerifiedFacts,
      aiOutputWithUnverifiedTech
    );

    expect(audit.preservationScore).toBeLessThan(100);
    expect(
      audit.auditedBullets[0].warnings.some((w) =>
        w.toLowerCase().includes("kubernetes") || w.toLowerCase().includes("docker")
      )
    ).toBe(true);
  });

  it("proves target-job context is never treated as verified candidate facts", () => {
    // Even if target job requires Python and AWS, candidate does not have them
    const candidateWithoutPython = {
      rawResumeText: "Frontend engineer skilled in JavaScript and CSS.",
      skills: ["JavaScript", "CSS"],
    };

    const aiOutputClaimingJobSkill: AIStructuredOutput = {
      improvedSummary: null,
      improvedBullets: [
        {
          id: "b-4",
          section: "PROJECTS",
          originalText: "Created personal website.",
          improvedText:
            "Implemented Python microservices deployed on AWS Lambda for website backend.",
          factualBasis: "Job requirement",
        },
      ],
      skillsSuggestions: {
        verifiedSkillsToEmphasize: [],
        missingSkillsAdvice: [],
      },
      atsSuggestions: [],
      clarificationRequests: [],
    };

    const audit = auditFactualPreservation(
      candidateWithoutPython,
      aiOutputClaimingJobSkill
    );

    // Must be penalized and warned!
    expect(audit.preservationScore).toBeLessThan(100);
    expect(audit.auditedBullets[0].warnings.length).toBeGreaterThan(0);
  });
});
