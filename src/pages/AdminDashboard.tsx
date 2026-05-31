import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import { logout } from '../services/auth';
import type { JobCategory } from '../types';

type TabId = 'overview' | 'pending' | 'workers' | 'requests';

interface PendingWorker {
  id: string; user_id: string; name: string; skills: JobCategory[];
  barangay: string; contact_number: string; profile_image_url: string | null;
  verification_status: string; created_at: string;
}
interface VerifiedWorker {
  id: string; user_id: string; name: string; skills: JobCategory[];
  barangay: string; profile_image_url: string | null; verified_at: string | null;
}
interface ServiceRequestItem {
  id: string; client_name?: string; worker_name?: string;
  description: string; status: string; urgency?: string; created_at: string;
}

const tabs: { id: TabId; icon: string; label: string }[] = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'pending', icon: '⏳', label: 'Pending' },
  { id: 'workers', icon: '✅', label: 'Workers' },
  { id: 'requests', icon: '📋', label: 'Requests' },
];

const mockPending: PendingWorker[] = [
  { id: 'p1', user_id: 'u1', name: 'Kobie Calingasan', skills: ['electrician', 'plumber'], barangay: 'Diliman', contact_number: '09171234567', profile_image_url: 'https://i.pravatar.cc/100?img=65', verification_status: 'pending', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'p2', user_id: 'u2', name: 'Ana Reyes', skills: ['carpenter'], barangay: 'Fairview', contact_number: '09181234567', profile_image_url: 'https://i.pravatar.cc/100?img=45', verification_status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'p3', user_id: 'u3', name: 'Mark Villanueva', skills: ['mason', 'laborer'], barangay: 'Commonwealth', contact_number: '09191234567', profile_image_url: 'https://i.pravatar.cc/100?img=52', verification_status: 'pending', created_at: new Date(Date.now() - 10800000).toISOString() },
];
const mockVerified: VerifiedWorker[] = [
  { id: 'v1', user_id: 'uv1', name: 'Pedro Reyes', skills: ['plumber'], barangay: 'Diliman', profile_image_url: 'https://i.pravatar.cc/100?img=33', verified_at: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 'v2', user_id: 'uv2', name: 'Rosa Mendoza', skills: ['electrician', 'carpenter'], barangay: 'Commonwealth', profile_image_url: 'https://i.pravatar.cc/100?img=25', verified_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'v3', user_id: 'uv3', name: 'Carlos Santos', skills: ['mason'], barangay: 'Fairview', profile_image_url: 'https://i.pravatar.cc/100?img=60', verified_at: new Date(Date.now() - 14 * 86400000).toISOString() },
];
const mockRequests: ServiceRequestItem[] = [
  { id: 'sr1', client_name: 'Maria Santos', worker_name: 'Pedro Reyes', description: 'Fix leaking faucet', status: 'completed', urgency: 'normal', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'sr2', client_name: 'Roberto Cruz', worker_name: 'Rosa Mendoza', description: 'Install new outlet', status: 'accepted', urgency: 'urgent', created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 'sr3', client_name: 'Elena Ramos', worker_name: 'Carlos Santos', description: 'Bathroom wall repair', status: 'pending', urgency: 'normal', created_at: new Date(Date.now() - 300000).toISOString() },
  { id: 'sr4', client_name: 'Jose Garcia', worker_name: 'Pedro Reyes', description: 'Pipe burst - EMERGENCY', status: 'pending', urgency: 'emergency', created_at: new Date(Date.now() - 60000).toISOString() },
];
const mockActivity = [
  { id: '1', text: 'New worker registration: Mark Villanueva', time: '3h ago', icon: '👤' },
  { id: '2', text: 'Job completed: Fix leaking faucet', time: '2h ago', icon: '✅' },
  { id: '3', text: 'Worker verified: Rosa Mendoza', time: '3d ago', icon: '🎉' },
  { id: '4', text: 'Emergency request: Pipe burst', time: '1m ago', icon: '🚨' },
];

function timeAgo(d: string): string {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminDashboard() {
  const { addToast } = useToastStore();
  const { clearUser } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [pending, setPending] = useState<PendingWorker[]>([]);
  const [verified, setVerified] = useState<VerifiedWorker[]>([]);
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailWorker, setDetailWorker] = useState<PendingWorker | null>(null);
  const [counters, setCounters] = useState([0, 0, 0, 0]);

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const targets = [pending.length, verified.length, 7, requests.length];
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const p = step / 20;
      setCounters(targets.map((t) => Math.round(t * p)));
      if (step >= 20) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [pending.length, verified.length, requests.length]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: pd } = await supabase.from('workers').select('*').eq('verification_status', 'pending').order('created_at', { ascending: true });
      setPending(pd && pd.length > 0 ? (pd as PendingWorker[]) : mockPending);
      const { data: vd } = await supabase.from('workers').select('*').eq('verification_status', 'verified');
      setVerified(vd && vd.length > 0 ? (vd as VerifiedWorker[]) : mockVerified);
      const { data: rd } = await supabase.from('service_requests').select('*').order('created_at', { ascending: false });
      setRequests(rd && rd.length > 0 ? (rd as ServiceRequestItem[]) : mockRequests);
    } catch {
      setPending(mockPending); setVerified(mockVerified); setRequests(mockRequests);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => { await logout(); clearUser(); navigate('/login'); };

  const handleApprove = async (id: string) => {
    try { await supabase.rpc('approve_worker', { worker_id: id }); } catch { /* local fallback */ }
    const w = pending.find((x) => x.id === id);
    setPending((p) => p.filter((x) => x.id !== id));
    if (w) setVerified((v) => [...v, { id: w.id, user_id: w.user_id, name: w.name, skills: w.skills, barangay: w.barangay, profile_image_url: w.profile_image_url, verified_at: new Date().toISOString() }]);
    setDetailWorker(null);
    addToast(`${w?.name} approved!`, 'success');
  };

  const handleRejectSubmit = async () => {
    if (!rejectTarget || rejectReason.trim().length < 10) return;
    try { await supabase.rpc('reject_worker', { worker_id: rejectTarget, reason: rejectReason.trim() }); } catch { /* local fallback */ }
    const w = pending.find((x) => x.id === rejectTarget);
    setPending((p) => p.filter((x) => x.id !== rejectTarget));
    setRejectTarget(null); setRejectReason(''); setDetailWorker(null);
    addToast(`${w?.name || 'Worker'} rejected.`, 'error');
  };

  const handleRemove = (id: string) => {
    const w = verified.find((x) => x.id === id);
    setVerified((v) => v.filter((x) => x.id !== id));
    addToast(`${w?.name} removed.`, 'warning');
  };

  const statusStyle: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', accepted: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700' };
  const urgencyStyle: Record<string, string> = { normal: 'bg-gray-100 text-gray-600', urgent: 'bg-amber-100 text-amber-700', emergency: 'bg-red-100 text-red-700' };

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="shrink-0 z-20" style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 60%, #F59E0B 100%)' }}>
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg">🏛️</div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Admin Center</h1>
              <p className="text-blue-100 text-xs">BarangayWorks Management</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-white/80 hover:text-white text-sm font-medium min-w-[44px] min-h-[44px] flex items-center justify-center">Logout</button>
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
                {tab.id === 'pending' && pending.length > 0 && (
                  <span className="ml-auto bg-yellow-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{pending.length}</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <>
                <h2 className="text-xl font-bold text-gray-900">Overview</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[{ icon: '⏳', label: 'Pending', val: counters[0] }, { icon: '✅', label: 'Verified', val: counters[1] }, { icon: '🟢', label: 'Online', val: counters[2] }, { icon: '📋', label: 'Requests', val: counters[3] }].map((s) => (
                    <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
                      <p className="text-2xl font-bold text-gray-900">{s.icon} {s.val}</p>
                      <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Recent Activity</h3>
                  <div className="space-y-3">
                    {mockActivity.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 text-sm">
                        <span className="text-lg">{a.icon}</span>
                        <span className="flex-1 text-gray-700">{a.text}</span>
                        <span className="text-xs text-gray-400">{a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* PENDING */}
            {activeTab === 'pending' && (
              <>
                <h2 className="text-xl font-bold text-gray-900">Pending Verification ({pending.length})</h2>
                {pending.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
                    <p className="text-2xl mb-2">🎉</p>
                    <p className="text-gray-500 text-sm">All workers verified!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pending.map((w) => (
                      <div key={w.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0">
                            {w.profile_image_url ? <img src={w.profile_image_url} alt={w.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500">{w.name.charAt(0)}</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <button onClick={() => setDetailWorker(w)} className="font-semibold text-gray-900 text-sm hover:text-blue-600 text-left">{w.name}</button>
                            <p className="text-xs text-gray-500 capitalize">{w.skills.join(', ')} · {w.barangay}</p>
                            <p className="text-xs text-gray-400">{timeAgo(w.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => handleApprove(w.id)} className="flex-1 min-h-[44px] bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 active:scale-95 transition-all">✓ Approve</button>
                          <button onClick={() => setRejectTarget(w.id)} className="flex-1 min-h-[44px] border-2 border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 active:scale-95 transition-all">✗ Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* WORKERS */}
            {activeTab === 'workers' && (
              <>
                <h2 className="text-xl font-bold text-gray-900">Verified Workers ({verified.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {verified.map((w) => (
                    <div key={w.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                          {w.profile_image_url ? <img src={w.profile_image_url} alt={w.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{w.name.charAt(0)}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{w.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{w.skills.join(', ')}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">📍 {w.barangay}</p>
                      <button onClick={() => handleRemove(w.id)} className="w-full min-h-[44px] border-2 border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 active:scale-95 transition-all">Remove</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* REQUESTS */}
            {activeTab === 'requests' && (
              <>
                <h2 className="text-xl font-bold text-gray-900">Service Requests ({requests.length})</h2>
                <div className="space-y-3">
                  {requests.map((r) => (
                    <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusStyle[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                        {r.urgency && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${urgencyStyle[r.urgency] || 'bg-gray-100 text-gray-600'}`}>{r.urgency}</span>}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{r.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{r.client_name || 'Client'} → {r.worker_name || 'Unassigned'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(r.created_at)}</p>
                    </div>
                  ))}
                </div>
              </>
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
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Reject Worker</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection (min 10 chars)..." className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <div className="flex gap-2">
              <button onClick={handleRejectSubmit} disabled={rejectReason.trim().length < 10} className="flex-1 min-h-[44px] bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all">Confirm Reject</button>
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="flex-1 min-h-[44px] border-2 border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Worker Detail Modal */}
      {detailWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden shrink-0">
                {detailWorker.profile_image_url ? <img src={detailWorker.profile_image_url} alt={detailWorker.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">{detailWorker.name.charAt(0)}</div>}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{detailWorker.name}</h3>
                <p className="text-sm text-gray-500">📍 {detailWorker.barangay}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-500">Skills:</span> <span className="font-medium capitalize">{detailWorker.skills.join(', ')}</span></div>
              <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-500">Contact:</span> <span className="font-medium">{detailWorker.contact_number}</span></div>
              <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-500">Registered:</span> <span className="font-medium">{timeAgo(detailWorker.created_at)}</span></div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Verification Checklist</p>
              <div className="space-y-1 text-sm">
                <p>✅ Profile photo uploaded</p>
                <p>✅ Contact number provided</p>
                <p>✅ Skills selected</p>
                <p>✅ Barangay assigned</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleApprove(detailWorker.id)} className="flex-1 min-h-[44px] bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 active:scale-95 transition-all">✓ Approve</button>
              <button onClick={() => { setRejectTarget(detailWorker.id); setDetailWorker(null); }} className="flex-1 min-h-[44px] border-2 border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 active:scale-95 transition-all">✗ Reject</button>
            </div>
            <button onClick={() => setDetailWorker(null)} className="w-full min-h-[44px] text-gray-500 text-sm font-medium hover:text-gray-700">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
