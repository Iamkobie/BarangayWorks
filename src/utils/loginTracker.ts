/**
 * Login Attempt Tracker
 *
 * Tracks consecutive failed login attempts per account and enforces
 * account lockout after 5 consecutive failures for 15 minutes.
 *
 * Feature: barangay-works, Property 3: Account lockout triggers at exactly 5 consecutive failures
 * Validates: Requirements 1.6
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

interface AttemptRecord {
  failures: number;
  lockedUntil: number | null;
}

export class LoginAttemptTracker {
  private attempts: Map<string, AttemptRecord> = new Map();

  /**
   * Record a failed login attempt for the given account.
   * If failures reach 5, the account is locked for 15 minutes.
   */
  recordFailure(accountId: string): void {
    const record = this.getOrCreateRecord(accountId);
    record.failures += 1;

    if (record.failures >= MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    }

    this.attempts.set(accountId, record);
  }

  /**
   * Record a successful login for the given account.
   * Resets the failure counter and clears any lockout.
   */
  recordSuccess(accountId: string): void {
    this.attempts.set(accountId, { failures: 0, lockedUntil: null });
  }

  /**
   * Check if the given account is currently locked.
   * Returns true if the account has been locked and the lock has not yet expired.
   */
  isLocked(accountId: string): boolean {
    const record = this.attempts.get(accountId);
    if (!record || record.lockedUntil === null) {
      return false;
    }
    return Date.now() < record.lockedUntil;
  }

  /**
   * Get the number of consecutive failed attempts for the given account.
   */
  getFailedAttempts(accountId: string): number {
    const record = this.attempts.get(accountId);
    return record ? record.failures : 0;
  }

  /**
   * Get the remaining lock time in milliseconds for the given account.
   * Returns 0 if the account is not locked or the lock has expired.
   */
  getRemainingLockTime(accountId: string): number {
    const record = this.attempts.get(accountId);
    if (!record || record.lockedUntil === null) {
      return 0;
    }
    const remaining = record.lockedUntil - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  private getOrCreateRecord(accountId: string): AttemptRecord {
    const existing = this.attempts.get(accountId);
    if (existing) {
      return existing;
    }
    return { failures: 0, lockedUntil: null };
  }
}

/** Singleton instance for application-wide login tracking */
export const loginTracker = new LoginAttemptTracker();
