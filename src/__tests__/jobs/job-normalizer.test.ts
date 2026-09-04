import { describe, it, expect } from "vitest";
import {
  normalizeTitle,
  normalizeCompanyName,
  normalizeCompanyNameForComparison,
  normalizeLocation,
  normalizeWorkMode,
  normalizeEmploymentType,
  normalizeExperienceLevel,
  normalizeSalary,
  normalizeUrl,
  normalizeDescription,
  normalizeSkillName,
  normalizeSkills,
  normalizeJob,
} from "@/services/jobs/ingestion/job-normalizer";
import type { NormalizedJob } from "@/types/job";

describe("Job Normalizer", () => {
  // ─── Title Normalization ───

  describe("normalizeTitle", () => {
    it("should trim whitespace", () => {
      expect(normalizeTitle("  Software Engineer  ")).toBe("Software Engineer");
    });

    it("should collapse multiple spaces", () => {
      expect(normalizeTitle("Software   Developer   II")).toBe(
        "Software Developer Ii"
      );
    });

    it("should title-case", () => {
      expect(normalizeTitle("senior frontend developer")).toBe(
        "Senior Frontend Developer"
      );
    });

    it("should handle all-caps input", () => {
      expect(normalizeTitle("BACKEND ENGINEER")).toBe("Backend Engineer");
    });

    it("should keep small words lowercase except at start", () => {
      expect(normalizeTitle("head of engineering")).toBe("Head of Engineering");
    });

    it("should NOT break React.js into React.Js", () => {
      expect(normalizeTitle("Senior React.js Developer")).toBe(
        "Senior React.js Developer"
      );
      expect(normalizeTitle("SENIOR REACT.JS DEVELOPER")).toBe(
        "Senior React.js Developer"
      );
      expect(normalizeTitle("react.js engineer")).toBe("React.js Engineer");
    });

    it("should preserve technical abbreviations and frameworks", () => {
      expect(normalizeTitle("senior node.js backend developer")).toBe(
        "Senior Node.js Backend Developer"
      );
      expect(normalizeTitle("ios mobile engineer")).toBe("iOS Mobile Engineer");
      expect(normalizeTitle("aws cloud solutions architect")).toBe(
        "AWS Cloud Solutions Architect"
      );
      expect(normalizeTitle("ui/ux designer")).toBe("UI/UX Designer");
      expect(normalizeTitle("lead devops & ci/cd engineer")).toBe(
        "Lead DevOps & CI/CD Engineer"
      );
      expect(normalizeTitle("junior c++ developer")).toBe("Junior C++ Developer");
      expect(normalizeTitle("full stack engineer (next.js/graphql)")).toBe(
        "Full Stack Engineer (Next.js/GraphQL)"
      );
    });
  });

  // ─── Company Name Normalization ───

  describe("normalizeCompanyName", () => {
    it("should trim whitespace", () => {
      expect(normalizeCompanyName("  Google  ")).toBe("Google");
    });

    it("should collapse multiple spaces", () => {
      expect(normalizeCompanyName("Tech   Corp")).toBe("Tech Corp");
    });

    it("should preserve original casing", () => {
      expect(normalizeCompanyName("McKinsey & Company")).toBe(
        "McKinsey & Company"
      );
    });
  });

  describe("normalizeCompanyNameForComparison", () => {
    it("should lowercase", () => {
      expect(normalizeCompanyNameForComparison("Google")).toBe("google");
    });

    it("should strip common suffixes", () => {
      expect(normalizeCompanyNameForComparison("TechCorp Inc.")).toBe(
        "techcorp"
      );
      expect(normalizeCompanyNameForComparison("DataFlow Solutions")).toBe(
        "dataflow"
      );
      expect(normalizeCompanyNameForComparison("MyCompany Ltd")).toBe(
        "mycompany"
      );
      expect(normalizeCompanyNameForComparison("TestCo Pvt.")).toBe("testco");
    });

    it("should handle names without suffixes", () => {
      expect(normalizeCompanyNameForComparison("Google")).toBe("google");
    });
  });

  // ─── Work Mode Normalization ───

  describe("normalizeWorkMode", () => {
    it('should normalize "Remote" variations', () => {
      expect(normalizeWorkMode("Remote")).toBe("REMOTE");
      expect(normalizeWorkMode("remote")).toBe("REMOTE");
      expect(normalizeWorkMode("REMOTE")).toBe("REMOTE");
      expect(normalizeWorkMode("work from home")).toBe("REMOTE");
      expect(normalizeWorkMode("wfh")).toBe("REMOTE");
      expect(normalizeWorkMode("fully remote")).toBe("REMOTE");
    });

    it('should normalize "Hybrid" variations', () => {
      expect(normalizeWorkMode("Hybrid")).toBe("HYBRID");
      expect(normalizeWorkMode("hybrid")).toBe("HYBRID");
      expect(normalizeWorkMode("partially remote")).toBe("HYBRID");
    });

    it('should normalize "Onsite" variations', () => {
      expect(normalizeWorkMode("Onsite")).toBe("ONSITE");
      expect(normalizeWorkMode("on-site")).toBe("ONSITE");
      expect(normalizeWorkMode("in office")).toBe("ONSITE");
      expect(normalizeWorkMode("in-office")).toBe("ONSITE");
    });

    it("should return undefined for null/undefined", () => {
      expect(normalizeWorkMode(null)).toBeUndefined();
      expect(normalizeWorkMode(undefined)).toBeUndefined();
      expect(normalizeWorkMode("")).toBeUndefined();
    });

    it("should return undefined for unknown values", () => {
      expect(normalizeWorkMode("somewhere")).toBeUndefined();
    });
  });

  // ─── Employment Type Normalization ───

  describe("normalizeEmploymentType", () => {
    it("should normalize full-time variations", () => {
      expect(normalizeEmploymentType("Full Time")).toBe("FULL_TIME");
      expect(normalizeEmploymentType("Full-time")).toBe("FULL_TIME");
      expect(normalizeEmploymentType("fulltime")).toBe("FULL_TIME");
      expect(normalizeEmploymentType("permanent")).toBe("FULL_TIME");
    });

    it("should normalize part-time variations", () => {
      expect(normalizeEmploymentType("Part Time")).toBe("PART_TIME");
      expect(normalizeEmploymentType("Part-time")).toBe("PART_TIME");
      expect(normalizeEmploymentType("parttime")).toBe("PART_TIME");
    });

    it("should normalize contract variations", () => {
      expect(normalizeEmploymentType("Contract")).toBe("CONTRACT");
      expect(normalizeEmploymentType("contractor")).toBe("CONTRACT");
      expect(normalizeEmploymentType("freelance")).toBe("CONTRACT");
    });

    it("should normalize internship variations", () => {
      expect(normalizeEmploymentType("Internship")).toBe("INTERNSHIP");
      expect(normalizeEmploymentType("Intern")).toBe("INTERNSHIP");
      expect(normalizeEmploymentType("trainee")).toBe("INTERNSHIP");
    });

    it("should return undefined for null/undefined", () => {
      expect(normalizeEmploymentType(null)).toBeUndefined();
      expect(normalizeEmploymentType(undefined)).toBeUndefined();
    });
  });

  // ─── Experience Level Normalization ───

  describe("normalizeExperienceLevel", () => {
    it("should normalize fresher variations", () => {
      expect(normalizeExperienceLevel("Fresher")).toBe("FRESHER");
      expect(normalizeExperienceLevel("entry level")).toBe("FRESHER");
      expect(normalizeExperienceLevel("entry-level")).toBe("FRESHER");
      expect(normalizeExperienceLevel("new grad")).toBe("FRESHER");
    });

    it("should normalize junior variations", () => {
      expect(normalizeExperienceLevel("Junior")).toBe("JUNIOR");
      expect(normalizeExperienceLevel("jr.")).toBe("JUNIOR");
      expect(normalizeExperienceLevel("associate")).toBe("JUNIOR");
    });

    it("should normalize mid-level variations", () => {
      expect(normalizeExperienceLevel("Mid")).toBe("MID");
      expect(normalizeExperienceLevel("mid-level")).toBe("MID");
      expect(normalizeExperienceLevel("intermediate")).toBe("MID");
    });

    it("should normalize senior variations", () => {
      expect(normalizeExperienceLevel("Senior")).toBe("SENIOR");
      expect(normalizeExperienceLevel("sr.")).toBe("SENIOR");
      expect(normalizeExperienceLevel("experienced")).toBe("SENIOR");
    });

    it("should normalize lead variations", () => {
      expect(normalizeExperienceLevel("Lead")).toBe("LEAD");
      expect(normalizeExperienceLevel("tech lead")).toBe("LEAD");
      expect(normalizeExperienceLevel("principal")).toBe("LEAD");
      expect(normalizeExperienceLevel("staff")).toBe("LEAD");
    });
  });

  // ─── Salary Normalization ───

  describe("normalizeSalary", () => {
    it("should return number as-is when positive", () => {
      expect(normalizeSalary(50000)).toBe(50000);
    });

    it("should parse string values", () => {
      expect(normalizeSalary("50000")).toBe(50000);
    });

    it("should strip non-numeric characters", () => {
      expect(normalizeSalary("$50,000")).toBe(50000);
    });

    it("should return undefined for zero or negative", () => {
      expect(normalizeSalary(0)).toBeUndefined();
      expect(normalizeSalary(-1000)).toBeUndefined();
    });

    it("should return undefined for null/undefined", () => {
      expect(normalizeSalary(null)).toBeUndefined();
      expect(normalizeSalary(undefined)).toBeUndefined();
    });

    it("should round to integer", () => {
      expect(normalizeSalary(50000.75)).toBe(50001);
    });
  });

  // ─── URL Normalization ───

  describe("normalizeUrl", () => {
    it("should return valid URLs as-is", () => {
      expect(normalizeUrl("https://example.com")).toBe("https://example.com");
    });

    it("should trim whitespace", () => {
      expect(normalizeUrl("  https://example.com  ")).toBe(
        "https://example.com"
      );
    });

    it("should return undefined for empty/null", () => {
      expect(normalizeUrl("")).toBeUndefined();
      expect(normalizeUrl(null)).toBeUndefined();
      expect(normalizeUrl(undefined)).toBeUndefined();
    });

    it("should prepend https:// for bare domains", () => {
      expect(normalizeUrl("example.com")).toBe("https://example.com");
    });
  });

  // ─── Description Normalization ───

  describe("normalizeDescription", () => {
    it("should trim whitespace", () => {
      expect(normalizeDescription("  Hello  ")).toBe("Hello");
    });

    it("should collapse excessive newlines", () => {
      expect(normalizeDescription("A\n\n\n\n\nB")).toBe("A\n\nB");
    });

    it("should collapse excessive spaces", () => {
      expect(normalizeDescription("A    B")).toBe("A B");
    });
  });

  // ─── Skill Normalization ───

  describe("normalizeSkillName", () => {
    it("should lowercase and trim", () => {
      expect(normalizeSkillName("  React  ")).toBe("react");
      expect(normalizeSkillName("TypeScript")).toBe("typescript");
    });
  });

  describe("normalizeSkills", () => {
    it("should normalize and deduplicate skills", () => {
      expect(normalizeSkills(["React", "react", "REACT", "TypeScript"])).toEqual([
        "react",
        "typescript",
      ]);
    });

    it("should filter out empty strings", () => {
      expect(normalizeSkills(["React", "", "  ", "Node.js"])).toEqual([
        "react",
        "node.js",
      ]);
    });
  });

  // ─── Full Job Normalization ───

  describe("normalizeJob", () => {
    it("should normalize all fields of a job", () => {
      const input: NormalizedJob = {
        externalJobId: "ext-001",
        title: "  senior FRONTEND developer  ",
        description: "Build   amazing   UIs",
        company: "  TechCorp Solutions  ",
        companyWebsite: "https://techcorp.com",
        location: "  Bangalore, India  ",
        workMode: "REMOTE",
        employmentType: "FULL_TIME",
        experienceLevel: "SENIOR",
        salaryMin: 2000000,
        salaryMax: 3500000,
        salaryCurrency: "inr",
        applicationUrl: "https://techcorp.com/apply",
        source: "mock",
        skills: ["React", "react", "TypeScript", "CSS"],
        sourceMetadata: {},
      };

      const result = normalizeJob(input);

      expect(result.title).toBe("Senior Frontend Developer");
      expect(result.company).toBe("TechCorp Solutions");
      expect(result.location).toBe("Bangalore, India");
      expect(result.salaryCurrency).toBe("INR");
      expect(result.skills).toEqual(["react", "typescript", "css"]);
      expect(result.description).toBe("Build amazing UIs");
      // Original values preserved in sourceMetadata
      expect(result.sourceMetadata).toHaveProperty("originalTitle");
    });
  });
});
