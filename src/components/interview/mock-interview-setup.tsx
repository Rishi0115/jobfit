"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startInterviewSessionAction } from "@/actions/interview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Briefcase,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Flame,
  ArrowRight,
} from "lucide-react";

interface JobOption {
  id: string;
  title: string;
  companyName: string;
}

interface MockInterviewSetupProps {
  availableJobs: JobOption[];
  hasActiveResume: boolean;
  activeResumeName?: string | null;
  defaultJobId?: string | null;
  defaultMode?: "RESUME" | "JOB" | "MIXED";
}

export function MockInterviewSetup({
  availableJobs,
  hasActiveResume,
  activeResumeName,
  defaultJobId,
  defaultMode = "RESUME",
}: MockInterviewSetupProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"RESUME" | "JOB" | "MIXED">(defaultMode);
  const [selectedJobId, setSelectedJobId] = useState<string>(
    defaultJobId || (availableJobs[0]?.id ?? "")
  );
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStart = () => {
    setErrorMessage(null);

    if (mode === "JOB" && !selectedJobId) {
      setErrorMessage("Please select a target job for Job-based interview.");
      return;
    }

    startTransition(async () => {
      const res = await startInterviewSessionAction({
        mode,
        jobId: mode !== "RESUME" ? selectedJobId || undefined : undefined,
        difficulty,
        questionCount,
      });

      if (!res.success) {
        if (typeof res.error === "object") {
          const firstErr = Object.values(res.error).flat()[0];
          setErrorMessage(firstErr || "Failed to initialize interview session.");
        } else {
          setErrorMessage(res.error || "Failed to initialize interview session.");
        }
        return;
      }

      if (res.data?.id) {
        router.push(`/student/mock-interview/${res.data.id}`);
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Resume Status Banner */}
      <div className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Candidate Background Context
            </p>
            <p className="text-sm font-bold text-gray-900">
              {hasActiveResume
                ? `Active Resume: ${activeResumeName || "Uploaded"}`
                : "No active resume detected"}
            </p>
          </div>
        </div>
        {hasActiveResume ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Verified Ground Truth
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1">
            <AlertCircle className="h-3 w-3" /> Generic Mode Only
          </Badge>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Interview Mode Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-600" />
            1. Select Interview Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* RESUME MODE */}
          <button
            type="button"
            onClick={() => setMode("RESUME")}
            className={`p-4 rounded-xl border text-left transition-all ${
              mode === "RESUME"
                ? "border-primary-600 bg-primary-50/50 shadow-sm ring-1 ring-primary-600"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 font-bold">
              <FileText className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-gray-900">Resume-Based</h4>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              Questions anchored strictly to your verified projects, skills, and work history.
            </p>
          </button>

          {/* JOB MODE */}
          <button
            type="button"
            onClick={() => setMode("JOB")}
            className={`p-4 rounded-xl border text-left transition-all ${
              mode === "JOB"
                ? "border-primary-600 bg-primary-50/50 shadow-sm ring-1 ring-primary-600"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 font-bold">
              <Briefcase className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-gray-900">Job-Targeted</h4>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              Questions focused on the employer&apos;s specific tech stack, role requirements, and domain.
            </p>
          </button>

          {/* MIXED MODE */}
          <button
            type="button"
            onClick={() => setMode("MIXED")}
            className={`p-4 rounded-xl border text-left transition-all ${
              mode === "MIXED"
                ? "border-primary-600 bg-primary-50/50 shadow-sm ring-1 ring-primary-600"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2 font-bold">
              <Layers className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-gray-900">Mixed Simulation</h4>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              Comprehensive blend testing both your verified background and target role readiness.
            </p>
          </button>
        </CardContent>
      </Card>

      {/* 2. Target Job Selection (if JOB or MIXED) */}
      {mode !== "RESUME" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary-600" />
              2. Choose Target Job
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {availableJobs.length > 0 ? (
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {availableJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} — {j.companyName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                No active jobs found in your repository. Please explore jobs or track an application first.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. Session Configuration: Difficulty & Question Count */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary-600" />
            {mode === "RESUME" ? "2." : "3."} Session Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-2">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "easy", label: "Foundational (Junior)", desc: "Core syntax & conceptual basics" },
                { id: "medium", label: "Standard (Mid-Level)", desc: "System design, trade-offs & debugging" },
                { id: "hard", label: "Advanced (Senior)", desc: "Deep architectural edge cases & scale" },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setDifficulty(lvl.id as any)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    difficulty === lvl.id
                      ? "border-primary-600 bg-primary-50/50 ring-1 ring-primary-600"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <p className="text-xs font-bold text-gray-900">{lvl.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{lvl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-2">
              Question Count
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { count: 3, label: "3 Questions", desc: "~10 minutes sprint" },
                { count: 5, label: "5 Questions", desc: "~20 minutes standard round" },
                { count: 8, label: "8 Questions", desc: "~35 minutes deep dive" },
              ].map((opt) => (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setQuestionCount(opt.count)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    questionCount === opt.count
                      ? "border-primary-600 bg-primary-50/50 ring-1 ring-primary-600"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    {opt.label}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleStart}
          isLoading={isPending}
          size="lg"
          rightIcon={<ArrowRight className="h-4 w-4" />}
          className="w-full sm:w-auto px-8"
        >
          {isPending ? "Generating Questions..." : "Begin Mock Interview"}
        </Button>
      </div>
    </div>
  );
}
