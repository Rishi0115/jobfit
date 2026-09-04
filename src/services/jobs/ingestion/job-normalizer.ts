/**
 * Job Normalizer — Deterministic normalization of job data.
 *
 * Normalizes titles, company names, locations, work modes, employment types,
 * experience levels, salaries, URLs, skills, and descriptions.
 * Preserves original values in sourceMetadata.
 */

import type {
  NormalizedJob,
  NormalizedWorkMode,
  NormalizedEmploymentType,
  NormalizedExperienceLevel,
} from "@/types/job";
import { decodeHtmlEntities } from "@/services/jobs/sanitizer";

// ─── Work Mode Normalization ───

const WORK_MODE_MAP: Record<string, NormalizedWorkMode> = {
  remote: "REMOTE",
  "work from home": "REMOTE",
  wfh: "REMOTE",
  "fully remote": "REMOTE",
  "100% remote": "REMOTE",
  telecommute: "REMOTE",
  hybrid: "HYBRID",
  "partially remote": "HYBRID",
  "hybrid remote": "HYBRID",
  "office/remote": "HYBRID",
  onsite: "ONSITE",
  "on-site": "ONSITE",
  "on site": "ONSITE",
  "in-office": "ONSITE",
  "in office": "ONSITE",
  office: "ONSITE",
};

// ─── Employment Type Normalization ───

const EMPLOYMENT_TYPE_MAP: Record<string, NormalizedEmploymentType> = {
  "full time": "FULL_TIME",
  "full-time": "FULL_TIME",
  fulltime: "FULL_TIME",
  ft: "FULL_TIME",
  full_time: "FULL_TIME",
  permanent: "FULL_TIME",
  "part time": "PART_TIME",
  "part-time": "PART_TIME",
  parttime: "PART_TIME",
  pt: "PART_TIME",
  part_time: "PART_TIME",
  contract: "CONTRACT",
  contractor: "CONTRACT",
  freelance: "CONTRACT",
  consulting: "CONTRACT",
  internship: "INTERNSHIP",
  intern: "INTERNSHIP",
  trainee: "INTERNSHIP",
  apprentice: "INTERNSHIP",
  apprenticeship: "INTERNSHIP",
};

// ─── Experience Level Normalization ───

const EXPERIENCE_LEVEL_MAP: Record<string, NormalizedExperienceLevel> = {
  fresher: "FRESHER",
  "entry level": "FRESHER",
  "entry-level": "FRESHER",
  graduate: "FRESHER",
  "new grad": "FRESHER",
  "0-1 years": "FRESHER",
  junior: "JUNIOR",
  "junior level": "JUNIOR",
  "jr.": "JUNIOR",
  jr: "JUNIOR",
  "1-3 years": "JUNIOR",
  associate: "JUNIOR",
  mid: "MID",
  "mid level": "MID",
  "mid-level": "MID",
  "mid-senior": "MID",
  intermediate: "MID",
  "3-5 years": "MID",
  senior: "SENIOR",
  "senior level": "SENIOR",
  "sr.": "SENIOR",
  sr: "SENIOR",
  "5+ years": "SENIOR",
  experienced: "SENIOR",
  lead: "LEAD",
  "tech lead": "LEAD",
  "team lead": "LEAD",
  principal: "LEAD",
  staff: "LEAD",
  "staff engineer": "LEAD",
};

// ─── Canonical Technical Terms Dictionary ───

const TECHNICAL_TERMS: Record<string, string> = {
  "react.js": "React.js",
  reactjs: "React.js",
  "node.js": "Node.js",
  nodejs: "Node.js",
  "vue.js": "Vue.js",
  vuejs: "Vue.js",
  "next.js": "Next.js",
  nextjs: "Next.js",
  "express.js": "Express.js",
  expressjs: "Express.js",
  "three.js": "Three.js",
  "d3.js": "D3.js",
  "angular.js": "Angular.js",
  angularjs: "Angular.js",
  javascript: "JavaScript",
  typescript: "TypeScript",
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  mongodb: "MongoDB",
  mysql: "MySQL",
  graphql: "GraphQL",
  golang: "Golang",
  ios: "iOS",
  android: "Android",
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
  "ui/ux": "UI/UX",
  ui: "UI",
  ux: "UX",
  "ci/cd": "CI/CD",
  devops: "DevOps",
  mlops: "MLOps",
  devsecops: "DevSecOps",
  sre: "SRE",
  qa: "QA",
  sdet: "SDET",
  swe: "SWE",
  ml: "ML",
  ai: "AI",
  nlp: "NLP",
  llm: "LLM",
  rest: "REST",
  api: "API",
  apis: "APIs",
  sql: "SQL",
  nosql: "NoSQL",
  html: "HTML",
  html5: "HTML5",
  css: "CSS",
  css3: "CSS3",
  php: "PHP",
  "c++": "C++",
  "c#": "C#",
  ".net": ".NET",
  dotnet: ".NET",
  seo: "SEO",
  saas: "SaaS",
  b2b: "B2B",
  b2c: "B2C",
};

// Words that should remain lowercase in titles unless they are the first word
const SMALL_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "if",
  "in",
  "nor",
  "of",
  "on",
  "or",
  "so",
  "the",
  "to",
  "up",
  "yet",
  "with",
  "via",
]);

/**
 * Format a single token/word for job titles:
 * - Checks technical terms dictionary first (e.g. React.js, iOS, AWS)
 * - Handles .js suffixes properly (e.g. *.js -> *.js, never *.Js)
 * - Standard title case for general words
 */
function formatTitleWord(word: string, isFirst: boolean): string {
  if (!word) return word;

  // Extract leading/trailing punctuation like (React.js) or /Node.js/
  const match = word.match(/^([^a-zA-Z0-9#+.]*)(.*?)([^a-zA-Z0-9#+.]*)$/);
  if (!match) return word;

  const [, leadingPunct, core, trailingPunct] = match;
  if (!core) return word;

  const coreLower = core.toLowerCase();

  // 1. Check if core contains slashes (e.g. next.js/graphql or ui/ux), unless it's a known term like ui/ux or ci/cd
  if (coreLower === "ui/ux" || coreLower === "ci/cd") {
    return `${leadingPunct}${TECHNICAL_TERMS[coreLower]}${trailingPunct}`;
  }

  if (core.includes("/")) {
    const subParts = core
      .split("/")
      .map((part) => formatTitleWord(part, false));
    return `${leadingPunct}${subParts.join("/")}${trailingPunct}`;
  }

  // 2. Check if core is in known technical terms
  if (TECHNICAL_TERMS[coreLower]) {
    return `${leadingPunct}${TECHNICAL_TERMS[coreLower]}${trailingPunct}`;
  }

  // 2. Check if word ends with .js (e.g. svelte.js -> Svelte.js)
  if (coreLower.endsWith(".js") && coreLower.length > 3) {
    const base = coreLower.slice(0, -3);
    const capitalizedBase = base.charAt(0).toUpperCase() + base.slice(1);
    return `${leadingPunct}${capitalizedBase}.js${trailingPunct}`;
  }

  // 3. Small words remain lowercase unless first word
  if (!isFirst && SMALL_WORDS.has(coreLower)) {
    return `${leadingPunct}${coreLower}${trailingPunct}`;
  }

  // 4. Standard capitalize first letter, keep rest as-is if already mixed-case, else lowercase
  const isMixedCase =
    core.length > 2 &&
    /[A-Z]/.test(core.slice(1)) &&
    /[a-z]/.test(core);

  if (isMixedCase) {
    return `${leadingPunct}${core}${trailingPunct}`;
  }

  const capitalized = core.charAt(0).toUpperCase() + core.slice(1).toLowerCase();
  return `${leadingPunct}${capitalized}${trailingPunct}`;
}

// ─── Core Normalization Functions ───

/**
 * Normalize a job title: trim, collapse whitespace, apply intelligent title casing
 * that preserves and fixes technical terms (e.g. "Senior React.js Developer").
 */
export function normalizeTitle(title: string): string {
  const cleaned = title.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  // Split by whitespace
  const words = cleaned.split(" ");

  return words
    .map((word, index) => formatTitleWord(word, index === 0))
    .join(" ");
}

/**
 * Normalize a company name: trim, collapse whitespace.
 * Preserves original casing (company names are proper nouns).
 */
export function normalizeCompanyName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/**
 * Generate a normalized key for company deduplication.
 * Lowercase, trimmed, collapsed whitespace, stripped common suffixes.
 */
export function normalizeCompanyNameForComparison(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(
      /\s*(inc\.?|llc\.?|ltd\.?|corp\.?|co\.?|pvt\.?|private|limited|technologies|solutions|labs|studio|studios)\s*$/gi,
      ""
    )
    .trim();
}

/**
 * Normalize location string.
 */
export function normalizeLocation(location: string): string {
  return location.trim().replace(/\s+/g, " ");
}

/**
 * Normalize work mode from various string representations.
 */
export function normalizeWorkMode(
  value: string | undefined | null
): NormalizedWorkMode | undefined {
  if (!value) return undefined;
  const key = value.toLowerCase().trim();

  // Check if it's already a valid enum value
  if (key === "remote" || key === "hybrid" || key === "onsite") {
    return key.toUpperCase() as NormalizedWorkMode;
  }

  return WORK_MODE_MAP[key];
}

/**
 * Normalize employment type from various string representations.
 */
export function normalizeEmploymentType(
  value: string | undefined | null
): NormalizedEmploymentType | undefined {
  if (!value) return undefined;
  const key = value.toLowerCase().trim();

  const enumValues: Record<string, NormalizedEmploymentType> = {
    full_time: "FULL_TIME",
    part_time: "PART_TIME",
    contract: "CONTRACT",
    internship: "INTERNSHIP",
  };
  if (enumValues[key]) return enumValues[key];

  return EMPLOYMENT_TYPE_MAP[key];
}

/**
 * Normalize experience level from various string representations.
 */
export function normalizeExperienceLevel(
  value: string | undefined | null
): NormalizedExperienceLevel | undefined {
  if (!value) return undefined;
  const key = value.toLowerCase().trim();

  const enumValues: Record<string, NormalizedExperienceLevel> = {
    fresher: "FRESHER",
    junior: "JUNIOR",
    mid: "MID",
    senior: "SENIOR",
    lead: "LEAD",
  };
  if (enumValues[key]) return enumValues[key];

  return EXPERIENCE_LEVEL_MAP[key];
}

/**
 * Normalize a salary value — ensure it's a positive number.
 */
export function normalizeSalary(
  value: number | string | undefined | null
): number | undefined {
  if (value === undefined || value === null) return undefined;

  const num =
    typeof value === "string"
      ? parseFloat(value.replace(/[^\d.]/g, ""))
      : value;

  if (isNaN(num) || num <= 0) return undefined;
  return Math.round(num);
}

/**
 * Normalize a URL — trim and basic validation.
 */
export function normalizeUrl(
  url: string | undefined | null
): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed;
    }
    return undefined;
  } catch {
    // Try prepending https://
    try {
      const withProtocol = `https://${trimmed}`;
      const parsed = new URL(withProtocol);
      if (parsed.protocol === "https:" && parsed.hostname.includes(".")) {
        return withProtocol;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}

/**
 * Normalize a description — trim, collapse excessive whitespace/newlines.
 */
export function normalizeDescription(description: string): string {
  const decoded = decodeHtmlEntities(description);
  return decoded
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ");
}

/**
 * Normalize a skill name: lowercase, trim.
 */
export function normalizeSkillName(skill: string): string {
  return skill.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Normalize a list of skills: lowercase, trim, deduplicate.
 */
export function normalizeSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const skill of skills) {
    const normalized = normalizeSkillName(skill);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
}

/**
 * Normalize an entire NormalizedJob object.
 * Applies all normalization rules and preserves original values in sourceMetadata.
 */
export function normalizeJob(job: NormalizedJob): NormalizedJob {
  const originalValues: Record<string, unknown> = {};

  // Preserve original values before normalization
  if (job.title) originalValues.originalTitle = job.title;
  if (job.company) originalValues.originalCompany = job.company;
  if (job.location) originalValues.originalLocation = job.location;

  const normalized: NormalizedJob = {
    externalJobId: job.externalJobId,
    title: normalizeTitle(job.title),
    description: normalizeDescription(job.description),
    company: normalizeCompanyName(job.company),
    companyWebsite: normalizeUrl(job.companyWebsite),
    location: job.location ? normalizeLocation(job.location) : undefined,
    workMode:
      typeof job.workMode === "string"
        ? normalizeWorkMode(job.workMode) ?? (job.workMode as NormalizedWorkMode)
        : job.workMode,
    employmentType:
      typeof job.employmentType === "string"
        ? normalizeEmploymentType(job.employmentType) ??
          (job.employmentType as NormalizedEmploymentType)
        : job.employmentType,
    experienceLevel:
      typeof job.experienceLevel === "string"
        ? normalizeExperienceLevel(job.experienceLevel) ??
          (job.experienceLevel as NormalizedExperienceLevel)
        : job.experienceLevel,
    salaryMin: normalizeSalary(job.salaryMin),
    salaryMax: normalizeSalary(job.salaryMax),
    salaryCurrency: job.salaryCurrency?.toUpperCase().trim(),
    applicationUrl: normalizeUrl(job.applicationUrl),
    source: job.source,
    sourceUrl: normalizeUrl(job.sourceUrl),
    postedAt: job.postedAt,
    expiresAt: job.expiresAt,
    skills: job.skills ? normalizeSkills(job.skills) : undefined,
    sourceMetadata: {
      ...job.sourceMetadata,
      ...originalValues,
    },
  };

  return normalized;
}
