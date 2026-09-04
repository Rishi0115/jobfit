"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Options ───

const WORK_MODE_OPTIONS = [
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ONSITE", label: "Onsite" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "FRESHER", label: "Fresher" },
  { value: "JUNIOR", label: "Junior" },
  { value: "MID", label: "Mid-level" },
  { value: "SENIOR", label: "Senior" },
  { value: "LEAD", label: "Lead" },
];

// ─── Component ───

interface FilterOption {
  value: string;
  label: string;
}

function FilterGroup({
  label,
  options,
  selected,
  paramName,
}: {
  label: string;
  options: FilterOption[];
  selected: string | null;
  paramName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (selected === value) {
      params.delete(paramName);
    } else {
      params.set(paramName, value);
    }

    // Reset to page 1 when filters change
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
              selected === option.value
                ? "bg-primary-100 text-primary-800 ring-1 ring-primary-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const workMode = searchParams.get("workMode");
  const employmentType = searchParams.get("employmentType");
  const experienceLevel = searchParams.get("experienceLevel");

  const hasFilters = workMode || employmentType || experienceLevel;

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("workMode");
    params.delete("employmentType");
    params.delete("experienceLevel");
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-7 text-xs text-gray-500"
            leftIcon={<X className="h-3 w-3" />}
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FilterGroup
          label="Work Mode"
          options={WORK_MODE_OPTIONS}
          selected={workMode}
          paramName="workMode"
        />
        <FilterGroup
          label="Employment Type"
          options={EMPLOYMENT_TYPE_OPTIONS}
          selected={employmentType}
          paramName="employmentType"
        />
        <FilterGroup
          label="Experience Level"
          options={EXPERIENCE_LEVEL_OPTIONS}
          selected={experienceLevel}
          paramName="experienceLevel"
        />
      </div>

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
          {workMode && (
            <Badge variant="default" className="gap-1 text-[10px]">
              {WORK_MODE_OPTIONS.find((o) => o.value === workMode)?.label}
            </Badge>
          )}
          {employmentType && (
            <Badge variant="default" className="gap-1 text-[10px]">
              {EMPLOYMENT_TYPE_OPTIONS.find((o) => o.value === employmentType)?.label}
            </Badge>
          )}
          {experienceLevel && (
            <Badge variant="default" className="gap-1 text-[10px]">
              {EXPERIENCE_LEVEL_OPTIONS.find((o) => o.value === experienceLevel)?.label}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
