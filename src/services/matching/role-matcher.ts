/**
 * Pure Job Title / Role Relevance Matching Engine
 *
 * Deterministic title relevance using role families and token matching.
 * Handles relationships like Software Engineer <-> Full Stack Developer without an LLM.
 */

import type { RoleMatchDetails } from "@/types/matching";

export interface RoleFamilyDefinition {
  family: string;
  specialization?: string;
  keywords: string[];
}

export const ROLE_FAMILIES: Record<string, RoleFamilyDefinition> = {
  swe_general: {
    family: "SOFTWARE_ENGINEERING",
    specialization: "GENERAL",
    keywords: [
      "software engineer",
      "software developer",
      "swe",
      "programmer",
      "application developer",
      "systems developer",
    ],
  },
  frontend: {
    family: "SOFTWARE_ENGINEERING",
    specialization: "FRONTEND",
    keywords: [
      "frontend developer",
      "frontend engineer",
      "front-end developer",
      "front-end engineer",
      "front end developer",
      "ui developer",
      "web developer",
    ],
  },
  backend: {
    family: "SOFTWARE_ENGINEERING",
    specialization: "BACKEND",
    keywords: [
      "backend developer",
      "backend engineer",
      "back-end developer",
      "back-end engineer",
      "back end developer",
      "api engineer",
      "server engineer",
    ],
  },
  fullstack: {
    family: "SOFTWARE_ENGINEERING",
    specialization: "FULLSTACK",
    keywords: [
      "full stack developer",
      "full stack engineer",
      "fullstack developer",
      "fullstack engineer",
      "full-stack developer",
      "full-stack engineer",
    ],
  },
  mobile: {
    family: "SOFTWARE_ENGINEERING",
    specialization: "MOBILE",
    keywords: [
      "mobile developer",
      "mobile engineer",
      "ios developer",
      "ios engineer",
      "android developer",
      "android engineer",
      "flutter developer",
      "react native developer",
    ],
  },
  devops_cloud: {
    family: "INFRASTRUCTURE",
    specialization: "DEVOPS",
    keywords: [
      "devops engineer",
      "site reliability engineer",
      "sre",
      "cloud engineer",
      "platform engineer",
      "infrastructure engineer",
    ],
  },
  data_ai: {
    family: "DATA_AI",
    specialization: "DATA",
    keywords: [
      "data scientist",
      "data engineer",
      "machine learning engineer",
      "ml engineer",
      "ai engineer",
      "data analyst",
      "deep learning engineer",
    ],
  },
  qa_testing: {
    family: "QUALITY",
    specialization: "QA",
    keywords: [
      "qa engineer",
      "sdet",
      "software development engineer in test",
      "test engineer",
      "quality assurance engineer",
      "qa tester",
    ],
  },
};

/**
 * Detect which role definition a title matches best
 */
export function detectRoleDefinition(title: string): RoleFamilyDefinition | null {
  if (!title) return null;
  const lower = title.toLowerCase().trim();

  for (const def of Object.values(ROLE_FAMILIES)) {
    for (const kw of def.keywords) {
      if (lower.includes(kw)) {
        return def;
      }
    }
  }

  return null;
}

/**
 * Normalize title by stripping seniorities and non-role words
 */
function cleanTitleTokens(title: string): Set<string> {
  const stopWords = new Set([
    "senior",
    "junior",
    "lead",
    "principal",
    "staff",
    "associate",
    "intern",
    "entry",
    "level",
    "i",
    "ii",
    "iii",
    "iv",
    "sr",
    "jr",
    "the",
    "at",
    "for",
    "in",
  ]);

  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.has(w))
  );
}

/**
 * Match candidate target role against job title deterministically.
 */
export function matchRole(
  candidateRole?: string | null,
  jobTitle?: string | null
): { score: number; isAvailable: boolean; details: RoleMatchDetails } {
  if (!candidateRole || !candidateRole.trim()) {
    return {
      score: 0,
      isAvailable: false,
      details: {
        candidateRole: null,
        jobTitle: jobTitle || "",
        matchType: "UNAVAILABLE",
        reason: "Candidate target role is not specified.",
      },
    };
  }

  const cRole = candidateRole.trim();
  const jTitle = (jobTitle || "").trim();

  // Exact match (case-insensitive)
  if (cRole.toLowerCase() === jTitle.toLowerCase()) {
    return {
      score: 100,
      isAvailable: true,
      details: {
        candidateRole: cRole,
        jobTitle: jTitle,
        matchType: "EXACT",
        reason: "Exact title match.",
      },
    };
  }

  const candidateDef = detectRoleDefinition(cRole);
  const jobDef = detectRoleDefinition(jTitle);

  // If both belong to identified role definitions
  if (candidateDef && jobDef) {
    // Exact same family and specialization
    if (
      candidateDef.family === jobDef.family &&
      candidateDef.specialization === jobDef.specialization
    ) {
      return {
        score: 95,
        isAvailable: true,
        details: {
          candidateRole: cRole,
          jobTitle: jTitle,
          roleFamily: candidateDef.family,
          matchType: "SPECIALIZATION",
          reason: `Strong role match within ${candidateDef.specialization?.toLowerCase()} specialization.`,
        },
      };
    }

    // Fullstack <-> Frontend or Fullstack <-> Backend
    if (
      candidateDef.family === "SOFTWARE_ENGINEERING" &&
      jobDef.family === "SOFTWARE_ENGINEERING"
    ) {
      if (
        (candidateDef.specialization === "FULLSTACK" &&
          (jobDef.specialization === "FRONTEND" || jobDef.specialization === "BACKEND")) ||
        (jobDef.specialization === "FULLSTACK" &&
          (candidateDef.specialization === "FRONTEND" || candidateDef.specialization === "BACKEND"))
      ) {
        return {
          score: 85,
          isAvailable: true,
          details: {
            candidateRole: cRole,
            jobTitle: jTitle,
            roleFamily: "SOFTWARE_ENGINEERING",
            matchType: "FAMILY",
            reason: "High relevance: Full-stack and Frontend/Backend are closely aligned.",
          },
        };
      }

      // General SWE <-> Specialized SWE
      if (
        candidateDef.specialization === "GENERAL" ||
        jobDef.specialization === "GENERAL"
      ) {
        return {
          score: 80,
          isAvailable: true,
          details: {
            candidateRole: cRole,
            jobTitle: jTitle,
            roleFamily: "SOFTWARE_ENGINEERING",
            matchType: "FAMILY",
            reason: "General software engineering role aligns with development position.",
          },
        };
      }

      // Frontend <-> Backend (cross-specialization within SWE)
      return {
        score: 60,
        isAvailable: true,
        details: {
          candidateRole: cRole,
          jobTitle: jTitle,
          roleFamily: "SOFTWARE_ENGINEERING",
          matchType: "FAMILY",
          reason: "Both are software engineering roles with different primary specializations.",
        },
      };
    }

    // Different families entirely
    if (candidateDef.family !== jobDef.family) {
      return {
        score: 20,
        isAvailable: true,
        details: {
          candidateRole: cRole,
          jobTitle: jTitle,
          roleFamily: `${candidateDef.family} vs ${jobDef.family}`,
          matchType: "UNRELATED",
          reason: `Role disciplines differ (${candidateDef.family} vs ${jobDef.family}).`,
        },
      };
    }
  }

  // Fallback: Token overlap similarity
  const cTokens = cleanTitleTokens(cRole);
  const jTokens = cleanTitleTokens(jTitle);

  let matchCount = 0;
  for (const t of cTokens) {
    if (jTokens.has(t)) matchCount++;
  }

  const unionSize = new Set([...cTokens, ...jTokens]).size;
  const overlapRatio = unionSize > 0 ? matchCount / unionSize : 0;

  if (overlapRatio >= 0.5) {
    return {
      score: 75,
      isAvailable: true,
      details: {
        candidateRole: cRole,
        jobTitle: jTitle,
        matchType: "TOKEN_OVERLAP",
        reason: `Significant title keyword overlap (${Math.round(overlapRatio * 100)}%).`,
      },
    };
  } else if (overlapRatio > 0) {
    return {
      score: 45,
      isAvailable: true,
      details: {
        candidateRole: cRole,
        jobTitle: jTitle,
        matchType: "TOKEN_OVERLAP",
        reason: "Partial title keyword overlap.",
      },
    };
  }

  return {
    score: 15,
    isAvailable: true,
    details: {
      candidateRole: cRole,
      jobTitle: jTitle,
      matchType: "UNRELATED",
      reason: "No strong role or title relationship found.",
    },
  };
}
