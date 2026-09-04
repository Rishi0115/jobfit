/**
 * Pure Skill Gap Analysis Engine
 *
 * 100% Prisma-independent set comparison and categorization logic.
 * Enforces strict Required vs Preferred separation:
 * - Missing REQUIRED skill -> CRITICAL gap
 * - Missing PREFERRED skill -> IMPORTANT gap
 * - Candidate HAS skill -> COVERED (severity NONE)
 */

import {
  canonicalizeSkill,
  formatSkillDisplay,
} from "@/services/matching/skill-matcher";
import type {
  SkillGapItem,
  SkillRequirementType,
  SkillSource,
} from "@/types/analysis";

export interface SkillSourceInfo {
  source: SkillSource;
  proficiency?: string | null;
}

/**
 * Generate deterministic, actionable advice for an individual missing skill.
 */
function generateSkillImprovementTip(
  skillDisplayName: string,
  type: SkillRequirementType
): string {
  if (type === "REQUIRED") {
    return `Critical requirement: Build or document a hands-on project demonstrating ${skillDisplayName} before applying, or highlight relevant coursework/internship usage.`;
  }
  return `Preferred qualification: Adding ${skillDisplayName} or highlighting familiarity will strengthen your competitive edge for this role.`;
}

export interface SkillGapAnalysisResult {
  criticalGaps: SkillGapItem[];
  importantGaps: SkillGapItem[];
  coveredSkills: SkillGapItem[];
  allGaps: SkillGapItem[];
}

/**
 * Pure skill gap analysis function.
 */
export function analyzeSkillGaps(
  candidateSkills: string[],
  jobRequiredSkills: string[],
  jobPreferredSkills: string[] = [],
  skillSourceMap?: Map<string, SkillSourceInfo>
): SkillGapAnalysisResult {
  // 1. Build canonical set of candidate skills
  const candidateCanonicalMap = new Map<string, string>(); // canonical -> original name
  for (const s of candidateSkills) {
    const canonical = canonicalizeSkill(s);
    if (canonical && !candidateCanonicalMap.has(canonical)) {
      candidateCanonicalMap.set(canonical, s.trim());
    }
  }

  // 2. Build canonical required and preferred sets (avoiding duplicates)
  const requiredCanonicalMap = new Map<string, string>();
  for (const s of jobRequiredSkills) {
    const canonical = canonicalizeSkill(s);
    if (canonical && !requiredCanonicalMap.has(canonical)) {
      requiredCanonicalMap.set(canonical, s.trim());
    }
  }

  const preferredCanonicalMap = new Map<string, string>();
  for (const s of jobPreferredSkills) {
    const canonical = canonicalizeSkill(s);
    // If a skill is already listed in required, required semantics take precedence
    if (
      canonical &&
      !requiredCanonicalMap.has(canonical) &&
      !preferredCanonicalMap.has(canonical)
    ) {
      preferredCanonicalMap.set(canonical, s.trim());
    }
  }

  const criticalGaps: SkillGapItem[] = [];
  const importantGaps: SkillGapItem[] = [];
  const coveredSkills: SkillGapItem[] = [];

  // 3. Process REQUIRED skills
  for (const [canonical, originalName] of requiredCanonicalMap.entries()) {
    const displayName = originalName || formatSkillDisplay(canonical);
    const hasSkill = candidateCanonicalMap.has(canonical);
    const sourceInfo = skillSourceMap?.get(canonical);

    if (hasSkill) {
      coveredSkills.push({
        skillName: displayName,
        canonicalName: canonical,
        type: "REQUIRED",
        status: "COVERED",
        severity: "NONE",
        source: sourceInfo?.source || "RESUME_EXTRACTED",
        proficiency: sourceInfo?.proficiency || null,
        recommendation: null,
      });
    } else {
      criticalGaps.push({
        skillName: displayName,
        canonicalName: canonical,
        type: "REQUIRED",
        status: "MISSING",
        severity: "CRITICAL",
        source: "NONE",
        proficiency: null,
        recommendation: generateSkillImprovementTip(displayName, "REQUIRED"),
      });
    }
  }

  // 4. Process PREFERRED skills
  for (const [canonical, originalName] of preferredCanonicalMap.entries()) {
    const displayName = originalName || formatSkillDisplay(canonical);
    const hasSkill = candidateCanonicalMap.has(canonical);
    const sourceInfo = skillSourceMap?.get(canonical);

    if (hasSkill) {
      coveredSkills.push({
        skillName: displayName,
        canonicalName: canonical,
        type: "PREFERRED",
        status: "COVERED",
        severity: "NONE",
        source: sourceInfo?.source || "RESUME_EXTRACTED",
        proficiency: sourceInfo?.proficiency || null,
        recommendation: null,
      });
    } else {
      importantGaps.push({
        skillName: displayName,
        canonicalName: canonical,
        type: "PREFERRED",
        status: "MISSING",
        severity: "IMPORTANT",
        source: "NONE",
        proficiency: null,
        recommendation: generateSkillImprovementTip(displayName, "PREFERRED"),
      });
    }
  }

  return {
    criticalGaps,
    importantGaps,
    coveredSkills,
    allGaps: [...criticalGaps, ...importantGaps],
  };
}
