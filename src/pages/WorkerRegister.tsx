import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerWorker } from '../services/auth';
import { validateEmail, validatePassword } from '../utils/validation';
import { barangays } from '../data/barangays';
import LocationPicker from '../components/LocationPicker';
import type { JobCategory } from '../types';

const JOB_CATEGORIES: { value: JobCategory; label: string }[] = [
  { value: 'plumber', label: 'Plumber' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'mason', label: 'Mason' },
  { value: 'laborer', label: 'Laborer' },
];

export default function WorkerRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skills, setSkills] = useState<JobCategory[]>([]);
  const [barangay, setBarangay] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workerLat, setWorkerLat] = useState<number | null>(null);
  const [workerLng, setWorkerLng] = useState<number | null>(null);
  const [workerAddress, setWorkerAddress] = useState('');

  const toggleSkill = (skill: JobCategory) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, profileImage: 'Image must be under 5MB' }));
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setErrors((prev) => ({ ...prev, profileImage: 'Only JPEG and PNG images are accepted' }));
        return;
      }
      setErrors((prev) => { const { profileImage: _, ...rest } = prev; return rest; });
      setProfileImage(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setErrors({});

    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!validateEmail(email)) newErrors.email = 'Please enter a valid email address';
    const pwResult = validatePassword(password);
    if (!pwResult.valid) newErrors.password = pwResult.errors[0];
    if (!name.trim()) newErrors.name = 'Name is required';
    else if (name.length > 100) newErrors.name = 'Name must be 100 characters or less';
    if (skills.length === 0) newErrors.skills = 'Select at least one skill';
    else if (skills.length > 5) newErrors.skills = 'Maximum 5 skills allowed';
    if (!barangay) newErrors.barangay = 'Please select a barangay';
    if (!contactNumber.match(/^09\d{9}$/)) newErrors.contactNumber = 'Enter a valid PH mobile number (09XXXXXXXXX)';
    if (!profileImage) newErrors.profileImage = 'Profile image is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerWorker({
        name: name.trim(),
        email,
        password,
        skills,
        barangay,
        contactNumber,
        profileImage: profileImage!,
        ...(workerLat !== null && workerLng !== null
          ? { latitude: workerLat, longitude: workerLng }
          : {}),
        ...(workerAddress ? { address: workerAddress } : {}),
      });
      if (result.error) {
        setSubmitError(result.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 md:p-8 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Registration Submitted!</h1>
          <p className="text-gray-600 mb-4">
            Your account is pending verification. An admin will review your profile shortly.
          </p>
          <p className="text-gray-600 mb-6">
            Please check your email to confirm your account.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center min-h-[44px] px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-md p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
          Register as Worker
        </h1>

        {submitError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full min-h-[44px] px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="Juan Dela Cruz"
              maxLength={100}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="w-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="w-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full min-h-[44px] px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="w-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="w-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full min-h-[44px] px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="Min 8 characters"
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills (select 1-5)</label>
            <div className="flex flex-wrap gap-2">
              {JOB_CATEGORIES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleSkill(value)}
                  className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    skills.includes(value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={skills.includes(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            {errors.skills && <p className="mt-1 text-xs text-red-600">{errors.skills}</p>}
          </div>

          {/* Barangay */}
          <div>
            <label htmlFor="w-barangay" className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
            <select
              id="w-barangay"
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              className={`w-full min-h-[44px] px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.barangay ? 'border-red-300' : 'border-gray-300'}`}
            >
              <option value="">Select barangay...</option>
              {barangays.map((b) => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
            {errors.barangay && <p className="mt-1 text-xs text-red-600">{errors.barangay}</p>}
          </div>

          {/* Location Picker */}
          {barangay && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Location</label>
              <LocationPicker
                selectedBarangay={barangay}
                onLocationSelect={(lat, lng, addr) => {
                  setWorkerLat(lat);
                  setWorkerLng(lng);
                  setWorkerAddress(addr);
                }}
              />
            </div>
          )}

          {/* Contact Number */}
          <div>
            <label htmlFor="w-contact" className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
            <input
              id="w-contact"
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className={`w-full min-h-[44px] px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactNumber ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="09XXXXXXXXX"
              maxLength={11}
            />
            {errors.contactNumber && <p className="mt-1 text-xs text-red-600">{errors.contactNumber}</p>}
          </div>

          {/* Profile Image */}
          <div>
            <label htmlFor="w-image" className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
            <input
              id="w-image"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
              className="w-full min-h-[44px] text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">Max 5MB, JPEG or PNG</p>
            {errors.profileImage && <p className="mt-1 text-xs text-red-600">{errors.profileImage}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[44px] bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
