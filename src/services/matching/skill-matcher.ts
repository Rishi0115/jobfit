/**
 * Pure Skill Matching & Normalization Engine
 *
 * Deterministic skill matching with canonical alias resolution,
 * punctuation stripping, whitespace normalization, and required vs preferred weighting.
 */

import { SKILL_SUB_WEIGHTS } from "@/config/matching-weights";
import type { SkillMatchDetails } from "@/types/matching";

/**
 * Canonical Skill Aliases Map
 * Maps variations to a single canonical lowercase key.
 * DO NOT use overly broad aliases (e.g. "java" must not match "javascript").
 */
export const SKILL_ALIASES: Record<string, string> = {
  // React
  react: "react",
  "react.js": "react",
  reactjs: "react",
  "react native": "react native",
  reactnative: "react native",

  // Node.js
  node: "node.js",
  "node.js": "node.js",
  nodejs: "node.js",

  // JavaScript & TypeScript
  javascript: "javascript",
  js: "javascript",
  ecmascript: "javascript",
  typescript: "typescript",
  ts: "typescript",

  // Python
  python: "python",
  py: "python",
  python3: "python",

  // Databases
  postgresql: "postgresql",
  postgres: "postgresql",
  psql: "postgresql",
  mongodb: "mongodb",
  mongo: "mongodb",
  mysql: "mysql",
  sqlite: "sqlite",
  redis: "redis",

  // Cloud Providers
  aws: "aws",
  "amazon web services": "aws",
  gcp: "gcp",
  "google cloud": "gcp",
  "google cloud platform": "gcp",
  azure: "azure",
  "microsoft azure": "azure",

  // Frontend frameworks
  vue: "vue",
  "vue.js": "vue",
  vuejs: "vue",
  angular: "angular",
  "angular.js": "angular",
  angularjs: "angular",
  "next.js": "next.js",
  nextjs: "next.js",
  next: "next.js",
  "nuxt.js": "nuxt.js",
  nuxtjs: "nuxt.js",
  nuxt: "nuxt.js",
  svelte: "svelte",
  "svelte.js": "svelte",

  // Backend frameworks
  "express.js": "express.js",
  expressjs: "express.js",
  express: "express.js",
  nestjs: "nestjs",
  "nest.js": "nestjs",
  django: "django",
  fastapi: "fastapi",
  "spring boot": "spring boot",
  springboot: "spring boot",
  flask: "flask",

  // Languages
  golang: "go",
  go: "go",
  "c++": "c++",
  cpp: "c++",
  "c#": "c#",
  csharp: "c#",
  ".net": ".net",
  dotnet: ".net",
  ruby: "ruby",
  "ruby on rails": "ruby on rails",
  rails: "ruby on rails",
  rust: "rust",
  java: "java",
  php: "php",

  // Web Basics
  html: "html",
  html5: "html",
  css: "css",
  css3: "css",
  tailwind: "tailwindcss",
  tailwindcss: "tailwindcss",
  "tailwind css": "tailwindcss",
  bootstrap: "bootstrap",
  sass: "sass",
  scss: "sass",

  // APIs & Networking
  rest: "rest api",
  "rest api": "rest api",
  "restful api": "rest api",
  "rest apis": "rest api",
  api: "rest api",
  apis: "rest api",
  graphql: "graphql",
  grpc: "grpc",

  // DevOps & Infrastructure
  docker: "docker",
  kubernetes: "kubernetes",
  k8s: "kubernetes",
  "ci/cd": "ci/cd",
  cicd: "ci/cd",
  git: "git",
  github: "github",
  gitlab: "gitlab",
  linux: "linux",
  terraform: "terraform",
  ansible: "ansible",
};

/**
 * Normalize skill name to canonical identifier:
 * 1. Lowercase and trim
 * 2. Remove peripheral punctuation
 * 3. Look up in canonical alias dictionary
 */
export function canonicalizeSkill(skill: string): string {
  if (!skill || typeof skill !== "string") return "";

  const trimmed = skill.trim().toLowerCase();
  if (!trimmed) return "";

  // Check direct alias hit first
  if (SKILL_ALIASES[trimmed]) {
    return SKILL_ALIASES[trimmed];
  }

  // Normalize separators and punctuation, keeping critical symbols (+, #, .)
  const sanitized = trimmed
    .replace(/[,\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (SKILL_ALIASES[sanitized]) {
    return SKILL_ALIASES[sanitized];
  }

  // Return sanitized string as canonical
  return sanitized;
}

/**
 * Format a canonical skill name for clean user presentation.
 */
export function formatSkillDisplay(canonical: string): string {
  const displayMap: Record<string, string> = {
    react: "React",
    "react native": "React Native",
    "node.js": "Node.js",
    javascript: "JavaScript",
    typescript: "TypeScript",
    postgresql: "PostgreSQL",
    mongodb: "MongoDB",
    mysql: "MySQL",
    sqlite: "SQLite",
    redis: "Redis",
    aws: "AWS",
    gcp: "GCP",
    azure: "Azure",
    vue: "Vue.js",
    angular: "Angular",
    "next.js": "Next.js",
    "nuxt.js": "Nuxt.js",
    "express.js": "Express.js",
    nestjs: "NestJS",
    "spring boot": "Spring Boot",
    "c++": "C++",
    "c#": "C#",
    ".net": ".NET",
    "ruby on rails": "Ruby on Rails",
    html: "HTML",
    css: "CSS",
    tailwindcss: "Tailwind CSS",
    "rest api": "REST API",
    graphql: "GraphQL",
    grpc: "gRPC",
    kubernetes: "Kubernetes",
    "ci/cd": "CI/CD",
  };

  if (displayMap[canonical]) {
    return displayMap[canonical];
  }

  return canonical
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Pure skill match calculation.
 * Compares candidate skills against job required and preferred skills.
 */
export function matchSkills(
  candidateSkills: string[],
  jobRequiredSkills: string[],
  jobPreferredSkills: string[] = []
): { score: number; details: SkillMatchDetails } {
  // Deduplicate and canonicalize candidate skills
  const candidateCanonicalSet = new Set<string>();
  const canonicalToOriginal = new Map<string, string>();

  for (const s of candidateSkills) {
    const canonical = canonicalizeSkill(s);
    if (canonical) {
      candidateCanonicalSet.add(canonical);
      if (!canonicalToOriginal.has(canonical)) {
        canonicalToOriginal.set(canonical, s.trim());
      }
    }
  }

  // Canonicalize required skills (deduped)
  const requiredCanonicalSet = new Set<string>();
  const requiredOriginalMap = new Map<string, string>();

  for (const s of jobRequiredSkills) {
    const canonical = canonicalizeSkill(s);
    if (canonical) {
      requiredCanonicalSet.add(canonical);
      if (!requiredOriginalMap.has(canonical)) {
        requiredOriginalMap.set(canonical, s.trim());
      }
    }
  }

  // Canonicalize preferred skills (deduped, excluding skills already required)
  const preferredCanonicalSet = new Set<string>();
  const preferredOriginalMap = new Map<string, string>();

  for (const s of jobPreferredSkills) {
    const canonical = canonicalizeSkill(s);
    if (canonical && !requiredCanonicalSet.has(canonical)) {
      preferredCanonicalSet.add(canonical);
      if (!preferredOriginalMap.has(canonical)) {
        preferredOriginalMap.set(canonical, s.trim());
      }
    }
  }

  const totalRequired = requiredCanonicalSet.size;
  const totalPreferred = preferredCanonicalSet.size;

  const matchedRequired: string[] = [];
  const missingRequired: string[] = [];

  for (const canonical of requiredCanonicalSet) {
    const displayName =
      requiredOriginalMap.get(canonical) || formatSkillDisplay(canonical);
    if (candidateCanonicalSet.has(canonical)) {
      matchedRequired.push(displayName);
    } else {
      missingRequired.push(displayName);
    }
  }

  const matchedPreferred: string[] = [];
  const missingPreferred: string[] = [];

  for (const canonical of preferredCanonicalSet) {
    const displayName =
      preferredOriginalMap.get(canonical) || formatSkillDisplay(canonical);
    if (candidateCanonicalSet.has(canonical)) {
      matchedPreferred.push(displayName);
    } else {
      missingPreferred.push(displayName);
    }
  }

  // Calculate scores
  let requiredScore = 1.0;
  if (totalRequired > 0) {
    requiredScore = matchedRequired.length / totalRequired;
  }

  let preferredScore = 1.0;
  if (totalPreferred > 0) {
    preferredScore = matchedPreferred.length / totalPreferred;
  }

  // Composite skill score calculation
  let compositeScore = 0;

  if (totalRequired > 0 && totalPreferred > 0) {
    // Both required and preferred specified: 80% required, 20% preferred
    compositeScore =
      requiredScore * SKILL_SUB_WEIGHTS.required +
      preferredScore * SKILL_SUB_WEIGHTS.preferred;
  } else if (totalRequired > 0) {
    // Only required specified: 100% required
    compositeScore = requiredScore;
  } else if (totalPreferred > 0) {
    // Only preferred specified: 100% preferred
    compositeScore = preferredScore;
  } else {
    // Neither specified: if candidate has any skills award full points, else neutral 50
    compositeScore = candidateCanonicalSet.size > 0 ? 1.0 : 0.5;
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(compositeScore * 100)));

  const allMatchedSkills = [...matchedRequired, ...matchedPreferred];
  const allMissingSkills = [...missingRequired, ...missingPreferred];

  return {
    score: finalScore,
    details: {
      totalRequired,
      matchedRequired,
      missingRequired,
      totalPreferred,
      matchedPreferred,
      missingPreferred,
      requiredScore: Math.round(requiredScore * 100),
      preferredScore: Math.round(preferredScore * 100),
      allMatchedSkills,
      allMissingSkills,
    },
  };
}
