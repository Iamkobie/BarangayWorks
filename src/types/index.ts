// BarangayWorks - Application Types and Interfaces

// ============================================================
// Type Aliases (Union Types)
// ============================================================

/**
 * Classification of skilled work offered by workers.
 */
export type JobCategory = 'plumber' | 'electrician' | 'carpenter' | 'mason' | 'laborer';

/**
 * Verification status of a worker account.
 */
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'removed';

/**
 * Role assigned to a user account.
 */
export type UserRole = 'client' | 'worker' | 'admin';

// ============================================================
// Authentication Interfaces
// ============================================================

/**
 * Data required for client registration.
 */
export interface ClientRegistrationData {
  email: string;
  password: string; // 8-128 chars, at least one uppercase, one lowercase, one digit
}

/**
 * Data required for worker registration.
 */
export interface WorkerRegistrationData {
  name: string; // max 100 chars
  email: string;
  password: string; // min 8 chars
  skills: JobCategory[]; // 1-5 items
  barangay: string;
  contactNumber: string; // PH mobile format, 11 digits (09XXXXXXXXX)
  profileImage: File; // max 5MB, JPEG/PNG
  latitude?: number;
  longitude?: number;
  address?: string;
}

// ============================================================
// Worker Interfaces
// ============================================================

/**
 * Minimal worker data for rendering map pins.
 */
export interface WorkerPin {
  id: string;
  latitude: number;
  longitude: number;
  primarySkill: JobCategory;
  isVerified: boolean;
}

/**
 * Worker data displayed in the preview card on pin click.
 */
export interface WorkerPreview {
  id: string;
  name: string;
  primarySkill: JobCategory;
  averageRating: number | null;
  isVerified: boolean;
}

/**
 * Full worker profile data displayed on the profile page.
 */
export interface WorkerProfile {
  id: string;
  name: string;
  profileImageUrl: string;
  skills: JobCategory[];
  barangay: string;
  averageRating: number | null;
  isVerified: boolean;
  contactNumber: string;
}

/**
 * Worker data displayed in the admin pending list.
 */
export interface PendingWorker {
  id: string;
  name: string;
  skills: JobCategory[];
  barangay: string;
  createdAt: string;
}

/**
 * Worker data displayed in the admin verified list.
 */
export interface VerifiedWorker {
  id: string;
  name: string;
  skills: JobCategory[];
  barangay: string;
  verifiedAt: string;
}

// ============================================================
// Filtering Interfaces
// ============================================================

/**
 * Filter criteria for querying workers on the map.
 */
export interface WorkerFilters {
  barangay?: string;
  categories?: JobCategory[];
}

// ============================================================
// Map / GeoJSON Interfaces
// ============================================================

/**
 * GeoJSON FeatureCollection for Quezon City barangay boundaries.
 */
export interface BarangayGeoJSON {
  type: 'FeatureCollection';
  features: BarangayFeature[];
}

/**
 * GeoJSON Feature representing a single barangay boundary.
 */
export interface BarangayFeature {
  type: 'Feature';
  properties: {
    name: string;
    id: string;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][];
  };
}

// ============================================================
// Error Handling
// ============================================================

/**
 * Standardized application error structure.
 */
export interface AppError {
  code: string;
  message: string;
  field?: string; // For validation errors
  retryable: boolean;
}
