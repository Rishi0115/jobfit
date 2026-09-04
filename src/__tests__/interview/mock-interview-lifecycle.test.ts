import { describe, it, expect, vi, beforeEach } from "vitest";

// 1. Mock DB
let mockSessions: any[] = [];
let mockQuestions: any[] = [];
let mockAnswers: any[] = [];
let mockFollowUps: any[] = [];
let mockFeedback: any[] = [];
let idCounter = 1;

vi.mock("@/lib/db", () => ({
  db: {
    interviewSession: {
      create: vi.fn(async ({ data }) => {
        const session = {
          id: `session-${idCounter++}`,
          ...data,
          status: "SETUP",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockSessions.push(session);
        return session;
      }),
      findFirst: vi.fn(async ({ where }) => {
        const session = mockSessions.find(
          (s) => s.id === where.id && (!where.userId || s.userId === where.userId)
        );
        if (!session) return null;
        const qList = mockQuestions
          .filter((q) => q.sessionId === session.id)
          .map((q) => {
            const answer = mockAnswers.find((a) => a.questionId === q.id) || null;
            const followUps = mockFollowUps
              .filter((f) => f.parentQuestionId === q.id)
              .sort((a, b) => a.orderIndex - b.orderIndex);
            return {
              ...q,
              answer,
              followUps,
            };
          })
          .sort((a, b) => a.orderIndex - b.orderIndex);

        return {
          ...session,
          job: session.jobId
            ? { id: session.jobId, title: "Senior Backend Engineer", company: { name: "Stripe" } }
            : null,
          questions: qList,
        };
      }),
      findUnique: vi.fn(async ({ where, include }) => {
        const session = mockSessions.find((s) => s.id === where.id);
        if (!session) return null;
        const qList = mockQuestions
          .filter((q) => q.sessionId === session.id)
          .map((q) => {
            const answer = mockAnswers.find((a) => a.questionId === q.id) || null;
            const followUps = mockFollowUps
              .filter((f) => f.parentQuestionId === q.id)
              .sort((a, b) => a.orderIndex - b.orderIndex);
            return {
              ...q,
              answer,
              followUps,
            };
          })
          .sort((a, b) => a.orderIndex - b.orderIndex);

        return {
          ...session,
          job: session.jobId
            ? { id: session.jobId, title: "Backend Engineer", company: { name: "Stripe" } }
            : null,
          questions: qList,
        };
      }),
      updateMany: vi.fn(async ({ where, data }) => {
        let count = 0;
        for (const s of mockSessions) {
          if (s.id === where.id && s.userId === where.userId) {
            Object.assign(s, data);
            count++;
          }
        }
        return { count };
      }),
    },
    interviewQuestion: {
      create: vi.fn(async ({ data }) => {
        const q = { id: `q-${idCounter++}`, ...data, createdAt: new Date() };
        mockQuestions.push(q);
        return q;
      }),
    },
    interviewAnswer: {
      upsert: vi.fn(async ({ where, create, update }) => {
        let existing = mockAnswers.find((a) => a.questionId === where.questionId);
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const created = { id: `ans-${idCounter++}`, ...create, createdAt: new Date() };
        mockAnswers.push(created);
        return created;
      }),
    },
    followUpQuestion: {
      create: vi.fn(async ({ data }) => {
        const f = { id: `fu-${idCounter++}`, ...data, createdAt: new Date() };
        mockFollowUps.push(f);
        return f;
      }),
      update: vi.fn(async ({ where, data }) => {
        const f = mockFollowUps.find((item) => item.id === where.id);
        if (!f) throw new Error("FollowUp not found");
        Object.assign(f, data);
        return f;
      }),
    },
    interviewFeedback: {
      upsert: vi.fn(async ({ where, create, update }) => {
        let existing = mockFeedback.find((fb) => fb.sessionId === where.sessionId);
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const created = { id: `fb-${idCounter++}`, ...create, createdAt: new Date() };
        mockFeedback.push(created);
        return created;
      }),
      findUnique: vi.fn(async ({ where }) => {
        return mockFeedback.find((fb) => fb.sessionId === where.sessionId) || null;
      }),
    },
    $transaction: vi.fn(async (promises) => Promise.all(promises)),
  },
}));

// 2. Mock DALs
vi.mock("@/dal/resumes", () => ({
  resumesDAL: {
    findActiveResume: vi.fn(async (userId: string) => ({
      id: `resume-${userId}`,
      userId,
      fileName: "john_resume.pdf",
      rawText: "Built microservices using Node.js, TypeScript and PostgreSQL at ScaleCorp.",
    })),
  },
}));

vi.mock("@/dal/matching", () => ({
  matchingDAL: {
    getCandidateProfile: vi.fn(async (userId: string) => ({
      skills: ["TypeScript", "Node.js", "PostgreSQL"],
      experienceLevel: "MID",
      targetRole: "Full Stack Engineer",
    })),
    getJobById: vi.fn(async (jobId: string) => ({
      id: jobId,
      title: "Senior Backend Engineer",
      description: "Requires Golang, Kubernetes, Docker, and distributed caching.",
      company: { name: "Stripe" },
    })),
    mapJobToMatchingInput: vi.fn(() => ({
      requiredSkills: ["Golang", "Kubernetes"],
      preferredSkills: ["Docker"],
    })),
  },
}));

vi.mock("@/services/resume-analysis/resume-job-service", () => ({
  resumeJobService: {
    analyzeResumeAgainstJob: vi.fn().mockResolvedValue({
      criticalGaps: [{ skillName: "Golang" }],
    }),
  },
}));

// 3. Mock AI Client for deterministic test execution
vi.mock("@/services/ai/ai-client", () => ({
  aiClient: {
    generateStructuredOutput: vi.fn(async ({ prompt }) => {
      // Mock question generation
      if (prompt.includes("GENERATION REQUEST")) {
        return {
          questions: [
            {
              content: "Explain your experience optimizing PostgreSQL queries in your past role.",
              category: "TECHNICAL",
              difficulty: "medium",
              source: "RESUME",
            },
            {
              content: "How would you design a distributed caching layer using Redis?",
              category: "SYSTEM_DESIGN",
              difficulty: "medium",
              source: "JOB",
            },
          ],
        };
      }

      // Mock answer evaluation & follow-up
      if (prompt.includes("CANDIDATE")) {
        // If candidate mentions "depth-0-answer", simulate follow-up
        if (prompt.includes("depth-0-answer")) {
          return {
            evaluation: {
              relevance: "Directly answers the prompt.",
              technicalCorrectness: "Accurate query planner explanation.",
              depth: "MODERATE",
              clarity: "Clear",
              completeness: "Covers indexes.",
              score: 85,
              strengths: ["Clear indexing understanding"],
              missingConcepts: ["Explain query execution plan trade-offs"],
              improvementSuggestions: ["Mention EXPLAIN ANALYZE"],
            },
            shouldAskFollowUp: true,
            followUpQuestion: "What specific metric in EXPLAIN ANALYZE would you inspect first?",
          };
        }

        // If candidate answers follow-up 1
        if (prompt.includes("depth-1-answer")) {
          return {
            evaluation: {
              relevance: "Good mention of buffer hits.",
              technicalCorrectness: "Correct buffer analysis.",
              depth: "DEEP",
              clarity: "Concise",
              completeness: "High",
              score: 90,
              strengths: ["Buffer cache knowledge"],
              missingConcepts: [],
              improvementSuggestions: [],
            },
            shouldAskFollowUp: true,
            followUpQuestion: "How do you mitigate cache thrashing under high concurrency?",
          };
        }

        // Depth 2 answer: engine should not ask follow up
        return {
          evaluation: {
            relevance: "Strong architecture answer.",
            technicalCorrectness: "Solid cache eviction policies.",
            depth: "DEEP",
            clarity: "Comprehensive",
            completeness: "Complete",
            score: 95,
            strengths: ["Eviction policies mastery"],
            missingConcepts: [],
            improvementSuggestions: [],
          },
          shouldAskFollowUp: false,
          followUpQuestion: null,
        };
      }

      return {};
    }),
  },
}));

import { interviewService } from "@/services/interview/interview-service";
import { interviewDAL } from "@/dal/interview";
import { InterviewType, InterviewStatus } from "@prisma/client";
import { startInterviewSessionSchema } from "@/lib/validators/interview";

describe("AI Mock Interview Lifecycle & Follow-up Depth Engine", () => {
  beforeEach(() => {
    mockSessions = [];
    mockQuestions = [];
    mockAnswers = [];
    mockFollowUps = [];
    mockFeedback = [];
    idCounter = 1;
    vi.clearAllMocks();
  });

  describe("Setup & Mode Validation", () => {
    it("validates RESUME mode without requiring a jobId", () => {
      const parsed = startInterviewSessionSchema.safeParse({
        mode: "RESUME",
        questionCount: 5,
        difficulty: "medium",
      });
      expect(parsed.success).toBe(true);
    });

    it("requires jobId when mode is JOB", () => {
      const parsedWithoutJob = startInterviewSessionSchema.safeParse({
        mode: "JOB",
      });
      expect(parsedWithoutJob.success).toBe(false);

      const parsedWithJob = startInterviewSessionSchema.safeParse({
        mode: "JOB",
        jobId: "job-stripe-1",
      });
      expect(parsedWithJob.success).toBe(true);
    });

    it("validates MIXED mode allowing optional jobId", () => {
      const parsed = startInterviewSessionSchema.safeParse({
        mode: "MIXED",
        jobId: "job-stripe-1",
        questionCount: 8,
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe("Session Creation & Factual Separation", () => {
    it("creates a RESUME session with audited verified facts", async () => {
      const session = await interviewService.startSession({
        userId: "user-1",
        type: InterviewType.RESUME_BASED,
        questionCount: 2,
        difficulty: "medium",
      });

      expect(session).not.toBeNull();
      expect(session!.type).toBe(InterviewType.RESUME_BASED);
      expect(session!.status).toBe(InterviewStatus.IN_PROGRESS);
      expect(session!.questions).toHaveLength(2);
      expect(session!.questions[0].orderIndex).toBe(1);
    });

    it("creates a JOB session requiring jobId and incorporating job skills", async () => {
      const session = await interviewService.startSession({
        userId: "user-1",
        type: InterviewType.JOB_BASED,
        jobId: "job-stripe-1",
        questionCount: 2,
      });

      expect(session).not.toBeNull();
      expect(session!.type).toBe(InterviewType.JOB_BASED);
      expect(session!.jobId).toBe("job-stripe-1");
      expect(session!.jobTitle).toBe("Senior Backend Engineer");
    });
  });

  describe("Follow-Up Depth 0 → 1 → 2 Lifecycle & Boundaries", () => {
    it("progresses through primary answer → follow-up 1 → follow-up 2 and strictly stops at depth 2 without auto-completing session", async () => {
      // 1. Start Session
      const session = await interviewService.startSession({
        userId: "user-1",
        type: InterviewType.RESUME_BASED,
        questionCount: 2,
      });

      const q1 = session!.questions[0];

      // 2. Submit primary answer (Depth 0)
      const primaryRes = await interviewService.submitAnswer({
        sessionId: session!.id,
        userId: "user-1",
        questionId: q1.id,
        answerText: "depth-0-answer: I used B-Tree indexes on foreign keys in PostgreSQL.",
        isFollowUp: false,
      });

      expect(primaryRes).not.toBeNull();
      expect(primaryRes!.evaluation.score).toBe(85);
      expect(primaryRes!.newFollowUp).toBeTruthy(); // Follow-up 1 generated!

      // Session detail check
      let currentSession = await interviewService.getSessionDetail(session!.id, "user-1");
      let updatedQ1 = currentSession!.questions[0];
      expect(updatedQ1.answer).not.toBeNull();
      expect(updatedQ1.followUps).toHaveLength(1);
      expect(updatedQ1.followUps[0].orderIndex).toBe(1);
      expect(currentSession!.status).toBe(InterviewStatus.IN_PROGRESS); // Did not complete!

      // 3. Submit follow-up 1 answer (Depth 1)
      const fu1 = updatedQ1.followUps[0];
      const fu1Res = await interviewService.submitAnswer({
        sessionId: session!.id,
        userId: "user-1",
        questionId: q1.id,
        answerText: "depth-1-answer: I inspect shared hit blocks and execution time.",
        isFollowUp: true,
        followUpId: fu1.id,
      });

      expect(fu1Res).not.toBeNull();
      expect(fu1Res!.evaluation.score).toBe(90);
      expect(fu1Res!.newFollowUp).toBeTruthy(); // Follow-up 2 generated!

      currentSession = await interviewService.getSessionDetail(session!.id, "user-1");
      updatedQ1 = currentSession!.questions[0];
      expect(updatedQ1.followUps).toHaveLength(2);
      expect(updatedQ1.followUps[1].orderIndex).toBe(2);
      expect(currentSession!.status).toBe(InterviewStatus.IN_PROGRESS); // Still in progress!

      // 4. Submit follow-up 2 answer (Depth 2 - Max Depth)
      const fu2 = updatedQ1.followUps[1];
      const fu2Res = await interviewService.submitAnswer({
        sessionId: session!.id,
        userId: "user-1",
        questionId: q1.id,
        answerText: "depth-2-answer: We applied LRU eviction with rate limits.",
        isFollowUp: true,
        followUpId: fu2.id,
      });

      expect(fu2Res).not.toBeNull();
      // NO more follow-ups beyond depth 2!
      expect(fu2Res!.newFollowUp).toBeNull();

      currentSession = await interviewService.getSessionDetail(session!.id, "user-1");
      updatedQ1 = currentSession!.questions[0];
      expect(updatedQ1.followUps).toHaveLength(2); // Capped strictly at 2

      // CRITICAL: Reaching depth 2 does NOT complete the session!
      expect(currentSession!.status).toBe(InterviewStatus.IN_PROGRESS);
    });
  });

  describe("Duplicate Submission Protection", () => {
    it("prevents duplicate answer submission for the same primary question", async () => {
      const session = await interviewService.startSession({
        userId: "user-1",
        type: InterviewType.RESUME_BASED,
      });

      const q1 = session!.questions[0];

      await interviewService.submitAnswer({
        sessionId: session!.id,
        userId: "user-1",
        questionId: q1.id,
        answerText: "Initial solid answer to the question.",
      });

      // Try re-submitting to the same question
      await expect(
        interviewService.submitAnswer({
          sessionId: session!.id,
          userId: "user-1",
          questionId: q1.id,
          answerText: "Attempting duplicate answer.",
        })
      ).rejects.toThrow(/already been answered/i);
    });
  });

  describe("Session Completion & Feedback Scorecard Persistence", () => {
    it("completes interview, generates diagnostic scores, and persists to InterviewFeedback model", async () => {
      const session = await interviewService.startSession({
        userId: "user-1",
        type: InterviewType.RESUME_BASED,
      });

      const q1 = session!.questions[0];

      await interviewService.submitAnswer({
        sessionId: session!.id,
        userId: "user-1",
        questionId: q1.id,
        answerText: "depth-0-answer: Detailed answer covering indexes and architecture.",
      });

      // Complete session
      const completedSession = await interviewService.completeSession(session!.id, "user-1");

      expect(completedSession!.status).toBe(InterviewStatus.COMPLETED);
      expect(completedSession!.overallScore).toBeGreaterThanOrEqual(70);
      expect(completedSession!.feedback).not.toBeNull();

      // Verify InterviewFeedback model persistence in DAL
      const feedbackRecord = await interviewDAL.getInterviewFeedback(session!.id, "user-1");
      expect(feedbackRecord).not.toBeNull();
      expect(feedbackRecord!.overallScore).toBe(completedSession!.overallScore);
      expect(feedbackRecord!.strengths).toBeTruthy();
    });
  });

  describe("Security & Ownership", () => {
    it("prevents User B from submitting answers to User A's session", async () => {
      const sessionA = await interviewService.startSession({
        userId: "user-A",
        type: InterviewType.RESUME_BASED,
      });

      const result = await interviewService.submitAnswer({
        sessionId: sessionA!.id,
        userId: "user-B",
        questionId: sessionA!.questions[0].id,
        answerText: "Unauthorized answer from attacker.",
      });

      expect(result).toBeNull();
    });

    it("prevents User B from viewing User A's feedback scorecard", async () => {
      const sessionA = await interviewService.startSession({
        userId: "user-A",
        type: InterviewType.RESUME_BASED,
      });

      await interviewService.completeSession(sessionA!.id, "user-A");

      const feedback = await interviewDAL.getInterviewFeedback(sessionA!.id, "user-B");
      expect(feedback).toBeNull();
    });
  });
});
