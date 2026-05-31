/**
 * Barangay and worker filtering utilities for BarangayWorks.
 */

import type { WorkerFilters, JobCategory } from '../types';

/**
 * Filters barangay names by case-insensitive substring match.
 *
 * If the search string is empty (length 0), returns the full list unfiltered.
 * If the search string has 1 or more characters, returns only barangay names
 * that contain the search string as a case-insensitive substring.
 *
 * @param searchString - The substring to search for
 * @param barangayNames - The list of barangay names to filter
 * @returns Filtered list of barangay names matching the search string
 */
export function filterBarangays(searchString: string, barangayNames: string[]): string[] {
  if (searchString.length < 1) return barangayNames;
  const lower = searchString.toLowerCase();
  return barangayNames.filter(name => name.toLowerCase().includes(lower));
}

/**
 * Minimum shape required for a worker to be filterable.
 */
export interface FilterableWorker {
  verificationStatus: string;
  barangay: string;
  skills: string[];
}

/**
 * Filters workers by verification status, barangay, and job categories.
 *
 * Returns only workers where:
 * 1. verificationStatus equals "verified"
 * 2. If a barangay filter is set, worker.barangay matches the selected barangay
 * 3. If category filters are set, the worker has at least one skill in the selected categories
 *
 * @param workers - The list of workers to filter
 * @param filters - The active filter criteria
 * @returns Filtered list of workers matching all active criteria
 */
export function filterWorkers<T extends FilterableWorker>(workers: T[], filters: WorkerFilters): T[] {
  return workers.filter(worker => {
    // Must be verified
    if (worker.verificationStatus !== 'verified') return false;

    // If barangay filter is active, must match
    if (filters.barangay && worker.barangay !== filters.barangay) return false;

    // If category filters are active, must have at least one matching skill
    if (filters.categories && filters.categories.length > 0) {
      const hasMatchingSkill = worker.skills.some(skill =>
        filters.categories!.includes(skill as JobCategory)
      );
      if (!hasMatchingSkill) return false;
    }

    return true;
  });
}
