"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Star,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  setActiveResumeAction,
  deleteResumeAction,
  getResumeDownloadUrlAction,
} from "@/actions/resume";
import { formatDate } from "@/lib/utils";
import { Resume } from "@prisma/client";

export interface ResumeListProps {
  resumes: Resume[];
  onActionComplete?: () => void;
}

export function ResumeList({ resumes, onActionComplete }: ResumeListProps) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = React.useState<Resume | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  async function handleSetActive(id: string) {
    setLoadingId(id);
    setActionError(null);
    try {
      const res = await setActiveResumeAction(id);
      if (!res.success) {
        setActionError(typeof res.error === "string" ? res.error : "Failed to set active resume.");
      } else {
        onActionComplete?.();
      }
    } catch {
      setActionError("An error occurred while updating active resume.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteCandidate) return;

    const id = deleteCandidate.id;
    setLoadingId(id);
    setActionError(null);

    try {
      const res = await deleteResumeAction(id);
      if (!res.success) {
        setActionError(typeof res.error === "string" ? res.error : "Failed to delete resume.");
      } else {
        setDeleteCandidate(null);
        onActionComplete?.();
      }
    } catch {
      setActionError("An error occurred while deleting resume.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDownload(id: string) {
    try {
      const res = await getResumeDownloadUrlAction(id);
      if (res.success && res.data?.downloadUrl) {
        window.open(res.data.downloadUrl, "_blank");
      } else {
        alert(res.error || "Could not generate download link.");
      }
    } catch {
      alert("Failed to download resume file.");
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "READY":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Ready
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" /> Processing
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" /> Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-3">
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 mb-2">
          {actionError}
        </div>
      )}

      {resumes.map((resume) => {
        const isLoading = loadingId === resume.id;

        return (
          <div
            key={resume.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border p-4 transition-all gap-4 ${
              resume.isActive
                ? "border-primary-300 bg-primary-50/20 shadow-xs"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            {/* Resume Info */}
            <div className="flex items-start space-x-3 truncate">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  resume.isActive
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <FileText className="h-5 w-5" />
              </div>

              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {resume.fileName}
                  </h4>
                  {resume.isActive && (
                    <Badge variant="default" className="text-[10px] font-bold">
                      Active Resume
                    </Badge>
                  )}
                  {getStatusBadge(resume.status)}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>Version {resume.version}</span>
                  <span>•</span>
                  <span>{(resume.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                  <span>•</span>
                  <span>Uploaded {formatDate(resume.createdAt)}</span>
                </div>

                {resume.processingError && (
                  <p className="mt-1 text-xs text-error-600 truncate">
                    Error: {resume.processingError}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <Link href={`/resume/${resume.id}`}>
                <Button variant="ghost" size="sm" title="View details">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(resume.id)}
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </Button>

              {!resume.isActive && resume.status === "READY" && (
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isLoading}
                  onClick={() => handleSetActive(resume.id)}
                >
                  <Star className="mr-1.5 h-3.5 w-3.5" />
                  Set Active
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => setDeleteCandidate(resume)}
                title="Delete resume"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteCandidate}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
      >
        <DialogHeader>
          <DialogTitle>Delete Resume</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{deleteCandidate?.fileName}&quot;?
            This will remove the file from storage and delete all extracted text.
            {deleteCandidate?.isActive && (
              <span className="block mt-2 font-medium text-amber-700">
                Note: This is currently your active resume. Another available resume will become active if available.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDeleteCandidate(null)}
            disabled={!!loadingId}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
            isLoading={loadingId === deleteCandidate?.id}
          >
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
