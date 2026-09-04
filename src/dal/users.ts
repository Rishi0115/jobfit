/**
 * Data Access Layer — Users
 * All User-related database operations are centralized here.
 * No Prisma calls should be made directly from Server Actions or components.
 */
import { db } from "@/lib/db";

export const usersDAL = {
  findById: async (id: string) => {
    return db.user.findUnique({
      where: { id, deletedAt: null },
      include: { profile: true },
    });
  },

  findByEmail: async (email: string) => {
    return db.user.findUnique({
      where: { email },
    });
  },

  upsertProfile: async (
    userId: string,
    data: {
      bio?: string | null;
      phone?: string | null;
      location?: string | null;
      targetRole?: string | null;
      experienceLevel?: any;
      preferredWorkMode?: any;
      linkedinUrl?: string | null;
      githubUrl?: string | null;
      portfolioUrl?: string | null;
    }
  ) => {
    return db.profile.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });
  },
};
