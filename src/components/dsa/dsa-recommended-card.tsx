"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DSARecommendedQuestion } from "@/types/dsa";
import { Sparkles, ArrowRight, Target, AlertCircle, Compass } from "lucide-react";

export interface DSARecommendedCardProps {
  recommendation: DSARecommendedQuestion | null;
}

export function DSARecommendedCard({
  recommendation,
}: DSARecommendedCardProps) {
  if (!recommendation) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/30 p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-950">
              DSA Question Bank Completed!
            </h4>
            <p className="text-xs text-emerald-700">
              You have solved all available algorithmic questions. Great job!
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const { question, rationale, reasonCategory } = recommendation;

  const getCategoryIcon = () => {
    switch (reasonCategory) {
      case "TARGET_JOB_CORE":
        return <Target className="h-4 w-4 text-primary-600" />;
      case "SKILL_GAP":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <Compass className="h-4 w-4 text-indigo-600" />;
    }
  };

  return (
    <Card className="border-primary-200 bg-linear-to-br from-primary-50/50 via-white to-primary-50/20 shadow-2xs relative overflow-hidden">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
            {getCategoryIcon()}
          </div>
          <CardTitle className="text-xs font-bold text-primary-900 uppercase tracking-wider">
            Recommended Next Question
          </CardTitle>
        </div>
        <Badge
          variant={
            question.difficulty === "EASY"
              ? "default"
              : question.difficulty === "MEDIUM"
              ? "warning"
              : "destructive"
          }
          className="text-[10px] font-bold py-0.5 px-2"
        >
          {question.difficulty}
        </Badge>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 leading-snug">
            {question.title}
          </h3>
          <p className="text-xs text-primary-800 font-medium mt-1">
            {rationale}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-primary-100/60">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Topic:</span>
            <Badge variant="outline" className="text-xs bg-white">
              {question.topic}
            </Badge>
          </div>
          <Link href={`/dsa/${question.id}`}>
            <Button
              size="sm"
              variant="default"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Solve Problem
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
