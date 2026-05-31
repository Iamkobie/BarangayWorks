-- ============================================================
-- Row Level Security (RLS) Policies for BarangayWorks
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE barangays ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================

-- Users can read their own record
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Users can update their own record
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any user record
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- WORKERS TABLE POLICIES
-- ============================================================

-- Verified workers are viewable by any authenticated user
CREATE POLICY "Verified workers are viewable by authenticated users"
  ON workers FOR SELECT
  USING (auth.role() = 'authenticated' AND verification_status = 'verified');

-- Workers can view their own profile regardless of verification status
CREATE POLICY "Workers can view own profile"
  ON workers FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all workers (including pending, rejected, removed)
CREATE POLICY "Admins can view all workers"
  ON workers FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update any worker (verification status changes)
CREATE POLICY "Admins can update worker status"
  ON workers FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Workers can update their own profile fields
CREATE POLICY "Workers can update own profile"
  ON workers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Workers can insert their own profile during registration
CREATE POLICY "Workers can insert own profile"
  ON workers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- RATINGS TABLE POLICIES
-- ============================================================

-- Authenticated users can read all ratings
CREATE POLICY "Authenticated users can view all ratings"
  ON ratings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Clients can insert ratings (they are the client_id)
CREATE POLICY "Clients can insert ratings"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- ============================================================
-- MESSAGES TABLE POLICIES
-- ============================================================

-- Users can read messages where they are sender or receiver
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can insert messages where they are the sender
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can update messages they received (e.g., mark as read)
CREATE POLICY "Users can update received messages"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- ============================================================
-- BARANGAYS TABLE POLICIES
-- ============================================================

-- Authenticated users can read all barangays
CREATE POLICY "Authenticated users can view all barangays"
  ON barangays FOR SELECT
  USING (auth.role() = 'authenticated');
