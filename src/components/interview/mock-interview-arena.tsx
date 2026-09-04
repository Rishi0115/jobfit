"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { InterviewSessionDetail, InterviewQuestionItem } from "@/types/interview";
import {
  submitInterviewAnswerAction,
  completeInterviewSessionAction,
} from "@/actions/interview";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Send,
  MessageSquare,
  ThumbsUp,
  Lightbulb,
  XCircle,
  Flag,
} from "lucide-react";

interface MockInterviewArenaProps {
  initialSession: InterviewSessionDetail;
}

export function MockInterviewArena({ initialSession }: MockInterviewArenaProps) {
  const router = useRouter();
  const [session, setSession] = useState<InterviewSessionDetail>(initialSession);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answerInput, setAnswerInput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const [isCompleting, startCompletingTransition] = useTransition();

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const questions = session.questions;
  const currentQuestion: InterviewQuestionItem | undefined =
    questions[currentQuestionIndex];

  // Determine what is currently pending an answer for the active question:
  // Case A: Primary question not yet answered
  const primaryAnswered = Boolean(currentQuestion?.answer);

  // Case B: Unanswered follow-up question
  const pendingFollowUp = currentQuestion?.followUps.find((f) => !f.answer);

  // Case C: Question fully answered (primary is answered and no pending follow-up)
  const isCurrentQuestionFinished = primaryAnswered && !pendingFollowUp;

  // Active prompt details
  const activePromptText = pendingFollowUp
    ? pendingFollowUp.content
    : currentQuestion?.content || "";

  const isFollowUpPrompt = Boolean(pendingFollowUp);

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !answerInput.trim() || isPending) return;
    setErrorMessage(null);

    const isFollowUp = Boolean(pendingFollowUp);
    const followUpId = pendingFollowUp?.id;

    startTransition(async () => {
      const res = await submitInterviewAnswerAction({
        sessionId: session.id,
        questionId: currentQuestion.id,
        answerText: answerInput.trim(),
        isFollowUp,
        followUpId,
      });

      if (!res.success || !res.data) {
        if (typeof res.error === "object") {
          const first = Object.values(res.error).flat()[0];
          setErrorMessage(first || "Failed to submit answer.");
        } else {
          setErrorMessage(res.error || "Failed to submit answer.");
        }
        return;
      }

      setSession(res.data.session);
      setAnswerInput("");
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setAnswerInput("");
      setErrorMessage(null);
    }
  };

  const handleCompleteInterview = () => {
    setErrorMessage(null);
    startCompletingTransition(async () => {
      const res = await completeInterviewSessionAction(session.id);
      if (!res.success) {
        setErrorMessage(
          typeof res.error === "string"
            ? res.error
            : "Failed to finalize session scorecard."
        );
        return;
      }
      router.push(`/student/mock-interview/${session.id}/feedback`);
    });
  };

  if (!currentQuestion) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
        <p className="text-sm font-semibold text-gray-900">
          No questions available in this session.
        </p>
      </div>
    );
  }

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header Bar: Progress, Timer & Mode Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">
                Question {currentQuestionIndex + 1} of {questions.length}
              </h2>
              <Badge variant="secondary" className="text-[10px] uppercase">
                {session.type.replace("_", " ")}
              </Badge>
            </div>
            {session.jobTitle && (
              <p className="text-xs text-gray-500 mt-0.5">
                Target Role: <strong>{session.jobTitle}</strong>
                {session.companyName && ` at ${session.companyName}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span>{formatTimer(secondsElapsed)}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to exit? Your progress so far will be saved."
                )
              ) {
                router.push("/dashboard");
              }
            }}
            className="text-xs"
          >
            Exit
          </Button>
        </div>
      </div>

      {/* Progress Dots Bar */}
      <div className="flex items-center gap-1.5">
        {questions.map((q, idx) => {
          const isDone = Boolean(q.answer);
          const isCurrent = idx === currentQuestionIndex;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`h-2 flex-1 rounded-full transition-all ${
                isCurrent
                  ? "bg-primary-600"
                  : isDone
                  ? "bg-emerald-400"
                  : "bg-gray-200"
              }`}
              title={`Question ${idx + 1}`}
            />
          );
        })}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Primary Question Card */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3 px-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Primary Question {currentQuestion.orderIndex}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {currentQuestion.category}
            </Badge>
            {currentQuestion.difficulty && (
              <Badge variant="secondary" className="text-[10px] capitalize">
                {currentQuestion.difficulty}
              </Badge>
            )}
          </div>

          {primaryAnswered && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Answered
            </span>
          )}
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-900 leading-relaxed">
            {currentQuestion.content}
          </h3>

          {/* Primary Answer & Evaluation Display if answered */}
          {currentQuestion.answer && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Your Answer:
                </p>
                <p className="text-xs text-gray-800 whitespace-pre-wrap">
                  {currentQuestion.answer.content}
                </p>
              </div>

              {/* Advisory Evaluation Feedback */}
              {currentQuestion.answer.evaluation && (
                <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      AI Advisory Evaluation
                    </span>
                    <Badge variant="success" className="text-xs font-bold">
                      Score: {currentQuestion.answer.evaluation.score ?? 80}/100
                    </Badge>
                  </div>

                  {currentQuestion.answer.evaluation.strengths?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 mb-1">
                        <ThumbsUp className="h-3 w-3" /> Key Strengths:
                      </p>
                      <ul className="text-xs text-emerald-950 list-disc list-inside space-y-0.5">
                        {currentQuestion.answer.evaluation.strengths.map(
                          (s: string, i: number) => (
                            <li key={i}>{s}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {currentQuestion.answer.evaluation.missingConcepts?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-amber-800 flex items-center gap-1 mb-1">
                        <Lightbulb className="h-3 w-3" /> Concepts to Clarify:
                      </p>
                      <ul className="text-xs text-amber-950 list-disc list-inside space-y-0.5">
                        {currentQuestion.answer.evaluation.missingConcepts.map(
                          (m: string, i: number) => (
                            <li key={i}>{m}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Follow-Up Questions (Depth 1 & Depth 2) */}
      {currentQuestion.followUps.length > 0 && (
        <div className="space-y-4">
          {currentQuestion.followUps.map((f, fIdx) => (
            <Card key={f.id} className="border-purple-200 bg-purple-50/20 shadow-sm">
              <CardHeader className="py-2.5 px-5 bg-purple-50/50 border-b border-purple-100 flex flex-row items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  Dynamic Follow-up Probe #{fIdx + 1} (Depth {fIdx + 1}/2)
                </span>
                {f.answer && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Answered
                  </span>
                )}
              </CardHeader>

              <CardContent className="p-5 space-y-3">
                <p className="text-sm font-semibold text-purple-950">
                  {f.content}
                </p>

                {f.answer && (
                  <div className="p-3 bg-white rounded-xl border border-purple-100 text-xs text-gray-800">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Your Response:
                    </p>
                    <p className="whitespace-pre-wrap">{f.answer}</p>
                  </div>
                )}

                {f.evaluation && (
                  <div className="p-3 bg-purple-100/50 rounded-lg text-xs text-purple-900 flex items-center justify-between">
                    <span>Follow-up Evaluation Score:</span>
                    <span className="font-bold">{f.evaluation.score ?? 80}/100</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 4. Active Answer Input Box */}
      {!isCurrentQuestionFinished ? (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-primary-600" />
                {isFollowUpPrompt
                  ? "Respond to Dynamic Follow-up Question:"
                  : "Your Technical Answer:"}
              </span>
              <span className="text-[11px] text-gray-400">
                {answerInput.length} / 4000 characters
              </span>
            </div>
            {isFollowUpPrompt && (
              <p className="text-xs font-medium text-purple-900 bg-purple-50 p-2.5 rounded-lg border border-purple-200 mt-2">
                <strong>Probe:</strong> {activePromptText}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-3">
            <textarea
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder="State your technical approach clearly. Mention trade-offs, architecture choices, and relevant technologies..."
              rows={5}
              maxLength={4000}
              className="w-full text-xs p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white resize-y"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-400">
                Tip: Technical clarity and explaining trade-offs yields higher advisory scores.
              </span>

              <Button
                onClick={handleSubmitAnswer}
                isLoading={isPending}
                disabled={answerInput.trim().length < 3 || isPending}
                size="sm"
                rightIcon={<Send className="h-3.5 w-3.5" />}
              >
                {isPending ? "Evaluating..." : "Submit Answer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* 5. Navigation & Next Question / Finish Card */
        <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Question Completed!
              </h4>
              <p className="text-xs text-emerald-800">
                All primary and follow-up probes for this question have been answered and evaluated.
              </p>
            </div>
          </div>

          {!isLastQuestion ? (
            <Button
              onClick={handleNextQuestion}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Proceed to Next Question
            </Button>
          ) : (
            <Button
              onClick={handleCompleteInterview}
              isLoading={isCompleting}
              rightIcon={<Flag className="h-4 w-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isCompleting ? "Compiling Scorecard..." : "Finish Interview & View Scorecard"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
