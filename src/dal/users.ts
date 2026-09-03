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
};
