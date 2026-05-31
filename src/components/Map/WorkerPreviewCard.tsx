import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { WorkerPreview } from '../../types';
import ServiceRequestModal from '../ServiceRequestModal';

/**
 * Props for the WorkerPreviewCard component.
 * Extends WorkerPreview with optional fields for rich display.
 */
export interface WorkerPreviewCardProps extends WorkerPreview {
  contactNumber?: string;
  profileImageUrl?: string;
  barangay?: string;
  trustScore?: number;
}

/**
 * Formats the average rating for display.
 * Returns the rating with one decimal place, or "No ratings yet" if null.
 */
export function formatRating(averageRating: number | null): string {
  if (averageRating === null) {
    return 'No ratings yet';
  }
  return averageRating.toFixed(1);
}

/**
 * Renders star icons for a given rating.
 */
function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <span className="text-xs text-gray-400 italic">No ratings yet</span>;
  }

  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`full-${i}`} className="text-amber-400 text-sm">★</span>
        ))}
        {hasHalf && <span className="text-amber-400 text-sm opacity-60">★</span>}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300 text-sm">★</span>
        ))}
      </div>
      <span className="text-xs font-semibold text-gray-600 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

/**
 * Trust Score circular indicator with animated ring fill.
 * Color coded: 0-40 red, 41-60 amber, 61-80 blue, 81-100 green.
 * Uses dramatic animation token (800ms ease).
 */
function TrustScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 16; // radius 16
  const progress = (score / 100) * circumference;
  const color = score >= 81 ? '#10B981' : score >= 61 ? '#3B82F6' : score >= 41 ? '#D97706' : '#DC2626';

  return (
    <div className="flex flex-col items-center gap-0.5 relative">
      <svg width="40" height="40" className="transform -rotate-90">
        <circle cx="20" cy="20" r="16" fill="none" stroke="#E5E7EB" strokeWidth="3" />
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${circumference - progress}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <span
        className="absolute text-xs font-bold text-gray-700"
        style={{ top: '10px', left: '50%', transform: 'translateX(-50%)' }}
      >
        {score}
      </span>
      <span className="text-[10px] text-gray-400 font-medium">Trust</span>
    </div>
  );
}

/**
 * WorkerPreviewCard — displayed inside a Leaflet Popup when a worker pin is clicked.
 *
 * Shows: profile image, worker name, primary skill, star rating, trust score,
 * verification badge, barangay location, and request service button.
 *
 * Validates: Requirements 5.3, 5.4, 11.2
 */
export default function WorkerPreviewCard({
  id,
  name,
  primarySkill,
  averageRating,
  isVerified,
  contactNumber,
  profileImageUrl,
  barangay,
  trustScore,
}: WorkerPreviewCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        className="w-72 rounded-xl bg-white overflow-hidden"
        data-testid="worker-preview-card"
      >
        {/* Gradient accent bar */}
        <div className="h-2" style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #F59E0B 100%)' }}></div>

        <div className="p-4">
          {/* Profile section */}
          <div className="flex items-center gap-3 mb-3">
            {/* Avatar */}
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={`${name}'s profile`}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {name.charAt(0)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Worker name */}
              <Link
                to={`/worker/${id}`}
                className="block"
                aria-label={`View full profile of ${name}`}
              >
                <h3 className="text-base font-bold text-gray-900 truncate hover:text-blue-600 transition-colors">
                  {name}
                </h3>
              </Link>

              {/* Primary skill */}
              <p className="text-sm text-gray-500 capitalize">
                {primarySkill}
              </p>
            </div>

            {/* Verification badge */}
            {isVerified && (
              <span
                className="shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200"
                aria-label="Verified worker"
              >
                ✓ Verified
              </span>
            )}
          </div>

          {/* Rating and Trust Score row */}
          <div className="flex items-center justify-between mb-3">
            <StarRating rating={averageRating} />
            {trustScore !== undefined && <TrustScoreCircle score={trustScore} />}
          </div>

          {/* Barangay location */}
          {barangay && (
            <div className="flex items-center gap-1.5 mb-4 text-xs text-gray-500">
              <span>📍</span>
              <span>{barangay}, Quezon City</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {/* Request Service button — primary action */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center w-full min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)' }}
              aria-label={`Request service from ${name}`}
              data-testid="request-service-button"
            >
              📋 Request Service
            </button>

            {/* Call button — secondary action */}
            {contactNumber && (
              <a
                href={`tel:${contactNumber}`}
                className="flex items-center justify-center w-full min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-blue-600 text-sm font-medium border border-blue-200 hover:bg-blue-50 transition-all duration-200"
                aria-label={`Call ${name}`}
                data-testid="contact-button"
              >
                📞 Call Worker
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Service Request Modal */}
      <ServiceRequestModal
        workerId={id}
        workerName={name}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
