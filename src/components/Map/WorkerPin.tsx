import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { WorkerPin as WorkerPinData } from '../../types';
import { getMockWorkerById, calculateTrustScore } from '../../data/mockWorkers';
import WorkerPreviewCard from './WorkerPreviewCard';

/**
 * Props for the WorkerPinComponent.
 */
export interface WorkerPinProps {
  worker: WorkerPinData;
}

/**
 * Skill-to-color mapping for pin markers — vibrant colors.
 */
const SKILL_COLORS: Record<string, { bg: string; ring: string; glow: string }> = {
  plumber: { bg: '#2563EB', ring: '#93C5FD', glow: 'rgba(37, 99, 235, 0.4)' },
  electrician: { bg: '#D97706', ring: '#FCD34D', glow: 'rgba(217, 119, 6, 0.4)' },
  carpenter: { bg: '#059669', ring: '#6EE7B7', glow: 'rgba(5, 150, 105, 0.4)' },
  mason: { bg: '#7C3AED', ring: '#C4B5FD', glow: 'rgba(124, 58, 237, 0.4)' },
  laborer: { bg: '#DC2626', ring: '#FCA5A5', glow: 'rgba(220, 38, 38, 0.4)' },
};

/**
 * Skill-to-emoji mapping for pin icons.
 */
const SKILL_EMOJIS: Record<string, string> = {
  plumber: '🔧',
  electrician: '⚡',
  carpenter: '🪚',
  mason: '🧱',
  laborer: '💪',
};

/**
 * Creates a custom Leaflet divIcon for a worker pin with bounce animation and pulsing ring.
 * When offline: no pulsing ring, semi-transparent pin, gray border.
 */
function createWorkerIcon(primarySkill: string, isVerified: boolean, isOnline: boolean): L.DivIcon {
  const colors = SKILL_COLORS[primarySkill] || { bg: '#6B7280', ring: '#D1D5DB', glow: 'rgba(107, 114, 128, 0.4)' };
  const emoji = SKILL_EMOJIS[primarySkill] || '👷';
  const verifiedBadge = isVerified
    ? `<div style="position:absolute;top:-2px;right:-2px;width:14px;height:14px;background:#22C55E;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;">
        <span style="color:white;font-size:8px;font-weight:bold;">✓</span>
       </div>`
    : '';

  const pulseRing = isOnline
    ? `<div style="
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: ${colors.glow};
        animation: pulseRing 2s ease-out infinite;
      "></div>`
    : '';

  const pinOpacity = isOnline ? '1' : '0.5';
  const borderColor = isOnline ? colors.ring : '#D1D5DB';
  const boxShadow = isOnline
    ? `0 4px 12px ${colors.glow}, 0 2px 4px rgba(0,0,0,0.1)`
    : '0 2px 4px rgba(0,0,0,0.1)';

  return L.divIcon({
    className: 'worker-pin-icon',
    html: `
      <div style="
        position: relative;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: bounceIn 0.5s ease-out;
        opacity: ${pinOpacity};
      ">
        ${pulseRing}
        <!-- Main pin body -->
        <div style="
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${colors.bg};
          border: 3px solid ${borderColor};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: ${boxShadow};
          cursor: pointer;
          transition: transform 0.2s ease;
          font-size: 18px;
        ">
          ${emoji}
        </div>
        ${verifiedBadge}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

/**
 * WorkerPinComponent renders a Leaflet marker at the worker's coordinates.
 * Features larger colorful pins with bounce animation and pulsing ring effect.
 * On click, displays a rich preview card with worker details.
 * Offline workers show semi-transparent pins with gray borders and no pulse.
 *
 * Validates: Requirements 5.2, 5.3
 */
export default function WorkerPinComponent({ worker }: WorkerPinProps) {
  const { id, latitude, longitude, primarySkill, isVerified } = worker;
  const mockWorker = getMockWorkerById(id);
  const isOnline = mockWorker?.isOnline ?? true;
  const icon = createWorkerIcon(primarySkill, isVerified, isOnline);
  const trustScore = mockWorker ? calculateTrustScore(mockWorker) : 65; // Default trust score for real workers

  // For real workers (not in mock data), create a preview from the pin data
  const previewName = mockWorker?.name ?? `Worker`;
  const previewSkill = mockWorker?.primarySkill ?? primarySkill;
  const previewRating = mockWorker?.averageRating ?? null;
  const previewContact = mockWorker?.contactNumber ?? undefined;
  const previewImage = mockWorker?.profileImageUrl ?? `https://i.pravatar.cc/150?u=${id}`;
  const previewBarangay = mockWorker?.barangay ?? undefined;

  return (
    <Marker
      position={[latitude, longitude]}
      icon={icon}
    >
      <Popup>
        <WorkerPreviewCard
          id={id}
          name={previewName}
          primarySkill={previewSkill}
          averageRating={previewRating}
          isVerified={isVerified}
          contactNumber={previewContact}
          profileImageUrl={previewImage}
          barangay={previewBarangay}
          trustScore={trustScore}
        />
      </Popup>
    </Marker>
  );
}
