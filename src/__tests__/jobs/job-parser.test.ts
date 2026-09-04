import { describe, it, expect } from "vitest";
import { parseRawJob, parseRawJobs } from "@/services/jobs/parsers/job-parser";
import type { RawJob } from "@/services/jobs/adapters/types";

describe("Job Parser", () => {
  const sampleRaw: RawJob = {
    externalId: "ext-123",
    title: "Full Stack Engineer",
    company: "Acme Corp",
    companyWebsite: "https://acme.example.com",
    description: "Build things",
    location: "Bangalore",
    workMode: "remote",
    employmentType: "full-time",
    experienceLevel: "senior",
    salaryMin: 1500000,
    salaryMax: 2500000,
    salaryCurrency: "INR",
    requiredSkills: ["React", "Node.js"],
    preferredSkills: ["PostgreSQL", "Docker"],
    applicationUrl: "https://acme.example.com/jobs/123",
    sourceUrl: "https://source.example.com/job/123",
    postedAt: new Date("2026-01-01"),
    expiresAt: new Date("2026-02-01"),
    metadata: { department: "Engineering" },
  };

  it("should map RawJob fields to NormalizedJob", () => {
    const parsed = parseRawJob(sampleRaw, "custom-adapter");

    expect(parsed.externalJobId).toBe("ext-123");
    expect(parsed.title).toBe("Full Stack Engineer");
    expect(parsed.company).toBe("Acme Corp");
    expect(parsed.companyWebsite).toBe("https://acme.example.com");
    expect(parsed.description).toBe("Build things");
    expect(parsed.location).toBe("Bangalore");
    expect(parsed.workMode).toBe("REMOTE");
    expect(parsed.employmentType).toBe("FULL_TIME");
    expect(parsed.experienceLevel).toBe("SENIOR");
    expect(parsed.salaryMin).toBe(1500000);
    expect(parsed.salaryMax).toBe(2500000);
    expect(parsed.salaryCurrency).toBe("INR");
    expect(parsed.applicationUrl).toBe("https://acme.example.com/jobs/123");
    expect(parsed.source).toBe("custom-adapter");
  });

  it("should combine required and preferred skills into a single list", () => {
    const parsed = parseRawJob(sampleRaw, "mock");
    expect(parsed.skills).toEqual([
      "React",
      "Node.js",
      "PostgreSQL",
      "Docker",
    ]);
  });

  it("should handle empty skills gracefully", () => {
    const withoutSkills: RawJob = {
      externalId: "ext-124",
      title: "Dev",
      company: "Co",
      description: "Desc",
    };

    const parsed = parseRawJob(withoutSkills, "mock");
    expect(parsed.skills).toBeUndefined();
  });

  it("should preserve original metadata in sourceMetadata", () => {
    const parsed = parseRawJob(sampleRaw, "mock");
    expect(parsed.sourceMetadata).toBeDefined();
    expect(parsed.sourceMetadata?.department).toBe("Engineering");
    expect(parsed.sourceMetadata?.requiredSkills).toEqual([
      "React",
      "Node.js",
    ]);
  });

  it("should parse multiple raw jobs in batch", () => {
    const batch: RawJob[] = [
      {
        externalId: "1",
        title: "A",
        company: "CA",
        description: "DA",
      },
      {
        externalId: "2",
        title: "B",
        company: "CB",
        description: "DB",
      },
    ];

    const results = parseRawJobs(batch, "test-src");
    expect(results).toHaveLength(2);
    expect(results[0].externalJobId).toBe("1");
    expect(results[0].source).toBe("test-src");
    expect(results[1].externalJobId).toBe("2");
    expect(results[1].source).toBe("test-src");
  });
});
