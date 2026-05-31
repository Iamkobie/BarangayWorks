import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateEmail, validateRejectionReason } from '../utils/validation';

// Feature: barangay-works, Property 2: Email validation correctly classifies email formats

/**
 * Property 2: Email validation correctly classifies email formats
 *
 * For any string, the email validation function SHALL accept it if and only if:
 * - It does not contain spaces
 * - It contains exactly one '@'
 * - The part before '@' is non-empty
 * - The part after '@' is non-empty and contains at least one '.'
 *
 * **Validates: Requirements 1.3**
 */
describe('Property 2: Email validation correctly classifies email formats', () => {
  /**
   * Helper: reference implementation of email validity check
   * This mirrors the rules from the design document.
   */
  function isValidEmail(s: string): boolean {
    if (s.includes(' ')) return false;
    const atCount = s.split('@').length - 1;
    if (atCount !== 1) return false;
    const [localPart, domainPart] = s.split('@');
    if (localPart.length === 0) return false;
    if (domainPart.length === 0) return false;
    if (!domainPart.includes('.')) return false;
    return true;
  }

  it('should correctly classify arbitrary strings as valid or invalid emails', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const result = validateEmail(s);
        const expected = isValidEmail(s);
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('should accept all well-formed emails (generated valid emails)', () => {
    const validEmailArb = fc.tuple(
      fc.string({ minLength: 1 }).filter(s => !s.includes('@') && !s.includes(' ')),
      fc.string({ minLength: 1 }).filter(s => !s.includes('@') && !s.includes(' ') && s.includes('.'))
    ).map(([local, domain]) => `${local}@${domain}`);

    fc.assert(
      fc.property(validEmailArb, (email) => {
        expect(validateEmail(email)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject strings without an @ symbol', () => {
    const noAtArb = fc.string().filter(s => !s.includes('@'));

    fc.assert(
      fc.property(noAtArb, (s) => {
        expect(validateEmail(s)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject strings with multiple @ symbols', () => {
    const multiAtArb = fc.tuple(fc.string(), fc.string(), fc.string()).map(
      ([a, b, c]) => `${a}@${b}@${c}`
    );

    fc.assert(
      fc.property(multiAtArb, (s) => {
        expect(validateEmail(s)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject strings containing spaces', () => {
    // Generate strings that contain at least one space
    const withSpaceArb = fc.tuple(fc.string(), fc.string()).map(
      ([a, b]) => `${a} ${b}`
    );

    fc.assert(
      fc.property(withSpaceArb, (s) => {
        expect(validateEmail(s)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject emails with empty local part', () => {
    // Domain with a dot but empty local part
    const emptyLocalArb = fc.string({ minLength: 1 })
      .filter(s => !s.includes('@') && !s.includes(' ') && s.includes('.'))
      .map(domain => `@${domain}`);

    fc.assert(
      fc.property(emptyLocalArb, (email) => {
        expect(validateEmail(email)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject emails where domain has no dot', () => {
    const noDotDomainArb = fc.tuple(
      fc.string({ minLength: 1 }).filter(s => !s.includes('@') && !s.includes(' ')),
      fc.string({ minLength: 1 }).filter(s => !s.includes('@') && !s.includes(' ') && !s.includes('.'))
    ).map(([local, domain]) => `${local}@${domain}`);

    fc.assert(
      fc.property(noDotDomainArb, (email) => {
        expect(validateEmail(email)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: barangay-works, Property 12: Rejection reason validation enforces length constraints

describe('Property 12: Rejection reason validation enforces length constraints', () => {
  /**
   * **Validates: Requirements 8.2**
   *
   * For any string of length 0-1000, the rejection reason validation function
   * SHALL accept it if and only if its character length is between 10 and 500 inclusive.
   */
  it('accepts if and only if 10 ≤ length ≤ 500', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 1000 }),
        (reason) => {
          const result = validateRejectionReason(reason)
          const expected = reason.length >= 10 && reason.length <= 500

          expect(result).toBe(expected)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: barangay-works, Property 4: Worker registration validation reports all field errors

import { validateWorkerRegistration } from '../utils/validation';
import { WorkerRegistrationData, JobCategory } from '../types';

/**
 * Property 4: Worker registration validation reports all field errors
 *
 * For any worker registration submission with N invalid or missing fields,
 * the validation function SHALL return exactly N error messages, one per invalid field,
 * and SHALL accept the submission only when all fields pass their respective constraints.
 *
 * **Validates: Requirements 2.1, 2.4**
 */
describe('Property 4: Worker registration validation reports all field errors', () => {
  // --- Valid field generators ---
  const validNameArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

  const validSkillsArb = fc.array(
    fc.constantFrom<JobCategory>('plumber', 'electrician', 'carpenter', 'mason', 'laborer'),
    { minLength: 1, maxLength: 5 }
  );

  const validContactNumberArb = fc.stringOf(
    fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
    { minLength: 9, maxLength: 9 }
  ).map(digits => `09${digits}`);

  const validEmailArb = fc.tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 }),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 1, maxLength: 8 }),
    fc.constantFrom('com', 'org', 'net', 'ph')
  ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

  const validPasswordArb = fc.tuple(
    fc.constantFrom('A', 'B', 'C', 'D', 'E'),
    fc.constantFrom('a', 'b', 'c', 'd', 'e'),
    fc.constantFrom('1', '2', '3', '4', '5'),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 5, maxLength: 10 })
  ).map(([upper, lower, digit, rest]) => `${upper}${lower}${digit}${rest}`);

  const validBarangayArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

  const validProfileImageArb = fc.constantFrom('image/jpeg', 'image/png').map(
    (type) => new File(['x'.repeat(100)], type === 'image/jpeg' ? 'photo.jpg' : 'photo.png', { type })
  );

  // --- Invalid field generators ---
  const invalidNameArb = fc.constantFrom('', '   ', 'a'.repeat(101));

  const invalidSkillsArb = fc.constantFrom(
    [] as JobCategory[],
    ['plumber', 'electrician', 'carpenter', 'mason', 'laborer', 'plumber'] as JobCategory[],
    ['invalid_skill'] as unknown as JobCategory[]
  );

  const invalidContactNumberArb = fc.constantFrom(
    '', '12345678901', '0917123456', '091712345678', 'abcdefghijk'
  );

  const invalidEmailArb = fc.constantFrom(
    '', 'not-an-email', 'missing@domain', '@nodomain.com', 'spaces in@email.com'
  );

  const invalidPasswordArb = fc.constantFrom(
    '', 'short', 'nouppercase1', 'NOLOWERCASE1', 'NoDigitsHere'
  );

  const invalidBarangayArb = fc.constantFrom('', '   ');

  const invalidProfileImageArb = fc.constantFrom(
    new File(['x'.repeat(5 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' }),
    new File(['x'], 'photo.gif', { type: 'image/gif' })
  );

  // The 7 fields that are validated
  const FIELDS = ['name', 'skills', 'contactNumber', 'email', 'password', 'barangay', 'profileImage'] as const;

  it('should return exactly N errors for N invalid fields', () => {
    // Generate a random subset of fields to make invalid (at least 1)
    const invalidSubsetArb = fc.subarray(FIELDS as unknown as string[], { minLength: 1 })
      .filter(arr => arr.length >= 1);

    fc.assert(
      fc.property(
        invalidSubsetArb,
        validNameArb,
        validSkillsArb,
        validContactNumberArb,
        validEmailArb,
        validPasswordArb,
        validBarangayArb,
        validProfileImageArb,
        invalidNameArb,
        invalidSkillsArb,
        invalidContactNumberArb,
        invalidEmailArb,
        invalidPasswordArb,
        invalidBarangayArb,
        invalidProfileImageArb,
        (
          invalidFields,
          validName, validSkills, validContact, validEmail, validPassword, validBarangay, validImage,
          invName, invSkills, invContact, invEmail, invPassword, invBarangay, invImage
        ) => {
          const invalidSet = new Set(invalidFields);

          const data: Partial<WorkerRegistrationData> = {
            name: invalidSet.has('name') ? invName : validName,
            skills: invalidSet.has('skills') ? invSkills : validSkills,
            contactNumber: invalidSet.has('contactNumber') ? invContact : validContact,
            email: invalidSet.has('email') ? invEmail : validEmail,
            password: invalidSet.has('password') ? invPassword : validPassword,
            barangay: invalidSet.has('barangay') ? invBarangay : validBarangay,
            profileImage: invalidSet.has('profileImage') ? invImage : validImage,
          };

          const result = validateWorkerRegistration(data);
          const errorCount = Object.keys(result.errors).length;

          // Should have exactly N errors for N invalid fields
          expect(errorCount).toBe(invalidSet.size);
          // Should not be valid when there are invalid fields
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept only when all fields are valid', () => {
    fc.assert(
      fc.property(
        validNameArb,
        validSkillsArb,
        validContactNumberArb,
        validEmailArb,
        validPasswordArb,
        validBarangayArb,
        validProfileImageArb,
        (name, skills, contactNumber, email, password, barangay, profileImage) => {
          const data: WorkerRegistrationData = {
            name,
            skills,
            contactNumber,
            email,
            password,
            barangay,
            profileImage,
          };

          const result = validateWorkerRegistration(data);
          expect(result.valid).toBe(true);
          expect(Object.keys(result.errors).length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return one error per invalid field (each error key matches the invalid field)', () => {
    const singleFieldArb = fc.constantFrom(...FIELDS);

    fc.assert(
      fc.property(
        singleFieldArb,
        validNameArb,
        validSkillsArb,
        validContactNumberArb,
        validEmailArb,
        validPasswordArb,
        validBarangayArb,
        validProfileImageArb,
        invalidNameArb,
        invalidSkillsArb,
        invalidContactNumberArb,
        invalidEmailArb,
        invalidPasswordArb,
        invalidBarangayArb,
        invalidProfileImageArb,
        (
          fieldToInvalidate,
          validName, validSkills, validContact, validEmail, validPassword, validBarangay, validImage,
          invName, invSkills, invContact, invEmail, invPassword, invBarangay, invImage
        ) => {
          const data: Partial<WorkerRegistrationData> = {
            name: fieldToInvalidate === 'name' ? invName : validName,
            skills: fieldToInvalidate === 'skills' ? invSkills : validSkills,
            contactNumber: fieldToInvalidate === 'contactNumber' ? invContact : validContact,
            email: fieldToInvalidate === 'email' ? invEmail : validEmail,
            password: fieldToInvalidate === 'password' ? invPassword : validPassword,
            barangay: fieldToInvalidate === 'barangay' ? invBarangay : validBarangay,
            profileImage: fieldToInvalidate === 'profileImage' ? invImage : validImage,
          };

          const result = validateWorkerRegistration(data);
          // Exactly 1 error for the one invalid field
          expect(Object.keys(result.errors).length).toBe(1);
          // The error key should match the invalidated field
          expect(result.errors[fieldToInvalidate]).toBeDefined();
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
