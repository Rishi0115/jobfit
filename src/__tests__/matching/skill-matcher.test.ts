import { describe, it, expect } from "vitest";
import {
  canonicalizeSkill,
  formatSkillDisplay,
  matchSkills,
} from "@/services/matching/skill-matcher";

describe("Skill Matcher", () => {
  describe("canonicalizeSkill", () => {
    it("should resolve common tech aliases to canonical forms", () => {
      expect(canonicalizeSkill("React")).toBe("react");
      expect(canonicalizeSkill("React.js")).toBe("react");
      expect(canonicalizeSkill("reactjs")).toBe("react");

      expect(canonicalizeSkill("Node")).toBe("node.js");
      expect(canonicalizeSkill("Node.js")).toBe("node.js");
      expect(canonicalizeSkill("nodejs")).toBe("node.js");

      expect(canonicalizeSkill("JS")).toBe("javascript");
      expect(canonicalizeSkill("JavaScript")).toBe("javascript");

      expect(canonicalizeSkill("TS")).toBe("typescript");
      expect(canonicalizeSkill("TypeScript")).toBe("typescript");

      expect(canonicalizeSkill("PostgreSQL")).toBe("postgresql");
      expect(canonicalizeSkill("postgres")).toBe("postgresql");
      expect(canonicalizeSkill("psql")).toBe("postgresql");

      expect(canonicalizeSkill("Amazon Web Services")).toBe("aws");
      expect(canonicalizeSkill("AWS")).toBe("aws");

      expect(canonicalizeSkill("Google Cloud Platform")).toBe("gcp");
      expect(canonicalizeSkill("GCP")).toBe("gcp");

      expect(canonicalizeSkill("Microsoft Azure")).toBe("azure");
      expect(canonicalizeSkill("Azure")).toBe("azure");
    });

    it("should handle punctuation and whitespace differences", () => {
      expect(canonicalizeSkill("  React.js  ")).toBe("react");
      expect(canonicalizeSkill("Tailwind CSS")).toBe("tailwindcss");
      expect(canonicalizeSkill("TailwindCSS")).toBe("tailwindcss");
      expect(canonicalizeSkill("C++")).toBe("c++");
      expect(canonicalizeSkill("C#")).toBe("c#");
      expect(canonicalizeSkill(".NET")).toBe(".net");
    });

    it("should NOT create unsafe broad aliases (e.g. java != javascript)", () => {
      expect(canonicalizeSkill("Java")).toBe("java");
      expect(canonicalizeSkill("JavaScript")).toBe("javascript");
      expect(canonicalizeSkill("Java")).not.toBe(canonicalizeSkill("JavaScript"));
    });
  });

  describe("formatSkillDisplay", () => {
    it("should return clean presentation names", () => {
      expect(formatSkillDisplay("react")).toBe("React");
      expect(formatSkillDisplay("node.js")).toBe("Node.js");
      expect(formatSkillDisplay("postgresql")).toBe("PostgreSQL");
      expect(formatSkillDisplay("aws")).toBe("AWS");
    });
  });

  describe("matchSkills", () => {
    it("should calculate 100% when all required skills match exactly", () => {
      const candidateSkills = ["React", "TypeScript", "Node.js", "PostgreSQL"];
      const jobRequired = ["React", "TypeScript", "Node.js", "PostgreSQL"];

      const result = matchSkills(candidateSkills, jobRequired);
      expect(result.score).toBe(100);
      expect(result.details.matchedRequired.length).toBe(4);
      expect(result.details.missingRequired.length).toBe(0);
    });

    it("should match skills regardless of case differences", () => {
      const candidateSkills = ["REACT", "typescript", "NODE.JS"];
      const jobRequired = ["react", "TypeScript", "Node.js"];

      const result = matchSkills(candidateSkills, jobRequired);
      expect(result.score).toBe(100);
      expect(result.details.matchedRequired.length).toBe(3);
    });

    it("should match skills through canonical aliases (e.g. React.js == React, Postgres == PostgreSQL)", () => {
      const candidateSkills = ["React.js", "TS", "Postgres", "AWS"];
      const jobRequired = ["React", "TypeScript", "PostgreSQL", "Amazon Web Services"];

      const result = matchSkills(candidateSkills, jobRequired);
      expect(result.score).toBe(100);
      expect(result.details.matchedRequired.length).toBe(4);
      expect(result.details.missingRequired.length).toBe(0);
    });

    it("should accurately identify missing skills and calculate partial score", () => {
      // Job requires React, TypeScript, Node.js, PostgreSQL
      // Candidate has React.js, TypeScript, Node.js
      const candidateSkills = ["React.js", "TypeScript", "Node.js"];
      const jobRequired = ["React", "TypeScript", "Node.js", "PostgreSQL"];

      const result = matchSkills(candidateSkills, jobRequired);
      expect(result.score).toBe(75);
      expect(result.details.matchedRequired.length).toBe(3);
      expect(result.details.missingRequired).toEqual(["PostgreSQL"]);
    });

    it("should handle duplicate skills in candidate input and job requirements", () => {
      const candidateSkills = ["React", "react", "React.js", "TypeScript"];
      const jobRequired = ["React", "REACT", "TypeScript", "typescript"];

      const result = matchSkills(candidateSkills, jobRequired);
      expect(result.score).toBe(100);
      expect(result.details.totalRequired).toBe(2);
      expect(result.details.matchedRequired.length).toBe(2);
    });

    it("should score 0 when candidate has no skills matching job requirements", () => {
      const candidateSkills = ["Java", "Spring Boot", "MySQL"];
      const jobRequired = ["Python", "Django", "PostgreSQL"];

      const result = matchSkills(candidateSkills, jobRequired);
      expect(result.score).toBe(0);
      expect(result.details.matchedRequired.length).toBe(0);
      expect(result.details.missingRequired.length).toBe(3);
    });

    it("should handle empty candidate skills gracefully", () => {
      const candidateSkills: string[] = [];
      const jobRequired = ["React", "TypeScript"];

      const result = matchSkills(candidateSkills, jobRequired);
      expect(result.score).toBe(0);
      expect(result.details.matchedRequired.length).toBe(0);
      expect(result.details.missingRequired.length).toBe(2);
    });

    it("should handle empty job skills gracefully", () => {
      const candidateSkills = ["React", "TypeScript"];
      const jobRequired: string[] = [];

      const result = matchSkills(candidateSkills, jobRequired);
      expect(result.score).toBe(100);
      expect(result.details.totalRequired).toBe(0);
    });

    it("should weight required skills higher than preferred skills", () => {
      // 1 required (React) and 1 preferred (Docker)
      // Candidate 1 matches required only
      const res1 = matchSkills(["React"], ["React"], ["Docker"]);
      // Candidate 2 matches preferred only
      const res2 = matchSkills(["Docker"], ["React"], ["Docker"]);

      expect(res1.score).toBe(80); // 80% for required
      expect(res2.score).toBe(20); // 20% for preferred
      expect(res1.score).toBeGreaterThan(res2.score);
    });
  });
});
