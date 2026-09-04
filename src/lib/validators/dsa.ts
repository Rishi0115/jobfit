import { z } from "zod";
import { DSAStatus } from "@prisma/client";

export const updateDSAProgressSchema = z.object({
  questionId: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, "Question ID is required.")),
  status: z.nativeEnum(DSAStatus),
  userApproach: z.string().max(5000, "Approach exceeds maximum length.").optional(),
});

export type UpdateDSAProgressInput = z.infer<typeof updateDSAProgressSchema>;
