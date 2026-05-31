<p align="center">
  <img src="https://img.shields.io/badge/👷-BarangayWorks-1E40AF?style=for-the-badge&labelColor=F59E0B" alt="BarangayWorks" />
</p>

<h1 align="center">BarangayWorks</h1>

<p align="center">
  <strong>Find Skilled Workers in Your Barangay</strong><br/>
  A geo-based skilled worker marketplace connecting residents of Quezon City with verified local service providers.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Leaflet-Maps-199900?logo=leaflet&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white" />
</p>

---

## 🌟 What is BarangayWorks?

BarangayWorks is a web-based platform that connects residents of Quezon City with verified local skilled workers — plumbers, electricians, carpenters, masons, and laborers — all within their barangay.

**The Problem:** Finding a trusted worker in the Philippines means posting on Facebook groups, asking neighbors, and waiting hours with no guarantee of quality or safety.

**Our Solution:** A map-based marketplace where verified workers are pinned to their exact location, rated by the community, and available at the tap of a button.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🗺️ **Interactive Map** | Leaflet map restricted to Quezon City with real-time worker pins |
| 📍 **Location Pinning** | Workers pin their exact location during registration |
| 🔍 **Smart Filtering** | Filter by barangay, job category, or both simultaneously |
| 🏆 **Trust Score** | Algorithmic trust score based on verification, ratings, and job history |
| 🚨 **Emergency Requests** | One-tap emergency service requests for urgent situations |
| ⭐ **Rating System** | 5-star rating system with reviews after job completion |
| ✅ **Admin Verification** | Barangay-level worker verification workflow |
| 📱 **Mobile-First** | Responsive design optimized for 320px-1920px screens |
| 🔐 **Role-Based Access** | Three distinct dashboards: Client, Worker, Admin |
| 💬 **In-App Messaging** | Real-time chat between clients and workers |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│  React + TypeScript + Tailwind CSS + Leaflet Maps   │
├─────────────────────────────────────────────────────┤
│                    Backend                           │
│  Supabase (PostgreSQL + PostGIS + Auth + Storage)   │
├─────────────────────────────────────────────────────┤
│                   Database                          │
│  users | workers | ratings | messages | barangays   │
│  service_requests | PostGIS spatial indexes         │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/Iamkobie/BarangayWorks.git
cd BarangayWorks
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your Project URL and anon key
3. Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run database migrations

In the Supabase SQL Editor, run these files in order:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_rpc_functions.sql`
4. `supabase/migrations/004_seed_barangays.sql`

### 5. Create a storage bucket

In Supabase Dashboard → Storage → Create bucket named `profiles` (set to public).

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 👥 User Roles

### 🏠 Client
- Browse workers on an interactive map
- Filter by barangay and job category
- Send service requests to workers
- Rate workers after job completion
- Emergency service requests

### 🔧 Worker
- Register with skills, barangay, and exact map location
- Receive and manage service requests
- Toggle online/offline status
- View profile stats (views, jobs, response time)
- Update location anytime

### 🏛️ Admin
- Review and approve/reject worker registrations
- View worker credentials and verification status
- Monitor service requests across the platform
- Remove workers if needed

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch
```

The project includes:
- **Property-based tests** (fast-check) for validation logic
- **Unit tests** for utilities and components
- **119 tests** passing across 11 test files

---

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Map/            # Map-related components (MapView, WorkerPin, etc.)
│   ├── Chat/           # Chat interface
│   ├── LocationPicker  # Map-based location selector
│   ├── RatingModal     # Star rating component
│   └── Toast           # Notification system
├── pages/              # Route pages (Login, Dashboards, etc.)
├── services/           # Supabase client, auth, messaging
├── store/              # Zustand state management
├── data/               # Mock workers, barangay data
├── types/              # TypeScript interfaces
├── utils/              # Validation, filters, helpers
└── tests/              # Property-based and unit tests
```

---

## 🎨 Design System

- **Colors:** Deep Blue (#1E40AF), Golden Yellow (#F59E0B), Emerald (#10B981)
- **Typography:** Inter font family
- **Animations:** fadeIn, scaleIn, slideUp, bounceIn, pulseRing
- **Tap targets:** Minimum 44×44px for all interactive elements
- **Responsive:** Mobile-first, 320px to 1920px

---

## 🗺️ Roadmap

| Phase | Focus |
|-------|-------|
| ✅ Phase 1 | MVP — Map, filtering, registration, verification |
| 🔄 Phase 2 | Push notifications, booking calendar, SMS verification |
| 📋 Phase 3 | Payment integration (GCash/Maya), analytics dashboard |
| 🌏 Phase 4 | Expand to all Metro Manila cities |
| 🇵🇭 Phase 5 | National expansion with LGU partnerships |

---

## 🛡️ Security

- Row Level Security (RLS) on all database tables
- JWT-based authentication via Supabase Auth
- Input validation on both client and server
- Account lockout after 5 failed login attempts
- No sensitive data exposed in client bundle

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 👨‍💻 Built By

**Kobie Calingasan** — Full-stack Developer

- GitHub: [@Iamkobie](https://github.com/Iamkobie)

---

## 📄 License

This project is built for the community of Quezon City. All rights reserved.

---

<p align="center">
  <strong>BarangayWorks</strong> — Connecting communities, one skill at a time. 🇵🇭
</p>
