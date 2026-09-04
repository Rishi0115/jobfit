import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MatchBadge } from "./match-badge";
import type { MatchResult } from "@/types/matching";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Info,
  Code2,
  Briefcase,
  UserCheck,
  GraduationCap,
  MapPin,
} from "lucide-react";

export interface MatchBreakdownProps {
  match: MatchResult;
  className?: string;
}

export function MatchBreakdown({ match, className }: MatchBreakdownProps) {
  const { breakdown, signalAvailability } = match;

  const signalConfigs = [
    {
      key: "skills" as const,
      label: "Skills Match",
      weight: "60%",
      icon: <Code2 className="h-4 w-4 text-primary-600" />,
      score: breakdown.skills.score,
      isAvailable: signalAvailability.skills,
      reason: `${breakdown.skills.details.matchedRequired.length} of ${breakdown.skills.details.totalRequired} required skills matched`,
    },
    {
      key: "experience" as const,
      label: "Experience Match",
      weight: "15%",
      icon: <Briefcase className="h-4 w-4 text-primary-600" />,
      score: breakdown.experience.score,
      isAvailable: signalAvailability.experience,
      reason: breakdown.experience.details.reason,
    },
    {
      key: "role" as const,
      label: "Role Relevance",
      weight: "15%",
      icon: <UserCheck className="h-4 w-4 text-primary-600" />,
      score: breakdown.role.score,
      isAvailable: signalAvailability.role,
      reason: breakdown.role.details.reason,
    },
    {
      key: "education" as const,
      label: "Education Compatibility",
      weight: "5%",
      icon: <GraduationCap className="h-4 w-4 text-primary-600" />,
      score: breakdown.education.score,
      isAvailable: signalAvailability.education,
      reason: breakdown.education.details.reason,
    },
    {
      key: "location" as const,
      label: "Location & Work Mode",
      weight: "5%",
      icon: <MapPin className="h-4 w-4 text-primary-600" />,
      score: breakdown.location.score,
      isAvailable: signalAvailability.location,
      reason: breakdown.location.details.reason,
    },
  ];

  return (
    <Card className={`border-primary-200 shadow-sm ${className || ""}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              Your Match Analysis
            </CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Deterministic evaluation against your active resume and profile
            </p>
          </div>
          <MatchBadge score={match.overallScore} size="lg" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-0">
        {/* Explanation Summary */}
        <div className="p-3.5 rounded-lg bg-gray-50/80 border border-gray-100 text-sm text-gray-700 leading-relaxed">
          {match.explanation}
        </div>

        {/* Signals Breakdown */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Signals Breakdown
          </h4>
          <div className="space-y-3.5">
            {signalConfigs.map((sig) => (
              <div key={sig.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-800 flex items-center gap-1.5">
                    {sig.icon}
                    {sig.label}
                    <span className="text-[10px] text-gray-400 font-normal">
                      ({sig.weight})
                    </span>
                  </span>
                  <span className="font-semibold text-gray-900">
                    {sig.isAvailable ? `${sig.score}%` : "Not provided"}
                  </span>
                </div>
                <Progress
                  value={sig.isAvailable ? sig.score : 0}
                  className="h-1.5"
                  indicatorClassName={
                    !sig.isAvailable
                      ? "bg-gray-300"
                      : sig.score >= 75
                      ? "bg-emerald-500"
                      : sig.score >= 50
                      ? "bg-blue-500"
                      : "bg-amber-500"
                  }
                />
                <p className="text-[11px] text-gray-500 leading-normal">
                  {sig.reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Skills Matched & Missing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          {/* Matched Skills */}
          <div>
            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Matched Skills ({match.matchedSkills.length})
            </h5>
            {match.matchedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {match.matchedSkills.map((skill, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-[11px] bg-emerald-50 text-emerald-800 border-emerald-200"
                  >
                    ✓ {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No skills matched yet.</p>
            )}
          </div>

          {/* Missing Skills */}
          <div>
            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-rose-500" />
              Missing Skills ({match.missingSkills.length})
            </h5>
            {match.missingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {match.missingSkills.map((skill, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-[11px] bg-rose-50/50 text-rose-700 border-rose-200"
                  >
                    ✕ {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-600 font-medium">
                All required skills satisfied!
              </p>
            )}
          </div>
        </div>

        {/* Strengths & Gaps */}
        {(match.strengths.length > 0 || match.gaps.length > 0) && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            {match.strengths.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">
                  Key Strengths
                </h5>
                <ul className="space-y-1 text-xs text-gray-600">
                  {match.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {match.gaps.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1.5">
                  Areas to Address
                </h5>
                <ul className="space-y-1 text-xs text-gray-600">
                  {match.gaps.map((g, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[11px] text-gray-400">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>
            Deterministic scoring engine · weights normalize automatically if profile data is missing.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
