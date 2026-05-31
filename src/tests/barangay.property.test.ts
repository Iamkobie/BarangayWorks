import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getBarangayNames, getBarangayCoordinates } from '../services/barangay';

// Feature: barangay-works, Property 5: Barangay-to-coordinates mapping produces valid Quezon City coordinates

/**
 * Property 5: Barangay-to-coordinates mapping produces valid Quezon City coordinates
 *
 * For any valid barangay name from the Quezon City barangay list, the coordinate
 * lookup function SHALL return geographic coordinates (latitude, longitude) that
 * fall within the bounding box of Quezon City (approximately 14.58°N to 14.78°N
 * latitude, 121.0°E to 121.12°E longitude).
 *
 * **Validates: Requirements 2.3**
 */
describe('Property 5: Barangay-to-coordinates mapping produces valid Quezon City coordinates', () => {
  const names = getBarangayNames();

  it('should return non-null coordinates within QC bounding box for any valid barangay name', () => {
    fc.assert(
      fc.property(fc.constantFrom(...names), (name) => {
        const coords = getBarangayCoordinates(name);

        // Must return non-null for valid barangay names
        expect(coords).not.toBeNull();

        // Coordinates must fall within Quezon City bounding box
        expect(coords!.lat).toBeGreaterThanOrEqual(14.58);
        expect(coords!.lat).toBeLessThanOrEqual(14.78);
        expect(coords!.lng).toBeGreaterThanOrEqual(121.0);
        expect(coords!.lng).toBeLessThanOrEqual(121.12);
      }),
      { numRuns: 100 }
    );
  });
});
