import { describe, it, expect } from "vitest";
import { analyzeSkillGaps } from "@/services/skill-gap/skill-gap-analyzer";

describe("Skill Gap Analyzer", () => {
  it("should categorize missing required skills as CRITICAL gaps and missing preferred skills as IMPORTANT gaps", () => {
    const candidateSkills = ["React", "JavaScript"];
    const requiredSkills = ["React", "TypeScript"]; // TypeScript is missing
    const preferredSkills = ["GraphQL", "Docker"]; // GraphQL & Docker are missing

    const result = analyzeSkillGaps(
      candidateSkills,
      requiredSkills,
      preferredSkills
    );

    // Critical gaps must ONLY contain missing REQUIRED skills
    expect(result.criticalGaps.length).toBe(1);
    expect(result.criticalGaps[0].skillName).toBe("TypeScript");
    expect(result.criticalGaps[0].type).toBe("REQUIRED");
    expect(result.criticalGaps[0].severity).toBe("CRITICAL");

    // Important gaps must ONLY contain missing PREFERRED skills
    expect(result.importantGaps.length).toBe(2);
    expect(result.importantGaps.map((g) => g.skillName)).toEqual([
      "GraphQL",
      "Docker",
    ]);
    expect(result.importantGaps[0].type).toBe("PREFERRED");
    expect(result.importantGaps[0].severity).toBe("IMPORTANT");

    // Covered skills must contain candidate's matched skills
    expect(result.coveredSkills.length).toBe(1);
    expect(result.coveredSkills[0].skillName).toBe("React");
    expect(result.coveredSkills[0].status).toBe("COVERED");
  });

  it("proves required vs preferred invariant: required skills never leak into preferred gaps and vice versa", () => {
    const candidateSkills = ["Python"];
    const requiredSkills = ["Django", "PostgreSQL"];
    const preferredSkills = ["Redis", "Kubernetes"];

    const result = analyzeSkillGaps(
      candidateSkills,
      requiredSkills,
      preferredSkills
    );

    // Every item in criticalGaps must have type === "REQUIRED"
    for (const gap of result.criticalGaps) {
      expect(gap.type).toBe("REQUIRED");
      expect(gap.severity).toBe("CRITICAL");
    }

    // Every item in importantGaps must have type === "PREFERRED"
    for (const gap of result.importantGaps) {
      expect(gap.type).toBe("PREFERRED");
      expect(gap.severity).toBe("IMPORTANT");
    }

    const criticalNames = result.criticalGaps.map((g) => g.canonicalName);
    const importantNames = result.importantGaps.map((g) => g.canonicalName);

    // Intersection must be completely empty
    for (const name of criticalNames) {
      expect(importantNames).not.toContain(name);
    }
  });

  it("should have 0 critical gaps when all required skills are matched", () => {
    const candidateSkills = ["React.js", "TypeScript", "Node.js"];
    const requiredSkills = ["React", "TypeScript", "Node.js"];
    const preferredSkills = ["Docker"];

    const result = analyzeSkillGaps(
      candidateSkills,
      requiredSkills,
      preferredSkills
    );
    expect(result.criticalGaps.length).toBe(0);
    expect(result.importantGaps.length).toBe(1);
    expect(result.importantGaps[0].skillName).toBe("Docker");
  });

  it("should correctly resolve safe aliases (React.js, Node.js, TS, Postgres, AWS)", () => {
    const candidateSkills = ["React.js", "node", "TS", "postgres", "AWS"];
    const requiredSkills = [
      "React",
      "Node.js",
      "TypeScript",
      "PostgreSQL",
      "Amazon Web Services",
    ];

    const result = analyzeSkillGaps(candidateSkills, requiredSkills, []);
    expect(result.criticalGaps.length).toBe(0);
    expect(result.coveredSkills.length).toBe(5);
  });

  it("should strictly reject unsafe broad aliases (e.g. Java does not match JavaScript)", () => {
    const candidateSkills = ["Java"];
    const requiredSkills = ["JavaScript"];

    const result = analyzeSkillGaps(candidateSkills, requiredSkills, []);
    expect(result.criticalGaps.length).toBe(1);
    expect(result.criticalGaps[0].skillName).toBe("JavaScript");
    expect(result.coveredSkills.length).toBe(0);
  });

  it("should handle empty candidate skills gracefully with all job skills flagged as gaps", () => {
    const candidateSkills: string[] = [];
    const requiredSkills = ["React", "TypeScript"];
    const preferredSkills = ["Jest"];

    const result = analyzeSkillGaps(
      candidateSkills,
      requiredSkills,
      preferredSkills
    );
    expect(result.criticalGaps.length).toBe(2);
    expect(result.importantGaps.length).toBe(1);
    expect(result.coveredSkills.length).toBe(0);
  });

  it("should handle empty job skills gracefully with zero gaps", () => {
    const candidateSkills = ["React", "TypeScript"];
    const requiredSkills: string[] = [];
    const preferredSkills: string[] = [];

    const result = analyzeSkillGaps(
      candidateSkills,
      requiredSkills,
      preferredSkills
    );
    expect(result.criticalGaps.length).toBe(0);
    expect(result.importantGaps.length).toBe(0);
    expect(result.coveredSkills.length).toBe(0);
  });
});
