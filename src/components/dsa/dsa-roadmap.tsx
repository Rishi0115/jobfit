"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { DSARoadmapStage } from "@/types/dsa";
import { Map, CheckCircle2, Lock, Flame } from "lucide-react";

export interface DSARoadmapProps {
  roadmap: DSARoadmapStage[];
}

export function DSARoadmap({ roadmap }: DSARoadmapProps) {
  return (
    <Card className="border-gray-200 shadow-2xs">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Map className="h-4 w-4 text-primary-600" />
          Progressive DSA Roadmap
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {roadmap.map((stage) => {
            const totalStageQuestions = stage.topics.reduce(
              (acc, t) => acc + t.total,
              0
            );
            const solvedStageQuestions = stage.topics.reduce(
              (acc, t) => acc + t.solved,
              0
            );
            const stagePct =
              totalStageQuestions > 0
                ? Math.round((solvedStageQuestions / totalStageQuestions) * 100)
                : 0;

            return (
              <div
                key={stage.stageNumber}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  stage.isCurrent
                    ? "border-primary-300 bg-primary-50/30 shadow-2xs ring-1 ring-primary-300"
                    : stage.isCompleted
                    ? "border-emerald-200 bg-emerald-50/20"
                    : "border-gray-200 bg-gray-50/50 opacity-80"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Stage {stage.stageNumber}
                    </span>
                    {stage.isCompleted ? (
                      <Badge variant="default" className="text-[10px] bg-emerald-600 py-0 px-1.5 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </Badge>
                    ) : stage.isCurrent ? (
                      <Badge variant="default" className="text-[10px] bg-primary-600 py-0 px-1.5 gap-1">
                        <Flame className="h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 gap-1 text-gray-400">
                        <Lock className="h-3 w-3" /> Locked
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-900 leading-snug">
                      {stage.title.replace(/^Stage \d+:\s*/, "")}
                    </h4>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                      {stage.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100/80 space-y-2">
                  <div className="flex justify-between text-[11px] font-medium text-gray-600">
                    <span>Progress</span>
                    <span>
                      {solvedStageQuestions}/{totalStageQuestions} ({stagePct}%)
                    </span>
                  </div>
                  <Progress value={stagePct} className="h-1.5" />

                  <div className="flex flex-wrap gap-1 pt-1">
                    {stage.topics.map((t) => (
                      <span
                        key={t.topicId}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          t.percentage === 100
                            ? "bg-emerald-100 text-emerald-800"
                            : t.solved > 0
                            ? "bg-primary-100 text-primary-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {t.topicName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
