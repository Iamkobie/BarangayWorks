import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, getCurrentUser, logout as logoutService } from '../services/auth';
import { useAuthStore } from '../store/authStore';
import { validateEmail } from '../utils/validation';

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setRole, clearUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  // Clear any existing session when login page is visited
  useEffect(() => {
    logoutService();
    clearUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Invalid email or password');
      triggerShake();
      return;
    }
    if (!password) {
      setError('Invalid email or password');
      triggerShake();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.error) {
        setError(result.error);
        triggerShake();
        return;
      }

      const { user, role } = await getCurrentUser();
      if (user) {
        setUser(user, null);
        setRole(role);
        navigate('/dashboard');
      }
    } catch {
      setError('Something went wrong. Please try again.');
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleDemoLogin = async () => {
    setEmail('demo@barangayworks.ph');
    setPassword('Demo1234');
    setIsSubmitting(true);
    setError('');

    // Use a timeout to prevent hanging if Supabase is blocked
    const demoFallback = () => {
      setUser({ id: 'demo-user', email: 'demo@barangayworks.ph', user_metadata: { role: 'client' } } as any, null);
      setRole('client');
      navigate('/dashboard');
    };

    const timeout = setTimeout(demoFallback, 3000); // Fallback after 3 seconds

    try {
      const result = await login('demo@barangayworks.ph', 'Demo1234');
      clearTimeout(timeout);
      if (result.error) {
        demoFallback();
        return;
      }
      const { user, role } = await getCurrentUser();
      clearTimeout(timeout);
      if (user) {
        setUser(user, null);
        setRole(role);
        navigate('/dashboard');
      } else {
        demoFallback();
      }
    } catch {
      clearTimeout(timeout);
      demoFallback();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel - desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #F59E0B 100%)',
      }}>
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl" />

        {/* Floating icons */}
        {['🔧', '⚡', '🪚', '🧱', '💪'].map((icon, i) => (
          <div
            key={i}
            className="absolute text-4xl opacity-20 animate-bounce"
            style={{
              left: `${20 + (i * 15) % 60}%`,
              top: `${20 + (i * 18) % 50}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i}s`,
            }}
          >
            {icon}
          </div>
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 border border-white/20 mb-6">
              <span className="text-2xl">👷</span>
              <span className="text-white font-bold text-lg">BarangayWorks</span>
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
              Connecting Communities{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                One Skill at a Time
              </span>
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              The easiest way to find verified skilled workers in your barangay across Quezon City.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
              <div className="text-2xl font-extrabold text-white">35+</div>
              <div className="text-xs text-blue-200 mt-1">Workers</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
              <div className="text-2xl font-extrabold text-white">31</div>
              <div className="text-xs text-blue-200 mt-1">Barangays</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
              <div className="text-2xl font-extrabold text-white">5</div>
              <div className="text-xs text-blue-200 mt-1">Categories</div>
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center gap-3">
            <div className="flex -space-x-2">
              {[5, 12, 25, 32].map((img) => (
                <img
                  key={img}
                  src={`https://i.pravatar.cc/40?img=${img}`}
                  alt=""
                  className="w-8 h-8 rounded-full border-2 border-blue-800"
                />
              ))}
            </div>
            <p className="text-blue-100 text-sm">
              Trusted by <span className="font-bold text-white">500+</span> households in QC
            </p>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className={`w-full max-w-md transition-transform duration-300 ${shake ? 'animate-shake' : ''}`}>
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="text-3xl">👷</span>
              <h1 className="text-2xl font-extrabold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-amber-500">
                  BarangayWorks
                </span>
              </h1>
            </div>
            <p className="text-gray-500 text-sm">Find Skilled Workers Near You</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
            {/* Desktop branding inside card */}
            <div className="hidden lg:block text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="text-2xl">👷</span>
                <h1 className="text-xl font-extrabold">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-amber-500">
                    BarangayWorks
                  </span>
                </h1>
              </div>
              <p className="text-gray-500 text-sm">Sign in to your account</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2" role="alert">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-h-[44px] px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[44px] px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400 uppercase tracking-wider">or</span>
              </div>
            </div>

            {/* Demo Mode Button - Client only */}
            <button
              onClick={handleDemoLogin}
              disabled={isSubmitting}
              className="w-full min-h-[44px] bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span className="text-lg">🚀</span>
              <span>Demo Mode (Browse as Client)</span>
            </button>

            <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
              <p>
                Need an account?{' '}
                <Link to="/register/client" className="text-blue-600 hover:text-blue-800 font-medium">
                  Register as Client
                </Link>
              </p>
              <p>
                Offering services?{' '}
                <Link to="/register/worker" className="text-blue-600 hover:text-blue-800 font-medium">
                  Register as Worker
                </Link>
              </p>
            </div>
          </div>

          {/* Social proof - mobile */}
          <div className="lg:hidden mt-6 text-center">
            <p className="text-gray-400 text-xs">
              Trusted by <span className="font-semibold text-gray-600">500+</span> households in Quezon City
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
