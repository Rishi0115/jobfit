/**
 * Pure Location & Work Mode Matching Engine
 *
 * Evaluates Remote, Hybrid, Onsite compatibility and geographic preferences.
 * Does not penalize candidates if job has no location constraints.
 * Explicitly flags when candidate preference data is missing.
 */

import type { LocationMatchDetails } from "@/types/matching";

export function matchLocation(
  candidateWorkMode?: string | null,
  candidateLocations: string[] = [],
  jobWorkMode?: string | null,
  jobLocation?: string | null
): { score: number; isAvailable: boolean; details: LocationMatchDetails } {
  const normCandidateMode = candidateWorkMode?.toUpperCase() || null;
  const normJobMode = jobWorkMode?.toUpperCase() || null;
  const normJobLocation = jobLocation?.toLowerCase().trim() || null;
  const normCandidateLocations = candidateLocations
    .map((l) => l.toLowerCase().trim())
    .filter(Boolean);

  const hasCandidateMode = Boolean(normCandidateMode);
  const hasCandidateLocations = normCandidateLocations.length > 0;

  // If candidate has neither work mode preference nor locations
  if (!hasCandidateMode && !hasCandidateLocations) {
    return {
      score: 0,
      isAvailable: false,
      details: {
        candidateWorkMode: null,
        jobWorkMode: normJobMode,
        isWorkModeCompatible: false,
        candidateLocations: [],
        jobLocation: jobLocation || null,
        isLocationCompatible: false,
        reason: "Candidate location and work mode preferences are not set in profile.",
      },
    };
  }

  // If job has neither work mode nor location, do not penalize candidate
  if (!normJobMode && !normJobLocation) {
    return {
      score: 100,
      isAvailable: true,
      details: {
        candidateWorkMode: normCandidateMode,
        jobWorkMode: null,
        isWorkModeCompatible: true,
        candidateLocations,
        jobLocation: null,
        isLocationCompatible: true,
        reason: "Job specifies no location or work mode restrictions.",
      },
    };
  }

  // Evaluate work mode
  let modeScore = 100;
  let isWorkModeCompatible = true;

  if (normJobMode) {
    if (normJobMode === "REMOTE") {
      // Remote jobs are compatible regardless of physical location
      modeScore = 100;
      isWorkModeCompatible = true;
    } else if (!normCandidateMode) {
      // Candidate has no mode preference, neutral compatible
      modeScore = 80;
      isWorkModeCompatible = true;
    } else if (normCandidateMode === normJobMode) {
      modeScore = 100;
      isWorkModeCompatible = true;
    } else if (
      (normCandidateMode === "HYBRID" && normJobMode === "ONSITE") ||
      (normCandidateMode === "ONSITE" && normJobMode === "HYBRID")
    ) {
      modeScore = 60;
      isWorkModeCompatible = true;
    } else if (normCandidateMode === "REMOTE" && normJobMode === "ONSITE") {
      modeScore = 10;
      isWorkModeCompatible = false;
    } else {
      modeScore = 40;
      isWorkModeCompatible = false;
    }
  }

  // Evaluate location
  let locationScore = 100;
  let isLocationCompatible = true;

  if (normJobMode === "REMOTE") {
    locationScore = 100;
    isLocationCompatible = true;
  } else if (normJobLocation && hasCandidateLocations) {
    // Check if any candidate preferred location matches job location
    const hasMatch = normCandidateLocations.some((pref) =>
      normJobLocation.includes(pref) || pref.includes(normJobLocation)
    );

    if (hasMatch) {
      locationScore = 100;
      isLocationCompatible = true;
    } else {
      locationScore = 30; // Partial score for potential relocation
      isLocationCompatible = false;
    }
  } else if (normJobLocation && !hasCandidateLocations) {
    // Candidate has work mode but no location preference specified
    locationScore = 75;
    isLocationCompatible = true;
  }

  // Calculate composite score
  let finalScore = 100;
  let reason = "";

  if (normJobMode === "REMOTE") {
    finalScore = 100;
    reason = "Job is fully Remote — maximum location flexibility.";
  } else if (normJobMode && normJobLocation && hasCandidateLocations) {
    finalScore = Math.round(modeScore * 0.5 + locationScore * 0.5);
    reason = isLocationCompatible && isWorkModeCompatible
      ? "Work mode and location preferences match job requirements."
      : isWorkModeCompatible
      ? "Work mode matches, but job location differs from preferred locations."
      : "Work mode or location compatibility is partial.";
  } else if (normJobMode) {
    finalScore = modeScore;
    reason = isWorkModeCompatible
      ? `Work mode (${normJobMode}) matches candidate preference.`
      : `Work mode difference: candidate prefers ${normCandidateMode || "unspecified"}, job is ${normJobMode}.`;
  } else {
    finalScore = locationScore;
    reason = isLocationCompatible
      ? "Location aligns with candidate preferences."
      : `Job location (${jobLocation}) differs from candidate preferred locations.`;
  }

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    isAvailable: true,
    details: {
      candidateWorkMode: normCandidateMode,
      jobWorkMode: normJobMode,
      isWorkModeCompatible,
      candidateLocations,
      jobLocation: jobLocation || null,
      isLocationCompatible,
      reason,
    },
  };
}
