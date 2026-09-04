import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  Building2,
  Clock,
  Briefcase,
  GraduationCap,
  ArrowRight,
  Globe,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import type { JobWithRelations } from "@/types/job";
import type { MatchResult } from "@/types/matching";
import { MatchBadge } from "./match-badge";
import { Check, X } from "lucide-react";

// ─── Label Maps ───

const WORK_MODE_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "Onsite",
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  FRESHER: "Fresher",
  JUNIOR: "Junior",
  MID: "Mid-level",
  SENIOR: "Senior",
  LEAD: "Lead",
};

const WORK_MODE_VARIANTS: Record<string, "default" | "success" | "info" | "warning" | "secondary"> = {
  REMOTE: "success",
  HYBRID: "info",
  ONSITE: "warning",
};

// ─── Helpers ───

function formatSalary(min?: number | null, max?: number | null, currency?: string | null): string | null {
  if (!min && !max) return null;

  const curr = currency || "INR";
  const formatNum = (n: number) => {
    if (curr === "INR") {
      if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
      if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
      return `₹${n}`;
    }
    return `${curr} ${n.toLocaleString()}`;
  };

  if (min && max) return `${formatNum(min)} – ${formatNum(max)}`;
  if (min) return `${formatNum(min)}+`;
  if (max) return `Up to ${formatNum(max)}`;
  return null;
}

// ─── Component ───

export interface JobCardProps {
  job: JobWithRelations;
  match?: MatchResult;
  className?: string;
}

export function JobCard({ job, match, className }: JobCardProps) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const maxSkillsToShow = 4;
  const skills = job.jobSkills ?? [];
  const visibleSkills = skills.slice(0, maxSkillsToShow);
  const remainingCount = Math.max(0, skills.length - maxSkillsToShow);

  return (
    <Link href={`/student/jobs/${job.id}`} className="block group">
      <Card
        hoverable
        className={cn(
          "p-5 transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5 border-gray-200",
          className
        )}
      >
        {/* Header: Company + Work Mode & Match */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 truncate">
                {job.companyName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {match && <MatchBadge score={match.overallScore} size="sm" />}
            {job.workMode && (
              <Badge variant={WORK_MODE_VARIANTS[job.workMode] ?? "secondary"} className="text-[10px]">
                {WORK_MODE_LABELS[job.workMode] ?? job.workMode}
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors line-clamp-2">
          {job.title}
        </h3>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
          )}
          {job.employmentType && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}
            </span>
          )}
          {job.experienceLevel && (
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {EXPERIENCE_LEVEL_LABELS[job.experienceLevel] ?? job.experienceLevel}
            </span>
          )}
        </div>

        {/* Salary */}
        {salary && (
          <p className="text-sm font-semibold text-gray-800 mb-3">{salary}</p>
        )}

        {/* Skills */}
        {match ? (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {match.matchedSkills.slice(0, 3).map((skill, idx) => (
              <Badge
                key={`matched-${idx}`}
                variant="outline"
                className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                <Check className="h-2.5 w-2.5 mr-0.5" />
                {skill}
              </Badge>
            ))}
            {match.missingSkills.slice(0, 2).map((skill, idx) => (
              <Badge
                key={`missing-${idx}`}
                variant="outline"
                className="text-[10px] font-medium bg-rose-50/40 text-rose-600 border-rose-200"
              >
                <X className="h-2.5 w-2.5 mr-0.5" />
                {skill}
              </Badge>
            ))}
            {match.matchedSkills.length + match.missingSkills.length > 5 && (
              <Badge variant="outline" className="text-[10px] font-medium">
                +{match.matchedSkills.length + match.missingSkills.length - 5} more
              </Badge>
            )}
          </div>
        ) : (
          visibleSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {visibleSkills.map((js) => (
                <Badge
                  key={js.id}
                  variant="secondary"
                  className="text-[10px] font-medium"
                >
                  {js.skill.name}
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Badge variant="outline" className="text-[10px] font-medium">
                  +{remainingCount} more
                </Badge>
              )}
            </div>
          )
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Clock className="h-3 w-3" />
            {job.postedAt
              ? `Posted ${formatDate(job.postedAt)}`
              : `Added ${formatDate(job.createdAt)}`}
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
            View Details <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </Card>
    </Link>
  );
}

// ─── Skeleton ───

export function JobCardSkeleton() {
  return (
    <Card className="p-5 border-gray-200 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gray-200" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
      <div className="flex gap-3 mb-3">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-3 w-16 bg-gray-200 rounded" />
        <div className="h-3 w-14 bg-gray-200 rounded" />
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="h-5 w-14 bg-gray-200 rounded-full" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-12 bg-gray-200 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="h-3 w-28 bg-gray-200 rounded" />
      </div>
    </Card>
  );
}
