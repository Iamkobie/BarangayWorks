import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabase';
import { getCurrentUser } from './services/auth';
import { useAuthStore } from './store/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import ToastContainer from './components/Toast';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import ClientRegister from './pages/ClientRegister';
import WorkerRegister from './pages/WorkerRegister';
import ClientDashboard from './pages/ClientDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerProfile from './pages/WorkerProfile';
import AdminDashboard from './pages/AdminDashboard';
import ChatWindow from './components/Chat/ChatWindow';

function AppRoutes() {
  const { setUser, setRole, setLoading, clearUser, isAuthenticated, role } = useAuthStore();

  useEffect(() => {
    // Restore session on mount
    const initAuth = async () => {
      setLoading(true);
      try {
        const { user, role } = await getCurrentUser();
        if (user) {
          setUser(user, null);
          setRole(role);
        }
      } catch {
        clearUser();
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user, session);
          const role = session.user.user_metadata?.role ?? null;
          setRole(role);
        } else if (event === 'SIGNED_OUT') {
          clearUser();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        isAuthenticated 
          ? <Navigate to={role === 'admin' ? '/dashboard/admin' : role === 'worker' ? '/dashboard/worker' : '/dashboard'} replace />
          : <LandingPage />
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register/client" element={<ClientRegister />} />
      <Route path="/register/worker" element={<WorkerRegister />} />

      {/* Protected: Client */}
      <Route element={<ProtectedRoute allowedRoles={['client']} />}>
        <Route path="/dashboard" element={<ClientDashboard />} />
      </Route>

      {/* Protected: Worker */}
      <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
        <Route path="/dashboard/worker" element={<WorkerDashboard />} />
      </Route>

      {/* Protected: Admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
      </Route>

      {/* Protected: Any authenticated user */}
      <Route element={<ProtectedRoute />}>
        <Route path="/worker/:id" element={<WorkerProfile />} />
        <Route path="/chat/:userId" element={<ChatWindow />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
