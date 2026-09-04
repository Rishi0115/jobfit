/**
 * Interview Preparation Service Orchestrator
 *
 * Coordinates candidate context gathering, question generation with factual guardrails,
 * dynamic follow-up progression, and advisory score calculation.
 */

import { interviewDAL } from "@/dal/interview";
import { matchingDAL } from "@/dal/matching";
import { resumesDAL } from "@/dal/resumes";
import { resumeJobService } from "@/services/resume-analysis/resume-job-service";
import { aiClient } from "@/services/ai/ai-client";
import {
  INTERVIEW_GENERATION_SYSTEM_PROMPT,
  buildQuestionGenerationPrompt,
} from "./prompts/interview-prompts";
import { auditInterviewQuestions } from "./guardrails/interview-factual-guard";
import { followUpEngine } from "./follow-up-engine";
import { isDuplicateFollowUp } from "./evaluation-engine";
import {
  aiGeneratedQuestionsSchema,
  type AIGeneratedQuestionsOutput,
} from "@/lib/validators/interview";
import {
  InterviewType,
  InterviewStatus,
  QuestionCategory,
} from "@prisma/client";
import type {
  InterviewSessionDetail,
  InterviewQuestionItem,
} from "@/types/interview";

export class InterviewService {
  /**
   * Start a new interview preparation session and generate personalized questions.
   */
  async startSession(params: {
    userId: string;
    type: InterviewType;
    jobId?: string;
    questionCount?: number;
    difficulty?: string;
  }): Promise<InterviewSessionDetail | null> {
    const { userId, type, jobId, questionCount = 5, difficulty = "medium" } = params;

    if (type === InterviewType.JOB_BASED && !jobId) {
      throw new Error("Target job is required for job-based interview.");
    }

    // 1. Fetch candidate verified facts
    const activeResume = await resumesDAL.findActiveResume(userId);
    const candidateProfile = await matchingDAL.getCandidateProfile(
      userId,
      activeResume?.id
    );

    const verifiedFacts = {
      rawResumeText: activeResume?.rawText || null,
      skills: candidateProfile?.skills || [],
      experienceLevel: candidateProfile?.experienceLevel || null,
      targetRole: candidateProfile?.targetRole || null,
    };

    // 2. Fetch target job if applicable
    let targetJob = null;
    let skillGaps: string[] = [];

    if (jobId) {
      const jobRecord = await matchingDAL.getJobById(jobId);
      if (jobRecord) {
        const mappedInput = matchingDAL.mapJobToMatchingInput(jobRecord);
        targetJob = {
          title: jobRecord.title,
          description: jobRecord.description,
          requiredSkills: mappedInput.requiredSkills,
          preferredSkills: mappedInput.preferredSkills,
        };

        // Extract Phase 7 gaps
        const analysis = await resumeJobService.analyzeResumeAgainstJob(
          userId,
          jobId,
          activeResume?.id
        );
        if (analysis) {
          skillGaps = analysis.criticalGaps.map((g) => g.skillName);
        }
      }
    }

    // 3. Generate questions using AI
    const prompt = buildQuestionGenerationPrompt({
      type,
      questionCount,
      verifiedFacts,
      targetJob,
      skillGaps,
    });

    let rawQuestions: AIGeneratedQuestionsOutput["questions"] = [];

    try {
      const aiResponse = await aiClient.generateStructuredOutput({
        prompt,
        systemPrompt: INTERVIEW_GENERATION_SYSTEM_PROMPT,
        schema: aiGeneratedQuestionsSchema,
        temperature: 0.3,
        maxTokens: 2000,
      });
      rawQuestions = aiResponse.questions;
    } catch {
      // Fallback deterministic questions if provider fails
      rawQuestions = [
        {
          content: "Explain the architecture of your primary project and how you organized the codebase.",
          category: QuestionCategory.PROJECT,
          difficulty: difficulty as any || "medium",
          source: "RESUME",
        },
        {
          content: `What are the trade-offs of the primary technologies you used in ${verifiedFacts.skills[0] || "your projects"}?`,
          category: QuestionCategory.TECHNICAL,
          difficulty: difficulty as any || "medium",
          source: "RESUME",
        },
        {
          content: "Describe a challenging bug or performance issue you encountered and how you diagnosed it.",
          category: QuestionCategory.BEHAVIORAL,
          difficulty: difficulty as any || "medium",
          source: "BEHAVIORAL",
        },
      ];
    }

    // 4. FACTUAL GUARDRAIL: Prevent presumptive scale/metric hallucinations
    const auditedQuestions = auditInterviewQuestions(
      { rawResumeText: verifiedFacts.rawResumeText, skills: verifiedFacts.skills },
      rawQuestions
    );

    // 5. Persist session and questions in DB
    const session = await interviewDAL.createSession({
      userId,
      type,
      jobId,
      config: {
        questionCount: auditedQuestions.length,
        difficulty: difficulty || "medium",
      },
    });

    await interviewDAL.addQuestionsToSession(
      session.id,
      auditedQuestions.map((q, idx) => ({
        content: q.content,
        category: q.category,
        difficulty: q.difficulty || difficulty || "medium",
        orderIndex: idx + 1,
      }))
    );

    // Update status to IN_PROGRESS
    await interviewDAL.updateSessionStatus({
      sessionId: session.id,
      userId,
      status: InterviewStatus.IN_PROGRESS,
    });

    return this.getSessionDetail(session.id, userId);
  }

  /**
   * Fetch full session details with questions, answers, and follow-ups.
   */
  async getSessionDetail(
    sessionId: string,
    userId: string
  ): Promise<InterviewSessionDetail | null> {
    const record = await interviewDAL.getSessionById(sessionId, userId);
    if (!record) return null;

    const questions: InterviewQuestionItem[] = record.questions.map((q) => ({
      id: q.id,
      sessionId: q.sessionId,
      content: q.content,
      category: q.category,
      difficulty: q.difficulty,
      orderIndex: q.orderIndex,
      source: "RESUME",
      answer: q.answer
        ? {
            id: q.answer.id,
            content: q.answer.content,
            evaluation: q.answer.evaluation as any,
            createdAt: q.answer.createdAt,
          }
        : null,
      followUps: q.followUps.map((f) => ({
        id: f.id,
        parentQuestionId: f.parentQuestionId,
        content: f.content,
        answer: f.answer,
        evaluation: f.evaluation as any,
        orderIndex: f.orderIndex,
        createdAt: f.createdAt,
      })),
    }));

    return {
      id: record.id,
      userId: record.userId,
      jobId: record.jobId,
      jobTitle: record.job?.title || null,
      companyName: record.job?.company?.name || null,
      type: record.type,
      status: record.status,
      config: record.config as any,
      overallScore: record.overallScore,
      technicalScore: record.technicalScore,
      communicationScore: record.communicationScore,
      feedback: record.feedback as any,
      questions,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
      createdAt: record.createdAt,
    };
  }

  /**
   * Submit an answer for a primary question or a follow-up question.
   */
  async submitAnswer(params: {
    sessionId: string;
    userId: string;
    questionId: string;
    answerText: string;
    isFollowUp?: boolean;
    followUpId?: string;
  }): Promise<{
    session: InterviewSessionDetail;
    evaluation: any;
    newFollowUp?: string | null;
  } | null> {
    const {
      sessionId,
      userId,
      questionId,
      answerText,
      isFollowUp,
      followUpId,
    } = params;

    const session = await interviewDAL.getSessionById(sessionId, userId);
    if (!session) return null;

    const question = session.questions.find((q) => q.id === questionId);
    if (!question) return null;

    // Prevent duplicate submissions
    if (!isFollowUp) {
      if (question.answer) {
        throw new Error("This question has already been answered.");
      }
    } else if (followUpId) {
      const existingFollowUp = question.followUps.find((f) => f.id === followUpId);
      if (existingFollowUp?.answer) {
        throw new Error("This follow-up question has already been answered.");
      }
    }

    let evaluationResult: any = null;
    let newFollowUpText: string | null = null;

    if (isFollowUp && followUpId) {
      // 1. Evaluate answer to a follow-up
      const currentFollowUps = question.followUps.map((f) => ({
        question: f.content,
        answer: f.id === followUpId ? answerText : f.answer,
      }));

      const evalOutput = await followUpEngine.evaluateAndFollowUp({
        questionContent: question.content,
        candidateAnswer: answerText,
        previousFollowUps: currentFollowUps,
        currentFollowUpDepth: question.followUps.length,
      });

      evaluationResult = evalOutput.evaluation;

      await interviewDAL.saveFollowUpAnswer({
        followUpId,
        answer: answerText,
        evaluation: evaluationResult,
      });

      // Collect existing questions across session to prevent repeating
      const existingSessionQuestions = session.questions.flatMap((q) => [
        q.content,
        ...q.followUps.map((f) => f.content),
      ]);

      // If depth is less than 2, allow a second follow-up question
      if (
        question.followUps.length < 2 &&
        evalOutput.shouldAskFollowUp &&
        evalOutput.followUpQuestion &&
        !isDuplicateFollowUp(evalOutput.followUpQuestion, existingSessionQuestions)
      ) {
        newFollowUpText = evalOutput.followUpQuestion;
        await interviewDAL.createFollowUp({
          parentQuestionId: questionId,
          content: evalOutput.followUpQuestion,
          orderIndex: question.followUps.length + 1,
        });
      }
    } else {
      // 2. Evaluate answer to primary question
      const evalOutput = await followUpEngine.evaluateAndFollowUp({
        questionContent: question.content,
        candidateAnswer: answerText,
        currentFollowUpDepth: 0,
      });

      evaluationResult = evalOutput.evaluation;

      await interviewDAL.saveAnswer({
        questionId,
        content: answerText,
        evaluation: evaluationResult,
      });

      // Collect existing questions across session
      const existingSessionQuestions = session.questions.flatMap((q) => [
        q.content,
        ...q.followUps.map((f) => f.content),
      ]);

      // 3. If dynamic follow-up warranted, create FollowUpQuestion (depth 1)
      if (
        evalOutput.shouldAskFollowUp &&
        evalOutput.followUpQuestion &&
        !isDuplicateFollowUp(evalOutput.followUpQuestion, existingSessionQuestions)
      ) {
        newFollowUpText = evalOutput.followUpQuestion;
        await interviewDAL.createFollowUp({
          parentQuestionId: questionId,
          content: evalOutput.followUpQuestion,
          orderIndex: 1,
        });
      }
    }

    const updatedSession = await this.getSessionDetail(sessionId, userId);
    if (!updatedSession) return null;

    return {
      session: updatedSession,
      evaluation: evaluationResult,
      newFollowUp: newFollowUpText,
    };
  }

  /**
   * Conclude interview session, aggregate scores, and generate structured feedback summary.
   */
  async completeSession(
    sessionId: string,
    userId: string
  ): Promise<InterviewSessionDetail | null> {
    const session = await this.getSessionDetail(sessionId, userId);
    if (!session) return null;

    // Aggregate scores from answered questions
    const scores: number[] = [];
    const allStrengths: string[] = [];
    const allWeaknesses: string[] = [];
    const allSuggestions: string[] = [];

    for (const q of session.questions) {
      if (q.answer?.evaluation?.score) {
        scores.push(q.answer.evaluation.score);
        allStrengths.push(...(q.answer.evaluation.strengths || []));
        allWeaknesses.push(...(q.answer.evaluation.missingConcepts || []));
        allSuggestions.push(...(q.answer.evaluation.improvementSuggestions || []));
      }
      for (const f of q.followUps) {
        if (f.evaluation?.score) {
          scores.push(f.evaluation.score);
        }
      }
    }

    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 75;

    const feedbackSummary = {
      overallScore: avgScore,
      technicalScore: avgScore,
      communicationScore: Math.min(100, avgScore + 5),
      strengths: Array.from(new Set(allStrengths)).slice(0, 4),
      weaknesses: Array.from(new Set(allWeaknesses)).slice(0, 4),
      suggestions: Array.from(new Set(allSuggestions)).slice(0, 4),
      detailedFeedback: `Completed session with ${session.questions.length} questions practiced. Continue working on technical depth and concrete implementation examples.`,
    };

    await interviewDAL.updateSessionStatus({
      sessionId,
      userId,
      status: InterviewStatus.COMPLETED,
      overallScore: feedbackSummary.overallScore,
      technicalScore: feedbackSummary.technicalScore,
      communicationScore: feedbackSummary.communicationScore,
      feedback: feedbackSummary,
    });

    // Also persist into InterviewFeedback model
    await interviewDAL.saveInterviewFeedback({
      sessionId,
      overallScore: feedbackSummary.overallScore,
      technicalScore: feedbackSummary.technicalScore,
      communicationScore: feedbackSummary.communicationScore,
      strengths: feedbackSummary.strengths,
      weaknesses: feedbackSummary.weaknesses,
      suggestions: feedbackSummary.suggestions,
      detailedFeedback: feedbackSummary.detailedFeedback,
    });

    return this.getSessionDetail(sessionId, userId);
  }
}

export const interviewService = new InterviewService();
