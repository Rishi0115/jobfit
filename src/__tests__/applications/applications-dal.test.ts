import { describe, it, expect, vi, beforeEach } from "vitest";
import { applicationsDAL } from "@/dal/applications";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_ORDER,
} from "@/types/application";
import type { ApplicationStatus } from "@prisma/client";

// In-memory mock database store
let applicationsStore: any[] = [];
let nextId = 1;

vi.mock("@/lib/db", () => {
  return {
    db: {
      application: {
        findUnique: vi.fn(async ({ where }) => {
          if (where.userId_jobId) {
            return (
              applicationsStore.find(
                (a) =>
                  a.userId === where.userId_jobId.userId &&
                  a.jobId === where.userId_jobId.jobId
              ) || null
            );
          }
          if (where.id) {
            return applicationsStore.find((a) => a.id === where.id) || null;
          }
          return null;
        }),

        findFirst: vi.fn(async ({ where }) => {
          return (
            applicationsStore.find((a) => {
              for (const [key, val] of Object.entries(where)) {
                if (a[key] !== val) return false;
              }
              return true;
            }) || null
          );
        }),

        findMany: vi.fn(async ({ where }) => {
          return applicationsStore.filter((a) => {
            if (where.userId && a.userId !== where.userId) return false;
            if (where.status && a.status !== where.status) return false;
            return true;
          });
        }),

        create: vi.fn(async ({ data }) => {
          const app = {
            id: `app-${nextId++}`,
            ...data,
            job: {
              id: data.jobId,
              title: "Software Engineer",
              companyName: "Acme Corp",
              location: "Bangalore",
              workMode: "HYBRID",
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          applicationsStore.push(app);
          return app;
        }),

        update: vi.fn(async ({ where, data }) => {
          const idx = applicationsStore.findIndex((a) => a.id === where.id);
          if (idx === -1) throw new Error("Record not found");
          const updated = {
            ...applicationsStore[idx],
            ...data,
            updatedAt: new Date(),
          };
          applicationsStore[idx] = updated;
          return updated;
        }),

        delete: vi.fn(async ({ where }) => {
          const idx = applicationsStore.findIndex((a) => a.id === where.id);
          if (idx === -1) throw new Error("Record not found");
          const deleted = applicationsStore.splice(idx, 1)[0];
          return deleted;
        }),

        groupBy: vi.fn(async ({ where }) => {
          const userApps = applicationsStore.filter(
            (a) => a.userId === where.userId
          );
          const counts: Record<string, number> = {};
          for (const app of userApps) {
            counts[app.status] = (counts[app.status] || 0) + 1;
          }
          return Object.entries(counts).map(([status, count]) => ({
            status,
            _count: { id: count },
          }));
        }),
      },
    },
  };
});

describe("Applications DAL", () => {
  beforeEach(() => {
    applicationsStore = [];
    nextId = 1;
    vi.clearAllMocks();
  });

  describe("createApplication", () => {
    it("creates an application with initial status and statusHistory", async () => {
      const app = await applicationsDAL.createApplication({
        userId: "user-1",
        jobId: "job-100",
        status: "SAVED",
        notes: "Found on Remotive",
      });

      expect(app.id).toBe("app-1");
      expect(app.userId).toBe("user-1");
      expect(app.jobId).toBe("job-100");
      expect(app.status).toBe("SAVED");
      expect(app.notes).toBe("Found on Remotive");
      expect(app.statusHistory).toHaveLength(1);
      expect(app.statusHistory![0].status).toBe("SAVED");
      expect(app.statusHistory![0].notes).toBe("Found on Remotive");
    });

    it("prevents duplicate applications for the same user and job", async () => {
      await applicationsDAL.createApplication({
        userId: "user-1",
        jobId: "job-100",
        status: "SAVED",
      });

      await expect(
        applicationsDAL.createApplication({
          userId: "user-1",
          jobId: "job-100",
          status: "APPLIED",
        })
      ).rejects.toThrow("already added this job to your applications");
    });

    it("automatically populates appliedAt when created with status APPLIED", async () => {
      const app = await applicationsDAL.createApplication({
        userId: "user-1",
        jobId: "job-200",
        status: "APPLIED",
      });

      expect(app.status).toBe("APPLIED");
      expect(app.appliedAt).toBeInstanceOf(Date);
    });
  });

  describe("Ownership Isolation", () => {
    it("prevents user A from viewing user B's application by ID", async () => {
      const appA = await applicationsDAL.createApplication({
        userId: "user-A",
        jobId: "job-100",
        status: "SAVED",
      });

      // User B tries to read User A's application
      const result = await applicationsDAL.getApplicationById(appA.id, "user-B");
      expect(result).toBeNull();
    });

    it("prevents user B from updating user A's application status", async () => {
      const appA = await applicationsDAL.createApplication({
        userId: "user-A",
        jobId: "job-100",
        status: "SAVED",
      });

      await expect(
        applicationsDAL.updateApplicationStatus(
          appA.id,
          "user-B",
          "INTERVIEW"
        )
      ).rejects.toThrow(/not have permission/i);
    });

    it("prevents user B from deleting user A's application", async () => {
      const appA = await applicationsDAL.createApplication({
        userId: "user-A",
        jobId: "job-100",
        status: "SAVED",
      });

      await expect(
        applicationsDAL.deleteApplication(appA.id, "user-B")
      ).rejects.toThrow(/not have permission/i);
    });
  });

  describe("Status Updates & History", () => {
    it("transitions through all valid ApplicationStatus enum values and appends to statusHistory", async () => {
      const app = await applicationsDAL.createApplication({
        userId: "user-1",
        jobId: "job-1",
        status: "SAVED",
      });

      const statusesToTest: ApplicationStatus[] = [
        "APPLIED",
        "SHORTLISTED",
        "INTERVIEW",
        "OFFER",
        "REJECTED",
      ];

      for (const nextStatus of statusesToTest) {
        const updated = await applicationsDAL.updateApplicationStatus(
          app.id,
          "user-1",
          nextStatus,
          `Moved to ${nextStatus}`
        );
        expect(updated.status).toBe(nextStatus);
      }

      // Verify statusHistory records all transitions
      const final = await applicationsDAL.getApplicationById(app.id, "user-1");
      expect(final!.statusHistory).toHaveLength(6); // 1 initial + 5 updates
      expect(final!.statusHistory![1].status).toBe("APPLIED");
      expect(final!.statusHistory![2].status).toBe("SHORTLISTED");
      expect(final!.statusHistory![3].status).toBe("INTERVIEW");
      expect(final!.statusHistory![4].status).toBe("OFFER");
      expect(final!.statusHistory![5].status).toBe("REJECTED");
    });

    it("sets appliedAt when transitioning from SAVED to APPLIED", async () => {
      const app = await applicationsDAL.createApplication({
        userId: "user-1",
        jobId: "job-1",
        status: "SAVED",
      });
      expect(app.appliedAt).toBeNull();

      const updated = await applicationsDAL.updateApplicationStatus(
        app.id,
        "user-1",
        "APPLIED"
      );
      expect(updated.appliedAt).toBeInstanceOf(Date);
    });
  });

  describe("Status Mapping & Enum Verification", () => {
    it("maps SHORTLISTED enum strictly to Screening in the UI", () => {
      expect(APPLICATION_STATUS_LABELS.SHORTLISTED).toBe("Screening");
      expect(APPLICATION_STATUS_LABELS.SAVED).toBe("Saved");
      expect(APPLICATION_STATUS_LABELS.APPLIED).toBe("Applied");
      expect(APPLICATION_STATUS_LABELS.INTERVIEW).toBe("Interview");
      expect(APPLICATION_STATUS_LABELS.OFFER).toBe("Offer");
      expect(APPLICATION_STATUS_LABELS.REJECTED).toBe("Rejected");
    });

    it("verifies all 6 statuses are in APPLICATION_STATUS_ORDER", () => {
      expect(APPLICATION_STATUS_ORDER).toEqual([
        "SAVED",
        "APPLIED",
        "SHORTLISTED",
        "INTERVIEW",
        "OFFER",
        "REJECTED",
      ]);
    });
  });

  describe("Statistics Aggregation", () => {
    it("calculates accurate real counts for each status and total", async () => {
      await applicationsDAL.createApplication({ userId: "user-1", jobId: "j1", status: "SAVED" });
      await applicationsDAL.createApplication({ userId: "user-1", jobId: "j2", status: "SAVED" });
      await applicationsDAL.createApplication({ userId: "user-1", jobId: "j3", status: "APPLIED" });
      await applicationsDAL.createApplication({ userId: "user-1", jobId: "j4", status: "SHORTLISTED" });
      await applicationsDAL.createApplication({ userId: "user-1", jobId: "j5", status: "INTERVIEW" });
      await applicationsDAL.createApplication({ userId: "user-1", jobId: "j6", status: "OFFER" });
      await applicationsDAL.createApplication({ userId: "user-1", jobId: "j7", status: "REJECTED" });

      // Another user's apps (should not pollute user-1's stats)
      await applicationsDAL.createApplication({ userId: "user-2", jobId: "j8", status: "OFFER" });

      const stats = await applicationsDAL.getApplicationStats("user-1");

      expect(stats.total).toBe(7);
      expect(stats.saved).toBe(2);
      expect(stats.applied).toBe(1);
      expect(stats.shortlisted).toBe(1);
      expect(stats.interview).toBe(1);
      expect(stats.offer).toBe(1);
      expect(stats.rejected).toBe(1);
    });
  });

  describe("deleteApplication", () => {
    it("deletes the application record when requested by the owner", async () => {
      const app = await applicationsDAL.createApplication({
        userId: "user-1",
        jobId: "j1",
        status: "SAVED",
      });

      const res = await applicationsDAL.deleteApplication(app.id, "user-1");
      expect(res.success).toBe(true);

      const found = await applicationsDAL.getApplicationById(app.id, "user-1");
      expect(found).toBeNull();
    });
  });
});
