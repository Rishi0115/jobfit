import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { resumesDAL } from "@/dal/resumes";
import { jobsDAL } from "@/dal/jobs";
import { applicationsDAL } from "@/dal/applications";
import { MockInterviewSetup } from "@/components/interview/mock-interview-setup";

export const metadata = {
  title: "Setup AI Mock Interview | JobFit",
  description: "Configure and start your AI-powered technical and behavioral mock interview.",
};

interface SetupPageProps {
  searchParams: Promise<{ jobId?: string; mode?: "RESUME" | "JOB" | "MIXED" }>;
}

export default async function MockInterviewSetupPage({
  searchParams,
}: SetupPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const { jobId, mode } = await searchParams;

  const [activeResume, jobsResult, applications] = await Promise.all([
    resumesDAL.findActiveResume(userId),
    jobsDAL.listJobs(undefined, { page: 1, pageSize: 20 }),
    applicationsDAL.getUserApplications(userId),
  ]);

  // Combine tracked applications and active repository jobs for rich selection
  const jobMap = new Map<string, { id: string; title: string; companyName: string }>();

  for (const app of applications) {
    if (app.job) {
      jobMap.set(app.job.id, {
        id: app.job.id,
        title: app.job.title,
        companyName: app.job.companyName,
      });
    }
  }

  for (const j of jobsResult.data) {
    if (!jobMap.has(j.id)) {
      jobMap.set(j.id, {
        id: j.id,
        title: j.title,
        companyName: j.company?.name || "Company",
      });
    }
  }

  const availableJobs = Array.from(jobMap.values());

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="AI Mock Interview Setup"
        description="Select your interview mode, target role, and difficulty level. JobFit's interviewer generates high-signal questions strictly grounded in reality."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Mock Interview" },
        ]}
      />

      <MockInterviewSetup
        availableJobs={availableJobs}
        hasActiveResume={Boolean(activeResume)}
        activeResumeName={activeResume?.fileName}
        defaultJobId={jobId}
        defaultMode={mode || "RESUME"}
      />
    </div>
  );
}
