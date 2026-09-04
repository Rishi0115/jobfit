import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResumeJobService } from "@/services/resume-analysis/resume-job-service";
import { calculateMatchScore } from "@/services/matching/engine";
import { matchingDAL } from "@/dal/matching";
import { db } from "@/lib/db";
import type { CandidateMatchingInput, JobMatchingInput } from "@/types/matching";
import type { JobWithRelations } from "@/types/job";

describe("Phase 6 Score Parity & Non-Mutation Proofs", () => {
  let service: ResumeJobService;

  beforeEach(() => {
    service = new ResumeJobService();
    vi.restoreAllMocks();
  });

  const mockCandidate: CandidateMatchingInput = {
    id: "cand-123",
    skills: ["React", "TypeScript", "Node.js"],
    experienceLevel: "MID",
    yearsOfExperience: 3,
    targetRole: "Full Stack Engineer",
    education: { degree: "B.Tech", field: "Computer Science", isTech: true },
    preferredWorkMode: "REMOTE",
    preferredLocations: ["Bengaluru"],
    resumeContext: {
      id: "res-456",
      fileName: "Software_Dev_Resume.pdf",
      isActive: true,
    },
  };

  const mockJobWithRel: JobWithRelations = {
    id: "job-789",
    title: "Full Stack Developer",
    description: "Build robust web applications",
    companyId: "comp-1",
    companyName: "Acme Tech",
    location: "Bengaluru",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    experienceLevel: "MID",
    salaryMin: 1200000,
    salaryMax: 1600000,
    salaryCurrency: "INR",
    applicationUrl: "https://acme.example.com",
    postedAt: new Date("2026-03-01"),
    expiresAt: null,
    status: "ACTIVE",
    createdAt: new Date("2026-03-01"),
    updatedAt: new Date("2026-03-01"),
    company: { id: "comp-1", name: "Acme Tech", website: null, logoUrl: null },
    source: { id: "src-1", name: "Internal", type: "api" },
    jobSkills: [
      {
        id: "js-1",
        isRequired: true,
        skill: {
          id: "sk-1",
          name: "React",
          normalizedName: "react",
          category: "FRAMEWORK",
        },
      },
      {
        id: "js-2",
        isRequired: true,
        skill: {
          id: "sk-2",
          name: "TypeScript",
          normalizedName: "typescript",
          category: "PROGRAMMING_LANGUAGE",
        },
      },
      {
        id: "js-3",
        isRequired: false,
        skill: {
          id: "sk-3",
          name: "Docker",
          normalizedName: "docker",
          category: "TOOL",
        },
      },
    ],
  };

  it("proves that Phase 7 overall score exactly equals Phase 6 overall score for identical inputs", async () => {
    vi.spyOn(matchingDAL, "getCandidateProfile").mockResolvedValue(mockCandidate);
    vi.spyOn(matchingDAL, "getJobById").mockResolvedValue(mockJobWithRel);

    const phase7Result = await service.analyzeResumeAgainstJob(
      "cand-123",
      "job-789"
    );

    expect(phase7Result).not.toBeNull();

    // Directly calculate Phase 6 score on identical input
    const jobInput = matchingDAL.mapJobToMatchingInput(mockJobWithRel);
    const phase6Score = calculateMatchScore(mockCandidate, jobInput);

    // Exact parity assertion
    expect(phase7Result!.overallScore).toBe(phase6Score.overallScore);
    expect(phase7Result!.scoreLabel).toBe(phase6Score.matchLabel);
    expect(phase7Result!.matchQuality).toBe(phase6Score.matchQuality);

    // Verify individual signal score parity
    expect(phase7Result!.experienceAssessment.score).toBe(
      phase6Score.breakdown.experience.score
    );
    expect(phase7Result!.roleAssessment.score).toBe(
      phase6Score.breakdown.role.score
    );
    expect(phase7Result!.educationAssessment.score).toBe(
      phase6Score.breakdown.education.score
    );
    expect(phase7Result!.locationAssessment.score).toBe(
      phase6Score.breakdown.location.score
    );
  });

  it("proves that ResumeAnalysis is never mutated or persisted during job-specific analysis", async () => {
    vi.spyOn(matchingDAL, "getCandidateProfile").mockResolvedValue(mockCandidate);
    vi.spyOn(matchingDAL, "getJobById").mockResolvedValue(mockJobWithRel);

    const updateSpy = vi.spyOn(db.resumeAnalysis, "update");
    const upsertSpy = vi.spyOn(db.resumeAnalysis, "upsert");
    const createSpy = vi.spyOn(db.resumeAnalysis, "create");

    await service.analyzeResumeAgainstJob("cand-123", "job-789");

    // Must never perform write/mutation queries
    expect(updateSpy).not.toHaveBeenCalled();
    expect(upsertSpy).not.toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
  });
});
