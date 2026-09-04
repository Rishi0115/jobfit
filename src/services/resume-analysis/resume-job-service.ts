/**
 * Resume vs Job Analysis Service
 *
 * Single Source of Truth for Match Scores: Directly invokes Phase 6 calculateMatchScore.
 * 100% Read-Only: Never mutates or overwrites ResumeAnalysis or any database records.
 * Generates granular skill gap itemization and deterministic recommendations on-demand.
 */

import { matchingDAL } from "@/dal/matching";
import { calculateMatchScore } from "@/services/matching/engine";
import { analyzeSkillGaps } from "@/services/skill-gap/skill-gap-analyzer";
import { generateDeterministicRecommendations } from "@/services/skill-gap/recommendation-generator";
import type {
  AssessmentSignal,
  EvaluationStatus,
  ResumeJobAnalysisResult,
} from "@/types/analysis";

export class ResumeJobService {
  /**
   * Perform comprehensive, deterministic Resume vs Job Analysis for a candidate.
   *
   * @param userId - Authenticated user ID (derived from session)
   * @param jobId - Target job ID to evaluate
   * @param resumeId - Optional specific resume ID belonging to user (defaults to active resume)
   */
  async analyzeResumeAgainstJob(
    userId: string,
    jobId: string,
    resumeId?: string
  ): Promise<ResumeJobAnalysisResult | null> {
    if (!userId || !jobId) return null;

    // 1. Fetch candidate and job through read-only DAL
    const [candidate, job] = await Promise.all([
      matchingDAL.getCandidateProfile(userId, resumeId),
      matchingDAL.getJobById(jobId),
    ]);

    if (!candidate || !job) return null;

    // 2. Map job to matching input
    const jobInput = matchingDAL.mapJobToMatchingInput(job);

    // 3. PHASE 6 SINGLE SOURCE OF TRUTH: Execute deterministic matching engine
    const phase6Match = calculateMatchScore(candidate, jobInput);

    // 4. Execute pure skill gap analysis with strict Required vs Preferred separation
    const skillGapResult = analyzeSkillGaps(
      candidate.skills,
      jobInput.requiredSkills,
      jobInput.preferredSkills,
      candidate.skillSourceMap
    );

    // 5. Build Assessments with explicit EvaluationStatus (no null ambiguity)
    const experienceStatus: EvaluationStatus = phase6Match.signalAvailability
      .experience
      ? "EVALUATED"
      : "UNAVAILABLE";

    const experienceAssessment: AssessmentSignal<{
      isMet: boolean;
      isOverqualified: boolean;
      candidateYears?: number | null;
      requiredYearsRange?: string | null;
      candidateLevel?: string | null;
      jobLevel?: string | null;
    }> = {
      status: experienceStatus,
      score: phase6Match.breakdown.experience.score,
      reason: phase6Match.breakdown.experience.details.reason,
      details: {
        isMet: phase6Match.breakdown.experience.details.isMet,
        isOverqualified: phase6Match.breakdown.experience.details.isOverqualified,
        candidateYears: phase6Match.breakdown.experience.details.candidateYears,
        requiredYearsRange:
          phase6Match.breakdown.experience.details.requiredYearsRange,
        candidateLevel: phase6Match.breakdown.experience.details.candidateLevel,
        jobLevel: phase6Match.breakdown.experience.details.jobLevel,
      },
    };

    const roleStatus: EvaluationStatus = phase6Match.signalAvailability.role
      ? "EVALUATED"
      : "UNAVAILABLE";

    const roleAssessment: AssessmentSignal<{
      matchType: string;
      roleFamily?: string | null;
    }> = {
      status: roleStatus,
      score: phase6Match.breakdown.role.score,
      reason: phase6Match.breakdown.role.details.reason,
      details: {
        matchType: phase6Match.breakdown.role.details.matchType,
        roleFamily: phase6Match.breakdown.role.details.roleFamily,
      },
    };

    const educationStatus: EvaluationStatus = !jobInput.educationRequirement
      ? "NOT_APPLICABLE"
      : phase6Match.signalAvailability.education
      ? "EVALUATED"
      : "UNAVAILABLE";

    const educationAssessment: AssessmentSignal<{
      isDomainMatch: boolean;
      isRequirementSatisfied: boolean;
      candidateDegree?: string | null;
    }> = {
      status: educationStatus,
      score: phase6Match.breakdown.education.score,
      reason: phase6Match.breakdown.education.details.reason,
      details: {
        isDomainMatch:
          phase6Match.breakdown.education.details.isDomainMatch,
        isRequirementSatisfied:
          phase6Match.breakdown.education.details.isRequirementSatisfied,
        candidateDegree:
          phase6Match.breakdown.education.details.candidateDegree,
      },
    };

    const locationStatus: EvaluationStatus = !jobInput.workMode && !jobInput.location
      ? "NOT_APPLICABLE"
      : phase6Match.signalAvailability.location
      ? "EVALUATED"
      : "UNAVAILABLE";

    const locationAssessment: AssessmentSignal<{
      isWorkModeCompatible: boolean;
      isLocationCompatible: boolean;
    }> = {
      status: locationStatus,
      score: phase6Match.breakdown.location.score,
      reason: phase6Match.breakdown.location.details.reason,
      details: {
        isWorkModeCompatible:
          phase6Match.breakdown.location.details.isWorkModeCompatible,
        isLocationCompatible:
          phase6Match.breakdown.location.details.isLocationCompatible,
      },
    };

    // 6. Generate 100% deterministic recommendations tracing to concrete gaps
    const recommendations = generateDeterministicRecommendations({
      criticalGaps: skillGapResult.criticalGaps,
      importantGaps: skillGapResult.importantGaps,
      experienceAssessment,
      roleAssessment,
      educationAssessment,
      locationAssessment,
    });

    // 7. Compile final strongly-typed result contract
    return {
      // Phase 6 Single Source of Truth
      overallScore: phase6Match.overallScore,
      scoreLabel: phase6Match.matchLabel,
      matchQuality: phase6Match.matchQuality,
      phase6MatchResult: phase6Match,

      // Context
      analyzedResumeId: candidate.resumeContext?.id || null,
      analyzedResumeFileName: candidate.resumeContext?.fileName || null,
      isResumeActive: candidate.resumeContext?.isActive ?? false,
      analyzedJobId: job.id,
      analyzedJobTitle: job.title,

      // Strict Required vs Preferred Separation
      matchedRequiredSkills: phase6Match.breakdown.skills.details.matchedRequired,
      missingRequiredSkills: phase6Match.breakdown.skills.details.missingRequired,
      matchedPreferredSkills:
        phase6Match.breakdown.skills.details.matchedPreferred,
      missingPreferredSkills:
        phase6Match.breakdown.skills.details.missingPreferred,

      // Granular Skill Gap Itemization
      criticalGaps: skillGapResult.criticalGaps,
      importantGaps: skillGapResult.importantGaps,
      coveredSkills: skillGapResult.coveredSkills,

      // Assessments with explicit EvaluationStatus
      experienceAssessment,
      roleAssessment,
      educationAssessment,
      locationAssessment,

      // Insights & Actionable Recommendations
      strengths: phase6Match.strengths,
      recommendations,
      explanation: phase6Match.explanation,
    };
  }
}

export const resumeJobService = new ResumeJobService();
