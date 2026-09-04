"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InterviewFeedbackSummary } from "@/types/interview";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export interface InterviewFeedbackModalProps {
  feedback: InterviewFeedbackSummary;
  sessionId: string;
  onClose?: () => void;
}

export function InterviewFeedbackModal({
  feedback,
  onClose,
}: InterviewFeedbackModalProps) {
  const {
    overallScore,
    technicalScore,
    communicationScore,
    strengths,
    weaknesses,
    suggestions,
    detailedFeedback,
  } = feedback;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <Card className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        <CardHeader className="p-6 pb-4 bg-linear-to-r from-primary-50/70 via-white to-primary-50/40 border-b border-gray-100 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 mb-2">
            <Award className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold text-gray-900">
            Interview Session Completed!
          </CardTitle>
          <p className="text-xs text-gray-500">
            Advisory feedback based on your responses, technical depth, and communication clarity.
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Score Pills */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-primary-50/50 border border-primary-100">
              <span className="text-2xl font-black text-primary-700 block">
                {overallScore}%
              </span>
              <span className="text-[11px] font-bold text-primary-900 uppercase tracking-wider">
                Overall Score
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-2xl font-black text-emerald-700 block">
                {technicalScore}%
              </span>
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                Technical Depth
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
              <span className="text-2xl font-black text-indigo-700 block">
                {communicationScore}%
              </span>
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                Communication
              </span>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {strengths.length > 0 && (
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-2">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Key Strengths
                </span>
                <ul className="list-disc list-inside space-y-1 text-emerald-950">
                  {strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {weaknesses.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 space-y-2">
                <span className="font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <AlertCircle className="h-4 w-4 text-amber-600" /> Missing Concepts
                </span>
                <ul className="list-disc list-inside space-y-1 text-amber-950">
                  {weaknesses.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Improvement Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-4 rounded-xl border border-primary-100 bg-primary-50/30 space-y-2 text-xs">
              <span className="font-bold text-primary-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Lightbulb className="h-4 w-4 text-primary-700" /> Actionable Recommendations
              </span>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {suggestions.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {detailedFeedback && (
            <p className="text-xs text-gray-500 italic text-center">
              &ldquo;{detailedFeedback}&rdquo;
            </p>
          )}

          {/* Modal Actions */}
          <div className="pt-2 flex justify-end gap-2">
            <Link href="/interview">
              <Button
                variant="default"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Back to Interview Hub
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
