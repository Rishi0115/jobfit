"use client";

import React from "react";
import Link from "next/link";
import type { InterviewSessionDetail } from "@/types/interview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Briefcase,
  LayoutDashboard,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ScorecardProps {
  session: InterviewSessionDetail;
  feedback: {
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    detailedFeedback?: string | null;
  };
}

export function MockInterviewScorecard({ session, feedback }: ScorecardProps) {
  const {
    overallScore,
    technicalScore,
    communicationScore,
    strengths = [],
    weaknesses = [],
    suggestions = [],
    detailedFeedback,
  } = feedback;

  const getScoreVariant = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Hero Score Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Mock Interview Scorecard
            </span>
          </div>
          <h2 className="text-2xl font-black text-gray-900">
            {overallScore >= 80
              ? "Outstanding Performance!"
              : overallScore >= 60
              ? "Good Effort — Ready to Level Up"
              : "Foundation Building Stage"}
          </h2>
          <p className="text-xs text-gray-500">
            Completed on {formatDate(session.completedAt || new Date())} •{" "}
            {session.questions.length} questions evaluated with dynamic follow-ups.
          </p>
        </div>

        {/* Triple Metric Rings */}
        <div className="flex items-center gap-4">
          <div
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${getScoreVariant(
              overallScore
            )} min-w-[90px]`}
          >
            <span className="text-2xl font-black">{overallScore}%</span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
              Overall
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-gray-200 bg-gray-50 min-w-[90px]">
            <span className="text-2xl font-bold text-gray-800">
              {technicalScore}%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-0.5">
              Technical
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-gray-200 bg-gray-50 min-w-[90px]">
            <span className="text-2xl font-bold text-gray-800">
              {communicationScore}%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-0.5">
              Clarity
            </span>
          </div>
        </div>
      </div>

      {/* 2. Strengths, Weaknesses, Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Strengths */}
        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {strengths.length > 0 ? (
              <ul className="space-y-2 text-xs text-emerald-950">
                {strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 italic">Solid baseline demonstrated.</p>
            )}
          </CardContent>
        </Card>

        {/* Improvement Areas */}
        <Card className="border-amber-200 bg-amber-50/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {weaknesses.length > 0 ? (
              <ul className="space-y-2 text-xs text-amber-950">
                {weaknesses.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 italic">No critical missing concepts.</p>
            )}
          </CardContent>
        </Card>

        {/* Actionable Recommendations */}
        <Card className="border-blue-200 bg-blue-50/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Lightbulb className="h-4 w-4 text-blue-600" /> Action Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {suggestions.length > 0 ? (
              <ul className="space-y-2 text-xs text-blue-950">
                {suggestions.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 italic">Keep maintaining technical depth.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Diagnostic Feedback */}
      {detailedFeedback && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary-600" /> Diagnostic Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-gray-700 leading-relaxed">
            {detailedFeedback}
          </CardContent>
        </Card>
      )}

      {/* 3. Question-by-Question Review */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
          Question-by-Question Breakdown
        </h3>

        {session.questions.map((q, idx) => (
          <Card key={q.id} className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50/60 py-3 px-5 border-b border-gray-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">
                  Q{idx + 1}:
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {q.category}
                </Badge>
                {q.difficulty && (
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {q.difficulty}
                  </Badge>
                )}
              </div>

              {q.answer?.evaluation?.score != null && (
                <Badge variant="success" className="text-xs">
                  Score: {q.answer.evaluation.score}/100
                </Badge>
              )}
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-900">
                {q.content}
              </p>

              {/* Candidate's Answer */}
              {q.answer && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-800">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Your Response:
                  </p>
                  <p className="whitespace-pre-wrap">{q.answer.content}</p>
                </div>
              )}

              {/* Dynamic Follow-Ups for this question */}
              {q.followUps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                    Follow-Up Probes ({q.followUps.length})
                  </span>
                  {q.followUps.map((f, fIdx) => (
                    <div
                      key={f.id}
                      className="p-3 bg-purple-50/40 rounded-xl border border-purple-100 text-xs space-y-1.5"
                    >
                      <p className="font-semibold text-purple-950">
                        Probe #{fIdx + 1}: {f.content}
                      </p>
                      {f.answer && (
                        <p className="text-gray-700 pl-2 border-l-2 border-purple-300">
                          <strong>Answer:</strong> {f.answer}
                        </p>
                      )}
                      {f.evaluation?.score != null && (
                        <span className="text-[10px] font-bold text-purple-700 block">
                          Follow-up Score: {f.evaluation.score}/100
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4. Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200">
        <Link href="/dashboard" className="w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            leftIcon={<LayoutDashboard className="h-4 w-4" />}
          >
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/student/jobs" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              leftIcon={<Briefcase className="h-4 w-4" />}
            >
              Explore Matching Jobs
            </Button>
          </Link>

          <Link href="/student/mock-interview/setup" className="w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto"
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Start Another Interview
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
