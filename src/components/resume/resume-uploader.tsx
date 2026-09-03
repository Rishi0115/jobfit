"use client";

import * as React from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RESUME_LIMITS } from "@/lib/constants";
import { uploadResumeAction } from "@/actions/resume";
import { cn } from "@/lib/utils";

export interface ResumeUploaderProps {
  onUploadSuccess?: () => void;
  className?: string;
}

export function ResumeUploader({
  onUploadSuccess,
  className,
}: ResumeUploaderProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);

  function validateClientFile(file: File): string | null {
    if (file.size > RESUME_LIMITS.MAX_FILE_SIZE_BYTES) {
      return `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 5MB limit.`;
    }

    const name = file.name.toLowerCase();
    const isAllowedExt = RESUME_LIMITS.ALLOWED_EXTENSIONS.some((ext) =>
      name.endsWith(ext)
    );

    if (!isAllowedExt) {
      return "Only PDF and DOCX documents are supported.";
    }

    return null;
  }

  function handleFileSelect(file: File) {
    setError(null);
    setSuccess(null);

    const validationError = validateClientFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await uploadResumeAction(formData);

      if (!response.success) {
        setError(typeof response.error === "string" ? response.error : "Failed to process resume.");
        return;
      }

      setSuccess(`Resume "${selectedFile.name}" uploaded and processed successfully!`);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onUploadSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload file.";
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all",
          dragActive
            ? "border-primary-500 bg-primary-50/50"
            : "border-gray-300 bg-gray-50/50 hover:bg-gray-100/50 hover:border-gray-400"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 mb-3">
          <UploadCloud className="h-6 w-6" />
        </div>

        <h4 className="text-sm font-semibold text-gray-900">
          Click to upload or drag and drop
        </h4>
        <p className="mt-1 text-xs text-gray-500">
          PDF or DOCX documents up to 5MB
        </p>
      </div>

      {/* Selected File Details & Upload Action */}
      {selectedFile && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-xs">
          <div className="flex items-center space-x-3 truncate">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                setSelectedFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              disabled={isUploading}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
            <Button
              size="sm"
              onClick={handleUpload}
              isLoading={isUploading}
            >
              {isUploading ? "Processing…" : "Upload Resume"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
