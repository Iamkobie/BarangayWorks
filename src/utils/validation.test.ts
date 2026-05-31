import { describe, it, expect } from 'vitest';
import { validatePassword, validateWorkerRegistration } from './validation';
import { WorkerRegistrationData } from '../types';

describe('validatePassword', () => {
  it('accepts a valid password with all criteria met', () => {
    const result = validatePassword('Abcdef1x');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts a password at minimum length (8 chars)', () => {
    const result = validatePassword('Abcdef1x');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts a password at maximum length (128 chars)', () => {
    const password = 'A' + 'a'.repeat(126) + '1';
    expect(password.length).toBe(128);
    const result = validatePassword(password);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = validatePassword('Ab1defg');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('rejects a password longer than 128 characters', () => {
    const password = 'A' + 'a'.repeat(127) + '1';
    expect(password.length).toBe(129);
    const result = validatePassword(password);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be no more than 128 characters');
  });

  it('rejects a password without an uppercase letter', () => {
    const result = validatePassword('abcdefg1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('rejects a password without a lowercase letter', () => {
    const result = validatePassword('ABCDEFG1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('rejects a password without a digit', () => {
    const result = validatePassword('Abcdefgh');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one digit');
  });

  it('returns multiple errors for multiple violations', () => {
    const result = validatePassword('abc');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
    expect(result.errors).toContain('Password must contain at least one digit');
  });

  it('rejects an empty string with all applicable errors', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
    expect(result.errors).toContain('Password must contain at least one digit');
  });
});

/**
 * Unit tests for validateWorkerRegistration
 */
describe('validateWorkerRegistration', () => {
  // Helper to create a valid worker registration data object
  function createValidData(): WorkerRegistrationData {
    return {
      name: 'Juan Dela Cruz',
      email: 'juan@example.com',
      password: 'Password1',
      skills: ['plumber'],
      barangay: 'Commonwealth',
      contactNumber: '09171234567',
      profileImage: new File(['x'.repeat(100)], 'photo.jpg', { type: 'image/jpeg' }),
    };
  }

  it('should return valid when all fields are correct', () => {
    const result = validateWorkerRegistration(createValidData());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should return error when name is missing', () => {
    const data = createValidData();
    delete (data as Partial<WorkerRegistrationData>).name;
    const result = validateWorkerRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it('should return error when name exceeds 100 characters', () => {
    const data = createValidData();
    data.name = 'a'.repeat(101);
    const result = validateWorkerRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it('should accept name with exactly 100 characters', () => {
    const data = createValidData();
    data.name = 'a'.repeat(100);
    const result = validateWorkerRegistration(data);
    expect(result.errors.name).toBeUndefined();
  });

  it('should return error when skills is empty array', () => {
    const data = createValidData();
    data.skills = [];
    const result = validateWorkerRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.skills).toBeDefined();
  });

  it('should return error when skills has more than 5 items', () => {
    const data = createValidData();
    data.skills = ['plumber', 'electrician', 'carpenter', 'mason', 'laborer', 'plumber'] as any;
    const result = validateWorkerRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.skills).toBeDefined();
  });

  it('should return error when skills contains invalid category', () => {
    const data = createValidData();
    data.skills = ['plumber', 'invalid_skill' as any];
    const result = validateWorkerRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.skills).toBeDefined();
  });

  it('should accept 1-5 valid skills', () => {
    const data = createValidData();
    data.skills = ['plumber', 'electrician', 'carpenter'];
    const result = validateWorkerRegistration(data);
    expect(result.errors.skills).toBeUndefined();
  });

  it('should return error when contactNumber is invalid format', () => {
    const data = createValidData();
    data.contactNumber = '12345678901';
    const result = validateWorkerRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.contactNumber).toBeDefined();
  });

  it('should return error when contactNumber is too short', () => {
    const data = createValidData();
    data.contactNumber = '0917123456';
    const result = validateWorkerRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.contactNumber).toBeDefined();
  });

  it('should accept valid PH mobile number', () => {
    const data = createValidData();
    data.contactNumber = '09171234567';
    const result = validateWorkerRegistration(data);
    expect(result.errors.contactNumber).toBeUndefined();
  });

  it('should return error when profileImage exceeds 5MB', () => {
    const data = createValidData();
    const largeContent = 'x'.repeat(5 * 1024 * 1024 + 1);
    data.profileImage = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
    const result = validateWorkerRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.profileImage).toBeDefined();
  });

  it('should return error when profileImage is not JPEG or PNG', () => {
    const data = createValidData();
    data.profileImage = new File(['x'], 'photo.gif', { type: 'image/gif' });
    const result = validateWorkerRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.profileImage).toBeDefined();
  });

  it('should accept valid JPEG image under 5MB', () => {
    const data = createValidData();
    data.profileImage = new File(['x'.repeat(100)], 'photo.jpg', { type: 'image/jpeg' });
    const result = validateWorkerRegistration(data);
    expect(result.errors.profileImage).toBeUndefined();
  });

  it('should accept valid PNG image under 5MB', () => {
    const data = createValidData();
    data.profileImage = new File(['x'.repeat(100)], 'photo.png', { type: 'image/png' });
    const result = validateWorkerRegistration(data);
    expect(result.errors.profileImage).toBeUndefined();
  });

  it('should return error when email is invalid', () => {
    const data = createValidData();
    data.email = 'not-an-email';
    const result = validateWorkerRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it('should return error when password is too short', () => {
    const data = createValidData();
    data.password = 'Ab1';
    const result = validateWorkerRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.password).toBeDefined();
  });

  it('should return error when barangay is empty', () => {
    const data = createValidData();
    data.barangay = '';
    const result = validateWorkerRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.barangay).toBeDefined();
  });

  it('should return multiple errors when multiple fields are invalid', () => {
    const result = validateWorkerRegistration({});
    expect(result.valid).toBe(false);
    // All 7 fields should have errors when data is empty
    expect(Object.keys(result.errors).length).toBe(7);
    expect(result.errors.name).toBeDefined();
    expect(result.errors.skills).toBeDefined();
    expect(result.errors.contactNumber).toBeDefined();
    expect(result.errors.profileImage).toBeDefined();
    expect(result.errors.email).toBeDefined();
    expect(result.errors.password).toBeDefined();
    expect(result.errors.barangay).toBeDefined();
  });

  it('should return exactly N errors for N invalid fields', () => {
    const data = createValidData();
    data.name = ''; // invalid
    data.contactNumber = 'invalid'; // invalid
    // rest are valid
    const result = validateWorkerRegistration(data);
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBe(2);
  });
});
