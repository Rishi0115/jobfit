import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { updateProfileAction } from "@/actions/profile";
import { usersDAL } from "@/dal/users";
import { auth } from "@/lib/auth";

describe("Profile Server Actions Security & Isolation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should reject updateProfileAction when user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const result = await updateProfileAction({
      bio: "Software Engineer",
      targetRole: "Full Stack Engineer",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("should always use session.user.id server-side to prevent cross-user profile manipulation", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "authenticated-user-789", email: "auth@example.com" },
    } as any);

    const upsertSpy = vi
      .spyOn(usersDAL, "upsertProfile")
      .mockResolvedValue({
        id: "profile-1",
        userId: "authenticated-user-789",
        bio: "Updated bio",
        targetRole: "Backend Engineer",
      } as any);

    const result = await updateProfileAction({
      bio: "Updated bio",
      targetRole: "Backend Engineer",
      location: "Bengaluru, India",
    });

    expect(result.success).toBe(true);
    expect(upsertSpy).toHaveBeenCalledWith("authenticated-user-789", {
      bio: "Updated bio",
      phone: null,
      location: "Bengaluru, India",
      targetRole: "Backend Engineer",
      experienceLevel: null,
      preferredWorkMode: null,
      linkedinUrl: null,
      githubUrl: null,
      portfolioUrl: null,
    });
  });

  it("should validate and reject invalid URLs", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any);

    const result = await updateProfileAction({
      linkedinUrl: "not-a-valid-url",
    });

    expect(result.success).toBe(false);
  });
});
