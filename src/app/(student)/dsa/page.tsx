import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { dsaService } from "@/services/dsa/dsa-service";
import { DSAProgressOverviewCard } from "@/components/dsa/dsa-progress-overview";
import { DSARecommendedCard } from "@/components/dsa/dsa-recommended-card";
import { DSARoadmap } from "@/components/dsa/dsa-roadmap";
import { DSATopicSection } from "@/components/dsa/dsa-topic-section";

export default async function DSAPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const dashboardData = await dsaService.getDashboardData(session.user.id);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Personalized DSA Preparation"
        description="Targeted algorithmic problem sets prioritized by your verified profile, target role, and identified skill gaps."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "DSA Practice" },
        ]}
      />

      {/* Hero Recommendation */}
      <DSARecommendedCard
        recommendation={dashboardData.recommendedQuestion}
      />

      {/* Top Grid: Overview & Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <DSAProgressOverviewCard overview={dashboardData.overview} />
        </div>
        <div className="lg:col-span-2">
          <DSARoadmap roadmap={dashboardData.roadmap} />
        </div>
      </div>

      {/* Topic Selection & Question Bank */}
      <DSATopicSection
        topics={dashboardData.overview.topicsProgress}
        questions={dashboardData.allQuestions}
      />
    </div>
  );
}
