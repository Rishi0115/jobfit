import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { getJobMatchAction, getTopMatchesAction } from "@/actions/matching";
import { matchingService } from "@/services/matching";
import { auth } from "@/lib/auth";

describe("Matching Server Actions Security", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should reject getJobMatchAction when user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const result = await getJobMatchAction("job-123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("should derive userId from session and not allow passing arbitrary user IDs", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "session-user-123", email: "test@example.com" },
    } as any);

    const getJobMatchSpy = vi
      .spyOn(matchingService, "getJobMatch")
      .mockResolvedValue({
        overallScore: 85,
      } as any);

    const result = await getJobMatchAction("job-456");
    expect(result.success).toBe(true);
    // Verified that userId passed to matchingService is strictly derived from session
    expect(getJobMatchSpy).toHaveBeenCalledWith("session-user-123", "job-456");
  });

  it("should reject getTopMatchesAction when user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const result = await getTopMatchesAction(5);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("should execute getTopMatchesAction for authenticated user with sanitized limit", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "session-user-123", email: "test@example.com" },
    } as any);

    const getTopMatchesSpy = vi
      .spyOn(matchingService, "getTopMatches")
      .mockResolvedValue([]);

    const result = await getTopMatchesAction(10);
    expect(result.success).toBe(true);
    expect(getTopMatchesSpy).toHaveBeenCalledWith("session-user-123", 10);
  });

  it("should validate and reject empty or invalid job ID in getJobMatchAction", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "session-user-123" },
    } as any);

    const result = await getJobMatchAction("   ");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid Job ID");
  });
});
