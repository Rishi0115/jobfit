"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { DSAProgressOverview } from "@/types/dsa";
import { CheckCircle2, Clock, AlertCircle, Award } from "lucide-react";

export interface DSAProgressOverviewProps {
  overview: DSAProgressOverview;
}

export function DSAProgressOverviewCard({ overview }: DSAProgressOverviewProps) {
  const {
    totalQuestions,
    solvedCount,
    attemptedCount,
    incorrectCount,
    overallPercentage,
    difficultyProgress,
  } = overview;

  return (
    <Card className="border-gray-200 shadow-2xs">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary-600" />
            DSA Mastery Overview
          </CardTitle>
          <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
            {overallPercentage}% Completed
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">
        {/* Overall Progress Bar */}
        <div className="space-y-1.5">
          <Progress value={overallPercentage} className="h-2.5 bg-gray-100" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {solvedCount} of {totalQuestions} problems solved
            </span>
            <span>{totalQuestions - solvedCount} remaining</span>
          </div>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-emerald-900 block">
                {solvedCount}
              </span>
              <span className="text-[11px] text-emerald-700">Solved</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-amber-900 block">
                {attemptedCount}
              </span>
              <span className="text-[11px] text-amber-700">Attempted</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-rose-900 block">
                {incorrectCount}
              </span>
              <span className="text-[11px] text-rose-700">Needs Review</span>
            </div>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
            Difficulty Distribution
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {difficultyProgress.map((d) => (
              <div
                key={d.difficulty}
                className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/60 space-y-1.5"
              >
                <div className="flex justify-between items-center">
                  <Badge
                    variant={
                      d.difficulty === "EASY"
                        ? "default"
                        : d.difficulty === "MEDIUM"
                        ? "warning"
                        : "destructive"
                    }
                    className="text-[10px] py-0 px-1.5 uppercase font-bold"
                  >
                    {d.difficulty}
                  </Badge>
                  <span className="text-gray-600 text-[11px]">
                    {d.solved}/{d.total}
                  </span>
                </div>
                <Progress value={d.percentage} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
