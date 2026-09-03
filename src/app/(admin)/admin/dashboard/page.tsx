import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Shield, Users, Building2, BarChart3 } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { name?: string; role?: string };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Admin Portal — ${user.name ?? "Admin"}`}
        description="Platform oversight, user management, and system analytics"
        actions={
          <Badge variant="destructive" className="px-3 py-1 text-xs">
            <Shield className="mr-1 h-3 w-3" /> Admin Access
          </Badge>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card hoverable>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">—</span>
            <Badge variant="outline">Phase 12</Badge>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Companies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">—</span>
            <Badge variant="outline">Phase 12</Badge>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Active Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">—</span>
            <Badge variant="outline">Phase 12</Badge>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              AI Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">—</span>
            <Badge variant="outline">Phase 12</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Shield className="h-6 w-6 text-error-600" />}
            title="Admin control panel initialized"
            description="User management, company verification, job moderation, and platform metrics will be connected in Phase 12."
          />
        </CardContent>
      </Card>
    </div>
  );
}
