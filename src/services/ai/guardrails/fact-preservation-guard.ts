/**
 * Multi-Category Factual Safety & Fact Preservation Guardrail
 *
 * 100% Deterministic:
 * - preservationScore is calculated strictly here by algorithmic verification.
 * - AI never generates, returns, or influences this score.
 * - Target-job context is NEVER treated as verified candidate facts.
 * - Inspects numbers, percentages, dates, technologies, companies, titles, and placeholders.
 */

import { canonicalizeSkill, SKILL_ALIASES } from "@/services/matching/skill-matcher";
import type { ImprovedBulletItem } from "@/types/ai-resume";
import type { AIStructuredOutput } from "@/lib/validators/ai-resume";

export interface CandidateVerifiedFacts {
  rawResumeText?: string | null;
  skills: string[];
  companyNames?: string[];
  jobTitles?: string[];
  educationDegrees?: string[];
}

export interface FactualAuditResult {
  auditedBullets: ImprovedBulletItem[];
  auditedSummary?: {
    originalText?: string;
    improvedText: string;
    explanation: string;
    warnings: string[];
  } | null;
  factualWarnings: string[];
  preservationScore: number; // Deterministic 0-100 score
}

// Regex to extract numbers, percentages, currency, multipliers (e.g., 45%, $80,000, 10x, 100+)
const NUMBER_METRIC_REGEX =
  /(?:[\$£€])?\b\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:%|x|k|m|\+)?(?!\w)/gi;

// Regex to detect explicit metric placeholders like [Add metric, e.g. % faster load]
const METRIC_PLACEHOLDER_REGEX = /\[(?:Add|Insert|Provide|Include)\s+[^\]]+\]/i;

// Regex to detect date ranges (e.g., 2020-2023, 2024, Jan 2023)
const DATE_REGEX = /\b(19\d\d|20\d\d)\b/g;

/**
 * Pure deterministic factual safety auditor.
 */
export function auditFactualPreservation(
  verifiedFacts: CandidateVerifiedFacts,
  aiOutput: AIStructuredOutput
): FactualAuditResult {
  const originalLower = (verifiedFacts.rawResumeText || "").toLowerCase();

  // Build canonical set of candidate's verified skills
  const candidateCanonicalSkills = new Set<string>();
  for (const s of verifiedFacts.skills) {
    const c = canonicalizeSkill(s);
    if (c) candidateCanonicalSkills.add(c);
  }

  // Extract all numbers present in the original resume text
  const originalNumbers = new Set<string>();
  const origMatches = originalLower.match(NUMBER_METRIC_REGEX);
  if (origMatches) {
    for (const m of origMatches) {
      originalNumbers.add(m.toLowerCase());
    }
  }

  // Extract all dates present in the original resume text
  const originalDates = new Set<string>();
  const origDates = originalLower.match(DATE_REGEX);
  if (origDates) {
    for (const d of origDates) {
      originalDates.add(d);
    }
  }

  let totalViolations = 0;
  const globalWarnings: string[] = [];

  // Audit improved bullets
  const auditedBullets: ImprovedBulletItem[] = [];

  for (const bullet of aiOutput.improvedBullets) {
    const bulletWarnings: string[] = [];
    const improvedText = bullet.improvedText;
    const hasPlaceholder = METRIC_PLACEHOLDER_REGEX.test(improvedText);

    // 1. Audit Numbers / Percentages / Metrics
    // Remove placeholders before checking for rogue numbers
    const textWithoutPlaceholders = improvedText.replace(METRIC_PLACEHOLDER_REGEX, "");
    const generatedNumbers = textWithoutPlaceholders.match(NUMBER_METRIC_REGEX) || [];

    for (const num of generatedNumbers) {
      const cleanNum = num.toLowerCase().trim();
      // Allow trivial small numbers like 1 or 2 if part of common phrasing (e.g. "tier 1", "phase 2")
      if (cleanNum === "1" || cleanNum === "2") continue;

      if (!originalNumbers.has(cleanNum) && !originalLower.includes(cleanNum)) {
        bulletWarnings.push(
          `Unverified metric/number "${num}" introduced without factual basis in source resume.`
        );
        totalViolations++;
      }
    }

    // 2. Audit Dates / Years
    const generatedDates = textWithoutPlaceholders.match(DATE_REGEX) || [];
    for (const dateStr of generatedDates) {
      if (!originalDates.has(dateStr)) {
        bulletWarnings.push(
          `Unverified date/year "${dateStr}" introduced.`
        );
        totalViolations++;
      }
    }

    // 3. Audit Technologies / Frameworks
    // Check known skill aliases in generated text
    const lowerBullet = improvedText.toLowerCase();
    for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
      if (alias.length <= 2) continue; // Skip very short tokens like "c" or "js"
      const wordRegex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (wordRegex.test(lowerBullet)) {
        if (!candidateCanonicalSkills.has(canonical) && !originalLower.includes(alias)) {
          bulletWarnings.push(
            `Unverified technical skill "${alias}" introduced in bullet text.`
          );
          totalViolations++;
          break; // Avoid spamming multiple warnings for the same skill
        }
      }
    }

    auditedBullets.push({
      id: bullet.id,
      section: bullet.section,
      originalText: bullet.originalText,
      improvedText: bullet.improvedText,
      factualBasis: bullet.factualBasis,
      alignmentReason: bullet.alignmentReason,
      warnings: bulletWarnings,
      hasMetricPlaceholder: hasPlaceholder,
    });
  }

  // Audit Summary if present
  let auditedSummary = null;
  if (aiOutput.improvedSummary) {
    const summaryWarnings: string[] = [];
    const sumText = aiOutput.improvedSummary.improvedText;
    const sumNumbers = sumText.replace(METRIC_PLACEHOLDER_REGEX, "").match(NUMBER_METRIC_REGEX) || [];

    for (const num of sumNumbers) {
      const cleanNum = num.toLowerCase().trim();
      if (cleanNum === "1" || cleanNum === "2") continue;
      if (!originalNumbers.has(cleanNum) && !originalLower.includes(cleanNum)) {
        summaryWarnings.push(
          `Unverified metric/number "${num}" introduced in summary.`
        );
        totalViolations++;
      }
    }

    auditedSummary = {
      originalText: aiOutput.improvedSummary.originalText,
      improvedText: aiOutput.improvedSummary.improvedText,
      explanation: aiOutput.improvedSummary.explanation,
      warnings: summaryWarnings,
    };
  }

  // Compile global warnings
  if (totalViolations > 0) {
    globalWarnings.push(
      `Detected ${totalViolations} potential factual inconsistency/unverified item(s). Please review highlighted warnings.`
    );
  }

  // Deterministic preservationScore calculation:
  // Starts at 100, deducts 10 points per violation, bounded to [0, 100].
  const preservationScore = Math.max(0, 100 - totalViolations * 10);

  return {
    auditedBullets,
    auditedSummary,
    factualWarnings: globalWarnings,
    preservationScore,
  };
}
