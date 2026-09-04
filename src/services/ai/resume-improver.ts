/**
 * AI Resume Improver Service
 *
 * Coordinates prompt compilation, provider execution, and deterministic
 * factual guardrail auditing. Returns strongly typed ResumeImprovementResult.
 */

import { matchingDAL } from "@/dal/matching";
import { resumesDAL } from "@/dal/resumes";
import { resumeJobService } from "@/services/resume-analysis/resume-job-service";
import { aiClient } from "@/services/ai/ai-client";
import {
  RESUME_IMPROVEMENT_SYSTEM_PROMPT,
  buildResumeImprovementPrompt,
} from "@/services/ai/prompts/resume-prompts";
import { aiStructuredOutputSchema } from "@/lib/validators/ai-resume";
import { auditFactualPreservation } from "@/services/ai/guardrails/fact-preservation-guard";
import type {
  ImprovementMode,
  ResumeImprovementResult,
  ResumeSectionType,
} from "@/types/ai-resume";

export class ResumeImproverService {
  /**
   * Run AI Resume Improvement for a candidate's resume.
   */
  async improveResume(params: {
    userId: string;
    resumeId: string;
    mode: ImprovementMode;
    targetSection: ResumeSectionType;
    jobId?: string;
  }): Promise<ResumeImprovementResult | null> {
    const { userId, resumeId, mode, targetSection, jobId } = params;

    // 1. Fetch resume and verify user ownership
    const resume = await resumesDAL.findUserResumeById(resumeId, userId);
    if (!resume) return null;

    // 2. Fetch candidate profile for verified facts
    const candidateProfile = await matchingDAL.getCandidateProfile(
      userId,
      resumeId
    );
    if (!candidateProfile) return null;

    // 3. If job-targeted, fetch job and Phase 7 analysis
    let targetJob = null;
    let phase7Analysis = null;

    if (mode === "JOB_TARGETED" && jobId) {
      const jobRecord = await matchingDAL.getJobById(jobId);
      if (jobRecord) {
        const mappedInput = matchingDAL.mapJobToMatchingInput(jobRecord);
        targetJob = {
          id: jobRecord.id,
          title: jobRecord.title,
          description: jobRecord.description,
          requiredSkills: mappedInput.requiredSkills,
          preferredSkills: mappedInput.preferredSkills,
        };

        // Leverage Phase 7 as target context
        phase7Analysis = await resumeJobService.analyzeResumeAgainstJob(
          userId,
          jobId,
          resumeId
        );
      }
    }

    // 4. Assemble verified candidate facts
    const verifiedFacts = {
      rawResumeText: resume.rawText,
      skills: candidateProfile.skills,
      experienceLevel: candidateProfile.experienceLevel,
      yearsOfExperience: candidateProfile.yearsOfExperience,
      targetRole: candidateProfile.targetRole,
      education: candidateProfile.education,
    };

    // 5. Build structured prompt with anti-hallucination constraints
    const prompt = buildResumeImprovementPrompt({
      verifiedFacts,
      mode,
      targetSection,
      targetJob,
      phase7Analysis,
    });

    // 6. Execute AI call with Zod schema validation
    const rawAiOutput = await aiClient.generateStructuredOutput({
      prompt,
      systemPrompt: RESUME_IMPROVEMENT_SYSTEM_PROMPT,
      schema: aiStructuredOutputSchema,
      temperature: 0.2, // Low temperature for high factual consistency
      maxTokens: 2500,
    });

    // 7. DETERMINISTIC POST-GENERATION GUARDRAIL
    // Calculates preservationScore deterministically; AI never controls this score
    const auditResult = auditFactualPreservation(verifiedFacts, rawAiOutput);

    // 8. Return strongly-typed result contract
    return {
      mode,
      targetSection,
      sourceResumeId: resume.id,
      sourceResumeFileName: resume.fileName,
      sourceResumeVersion: resume.version,
      targetJobId: targetJob?.id || null,
      targetJobTitle: targetJob?.title || null,
      improvedSummary: auditResult.auditedSummary,
      improvedBullets: auditResult.auditedBullets,
      skillsSuggestions: rawAiOutput.skillsSuggestions,
      atsSuggestions: rawAiOutput.atsSuggestions,
      clarificationRequests: rawAiOutput.clarificationRequests,
      factualWarnings: auditResult.factualWarnings,
      preservationScore: auditResult.preservationScore,
    };
  }
}

export const resumeImproverService = new ResumeImproverService();
