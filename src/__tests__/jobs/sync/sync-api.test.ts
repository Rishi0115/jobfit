import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks before importing the route
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const mockRunSync = vi.fn();

vi.mock("@/services/jobs/sync/job-sync-service", () => ({
  JobSyncService: vi.fn().mockImplementation(() => ({
    runSync: mockRunSync,
  })),
}));

import { auth } from "@/lib/auth";
import { POST } from "@/app/api/jobs/sync/route";

describe("POST /api/jobs/sync (Manual Sync Endpoint)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 Unauthorized for unauthenticated requests", async () => {
    (auth as any).mockResolvedValue(null);

    const req = new Request("http://localhost/api/jobs/sync", {
      method: "POST",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toMatch(/Unauthorized/i);
    expect(mockRunSync).not.toHaveBeenCalled();
  });

  it("returns 403 Forbidden for non-admin authenticated users (e.g. STUDENT)", async () => {
    (auth as any).mockResolvedValue({
      user: {
        id: "student-1",
        email: "student@example.com",
        role: "STUDENT",
      },
    });

    const req = new Request("http://localhost/api/jobs/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "ADMIN" }), // client-supplied spoof attempt
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toMatch(/Forbidden/i);
    expect(mockRunSync).not.toHaveBeenCalled();
  });

  it("returns 403 Forbidden for RECRUITER users", async () => {
    (auth as any).mockResolvedValue({
      user: {
        id: "recruiter-1",
        email: "recruiter@example.com",
        role: "RECRUITER",
      },
    });

    const req = new Request("http://localhost/api/jobs/sync", {
      method: "POST",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(mockRunSync).not.toHaveBeenCalled();
  });

  it("allows authenticated ADMIN users to trigger sync and returns SyncReport", async () => {
    (auth as any).mockResolvedValue({
      user: {
        id: "admin-1",
        email: "admin@jobfit.dev",
        role: "ADMIN",
      },
    });

    const mockReport = {
      totalProviders: 2,
      successfulProviders: 2,
      failedProviders: 0,
      providerStats: [
        {
          provider: "remotive",
          status: "success",
          fetched: 10,
          valid: 10,
          invalid: 0,
          created: 8,
          updated: 2,
          skipped: 0,
          failed: 0,
          errors: [],
        },
      ],
      totalFetched: 10,
      totalValid: 10,
      totalInvalid: 0,
      totalCreated: 8,
      totalUpdated: 2,
      totalSkipped: 0,
      totalFailed: 0,
    };

    mockRunSync.mockResolvedValue(mockReport);

    const req = new Request("http://localhost/api/jobs/sync", {
      method: "POST",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.totalProviders).toBe(2);
    expect(data.totalCreated).toBe(8);
    expect(mockRunSync).toHaveBeenCalledTimes(1);
  });

  it("prevents accidental concurrent syncs and returns 409 Conflict", async () => {
    (auth as any).mockResolvedValue({
      user: {
        id: "admin-1",
        email: "admin@jobfit.dev",
        role: "ADMIN",
      },
    });

    // Simulate an ongoing long sync
    let resolveFirstSync: () => void = () => {};
    mockRunSync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFirstSync = () =>
            resolve({
              totalProviders: 1,
              successfulProviders: 1,
              failedProviders: 0,
              providerStats: [],
              totalFetched: 0,
              totalValid: 0,
              totalInvalid: 0,
              totalCreated: 0,
              totalUpdated: 0,
              totalSkipped: 0,
              totalFailed: 0,
            });
        })
    );

    const req1 = new Request("http://localhost/api/jobs/sync", { method: "POST" });
    const req2 = new Request("http://localhost/api/jobs/sync", { method: "POST" });

    // Start first sync
    const promise1 = POST(req1);

    // Immediately trigger second sync
    const res2 = await POST(req2);
    const data2 = await res2.json();

    expect(res2.status).toBe(409);
    expect(data2.error).toMatch(/already in progress/i);

    // Complete first sync
    resolveFirstSync();
    const res1 = await promise1;
    expect(res1.status).toBe(200);
  });
});
