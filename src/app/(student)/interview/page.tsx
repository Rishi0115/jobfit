import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { interviewDAL } from "@/dal/interview";
import { jobsDAL } from "@/dal/jobs";
import { InterviewHubClient } from "@/components/interview/interview-hub-client";

export default async function InterviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [pastSessions, activeJobs] = await Promise.all([
    interviewDAL.getUserSessions(session.user.id),
    jobsDAL.listJobs(undefined, { page: 1, pageSize: 10 }),
  ]);

  const availableJobs = activeJobs.data.map((j) => ({
    id: j.id,
    title: j.title,
    companyName: j.company?.name || "Company",
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="AI Interview Preparation"
        description="Practice realistic technical and behavioral interviews tailored to your verified background, with dynamic follow-up probing and immediate advisory feedback."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Interview Prep" },
        ]}
      />

      <InterviewHubClient
        pastSessions={pastSessions}
        availableJobs={availableJobs}
      />
    </div>
  );
}
