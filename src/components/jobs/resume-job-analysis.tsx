import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MatchBadge } from "./match-badge";
import { ResumeImproverDrawer } from "@/components/resume/resume-improver-drawer";
import type {
  EvaluationStatus,
  ResumeJobAnalysisResult,
} from "@/types/analysis";
import {
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Briefcase,
  UserCheck,
  GraduationCap,
  MapPin,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

export interface ResumeJobAnalysisProps {
  analysis: ResumeJobAnalysisResult | null;
  hasActiveResume: boolean;
  className?: string;
}

const EVALUATION_STATUS_BADGES: Record<
  EvaluationStatus,
  { label: string; variant: "success" | "secondary" | "outline" }
> = {
  EVALUATED: { label: "Evaluated", variant: "success" },
  UNAVAILABLE: { label: "Data Missing", variant: "secondary" },
  NOT_APPLICABLE: { label: "Not Required", variant: "outline" },
};

export function ResumeJobAnalysis({
  analysis,
  hasActiveResume,
  className,
}: ResumeJobAnalysisProps) {
  // Graceful empty state when user has no active resume
  if (!hasActiveResume || !analysis) {
    return (
      <Card className={`border-primary-200 bg-primary-50/20 shadow-sm ${className || ""}`}>
        <CardContent className="p-6 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 mx-auto">
            <FileText className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-gray-900">
              Resume vs Job Analysis Unavailable
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Upload your resume to calculate an exact, deterministic match score,
              uncover critical skill gaps, and receive tailored recommendations for this role.
            </p>
          </div>
          <Link href="/resume" className="inline-block pt-1">
            <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Upload Resume to Analyze
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const {
    overallScore,
    analyzedResumeFileName,
    isResumeActive,
    criticalGaps,
    importantGaps,
    coveredSkills,
    experienceAssessment,
    roleAssessment,
    educationAssessment,
    locationAssessment,
    strengths,
    recommendations,
    explanation,
  } = analysis;

  return (
    <Card className={`border-primary-200 shadow-sm ${className || ""}`}>
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-600" />
                Resume vs Job Analysis
              </CardTitle>
              {analyzedResumeFileName && (
                <Badge
                  variant="outline"
                  className="text-[11px] font-medium bg-gray-50 text-gray-700 border-gray-200 gap-1"
                >
                  <FileText className="h-3 w-3 text-gray-500" />
                  {analyzedResumeFileName}
                  {isResumeActive && (
                    <span className="text-[10px] text-emerald-600 font-semibold ml-0.5">
                      (Active)
                    </span>
                  )}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Deterministic set comparison against verified resume extractions and job requirements
            </p>
          </div>
          <MatchBadge score={overallScore} size="lg" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-0">
        {/* Executive Summary */}
        <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 text-sm text-gray-700 leading-relaxed space-y-2">
          <p className="font-medium text-gray-900">{explanation}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 pt-1 border-t border-gray-200/60">
            <span>
              <strong>{coveredSkills.length}</strong> skills covered
            </span>
            <span>·</span>
            <span className={criticalGaps.length > 0 ? "text-rose-600 font-semibold" : "text-emerald-600"}>
              <strong>{criticalGaps.length}</strong> critical gaps
            </span>
            <span>·</span>
            <span className="text-amber-700">
              <strong>{importantGaps.length}</strong> preferred gaps
            </span>
          </div>
        </div>

        {/* Critical Skill Gaps (Missing REQUIRED Skills) */}
        {criticalGaps.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                Critical Skill Gaps ({criticalGaps.length} Required Missing)
              </h4>
              <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                High Priority
              </Badge>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              These skills are listed as mandatory by the employer and are not found in your current resume.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {criticalGaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-rose-200/70 bg-white p-3 space-y-1 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      {gap.skillName}
                    </span>
                    <Badge variant="outline" className="text-[10px] text-rose-700 border-rose-200">
                      Required
                    </Badge>
                  </div>
                  {gap.recommendation && (
                    <p className="text-[11px] text-gray-600 leading-snug">
                      {gap.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Important Skill Gaps (Missing PREFERRED Skills) */}
        {importantGaps.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                Preferred Skill Gaps ({importantGaps.length} Preferred Missing)
              </h4>
              <Badge variant="warning" className="text-[10px] uppercase font-semibold">
                Medium Priority
              </Badge>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              These skills are preferred qualifications that give candidates an advantage.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {importantGaps.map((gap, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs font-medium bg-white text-amber-900 border-amber-300 py-1 px-2.5 shadow-2xs"
                >
                  {gap.skillName}
                  <span className="text-[10px] text-amber-600 ml-1.5 font-normal">
                    (Preferred)
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Covered Skills */}
        {coveredSkills.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Covered Skills ({coveredSkills.length} Verified)
            </h4>
            <div className="flex flex-wrap gap-2">
              {coveredSkills.map((item, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs font-medium bg-emerald-50 text-emerald-800 border-emerald-200 py-1 px-2.5 gap-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  {item.skillName}
                  <span className="text-[10px] text-emerald-600/80 font-normal">
                    · {item.type === "REQUIRED" ? "Required" : "Bonus"}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Assessments Matrix (Experience, Role, Education, Location) */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Signal Assessments
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Experience */}
            <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-primary-600" />
                  Experience
                </span>
                <Badge
                  variant={EVALUATION_STATUS_BADGES[experienceAssessment.status].variant}
                  className="text-[10px]"
                >
                  {EVALUATION_STATUS_BADGES[experienceAssessment.status].label}
                </Badge>
              </div>
              <Progress
                value={experienceAssessment.status === "EVALUATED" ? experienceAssessment.score : 0}
                className="h-1"
                indicatorClassName={
                  experienceAssessment.details.isMet ? "bg-emerald-500" : "bg-amber-500"
                }
              />
              <p className="text-[11px] text-gray-600 leading-snug">
                {experienceAssessment.reason}
              </p>
            </div>

            {/* Role Relevance */}
            <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-primary-600" />
                  Role Relevance
                </span>
                <Badge
                  variant={EVALUATION_STATUS_BADGES[roleAssessment.status].variant}
                  className="text-[10px]"
                >
                  {EVALUATION_STATUS_BADGES[roleAssessment.status].label}
                </Badge>
              </div>
              <Progress
                value={roleAssessment.status === "EVALUATED" ? roleAssessment.score : 0}
                className="h-1"
                indicatorClassName={
                  roleAssessment.score >= 75 ? "bg-emerald-500" : "bg-blue-500"
                }
              />
              <p className="text-[11px] text-gray-600 leading-snug">
                {roleAssessment.reason}
              </p>
            </div>

            {/* Education */}
            <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-primary-600" />
                  Education
                </span>
                <Badge
                  variant={EVALUATION_STATUS_BADGES[educationAssessment.status].variant}
                  className="text-[10px]"
                >
                  {EVALUATION_STATUS_BADGES[educationAssessment.status].label}
                </Badge>
              </div>
              <Progress
                value={educationAssessment.status === "EVALUATED" ? educationAssessment.score : 0}
                className="h-1"
                indicatorClassName="bg-indigo-500"
              />
              <p className="text-[11px] text-gray-600 leading-snug">
                {educationAssessment.reason}
              </p>
            </div>

            {/* Location & Work Mode */}
            <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary-600" />
                  Location & Work Mode
                </span>
                <Badge
                  variant={EVALUATION_STATUS_BADGES[locationAssessment.status].variant}
                  className="text-[10px]"
                >
                  {EVALUATION_STATUS_BADGES[locationAssessment.status].label}
                </Badge>
              </div>
              <Progress
                value={locationAssessment.status === "EVALUATED" ? locationAssessment.score : 0}
                className="h-1"
                indicatorClassName={
                  locationAssessment.details.isWorkModeCompatible ? "bg-emerald-500" : "bg-amber-500"
                }
              />
              <p className="text-[11px] text-gray-600 leading-snug">
                {locationAssessment.reason}
              </p>
            </div>
          </div>
        </div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Your Strengths for this Role
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-700">
              {strengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actionable Recommendations ("Before You Apply") */}
        {recommendations.length > 0 && (
          <div className="rounded-xl border border-primary-100 bg-primary-50/30 p-4 space-y-3 pt-2">
            <h4 className="text-xs font-bold text-primary-900 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-primary-700" />
              Before You Apply: Actionable Improvements
            </h4>
            <ul className="space-y-2 text-xs">
              {recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-primary-100 shadow-2xs"
                >
                  <Badge
                    variant={
                      rec.priority === "HIGH"
                        ? "destructive"
                        : rec.priority === "MEDIUM"
                        ? "warning"
                        : "outline"
                    }
                    className="text-[9px] uppercase tracking-wide shrink-0 font-bold mt-0.5"
                  >
                    {rec.priority}
                  </Badge>
                  <div className="space-y-0.5">
                    <span className="font-semibold text-gray-900 block">
                      {rec.target}
                    </span>
                    <span className="text-gray-600 leading-relaxed block">
                      {rec.advice}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {analysis.analyzedResumeId && (
              <div className="pt-2 flex justify-end">
                <ResumeImproverDrawer
                  resumeId={analysis.analyzedResumeId}
                  resumeFileName={analysis.analyzedResumeFileName || "Resume"}
                  resumeVersion={1}
                  initialJobId={analysis.analyzedJobId}
                  initialJobTitle={analysis.analyzedJobTitle}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
