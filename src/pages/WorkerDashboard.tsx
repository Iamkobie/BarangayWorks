import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { logout } from '../services/auth';
import LocationPicker from '../components/LocationPicker';
import type { JobCategory } from '../types';

// ============================================================
// Types
// ============================================================

type Urgency = 'normal' | 'urgent' | 'emergency';

interface ServiceRequest {
  id: string;
  clientName: string;
  description: string;
  urgency: Urgency;
  timeAgo: string;
  barangay: string;
}

interface ActiveJob {
  id: string;
  clientName: string;
  description: string;
  barangay: string;
  acceptedAt: string;
}

interface WorkerProfileData {
  id: string;
  name: string;
  skills: JobCategory[];
  barangay: string;
  contact_number: string;
  profile_image_url: string | null;
  verification_status: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}

// ============================================================
// Mock Data (fallback for demo)
// ============================================================

const mockRequests: ServiceRequest[] = [
  { id: 'req-1', clientName: 'Maria Santos', description: 'Need outlet installed in kitchen', urgency: 'normal', timeAgo: '5 min ago', barangay: 'Diliman' },
  { id: 'req-2', clientName: 'Roberto Cruz', description: 'Water heater not working', urgency: 'urgent', timeAgo: '12 min ago', barangay: 'Commonwealth' },
  { id: 'req-3', clientName: 'Elena Ramos', description: 'Pipe burst in bathroom - EMERGENCY', urgency: 'emergency', timeAgo: '2 min ago', barangay: 'Diliman' },
];

// ============================================================
// Helpers
// ============================================================

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// ============================================================
// Component
// ============================================================

export default function WorkerDashboard() {
  const { user, clearUser } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  // State
  const [isOnline, setIsOnline] = useState(true);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [completedCount, setCompletedCount] = useState(12);
  const [profileViews] = useState(23);
  const [trustScore] = useState(82);
  const [showProfile, setShowProfile] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [fadingOut, setFadingOut] = useState<string | null>(null);
  const [acceptedId, setAcceptedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Worker profile
  const [workerProfile, setWorkerProfile] = useState<WorkerProfileData | null>(null);

  // Profile edit mode
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editLat, setEditLat] = useState<number | null>(null);
  const [editLng, setEditLng] = useState<number | null>(null);
  const [editAddress, setEditAddress] = useState('');
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  const isDemo = user?.id === 'demo-worker';

  // ============================================================
  // Data Fetching
  // ============================================================

  useEffect(() => {
    fetchWorkerData();
  }, [user]);

  const fetchWorkerData = async () => {
    setIsLoading(true);

    // Demo mode: use mock data directly
    if (isDemo || !user?.id) {
      setWorkerProfile({
        id: 'demo',
        name: 'Juan Dela Cruz',
        skills: ['electrician', 'plumber'],
        barangay: 'Diliman',
        contact_number: '09171234567',
        profile_image_url: null,
        verification_status: 'verified',
      });
      setRequests(mockRequests);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch worker profile
      const { data: profileData, error: profileError } = await supabase
        .from('workers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profileError && profileData) {
        setWorkerProfile(profileData as WorkerProfileData);

        // Fetch incoming service requests for this worker
        const { data: reqData, error: reqError } = await supabase
          .from('service_requests')
          .select('*')
          .eq('worker_id', profileData.id)
          .eq('status', 'pending');

        if (!reqError && reqData && reqData.length > 0) {
          const mapped: ServiceRequest[] = reqData.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            clientName: (r.client_name as string) || 'Client',
            description: (r.description as string) || 'Service request',
            urgency: ((r.urgency as Urgency) || 'normal'),
            timeAgo: formatTimeAgo(r.created_at as string),
            barangay: (r.barangay as string) || profileData.barangay,
          }));
          setRequests(mapped);
        } else {
          setRequests(mockRequests);
        }
      } else {
        // Fallback to mock profile
        setWorkerProfile({
          id: 'fallback',
          name: 'Juan Dela Cruz',
          skills: ['electrician', 'plumber'],
          barangay: 'Diliman',
          contact_number: '09171234567',
          profile_image_url: null,
          verification_status: 'verified',
        });
        setRequests(mockRequests);
      }
    } catch (e) {
      console.error('Failed to fetch worker data:', e);
      setRequests(mockRequests);
    }

    setIsLoading(false);
  };

  // ============================================================
  // Actions
  // ============================================================

  const handleLogout = async () => {
    await logout();
    clearUser();
    navigate('/login');
  };

  const handleAccept = async (request: ServiceRequest) => {
    setAcceptedId(request.id);

    // Try to update in Supabase
    try {
      await supabase
        .from('service_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);
    } catch (e) {
      console.error('Failed to accept in DB:', e);
    }

    setTimeout(() => {
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      setActiveJobs((prev) => [
        ...prev,
        {
          id: request.id,
          clientName: request.clientName,
          description: request.description,
          barangay: request.barangay,
          acceptedAt: 'Just now',
        },
      ]);
      setAcceptedId(null);
      addToast(`Job accepted! Contact ${request.clientName} to schedule.`, 'success');
    }, 500);
  };

  const handleDecline = (requestId: string) => {
    setFadingOut(requestId);
    setTimeout(() => {
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setFadingOut(null);
    }, 300);
  };

  const handleComplete = async (jobId: string) => {
    // Try to update in Supabase
    try {
      await supabase
        .from('service_requests')
        .update({ status: 'completed' })
        .eq('id', jobId);
    } catch (e) {
      console.error('Failed to complete in DB:', e);
    }

    setActiveJobs((prev) => prev.filter((j) => j.id !== jobId));
    setCompletedCount((prev) => prev + 1);
    setShowConfetti(true);
    addToast('Job marked as complete! Great work! 🎉', 'success');
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const urgencyStyles: Record<Urgency, { badge: string; label: string }> = {
    normal: { badge: 'bg-blue-100 text-blue-700', label: 'Normal' },
    urgent: { badge: 'bg-amber-100 text-amber-700', label: 'Urgent' },
    emergency: { badge: 'bg-red-100 text-red-700', label: 'Emergency' },
  };

  const workerName = workerProfile?.name || 'Worker';
  const workerSkills = workerProfile?.skills || [];
  const workerBarangay = workerProfile?.barangay || 'Unknown';

  const handleSaveLocation = async () => {
    if (!workerProfile || editLat === null || editLng === null) return;
    setIsSavingLocation(true);
    try {
      const coordinates = `SRID=4326;POINT(${editLng} ${editLat})`;
      const { error } = await supabase
        .from('workers')
        .update({
          coordinates,
          ...(editAddress ? { address: editAddress } : {}),
        })
        .eq('id', workerProfile.id);

      if (!error) {
        setWorkerProfile((prev) =>
          prev ? { ...prev, latitude: editLat, longitude: editLng, address: editAddress } : prev
        );
        setIsEditingLocation(false);
        addToast('Location updated successfully!', 'success');
      } else {
        addToast('Failed to update location. Please try again.', 'error');
      }
    } catch {
      addToast('Failed to update location. Please try again.', 'error');
    }
    setIsSavingLocation(false);
  };

  // ============================================================
  // Loading State
  // ============================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center">
          <div className="text-6xl animate-bounce-in">🎉</div>
          <div className="absolute top-1/4 left-1/4 text-4xl animate-bounce-in" style={{ animationDelay: '0.1s' }}>✨</div>
          <div className="absolute top-1/3 right-1/4 text-4xl animate-bounce-in" style={{ animationDelay: '0.2s' }}>🌟</div>
          <div className="absolute bottom-1/3 left-1/3 text-3xl animate-bounce-in" style={{ animationDelay: '0.15s' }}>⭐</div>
          <div className="absolute top-1/4 right-1/3 text-3xl animate-bounce-in" style={{ animationDelay: '0.25s' }}>🎊</div>
        </div>
      )}

      {/* Header */}
      <header className="shrink-0 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 60%, #F59E0B 100%)' }}>
        <div className="relative z-10 flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg">
              🔧
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight tracking-tight">
                {workerName}
              </h1>
              <p className="text-blue-100 text-xs">
                Worker Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Online Toggle */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 min-h-[44px] ${
                isOnline ? 'bg-green-500/20 border border-green-400/50' : 'bg-gray-500/20 border border-gray-400/50'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-white text-xs font-medium hidden sm:inline">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="text-white/80 hover:text-white text-sm font-medium min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="absolute inset-0 animate-shimmer opacity-20 pointer-events-none"></div>
      </header>

      {/* Online Status Banner */}
      <div className={`px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
        isOnline ? 'bg-green-50 text-green-700 border-b border-green-100' : 'bg-gray-100 text-gray-600 border-b border-gray-200'
      }`}>
        {isOnline ? '🟢 Online — Accepting requests' : '⚫ Offline — Not accepting requests'}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100 animate-fade-in">
              <p className="text-2xl font-bold text-gray-900">👁️ {profileViews}</p>
              <p className="text-xs text-gray-500 mt-1">Profile Views</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100 animate-fade-in" style={{ animationDelay: '0.05s' }}>
              <p className="text-2xl font-bold text-gray-900">✅ {completedCount}</p>
              <p className="text-xs text-gray-500 mt-1">Jobs Completed</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <p className="text-2xl font-bold text-gray-900">⚡ 5min</p>
              <p className="text-xs text-gray-500 mt-1">Avg Response</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100 animate-fade-in" style={{ animationDelay: '0.15s' }}>
              <p className="text-2xl font-bold text-gray-900">🏆 {trustScore}</p>
              <p className="text-xs text-gray-500 mt-1">Trust Score</p>
            </div>
          </div>

          {/* Incoming Requests */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              📥 Incoming Requests
              {requests.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {requests.length}
                </span>
              )}
            </h2>

            {!isOnline ? (
              <div className="bg-gray-100 rounded-xl p-6 text-center">
                <p className="text-gray-500 text-sm">Go online to receive requests</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center border border-gray-100">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-gray-500 text-sm">All caught up! No pending requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all duration-300 ${
                      fadingOut === req.id ? 'opacity-0 scale-95' : 'opacity-100'
                    } ${acceptedId === req.id ? 'ring-2 ring-green-400 bg-green-50 scale-[1.02]' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm">{req.clientName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${urgencyStyles[req.urgency].badge}`}>
                            {urgencyStyles[req.urgency].label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{req.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>📍 {req.barangay}</span>
                          <span>🕐 {req.timeAgo}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(req)}
                        className="flex-1 min-h-[44px] bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 active:scale-95 transition-all duration-200"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => handleDecline(req.id)}
                        className="flex-1 min-h-[44px] border-2 border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 active:scale-95 transition-all duration-200"
                      >
                        ✗ Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Active Jobs */}
          {activeJobs.length > 0 && (
            <section className="animate-slide-up">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                🔨 Active Jobs
                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeJobs.length}
                </span>
              </h2>
              <div className="space-y-3">
                {activeJobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-xl shadow-sm border border-blue-100 p-4 animate-scale-in">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{job.clientName}</h3>
                        <p className="text-sm text-gray-600 mt-0.5">{job.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>📍 {job.barangay}</span>
                          <span>⏱️ {job.acceptedAt}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleComplete(job.id)}
                      className="mt-3 w-full min-h-[44px] text-white text-sm font-semibold rounded-xl active:scale-95 transition-all duration-200 hover:shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)' }}
                    >
                      ✓ Mark Complete
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Messages Section */}
          <section>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                💬 Messages
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm">👤</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">Maria Santos</p>
                    <p className="text-xs text-gray-500 truncate">Hi, are you available tomorrow?</p>
                  </div>
                  <span className="text-[10px] text-gray-400">2m ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-sm">👤</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">Roberto Cruz</p>
                    <p className="text-xs text-gray-500 truncate">Thanks for the great work!</p>
                  </div>
                  <span className="text-[10px] text-gray-400">1h ago</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">Messages from clients who contacted you</p>
            </div>
          </section>

          {/* Profile Section */}
          <section>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-full flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4 min-h-[44px] hover:bg-gray-50 transition-colors"
            >
              <span className="font-bold text-gray-900 flex items-center gap-2">
                👤 My Profile
              </span>
              <span className={`text-gray-400 transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {showProfile && (
              <div className="mt-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-slide-up space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                    {workerProfile?.profile_image_url ? (
                      <img src={workerProfile.profile_image_url} alt={workerName} className="w-full h-full object-cover" />
                    ) : (
                      workerName.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{workerName}</h3>
                    <p className="text-sm text-gray-500">📍 {workerBarangay}</p>
                    <div className="flex gap-1 mt-1">
                      {workerSkills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">
                      {workerProfile?.verification_status === 'verified' ? 'Verified' : 'Pending'}
                    </p>
                    <p className="text-xs text-gray-500">Status</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">4.8 ⭐</p>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                </div>

                {/* Location Edit Section */}
                <div className="pt-3 border-t border-gray-100">
                  {!isEditingLocation ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditLat(workerProfile?.latitude ?? null);
                        setEditLng(workerProfile?.longitude ?? null);
                        setEditAddress(workerProfile?.address ?? '');
                        setIsEditingLocation(true);
                      }}
                      className="w-full min-h-[44px] border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                    >
                      📍 Update My Location
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">Update Your Pin Location</p>
                      <LocationPicker
                        selectedBarangay={workerBarangay}
                        initialLat={workerProfile?.latitude ?? undefined}
                        initialLng={workerProfile?.longitude ?? undefined}
                        onLocationSelect={(lat, lng, addr) => {
                          setEditLat(lat);
                          setEditLng(lng);
                          setEditAddress(addr);
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveLocation}
                          disabled={isSavingLocation || editLat === null}
                          className="flex-1 min-h-[44px] bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
                        >
                          {isSavingLocation ? 'Saving...' : 'Save Location'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingLocation(false)}
                          className="flex-1 min-h-[44px] border-2 border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
