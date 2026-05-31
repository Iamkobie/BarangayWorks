import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { filterBarangays, filterWorkers } from '../utils/filters';
import type { JobCategory, WorkerFilters } from '../types';

// Feature: barangay-works, Property 7: Barangay substring filter returns exactly matching results

/**
 * Property 7: Barangay substring filter returns exactly matching results
 *
 * For any search string of at least 1 character and any list of barangay names,
 * the filter function SHALL return all and only those barangay names that contain
 * the search string as a case-insensitive substring.
 *
 * **Validates: Requirements 4.1**
 */
describe('Property 7: Barangay substring filter returns exactly matching results', () => {
  it('should return exactly those names containing the search string (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.array(fc.string({ minLength: 1 })),
        (searchString, names) => {
          const result = filterBarangays(searchString, names);
          const expected = names.filter(
            name => name.toLowerCase().includes(searchString.toLowerCase())
          );

          expect(result).toEqual(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('every returned name contains the search string (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.array(fc.string({ minLength: 1 })),
        (searchString, names) => {
          const result = filterBarangays(searchString, names);
          const lowerSearch = searchString.toLowerCase();

          for (const name of result) {
            expect(name.toLowerCase()).toContain(lowerSearch);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no name that contains the search string is missing from the result', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.array(fc.string({ minLength: 1 })),
        (searchString, names) => {
          const result = filterBarangays(searchString, names);
          const lowerSearch = searchString.toLowerCase();

          const matchingNames = names.filter(
            name => name.toLowerCase().includes(lowerSearch)
          );

          expect(result.length).toBe(matchingNames.length);
          for (const name of matchingNames) {
            expect(result).toContain(name);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// Feature: barangay-works, Property 8: Combined worker filter returns only workers matching all active criteria

/**
 * Property 8: Combined worker filter returns only workers matching all active criteria
 *
 * For any set of workers, any optional barangay selection, and any optional set of
 * selected job categories, the filter function SHALL return all and only those workers
 * where: (1) verification_status equals "verified", AND (2) if a barangay is selected,
 * worker.barangay equals the selected barangay, AND (3) if categories are selected,
 * the worker has at least one skill in the selected categories.
 *
 * **Validates: Requirements 4.3, 5.2, 6.2, 6.6, 8.6**
 */
describe('Property 8: Combined worker filter returns only workers matching all active criteria', () => {
  const ALL_CATEGORIES: JobCategory[] = ['plumber', 'electrician', 'carpenter', 'mason', 'laborer'];
  const ALL_STATUSES = ['pending', 'verified', 'rejected', 'removed'] as const;
  const SAMPLE_BARANGAYS = ['Bagong Pag-asa', 'Batasan Hills', 'Commonwealth', 'Holy Spirit', 'Payatas'];

  // Generator for a single worker with random verification status, barangay, and skills
  const workerArb = fc.record({
    verificationStatus: fc.constantFrom(...ALL_STATUSES),
    barangay: fc.constantFrom(...SAMPLE_BARANGAYS),
    skills: fc.uniqueArray(fc.constantFrom(...ALL_CATEGORIES), { minLength: 1, maxLength: 5 }),
  });

  // Generator for a list of workers
  const workersArb = fc.array(workerArb, { minLength: 0, maxLength: 20 });

  // Generator for WorkerFilters with optional barangay and optional categories
  const filtersArb = fc.record({
    barangay: fc.option(fc.constantFrom(...SAMPLE_BARANGAYS), { nil: undefined }),
    categories: fc.option(
      fc.uniqueArray(fc.constantFrom(...ALL_CATEGORIES), { minLength: 1, maxLength: 5 }),
      { nil: undefined }
    ),
  });

  it('should return exactly those workers matching verified + barangay + category criteria', () => {
    fc.assert(
      fc.property(workersArb, filtersArb, (workers, filters) => {
        const result = filterWorkers(workers, filters as WorkerFilters);

        // Compute expected result manually
        const expected = workers.filter(worker => {
          // (1) Must be verified
          if (worker.verificationStatus !== 'verified') return false;

          // (2) If barangay filter is set, must match
          if (filters.barangay && worker.barangay !== filters.barangay) return false;

          // (3) If categories filter is set, must have at least one matching skill
          if (filters.categories && filters.categories.length > 0) {
            const hasMatch = worker.skills.some(skill =>
              filters.categories!.includes(skill as JobCategory)
            );
            if (!hasMatch) return false;
          }

          return true;
        });

        expect(result).toEqual(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('every returned worker is verified', () => {
    fc.assert(
      fc.property(workersArb, filtersArb, (workers, filters) => {
        const result = filterWorkers(workers, filters as WorkerFilters);

        for (const worker of result) {
          expect(worker.verificationStatus).toBe('verified');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('every returned worker matches the barangay filter when set', () => {
    fc.assert(
      fc.property(workersArb, filtersArb, (workers, filters) => {
        const result = filterWorkers(workers, filters as WorkerFilters);

        if (filters.barangay) {
          for (const worker of result) {
            expect(worker.barangay).toBe(filters.barangay);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('every returned worker has at least one skill in the selected categories when set', () => {
    fc.assert(
      fc.property(workersArb, filtersArb, (workers, filters) => {
        const result = filterWorkers(workers, filters as WorkerFilters);

        if (filters.categories && filters.categories.length > 0) {
          for (const worker of result) {
            const hasMatch = worker.skills.some(skill =>
              filters.categories!.includes(skill as JobCategory)
            );
            expect(hasMatch).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('no matching worker is excluded from the result', () => {
    fc.assert(
      fc.property(workersArb, filtersArb, (workers, filters) => {
        const result = filterWorkers(workers, filters as WorkerFilters);

        // Count workers that should match
        const expectedCount = workers.filter(worker => {
          if (worker.verificationStatus !== 'verified') return false;
          if (filters.barangay && worker.barangay !== filters.barangay) return false;
          if (filters.categories && filters.categories.length > 0) {
            const hasMatch = worker.skills.some(skill =>
              filters.categories!.includes(skill as JobCategory)
            );
            if (!hasMatch) return false;
          }
          return true;
        }).length;

        expect(result.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: barangay-works, Property 9: Clearing barangay selection restores full verified worker set

/**
 * Property 9: Clearing barangay selection restores full verified worker set
 *
 * For any initial set of workers and any barangay selection, applying the barangay
 * filter and then clearing it SHALL produce the same set of visible workers as the
 * initial unfiltered state (all verified workers).
 *
 * **Validates: Requirements 4.5**
 */
describe('Property 9: Clearing barangay selection restores full verified worker set', () => {
  const JOB_CATEGORIES: JobCategory[] = ['plumber', 'electrician', 'carpenter', 'mason', 'laborer'];

  const workerArb = fc.record({
    verificationStatus: fc.oneof(
      fc.constant('verified'),
      fc.constant('pending'),
      fc.constant('rejected'),
      fc.constant('removed')
    ),
    barangay: fc.stringOf(fc.char(), { minLength: 1, maxLength: 30 }),
    skills: fc.subarray(JOB_CATEGORIES, { minLength: 1, maxLength: 5 }),
  });

  it('clearing barangay filter produces the same result as no barangay filter', () => {
    fc.assert(
      fc.property(
        fc.array(workerArb, { minLength: 0, maxLength: 20 }),
        fc.stringOf(fc.char(), { minLength: 1, maxLength: 30 }),
        (workers, selectedBarangay) => {
          // Initial unfiltered state: no barangay, no categories
          const noFilter: WorkerFilters = {};
          const initialResult = filterWorkers(workers, noFilter);

          // Apply barangay filter
          const withBarangay: WorkerFilters = { barangay: selectedBarangay };
          filterWorkers(workers, withBarangay);

          // Clear barangay filter (back to no filter)
          const clearedFilter: WorkerFilters = {};
          const clearedResult = filterWorkers(workers, clearedFilter);

          // After clearing, result must equal the initial unfiltered verified worker set
          expect(clearedResult).toEqual(initialResult);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('clearing barangay filter returns all verified workers regardless of barangay', () => {
    fc.assert(
      fc.property(
        fc.array(workerArb, { minLength: 0, maxLength: 20 }),
        fc.stringOf(fc.char(), { minLength: 1, maxLength: 30 }),
        (workers, _selectedBarangay) => {
          // Apply barangay filter then clear it
          const clearedFilter: WorkerFilters = {};
          const clearedResult = filterWorkers(workers, clearedFilter);

          // The cleared result should contain exactly all verified workers
          const allVerified = workers.filter(w => w.verificationStatus === 'verified');
          expect(clearedResult).toEqual(allVerified);
        }
      ),
      { numRuns: 100 }
    );
  });
});
