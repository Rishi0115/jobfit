import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Development seed — test users only.
 * NEVER use these credentials in production.
 */
async function main() {
  console.log("🌱 Seeding development users...\n");

  const devPassword = await bcrypt.hash("Test1234", 12);

  // Student
  const student = await prisma.user.upsert({
    where: { email: "student@jobfit.dev" },
    update: {},
    create: {
      name: "Test Student",
      email: "student@jobfit.dev",
      passwordHash: devPassword,
      role: "STUDENT",
      profile: { create: {} },
    },
  });
  console.log(`  ✅ Student: ${student.email}`);

  // Recruiter
  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@jobfit.dev" },
    update: {},
    create: {
      name: "Test Recruiter",
      email: "recruiter@jobfit.dev",
      passwordHash: devPassword,
      role: "RECRUITER",
      profile: { create: {} },
    },
  });
  console.log(`  ✅ Recruiter: ${recruiter.email}`);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@jobfit.dev" },
    update: {},
    create: {
      name: "Test Admin",
      email: "admin@jobfit.dev",
      passwordHash: devPassword,
      role: "ADMIN",
      profile: { create: {} },
    },
  });
  console.log(`  ✅ Admin: ${admin.email}`);

  console.log("\n🌱 Seed complete. Password for all users: Test1234");
}

main()
  .catch((e) => {
    console.error("Error during database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
