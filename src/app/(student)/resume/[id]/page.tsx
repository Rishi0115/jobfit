import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { resumesDAL } from "@/dal/resumes";
import { getResumeDownloadUrl } from "@/services/resume/storage";
import { formatDate } from "@/lib/utils";
import {
  FileText,
  Download,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
} from "lucide-react";

interface ResumeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResumeDetailPage({
  params,
}: ResumeDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const resume = await resumesDAL.findUserResumeById(id, session.user.id);

  if (!resume) {
    notFound();
  }

  let downloadUrl = "";
  try {
    downloadUrl = await getResumeDownloadUrl(resume.fileUrl);
  } catch {
    // signed URL generation failed or offline
  }

  const wordCount = resume.rawText
    ? resume.rawText.split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={resume.fileName}
        description={`Version ${resume.version} • Uploaded on ${formatDate(resume.createdAt)}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Resume", href: "/resume" },
          { label: `Version ${resume.version}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/resume">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back
              </Button>
            </Link>
            {downloadUrl && (
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" leftIcon={<Download className="h-4 w-4" />}>
                  Download
                </Button>
              </a>
            )}
          </div>
        }
      />

      {/* Status Banner */}
      {resume.status === "FAILED" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Processing Issue</AlertTitle>
          <AlertDescription>
            {resume.processingError || "Text extraction could not be completed for this file."}
          </AlertDescription>
        </Alert>
      )}

      {resume.status === "PROCESSING" && (
        <Alert variant="warning">
          <Clock className="h-4 w-4" />
          <AlertTitle>Processing Document</AlertTitle>
          <AlertDescription>
            Text extraction is currently running in the background.
          </AlertDescription>
        </Alert>
      )}

      {/* Metadata Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {resume.status === "READY" ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Ready
              </Badge>
            ) : resume.status === "PROCESSING" ? (
              <Badge variant="warning" className="gap-1">
                <Clock className="h-3 w-3" /> Processing
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" /> Failed
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Active State
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {resume.isActive ? (
              <Badge variant="default">Active for Matching</Badge>
            ) : (
              <Badge variant="outline">Archived Version</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              File Size
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-lg font-bold text-gray-900">
            {(resume.fileSize / (1024 * 1024)).toFixed(2)} MB
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Extracted Words
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-lg font-bold text-gray-900">
            {wordCount > 0 ? wordCount.toLocaleString() : "None"}
          </CardContent>
        </Card>
      </div>

      {/* Document Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Extraction Overview</CardTitle>
          <CardDescription>
            High-level summary of text extracted for downstream parsing and matching.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {resume.rawText ? "Text Parsed Successfully" : "No Extracted Text"}
                </p>
                <p className="text-xs text-gray-500">
                  {resume.rawText
                    ? `${wordCount} words ready for ATS scoring and skill gap analysis (Phase 7).`
                    : "The document could not be converted to plain text."}
                </p>
              </div>
            </div>
          </div>

          {resume.rawText && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Document Preview (First 400 characters)
              </p>
              <div className="rounded-lg border border-gray-200 bg-white p-4 font-mono text-xs text-gray-700 leading-relaxed max-h-48 overflow-auto whitespace-pre-wrap select-none">
                {resume.rawText.slice(0, 400)}
                {resume.rawText.length > 400 && "..."}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
