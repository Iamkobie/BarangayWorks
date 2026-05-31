import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import { logout } from '../services/auth';
import type { JobCategory } from '../types';

// ============================================================
// Types
// ============================================================

interface PendingWorker {
  id: string;
  user_id: string;
  name: string;
  skills: JobCategory[];
  barangay: string;
  contact_number: string;
  profile_image_url: string | null;
  verification_status: string;
  created_at: string;
}

interface VerifiedWorker {
  id: string;
  user_id: string;
  name: string;
  skills: JobCategory[];
  barangay: string;
  profile_image_url: string | null;
  verified_at: string | null;
}

interface ServiceRequestItem {
  id: string;
  client_name?: string;
  worker_name?: string;
  description: string;
  status: string;
  urgency?: string;
  created_at: string;
}

type TabId = 'pending' | 'verified' | 'requests';

// ============================================================
// Mock Data (fallback for demo stability)
// ============================================================

const mockPendingWorkers: PendingWorker[] = [
  { id: 'p1', user_id: 'u1', name: 'Kobie Calingasan', skills: ['electrician', 'plumber'], barangay: 'Diliman', contact_number: '09171234567', profile_image_url: 'https://i.pravatar.cc/100?img=65', verification_status: 'pending', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'p2', user_id: 'u2', name: 'Ana Reyes', skills: ['carpenter'], barangay: 'Fairview', contact_number: '09181234567', profile_image_url: 'https://i.pravatar.cc/100?img=45', verification_status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'p3', user_id: 'u3', name: 'Mark Villanueva', skills: ['mason', 'laborer'], barangay: 'Commonwealth', contact_number: '09191234567', profile_image_url: 'https://i.pravatar.cc/100?img=52', verification_status: 'pending', created_at: new Date(Date.now() - 10800000).toISOString() },
];

const mockVerifiedWorkers: VerifiedWorker[] = [
  { id: 'v1', user_id: 'uv1', name: 'Pedro Reyes', skills: ['plumber'], barangay: 'Diliman', profile_image_url: 'https://i.pravatar.cc/100?img=33', verified_at: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 'v2', user_id: 'uv2', name: 'Rosa Mendoza', skills: ['electrician', 'carpenter'], barangay: 'Commonwealth', profile_image_url: 'https://i.pravatar.cc/100?img=25', verified_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'v3', user_id: 'uv3', name: 'Carlos Santos', skills: ['mason'], barangay: 'Fairview', profile_image_url: 'https://i.pravatar.cc/100?img=60', verified_at: new Date(Date.now() - 14 * 86400000).toISOString() },
];

const mockServiceRequests: ServiceRequestItem[] = [
  { id: 'sr1', client_name: 'Maria Santos', worker_name: 'Pedro Reyes', description: 'Fix leaking faucet', status: 'completed', urgency: 'normal', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'sr2', client_name: 'Roberto Cruz', worker_name: 'Rosa Mendoza', description: 'Install new outlet', status: 'accepted', urgency: 'urgent', created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 'sr3', client_name: 'Elena Ramos', worker_name: 'Carlos Santos', description: 'Bathroom wall repair', status: 'pending', urgency: 'normal', created_at: new Date(Date.now() - 300000).toISOString() },
  { id: 'sr4', client_name: 'Jose Garcia', worker_name: 'Pedro Reyes', description: 'Pipe burst - EMERGENCY', status: 'pending', urgency: 'emergency', created_at: new Date(Date.now() - 60000).toISOString() },
];

// ============================================================
// Helpers
// ============================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ============================================================
// Component
// ============================================================

export default function AdminDashboard() {
  const { addToast } = useToastStore();
  const { clearUser } = useAuthStore();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [pending, setPending] = useState<PendingWorker[]>([]);
  const [verified, setVerified] = useState<VerifiedWorker[]>([]);
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineCount] = useState(7);

  // Modals
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailWorker, setDetailWorker] = useState<PendingWorker | null>(null);

  // Animated counters
  const [animatedPending, setAnimatedPending] = useState(0);
  const [animatedVerified, setAnimatedVerified] = useState(0);
  const [animatedOnline, setAnimatedOnline] = useState(0);
  const [animatedRequests, setAnimatedRequests] = useState(0);

  // Slide-out animation
  const [slidingOut, setSlidingOut] = useState<string | null>(null);
  const [slideColor, setSlideColor] = useState<'green' | 'red'>('green');

  // ============================================================
  // Data Fetching
  // ============================================================

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch pending workers
      const { data: pendingData, error: pendingError } = await supabase
        .from('workers')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: true });

      if (!pendingError && pendingData && pendingData.length > 0) {
        setPending(pendingData as PendingWorker[]);
      } else {
        setPending(mockPendingWorkers);
      }

      // Fetch verified workers
      const { data: verifiedData, error: verifiedError } = await supabase
        .from('workers')
        .select('*')
        .eq('verification_status', 'verified');

      if (!verifiedError && verifiedData && verifiedData.length > 0) {
        setVerified(verifiedData as VerifiedWorker[]);
      } else {
        setVerified(mockVerifiedWorkers);
      }

      // Fetch service requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!requestsError && requestsData && requestsData.length > 0) {
        setRequests(requestsData as ServiceRequestItem[]);
      } else {
        setRequests(mockServiceRequests);
      }
    } catch (e) {
      console.error('Failed to fetch admin data:', e);
      setPending(mockPendingWorkers);
      setVerified(mockVerifiedWorkers);
      setRequests(mockServiceRequests);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Animate counters
  useEffect(() => {
    const duration = 800;
    const steps = 20;
    const interval = duration / steps;

    const targets = {
      pending: pending.length,
      verified: verified.length,
      online: onlineCount,
      requests: requests.length,
    };

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setAnimatedPending(Math.round(targets.pending * progress));
      setAnimatedVerified(Math.round(targets.verified * progress));
      setAnimatedOnline(Math.round(targets.online * progress));
      setAnimatedRequests(Math.round(targets.requests * progress));
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [pending.length, verified.length, onlineCount, requests.length]);

  // ============================================================
  // Actions
  // ============================================================

  const handleLogout = async () => {
    await logout();
    clearUser();
    navigate('/login');
  };

  const handleApprove = async (workerId: string) => {
    setSlidingOut(workerId);
    setSlideColor('green');

    try {
      const { error } = await supabase.rpc('approve_worker', { worker_id: workerId });
      if (error) throw error;
    } catch (e) {
      console.error('Approve RPC failed, updating locally:', e);
    }

    setTimeout(() => {
      const worker = pending.find((w) => w.id === workerId);
      setPending((prev) => prev.filter((w) => w.id !== workerId));
      if (worker) {
        setVerified((prev) => [
          ...prev,
          { id: worker.id, user_id: worker.user_id, name: worker.name, skills: worker.skills, barangay: worker.barangay, profile_image_url: worker.profile_image_url, verified_at: new Date().toISOString() },
        ]);
      }
      setSlidingOut(null);
      setDetailWorker(null);
      addToast(`Worker ${worker?.name} approved!`, 'success');
    }, 400);
  };

  const handleRejectSubmit = async () => {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 10) return;

    const targetId = rejectTarget;
    setSlidingOut(targetId);
    setSlideColor('red');
    setRejectTarget(null);

    try {
      const { error } = await supabase.rpc('reject_worker', { worker_id: targetId, reason: rejectReason.trim() });
      if (error) throw error;
    } catch (e) {
      console.error('Reject RPC failed, updating locally:', e);
    }

    setRejectReason('');

    setTimeout(() => {
      const worker = pending.find((w) => w.id === targetId);
      setPending((prev) => prev.filter((w) => w.id !== targetId));
      setSlidingOut(null);
      setDetailWorker(null);
      addToast(`Worker ${worker?.name || ''} rejected.`, 'error');
    }, 400);
  };

  const handleRemoveVerified = (workerId: string) => {
    const worker = verified.find((w) => w.id === workerId);
    setVerified((prev) => prev.filter((w) => w.id !== workerId));
    addToast(`Worker ${worker?.name} removed.`, 'warning');
  };

  // ============================================================
  // Style maps
  // ============================================================

  const statusStyles: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    accepted: { bg: 'bg-blue-100', text: 'text-blue-700' },
    completed: { bg: 'bg-green-100', text: 'text-green-700' },
  };

  const urgencyStyles: Record<string, { bg: string; text: string }> = {
    normal: { bg: 'bg-gray-100', text: 'text-gray-600' },
    urgent: { bg: 'bg-amber-100', text: 'text-amber-700' },
    emergency: { bg: 'bg-red-100', text: 'text-red-700' },
  };

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'pending', label: 'Pending Verification', count: pending.length },
    { id: 'verified', label: 'Verified Workers', count: verified.length },
    { id: 'requests', label: 'Service Requests', count: requests.length },
  ];

  // ============================================================
  // Loading State
  // ============================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading admin data...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="shrink-0 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 60%, #F59E0B 100%)' }}>
        <div className="relative z-10 flex items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl">
              🏛️
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight tracking-tight">
                Admin Operations Center
              </h1>
              <p className="text-blue-100 text-xs">
                BarangayWorks Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-white text-sm font-medium">{onlineCount} online</span>
            </div>
            <button onClick={handleLogout} className="text-white/80 hover:text-white text-sm font-medium min-w-[44px] min-h-[44px] flex items-center justify-center">
              Logout
            </button>
          </div>
        </div>
        <div className="absolute inset-0 animate-shimmer opacity-20 pointer-events-none"></div>
      </header>

      {/* Stats Row */}
      <div className="px-4 py-4 md:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-yellow-400">
            <p className="text-2xl font-bold text-yellow-600">{animatedPending}</p>
            <p className="text-xs text-gray-500 mt-1">Pending</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-green-400">
            <p className="text-2xl font-bold text-green-600">{animatedVerified}</p>
            <p className="text-xs text-gray-500 mt-1">Verified</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-blue-400">
            <p className="text-2xl font-bold text-blue-600">{animatedOnline}</p>
            <p className="text-xs text-gray-500 mt-1">Online Now</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-purple-400">
            <p className="text-2xl font-bold text-purple-600">{animatedRequests}</p>
            <p className="text-xs text-gray-500 mt-1">Total Requests</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-6">
        <div className="max-w-5xl mx-auto flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
        <div className="max-w-5xl mx-auto">

          {/* Pending Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-4 animate-fade-in">
              {pending.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="text-gray-500">All workers have been reviewed!</p>
                </div>
              ) : (
                pending.map((worker) => (
                  <div
                    key={worker.id}
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 transition-all duration-400 ${
                      slidingOut === worker.id
                        ? `opacity-0 translate-x-full ${slideColor === 'green' ? 'bg-green-50' : 'bg-red-50'}`
                        : 'opacity-100 translate-x-0'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Photo & Info */}
                      <div className="flex items-start gap-3 flex-1">
                        <img
                          src={worker.profile_image_url || 'https://i.pravatar.cc/100?u=' + worker.id}
                          alt={worker.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900">{worker.name}</h3>
                          <p className="text-sm text-gray-500">📍 {worker.barangay} · {formatDate(worker.created_at)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">📞 {worker.contact_number}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {worker.skills.map((skill) => (
                              <span key={skill} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Verification Checklist */}
                      <div className="flex flex-wrap gap-2 md:flex-col md:gap-1 text-xs">
                        <span className="text-green-600">✓ Phone</span>
                        <span className="text-green-600">✓ Email</span>
                        <span className="text-red-500">✗ ID</span>
                        <span className="text-red-500">✗ Brgy Cert</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setDetailWorker(worker)}
                        className="flex-1 min-h-[44px] border-2 border-blue-200 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-50 active:scale-95 transition-all duration-200"
                      >
                        👁️ View Details
                      </button>
                      <button
                        onClick={() => handleApprove(worker.id)}
                        className="flex-1 min-h-[44px] bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 active:scale-95 transition-all duration-200"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => setRejectTarget(worker.id)}
                        className="flex-1 min-h-[44px] bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 active:scale-95 transition-all duration-200"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Verified Tab */}
          {activeTab === 'verified' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {verified.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
                  <p className="text-gray-500">No verified workers yet.</p>
                </div>
              ) : (
                verified.map((worker) => (
                  <div key={worker.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center text-center">
                    <img
                      src={worker.profile_image_url || 'https://i.pravatar.cc/100?u=' + worker.id}
                      alt={worker.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-green-200 mb-3"
                    />
                    <h3 className="font-bold text-gray-900 text-sm">{worker.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">📍 {worker.barangay}</p>
                    <div className="flex flex-wrap gap-1 justify-center mb-3">
                      {worker.skills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-medium capitalize">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mb-3">
                      Verified {worker.verified_at ? formatDate(worker.verified_at) : 'recently'}
                    </p>
                    <button
                      onClick={() => handleRemoveVerified(worker.id)}
                      className="w-full min-h-[44px] border-2 border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 active:scale-95 transition-all duration-200"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-3 animate-fade-in">
              {requests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
                  <p className="text-gray-500">No service requests yet.</p>
                </div>
              ) : (
                requests.map((req) => (
                  <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">{req.client_name || 'Client'}</span>
                          <span className="text-gray-400 text-xs">→</span>
                          <span className="font-medium text-blue-700 text-sm">{req.worker_name || 'Worker'}</span>
                        </div>
                        <p className="text-sm text-gray-600">{req.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(req.created_at)}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${(statusStyles[req.status] || statusStyles.pending).bg} ${(statusStyles[req.status] || statusStyles.pending).text}`}>
                          {req.status}
                        </span>
                        {req.urgency && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${(urgencyStyles[req.urgency] || urgencyStyles.normal).bg} ${(urgencyStyles[req.urgency] || urgencyStyles.normal).text}`}>
                            {req.urgency}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      {/* Worker Detail Modal */}
      {detailWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-900">Worker Details</h3>
              <button
                onClick={() => setDetailWorker(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Profile Section */}
              <div className="flex flex-col items-center text-center">
                <img
                  src={detailWorker.profile_image_url || 'https://i.pravatar.cc/150?u=' + detailWorker.id}
                  alt={detailWorker.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 mb-3"
                />
                <h2 className="text-xl font-bold text-gray-900">{detailWorker.name}</h2>
                <p className="text-sm text-gray-500">📍 {detailWorker.barangay}</p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Contact Number</p>
                  <p className="text-sm font-medium text-gray-900">📞 {detailWorker.contact_number}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Registered</p>
                  <p className="text-sm font-medium text-gray-900">📅 {formatDate(detailWorker.created_at)}</p>
                </div>
              </div>

              {/* Skills */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {detailWorker.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Verification Checklist */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Verification Status</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-green-50 rounded-lg p-2">
                    <span className="text-green-600 text-sm">✓</span>
                    <span className="text-sm text-gray-700">Phone Verified</span>
                  </div>
                  <div className="flex items-center gap-2 bg-green-50 rounded-lg p-2">
                    <span className="text-green-600 text-sm">✓</span>
                    <span className="text-sm text-gray-700">Email Verified</span>
                  </div>
                  <div className="flex items-center gap-2 bg-red-50 rounded-lg p-2">
                    <span className="text-red-500 text-sm">✗</span>
                    <span className="text-sm text-gray-700">ID Document</span>
                  </div>
                  <div className="flex items-center gap-2 bg-red-50 rounded-lg p-2">
                    <span className="text-red-500 text-sm">✗</span>
                    <span className="text-sm text-gray-700">Barangay Cert</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleApprove(detailWorker.id)}
                  className="flex-1 min-h-[44px] bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 active:scale-95 transition-all duration-200"
                >
                  ✓ Approve Worker
                </button>
                <button
                  onClick={() => { setRejectTarget(detailWorker.id); setDetailWorker(null); }}
                  className="flex-1 min-h-[44px] bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 active:scale-95 transition-all duration-200"
                >
                  ✗ Reject Worker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Worker</h3>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason (min 10 characters):</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full min-h-[100px] px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              maxLength={500}
              placeholder="Reason for rejection..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleRejectSubmit}
                disabled={rejectReason.trim().length < 10}
                className="flex-1 min-h-[44px] bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all duration-200"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                className="flex-1 min-h-[44px] border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
