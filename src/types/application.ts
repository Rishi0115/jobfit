import type { ApplicationStatus, Prisma } from "@prisma/client";

export type { ApplicationStatus };

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  timestamp: string; // ISO string
  notes?: string;
}

export interface ApplicationWithJob {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  notes: string | null;
  interviewDate: Date | null;
  appliedAt: Date | null;
  statusHistory: StatusHistoryEntry[] | null;
  createdAt: Date;
  updatedAt: Date;
  matchScore?: number | null;
  job: {
    id: string;
    title: string;
    companyName: string;
    location: string | null;
    workMode: string | null;
    employmentType: string | null;
    experienceLevel: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    applicationUrl: string | null;
    company?: {
      id: string;
      name: string;
      logoUrl: string | null;
      website: string | null;
    } | null;
  };
}

export interface ApplicationStats {
  total: number;
  saved: number;
  applied: number;
  shortlisted: number; // Displayed as "Screening" in the UI
  interview: number;
  offer: number;
  rejected: number;
}

/**
 * UI display label mapping.
 * Note: "Screening" is strictly a UI presentation label for the SHORTLISTED enum.
 */
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  SHORTLISTED: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  "SAVED",
  "APPLIED",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];
