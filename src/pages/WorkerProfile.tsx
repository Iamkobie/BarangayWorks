import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import RatingModal from '../components/RatingModal';
import type { JobCategory } from '../types';

interface WorkerProfileData {
  id: string;
  name: string;
  profile_image_url: string;
  skills: JobCategory[];
  barangay: string;
  contact_number: string;
  verification_status: string;
}

export default function WorkerProfile() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuthStore();
  const [worker, setWorker] = useState<WorkerProfileData | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchWorker();
  }, [id]);

  const fetchWorker = async () => {
    setIsLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('workers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !data) {
      setError('This profile is no longer available.');
      setIsLoading(false);
      return;
    }

    setWorker(data as WorkerProfileData);

    // Fetch average rating
    const { data: ratingData } = await supabase
      .from('ratings')
      .select('rating')
      .eq('worker_id', id);

    if (ratingData && ratingData.length > 0) {
      const avg = ratingData.reduce((sum, r) => sum + r.rating, 0) / ratingData.length;
      setAverageRating(avg);
    } else {
      setAverageRating(null);
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Profile not found.'}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center min-h-[44px] px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-lg mx-auto">
        {/* Back link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center min-h-[44px] text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Map
        </Link>

        <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
          {/* Profile Image & Name */}
          <div className="flex flex-col items-center">
            <img
              src={worker.profile_image_url || '/placeholder-avatar.png'}
              alt={worker.name}
              className="w-28 h-28 rounded-full object-cover border-2 border-gray-200 mb-3"
            />
            <h1 className="text-xl font-bold text-gray-900">{worker.name}</h1>
            <p className="text-sm text-gray-500">{worker.barangay}</p>
            {worker.verification_status === 'verified' && (
              <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Verified
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="text-center">
            <p className="text-sm text-gray-700">
              {averageRating !== null
                ? `⭐ ${averageRating.toFixed(1)} / 5.0`
                : 'No ratings yet'}
            </p>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {worker.skills.map((skill) => (
                <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <a
              href={`tel:${worker.contact_number}`}
              className="flex items-center justify-center min-h-[44px] w-full bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              aria-label={`Call ${worker.name}`}
            >
              📞 Call {worker.contact_number}
            </a>
            <Link
              to={`/chat/${worker.id}`}
              className="flex items-center justify-center min-h-[44px] w-full border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              aria-label={`Chat with ${worker.name}`}
            >
              💬 Chat
            </Link>
            {role === 'client' && (
              <button
                onClick={() => setShowRatingModal(true)}
                className="flex items-center justify-center min-h-[44px] w-full bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors"
                aria-label={`Rate ${worker.name}`}
              >
                ⭐ Rate this Worker
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {worker && (
        <RatingModal
          workerId={worker.id}
          workerName={worker.name}
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </div>
  );
}
