/**
 * Barangay data service for Quezon City.
 * Provides coordinate lookup and bounds for map zoom functionality.
 */

import { barangays, type BarangayData } from '../data/barangays';

/** Map of barangay name (lowercase) → data for fast lookup */
const barangayMap = new Map<string, BarangayData>(
  barangays.map((b) => [b.name.toLowerCase(), b])
);

/**
 * Returns the list of all barangay names.
 */
export function getBarangayNames(): string[] {
  return barangays.map((b) => b.name);
}

/**
 * Returns the centroid coordinates for a given barangay name.
 * Lookup is case-insensitive.
 * Returns null if the barangay is not found.
 */
export function getBarangayCoordinates(
  name: string
): { lat: number; lng: number } | null {
  const data = barangayMap.get(name.toLowerCase());
  if (!data) return null;
  return { lat: data.lat, lng: data.lng };
}

/**
 * Returns the bounding box for a given barangay name.
 * Format: [[south, west], [north, east]] — compatible with Leaflet's LatLngBounds.
 * Lookup is case-insensitive.
 * Returns null if the barangay is not found.
 */
export function getBarangayBounds(
  name: string
): [[number, number], [number, number]] | null {
  const data = barangayMap.get(name.toLowerCase());
  if (!data) return null;
  return data.bounds;
}
