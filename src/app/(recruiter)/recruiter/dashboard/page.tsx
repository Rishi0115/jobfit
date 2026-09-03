import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Briefcase, Building2, Users } from "lucide-react";

export default async function RecruiterDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { name?: string; role?: string };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Recruiter Portal — ${user.name ?? "Recruiter"}`}
        description="Manage company postings, candidate pipelines, and candidate matches"
        actions={
          <Badge variant="purple" className="px-3 py-1 text-xs">
            Recruiter Account
          </Badge>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverable>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Posted Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">0</span>
            <Badge variant="outline">Phase 11</Badge>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Applicants
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">0</span>
            <Badge variant="outline">Phase 11</Badge>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span className="text-sm text-gray-400 font-medium">Unlinked</span>
            <Badge variant="outline">Phase 11</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recruiter Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Briefcase className="h-6 w-6 text-primary-600" />}
            title="Recruiter dashboard initialized"
            description="Recruiter job posting, candidate match reviewing, and applicant tracking features will be connected in Phase 11."
          />
        </CardContent>
      </Card>
    </div>
  );
}
