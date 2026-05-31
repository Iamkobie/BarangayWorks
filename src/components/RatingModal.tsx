import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

interface RatingModalProps {
  workerId: string;
  workerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function RatingModal({ workerId, workerName, isOpen, onClose }: RatingModalProps) {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      addToast('Please select a rating', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('ratings').insert({
        worker_id: workerId,
        client_id: user?.id || 'anonymous',
        rating: rating,
      });

      if (error) throw error;

      setIsSuccess(true);
      addToast(`Rating submitted for ${workerName}!`, 'success');

      setTimeout(() => {
        setIsSuccess(false);
        setRating(0);
        setComment('');
        onClose();
      }, 1500);
    } catch (e) {
      console.error('Rating submission failed:', e);
      addToast('Failed to submit rating. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setComment('');
      setIsSuccess(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Rate Worker</h3>
          <button
            onClick={handleClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Close rating modal"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {isSuccess ? (
            <div className="text-center py-6 animate-scale-in">
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-lg font-bold text-gray-900">Thank you!</p>
              <p className="text-sm text-gray-500 mt-1">Your rating has been submitted.</p>
            </div>
          ) : (
            <>
              {/* Worker Name */}
              <div className="text-center">
                <p className="text-sm text-gray-500">How was your experience with</p>
                <p className="text-lg font-bold text-gray-900">{workerName}?</p>
              </div>

              {/* Star Rating */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-3xl transition-transform duration-200 hover:scale-110 active:scale-95"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    {star <= (hoveredStar || rating) ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500">
                {rating > 0 ? `${rating} / 5 stars` : 'Tap a star to rate'}
              </p>

              {/* Comment */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Comment (optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full min-h-[80px] px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Share your experience..."
                  maxLength={300}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="w-full min-h-[44px] bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-200"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit Rating'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
