"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { trackJobAction, updateApplicationStatusAction } from "@/actions/applications";
import type { ApplicationStatus } from "@prisma/client";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_ORDER } from "@/types/application";
import { Bookmark, Check, ChevronDown, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TrackApplicationButtonProps {
  jobId: string;
  initialStatus?: ApplicationStatus | null;
  initialApplicationId?: string | null;
}

export function TrackApplicationButton({
  jobId,
  initialStatus,
  initialApplicationId,
}: TrackApplicationButtonProps) {
  const [status, setStatus] = useState<ApplicationStatus | null>(initialStatus || null);
  const [applicationId, setApplicationId] = useState<string | null>(initialApplicationId || null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleTrack = (targetStatus: ApplicationStatus = "SAVED") => {
    startTransition(async () => {
      const res = await trackJobAction(jobId, targetStatus);
      if (res.success && res.data) {
        setStatus(res.data.status);
        setApplicationId(res.data.id);
        setIsOpen(false);
      }
    });
  };

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    if (!applicationId) return;
    startTransition(async () => {
      const res = await updateApplicationStatusAction({
        applicationId,
        status: newStatus,
      });
      if (res.success && res.data) {
        setStatus(res.data.status);
        setIsOpen(false);
      }
    });
  };

  if (status) {
    return (
      <div className="relative">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isPending}
            className="w-full flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 hover:bg-emerald-100/70 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Tracking: <strong>{APPLICATION_STATUS_LABELS[status]}</strong>
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-2" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-30 text-xs">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
              Update Status
            </div>
            {APPLICATION_STATUS_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleStatusChange(s)}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center justify-between text-gray-700 hover:text-gray-900"
              >
                <span>{APPLICATION_STATUS_LABELS[s]}</span>
                {s === status && <Check className="h-3.5 w-3.5 text-primary-600" />}
              </button>
            ))}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <Link
                href="/student/applications"
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-1.5 text-primary-600 font-semibold"
              >
                <span>View in Application Board</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant="outline"
        onClick={() => handleTrack("SAVED")}
        isLoading={isPending}
        className="w-full border-primary-300 text-primary-700 hover:bg-primary-50"
        leftIcon={<Bookmark className="h-4 w-4" />}
      >
        Track Application
      </Button>
    </div>
  );
}
