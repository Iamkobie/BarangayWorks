-- BarangayWorks Initial Schema Migration
-- Enables PostGIS and creates all core tables with constraints

-- Enable PostGIS extension for geographic data types
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'worker', 'admin')),
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Account lockout constraint: failed attempts must be between 0 and 5
ALTER TABLE users ADD CONSTRAINT valid_failed_attempts
  CHECK (failed_login_attempts >= 0 AND failed_login_attempts <= 5);

-- =============================================================================
-- WORKERS TABLE
-- =============================================================================
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  skills TEXT[] NOT NULL,
  barangay TEXT NOT NULL,
  coordinates GEOGRAPHY(POINT, 4326),
  contact_number TEXT NOT NULL,
  profile_image_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'removed')),
  rejection_reason TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Worker name length constraint: max 100 characters
ALTER TABLE workers ADD CONSTRAINT name_length
  CHECK (char_length(name) <= 100);

-- Worker skills count constraint: between 1 and 5 skills
ALTER TABLE workers ADD CONSTRAINT skills_count
  CHECK (array_length(skills, 1) >= 1 AND array_length(skills, 1) <= 5);

-- Valid job categories constraint
ALTER TABLE workers ADD CONSTRAINT valid_skills
  CHECK (skills <@ ARRAY['plumber','electrician','carpenter','mason','laborer']::text[]);

-- Contact number format: Philippine mobile (09XXXXXXXXX)
ALTER TABLE workers ADD CONSTRAINT valid_contact
  CHECK (contact_number ~ '^09[0-9]{9}$');

-- Rejection reason length constraint: 10-500 characters when provided
ALTER TABLE workers ADD CONSTRAINT rejection_reason_length
  CHECK (rejection_reason IS NULL OR
    (char_length(rejection_reason) >= 10 AND char_length(rejection_reason) <= 500));

-- =============================================================================
-- RATINGS TABLE
-- =============================================================================
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating DECIMAL(2, 1) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rating range constraint: 1.0 to 5.0
ALTER TABLE ratings ADD CONSTRAINT valid_rating
  CHECK (rating >= 1.0 AND rating <= 5.0);

-- =============================================================================
-- MESSAGES TABLE
-- =============================================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- BARANGAYS TABLE
-- =============================================================================
CREATE TABLE barangays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  boundary GEOGRAPHY(POLYGON, 4326),
  centroid GEOGRAPHY(POINT, 4326)
);
