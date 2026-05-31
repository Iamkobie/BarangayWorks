import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LoginAttemptTracker } from './loginTracker';

describe('LoginAttemptTracker', () => {
  let tracker: LoginAttemptTracker;

  beforeEach(() => {
    tracker = new LoginAttemptTracker();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with 0 failed attempts for unknown accounts', () => {
    expect(tracker.getFailedAttempts('user@test.com')).toBe(0);
  });

  it('is not locked for unknown accounts', () => {
    expect(tracker.isLocked('user@test.com')).toBe(false);
  });

  it('increments failure count on recordFailure', () => {
    tracker.recordFailure('user@test.com');
    expect(tracker.getFailedAttempts('user@test.com')).toBe(1);

    tracker.recordFailure('user@test.com');
    expect(tracker.getFailedAttempts('user@test.com')).toBe(2);
  });

  it('does not lock account with fewer than 5 failures', () => {
    for (let i = 0; i < 4; i++) {
      tracker.recordFailure('user@test.com');
    }
    expect(tracker.isLocked('user@test.com')).toBe(false);
    expect(tracker.getFailedAttempts('user@test.com')).toBe(4);
  });

  it('locks account after exactly 5 consecutive failures', () => {
    for (let i = 0; i < 5; i++) {
      tracker.recordFailure('user@test.com');
    }
    expect(tracker.isLocked('user@test.com')).toBe(true);
    expect(tracker.getFailedAttempts('user@test.com')).toBe(5);
  });

  it('locks account for 15 minutes', () => {
    for (let i = 0; i < 5; i++) {
      tracker.recordFailure('user@test.com');
    }

    // Still locked after 14 minutes
    vi.advanceTimersByTime(14 * 60 * 1000);
    expect(tracker.isLocked('user@test.com')).toBe(true);

    // Unlocked after 15 minutes
    vi.advanceTimersByTime(1 * 60 * 1000);
    expect(tracker.isLocked('user@test.com')).toBe(false);
  });

  it('returns remaining lock time in milliseconds', () => {
    for (let i = 0; i < 5; i++) {
      tracker.recordFailure('user@test.com');
    }

    const remaining = tracker.getRemainingLockTime('user@test.com');
    expect(remaining).toBe(15 * 60 * 1000);

    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(tracker.getRemainingLockTime('user@test.com')).toBe(10 * 60 * 1000);
  });

  it('returns 0 remaining lock time when not locked', () => {
    expect(tracker.getRemainingLockTime('user@test.com')).toBe(0);
  });

  it('returns 0 remaining lock time after lock expires', () => {
    for (let i = 0; i < 5; i++) {
      tracker.recordFailure('user@test.com');
    }

    vi.advanceTimersByTime(15 * 60 * 1000);
    expect(tracker.getRemainingLockTime('user@test.com')).toBe(0);
  });

  it('resets failure counter on successful login', () => {
    tracker.recordFailure('user@test.com');
    tracker.recordFailure('user@test.com');
    tracker.recordFailure('user@test.com');

    tracker.recordSuccess('user@test.com');
    expect(tracker.getFailedAttempts('user@test.com')).toBe(0);
    expect(tracker.isLocked('user@test.com')).toBe(false);
  });

  it('clears lockout on successful login', () => {
    for (let i = 0; i < 5; i++) {
      tracker.recordFailure('user@test.com');
    }
    expect(tracker.isLocked('user@test.com')).toBe(true);

    tracker.recordSuccess('user@test.com');
    expect(tracker.isLocked('user@test.com')).toBe(false);
    expect(tracker.getFailedAttempts('user@test.com')).toBe(0);
  });

  it('tracks accounts independently', () => {
    for (let i = 0; i < 5; i++) {
      tracker.recordFailure('user1@test.com');
    }

    expect(tracker.isLocked('user1@test.com')).toBe(true);
    expect(tracker.isLocked('user2@test.com')).toBe(false);
    expect(tracker.getFailedAttempts('user2@test.com')).toBe(0);
  });

  it('allows re-locking after lock expires and 5 more failures', () => {
    // First lockout
    for (let i = 0; i < 5; i++) {
      tracker.recordFailure('user@test.com');
    }
    expect(tracker.isLocked('user@test.com')).toBe(true);

    // Wait for lock to expire
    vi.advanceTimersByTime(15 * 60 * 1000);
    expect(tracker.isLocked('user@test.com')).toBe(false);

    // More failures trigger another lockout
    for (let i = 0; i < 5; i++) {
      tracker.recordFailure('user@test.com');
    }
    expect(tracker.isLocked('user@test.com')).toBe(true);
  });
});
