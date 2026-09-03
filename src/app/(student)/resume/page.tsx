import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ResumeUploader } from "@/components/resume/resume-uploader";
import { ResumeList } from "@/components/resume/resume-list";
import { resumesDAL } from "@/dal/resumes";
import { FileText } from "lucide-react";

export default async function ResumePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const resumes = await resumesDAL.findUserResumes(session.user.id);
  const activeResume = resumes.find((r) => r.isActive);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Resume Management"
        description="Upload and manage your resumes for automated job matching, ATS checks, and tailored interview prep."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Resume" },
        ]}
      />

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Resume</CardTitle>
          <CardDescription>
            Supported formats: PDF, DOCX (Max 5MB). New uploads automatically extract text and become your active resume.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResumeUploader />
        </CardContent>
      </Card>

      {/* Resumes List Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Resumes</CardTitle>
            <CardDescription>
              {activeResume
                ? `Active version: ${activeResume.fileName} (v${activeResume.version})`
                : "No active resume selected."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {resumes.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6 text-primary-500" />}
              title="No resumes uploaded yet"
              description="Upload your first resume above to begin calculating job match scores and generating practice questions."
            />
          ) : (
            <ResumeList resumes={resumes} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
