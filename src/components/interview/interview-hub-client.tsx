"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { startInterviewSessionAction } from "@/actions/interview";
import { InterviewType } from "@prisma/client";
import {
  FileText,
  Briefcase,
  History,
  Sparkles,
  ArrowRight,
  Award,
  Calendar,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export interface InterviewHubClientProps {
  pastSessions: any[];
  availableJobs: Array<{ id: string; title: string; companyName: string }>;
}

export function InterviewHubClient({
  pastSessions,
  availableJobs,
}: InterviewHubClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<
    "RESUME" | "JOB" | "HISTORY"
  >("RESUME");
  const [selectedJobId, setSelectedJobId] = React.useState<string>(
    availableJobs[0]?.id || ""
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleStartSession = async (type: InterviewType, jobId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const resp = await startInterviewSessionAction({
        type,
        jobId,
        questionCount: 5,
      });

      if (resp.success && resp.data) {
        router.push(`/interview/${resp.data.id}`);
      } else {
        setError(
          typeof resp.error === "string"
            ? resp.error
            : "Failed to start interview session."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("RESUME")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "RESUME"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Resume-Based Practice
          </span>
        </button>
        <button
          onClick={() => setActiveTab("JOB")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "JOB"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Briefcase className="h-4 w-4" /> Target Job Practice
          </span>
        </button>
        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "HISTORY"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <History className="h-4 w-4" /> Previous Sessions ({pastSessions.length})
          </span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* Tab 1: Resume-Based */}
      {activeTab === "RESUME" && (
        <Card className="border-primary-200 bg-linear-to-br from-primary-50/40 via-white to-primary-50/20 shadow-2xs">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-gray-900">
                  Resume-Based Technical Interview
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Practice questions generated strictly from your verified projects, technologies, and work history.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-2xs space-y-2 text-xs text-gray-600">
              <span className="font-bold text-gray-900 block">
                What to Expect:
              </span>
              <ul className="list-disc list-inside space-y-1">
                <li>Deep technical questions on your primary projects and architecture.</li>
                <li>Trade-off investigations based on frameworks and tools you listed.</li>
                <li>Dynamic follow-up questions probing depth and design decisions.</li>
                <li>Objective advisory evaluation and feedback after every answer.</li>
              </ul>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => handleStartSession(InterviewType.RESUME_BASED)}
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Start Resume-Based Practice (5 Questions)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Job-Based */}
      {activeTab === "JOB" && (
        <Card className="border-gray-200 shadow-2xs">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-gray-900">
                  Target Job-Specific Practice
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Prepare for a concrete role with questions aligned to required competencies and skill gaps.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            {availableJobs.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-xl">
                No active jobs found. Browse jobs to practice role-specific interviews.
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 block">
                  Select Target Job:
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs font-medium text-gray-800 shadow-2xs"
                >
                  {availableJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} — {j.companyName}
                    </option>
                  ))}
                </select>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() =>
                    handleStartSession(InterviewType.JOB_BASED, selectedJobId)
                  }
                  isLoading={isLoading}
                  disabled={!selectedJobId}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Start Job-Targeted Practice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: History */}
      {activeTab === "HISTORY" && (
        <Card className="border-gray-200 shadow-2xs">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-gray-900">
              Session History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pastSessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                You haven&apos;t completed any practice sessions yet. Start your first session above!
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pastSessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50/60 transition-colors text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          {s.job?.title || "Technical Interview Practice"}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {s.type}
                        </Badge>
                        <Badge
                          variant={
                            s.status === "COMPLETED" ? "default" : "warning"
                          }
                          className="text-[10px]"
                        >
                          {s.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(s.createdAt)}
                        </span>
                        <span>•</span>
                        <span>{s._count?.questions ?? 0} questions</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {s.overallScore && (
                        <div className="text-right">
                          <span className="text-sm font-black text-primary-700 block">
                            {s.overallScore}%
                          </span>
                          <span className="text-[10px] text-gray-400 uppercase">
                            Score
                          </span>
                        </div>
                      )}
                      <Link href={`/interview/${s.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
