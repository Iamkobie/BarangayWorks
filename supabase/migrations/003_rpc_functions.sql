-- Migration: 003_rpc_functions.sql
-- Description: RPC functions for admin worker verification workflow
-- Requirements: 8.1, 8.2, 8.4

-- ============================================================================
-- approve_worker(worker_id UUID)
-- Sets worker verification_status to 'verified' and records verified_at timestamp.
-- Restricted to admin role only.
-- ============================================================================
CREATE OR REPLACE FUNCTION approve_worker(worker_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
  worker_exists BOOLEAN;
BEGIN
  -- Check that the calling user has admin role
  SELECT role INTO caller_role
  FROM users
  WHERE id = auth.uid();

  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Permission denied: only admins can approve workers';
  END IF;

  -- Check that the worker exists
  SELECT EXISTS(SELECT 1 FROM workers WHERE id = worker_id) INTO worker_exists;

  IF NOT worker_exists THEN
    RAISE EXCEPTION 'Worker not found: %', worker_id;
  END IF;

  -- Update worker status to verified
  UPDATE workers
  SET verification_status = 'verified',
      verified_at = NOW(),
      updated_at = NOW()
  WHERE id = worker_id;
END;
$$;

-- ============================================================================
-- reject_worker(worker_id UUID, reason TEXT)
-- Sets worker verification_status to 'rejected' with a rejection reason.
-- Validates reason length (10-500 characters).
-- Restricted to admin role only.
-- ============================================================================
CREATE OR REPLACE FUNCTION reject_worker(worker_id UUID, reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
  worker_exists BOOLEAN;
BEGIN
  -- Check that the calling user has admin role
  SELECT role INTO caller_role
  FROM users
  WHERE id = auth.uid();

  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Permission denied: only admins can reject workers';
  END IF;

  -- Validate rejection reason length (10-500 characters)
  IF reason IS NULL OR char_length(reason) < 10 THEN
    RAISE EXCEPTION 'Rejection reason must be at least 10 characters';
  END IF;

  IF char_length(reason) > 500 THEN
    RAISE EXCEPTION 'Rejection reason must not exceed 500 characters';
  END IF;

  -- Check that the worker exists
  SELECT EXISTS(SELECT 1 FROM workers WHERE id = worker_id) INTO worker_exists;

  IF NOT worker_exists THEN
    RAISE EXCEPTION 'Worker not found: %', worker_id;
  END IF;

  -- Update worker status to rejected with reason
  UPDATE workers
  SET verification_status = 'rejected',
      rejection_reason = reason,
      updated_at = NOW()
  WHERE id = worker_id;
END;
$$;

-- ============================================================================
-- remove_worker(worker_id UUID, reason TEXT)
-- Sets worker verification_status to 'removed' with a removal reason.
-- Restricted to admin role only.
-- ============================================================================
CREATE OR REPLACE FUNCTION remove_worker(worker_id UUID, reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
  worker_exists BOOLEAN;
BEGIN
  -- Check that the calling user has admin role
  SELECT role INTO caller_role
  FROM users
  WHERE id = auth.uid();

  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Permission denied: only admins can remove workers';
  END IF;

  -- Check that the worker exists
  SELECT EXISTS(SELECT 1 FROM workers WHERE id = worker_id) INTO worker_exists;

  IF NOT worker_exists THEN
    RAISE EXCEPTION 'Worker not found: %', worker_id;
  END IF;

  -- Update worker status to removed with reason
  UPDATE workers
  SET verification_status = 'removed',
      rejection_reason = reason,
      updated_at = NOW()
  WHERE id = worker_id;
END;
$$;
