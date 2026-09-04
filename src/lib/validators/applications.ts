import { z } from "zod";

export const applicationStatusEnum = z.enum([
  "SAVED",
  "APPLIED",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
]);

export const createApplicationSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  status: applicationStatusEnum.default("SAVED"),
  notes: z.string().max(2000, "Notes cannot exceed 2000 characters").optional().nullable(),
  appliedAt: z.coerce.date().optional().nullable(),
  interviewDate: z.coerce.date().optional().nullable(),
});

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  status: applicationStatusEnum,
  notes: z.string().max(2000, "Notes cannot exceed 2000 characters").optional().nullable(),
  interviewDate: z.coerce.date().optional().nullable(),
});

export const updateApplicationNotesSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  notes: z.string().max(2000, "Notes cannot exceed 2000 characters").nullable(),
});

export const deleteApplicationSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type UpdateApplicationNotesInput = z.infer<typeof updateApplicationNotesSchema>;
export type DeleteApplicationInput = z.infer<typeof deleteApplicationSchema>;
