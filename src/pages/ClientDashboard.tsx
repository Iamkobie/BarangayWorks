import { useState, useEffect } from 'react';
import MapView from '../components/Map/MapView';
import BarangaySelector from '../components/Map/BarangaySelector';
import FilterPanel from '../components/Map/FilterPanel';
import { useMapStore } from '../store/mapStore';
import { mockWorkers, registerRealWorker, getMockWorkerById } from '../data/mockWorkers';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { logout } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import type { JobCategory, WorkerPin } from '../types';

/**
 * ClientDashboard - Main dashboard for client users.
 * Composes MapView, BarangaySelector, and FilterPanel in a responsive layout.
 *
 * Desktop (≥768px): Sidebar with filters on the left, map taking remaining space.
 * Mobile (<768px): Full-width map with a toggleable filter overlay.
 */
export default function ClientDashboard() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const { setWorkerPins, workerPins, selectedCategories, selectedBarangay } = useMapStore();
  const { clearUser } = useAuthStore();
  const navigate = useNavigate();
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencySent, setEmergencySent] = useState(false);
  const [emergencyCategory, setEmergencyCategory] = useState<string | null>(null);

  // Activity feed
  const allActivities = [
    '🟢 Juan Dela Cruz just went online (Diliman)',
    '✅ Maria Santos completed a job',
    '⭐ New 5-star review for Pedro Reyes',
    '🆕 New worker registered in Fairview',
    '🟢 Ana Reyes just went online (Fairview)',
    '✅ Roberto Cruz completed a job',
    '⭐ New 4-star review for Rosa Mendoza',
    '🆕 New worker registered in Commonwealth',
    '🟢 Carlos Santos just went online (Commonwealth)',
    '✅ Elena Ramos completed a job',
  ];
  const [activityIndex, setActivityIndex] = useState(0);
  const [activities, setActivities] = useState<string[]>(allActivities.slice(0, 4));

  // Rotate activity feed every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActivityIndex((prev) => {
        const next = (prev + 1) % allActivities.length;
        setActivities([
          allActivities[next],
          allActivities[(next + 1) % allActivities.length],
          allActivities[(next + 2) % allActivities.length],
          allActivities[(next + 3) % allActivities.length],
        ]);
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Reactively filter pins when categories or barangay change
  // Combines mock workers + real verified workers from Supabase
  const [realWorkers, setRealWorkers] = useState<WorkerPin[]>([]);

  // Fetch real verified workers from Supabase on mount
  useEffect(() => {
    const fetchRealWorkers = async () => {
      try {
        // Use RPC function that returns decoded lat/lng from PostGIS
        const { data, error } = await supabase.rpc('get_verified_workers');

        if (error) {
          console.error('Supabase RPC error:', error.message);
          return;
        }

        if (data && data.length > 0) {
          const pins: WorkerPin[] = data.map((w: any) => {
            const skill = (w.skills?.[0] as JobCategory) || 'laborer';

            // Register this real worker so the pin popup can show full details
            registerRealWorker({
              id: w.id,
              name: w.name,
              latitude: w.latitude,
              longitude: w.longitude,
              primarySkill: skill,
              skills: w.skills || [skill],
              barangay: w.barangay,
              contactNumber: w.contact_number || '',
              isVerified: true,
              verificationStatus: 'verified',
              averageRating: null,
              profileImageUrl: w.profile_image_url || `https://i.pravatar.cc/150?u=${w.id}`,
              isOnline: w.is_online ?? true,
              totalJobs: w.total_jobs ?? 0,
              profileViews: w.profile_views ?? 0,
              responseTimeMinutes: null,
            });

            return {
              id: w.id,
              latitude: w.latitude,
              longitude: w.longitude,
              primarySkill: skill,
              isVerified: true,
            };
          });
          setRealWorkers(pins);
        }
      } catch (e) {
        console.error('Failed to fetch real workers:', e);
      }
    };
    fetchRealWorkers();
  }, []);

  useEffect(() => {
    // Combine mock workers + real workers (deduplicate by id)
    const allMock = mockWorkers.filter(w => w.isVerified);
    const realIds = new Set(realWorkers.map(w => w.id));
    const combined = [...allMock.filter(w => !realIds.has(w.id)), ...realWorkers];

    let filtered = combined;

    if (selectedCategories.length > 0) {
      // Check ALL skills, not just primarySkill
      filtered = filtered.filter(w => {
        // For mock workers, check their full skills array
        const mockW = mockWorkers.find(m => m.id === w.id);
        if (mockW) {
          return mockW.skills.some(s => selectedCategories.includes(s));
        }
        // For real workers registered in the registry, check their skills too
        const registered = getMockWorkerById(w.id);
        if (registered) {
          return registered.skills.some((s: JobCategory) => selectedCategories.includes(s));
        }
        // Fallback: check primarySkill only
        return selectedCategories.includes(w.primarySkill);
      });
    }

    if (selectedBarangay) {
      filtered = filtered.filter(w => {
        const mockW = mockWorkers.find(m => m.id === w.id);
        if (mockW) return mockW.barangay === selectedBarangay;
        // For real workers, check the registry
        const registered = getMockWorkerById(w.id);
        if (registered) return registered.barangay === selectedBarangay;
        return true;
      });
    }

    setWorkerPins(filtered.map(({ id, latitude, longitude, primarySkill, isVerified }) => ({
      id, latitude, longitude, primarySkill, isVerified,
    })));
  }, [selectedCategories, selectedBarangay, setWorkerPins, realWorkers]);

  // Auto-dismiss welcome banner after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    clearUser();
    navigate('/login');
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* Branded Header Bar */}
      <header className="shrink-0 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 60%, #F59E0B 100%)' }}>
        <div className="relative z-10 flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg">
              👷
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight tracking-tight">
                BarangayWorks
              </h1>
              <p className="text-blue-100 text-xs hidden sm:block">
                Find Skilled Workers Near You
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Stats badge */}
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-white text-sm font-medium">
                {workerPins.length} workers available
              </span>
            </div>
            {/* Logout button */}
            <button onClick={handleLogout} className="text-white/80 hover:text-white text-sm font-medium min-w-[44px] min-h-[44px] flex items-center justify-center">
              Logout
            </button>
          </div>
        </div>
        {/* Decorative shimmer */}
        <div className="absolute inset-0 animate-shimmer opacity-20 pointer-events-none"></div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Desktop sidebar - hidden on mobile */}
        <aside className="hidden md:flex md:flex-col md:w-72 lg:w-80 border-r border-gray-100 bg-white/80 backdrop-blur-sm p-5 gap-5 overflow-y-auto shrink-0 shadow-sm">
          <div className="space-y-5">
            <BarangaySelector />
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            <FilterPanel />
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            {/* Activity Feed */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                📋 Recent Activity
              </h3>
              <div className="space-y-2">
                {activities.map((activity, i) => (
                  <p key={`${activityIndex}-${i}`} className="text-xs text-gray-600 animate-fade-in leading-relaxed">
                    {activity}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Map area - takes remaining space */}
        <main className="relative flex-1 min-h-0">
          <MapView />

          {/* Welcome toast banner */}
          {showWelcome && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] animate-slide-down">
              <div className="bg-white rounded-xl shadow-xl px-5 py-3 flex items-center gap-3 border border-gray-100">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Welcome to BarangayWorks!</p>
                  <p className="text-xs text-gray-500">Browse skilled workers across Quezon City</p>
                </div>
              </div>
            </div>
          )}

          {/* No workers found empty state */}
          {workerPins.length === 0 && !showWelcome && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
              <div className="bg-white rounded-xl shadow-xl px-5 py-3 flex items-center gap-3 border border-orange-200 bg-orange-50">
                <span className="text-2xl">🔍</span>
                <div>
                  <p className="text-sm font-semibold text-orange-800">No workers found</p>
                  <p className="text-xs text-orange-600">Try adjusting your filters</p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile filter toggle button - visible only on mobile */}
          <button
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="md:hidden absolute top-4 left-4 z-[1000] min-w-[48px] min-h-[48px] bg-white rounded-xl shadow-lg flex items-center justify-center border border-gray-100 hover:shadow-xl transition-all duration-200 active:scale-95"
            aria-label={isFilterOpen ? 'Close filters' : 'Open filters'}
            aria-expanded={isFilterOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-700"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 010 2H4a1 1 0 01-1-1zm3 4a1 1 0 011-1h6a1 1 0 010 2H7a1 1 0 01-1-1zm2 4a1 1 0 011-1h2a1 1 0 010 2h-2a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Mobile filter overlay */}
          {isFilterOpen && (
            <div className="md:hidden absolute inset-0 z-[999] flex animate-fade-in">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setIsFilterOpen(false)}
                aria-hidden="true"
              />
              {/* Filter panel */}
              <div className="relative w-72 max-w-[80vw] bg-white h-full p-5 overflow-y-auto shadow-2xl flex flex-col gap-5 animate-slide-up">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Close filters"
                  >
                    ✕
                  </button>
                </div>
                <BarangaySelector />
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                <FilterPanel />
              </div>
            </div>
          )}
          
          {/* Emergency Button - floating bottom-right */}
          <button
            onClick={() => { setEmergencyOpen(true); setEmergencySent(false); setEmergencyCategory(null); }}
            className="absolute bottom-6 right-6 z-[1000] w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #DC2626 0%, #F97316 100%)', boxShadow: '0 0 20px rgba(220,38,38,0.4)' }}
            aria-label="Emergency service request"
          >
            🚨
          </button>

          {/* Emergency Panel */}
          {emergencyOpen && (
            <div className="absolute inset-0 z-[1500] flex items-end md:items-center justify-center animate-fade-in">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEmergencyOpen(false)} />
              <div className="relative w-full md:max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden animate-scale-in">
                <div className="h-2" style={{ background: 'linear-gradient(135deg, #DC2626 0%, #F97316 100%)' }} />
                <div className="p-5 md:p-6">
                  {emergencySent ? (
                    <div className="text-center py-6">
                      <div className="text-4xl mb-3">🚨</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Emergency Alert Sent!</h3>
                      <p className="text-sm text-gray-600 mb-6">
                        {mockWorkers.filter(w => w.isOnline && w.isVerified && w.primarySkill === emergencyCategory).length} nearby workers have been notified.
                      </p>
                      <button onClick={() => setEmergencyOpen(false)} className="min-h-[44px] px-6 bg-blue-600 text-white font-medium rounded-xl">
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-red-700">🚨 Emergency Request</h3>
                        <button onClick={() => setEmergencyOpen(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg">✕</button>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">What's your emergency?</p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {([
                          { emoji: '💧', label: 'Water Leak', skill: 'plumber' },
                          { emoji: '⚡', label: 'Electrical', skill: 'electrician' },
                          { emoji: '🔒', label: 'Locked Out', skill: 'carpenter' },
                          { emoji: '🔧', label: 'Urgent Repair', skill: 'laborer' },
                        ] as { emoji: string; label: string; skill: JobCategory }[]).map(({ emoji, label, skill }) => {
                          const count = mockWorkers.filter(w => w.isOnline && w.isVerified && w.primarySkill === skill).length;
                          return (
                            <button
                              key={skill}
                              onClick={() => setEmergencyCategory(skill)}
                              className={`min-h-[70px] p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                                emergencyCategory === skill ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-2xl">{emoji}</span>
                              <span className="text-xs font-medium text-gray-700">{label}</span>
                              <span className="text-[10px] text-green-600 font-medium">{count} online</span>
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => {
                          if (emergencyCategory) {
                            setEmergencySent(true);
                            // Filter map to show only matching online workers
                            const filtered = mockWorkers.filter(w => w.isOnline && w.isVerified && w.primarySkill === emergencyCategory);
                            setWorkerPins(filtered.map(({ id, latitude, longitude, primarySkill, isVerified }) => ({ id, latitude, longitude, primarySkill, isVerified })));
                          }
                        }}
                        disabled={!emergencyCategory}
                        className="w-full min-h-[44px] text-white font-semibold rounded-xl disabled:opacity-50 transition-all duration-200 hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #DC2626 0%, #F97316 100%)' }}
                      >
                        Send Emergency Request
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
