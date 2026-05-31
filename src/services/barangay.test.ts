import { describe, it, expect } from 'vitest';
import {
  getBarangayNames,
  getBarangayCoordinates,
  getBarangayBounds,
} from './barangay';

describe('barangay service', () => {
  describe('getBarangayNames', () => {
    it('returns all 32 barangays', () => {
      const names = getBarangayNames();
      expect(names).toHaveLength(32);
    });

    it('includes known barangays', () => {
      const names = getBarangayNames();
      expect(names).toContain('Diliman');
      expect(names).toContain('Fairview');
      expect(names).toContain('UP Campus');
      expect(names).toContain('Bagong Pag-asa');
    });
  });

  describe('getBarangayCoordinates', () => {
    it('returns centroid for a valid barangay', () => {
      const coords = getBarangayCoordinates('Diliman');
      expect(coords).toEqual({ lat: 14.653, lng: 121.043 });
    });

    it('is case-insensitive', () => {
      const coords = getBarangayCoordinates('diliman');
      expect(coords).toEqual({ lat: 14.653, lng: 121.043 });
    });

    it('returns null for unknown barangay', () => {
      const coords = getBarangayCoordinates('Unknown Barangay');
      expect(coords).toBeNull();
    });

    it('all coordinates fall within QC bounding box', () => {
      const names = getBarangayNames();
      for (const name of names) {
        const coords = getBarangayCoordinates(name);
        expect(coords).not.toBeNull();
        expect(coords!.lat).toBeGreaterThanOrEqual(14.58);
        expect(coords!.lat).toBeLessThanOrEqual(14.78);
        expect(coords!.lng).toBeGreaterThanOrEqual(121.0);
        expect(coords!.lng).toBeLessThanOrEqual(121.12);
      }
    });
  });

  describe('getBarangayBounds', () => {
    it('returns bounds for a valid barangay', () => {
      const bounds = getBarangayBounds('Diliman');
      expect(bounds).toEqual([[14.645, 121.035], [14.660, 121.050]]);
    });

    it('is case-insensitive', () => {
      const bounds = getBarangayBounds('DILIMAN');
      expect(bounds).toEqual([[14.645, 121.035], [14.660, 121.050]]);
    });

    it('returns null for unknown barangay', () => {
      const bounds = getBarangayBounds('Nonexistent');
      expect(bounds).toBeNull();
    });

    it('bounds are valid (south < north, west < east)', () => {
      const names = getBarangayNames();
      for (const name of names) {
        const bounds = getBarangayBounds(name);
        expect(bounds).not.toBeNull();
        const [[south, west], [north, east]] = bounds!;
        expect(south).toBeLessThan(north);
        expect(west).toBeLessThan(east);
      }
    });

    it('all bounds fall within QC bounding box', () => {
      const names = getBarangayNames();
      for (const name of names) {
        const bounds = getBarangayBounds(name);
        expect(bounds).not.toBeNull();
        const [[south, west], [north, east]] = bounds!;
        expect(south).toBeGreaterThanOrEqual(14.58);
        expect(north).toBeLessThanOrEqual(14.78);
        expect(west).toBeGreaterThanOrEqual(121.0);
        expect(east).toBeLessThanOrEqual(121.12);
      }
    });
  });
});
