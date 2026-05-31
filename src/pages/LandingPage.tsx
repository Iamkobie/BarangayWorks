import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STATS = [
  { label: 'Verified Workers', value: '35+', emoji: '👷' },
  { label: 'Barangays Covered', value: '31', emoji: '📍' },
  { label: 'Job Categories', value: '5', emoji: '🔧' },
];

const STEPS = [
  {
    emoji: '📍',
    title: 'Select Your Barangay',
    description: 'Choose from 31 barangays across Quezon City to find workers near you.',
  },
  {
    emoji: '🔧',
    title: 'Choose a Category',
    description: 'Filter by plumber, electrician, carpenter, mason, or laborer.',
  },
  {
    emoji: '📞',
    title: 'Contact a Worker',
    description: 'View profiles, ratings, and contact verified workers directly.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Maria Santos',
    barangay: 'Commonwealth',
    text: 'Found a reliable plumber in minutes! The verification system gives me peace of mind.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/100?img=5',
  },
  {
    name: 'Roberto Cruz',
    barangay: 'Diliman',
    text: 'As a carpenter, BarangayWorks helped me get more clients in my area. Highly recommended!',
    rating: 5,
    avatar: 'https://i.pravatar.cc/100?img=12',
  },
  {
    name: 'Elena Ramos',
    barangay: 'Fairview',
    text: 'No more asking around the neighborhood. This app connects you instantly with skilled workers.',
    rating: 4,
    avatar: 'https://i.pravatar.cc/100?img=32',
  },
];

const FLOATING_ICONS = ['🔧', '⚡', '🪚', '🧱', '💪', '🏠', '🔨', '🪛'];

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [counters, setCounters] = useState({ workers: 0, barangays: 0, categories: 0 });

  useEffect(() => {
    setIsVisible(true);
    // Animate counters
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCounters({
        workers: Math.round(35 * progress),
        barangays: Math.round(31 * progress),
        categories: Math.round(5 * progress),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 30%, #3B82F6 50%, #F59E0B 85%, #D97706 100%)',
        }} />

        {/* Animated floating icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {FLOATING_ICONS.map((icon, i) => (
            <div
              key={i}
              className="absolute text-4xl opacity-20 animate-bounce"
              style={{
                left: `${10 + (i * 12) % 80}%`,
                top: `${15 + (i * 17) % 60}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${3 + (i % 3)}s`,
              }}
            >
              {icon}
            </div>
          ))}
        </div>

        {/* Decorative circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />

        {/* Hero Content */}
        <div className={`relative z-10 text-center px-6 max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Logo */}
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 mb-8 border border-white/20">
            <span className="text-3xl">👷</span>
            <span className="text-white font-bold text-xl tracking-tight">BarangayWorks</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            Find Skilled Workers{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
              in Your Barangay
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with verified plumbers, electricians, carpenters, masons, and laborers across Quezon City
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="group relative inline-flex items-center gap-2 bg-white text-blue-700 font-bold text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            >
              <span>Find a Worker</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/register/worker"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white font-bold text-lg px-8 py-4 rounded-2xl border-2 border-white/30 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            >
              <span>Register as Worker</span>
              <span className="text-xl">💪</span>
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Three simple steps to connect with skilled workers in your area
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 group"
              >
                {/* Step number */}
                <div className="absolute -top-4 -left-2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                  {i + 1}
                </div>
                <div className="text-5xl mb-5">{step.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 md:py-24 px-6" style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #F59E0B 100%)',
      }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {STATS.map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="text-4xl mb-3">{stat.emoji}</div>
                <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">
                  {i === 0 ? `${counters.workers}+` : i === 1 ? counters.barangays : counters.categories}
                </div>
                <div className="text-blue-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Trusted by the Community
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              See what residents and workers across Quezon City are saying
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg
                      key={j}
                      className={`w-5 h-5 ${j < t.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.barangay}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Join hundreds of households and workers already using BarangayWorks
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold text-lg px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Get Started Free
            </Link>
            <Link
              to="/register/worker"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white font-medium text-lg px-8 py-4 rounded-2xl border border-gray-600 hover:border-gray-400 transition-all duration-300"
            >
              Join as a Worker
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👷</span>
            <span className="text-white font-bold text-lg">BarangayWorks</span>
          </div>
          <p className="text-gray-400 text-sm text-center">
            Connecting skilled workers with households across Quezon City
          </p>
          <p className="text-gray-500 text-xs">
            © 2024 BarangayWorks. Built for the community.
          </p>
        </div>
      </footer>
    </div>
  );
}
