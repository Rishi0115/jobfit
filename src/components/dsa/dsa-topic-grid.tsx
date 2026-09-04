"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DSATopicProgress, DSATopicId } from "@/types/dsa";
import { Code2 } from "lucide-react";

export interface DSATopicGridProps {
  topics: DSATopicProgress[];
  selectedTopic: DSATopicId | "all";
  onSelectTopic: (topic: DSATopicId | "all") => void;
}

export function DSATopicGrid({
  topics,
  selectedTopic,
  onSelectTopic,
}: DSATopicGridProps) {
  return (
    <Card className="border-gray-200 shadow-2xs">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary-600" />
          DSA Topics & Progress
        </CardTitle>
        {selectedTopic !== "all" && (
          <button
            onClick={() => onSelectTopic("all")}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium"
          >
            Clear Filter (Show All)
          </button>
        )}
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {topics.map((t) => {
            const isSelected = selectedTopic === t.topicId;
            return (
              <button
                key={t.topicId}
                onClick={() =>
                  onSelectTopic(isSelected ? "all" : t.topicId)
                }
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary-500 bg-primary-50/50 shadow-2xs ring-1 ring-primary-500"
                    : "border-gray-100 bg-gray-50/50 hover:bg-gray-100/70"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-900 truncate">
                    {t.topicName}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
                  <span>
                    {t.solved}/{t.total}
                  </span>
                  <span className="font-semibold">{t.percentage}%</span>
                </div>
                <Progress value={t.percentage} className="h-1 bg-gray-200" />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
