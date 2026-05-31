# Implementation Plan: BarangayWorks

## Overview

This plan implements a geo-based skilled worker marketplace for Quezon City using React + TypeScript, Supabase (PostgreSQL + PostGIS), Leaflet maps, Tailwind CSS, and Zustand state management. Tasks are ordered to build foundational layers first (database, auth, types), then core features (map, filtering, profiles), then admin workflows, and finally polish (responsive design, messaging, performance).

## Tasks

- [x] 1. Set up project structure, dependencies, and core types
  - [x] 1.1 Initialize React + TypeScript project with Vite, install dependencies (Tailwind CSS, Zustand, Leaflet, react-leaflet, @supabase/supabase-js, react-router-dom, fast-check), and configure Tailwind
    - Create Vite React-TS project
    - Install and configure Tailwind CSS with mobile-first breakpoints
    - Install Zustand, Leaflet, react-leaflet, @supabase/supabase-js, react-router-dom
    - Install fast-check as dev dependency for property-based testing
    - Set up folder structure: `src/components`, `src/pages`, `src/services`, `src/store`, `src/types`, `src/utils`, `src/tests`
    - _Requirements: 10.1, 10.4_

  - [x] 1.2 Define TypeScript types, interfaces, and enums for the entire application
    - Create `src/types/index.ts` with all interfaces: `ClientRegistrationData`, `WorkerRegistrationData`, `WorkerPin`, `WorkerPreview`, `WorkerProfile`, `PendingWorker`, `VerifiedWorker`, `WorkerFilters`, `AppError`
    - Define `JobCategory`, `VerificationStatus`, `UserRole` types
    - Define `BarangayGeoJSON`, `BarangayFeature` interfaces for map data
    - _Requirements: 2.2, 5.3, 6.2_

  - [x] 1.3 Set up Supabase client configuration and environment variables
    - Create `src/services/supabase.ts` with Supabase client initialization
    - Create `.env.example` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
    - _Requirements: 1.1, 1.2_

- [x] 2. Set up database schema and RLS policies in Supabase
  - [x] 2.1 Create SQL migration for users, workers, ratings, messages, and barangays tables with PostGIS extension
    - Create `supabase/migrations/001_initial_schema.sql`
    - Enable PostGIS extension
    - Create `users` table with role, failed_login_attempts, locked_until fields
    - Create `workers` table with skills array, coordinates (geography POINT), verification_status, rejection_reason
    - Create `ratings` table with 1.0-5.0 constraint
    - Create `messages` table with sender_id, receiver_id, content, is_read
    - Create `barangays` table with name, boundary (POLYGON), centroid (POINT)
    - Add all CHECK constraints (skills_count, valid_skills, valid_contact, name_length, valid_rating, rejection_reason_length, valid_failed_attempts)
    - _Requirements: 2.1, 2.2, 2.3, 8.2_

  - [x] 2.2 Create SQL migration for Row Level Security policies
    - Create `supabase/migrations/002_rls_policies.sql`
    - Enable RLS on all tables
    - Implement policies: verified workers viewable by authenticated users, workers can view own profile, admins can view/update all workers, workers can update own profile
    - Implement message policies: users can read/write their own messages
    - _Requirements: 3.3, 3.4, 8.6, 9.2_

  - [x] 2.3 Create SQL migration for RPC functions (approve_worker, reject_worker, remove_worker)
    - Create `supabase/migrations/003_rpc_functions.sql`
    - Implement `approve_worker(worker_id UUID)` function that sets status to verified and verified_at timestamp
    - Implement `reject_worker(worker_id UUID, reason TEXT)` function with reason length validation
    - Implement `remove_worker(worker_id UUID, reason TEXT)` function
    - All functions restricted to admin role
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 2.4 Create seed data SQL for Quezon City barangays with boundaries and centroids
    - Create `supabase/migrations/004_seed_barangays.sql`
    - Insert all Quezon City barangays with name, boundary polygon, and centroid point
    - Ensure coordinates fall within QC bounding box (14.58°N-14.78°N, 121.0°E-121.12°E)
    - _Requirements: 2.3, 4.1, 4.2_

- [x] 3. Implement validation utilities
  - [x] 3.1 Implement password validation utility function
    - Create `src/utils/validation.ts`
    - Implement `validatePassword(password: string): { valid: boolean; errors: string[] }` enforcing 8-128 chars, at least one uppercase, one lowercase, one digit
    - _Requirements: 1.1_

  - [x] 3.2 Write property test for password validation (Property 1)
    - **Property 1: Password validation accepts only compliant passwords**
    - Use fast-check to generate random strings (0-200 chars, various character sets)
    - Assert: function accepts if and only if 8-128 chars AND has uppercase AND has lowercase AND has digit
    - **Validates: Requirements 1.1**

  - [x] 3.3 Implement email validation utility function
    - Add `validateEmail(email: string): boolean` to `src/utils/validation.ts`
    - Validate: exactly one @, non-empty local part, non-empty domain with at least one dot
    - _Requirements: 1.3_

  - [x] 3.4 Write property test for email validation (Property 2)
    - **Property 2: Email validation correctly classifies email formats**
    - Use fast-check to generate random strings with/without @, dots, valid/invalid formats
    - Assert: function accepts if and only if valid email format
    - **Validates: Requirements 1.3**

  - [x] 3.5 Implement worker registration validation function
    - Add `validateWorkerRegistration(data: Partial<WorkerRegistrationData>): { valid: boolean; errors: Record<string, string> }` to `src/utils/validation.ts`
    - Validate: name ≤ 100 chars, 1-5 skills from JobCategory, 11-digit PH mobile (09XXXXXXXXX), image ≤ 5MB JPEG/PNG
    - Return per-field error messages for each invalid field
    - _Requirements: 2.1, 2.4_

  - [x] 3.6 Write property test for worker registration validation (Property 4)
    - **Property 4: Worker registration validation reports all field errors**
    - Use fast-check to generate random worker data with valid/invalid field combinations
    - Assert: for N invalid fields, exactly N error messages returned; accepts only when all fields valid
    - **Validates: Requirements 2.1, 2.4**

  - [x] 3.7 Implement rejection reason validation function
    - Add `validateRejectionReason(reason: string): boolean` to `src/utils/validation.ts`
    - Accept if and only if character length is between 10 and 500 inclusive
    - _Requirements: 8.2, 8.5_

  - [x] 3.8 Write property test for rejection reason validation (Property 12)
    - **Property 12: Rejection reason validation enforces length constraints**
    - Use fast-check to generate random strings (0-1000 chars)
    - Assert: function accepts if and only if 10 ≤ length ≤ 500
    - **Validates: Requirements 8.2**

- [x] 4. Checkpoint - Ensure all validation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement authentication service and login tracking
  - [x] 5.1 Implement auth service with registration and login functions
    - Create `src/services/auth.ts` implementing `AuthService` interface
    - Implement `registerClient()` using Supabase Auth signup with client role metadata
    - Implement `registerWorker()` using Supabase Auth signup with worker role metadata, then insert into workers table
    - Implement `login()` with credential validation, failed attempt tracking, and account lockout logic (5 failures → 15 min lock)
    - Implement `logout()` and `getCurrentUser()`
    - _Requirements: 1.1, 1.2, 1.4, 1.6, 2.1_

  - [x] 5.2 Implement login attempt tracker with lockout logic
    - Create `src/utils/loginTracker.ts` with `LoginAttemptTracker` class
    - Track consecutive failed attempts per account
    - Lock account for 15 minutes after 5 consecutive failures
    - Reset counter on successful login
    - _Requirements: 1.6_

  - [x] 5.3 Write property test for account lockout logic (Property 3)
    - **Property 3: Account lockout triggers at exactly 5 consecutive failures**
    - Use fast-check to generate random sequences of success/failure login attempts
    - Assert: account locked if and only if 5+ consecutive failures; success resets counter
    - **Validates: Requirements 1.6**

- [x] 6. Implement Zustand state management store
  - [x] 6.1 Create auth store with user session, role, and login state
    - Create `src/store/authStore.ts` using Zustand
    - Store: user session, role (client/worker/admin), isAuthenticated, isLoading
    - Actions: setUser, clearUser, setRole
    - _Requirements: 1.2, 9.1, 9.2, 9.3_

  - [x] 6.2 Create map store with filters, selected barangay, and worker pins state
    - Create `src/store/mapStore.ts` using Zustand
    - Store: selectedBarangay, selectedCategories, workerPins, mapCenter, mapZoom
    - Actions: setBarangay, clearBarangay, toggleCategory, clearCategories, setWorkerPins
    - _Requirements: 4.2, 4.5, 6.1, 6.5_

- [x] 7. Implement barangay data and filtering logic
  - [x] 7.1 Create barangay data service with GeoJSON loading and coordinate lookup
    - Create `src/services/barangay.ts`
    - Load Quezon City barangay GeoJSON data (pre-bundled or fetched from Supabase)
    - Implement `getBarangayCoordinates(name: string): { lat: number; lng: number }` returning centroid
    - Implement `getBarangayBounds(name: string): LatLngBounds` for map zoom
    - _Requirements: 2.3, 4.2_

  - [x] 7.2 Write property test for barangay coordinate lookup (Property 5)
    - **Property 5: Barangay-to-coordinates mapping produces valid Quezon City coordinates**
    - Use fast-check to select random valid barangay names
    - Assert: returned coordinates fall within QC bounding box (14.58-14.78°N, 121.0-121.12°E)
    - **Validates: Requirements 2.3**

  - [x] 7.3 Implement barangay substring filter function
    - Add `filterBarangays(searchString: string, barangayNames: string[]): string[]` to `src/utils/filters.ts`
    - Return all barangay names containing the search string as case-insensitive substring
    - Minimum 1 character input to trigger filtering
    - _Requirements: 4.1_

  - [x] 7.4 Write property test for barangay substring filter (Property 7)
    - **Property 7: Barangay substring filter returns exactly matching results**
    - Use fast-check to generate random search strings and barangay name lists
    - Assert: returns all and only names containing the search string (case-insensitive)
    - **Validates: Requirements 4.1**

- [x] 8. Implement worker filtering logic
  - [x] 8.1 Implement combined worker filter function (barangay + category + verification status)
    - Create `src/utils/filters.ts` with `filterWorkers(workers: Worker[], filters: WorkerFilters): Worker[]`
    - Filter logic: verified status AND (if barangay selected, matches barangay) AND (if categories selected, worker has at least one matching skill)
    - _Requirements: 4.3, 6.2, 6.6, 8.6_

  - [x] 8.2 Write property test for combined worker filter (Property 8)
    - **Property 8: Combined worker filter returns only workers matching all active criteria**
    - Use fast-check to generate random worker sets and filter combinations
    - Assert: returns all and only workers matching verified + barangay + category criteria
    - **Validates: Requirements 4.3, 5.2, 6.2, 6.6, 8.6**

  - [x] 8.3 Write property test for filter clear round-trip (Property 9)
    - **Property 9: Clearing barangay selection restores full verified worker set**
    - Use fast-check to generate random workers, apply barangay filter, clear it
    - Assert: result after clearing equals initial unfiltered verified worker set
    - **Validates: Requirements 4.5**

- [x] 9. Checkpoint - Ensure all filtering and validation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement map components
  - [x] 10.1 Create MapView component with Leaflet map centered on Quezon City
    - Create `src/components/Map/MapView.tsx`
    - Initialize Leaflet map centered on Quezon City with appropriate default zoom
    - Use OpenStreetMap tiles
    - Integrate with mapStore for reactive center/zoom updates
    - Handle barangay selection zoom (fit bounds to selected barangay)
    - _Requirements: 5.1, 4.2_

  - [x] 10.2 Create WorkerPin component with click-to-preview behavior
    - Create `src/components/Map/WorkerPin.tsx`
    - Render Leaflet markers at worker coordinates
    - On click, display preview card popup
    - _Requirements: 5.2, 5.3_

  - [x] 10.3 Create WorkerPreviewCard component with name, skill, rating, verification, and contact button
    - Create `src/components/Map/WorkerPreviewCard.tsx`
    - Display: worker name, primary skill, average rating (or "No ratings yet"), verification badge, contact action button
    - Dismiss on outside click or close button
    - Link to full profile page on card click
    - _Requirements: 5.3, 5.4, 11.2_

  - [x] 10.4 Write property test for preview card rendering (Property 10)
    - **Property 10: Preview card contains all required worker information**
    - Use fast-check to generate random worker profile data
    - Assert: rendered output contains name, primary skill, rating (or "No ratings yet"), verification status, contact button
    - **Validates: Requirements 5.3, 11.2**

  - [x] 10.5 Create BarangaySelector dropdown component with typeahead filtering
    - Create `src/components/Map/BarangaySelector.tsx`
    - Dropdown with text input for substring filtering (min 1 char)
    - On selection: update mapStore, zoom map to barangay bounds, filter pins
    - On clear: reset to default QC view with all verified workers
    - Show empty state message when no workers in selected barangay
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 10.6 Create FilterPanel component with job category checkboxes and clear-all button
    - Create `src/components/Map/FilterPanel.tsx`
    - Display all 5 JobCategory options with visible selected/unselected state
    - Toggle categories on click, update mapStore
    - Clear-all button to deselect all filters
    - Collapse to toggleable overlay on screens < 768px
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 10.3_

- [x] 11. Implement authentication pages
  - [x] 11.1 Create Login page with email/password form and error handling
    - Create `src/pages/Login.tsx`
    - Email and password inputs with client-side validation
    - Display generic error message on invalid credentials (no field leakage)
    - Display lockout message when account is locked
    - Redirect to role-appropriate dashboard on success
    - _Requirements: 1.2, 1.4, 1.6, 3.1, 3.2_

  - [x] 11.2 Create Client Registration page with email/password form
    - Create `src/pages/ClientRegister.tsx`
    - Email and password inputs with real-time validation feedback
    - Password requirements: 8-128 chars, uppercase, lowercase, digit
    - Display duplicate email error
    - Show confirmation email sent message on success
    - _Requirements: 1.1, 1.3, 1.5_

  - [x] 11.3 Create Worker Registration page with full profile form and image upload
    - Create `src/pages/WorkerRegister.tsx`
    - Fields: name, email, password, skills (multi-select, 1-5), barangay (dropdown), contact number, profile image upload
    - Client-side validation with per-field error messages
    - Image validation: max 5MB, JPEG/PNG only
    - Upload image to Supabase Storage on submit
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 12. Implement role-based routing and dashboards
  - [x] 12.1 Create protected route wrapper and role-based router
    - Create `src/components/ProtectedRoute.tsx`
    - Check auth state, redirect to login if unauthenticated
    - Route based on role: client → MapView, worker → WorkerDashboard, admin → AdminDashboard
    - Display error for unrecognized role with support contact link
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 12.2 Create Client Dashboard page (MapView with filters)
    - Create `src/pages/ClientDashboard.tsx`
    - Compose MapView, BarangaySelector, and FilterPanel
    - Load within 3 seconds of authentication
    - _Requirements: 9.1, 11.1_

  - [x] 12.3 Create Worker Dashboard page with profile view and edit controls
    - Create `src/pages/WorkerDashboard.tsx`
    - Display worker's own profile: name, skills, barangay, contact, image, verification status
    - Edit controls for name, skills, contact number, profile image
    - Show current verification status (pending/verified/rejected)
    - _Requirements: 9.2_

  - [x] 12.4 Create Worker Profile page (full public view)
    - Create `src/pages/WorkerProfile.tsx`
    - Display: name, profile image, all skills, barangay, rating (1 decimal place or "No ratings yet"), verification badge
    - Call button using `tel:` href with worker's contact number
    - Chat button to open messaging interface
    - Error state for unavailable profiles with return-to-map option
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 12.5 Write property test for worker profile display (Property 11)
    - **Property 11: Worker profile display contains all required fields with correct formatting**
    - Use fast-check to generate random worker profile data with/without ratings
    - Assert: output contains name, image URL, all skills, barangay, verification badge, rating with 1 decimal place (or "No ratings yet")
    - **Validates: Requirements 2.2, 7.2**

- [x] 13. Implement Admin Dashboard and verification workflow
  - [x] 13.1 Create Admin Dashboard page with pending and verified worker lists
    - Create `src/pages/AdminDashboard.tsx`
    - Display pending worker count and total verified worker count
    - Pending list: worker name, skills, barangay, registration date (sorted ascending by date)
    - Verified list: worker name, skills, barangay, verification date, remove button
    - Empty state message when no pending registrations
    - _Requirements: 3.3, 3.4, 3.5, 9.3_

  - [x] 13.2 Write property test for pending workers sort order (Property 6)
    - **Property 6: Pending workers list is always sorted by registration date ascending**
    - Use fast-check to generate random worker arrays with random dates
    - Assert: for every adjacent pair, worker_i.created_at ≤ worker_j.created_at
    - **Validates: Requirements 3.3**

  - [x] 13.3 Implement approve/reject/remove worker actions with validation
    - Add approve, reject, and remove action handlers to AdminDashboard
    - Approve: call `approve_worker` RPC, show success message, worker pin appears on map
    - Reject: validate rejection reason (10-500 chars), call `reject_worker` RPC, trigger email notification
    - Remove: show confirmation prompt, call `remove_worker` RPC, remove pin from map, trigger email notification
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 14. Checkpoint - Ensure all component and integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implement in-app messaging
  - [x] 15.1 Create messaging service and real-time subscription
    - Create `src/services/messaging.ts`
    - Implement `sendMessage(receiverId: string, content: string): Promise<void>`
    - Implement `getConversation(otherUserId: string): Promise<Message[]>`
    - Subscribe to Supabase Realtime for new messages
    - _Requirements: 7.5_

  - [x] 15.2 Create Chat interface component
    - Create `src/components/Chat/ChatWindow.tsx`
    - Message list with sender/receiver bubbles
    - Text input with send button
    - Real-time message updates via Supabase Realtime subscription
    - Pre-addressed to selected worker when opened from profile
    - _Requirements: 7.5_

- [x] 16. Implement responsive design and mobile optimizations
  - [x] 16.1 Apply mobile-first responsive styles across all components
    - Ensure no horizontal scrolling from 320px to 1920px
    - All interactive elements have minimum 44x44px tap targets
    - FilterPanel collapses to toggleable overlay below 768px
    - WorkerProfile and Dashboard use single-column layout below 768px
    - Stack content vertically on mobile, use grid/flex layouts on desktop
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

  - [x] 16.2 Write unit tests for responsive breakpoint behavior
    - Test FilterPanel collapse at 768px breakpoint
    - Test tap target sizes meet 44x44px minimum
    - Test single-column layout on mobile viewports
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [x] 17. Wire all components together and implement app routing
  - [x] 17.1 Set up React Router with all routes and integrate all pages
    - Create `src/App.tsx` with complete routing configuration
    - Routes: `/login`, `/register/client`, `/register/worker`, `/dashboard`, `/worker/:id`, `/chat/:userId`
    - Wrap with ProtectedRoute where needed
    - Add navigation components and layout wrappers
    - Wire Supabase auth state listener to Zustand store
    - _Requirements: 1.2, 3.1, 9.1, 9.2, 9.3, 9.4_

  - [x] 17.2 Implement error boundary and loading states
    - Create `src/components/ErrorBoundary.tsx` for graceful error handling
    - Add loading spinners/skeletons for async data fetching
    - Implement network error retry with exponential backoff (max 3 attempts)
    - Add empty state components for no-workers scenarios
    - _Requirements: 4.4, 5.6, 7.6_

- [x] 18. Final checkpoint - Ensure all tests pass and application is functional
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- The tech stack is React + TypeScript, Supabase, Leaflet, Tailwind CSS, Zustand as specified in the design
- Database migrations should be run against a local Supabase instance during development
- GeoJSON barangay boundary data for Quezon City should be sourced from OpenStreetMap or Philippine government open data

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["3.1", "3.3", "3.5", "3.7", "6.1", "6.2"] },
    { "id": 3, "tasks": ["3.2", "3.4", "3.6", "3.8", "5.1", "5.2", "7.1", "7.3"] },
    { "id": 4, "tasks": ["5.3", "7.2", "7.4", "8.1"] },
    { "id": 5, "tasks": ["8.2", "8.3", "10.1", "10.5", "10.6", "11.1", "11.2", "11.3"] },
    { "id": 6, "tasks": ["10.2", "10.3", "12.1", "12.2", "12.3"] },
    { "id": 7, "tasks": ["10.4", "12.4", "13.1"] },
    { "id": 8, "tasks": ["12.5", "13.2", "13.3", "15.1"] },
    { "id": 9, "tasks": ["15.2", "16.1"] },
    { "id": 10, "tasks": ["16.2", "17.1", "17.2"] }
  ]
}
```
