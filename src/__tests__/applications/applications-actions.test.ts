import { describe, it, expect, vi, beforeEach } from "vitest";

// 1. Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// 2. Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// 3. Mock DAL & matching
let mockStore: any[] = [];
let nextId = 1;

vi.mock("@/dal/applications", () => ({
  applicationsDAL: {
    getApplicationByJobId: vi.fn(async (userId: string, jobId: string) => {
      return mockStore.find((a) => a.userId === userId && a.jobId === jobId) || null;
    }),
    createApplication: vi.fn(async (params) => {
      const existing = mockStore.find(
        (a) => a.userId === params.userId && a.jobId === params.jobId
      );
      if (existing) {
        throw new Error("You have already added this job to your applications.");
      }
      const app = {
        id: `app-${nextId++}`,
        ...params,
        status: params.status || "SAVED",
        job: { id: params.jobId, title: "Backend Engineer", companyName: "Stripe" },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStore.push(app);
      return app;
    }),
    getUserApplications: vi.fn(async (userId: string) => {
      return mockStore.filter((a) => a.userId === userId);
    }),
    getApplicationById: vi.fn(async (id: string, userId: string) => {
      return mockStore.find((a) => a.id === id && a.userId === userId) || null;
    }),
    updateApplicationStatus: vi.fn(async (id: string, userId: string, status: string) => {
      const app = mockStore.find((a) => a.id === id && a.userId === userId);
      if (!app) throw new Error("Application not found or you do not have permission to modify it.");
      app.status = status;
      return app;
    }),
    updateApplicationNotes: vi.fn(async (id: string, userId: string, notes: string | null) => {
      const app = mockStore.find((a) => a.id === id && a.userId === userId);
      if (!app) throw new Error("Application not found or you do not have permission to modify it.");
      app.notes = notes;
      return app;
    }),
    deleteApplication: vi.fn(async (id: string, userId: string) => {
      const idx = mockStore.findIndex((a) => a.id === id && a.userId === userId);
      if (idx === -1) throw new Error("Application not found or you do not have permission to delete it.");
      mockStore.splice(idx, 1);
      return { success: true };
    }),
    getApplicationStats: vi.fn(async (userId: string) => {
      const userApps = mockStore.filter((a) => a.userId === userId);
      return {
        total: userApps.length,
        saved: userApps.filter((a) => a.status === "SAVED").length,
        applied: userApps.filter((a) => a.status === "APPLIED").length,
        shortlisted: userApps.filter((a) => a.status === "SHORTLISTED").length,
        interview: userApps.filter((a) => a.status === "INTERVIEW").length,
        offer: userApps.filter((a) => a.status === "OFFER").length,
        rejected: userApps.filter((a) => a.status === "REJECTED").length,
      };
    }),
  },
}));

vi.mock("@/dal/resumes", () => ({
  resumesDAL: {
    findActiveResume: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("@/dal/jobs", () => ({
  jobsDAL: {
    getJobById: vi.fn().mockResolvedValue(null),
  },
}));

import { auth } from "@/lib/auth";
import {
  createApplicationAction,
  trackJobAction,
  getUserApplicationsAction,
  getApplicationAction,
  updateApplicationStatusAction,
  updateApplicationNotesAction,
  deleteApplicationAction,
  getApplicationStatsAction,
} from "@/actions/applications";

describe("Application Server Actions", () => {
  beforeEach(() => {
    mockStore = [];
    nextId = 1;
    vi.clearAllMocks();
  });

  describe("Authentication & Security", () => {
    it("rejects createApplicationAction when user is unauthenticated", async () => {
      (auth as any).mockResolvedValue(null);

      const res = await createApplicationAction({ jobId: "job-1", status: "SAVED" });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized/i);
    });

    it("rejects trackJobAction when user is unauthenticated", async () => {
      (auth as any).mockResolvedValue(null);

      const res = await trackJobAction("job-1");
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized/i);
    });

    it("rejects updateApplicationStatusAction when user is unauthenticated", async () => {
      (auth as any).mockResolvedValue(null);

      const res = await updateApplicationStatusAction({
        applicationId: "app-1",
        status: "APPLIED",
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized/i);
    });

    it("rejects deleteApplicationAction when user is unauthenticated", async () => {
      (auth as any).mockResolvedValue(null);

      const res = await deleteApplicationAction({ applicationId: "app-1" });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized/i);
    });
  });

  describe("Input Validation (Zod)", () => {
    beforeEach(() => {
      (auth as any).mockResolvedValue({
        user: { id: "user-1", email: "student@test.com", role: "STUDENT" },
      });
    });

    it("rejects application creation with empty jobId", async () => {
      const res = await createApplicationAction({ jobId: "", status: "SAVED" });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Job ID is required/i);
    });

    it("rejects application status update with invalid enum value", async () => {
      const res = await updateApplicationStatusAction({
        applicationId: "app-1",
        status: "INVALID_STATUS" as any,
      });
      expect(res.success).toBe(false);
      expect(res.error).toBeTruthy();
    });

    it("rejects application creation with notes exceeding 2000 chars", async () => {
      const res = await createApplicationAction({
        jobId: "job-1",
        status: "SAVED",
        notes: "a".repeat(2001),
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/cannot exceed 2000 characters/i);
    });
  });

  describe("Ownership Protection", () => {
    it("prevents Student B from modifying Student A's application", async () => {
      // Create Student A's application directly in store
      mockStore.push({
        id: "app-A",
        userId: "user-A",
        jobId: "job-1",
        status: "SAVED",
      });

      // Login as Student B
      (auth as any).mockResolvedValue({
        user: { id: "user-B", email: "studentB@test.com", role: "STUDENT" },
      });

      const res = await updateApplicationStatusAction({
        applicationId: "app-A",
        status: "INTERVIEW",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/permission/i);
    });

    it("prevents Student B from deleting Student A's application", async () => {
      mockStore.push({
        id: "app-A",
        userId: "user-A",
        jobId: "job-1",
        status: "SAVED",
      });

      (auth as any).mockResolvedValue({
        user: { id: "user-B", email: "studentB@test.com", role: "STUDENT" },
      });

      const res = await deleteApplicationAction({ applicationId: "app-A" });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/permission/i);
      expect(mockStore).toHaveLength(1);
    });
  });

  describe("Track Job Integration Flow", () => {
    beforeEach(() => {
      (auth as any).mockResolvedValue({
        user: { id: "user-1", email: "student@test.com", role: "STUDENT" },
      });
    });

    it("tracks a new job successfully", async () => {
      const res = await trackJobAction("job-99", "SAVED");
      expect(res.success).toBe(true);
      expect(res.alreadyTracked).toBe(false);
      expect(res.data?.jobId).toBe("job-99");
      expect(res.data?.status).toBe("SAVED");
    });

    it("returns alreadyTracked: true when tracking an already tracked job", async () => {
      await trackJobAction("job-99", "SAVED");
      const res2 = await trackJobAction("job-99", "APPLIED");

      expect(res2.success).toBe(true);
      expect(res2.alreadyTracked).toBe(true);
      expect(mockStore).toHaveLength(1); // Did not duplicate
    });
  });

  describe("Statistics Action", () => {
    it("returns stats for authenticated user", async () => {
      mockStore.push(
        { id: "app-1", userId: "user-1", jobId: "j1", status: "SAVED" },
        { id: "app-2", userId: "user-1", jobId: "j2", status: "APPLIED" },
        { id: "app-3", userId: "user-2", jobId: "j3", status: "SAVED" }
      );

      (auth as any).mockResolvedValue({
        user: { id: "user-1", email: "student@test.com", role: "STUDENT" },
      });

      const res = await getApplicationStatsAction();
      expect(res.success).toBe(true);
      expect(res.data?.total).toBe(2);
      expect(res.data?.saved).toBe(1);
      expect(res.data?.applied).toBe(1);
    });
  });
});
