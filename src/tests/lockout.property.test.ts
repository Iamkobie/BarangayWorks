import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { LoginAttemptTracker } from '../utils/loginTracker';

// Feature: barangay-works, Property 3: Account lockout triggers at exactly 5 consecutive failures

/**
 * Property 3: Account lockout triggers at exactly 5 consecutive failures
 *
 * For any sequence of login attempts for a given account, the account SHALL become
 * locked if and only if there are 5 or more consecutive failed attempts without an
 * intervening successful login, and a successful login SHALL reset the failure counter to zero.
 *
 * **Validates: Requirements 1.6**
 */
describe('Property 3: Account lockout triggers at exactly 5 consecutive failures', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Helper: compute the number of trailing consecutive failures in a sequence.
   */
  function trailingConsecutiveFailures(actions: ('success' | 'failure')[]): number {
    let count = 0;
    for (let i = actions.length - 1; i >= 0; i--) {
      if (actions[i] === 'failure') {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  it('account is locked if and only if there are 5+ consecutive trailing failures', () => {
    const actionArb = fc.array(
      fc.constantFrom('success', 'failure') as fc.Arbitrary<'success' | 'failure'>,
      { minLength: 1, maxLength: 30 }
    );

    fc.assert(
      fc.property(actionArb, (actions) => {
        const tracker = new LoginAttemptTracker();
        const accountId = 'test@example.com';

        // Apply all actions
        for (const action of actions) {
          if (action === 'success') {
            tracker.recordSuccess(accountId);
          } else {
            tracker.recordFailure(accountId);
          }
        }

        const consecutiveFailures = trailingConsecutiveFailures(actions);
        const shouldBeLocked = consecutiveFailures >= 5;

        expect(tracker.isLocked(accountId)).toBe(shouldBeLocked);
      }),
      { numRuns: 100 }
    );
  });

  it('a successful login always resets the failure counter to zero', () => {
    const prefixArb = fc.array(
      fc.constantFrom('success', 'failure') as fc.Arbitrary<'success' | 'failure'>,
      { minLength: 0, maxLength: 20 }
    );

    fc.assert(
      fc.property(prefixArb, (prefix) => {
        const tracker = new LoginAttemptTracker();
        const accountId = 'test@example.com';

        // Apply prefix actions
        for (const action of prefix) {
          if (action === 'success') {
            tracker.recordSuccess(accountId);
          } else {
            tracker.recordFailure(accountId);
          }
        }

        // Record a success
        tracker.recordSuccess(accountId);

        // After a success, failed attempts should always be 0
        expect(tracker.getFailedAttempts(accountId)).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('failure counter matches trailing consecutive failures in the sequence', () => {
    const actionArb = fc.array(
      fc.constantFrom('success', 'failure') as fc.Arbitrary<'success' | 'failure'>,
      { minLength: 1, maxLength: 30 }
    );

    fc.assert(
      fc.property(actionArb, (actions) => {
        const tracker = new LoginAttemptTracker();
        const accountId = 'test@example.com';

        for (const action of actions) {
          if (action === 'success') {
            tracker.recordSuccess(accountId);
          } else {
            tracker.recordFailure(accountId);
          }
        }

        const expectedFailures = trailingConsecutiveFailures(actions);
        expect(tracker.getFailedAttempts(accountId)).toBe(expectedFailures);
      }),
      { numRuns: 100 }
    );
  });

  it('account is NOT locked if there is a success anywhere in the last 5 actions', () => {
    // Generate sequences where the last 5 actions contain at least one success
    const actionArb = fc.array(
      fc.constantFrom('success', 'failure') as fc.Arbitrary<'success' | 'failure'>,
      { minLength: 5, maxLength: 30 }
    ).filter((actions) => {
      const lastFive = actions.slice(-5);
      return lastFive.includes('success');
    });

    fc.assert(
      fc.property(actionArb, (actions) => {
        const tracker = new LoginAttemptTracker();
        const accountId = 'test@example.com';

        for (const action of actions) {
          if (action === 'success') {
            tracker.recordSuccess(accountId);
          } else {
            tracker.recordFailure(accountId);
          }
        }

        // If there's a success in the last 5 actions, the account should NOT be locked
        // because the counter was reset at that success point
        expect(tracker.isLocked(accountId)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('exactly 5 consecutive failures locks the account', () => {
    // Generate a prefix of arbitrary actions ending with a success (to reset),
    // then exactly 5 failures
    const prefixArb = fc.array(
      fc.constantFrom('success', 'failure') as fc.Arbitrary<'success' | 'failure'>,
      { minLength: 0, maxLength: 15 }
    );

    fc.assert(
      fc.property(prefixArb, (prefix) => {
        const tracker = new LoginAttemptTracker();
        const accountId = 'test@example.com';

        // Apply prefix
        for (const action of prefix) {
          if (action === 'success') {
            tracker.recordSuccess(accountId);
          } else {
            tracker.recordFailure(accountId);
          }
        }

        // Reset with a success
        tracker.recordSuccess(accountId);
        expect(tracker.getFailedAttempts(accountId)).toBe(0);
        expect(tracker.isLocked(accountId)).toBe(false);

        // Apply exactly 5 failures
        for (let i = 0; i < 5; i++) {
          tracker.recordFailure(accountId);
        }

        // Account should now be locked
        expect(tracker.isLocked(accountId)).toBe(true);
        expect(tracker.getFailedAttempts(accountId)).toBe(5);
      }),
      { numRuns: 100 }
    );
  });
});
