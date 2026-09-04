/**
 * Data Access Layer — Companies
 * All Company-related database operations are centralized here.
 */
import { db } from "@/lib/db";
import { normalizeCompanyNameForComparison } from "@/services/jobs/ingestion/job-normalizer";

export const companiesDAL = {
  /**
   * Find a company by its normalized name (for dedup).
   */
  async findByNormalizedName(name: string) {
    const normalized = normalizeCompanyNameForComparison(name);
    return db.company.findFirst({
      where: {
        normalizedName: normalized,
        deletedAt: null,
      },
    });
  },

  /**
   * Find a company by ID.
   */
  async findById(id: string) {
    return db.company.findFirst({
      where: { id, deletedAt: null },
    });
  },

  /**
   * Find or create a company by name.
   * Used during job ingestion to safely link jobs to companies.
   * Will NOT overwrite existing non-empty fields with empty values.
   */
  async findOrCreate(name: string, website?: string) {
    const normalized = normalizeCompanyNameForComparison(name);

    // Try to find existing company
    const existing = await db.company.findFirst({
      where: {
        normalizedName: normalized,
        deletedAt: null,
      },
    });

    if (existing) {
      // Update website only if we have a better value
      if (website && !existing.website) {
        return db.company.update({
          where: { id: existing.id },
          data: { website },
        });
      }
      return existing;
    }

    // Create new company (no recruiterId — this is an external company)
    return db.company.create({
      data: {
        name: name.trim().replace(/\s+/g, " "),
        normalizedName: normalized,
        website: website || null,
      },
    });
  },
};
