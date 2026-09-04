"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { InterviewFeedbackModal } from "./interview-feedback-modal";
import {
  submitInterviewAnswerAction,
  completeInterviewSessionAction,
} from "@/actions/interview";
import type {
  InterviewSessionDetail,
  InterviewQuestionItem,
  InterviewFeedbackSummary,
} from "@/types/interview";
import { InterviewStatus } from "@prisma/client";
import {
  Bot,
  User,
  Send,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export interface InterviewSessionChatProps {
  session: InterviewSessionDetail;
}

export function InterviewSessionChat({
  session: initialSession,
}: InterviewSessionChatProps) {
  const router = useRouter();
  const [session, setSession] =
    React.useState<InterviewSessionDetail>(initialSession);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [answerInput, setAnswerInput] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFinishing, setIsFinishing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Show feedback modal when session completes
  const [showFeedbackModal, setShowFeedbackModal] = React.useState(
    session.status === InterviewStatus.COMPLETED && Boolean(session.feedback)
  );

  const currentQuestion: InterviewQuestionItem | undefined =
    session.questions[currentQuestionIndex];

  // Determine if we are currently answering a follow-up or the primary question
  const pendingFollowUp = currentQuestion?.followUps.find((f) => !f.answer);

  const answeredCount = session.questions.filter((q) => Boolean(q.answer)).length;
  const progressPct =
    session.questions.length > 0
      ? Math.round((answeredCount / session.questions.length) * 100)
      : 0;

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !answerInput.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const resp = await submitInterviewAnswerAction({
        sessionId: session.id,
        questionId: currentQuestion.id,
        answerText: answerInput,
        isFollowUp: Boolean(pendingFollowUp),
        followUpId: pendingFollowUp?.id,
      });

      if (!resp.success) {
        const msg =
          typeof resp.error === "string"
            ? resp.error
            : "Failed to submit answer.";
        setError(msg);
      } else if (resp.data) {
        setSession(resp.data.session);
        setAnswerInput("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setAnswerInput("");
    }
  };

  const handleFinishSession = async () => {
    setIsFinishing(true);
    setError(null);

    try {
      const resp = await completeInterviewSessionAction(session.id);
      if (resp.success && resp.data) {
        setSession(resp.data);
        setShowFeedbackModal(true);
      } else {
        setError("Failed to complete interview session.");
      }
    } catch {
      setError("An unexpected error occurred while completing session.");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Session Progress Header */}
      <Card className="border-gray-200 shadow-2xs">
        <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-gray-900">
                  {session.jobTitle
                    ? `${session.jobTitle} Practice`
                    : "Technical Interview Practice"}
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {session.type}
                </Badge>
              </div>
              <span className="text-xs text-gray-500">
                Question {currentQuestionIndex + 1} of {session.questions.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right text-xs">
              <span className="font-semibold text-gray-900">
                {progressPct}% Completed
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFinishSession}
              isLoading={isFinishing}
              className="text-xs"
            >
              End Session
            </Button>
          </div>
        </CardHeader>
        <div className="px-4 pb-3">
          <Progress value={progressPct} className="h-1.5" />
        </div>
      </Card>

      {/* Main Conversation Stream */}
      {currentQuestion && (
        <div className="space-y-4">
          {/* Primary Question Bubble */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-xs">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1 rounded-2xl bg-white border border-gray-200 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-[10px] font-semibold text-gray-600">
                  {currentQuestion.category}
                </Badge>
                {currentQuestion.difficulty && (
                  <span className="text-[11px] text-gray-400 capitalize">
                    {currentQuestion.difficulty}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-900 font-medium leading-relaxed">
                {currentQuestion.content}
              </p>
            </div>
          </div>

          {/* User's Answer to Primary Question */}
          {currentQuestion.answer && (
            <div className="flex items-start gap-3 justify-end pl-8">
              <div className="flex-1 rounded-2xl bg-primary-50/70 border border-primary-100 p-4 shadow-2xs space-y-2 text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 block">
                  Your Response
                </span>
                <p className="text-xs text-gray-900 text-left whitespace-pre-line leading-relaxed">
                  {currentQuestion.answer.content}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
                <User className="h-5 w-5" />
              </div>
            </div>
          )}

          {/* AI Evaluation of Primary Answer */}
          {currentQuestion.answer?.evaluation && (
            <div className="ml-12 p-4 rounded-xl bg-gray-50 border border-gray-200/80 shadow-2xs space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  AI Interviewer Feedback
                </span>
                <Badge variant="default" className="text-[10px] bg-primary-700">
                  Advisory Score: {currentQuestion.answer.evaluation.score}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-gray-500 block">Technical Depth:</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {currentQuestion.answer.evaluation.depth.toLowerCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Clarity:</span>
                  <span className="font-semibold text-gray-900">
                    {currentQuestion.answer.evaluation.clarity}
                  </span>
                </div>
              </div>

              {currentQuestion.answer.evaluation.strengths.length > 0 && (
                <div className="space-y-1">
                  <span className="font-semibold text-emerald-800 block text-[11px]">
                    Strengths:
                  </span>
                  <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                    {currentQuestion.answer.evaluation.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Follow-Up Questions (if any) */}
          {currentQuestion.followUps.map((followUp, fIdx) => (
            <React.Fragment key={followUp.id}>
              {/* Follow-up question bubble */}
              <div className="flex items-start gap-3 ml-6">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1 rounded-2xl bg-amber-50/40 border border-amber-200/70 p-4 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="warning" className="text-[9px] py-0 px-1.5 uppercase font-bold">
                      Dynamic Follow-Up {fIdx + 1}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-900 font-medium leading-relaxed">
                    {followUp.content}
                  </p>
                </div>
              </div>

              {/* Follow-up answer */}
              {followUp.answer && (
                <div className="flex items-start gap-3 justify-end pl-12">
                  <div className="flex-1 rounded-2xl bg-primary-50/60 border border-primary-100 p-3.5 shadow-2xs text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 block mb-1">
                      Your Answer
                    </span>
                    <p className="text-xs text-gray-900 whitespace-pre-line leading-relaxed">
                      {followUp.answer}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              )}

              {/* Follow-up evaluation */}
              {followUp.evaluation && (
                <div className="ml-16 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-gray-700">
                    <span>Follow-Up Feedback</span>
                    <span className="text-primary-700 font-bold">
                      {followUp.evaluation.score}%
                    </span>
                  </div>
                  <p className="text-gray-600 text-[11px]">
                    {followUp.evaluation.relevance}
                  </p>
                </div>
              )}
            </React.Fragment>
          ))}

          {/* Active Input Box */}
          {(!currentQuestion.answer || pendingFollowUp) && (
            <Card className="border-primary-200 shadow-2xs p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">
                  {pendingFollowUp ? "Answer Follow-up Question:" : "Your Response:"}
                </span>
                <span className="text-[11px] text-gray-400">
                  {answerInput.length} / 4000 characters
                </span>
              </div>

              <textarea
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder={
                  pendingFollowUp
                    ? "Provide your follow-up answer explaining your decisions or trade-offs..."
                    : "Type your answer clearly, highlighting architectural decisions, implementation details, and trade-offs..."
                }
                rows={4}
                className="w-full rounded-xl border border-gray-200 p-3 text-xs text-gray-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />

              {error && (
                <span className="text-xs text-rose-600 block">{error}</span>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-gray-400">
                  Responses are evaluated for technical correctness and depth.
                </span>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleSubmitAnswer}
                  isLoading={isSubmitting}
                  disabled={answerInput.trim().length < 3}
                  rightIcon={<Send className="h-3.5 w-3.5" />}
                >
                  Submit Answer
                </Button>
              </div>
            </Card>
          )}

          {/* Move to next question when current question & followups are answered */}
          {currentQuestion.answer && !pendingFollowUp && (
            <div className="flex justify-end pt-2">
              {currentQuestionIndex < session.questions.length - 1 ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleNextQuestion}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Next Question ({currentQuestionIndex + 2} of {session.questions.length})
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleFinishSession}
                  isLoading={isFinishing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  rightIcon={<Award className="h-4 w-4" />}
                >
                  Complete & View Scorecard
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Completion Modal */}
      {showFeedbackModal && session.feedback && (
        <InterviewFeedbackModal
          feedback={session.feedback}
          sessionId={session.id}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </div>
  );
}
