import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { barangays } from '../data/barangays';

// ============================================================
// Types
// ============================================================

interface LocationPickerProps {
  selectedBarangay: string;
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

// ============================================================
// Constants
// ============================================================

// Custom pin icon
const locationIcon = L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;background:#DC2626;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:14px;">📍</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// QC bounds
const QC_BOUNDS: L.LatLngBoundsExpression = [[14.55, 120.97], [14.80, 121.15]];

// ============================================================
// Sub-components
// ============================================================

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

// ============================================================
// Main Component
// ============================================================

export default function LocationPicker({
  selectedBarangay,
  initialLat,
  initialLng,
  onLocationSelect,
}: LocationPickerProps) {
  const brgy = barangays.find((b) => b.name === selectedBarangay);
  const defaultLat = initialLat ?? brgy?.lat ?? 14.676;
  const defaultLng = initialLng ?? brgy?.lng ?? 121.044;

  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);
  const [address, setAddress] = useState('');
  const [pinPlaced, setPinPlaced] = useState(!!initialLat);
  const [center, setCenter] = useState<[number, number]>([defaultLat, defaultLng]);
  const [isLocating, setIsLocating] = useState(false);

  // Update center when barangay changes
  useEffect(() => {
    if (brgy) {
      setCenter([brgy.lat, brgy.lng]);
      if (!pinPlaced) {
        setLat(brgy.lat);
        setLng(brgy.lng);
      }
    }
  }, [selectedBarangay]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMapClick = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setPinPlaced(true);
    onLocationSelect(newLat, newLng, address);
  };

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    onLocationSelect(lat, lng, newAddress);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setLat(newLat);
        setLng(newLng);
        setCenter([newLat, newLng]);
        setPinPlaced(true);
        onLocationSelect(newLat, newLng, address);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="h-[250px] md:h-[300px]">
          <MapContainer
            center={center}
            zoom={15}
            className="h-full w-full"
            maxBounds={QC_BOUNDS}
            maxBoundsViscosity={1.0}
            minZoom={12}
            maxZoom={18}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            <MapClickHandler onMapClick={handleMapClick} />
            <MapCenterUpdater center={center} />
            {pinPlaced && (
              <Marker
                position={[lat, lng]}
                icon={locationIcon}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target as L.Marker;
                    const pos = marker.getLatLng();
                    setLat(pos.lat);
                    setLng(pos.lng);
                    onLocationSelect(pos.lat, pos.lng, address);
                  },
                }}
              />
            )}
          </MapContainer>
        </div>
        {/* Instruction overlay */}
        {!pinPlaced && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm border border-gray-100 z-[1000]">
            <p className="text-xs text-gray-600 font-medium">📍 Tap the map to set your exact location</p>
          </div>
        )}
      </div>

      {/* Use My Location button */}
      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={isLocating}
        className="w-full min-h-[44px] border-2 border-blue-200 text-blue-700 font-medium rounded-xl hover:bg-blue-50 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
      >
        {isLocating ? (
          <>
            <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
            Locating...
          </>
        ) : (
          <>📍 Use My Current Location</>
        )}
      </button>

      {/* Address input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Street Address (optional)
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => handleAddressChange(e.target.value)}
          placeholder="e.g., 123 Kalayaan Ave, Brgy. Diliman"
          className="w-full min-h-[44px] px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Coordinates display */}
      {pinPlaced && (
        <p className="text-xs text-gray-400 text-center">
          📍 {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}
