import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useMapStore } from '../../store/mapStore';
import { getBarangayBounds } from '../../services/barangay';
import WorkerPinComponent from './WorkerPin';

/** Default center: Quezon City */
const DEFAULT_CENTER: [number, number] = [14.676, 121.044];
const DEFAULT_ZOOM = 12;

/** Quezon City bounding box with padding — restricts map panning */
const QC_BOUNDS: L.LatLngBoundsExpression = [
  [14.55, 120.97],  // Southwest corner (with padding)
  [14.80, 121.15],  // Northeast corner (with padding)
];

/**
 * Inner component that syncs the Leaflet map instance with Zustand store state.
 * Must be rendered inside a MapContainer.
 */
function MapController() {
  const map = useMap();
  const { mapCenter, mapZoom, selectedBarangay } = useMapStore();
  const prevBarangayRef = useRef<string | null>(null);

  // Sync map center/zoom when store values change (e.g., clearBarangay resets to default)
  useEffect(() => {
    map.setView(mapCenter, mapZoom);
  }, [map, mapCenter, mapZoom]);

  // Fit bounds when a barangay is selected
  useEffect(() => {
    if (selectedBarangay && selectedBarangay !== prevBarangayRef.current) {
      const bounds = getBarangayBounds(selectedBarangay);
      if (bounds) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
    prevBarangayRef.current = selectedBarangay;
  }, [map, selectedBarangay]);

  return null;
}

/**
 * MapView component — renders a Leaflet map restricted to Quezon City.
 * Uses OpenStreetMap tiles and integrates with the mapStore for reactive updates.
 * Map is bounded to QC area only — users cannot scroll to other countries.
 */
export default function MapView() {
  const mapRef = useRef<LeafletMap | null>(null);
  const { workerPins } = useMapStore();

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
      ref={mapRef}
      zoomControl={true}
      minZoom={11}
      maxZoom={18}
      maxBounds={QC_BOUNDS}
      maxBoundsViscosity={1.0}
      worldCopyJump={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        noWrap={true}
      />
      <MapController />
      {workerPins.map((pin) => (
        <WorkerPinComponent key={pin.id} worker={pin} />
      ))}
    </MapContainer>
  );
}
