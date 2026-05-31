import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { logout } from '../services/auth';
import LocationPicker from '../components/LocationPicker';
import type { JobCategory } from '../types';

// ============================================================
// Types & Config
// ============================================================

type TabId = 'dashboard' | 'jobs' | 'profile';
type Urgency = 'normal' | 'urgent' | 'emergency';

interface ServiceRequest {
  id: string; clientName: string; description: string;
  urgency: Urgency; timeAgo: string; barangay: string;
}
interface ActiveJob {
  id: string; clientName: string; description: string;
  barangay: string; acceptedAt: string;
}
interface WorkerProfileData {
  id: string; name: string; skills: JobCategory[]; barangay: string;
  contact_number: string; profile_image_url: string | null;
  verification_status: string; latitude?: number | null;
  longitude?: number | null; address?: string | null;
}

const tabs: { id: TabId; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'jobs', icon: '📥', label: 'Jobs' },
  { id: 'profile', icon: '👤', label: 'Profile' },
];

const mockRequests: ServiceRequest[] = [
  { id: 'r1', clientName: 'Maria Santos', description: 'Need outlet installed in kitchen', urgency: 'normal', timeAgo: '5 min ago', barangay: 'Diliman' },
  { id: 'r2', clientName: 'Roberto Cruz', description: 'Water heater not working', urgency: 'urgent', timeAgo: '12 min ago', barangay: 'Commonwealth' },
  { id: 'r3', clientName: 'Elena Ramos', description: 'Pipe burst in bathroom - EMERGENCY', urgency: 'emergency', timeAgo: '2 min ago', barangay: 'Diliman' },
];

function formatTimeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff} min ago`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ============================================================
// Component
// ============================================================

export default function WorkerDashboard() {
  const { user, clearUser } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const confettiRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isOnline, setIsOnline] = useState(true);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfileData | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [completedCount, setCompletedCount] = useState(12);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  // Profile edit state
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
    fetchData();
    return () => { if (confettiRef.current) clearTimeout(confettiRef.current); };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setIsLoading(true);
    if (isDemo || !user?.id) {
      setWorkerProfile({ id: 'demo', name: 'Juan Dela Cruz', skills: ['electrician', 'plumber'], barangay: 'Diliman', contact_number: '09171234567', profile_image_url: null, verification_status: 'verified' });
      setRequests(mockRequests);
      setIsLoading(false);
      return;
    }
    try {
      const { data: p } = await supabase.from('workers').select('*').eq('user_id', user.id).single();
      if (p) {
        setWorkerProfile(p as WorkerProfileData);
        const { data: reqs } = await supabase.from('service_requests').select('*').eq('worker_id', p.id).eq('status', 'pending');
        if (reqs && reqs.length > 0) {
          setRequests(reqs.map((r: Record<string, unknown>) => ({
            id: r.id as string, clientName: (r.client_name as string) || 'Client',
            description: (r.description as string) || 'Service request',
            urgency: (r.urgency as Urgency) || 'normal',
            timeAgo: formatTimeAgo(r.created_at as string),
            barangay: (r.barangay as string) || p.barangay,
          })));
        } else { setRequests(mockRequests); }
      } else {
        setWorkerProfile({ id: 'fallback', name: 'Juan Dela Cruz', skills: ['electrician', 'plumber'], barangay: 'Diliman', contact_number: '09171234567', profile_image_url: null, verification_status: 'verified' });
        setRequests(mockRequests);
      }
    } catch { setRequests(mockRequests); }
    setIsLoading(false);
  };

  // ============================================================
  // Actions
  // ============================================================

  const handleLogout = async () => { await logout(); clearUser(); navigate('/login'); };

  const handleToggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    addToast(next ? 'You are now online' : 'You are now offline', 'info');
    if (workerProfile && !['demo', 'fallback'].includes(workerProfile.id)) {
      await supabase.from('workers').update({ is_online: next }).eq('id', workerProfile.id);
    }
  };

  const handleAccept = async (req: ServiceRequest) => {
    await supabase.from('service_requests').update({ status: 'accepted' }).eq('id', req.id);
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    setActiveJobs((prev) => [...prev, { id: req.id, clientName: req.clientName, description: req.description, barangay: req.barangay, acceptedAt: 'Just now' }]);
    addToast(`Job accepted! Contact ${req.clientName} to schedule.`, 'success');
  };

  const handleDecline = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    addToast('Request declined', 'info');
  };

  const handleComplete = async (jobId: string) => {
    await supabase.from('service_requests').update({ status: 'completed' }).eq('id', jobId);
    setActiveJobs((prev) => prev.filter((j) => j.id !== jobId));
    setCompletedCount((c) => c + 1);
    setShowConfetti(true);
    addToast('Job marked as complete! Great work! 🎉', 'success');
    confettiRef.current = setTimeout(() => setShowConfetti(false), 2000);
  };

  const handleSaveLocation = async () => {
    if (!workerProfile || editLat === null || editLng === null) return;
    setIsSavingLocation(true);
    const coords = `SRID=4326;POINT(${editLng} ${editLat})`;
    const { error } = await supabase.from('workers').update({ coordinates: coords, ...(editAddress ? { address: editAddress } : {}) }).eq('id', workerProfile.id);
    if (!error) {
      setWorkerProfile((prev) => prev ? { ...prev, latitude: editLat, longitude: editLng, address: editAddress } : prev);
      setIsEditingLocation(false);
      addToast('Location updated!', 'success');
    } else { addToast('Failed to update location.', 'error'); }
    setIsSavingLocation(false);
  };

  const urgencyBadge: Record<Urgency, string> = {
    normal: 'bg-blue-100 text-blue-700',
    urgent: 'bg-amber-100 text-amber-700',
    emergency: 'bg-red-100 text-red-700',
  };

  const name = workerProfile?.name || 'Worker';

  // ============================================================
  // Loading
  // ============================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center">
          <span className="text-6xl animate-bounce">🎉</span>
          <span className="absolute top-1/4 left-1/4 text-4xl animate-bounce" style={{ animationDelay: '0.1s' }}>✨</span>
          <span className="absolute top-1/3 right-1/4 text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🌟</span>
        </div>
      )}

      {/* Header */}
      <header className="shrink-0 z-20" style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 60%, #F59E0B 100%)' }}>
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg">🔧</div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">{name}</h1>
              <p className="text-blue-100 text-xs">Worker Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleToggleOnline} className={`flex items-center gap-2 px-3 py-1.5 rounded-full min-h-[44px] transition-all ${isOnline ? 'bg-green-500/20 border border-green-400/50' : 'bg-gray-500/20 border border-gray-400/50'}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-white text-xs font-medium hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </button>
            <button onClick={handleLogout} className="text-white/80 hover:text-white text-sm font-medium min-w-[44px] min-h-[44px] flex items-center justify-center">Logout</button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-[240px] shrink-0 flex-col bg-white border-r border-gray-200">
          <nav className="flex-1 py-4 px-3 space-y-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'jobs' && requests.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{requests.length}</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="p-4 md:p-6 max-w-4xl mx-auto">

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Overview</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { icon: '👁️', value: '23', label: 'Views' },
                    { icon: '✅', value: String(completedCount), label: 'Jobs' },
                    { icon: '⚡', value: '5min', label: 'Response' },
                    { icon: '🏆', value: '82', label: 'Trust' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
                      <p className="text-2xl font-bold text-gray-900">{s.icon} {s.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                {/* Quick summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Recent Activity</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>📥 {requests.length} pending request{requests.length !== 1 ? 's' : ''}</p>
                    <p>🔨 {activeJobs.length} active job{activeJobs.length !== 1 ? 's' : ''}</p>
                    <p>✅ {completedCount} completed total</p>
                  </div>
                </div>
              </div>
            )}

            {/* JOBS TAB */}
            {activeTab === 'jobs' && (
              <div className="space-y-6">
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    📥 Incoming Requests
                    {requests.length > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{requests.length}</span>}
                  </h2>
                  {!isOnline ? (
                    <div className="bg-gray-100 rounded-xl p-6 text-center text-gray-500 text-sm">Go online to receive requests</div>
                  ) : requests.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center border border-gray-100">
                      <p className="text-2xl mb-2">🎉</p>
                      <p className="text-gray-500 text-sm">All caught up! No pending requests.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((req) => (
                        <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm">{req.clientName}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${urgencyBadge[req.urgency]}`}>{req.urgency}</span>
                          </div>
                          <p className="text-sm text-gray-600">{req.description}</p>
                          <p className="text-xs text-gray-400 mt-1">📍 {req.barangay} · 🕐 {req.timeAgo}</p>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => handleAccept(req)} className="flex-1 min-h-[44px] bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 active:scale-95 transition-all">✓ Accept</button>
                            <button onClick={() => handleDecline(req.id)} className="flex-1 min-h-[44px] border-2 border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 active:scale-95 transition-all">✗ Decline</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {activeJobs.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">🔨 Active Jobs <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{activeJobs.length}</span></h2>
                    <div className="space-y-3">
                      {activeJobs.map((job) => (
                        <div key={job.id} className="bg-white rounded-xl shadow-sm border border-blue-100 p-4">
                          <h3 className="font-semibold text-gray-900 text-sm">{job.clientName}</h3>
                          <p className="text-sm text-gray-600">{job.description}</p>
                          <p className="text-xs text-gray-400 mt-1">📍 {job.barangay} · ⏱️ {job.acceptedAt}</p>
                          <button onClick={() => handleComplete(job.id)} className="mt-3 w-full min-h-[44px] bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all">✓ Mark Complete</button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shrink-0">
                      {workerProfile?.profile_image_url ? <img src={workerProfile.profile_image_url} alt={name} className="w-full h-full object-cover" /> : name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                      <p className="text-sm text-gray-500">📍 {workerProfile?.barangay}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${workerProfile?.verification_status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {workerProfile?.verification_status === 'verified' ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Contact</p>
                      <p className="text-sm font-medium text-gray-900">📞 {workerProfile?.contact_number}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Skills</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{workerProfile?.skills.join(', ')}</p>
                    </div>
                  </div>

                  {/* Location Edit */}
                  <div className="pt-4 border-t border-gray-100">
                    {!isEditingLocation ? (
                      <button onClick={() => { setEditLat(workerProfile?.latitude ?? null); setEditLng(workerProfile?.longitude ?? null); setEditAddress(workerProfile?.address ?? ''); setIsEditingLocation(true); }}
                        className="w-full min-h-[44px] border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm">
                        📍 Update My Location
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">Update Your Pin Location</p>
                        <LocationPicker selectedBarangay={workerProfile?.barangay || ''} initialLat={workerProfile?.latitude ?? undefined} initialLng={workerProfile?.longitude ?? undefined}
                          onLocationSelect={(lat, lng, addr) => { setEditLat(lat); setEditLng(lng); setEditAddress(addr); }} />
                        <div className="flex gap-2">
                          <button onClick={handleSaveLocation} disabled={isSavingLocation || editLat === null}
                            className="flex-1 min-h-[44px] bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all">
                            {isSavingLocation ? 'Saving...' : 'Save Location'}
                          </button>
                          <button onClick={() => setIsEditingLocation(false)}
                            className="flex-1 min-h-[44px] border-2 border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex items-center justify-around h-[60px]">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1 rounded-lg transition-colors ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`}>
              <span className="text-xl">{tab.icon}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
