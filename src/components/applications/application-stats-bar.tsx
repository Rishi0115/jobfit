"use client";

import React from "react";
import type { ApplicationStats } from "@/types/application";
import {
  Bookmark,
  Send,
  UserCheck,
  Calendar,
  Award,
  XCircle,
  Briefcase,
} from "lucide-react";

interface ApplicationStatsBarProps {
  stats: ApplicationStats;
  selectedStatus?: string | null;
  onSelectStatus?: (status: string | null) => void;
}

export function ApplicationStatsBar({
  stats,
  selectedStatus,
  onSelectStatus,
}: ApplicationStatsBarProps) {
  const items = [
    {
      key: null,
      label: "Total",
      count: stats.total,
      icon: Briefcase,
      color: "text-gray-700 bg-gray-100",
      activeBorder: "border-gray-900 bg-gray-50",
    },
    {
      key: "SAVED",
      label: "Saved",
      count: stats.saved,
      icon: Bookmark,
      color: "text-amber-700 bg-amber-50",
      activeBorder: "border-amber-600 bg-amber-50/70",
    },
    {
      key: "APPLIED",
      label: "Applied",
      count: stats.applied,
      icon: Send,
      color: "text-blue-700 bg-blue-50",
      activeBorder: "border-blue-600 bg-blue-50/70",
    },
    {
      key: "SHORTLISTED",
      label: "Screening",
      count: stats.shortlisted,
      icon: UserCheck,
      color: "text-purple-700 bg-purple-50",
      activeBorder: "border-purple-600 bg-purple-50/70",
    },
    {
      key: "INTERVIEW",
      label: "Interview",
      count: stats.interview,
      icon: Calendar,
      color: "text-cyan-700 bg-cyan-50",
      activeBorder: "border-cyan-600 bg-cyan-50/70",
    },
    {
      key: "OFFER",
      label: "Offers",
      count: stats.offer,
      icon: Award,
      color: "text-emerald-700 bg-emerald-50",
      activeBorder: "border-emerald-600 bg-emerald-50/70",
    },
    {
      key: "REJECTED",
      label: "Rejected",
      count: stats.rejected,
      icon: XCircle,
      color: "text-rose-700 bg-rose-50",
      activeBorder: "border-rose-600 bg-rose-50/70",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        const isSelected = selectedStatus === item.key;

        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelectStatus?.(item.key)}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              isSelected
                ? `${item.activeBorder} ring-2 ring-primary-500 shadow-sm`
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 truncate">
                {item.label}
              </span>
              <div
                className={`p-1.5 rounded-lg ${item.color} flex items-center justify-center`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {item.count}
            </p>
          </button>
        );
      })}
    </div>
  );
}
