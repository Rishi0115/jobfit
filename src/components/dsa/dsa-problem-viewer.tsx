"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { updateDSAProgressAction } from "@/actions/dsa";
import type { DSAQuestionItem } from "@/types/dsa";
import { DSAStatus } from "@prisma/client";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  Code2,
  Check,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export interface DSAProblemViewerProps {
  question: DSAQuestionItem;
}

export function DSAProblemViewer({ question }: DSAProblemViewerProps) {
  const router = useRouter();

  const [approachText, setApproachText] = React.useState(
    question.userProgress?.userApproach || ""
  );
  const [currentStatus, setCurrentStatus] = React.useState<DSAStatus>(
    question.userProgress?.status || DSAStatus.NOT_ATTEMPTED
  );
  const [attempts, setAttempts] = React.useState(
    question.userProgress?.attempts || 0
  );

  const [visibleHints, setVisibleHints] = React.useState<Set<number>>(
    new Set()
  );
  const [showSolution, setShowSolution] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [feedbackMsg, setFeedbackMsg] = React.useState<string | null>(null);

  const toggleHint = (index: number) => {
    setVisibleHints((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleUpdateStatus = async (status: DSAStatus) => {
    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      const resp = await updateDSAProgressAction({
        questionId: question.id,
        status,
        userApproach: approachText,
      });

      if (resp.success && resp.data) {
        setCurrentStatus(resp.data.status);
        setAttempts(resp.data.attempts);
        setFeedbackMsg(
          status === DSAStatus.SOLVED
            ? "Problem marked as Solved! Excellent work."
            : status === DSAStatus.INCORRECT
            ? "Marked for review. You can revisit this question anytime."
            : "Attempt saved."
        );
        router.refresh();
      } else {
        setFeedbackMsg("Failed to update progress.");
      }
    } catch {
      setFeedbackMsg("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <Link href="/dsa">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Problem Bank
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Attempts: <strong className="text-gray-900 font-mono">{attempts}</strong>
          </span>
          {currentStatus === DSAStatus.SOLVED ? (
            <Badge variant="default" className="bg-emerald-600 text-xs py-1 px-2.5 gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Solved
            </Badge>
          ) : currentStatus === DSAStatus.INCORRECT ? (
            <Badge variant="destructive" className="text-xs py-1 px-2.5 gap-1">
              <AlertCircle className="h-3.5 w-3.5" /> Needs Review
            </Badge>
          ) : currentStatus === DSAStatus.ATTEMPTED ? (
            <Badge variant="warning" className="text-xs py-1 px-2.5 gap-1">
              <Clock className="h-3.5 w-3.5" /> In Progress
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Main Problem Card */}
      <Card className="border-gray-200 shadow-2xs">
        <CardHeader className="p-6 pb-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge
                  variant={
                    question.difficulty === "EASY"
                      ? "default"
                      : question.difficulty === "MEDIUM"
                      ? "warning"
                      : "destructive"
                  }
                  className="text-[10px] font-bold py-0.5 px-2 uppercase"
                >
                  {question.difficulty}
                </Badge>
                <Badge variant="outline" className="text-xs font-medium">
                  {question.topic}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                {question.title}
              </CardTitle>
            </div>
            {question.timeComplexity && (
              <div className="text-right text-xs text-gray-500 space-y-0.5 font-mono">
                <div>Time: {question.timeComplexity}</div>
                <div>Space: {question.spaceComplexity}</div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* External Practice Links */}
          {question.practiceLinks && question.practiceLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
              <span className="text-xs font-semibold text-gray-500 mr-1">
                Practice on Verified Platforms:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {question.practiceLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-800 hover:text-primary-700 hover:border-primary-300 hover:bg-primary-50/40 transition-all shadow-2xs group"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-primary-600 group-hover:translate-x-0.5 transition-transform" />
                    <span>
                      Practice on{" "}
                      {link.platform === "LEETCODE"
                        ? "LeetCode"
                        : link.platform === "INTERVIEWBIT"
                        ? "InterviewBit"
                        : link.platform === "CODEFORCES"
                        ? "Codeforces"
                        : "HackerRank"}
                    </span>
                    <span className="text-gray-400 text-[10px]">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Problem Statement */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Problem Description
            </h4>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-800 leading-relaxed whitespace-pre-line font-sans">
              {question.problemStatement}
            </div>
          </div>

          {/* Hints Section */}
          {question.hints && question.hints.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-amber-500" />
                Hints ({question.hints.length})
              </h4>
              <div className="space-y-2">
                {question.hints.map((hint, idx) => {
                  const isVisible = visibleHints.has(idx);
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-xs"
                    >
                      <button
                        onClick={() => toggleHint(idx)}
                        className="flex items-center justify-between w-full font-semibold text-amber-900 cursor-pointer"
                      >
                        <span>Hint {idx + 1}</span>
                        {isVisible ? (
                          <ChevronUp className="h-3.5 w-3.5 text-amber-700" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-amber-700" />
                        )}
                      </button>
                      {isVisible && (
                        <p className="mt-2 text-amber-900/90 leading-relaxed border-t border-amber-200/60 pt-2">
                          {hint}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* User Approach Workspace */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="h-4 w-4 text-primary-600" />
              Your Solution Approach / Notes
            </h4>
            <textarea
              value={approachText}
              onChange={(e) => setApproachText(e.target.value)}
              placeholder="Outline your approach, algorithmic logic, time/space complexity, or paste your implementation code..."
              rows={6}
              className="w-full rounded-xl border border-gray-200 bg-white p-3.5 text-xs font-mono text-gray-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Status Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleUpdateStatus(DSAStatus.SOLVED)}
                isLoading={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                leftIcon={<Check className="h-4 w-4" />}
              >
                Mark as Solved
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus(DSAStatus.ATTEMPTED)}
                isLoading={isSaving}
              >
                Save Draft
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateStatus(DSAStatus.INCORRECT)}
                isLoading={isSaving}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Needs Review
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSolution(!showSolution)}
              leftIcon={
                showSolution ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )
              }
            >
              {showSolution ? "Hide Solution" : "Reveal Solution"}
            </Button>
          </div>

          {/* Feedback alert */}
          {feedbackMsg && (
            <Alert variant="default" className="bg-primary-50 border-primary-200 text-primary-900">
              <AlertDescription className="text-xs font-medium">
                {feedbackMsg}
              </AlertDescription>
            </Alert>
          )}

          {/* Solution & Expected Approach */}
          {showSolution && (
            <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in duration-200">
              {question.expectedApproach && (
                <div className="p-4 rounded-xl bg-primary-50/40 border border-primary-100 space-y-1">
                  <span className="text-xs font-bold text-primary-900 block">
                    Expected Approach:
                  </span>
                  <p className="text-xs text-primary-950 leading-relaxed">
                    {question.expectedApproach}
                  </p>
                </div>
              )}

              {question.solution && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Reference Implementation
                  </span>
                  <pre className="p-4 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto">
                    <code>{question.solution}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
