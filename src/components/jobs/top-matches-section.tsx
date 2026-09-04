import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { JobCard } from "@/components/jobs/job-card";
import { Button } from "@/components/ui/button";
import type { TopJobMatch } from "@/types/matching";

export interface TopMatchesSectionProps {
  matches: TopJobMatch[];
  className?: string;
}

export function TopMatchesSection({ matches, className }: TopMatchesSectionProps) {
  if (!matches || matches.length === 0) return null;

  // Show top 3 matches in the banner
  const topList = matches.slice(0, 3);

  return (
    <div
      className={`rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/40 via-white to-indigo-50/20 p-5 sm:p-6 shadow-sm ${
        className || ""
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
              <TrendingUp className="h-4 w-4" />
            </span>
            <h3 className="text-base font-bold text-gray-900">
              Top Matches For You
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Ranked by our deterministic matching engine against your active resume
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {topList.map(({ job, match }) => (
          <JobCard key={job.id} job={job} match={match} />
        ))}
      </div>
    </div>
  );
}
