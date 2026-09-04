"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DSAQuestionItem, DSATopicId, DSADifficulty } from "@/types/dsa";
import { CheckCircle2, Clock, AlertCircle, ArrowRight, Search, Filter } from "lucide-react";

export interface DSAQuestionListProps {
  questions: DSAQuestionItem[];
  selectedTopic: DSATopicId | "all";
}

export function DSAQuestionList({
  questions,
  selectedTopic,
}: DSAQuestionListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [difficultyFilter, setDifficultyFilter] = React.useState<
    DSADifficulty | "ALL"
  >("ALL");
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "SOLVED" | "ATTEMPTED" | "UNATTEMPTED"
  >("ALL");

  const filteredQuestions = React.useMemo(() => {
    return questions.filter((q) => {
      if (selectedTopic !== "all" && q.topic !== selectedTopic) return false;
      if (difficultyFilter !== "ALL" && q.difficulty !== difficultyFilter)
        return false;
      if (statusFilter === "SOLVED" && q.userProgress?.status !== "SOLVED")
        return false;
      if (
        statusFilter === "ATTEMPTED" &&
        q.userProgress?.status !== "ATTEMPTED" &&
        q.userProgress?.status !== "INCORRECT"
      )
        return false;
      if (statusFilter === "UNATTEMPTED" && q.userProgress) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          q.title.toLowerCase().includes(query) ||
          q.topic.toLowerCase().includes(query) ||
          q.tags.some((t) => t.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [questions, selectedTopic, difficultyFilter, statusFilter, searchQuery]);

  return (
    <Card className="border-gray-200 shadow-2xs">
      <CardHeader className="p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <CardTitle className="text-sm font-bold text-gray-900">
          Problem Bank ({filteredQuestions.length})
        </CardTitle>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500 w-40 sm:w-48"
            />
          </div>

          <select
            value={difficultyFilter}
            onChange={(e) =>
              setDifficultyFilter(e.target.value as DSADifficulty | "ALL")
            }
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700"
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="SOLVED">Solved</option>
            <option value="ATTEMPTED">Attempted</option>
            <option value="UNATTEMPTED">Not Attempted</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-y border-gray-100 bg-gray-50/70 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No questions found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q) => {
                  const status = q.userProgress?.status;
                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        {status === "SOLVED" ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle2 className="h-4 w-4" /> Solved
                          </span>
                        ) : status === "INCORRECT" ? (
                          <span className="flex items-center gap-1 text-rose-600 font-semibold">
                            <AlertCircle className="h-4 w-4" /> Review
                          </span>
                        ) : status === "ATTEMPTED" ? (
                          <span className="flex items-center gap-1 text-amber-600 font-semibold">
                            <Clock className="h-4 w-4" /> Attempted
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dsa/${q.id}`}
                            className="hover:text-primary-600 hover:underline"
                          >
                            {q.title}
                          </Link>
                          {q.practiceLinks && q.practiceLinks.length > 0 && (
                            <div className="hidden sm:flex items-center gap-1">
                              {q.practiceLinks.map((pl) => (
                                <span
                                  key={pl.platform}
                                  className="text-[9px] font-bold px-1 rounded bg-gray-100 text-gray-600 border border-gray-200"
                                  title={`Practice on ${pl.platform}`}
                                >
                                  {pl.platform === "LEETCODE"
                                    ? "LC"
                                    : pl.platform === "INTERVIEWBIT"
                                    ? "IB"
                                    : pl.platform === "CODEFORCES"
                                    ? "CF"
                                    : "HR"}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-[10px] bg-white">
                          {q.topic}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            q.difficulty === "EASY"
                              ? "default"
                              : q.difficulty === "MEDIUM"
                              ? "warning"
                              : "destructive"
                          }
                          className="text-[10px] font-bold py-0.5 px-1.5"
                        >
                          {q.difficulty}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 font-mono">
                        {q.userProgress?.attempts ?? 0}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link href={`/dsa/${q.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2"
                          >
                            Solve <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
