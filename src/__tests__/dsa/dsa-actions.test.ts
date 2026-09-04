import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import {
  getDSADashboardAction,
  getDSAQuestionDetailAction,
  updateDSAProgressAction,
} from "@/actions/dsa";
import { dsaDAL } from "@/dal/dsa";
import { auth } from "@/lib/auth";
import { DSAStatus } from "@prisma/client";

describe("DSA Server Actions Security & Isolation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should reject getDSADashboardAction when user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const result = await getDSADashboardAction();

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("should reject getDSAQuestionDetailAction when user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const result = await getDSAQuestionDetailAction("q-123");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("should reject updateDSAProgressAction when user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const result = await updateDSAProgressAction({
      questionId: "q-123",
      status: DSAStatus.SOLVED,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("should enforce session-derived userId on upsertProgress", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "student-verified-777" },
    } as any);

    vi.spyOn(dsaDAL, "getQuestionById").mockResolvedValue({
      id: "q-123",
      title: "Two Sum",
    } as any);

    const upsertSpy = vi.spyOn(dsaDAL, "upsertProgress").mockResolvedValue({
      id: "prog-999",
      userId: "student-verified-777",
      questionId: "q-123",
      status: DSAStatus.SOLVED,
      attempts: 1,
    } as any);

    const result = await updateDSAProgressAction({
      questionId: "q-123",
      status: DSAStatus.SOLVED,
      userApproach: "Used hash map",
    });

    expect(result.success).toBe(true);
    expect(upsertSpy).toHaveBeenCalledWith({
      userId: "student-verified-777",
      questionId: "q-123",
      status: DSAStatus.SOLVED,
      userApproach: "Used hash map",
    });
  });
});
