/**
 * Data Access Layer — Matching
 *
 * Provides database queries for candidate matching profile and job evaluation.
 * Kept strictly in the DAL layer to avoid Prisma calls in services or server actions.
 */

import { db } from "@/lib/db";
import { jobsDAL } from "@/dal/jobs";
import type { CandidateMatchingInput, JobMatchingInput } from "@/types/matching";
import type { JobWithRelations } from "@/types/job";
import { SKILL_ALIASES, canonicalizeSkill } from "@/services/matching/skill-matcher";

/**
 * Deterministically extract known technical skills from raw resume text.
 */
function extractSkillsFromText(text?: string | null): string[] {
  if (!text || typeof text !== "string") return [];
  const lower = text.toLowerCase();
  const matchedSkills = new Set<string>();

  // Check unique skill names from canonical aliases
  for (const skill of Object.keys(SKILL_ALIASES)) {
    if (skill.length <= 2) {
      // For very short tokens like "js", "ts", "go", "c", "c#", use word boundaries
      const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`, "i");
      if (regex.test(lower)) {
        matchedSkills.add(skill);
      }
    } else {
      if (lower.includes(skill)) {
        matchedSkills.add(skill);
      }
    }
  }

  return Array.from(matchedSkills);
}

/**
 * Parse candidate years of experience from resume raw text if available.
 */
function extractYearsFromText(text?: string | null): number | null {
  if (!text) return null;
  const match = text.match(/(\d+)\s*\+?\s*(?:year|yr)s?\s*(?:of)?\s*experience/i);
  if (match) {
    const yrs = parseInt(match[1], 10);
    if (!isNaN(yrs) && yrs >= 0 && yrs <= 40) return yrs;
  }
  return null;
}

export const matchingDAL = {
  /**
   * Fetch full candidate matching profile in a single query.
   * Extracts candidate skills from UserSkills, ResumeAnalysis, and Resume rawText.
   */
  async getCandidateProfile(
    userId: string,
    resumeId?: string
  ): Promise<CandidateMatchingInput | null> {
    if (!userId) return null;

    const resumeWhere = resumeId
      ? { id: resumeId, userId }
      : { isActive: true };

    const user = await db.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        profile: true,
        userSkills: {
          include: {
            skill: true,
          },
        },
        resumes: {
          where: resumeWhere,
          include: {
            analysis: true,
          },
          take: 1,
        },
      },
    });

    if (!user) return null;

    const targetResume = user.resumes[0] || null;
    const profile = user.profile || null;

    // Collect skills and track sources
    const skillsSet = new Set<string>();
    const skillSourceMap = new Map<
      string,
      {
        source: "USER_SKILL" | "RESUME_EXTRACTED" | "RESUME_TEXT" | "NONE";
        proficiency?: string | null;
      }
    >();

    // 1. Direct UserSkill records
    for (const us of user.userSkills) {
      if (us.skill?.name) {
        skillsSet.add(us.skill.name);
        const canon = canonicalizeSkill(us.skill.name);
        skillSourceMap.set(canon, {
          source: "USER_SKILL",
          proficiency: us.proficiency,
        });
      }
      if (us.skill?.normalizedName) {
        skillsSet.add(us.skill.normalizedName);
        const canon = canonicalizeSkill(us.skill.normalizedName);
        skillSourceMap.set(canon, {
          source: "USER_SKILL",
          proficiency: us.proficiency,
        });
      }
    }

    // 2. ResumeAnalysis extractedSkills (if analysis exists)
    if (targetResume?.analysis?.extractedSkills) {
      const extracted = targetResume.analysis.extractedSkills;
      if (Array.isArray(extracted)) {
        for (const s of extracted) {
          if (typeof s === "string" && s.trim()) {
            skillsSet.add(s.trim());
            const canon = canonicalizeSkill(s.trim());
            if (!skillSourceMap.has(canon)) {
              skillSourceMap.set(canon, { source: "RESUME_EXTRACTED" });
            }
          }
        }
      }
    }

    // 3. Extract skills from target resume raw text if needed
    if (targetResume?.rawText) {
      const textSkills = extractSkillsFromText(targetResume.rawText);
      for (const s of textSkills) {
        skillsSet.add(s);
        const canon = canonicalizeSkill(s);
        if (!skillSourceMap.has(canon)) {
          skillSourceMap.set(canon, { source: "RESUME_TEXT" });
        }
      }
    }

    // Determine years of experience
    let yearsOfExperience: number | null = null;
    if (targetResume?.rawText) {
      yearsOfExperience = extractYearsFromText(targetResume.rawText);
    }

    // Determine education data
    let education: {
      degree?: string | null;
      field?: string | null;
      isTech?: boolean | null;
    } | null = null;
    if (targetResume?.rawText) {
      const lower = targetResume.rawText.toLowerCase();
      if (
        lower.includes("bachelor") ||
        lower.includes("b.tech") ||
        lower.includes("btech") ||
        lower.includes("b.e") ||
        lower.includes("bca")
      ) {
        education = {
          degree: "Bachelor's",
          field: "Computer Science & Engineering",
          isTech: true,
        };
      } else if (
        lower.includes("master") ||
        lower.includes("m.tech") ||
        lower.includes("mca") ||
        lower.includes("ms")
      ) {
        education = {
          degree: "Master's",
          field: "Computer Science",
          isTech: true,
        };
      }
    }

    const resumeContext = targetResume
      ? {
          id: targetResume.id,
          fileName: targetResume.fileName,
          isActive: targetResume.isActive,
        }
      : null;

    return {
      id: user.id,
      skills: Array.from(skillsSet),
      experienceLevel: profile?.experienceLevel || null,
      yearsOfExperience,
      targetRole: profile?.targetRole || null,
      education,
      preferredWorkMode: profile?.preferredWorkMode || null,
      preferredLocations:
        profile?.preferredLocations || (profile?.city ? [profile.city] : []),
      resumeContext,
      skillSourceMap,
    };
  },

  /**
   * Fetch active jobs for matching in a single query with company and jobSkills relations.
   */
  async getActiveJobsForMatching(limit: number = 100): Promise<JobWithRelations[]> {
    const jobs = await db.job.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            logoUrl: true,
          },
        },
        source: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        jobSkills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                normalizedName: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { postedAt: "desc" },
      take: Math.max(1, Math.min(200, limit)),
    });

    return jobs as unknown as JobWithRelations[];
  },

  /**
   * Convert a JobWithRelations object into JobMatchingInput for the pure matching engine.
   */
  mapJobToMatchingInput(job: JobWithRelations): JobMatchingInput {
    const requiredSkills: string[] = [];
    const preferredSkills: string[] = [];

    for (const js of job.jobSkills || []) {
      const skillName = js.skill.name || js.skill.normalizedName;
      if (js.isRequired) {
        requiredSkills.push(skillName);
      } else {
        preferredSkills.push(skillName);
      }
    }

    return {
      id: job.id,
      title: job.title,
      requiredSkills,
      preferredSkills,
      experienceLevel: job.experienceLevel || null,
      workMode: job.workMode || null,
      location: job.location || null,
      educationRequirement: null,
    };
  },

  /**
   * Get single job by ID with all relations.
   */
  async getJobById(id: string): Promise<JobWithRelations | null> {
    return jobsDAL.getJobById(id);
  },
};
