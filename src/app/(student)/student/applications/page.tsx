import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { applicationsDAL } from "@/dal/applications";
import { matchingService } from "@/services/matching/matching-service";
import { ApplicationBoard } from "@/components/applications/application-board";
import type { ApplicationWithJob } from "@/types/application";

export const metadata = {
  title: "Application Tracking | JobFit",
  description: "Track and organize your job applications across stages from saved to offers.",
};

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // 1. Fetch user's applications and live stats
  const [rawApplications, stats] = await Promise.all([
    applicationsDAL.getUserApplications(userId),
    applicationsDAL.getApplicationStats(userId),
  ]);

  const applications: ApplicationWithJob[] = [...rawApplications];

  // 2. Enrich with match scores using the existing Phase 6 matching engine
  try {
    for (const app of applications) {
      if (app.job) {
        const match = await matchingService.getJobMatch(userId, app.jobId);
        if (match) {
          app.matchScore = match.overallScore;
        }
      }
    }
  } catch {
    // Graceful fallback if matching calculation has an issue
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Application Tracker"
        description="Track and manage your job applications through every stage of the recruitment process."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Applications" },
        ]}
      />

      <ApplicationBoard
        initialApplications={applications}
        initialStats={stats}
      />
    </div>
  );
}
