import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { JobCard, JobCardSkeleton } from "@/components/jobs/job-card";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobSearch } from "@/components/jobs/job-search";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { jobsDAL } from "@/dal/jobs";
import type {
  JobFilters as JobFiltersType,
  PaginationOptions,
  JobSortOptions,
  NormalizedWorkMode,
  NormalizedEmploymentType,
  NormalizedExperienceLevel,
} from "@/types/job";
import { Briefcase, ChevronLeft, ChevronRight, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { matchingService } from "@/services/matching";
import { TopMatchesSection } from "@/components/jobs/top-matches-section";

// ─── Page Props ───

interface JobsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// ─── Server Component ───

export default async function StudentJobsPage({
  searchParams,
}: JobsPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const params = await searchParams;

  // Parse filters from URL search params
  const filters: JobFiltersType = {
    status: "ACTIVE",
    search: typeof params.search === "string" ? params.search : undefined,
    workMode: isValidWorkMode(params.workMode)
      ? (params.workMode as NormalizedWorkMode)
      : undefined,
    employmentType: isValidEmploymentType(params.employmentType)
      ? (params.employmentType as NormalizedEmploymentType)
      : undefined,
    experienceLevel: isValidExperienceLevel(params.experienceLevel)
      ? (params.experienceLevel as NormalizedExperienceLevel)
      : undefined,
  };

  const page = Math.max(
    1,
    parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1
  );
  const pagination: PaginationOptions = { page, pageSize: 12 };
  const sort: JobSortOptions = { field: "postedAt", direction: "desc" };

  const [result, topMatches] = await Promise.all([
    jobsDAL.listJobs(filters, pagination, sort),
    page === 1 && !filters.search
      ? matchingService.getTopMatches(userId, 3)
      : Promise.resolve([]),
  ]);

  const jobMatches = await matchingService.getMatchesForJobs(
    userId,
    result.data
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description="Discover opportunities that match your skills and experience"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Jobs" },
        ]}
        actions={
          <Badge variant="secondary" className="text-xs">
            {result.total} {result.total === 1 ? "job" : "jobs"} found
          </Badge>
        }
      />

      {/* Top Matches Banner (shown on page 1 when available) */}
      {topMatches.length > 0 && (
        <TopMatchesSection matches={topMatches} />
      )}

      {/* Search */}
      <Suspense>
        <JobSearch />
      </Suspense>

      {/* Filters */}
      <Suspense>
        <JobFilters />
      </Suspense>

      {/* Job List */}
      {result.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {result.data.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                match={jobMatches.get(job.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <Pagination
              currentPage={result.page}
              totalPages={result.totalPages}
              hasNextPage={result.hasNextPage}
              hasPreviousPage={result.hasPreviousPage}
              searchParams={params}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={<Briefcase className="h-6 w-6" />}
          title="No jobs found"
          description={
            filters.search ||
            filters.workMode ||
            filters.employmentType ||
            filters.experienceLevel
              ? "No jobs match your current filters. Try adjusting your search or clearing filters."
              : "No jobs are available at the moment. Check back later!"
          }
        />
      )}
    </div>
  );
}

// ─── Pagination Component ───

function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") {
        params.set(key, Array.isArray(value) ? value[0] : value);
      }
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/student/jobs?${qs}` : "/student/jobs";
  };

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      {hasPreviousPage ? (
        <Link href={buildPageUrl(currentPage - 1)}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Previous
          </Button>
        </Link>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled
          leftIcon={<ChevronLeft className="h-4 w-4" />}
        >
          Previous
        </Button>
      )}

      <span className="text-sm text-gray-500 px-3">
        Page {currentPage} of {totalPages}
      </span>

      {hasNextPage ? (
        <Link href={buildPageUrl(currentPage + 1)}>
          <Button
            variant="outline"
            size="sm"
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Next
          </Button>
        </Link>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          Next
        </Button>
      )}
    </div>
  );
}

// ─── Validation Helpers ───

function isValidWorkMode(value: unknown): value is NormalizedWorkMode {
  return (
    typeof value === "string" && ["REMOTE", "HYBRID", "ONSITE"].includes(value)
  );
}

function isValidEmploymentType(
  value: unknown
): value is NormalizedEmploymentType {
  return (
    typeof value === "string" &&
    ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"].includes(value)
  );
}

function isValidExperienceLevel(
  value: unknown
): value is NormalizedExperienceLevel {
  return (
    typeof value === "string" &&
    ["FRESHER", "JUNIOR", "MID", "SENIOR", "LEAD"].includes(value)
  );
}
