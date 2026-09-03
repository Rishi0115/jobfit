import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { resumesDAL } from "@/dal/resumes";
import { FileText, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = session.user as { name?: string; role?: string; id?: string };
  const activeResume = await resumesDAL.findActiveResume(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user.name ?? "Student"}`}
        description="Your AI-powered career assistant overview"
        actions={
          <Badge variant="success" className="px-3 py-1 text-xs">
            <Sparkles className="mr-1 h-3 w-3" /> Account Active
          </Badge>
        }
      />

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverable>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Current Role
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-gray-900 capitalize">
              {(user.role ?? "STUDENT").toLowerCase()}
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Active Resume
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            {activeResume ? (
              <div className="truncate pr-2">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {activeResume.fileName}
                </p>
                <p className="text-xs text-gray-500">Version {activeResume.version}</p>
              </div>
            ) : (
              <span className="text-sm text-gray-400 font-medium">None uploaded</span>
            )}
            {activeResume ? (
              <Badge variant="success" className="gap-1 shrink-0">
                <CheckCircle2 className="h-3 w-3" /> Active
              </Badge>
            ) : (
              <Link href="/resume">
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Upload
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Top Matches
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span className="text-sm text-gray-400 font-medium">0 Matches</span>
            <Badge variant="outline">Phase 5</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started or Resume Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Career Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {activeResume ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-6">
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">
                    Active Resume: {activeResume.fileName}
                  </h4>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Text extracted and saved. Ready for deterministic job matching (Phase 5) and AI skill analysis (Phase 7).
                  </p>
                </div>
              </div>
              <Link href="/resume" className="shrink-0 self-end sm:self-center">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Manage Resumes
                </Button>
              </Link>
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="h-6 w-6 text-primary-600" />}
              title="Upload your resume to start job matching"
              description="Upload your resume (PDF or DOCX) to automatically extract your skills and get matched with top developer jobs."
              actionLabel="Upload Resume"
              onAction={() => {}}
              actionHref="/resume"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
