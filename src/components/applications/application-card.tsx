"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { ApplicationWithJob } from "@/types/application";
import type { ApplicationStatus } from "@prisma/client";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_ORDER,
} from "@/types/application";
import {
  MapPin,
  Building2,
  Calendar,
  ExternalLink,
  Trash2,
  FileText,
  ChevronDown,
  Check,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface ApplicationCardProps {
  application: ApplicationWithJob;
  onStatusChange: (applicationId: string, status: ApplicationStatus) => Promise<void>;
  onDelete: (applicationId: string) => Promise<void>;
  onUpdateNotes?: (applicationId: string, notes: string | null) => Promise<void>;
}

const STATUS_VARIANTS: Record<
  ApplicationStatus,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "info"
> = {
  SAVED: "secondary",
  APPLIED: "info",
  SHORTLISTED: "default", // Screening
  INTERVIEW: "warning",
  OFFER: "success",
  REJECTED: "destructive",
};

export function ApplicationCard({
  application,
  onStatusChange,
  onDelete,
  onUpdateNotes,
}: ApplicationCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(application.notes || "");
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const { job } = application;

  const handleStatusSelect = async (newStatus: ApplicationStatus) => {
    if (newStatus === application.status || isUpdating) return;
    setIsUpdating(true);
    setShowStatusMenu(false);
    try {
      await onStatusChange(application.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotesSave = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await onUpdateNotes?.(application.id, notesText.trim() || null);
      setIsEditingNotes(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (isUpdating) return;
    if (!window.confirm("Remove this job from your application tracker?")) {
      return;
    }
    setIsUpdating(true);
    try {
      await onDelete(application.id);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow transition-all relative flex flex-col justify-between ${
        isUpdating ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      <div>
        {/* Top bar: Company & Status Menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0 font-bold text-xs uppercase">
              {job.companyName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {job.companyName}
              </p>
              {job.location && (
                <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  {job.location}
                </p>
              )}
            </div>
          </div>

          {/* Status Dropdown Trigger */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="inline-flex items-center gap-1 text-xs focus:outline-none"
            >
              <Badge variant={STATUS_VARIANTS[application.status]}>
                {APPLICATION_STATUS_LABELS[application.status]}
                <ChevronDown className="h-3 w-3 ml-0.5 opacity-70" />
              </Badge>
            </button>

            {showStatusMenu && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 text-xs">
                {APPLICATION_STATUS_ORDER.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusSelect(status)}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center justify-between text-gray-700 hover:text-gray-900"
                  >
                    <span>{APPLICATION_STATUS_LABELS[status]}</span>
                    {status === application.status && (
                      <Check className="h-3.5 w-3.5 text-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Job Title */}
        <Link
          href={`/student/jobs/${job.id}`}
          className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-2 block mb-2"
        >
          {job.title}
        </Link>

        {/* Meta badges: WorkMode & MatchScore */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {job.workMode && (
            <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
              {job.workMode}
            </span>
          )}
          {application.matchScore != null && (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                application.matchScore >= 75
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : application.matchScore >= 50
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Sparkles className="h-2.5 w-2.5" />
              {application.matchScore}% Match
            </span>
          )}
        </div>

        {/* Notes preview or editor */}
        {isEditingNotes ? (
          <div className="mb-3 space-y-1.5">
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add application notes, follow-up dates, interviewer details..."
              rows={2}
              maxLength={2000}
              className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setNotesText(application.notes || "");
                  setIsEditingNotes(false);
                }}
                className="text-[11px] px-2 py-0.5 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNotesSave}
                className="text-[11px] px-2 py-0.5 bg-primary-600 text-white rounded font-medium hover:bg-primary-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : application.notes ? (
          <div
            onClick={() => setIsEditingNotes(true)}
            className="mb-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors group"
          >
            <p className="line-clamp-2 italic text-[11px]">{application.notes}</p>
            <span className="text-[10px] text-primary-600 font-medium group-hover:underline">
              Edit note
            </span>
          </div>
        ) : null}
      </div>

      {/* Footer bar: Date & Actions */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {application.appliedAt
            ? `Applied ${formatDate(application.appliedAt)}`
            : `Added ${formatDate(application.createdAt)}`}
        </span>

        <div className="flex items-center gap-2">
          {!application.notes && !isEditingNotes && (
            <button
              type="button"
              onClick={() => setIsEditingNotes(true)}
              title="Add Notes"
              className="hover:text-primary-600 transition-colors p-1 rounded hover:bg-gray-50"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
          )}

          {job.applicationUrl && (
            <a
              href={job.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Original Application URL"
              className="hover:text-primary-600 transition-colors p-1 rounded hover:bg-gray-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          <button
            type="button"
            onClick={handleDelete}
            title="Remove Application"
            className="hover:text-rose-600 transition-colors p-1 rounded hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
