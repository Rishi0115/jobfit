"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { usersDAL } from "@/dal/users";
import type { ApiResponse } from "@/types";
import { z } from "zod";
import { ExperienceLevel, WorkMode } from "@prisma/client";

const updateProfileSchema = z.object({
  bio: z.string().max(1000).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  targetRole: z.string().max(100).optional().nullable(),
  experienceLevel: z.nativeEnum(ExperienceLevel).optional().nullable(),
  preferredWorkMode: z.nativeEnum(WorkMode).optional().nullable(),
  linkedinUrl: z.string().url().max(200).optional().nullable().or(z.literal("")),
  githubUrl: z.string().url().max(200).optional().nullable().or(z.literal("")),
  portfolioUrl: z.string().url().max(200).optional().nullable().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function updateProfileAction(
  data: UpdateProfileInput
): Promise<ApiResponse<any>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    const parsed = updateProfileSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid profile data.",
      };
    }

    const sanitizedData = {
      bio: parsed.data.bio || null,
      phone: parsed.data.phone || null,
      location: parsed.data.location || null,
      targetRole: parsed.data.targetRole || null,
      experienceLevel: parsed.data.experienceLevel || null,
      preferredWorkMode: parsed.data.preferredWorkMode || null,
      linkedinUrl: parsed.data.linkedinUrl || null,
      githubUrl: parsed.data.githubUrl || null,
      portfolioUrl: parsed.data.portfolioUrl || null,
    };

    const updated = await usersDAL.upsertProfile(session.user.id, sanitizedData);

    revalidatePath("/profile");
    revalidatePath("/dashboard");

    return { success: true, data: updated };
  } catch (error) {
    console.error("[updateProfileAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile.",
    };
  }
}
