import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { analyzeResumeJobAction } from "@/actions/analysis";
import { resumeJobService } from "@/services/resume-analysis/resume-job-service";
import { matchingDAL } from "@/dal/matching";
import { auth } from "@/lib/auth";

describe("Skill Gap & Analysis Security & Edge Cases", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should reject analyzeResumeJobAction when user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const result = await analyzeResumeJobAction({ jobId: "job-123" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("should reject invalid/empty job IDs through Zod schema", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "student@example.com" },
    } as any);

    const result = await analyzeResumeJobAction({ jobId: "   " });
    expect(result.success).toBe(false);
    expect(typeof result.error).toBe("object");
  });

  it("should enforce session-derived userId when calling resumeJobService", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "session-student-789", email: "student@example.com" },
    } as any);

    const analyzeSpy = vi
      .spyOn(resumeJobService, "analyzeResumeAgainstJob")
      .mockResolvedValue({
        overallScore: 82,
      } as any);

    const result = await analyzeResumeJobAction({
      jobId: "job-valid",
      resumeId: "res-valid",
    });

    expect(result.success).toBe(true);
    expect(analyzeSpy).toHaveBeenCalledWith(
      "session-student-789",
      "job-valid",
      "res-valid"
    );
  });

  it("should return null gracefully when candidate has no resume and never fabricate match scores", async () => {
    vi.spyOn(matchingDAL, "getCandidateProfile").mockResolvedValue({
      id: "user-no-resume",
      skills: [],
      experienceLevel: null,
      yearsOfExperience: null,
      targetRole: null,
      education: null,
      preferredWorkMode: null,
      preferredLocations: [],
      resumeContext: null, // No resume
    });

    vi.spyOn(matchingDAL, "getJobById").mockResolvedValue(null);

    const result = await resumeJobService.analyzeResumeAgainstJob(
      "user-no-resume",
      "non-existent-job"
    );

    // Must return null, NOT a fabricated 80-90% score
    expect(result).toBeNull();
  });

  it("should verify explicit EvaluationStatus states (EVALUATED, UNAVAILABLE, NOT_APPLICABLE)", async () => {
    vi.spyOn(matchingDAL, "getCandidateProfile").mockResolvedValue({
      id: "user-explicit",
      skills: ["React"],
      experienceLevel: null, // Experience unavailable
      yearsOfExperience: null,
      targetRole: "Frontend Developer", // Role evaluated
      education: null, // Education unavailable
      preferredWorkMode: null, // Location not applicable for job with no restrictions
      preferredLocations: [],
      resumeContext: { id: "res-1", fileName: "My_Resume.pdf", isActive: true },
    });

    vi.spyOn(matchingDAL, "getJobById").mockResolvedValue({
      id: "job-explicit",
      title: "Frontend Developer",
      description: "Frontend engineer role",
      companyName: "TechCorp",
      companyId: null,
      location: null,
      workMode: null, // No work mode or location restriction -> NOT_APPLICABLE
      employmentType: "FULL_TIME",
      experienceLevel: "MID",
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: "INR",
      applicationUrl: null,
      postedAt: new Date(),
      expiresAt: null,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      company: null,
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
      ],
    } as any);

    const result = await resumeJobService.analyzeResumeAgainstJob(
      "user-explicit",
      "job-explicit"
    );

    expect(result).not.toBeNull();
    // Verify explicit states without null ambiguity
    expect(result!.experienceAssessment.status).toBe("UNAVAILABLE");
    expect(result!.roleAssessment.status).toBe("EVALUATED");
    expect(result!.locationAssessment.status).toBe("NOT_APPLICABLE");
    expect(result!.educationAssessment.status).toBe("NOT_APPLICABLE");
  });
});
