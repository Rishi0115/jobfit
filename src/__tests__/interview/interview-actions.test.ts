import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import {
  startInterviewSessionAction,
  getInterviewSessionAction,
  submitInterviewAnswerAction,
  completeInterviewSessionAction,
} from "@/actions/interview";
import { interviewService } from "@/services/interview/interview-service";
import { auth } from "@/lib/auth";
import { InterviewType } from "@prisma/client";

describe("Interview Server Actions Security & Isolation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should reject startInterviewSessionAction when user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const result = await startInterviewSessionAction({
      type: InterviewType.RESUME_BASED,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("should reject getInterviewSessionAction when user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const result = await getInterviewSessionAction("session-123");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("should reject submitInterviewAnswerAction when user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const result = await submitInterviewAnswerAction({
      sessionId: "session-123",
      questionId: "q-123",
      answerText: "My answer",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("should reject submitInterviewAnswerAction if answer is too short", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "student-1" },
    } as any);

    const result = await submitInterviewAnswerAction({
      sessionId: "session-123",
      questionId: "q-123",
      answerText: "no", // Less than 3 chars
    });

    expect(result.success).toBe(false);
  });

  it("should reject getInterviewSessionAction if session belongs to another user", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "attacker-user-id" },
    } as any);

    // interviewService returns null if sessionId and userId do not match
    vi.spyOn(interviewService, "getSessionDetail").mockResolvedValue(null);

    const result = await getInterviewSessionAction("victim-session-id");

    expect(result.success).toBe(false);
    expect(result.error).toContain("not found or unauthorized");
  });
});
