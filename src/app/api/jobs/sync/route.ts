import { auth } from "@/lib/auth";
import { JobSyncService } from "@/services/jobs/sync/job-sync-service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Server-side module lock to prevent concurrent sync executions
let isSyncInProgress = false;

export async function POST(_req: Request) {
  // 1. Authenticate via server session (never trust client-supplied headers/body)
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized: Authentication required" },
      { status: 401 }
    );
  }

  // 2. Strict RBAC: only ADMIN is permitted
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Admin privileges required" },
      { status: 403 }
    );
  }

  // 3. Concurrency protection: prevent accidental overlapping sync runs
  if (isSyncInProgress) {
    return NextResponse.json(
      { error: "Conflict: Job synchronization is already in progress" },
      { status: 409 }
    );
  }

  isSyncInProgress = true;

  try {
    const syncService = new JobSyncService();
    const report = await syncService.runSync();
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error("[POST /api/jobs/sync] Sync execution failed:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error: Job sync encountered an unexpected failure",
      },
      { status: 500 }
    );
  } finally {
    isSyncInProgress = false;
  }
}
