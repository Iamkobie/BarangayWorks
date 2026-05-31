# Requirements Document

## Introduction

BarangayWorks is a geo-based skilled worker marketplace web application for Quezon City, Philippines. The application enables clients to find nearby skilled workers (plumber, electrician, carpenter, mason, laborer) within selected barangays using a map interface and filtering system. Workers can register their services and appear as pins on the map, while administrators manage verification and quality control of listings.

## Glossary

- **Client**: A registered user who searches for and contacts skilled workers
- **Worker**: A registered service provider who offers skilled labor services within a specific barangay
- **Admin**: A system administrator who verifies workers and manages listings
- **Barangay**: The smallest administrative division in the Philippines; BarangayWorks covers barangays within Quezon City
- **Worker_Pin**: A map marker representing a worker's location on the map interface
- **Worker_Profile**: A detailed view containing a worker's name, skills, barangay, contact number, profile image, and verification status
- **Job_Category**: A classification of skilled work; one of plumber, electrician, carpenter, mason, or laborer
- **Map_View**: The primary interface component displaying a map of Quezon City with worker pins
- **Authentication_System**: The email-based system managing user registration and login
- **Verification_System**: The admin-controlled process for approving or rejecting worker accounts
- **Dashboard**: A role-specific interface providing relevant controls and information to each user type

## Requirements

### Requirement 1: Client Registration and Authentication

**User Story:** As a client, I want to register and log in using my email, so that I can access the marketplace and contact workers.

#### Acceptance Criteria

1. WHEN a client submits a registration form with a valid email and a password that is between 8 and 128 characters long and contains at least one uppercase letter, one lowercase letter, and one digit, THE Authentication_System SHALL create a new client account with an unconfirmed status and send a confirmation email to the provided address
2. WHEN a client submits valid login credentials for a confirmed account, THE Authentication_System SHALL authenticate the client and redirect to the Map_View
3. IF a client submits an invalid email format during registration, THEN THE Authentication_System SHALL display an error message indicating the email format is invalid
4. IF a client submits incorrect login credentials, THEN THE Authentication_System SHALL display an error message indicating invalid credentials without revealing which field is incorrect
5. IF a client submits a registration form with an email address already associated with an existing account, THEN THE Authentication_System SHALL display an error message indicating the email is already registered
6. IF a client fails to provide correct login credentials 5 consecutive times for the same account, THEN THE Authentication_System SHALL lock the account for 15 minutes and display a message indicating the account has been temporarily locked

### Requirement 2: Worker Registration and Profile Creation

**User Story:** As a worker, I want to register as a service provider and create my profile, so that clients can find and contact me.

#### Acceptance Criteria

1. WHEN a worker submits a registration form with name (maximum 100 characters), email, password (minimum 8 characters), at least one and up to five skills selected from the Job_Category list, barangay location, contact number (Philippine mobile format, 11 digits), and profile image (maximum 5MB, JPEG or PNG format), THE Authentication_System SHALL create a new worker account with a pending verification status
2. THE Worker_Profile SHALL contain the worker's name, selected skills from the Job_Category list (minimum 1, maximum 5), barangay location, geographic coordinates, contact number, profile image, and verification status
3. WHEN a worker selects a barangay during registration, THE Authentication_System SHALL associate the corresponding geographic coordinates with the Worker_Profile
4. IF a worker submits a registration form with missing required fields or invalid field values, THEN THE Authentication_System SHALL display an error message for each invalid or missing field indicating the specific validation failure and SHALL NOT create the account
5. IF a worker submits a registration form with an email address already associated with an existing account, THEN THE Authentication_System SHALL display an error message indicating the email is already registered and SHALL NOT create a duplicate account

### Requirement 3: Admin Authentication and Dashboard

**User Story:** As an admin, I want to log in and access an admin dashboard, so that I can manage worker verification and listings.

#### Acceptance Criteria

1. WHEN an admin submits valid login credentials, THE Authentication_System SHALL authenticate the admin and redirect to the admin Dashboard
2. IF an admin submits incorrect login credentials, THEN THE Authentication_System SHALL display an error message indicating invalid credentials without revealing which field is incorrect
3. THE Dashboard SHALL display a list of pending worker registrations showing each worker's name, skills, barangay, and registration date, sorted by registration date in ascending order
4. THE Dashboard SHALL display a list of all verified workers showing each worker's name, skills, barangay, and verification date, with a remove button for each listing
5. IF there are no pending worker registrations, THEN THE Dashboard SHALL display an empty-state message indicating no pending registrations

### Requirement 4: Barangay Selection

**User Story:** As a client, I want to select a barangay from a list of Quezon City barangays, so that I can find workers in my area.

#### Acceptance Criteria

1. THE Map_View SHALL provide a dropdown list of all barangays within Quezon City that filters displayed options by substring match as the client types, with a minimum input of 1 character to trigger filtering
2. WHEN a client selects a barangay from the list, THE Map_View SHALL zoom the map to center on the selected barangay boundaries such that the entire barangay area is visible
3. WHEN a client selects a barangay, THE Map_View SHALL display Worker_Pins only for verified workers located within the selected barangay
4. IF a client selects a barangay that contains no verified workers, THEN THE Map_View SHALL display a message indicating that no workers are available in the selected barangay
5. WHEN a client clears the barangay selection, THE Map_View SHALL return to the default view centered on Quezon City showing all verified workers
6. WHEN no barangay is selected, THE Map_View SHALL display the default map centered on Quezon City showing all verified workers

### Requirement 5: Map Display and Worker Pins

**User Story:** As a client, I want to see workers displayed as pins on a map, so that I can visually identify nearby skilled workers.

#### Acceptance Criteria

1. THE Map_View SHALL display a map centered on Quezon City at a default zoom level showing the entire city boundary
2. THE Map_View SHALL render each verified worker as a Worker_Pin at the geographic coordinates stored in the Worker_Profile
3. WHEN a client clicks a Worker_Pin, THE Map_View SHALL display a preview card showing the worker's name, primary skill from their Job_Category list, average rating (1.0 to 5.0 scale), and verification status
4. WHEN a client clicks outside the preview card or clicks a close button, THE Map_View SHALL dismiss the currently displayed preview card
5. THE Map_View SHALL load and display Worker_Pins within 3 seconds of page load on a connection with at least 10 Mbps download speed
6. IF no verified workers exist within the current map view, THEN THE Map_View SHALL display a message indicating that no workers are available in the displayed area

### Requirement 6: Category Filtering

**User Story:** As a client, I want to filter workers by job category, so that I can find the specific type of skilled worker I need.

#### Acceptance Criteria

1. THE Map_View SHALL provide a sidebar filter panel listing all Job_Category options: plumber, electrician, carpenter, mason, and laborer, with each option displaying a visible selected or unselected state
2. WHEN a client selects one or more Job_Category filters, THE Map_View SHALL display only Worker_Pins for workers whose skills include at least one of the selected categories
3. WHEN a client changes filter selections, THE Map_View SHALL update the displayed Worker_Pins within 500 milliseconds
4. WHEN no category filter is selected, THE Map_View SHALL display Worker_Pins for all verified workers in the current view
5. THE Map_View SHALL provide a clear-all control in the filter panel that deselects all active Job_Category filters and restores the unfiltered view
6. WHEN both a barangay selection and one or more Job_Category filters are active, THE Map_View SHALL display only Worker_Pins for verified workers that match the selected barangay AND have at least one skill in the selected categories

### Requirement 7: Worker Profile View

**User Story:** As a client, I want to view a worker's full profile, so that I can evaluate their skills and contact them.

#### Acceptance Criteria

1. WHEN a client clicks on a Worker_Pin preview card, THE Map_View SHALL display the full Worker_Profile page within 2 seconds of the click
2. THE Worker_Profile page SHALL display the worker's name, profile image, list of skills from the Job_Category list, barangay location, rating displayed as a numeric value on a 1 to 5 scale with one decimal place, and a verification badge indicating verified status
3. IF the worker has not yet received any ratings, THEN THE Worker_Profile page SHALL display "No ratings yet" in place of the numeric rating value
4. THE Worker_Profile page SHALL provide a call button that initiates a phone call to the worker's registered contact number using the device's native telephone handler
5. THE Worker_Profile page SHALL provide a chat button that opens an in-app messaging interface pre-addressed to the selected worker
6. IF the Worker_Profile page fails to load due to a network error or the worker's profile is no longer available, THEN THE Map_View SHALL display an error message indicating the profile cannot be loaded and allow the client to return to the map

### Requirement 8: Worker Verification by Admin

**User Story:** As an admin, I want to verify or reject worker accounts, so that only legitimate workers appear on the marketplace.

#### Acceptance Criteria

1. WHEN an admin clicks the approve button on a pending worker registration, THE Verification_System SHALL set the worker's verification status to verified, display the Worker_Pin on the Map_View within 5 seconds, and display a success confirmation message to the admin
2. WHEN an admin clicks the reject button on a pending worker registration, THE Verification_System SHALL require the admin to enter a rejection reason between 10 and 500 characters, set the worker's status to rejected, and notify the worker via email with the rejection reason
3. WHEN an admin clicks the remove button on a verified worker listing, THE Verification_System SHALL display a confirmation prompt before proceeding with the removal
4. WHEN an admin confirms the removal of a verified worker listing, THE Verification_System SHALL remove the Worker_Pin from the Map_View, set the worker's status to removed, and notify the worker via email with the removal reason
5. IF an admin attempts to reject a worker without providing a rejection reason or with a reason shorter than 10 characters, THEN THE Verification_System SHALL display an error message indicating the rejection reason is required and must be at least 10 characters
6. THE Map_View SHALL display only workers with a verified status as Worker_Pins

### Requirement 9: Role-Based Dashboard

**User Story:** As a user, I want to see a dashboard relevant to my role, so that I can access the features appropriate to my account type.

#### Acceptance Criteria

1. WHEN a client logs in, THE Dashboard SHALL display the Map_View with barangay selection and category filters within 3 seconds of successful authentication
2. WHEN a worker logs in, THE Dashboard SHALL display the worker's own profile information (name, skills, barangay, contact number, profile image), current verification status (pending, verified, or rejected), and controls to edit their name, skills, contact number, and profile image within 3 seconds of successful authentication
3. WHEN an admin logs in, THE Dashboard SHALL display the count of pending verifications, total verified workers count, and controls to approve, reject, or remove worker listings within 3 seconds of successful authentication
4. IF the system cannot determine the user's role after successful authentication, THEN THE Dashboard SHALL display an error message indicating the account type is unrecognized and provide a link to contact support

### Requirement 10: Mobile-First Responsive Design

**User Story:** As a user, I want to use the application on my mobile device, so that I can find or offer services on the go.

#### Acceptance Criteria

1. THE Map_View SHALL render on screen widths from 320px to 1920px without horizontal scrolling, without content overlapping, and with all interactive elements visible and accessible
2. THE Map_View SHALL render all interactive elements (buttons, links, map controls, filter options, and Worker_Pins) with a minimum tap target area of 44x44 pixels
3. WHILE the application is viewed on a screen width below 768px, THE Map_View SHALL collapse the sidebar filter panel into a toggleable overlay accessible via a persistent filter icon button
4. THE Map_View SHALL achieve a Lighthouse mobile performance score of 70 or above when tested using Lighthouse default mobile emulation settings (simulated throttling, Moto G Power device)
5. WHILE the application is viewed on a screen width below 768px, THE Worker_Profile page and Dashboard SHALL stack content in a single-column layout without horizontal scrolling

### Requirement 11: Three-Click Worker Discovery

**User Story:** As a client, I want to find a worker in three clicks or fewer, so that I can quickly get the help I need.

#### Acceptance Criteria

1. THE Map_View SHALL enable a client to navigate from the homepage to a Worker_Pin information display in three or fewer discrete user interactions following the path: select barangay (interaction 1), select category filter (interaction 2), click Worker_Pin (interaction 3), where each interaction is defined as a single tap or click on an interactive element
2. WHEN a client clicks a Worker_Pin, THE Map_View SHALL display a preview card containing the worker's name, primary skill, rating, verification status, and a contact action button, enabling the client to decide whether to contact the worker without additional navigation
3. IF no workers match the selected barangay and category filter combination, THEN THE Map_View SHALL display a message indicating no workers are available for the selected criteria
