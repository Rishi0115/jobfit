import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import {
  improveResumeAction,
  applyResumeImprovementsAction,
} from "@/actions/ai-resume";
import { resumeImproverService } from "@/services/ai/resume-improver";
import { resumesDAL } from "@/dal/resumes";
import { auth } from "@/lib/auth";

describe("AI Resume Server Actions Security & Execution", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should reject improveResumeAction when user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const result = await improveResumeAction({
      resumeId: "res-123",
      mode: "GENERAL",
      targetSection: "ALL",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("should reject applyResumeImprovementsAction when user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const result = await applyResumeImprovementsAction({
      resumeId: "res-123",
      selectedBulletIds: ["b-1"],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("should enforce session-derived userId when calling resumeImproverService", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "session-student-999", email: "student@example.com" },
    } as any);

    const improveSpy = vi
      .spyOn(resumeImproverService, "improveResume")
      .mockResolvedValue({
        mode: "GENERAL",
        targetSection: "ALL",
        sourceResumeId: "res-456",
        sourceResumeFileName: "Resume.pdf",
        sourceResumeVersion: 1,
        improvedBullets: [],
        skillsSuggestions: { verifiedSkillsToEmphasize: [], missingSkillsAdvice: [] },
        atsSuggestions: [],
        clarificationRequests: [],
        factualWarnings: [],
        preservationScore: 100,
      });

    const result = await improveResumeAction({
      resumeId: "res-456",
      mode: "GENERAL",
      targetSection: "ALL",
    });

    expect(result.success).toBe(true);
    expect(improveSpy).toHaveBeenCalledWith({
      userId: "session-student-999",
      resumeId: "res-456",
      mode: "GENERAL",
      targetSection: "ALL",
      jobId: undefined,
    });
  });

  it("should reject applyResumeImprovementsAction if resume does not belong to caller", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-attacker" },
    } as any);

    vi.spyOn(resumesDAL, "findUserResumeById").mockResolvedValue(null);

    const result = await applyResumeImprovementsAction({
      resumeId: "victim-resume-id",
      selectedBulletIds: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("unauthorized");
  });
});
