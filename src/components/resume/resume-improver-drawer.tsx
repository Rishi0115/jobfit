"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  improveResumeAction,
  applyResumeImprovementsAction,
} from "@/actions/ai-resume";
import type {
  ImprovementMode,
  ResumeImprovementResult,
  ResumeSectionType,
} from "@/types/ai-resume";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  Target,
  ArrowRight,
  Layers,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

export interface ResumeImproverDrawerProps {
  resumeId: string;
  resumeFileName: string;
  resumeVersion: number;
  initialJobId?: string;
  initialJobTitle?: string;
}

export function ResumeImproverDrawer({
  resumeId,
  resumeFileName,
  resumeVersion,
  initialJobId,
  initialJobTitle,
}: ResumeImproverDrawerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [mode, setMode] = React.useState<ImprovementMode>(
    initialJobId ? "JOB_TARGETED" : "GENERAL"
  );
  const [targetSection, setTargetSection] =
    React.useState<ResumeSectionType>("ALL");
  const [jobId, setJobId] = React.useState<string>(initialJobId || "");

  const [isLoading, setIsLoading] = React.useState(false);
  const [isApplying, setIsApplying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ResumeImprovementResult | null>(null);

  // Selective acceptance states
  const [selectedBulletIds, setSelectedBulletIds] = React.useState<Set<string>>(
    new Set()
  );
  const [acceptSummary, setAcceptSummary] = React.useState(true);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleRunImprovement = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await improveResumeAction({
        resumeId,
        mode,
        targetSection,
        jobId: mode === "JOB_TARGETED" && jobId ? jobId : undefined,
      });

      if (!resp.success) {
        const msg =
          typeof resp.error === "string"
            ? resp.error
            : "Failed to generate resume improvements.";
        setError(msg);
      } else if (resp.data) {
        setResult(resp.data);
        setSelectedBulletIds(new Set(resp.data.improvedBullets.map((b) => b.id)));
        setAcceptSummary(Boolean(resp.data.improvedSummary));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBullet = (id: string) => {
    setSelectedBulletIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplySelected = async () => {
    if (!result) return;
    setIsApplying(true);
    setError(null);

    try {
      // Build customEdits map for accepted bullets
      const customEdits: Record<string, string> = {};
      for (const bullet of result.improvedBullets) {
        if (selectedBulletIds.has(bullet.id)) {
          customEdits[bullet.originalText] = bullet.improvedText;
        }
      }

      const resp = await applyResumeImprovementsAction({
        resumeId,
        selectedBulletIds: Array.from(selectedBulletIds),
        acceptedSummaryText:
          acceptSummary && result.improvedSummary
            ? result.improvedSummary.improvedText
            : undefined,
        customEdits,
      });

      if (!resp.success) {
        const msg =
          typeof resp.error === "string"
            ? resp.error
            : "Failed to apply selected improvements.";
        setError(msg);
      } else if (resp.data) {
        // Success: redirect to newly created resume version
        setIsOpen(false);
        router.push(`/resume/${resp.data.newResumeId}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply changes.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="default"
        size="sm"
        leftIcon={<Sparkles className="h-4 w-4 text-amber-300" />}
      >
        Improve with AI
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-5 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    AI Resume Improvement
                  </h3>
                  <p className="text-xs text-gray-500">
                    {resumeFileName} (v{resumeVersion}) • Factual enhancement without fabrication
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Controls / Options Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                {/* Mode Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Mode
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as ImprovementMode)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="GENERAL">General Enhancement</option>
                    <option value="JOB_TARGETED">Target a Specific Job</option>
                    <option value="SECTION_LEVEL">Section-Specific</option>
                  </select>
                </div>

                {/* Section Scope */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Scope
                  </label>
                  <select
                    value={targetSection}
                    onChange={(e) =>
                      setTargetSection(e.target.value as ResumeSectionType)
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="ALL">Entire Resume</option>
                    <option value="SUMMARY">Summary</option>
                    <option value="EXPERIENCE">Experience Bullets</option>
                    <option value="PROJECTS">Project Descriptions</option>
                    <option value="SKILLS">Skills Presentation</option>
                    <option value="EDUCATION">Education</option>
                  </select>
                </div>

                {/* Job Target (if applicable) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Target Context
                  </label>
                  {mode === "JOB_TARGETED" ? (
                    initialJobTitle ? (
                      <Badge variant="outline" className="w-full py-2 px-3 justify-start text-xs font-medium bg-white text-gray-800">
                        <Target className="h-3 w-3 text-primary-600 mr-1.5" />
                        {initialJobTitle}
                      </Badge>
                    ) : (
                      <input
                        type="text"
                        placeholder="Enter Job ID..."
                        value={jobId}
                        onChange={(e) => setJobId(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    )
                  ) : (
                    <span className="text-xs text-gray-400 block pt-2">
                      Verified candidate facts only
                    </span>
                  )}
                </div>
              </div>

              {/* Action Trigger */}
              {!result && (
                <div className="text-center py-6 space-y-3">
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    JobFit AI analyzes your verified skills, experience, and target alignment to strengthen action verbs and structure without inventing qualifications.
                  </p>
                  <Button
                    onClick={handleRunImprovement}
                    isLoading={isLoading}
                    leftIcon={<Sparkles className="h-4 w-4 text-amber-300" />}
                  >
                    {isLoading ? "Auditing & Optimizing..." : "Generate AI Improvements"}
                  </Button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Improvement Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Results View */}
              {result && (
                <div className="space-y-6 pt-2">
                  {/* Factual Fidelity Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-emerald-900 block">
                          Deterministic Factual Fidelity: {result.preservationScore}%
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          Audited against candidate verified facts. Target job context was not injected as unearned experience.
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRunImprovement}
                      isLoading={isLoading}
                      leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                    >
                      Regenerate
                    </Button>
                  </div>

                  {/* Factual Warnings if any */}
                  {result.factualWarnings.length > 0 && (
                    <Alert variant="warning">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Factual Review Required</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-0.5 text-xs pt-1">
                          {result.factualWarnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Improved Summary */}
                  {result.improvedSummary && (
                    <Card className="border-gray-200 shadow-2xs">
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Professional Summary
                        </CardTitle>
                        <label className="flex items-center gap-1.5 text-xs text-gray-600 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={acceptSummary}
                            onChange={(e) => setAcceptSummary(e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          Accept Summary
                        </label>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {result.improvedSummary.originalText && (
                            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-gray-600">
                              <span className="font-semibold text-gray-500 block mb-1">
                                Original:
                              </span>
                              {result.improvedSummary.originalText}
                            </div>
                          )}
                          <div className="p-3 rounded-lg bg-primary-50/40 border border-primary-100 text-gray-900">
                            <span className="font-semibold text-primary-700 block mb-1">
                              Improved:
                            </span>
                            {result.improvedSummary.improvedText}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Improved Bullets List */}
                  {result.improvedBullets.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="h-4 w-4 text-primary-600" />
                          Proposed Bullet Improvements ({result.improvedBullets.length})
                        </h4>
                        <span className="text-xs text-gray-500">
                          {selectedBulletIds.size} of {result.improvedBullets.length} selected
                        </span>
                      </div>

                      <div className="space-y-3">
                        {result.improvedBullets.map((bullet) => {
                          const isSelected = selectedBulletIds.has(bullet.id);
                          return (
                            <div
                              key={bullet.id}
                              className={`rounded-xl border p-4 transition-all ${
                                isSelected
                                  ? "border-primary-300 bg-white shadow-2xs"
                                  : "border-gray-200 bg-gray-50/50 opacity-70"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleBullet(bullet.id)}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                  />
                                  <Badge variant="outline" className="text-[10px]">
                                    {bullet.section}
                                  </Badge>
                                </label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-gray-500 hover:text-gray-900 gap-1"
                                  onClick={() => handleCopy(bullet.improvedText, bullet.id)}
                                >
                                  {copiedId === bullet.id ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                  {copiedId === bullet.id ? "Copied" : "Copy"}
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-600">
                                  <span className="font-medium text-gray-400 block mb-0.5">
                                    Original:
                                  </span>
                                  {bullet.originalText}
                                </div>
                                <div className="p-2.5 rounded-lg bg-primary-50/30 border border-primary-100 text-gray-900 font-medium">
                                  <span className="font-medium text-primary-700 block mb-0.5">
                                    Improved:
                                  </span>
                                  {bullet.improvedText}
                                </div>
                              </div>

                              {/* Warnings & Placeholders */}
                              {bullet.hasMetricPlaceholder && (
                                <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 rounded-md p-2 flex items-center gap-1.5">
                                  <HelpCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                                  <span>
                                    Contains metric placeholder: Replace with real results if known before sending.
                                  </span>
                                </div>
                              )}

                              {bullet.warnings.length > 0 && (
                                <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-2 space-y-0.5">
                                  {bullet.warnings.map((w, i) => (
                                    <div key={i} className="flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3 shrink-0 text-rose-600" />
                                      <span>{w}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ATS Suggestions */}
                  {result.atsSuggestions.length > 0 && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb className="h-4 w-4 text-primary-600" />
                        ATS Formatting & Keyword Alignment
                      </h4>
                      <ul className="space-y-1.5 text-xs text-gray-600">
                        {result.atsSuggestions.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="font-semibold text-gray-900 shrink-0">
                              {item.keyword}:
                            </span>
                            <span>{item.advice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {result && (
              <div className="flex items-center justify-between border-t border-gray-100 p-4 bg-gray-50/80">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleApplySelected}
                    isLoading={isApplying}
                    disabled={selectedBulletIds.size === 0 && !acceptSummary}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Apply Selected Changes as Version {resumeVersion + 1}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
