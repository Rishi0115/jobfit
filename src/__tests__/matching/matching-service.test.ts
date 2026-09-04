import { describe, it, expect, vi, beforeEach } from "vitest";
import { MatchingService } from "@/services/matching/matching-service";
import { matchingDAL } from "@/dal/matching";
import type { JobWithRelations } from "@/types/job";
import type { CandidateMatchingInput } from "@/types/matching";

describe("Matching Service", () => {
  let service: MatchingService;

  beforeEach(() => {
    service = new MatchingService();
    vi.restoreAllMocks();
  });

  const mockCandidate: CandidateMatchingInput = {
    id: "user-123",
    skills: ["React", "TypeScript", "Node.js"],
    experienceLevel: "MID",
    yearsOfExperience: 3,
    targetRole: "Full Stack Developer",
    education: { degree: "B.Tech", field: "Computer Science", isTech: true },
    preferredWorkMode: "REMOTE",
    preferredLocations: ["Bengaluru"],
  };

  const createMockJob = (
    id: string,
    title: string,
    skills: string[],
    postedAt: Date = new Date()
  ): JobWithRelations =>
    ({
      id,
      title,
      description: "Sample description",
      companyId: "comp-1",
      companyName: "Acme Corp",
      location: "Bengaluru",
      workMode: "REMOTE",
      employmentType: "FULL_TIME",
      experienceLevel: "MID",
      salaryMin: 1000000,
      salaryMax: 1500000,
      salaryCurrency: "INR",
      applicationUrl: "https://example.com",
      postedAt,
      expiresAt: null,
      status: "ACTIVE",
      createdAt: postedAt,
      updatedAt: postedAt,
      company: { id: "comp-1", name: "Acme Corp", website: null, logoUrl: null },
      source: { id: "src-1", name: "Internal", type: "api" },
      jobSkills: skills.map((name, i) => ({
        id: `js-${id}-${i}`,
        isRequired: true,
        skill: {
          id: `sk-${name}`,
          name,
          normalizedName: name.toLowerCase(),
          category: "FRAMEWORK",
        },
      })),
    } as unknown as JobWithRelations);

  it("should sort top matches descending by overall match score", async () => {
    const jobHigh = createMockJob("job-high", "Full Stack Developer", ["React", "TypeScript", "Node.js"]);
    const jobMed = createMockJob("job-med", "Frontend Developer", ["React", "CSS"]);
    const jobLow = createMockJob("job-low", "Data Engineer", ["Python", "Spark", "Hadoop"]);

    vi.spyOn(matchingDAL, "getCandidateProfile").mockResolvedValue(mockCandidate);
    vi.spyOn(matchingDAL, "getActiveJobsForMatching").mockResolvedValue([jobLow, jobHigh, jobMed]);

    const results = await service.getTopMatches("user-123", 5);

    expect(results.length).toBe(3);
    expect(results[0].job.id).toBe("job-high");
    expect(results[0].match.overallScore).toBeGreaterThanOrEqual(results[1].match.overallScore);
    expect(results[1].match.overallScore).toBeGreaterThanOrEqual(results[2].match.overallScore);
  });

  it("should break ties by postedAt date descending", async () => {
    const olderDate = new Date("2026-01-01");
    const newerDate = new Date("2026-02-01");

    const jobOlder = createMockJob("job-older", "Full Stack Developer", ["React", "TypeScript", "Node.js"], olderDate);
    const jobNewer = createMockJob("job-newer", "Full Stack Developer", ["React", "TypeScript", "Node.js"], newerDate);

    vi.spyOn(matchingDAL, "getCandidateProfile").mockResolvedValue(mockCandidate);
    vi.spyOn(matchingDAL, "getActiveJobsForMatching").mockResolvedValue([jobOlder, jobNewer]);

    const results = await service.getTopMatches("user-123", 5);

    expect(results.length).toBe(2);
    expect(results[0].match.overallScore).toBe(results[1].match.overallScore);
    // Newer job should be placed first
    expect(results[0].job.id).toBe("job-newer");
    expect(results[1].job.id).toBe("job-older");
  });

  it("should return empty array when active jobs list is empty", async () => {
    vi.spyOn(matchingDAL, "getCandidateProfile").mockResolvedValue(mockCandidate);
    vi.spyOn(matchingDAL, "getActiveJobsForMatching").mockResolvedValue([]);

    const results = await service.getTopMatches("user-123", 5);
    expect(results).toEqual([]);
  });

  it("should return empty array when candidate has no skills and no profile attributes", async () => {
    const emptyCandidate: CandidateMatchingInput = {
      id: "user-empty",
      skills: [],
      experienceLevel: null,
      yearsOfExperience: null,
      targetRole: null,
      education: null,
      preferredWorkMode: null,
      preferredLocations: [],
    };

    vi.spyOn(matchingDAL, "getCandidateProfile").mockResolvedValue(emptyCandidate);

    const results = await service.getTopMatches("user-empty", 5);
    expect(results).toEqual([]);
  });

  it("should return null for non-existent job or candidate in getJobMatch", async () => {
    vi.spyOn(matchingDAL, "getCandidateProfile").mockResolvedValue(null);
    vi.spyOn(matchingDAL, "getJobById").mockResolvedValue(null);

    const match = await service.getJobMatch("non-existent-user", "non-existent-job");
    expect(match).toBeNull();
  });
});
