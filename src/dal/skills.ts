/**
 * Data Access Layer — Skills
 * All Skill-related database operations are centralized here.
 */
import { db } from "@/lib/db";
import type { Skill } from "@prisma/client";

/**
 * Generate a display name from a normalized skill name.
 * E.g., "react.js" → "React.js", "postgresql" → "PostgreSQL"
 */
function toDisplayName(normalized: string): string {
  // Special cases for well-known tech names
  const specialCases: Record<string, string> = {
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "postgresql": "PostgreSQL",
    "mongodb": "MongoDB",
    "graphql": "GraphQL",
    "node.js": "Node.js",
    "react.js": "React.js",
    "vue.js": "Vue.js",
    "next.js": "Next.js",
    "express.js": "Express.js",
    "angular.js": "Angular.js",
    "three.js": "Three.js",
    "d3.js": "D3.js",
    "css": "CSS",
    "html": "HTML",
    "sql": "SQL",
    "nosql": "NoSQL",
    "rest api": "REST API",
    "api": "API",
    "ci/cd": "CI/CD",
    "aws": "AWS",
    "gcp": "GCP",
    "azure": "Azure",
    "devops": "DevOps",
    "mlops": "MLOps",
    "ios": "iOS",
    "ui/ux": "UI/UX",
    "grpc": "gRPC",
  };

  if (specialCases[normalized]) return specialCases[normalized];

  // Default: capitalize first letter of each word
  return normalized
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const skillsDAL = {
  /**
   * Find skills by normalized names.
   */
  async findByNormalizedNames(names: string[]): Promise<Skill[]> {
    if (names.length === 0) return [];
    return db.skill.findMany({
      where: {
        normalizedName: { in: names },
      },
    });
  },

  /**
   * Find or create skills by normalized names.
   * Returns all Skill records (existing + newly created).
   */
  async findOrCreateMany(normalizedNames: string[]): Promise<Skill[]> {
    if (normalizedNames.length === 0) return [];

    // Find existing
    const existing = await db.skill.findMany({
      where: {
        normalizedName: { in: normalizedNames },
      },
    });

    const existingNormalized = new Set(existing.map((s) => s.normalizedName));

    // Find names that don't exist yet
    const toCreate = normalizedNames.filter(
      (name) => !existingNormalized.has(name)
    );

    // Create missing skills
    if (toCreate.length > 0) {
      await db.skill.createMany({
        data: toCreate.map((normalizedName) => ({
          name: toDisplayName(normalizedName),
          normalizedName,
        })),
        skipDuplicates: true,
      });
    }

    // Return all skills (existing + newly created)
    return db.skill.findMany({
      where: {
        normalizedName: { in: normalizedNames },
      },
    });
  },

  /**
   * Create JobSkill relations for a job, avoiding duplicates.
   */
  async createJobSkills(
    jobId: string,
    skillIds: string[],
    isRequired: boolean = true
  ): Promise<void> {
    if (skillIds.length === 0) return;

    await db.jobSkill.createMany({
      data: skillIds.map((skillId) => ({
        jobId,
        skillId,
        isRequired,
      })),
      skipDuplicates: true,
    });
  },
};
