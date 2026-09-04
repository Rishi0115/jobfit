"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import type { ApplicationWithJob, ApplicationStats } from "@/types/application";
import type { ApplicationStatus } from "@prisma/client";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_ORDER,
} from "@/types/application";
import { ApplicationCard } from "./application-card";
import { ApplicationStatsBar } from "./application-stats-bar";
import {
  updateApplicationStatusAction,
  deleteApplicationAction,
  updateApplicationNotesAction,
} from "@/actions/applications";
import {
  Search,
  LayoutGrid,
  List,
  Briefcase,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApplicationBoardProps {
  initialApplications: ApplicationWithJob[];
  initialStats: ApplicationStats;
}

export function ApplicationBoard({
  initialApplications,
  initialStats,
}: ApplicationBoardProps) {
  const [applications, setApplications] =
    useState<ApplicationWithJob[]>(initialApplications);
  const [stats, setStats] = useState<ApplicationStats>(initialStats);
  const [selectedFilterStatus, setSelectedFilterStatus] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Helper to recompute local stats after a status change or delete
  const recalculateStats = (apps: ApplicationWithJob[]): ApplicationStats => {
    const s: ApplicationStats = {
      total: apps.length,
      saved: 0,
      applied: 0,
      shortlisted: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };
    for (const app of apps) {
      switch (app.status) {
        case "SAVED":
          s.saved++;
          break;
        case "APPLIED":
          s.applied++;
          break;
        case "SHORTLISTED":
          s.shortlisted++;
          break;
        case "INTERVIEW":
          s.interview++;
          break;
        case "OFFER":
          s.offer++;
          break;
        case "REJECTED":
          s.rejected++;
          break;
      }
    }
    return s;
  };

  const handleStatusChange = async (
    applicationId: string,
    newStatus: ApplicationStatus
  ) => {
    setErrorMessage(null);
    // Optimistic update
    const previous = [...applications];
    const updated = applications.map((app) =>
      app.id === applicationId ? { ...app, status: newStatus } : app
    );
    setApplications(updated);
    setStats(recalculateStats(updated));

    startTransition(async () => {
      const res = await updateApplicationStatusAction({
        applicationId,
        status: newStatus,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to update status");
        setApplications(previous);
        setStats(recalculateStats(previous));
      }
    });
  };

  const handleUpdateNotes = async (
    applicationId: string,
    notes: string | null
  ) => {
    setErrorMessage(null);
    const previous = [...applications];
    const updated = applications.map((app) =>
      app.id === applicationId ? { ...app, notes } : app
    );
    setApplications(updated);

    startTransition(async () => {
      const res = await updateApplicationNotesAction({
        applicationId,
        notes,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to update notes");
        setApplications(previous);
      }
    });
  };

  const handleDelete = async (applicationId: string) => {
    setErrorMessage(null);
    const previous = [...applications];
    const updated = applications.filter((app) => app.id !== applicationId);
    setApplications(updated);
    setStats(recalculateStats(updated));

    startTransition(async () => {
      const res = await deleteApplicationAction({ applicationId });
      if (!res.success) {
        setErrorMessage(res.error || "Failed to remove application");
        setApplications(previous);
        setStats(recalculateStats(previous));
      }
    });
  };

  // Filter applications by search and active category filter
  const filteredApplications = applications.filter((app) => {
    if (selectedFilterStatus && app.status !== selectedFilterStatus) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchTitle = app.job.title.toLowerCase().includes(q);
      const matchCompany = app.job.companyName.toLowerCase().includes(q);
      if (!matchTitle && !matchCompany) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Statistics Bar */}
      <ApplicationStatsBar
        stats={stats}
        selectedStatus={selectedFilterStatus}
        onSelectStatus={(status) => setSelectedFilterStatus(status)}
      />

      {/* Error alert if any operation failed */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Controls & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search role or company..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {selectedFilterStatus && (
            <button
              type="button"
              onClick={() => setSelectedFilterStatus(null)}
              className="text-xs text-primary-600 hover:underline font-medium"
            >
              Clear filter ({APPLICATION_STATUS_LABELS[selectedFilterStatus as ApplicationStatus]})
            </button>
          )}

          {/* View toggle */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          <Link href="/student/jobs">
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Find Jobs
            </Button>
          </Link>
        </div>
      </div>

      {/* 3. Empty State */}
      {applications.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              No applications tracked yet
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              Start tracking jobs you find on JobFit. You can organize roles by Saved,
              Applied, Screening, Interview, and Offer stages.
            </p>
          </div>
          <Link href="/student/jobs">
            <Button size="sm" leftIcon={<Search className="h-3.5 w-3.5" />}>
              Browse Recommended Jobs
            </Button>
          </Link>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-medium text-gray-900">
            No applications match your filter
          </p>
          <p className="text-xs text-gray-500">
            Try adjusting your search query or status filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedFilterStatus(null);
            }}
            className="text-xs text-primary-600 hover:underline font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === "kanban" ? (
        /* 4. Kanban Column View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {APPLICATION_STATUS_ORDER.map((status) => {
            const columnApps = filteredApplications.filter(
              (app) => app.status === status
            );

            return (
              <div
                key={status}
                className="bg-gray-50/80 rounded-xl border border-gray-200 p-3 space-y-3 min-h-[400px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {APPLICATION_STATUS_LABELS[status]}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                    {columnApps.length}
                  </span>
                </div>

                {/* Column Content */}
                <div className="space-y-3">
                  {columnApps.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onUpdateNotes={handleUpdateNotes}
                    />
                  ))}
                  {columnApps.length === 0 && (
                    <div className="h-24 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-[11px] text-gray-400">
                      No jobs in {APPLICATION_STATUS_LABELS[status]}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 5. List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApplications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onUpdateNotes={handleUpdateNotes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
