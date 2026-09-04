import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { jobsDAL } from "@/dal/jobs";
import { resumesDAL } from "@/dal/resumes";
import { applicationsDAL } from "@/dal/applications";
import { resumeJobService } from "@/services/resume-analysis/resume-job-service";
import { ResumeJobAnalysis } from "@/components/jobs/resume-job-analysis";
import { TrackApplicationButton } from "@/components/jobs/track-application-button";
import { JobDescription } from "@/components/jobs/job-description";
import { formatDate } from "@/lib/utils";
import {
  MapPin,
  Building2,
  Briefcase,
  GraduationCap,
  Globe,
  Clock,
  ExternalLink,
  ArrowLeft,
  Tag,
  CalendarDays,
} from "lucide-react";

// ─── Label Maps ───

const WORK_MODE_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "Onsite",
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  FRESHER: "Fresher",
  JUNIOR: "Junior",
  MID: "Mid-level",
  SENIOR: "Senior",
  LEAD: "Lead",
};

const WORK_MODE_VARIANTS: Record<
  string,
  "success" | "info" | "warning" | "secondary"
> = {
  REMOTE: "success",
  HYBRID: "info",
  ONSITE: "warning",
};

// ─── Helpers ───

function formatSalary(
  min?: number | null,
  max?: number | null,
  currency?: string | null
): string | null {
  if (!min && !max) return null;
  const curr = currency || "INR";
  const formatNum = (n: number) => {
    if (curr === "INR") {
      if (n >= 100000)
        return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
      if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
      return `₹${n}`;
    }
    return `${curr} ${n.toLocaleString()}`;
  };
  if (min && max) return `${formatNum(min)} – ${formatNum(max)}`;
  if (min) return `${formatNum(min)}+`;
  if (max) return `Up to ${formatNum(max)}`;
  return null;
}

// ─── Page Props ───

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

// ─── Component ───

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const { id } = await params;

  const [job, analysis, activeResume, existingApplication] = await Promise.all([
    jobsDAL.getJobById(id),
    resumeJobService.analyzeResumeAgainstJob(userId, id),
    resumesDAL.findActiveResume(userId),
    applicationsDAL.getApplicationByJobId(userId, id),
  ]);

  if (!job) {
    notFound();
  }

  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const requiredSkills = job.jobSkills.filter((js) => js.isRequired);
  const preferredSkills = job.jobSkills.filter((js) => !js.isRequired);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={job.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Jobs", href: "/student/jobs" },
          { label: job.title },
        ]}
        actions={
          <Link href="/student/jobs">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Jobs
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company & Meta */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {job.companyName}
                  </h2>
                  {job.company?.website && (
                    <a
                      href={job.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      {new URL(job.company.website).hostname}
                    </a>
                  )}
                </div>
              </div>

              {/* Meta badges */}
              <div className="flex flex-wrap gap-2">
                {job.workMode && (
                  <Badge
                    variant={WORK_MODE_VARIANTS[job.workMode] ?? "secondary"}
                  >
                    {WORK_MODE_LABELS[job.workMode]}
                  </Badge>
                )}
                {job.employmentType && (
                  <Badge variant="secondary">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                  </Badge>
                )}
                {job.experienceLevel && (
                  <Badge variant="secondary">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}
                  </Badge>
                )}
                {job.location && (
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    {job.location}
                  </Badge>
                )}
              </div>

              {/* Salary */}
              {salary && (
                <div className="mt-4 p-3 rounded-lg bg-primary-50 border border-primary-100">
                  <p className="text-sm font-semibold text-primary-800">
                    {salary}
                    {job.salaryCurrency && job.salaryCurrency !== "INR" && (
                      <span className="text-xs font-normal text-primary-600 ml-1">
                        ({job.salaryCurrency})
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
                {job.postedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Posted {formatDate(job.postedAt)}
                  </span>
                )}
                {job.expiresAt && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Expires {formatDate(job.expiresAt)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resume vs Job Analysis & Skill Gap Analysis Section */}
          <ResumeJobAnalysis
            analysis={analysis}
            hasActiveResume={Boolean(activeResume)}
          />

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <JobDescription content={job.description} />
            </CardContent>
          </Card>

          {/* Skills */}
          {job.jobSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {requiredSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Required
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {requiredSkills.map((js) => (
                        <Badge key={js.id} variant="default">
                          {js.skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {preferredSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Preferred
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {preferredSkills.map((js) => (
                        <Badge key={js.id} variant="secondary">
                          {js.skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Apply Card */}
          <Card className="border-primary-200 bg-primary-50/30">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Interested in this role?
              </h3>
              {job.applicationUrl ? (
                <a
                  href={job.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    className="w-full"
                    rightIcon={<ExternalLink className="h-4 w-4" />}
                  >
                    Apply on Company Site
                  </Button>
                </a>
              ) : (
                <Button className="w-full" disabled>
                  Application Link Unavailable
                </Button>
              )}

              <TrackApplicationButton
                jobId={job.id}
                initialStatus={existingApplication?.status}
                initialApplicationId={existingApplication?.id}
              />

              <p className="text-[11px] text-gray-500 text-center">
                You will be redirected to the company&apos;s application page
              </p>
            </CardContent>
          </Card>

          {/* Source Info */}
          <Card>
            <CardContent className="p-5">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Source
              </h4>
              <p className="text-sm text-gray-700 capitalize">
                {job.source.name === "mock" ? "JobFit Demo" : job.source.name}
              </p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">
                via {job.source.type}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
