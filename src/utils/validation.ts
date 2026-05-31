/**
 * Validation utilities for BarangayWorks
 */

import { JobCategory, WorkerRegistrationData } from '../types';

/**
 * Valid job categories for workers.
 */
const VALID_JOB_CATEGORIES: JobCategory[] = ['plumber', 'electrician', 'carpenter', 'mason', 'laborer'];

/**
 * Maximum allowed profile image size in bytes (5MB).
 */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed MIME types for profile images.
 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a password against the following criteria:
 * - Length between 8 and 128 characters (inclusive)
 * - Contains at least one uppercase letter (A-Z)
 * - Contains at least one lowercase letter (a-z)
 * - Contains at least one digit (0-9)
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  } else if (password.length > 128) {
    errors.push('Password must be no more than 128 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an email address using simple string checks.
 *
 * Rules:
 * - Contains exactly one @ symbol
 * - Non-empty local part (before @)
 * - Non-empty domain part (after @)
 * - Domain contains at least one dot
 * - No spaces allowed
 *
 * @param email - The email string to validate
 * @returns true if the email is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  // No spaces allowed
  if (email.includes(' ')) {
    return false;
  }

  // Must contain exactly one @ symbol
  const atCount = email.split('@').length - 1;
  if (atCount !== 1) {
    return false;
  }

  const [localPart, domainPart] = email.split('@');

  // Non-empty local part
  if (localPart.length === 0) {
    return false;
  }

  // Non-empty domain part
  if (domainPart.length === 0) {
    return false;
  }

  // Domain must contain at least one dot
  if (!domainPart.includes('.')) {
    return false;
  }

  return true;
}

/**
 * Validates a rejection reason string.
 * Accepts if and only if the character length is between 10 and 500 inclusive.
 *
 * @param reason - The rejection reason string to validate
 * @returns true if the reason is valid (10-500 characters), false otherwise
 */
export function validateRejectionReason(reason: string): boolean {
  return reason.length >= 10 && reason.length <= 500;
}

export interface WorkerRegistrationValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates worker registration data.
 *
 * Checks each field independently and returns per-field error messages:
 * - name: required, non-empty, max 100 characters
 * - skills: required, array with 1-5 items, each must be a valid JobCategory
 * - contactNumber: required, must match PH mobile format (09XXXXXXXXX, 11 digits)
 * - profileImage: required, must be ≤ 5MB, must be JPEG or PNG
 * - email: required, must be a valid email
 * - password: required, must pass validatePassword
 * - barangay: required, non-empty
 *
 * @param data - Partial worker registration data to validate
 * @returns Object with valid boolean and per-field error messages
 */
export function validateWorkerRegistration(
  data: Partial<WorkerRegistrationData>
): WorkerRegistrationValidationResult {
  const errors: Record<string, string> = {};

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Name must be 100 characters or less';
  }

  // Validate skills
  if (!data.skills || !Array.isArray(data.skills) || data.skills.length === 0) {
    errors.skills = 'At least one skill is required';
  } else if (data.skills.length > 5) {
    errors.skills = 'Maximum of 5 skills allowed';
  } else {
    const allValid = data.skills.every((skill) =>
      VALID_JOB_CATEGORIES.includes(skill as JobCategory)
    );
    if (!allValid) {
      errors.skills = 'All skills must be valid job categories';
    }
  }

  // Validate contactNumber
  if (!data.contactNumber) {
    errors.contactNumber = 'Contact number is required';
  } else if (!/^09[0-9]{9}$/.test(data.contactNumber)) {
    errors.contactNumber = 'Contact number must be a valid Philippine mobile number (09XXXXXXXXX)';
  }

  // Validate profileImage
  if (!data.profileImage) {
    errors.profileImage = 'Profile image is required';
  } else {
    if (data.profileImage.size > MAX_IMAGE_SIZE) {
      errors.profileImage = 'Profile image must be 5MB or less';
    } else if (!ALLOWED_IMAGE_TYPES.includes(data.profileImage.type)) {
      errors.profileImage = 'Profile image must be JPEG or PNG format';
    }
  }

  // Validate email
  if (!data.email || data.email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Email must be a valid email address';
  }

  // Validate password
  if (!data.password || data.password.length === 0) {
    errors.password = 'Password is required';
  } else {
    const passwordResult = validatePassword(data.password);
    if (!passwordResult.valid) {
      errors.password = passwordResult.errors[0];
    }
  }

  // Validate barangay
  if (!data.barangay || data.barangay.trim().length === 0) {
    errors.barangay = 'Barangay is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
