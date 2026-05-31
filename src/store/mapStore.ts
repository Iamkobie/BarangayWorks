import { create } from 'zustand';
import type { WorkerPin, JobCategory } from '../types';

const DEFAULT_MAP_CENTER: [number, number] = [14.676, 121.044]; // Quezon City center
const DEFAULT_MAP_ZOOM = 12;

interface MapState {
  selectedBarangay: string | null;
  selectedCategories: JobCategory[];
  workerPins: WorkerPin[];
  mapCenter: [number, number];
  mapZoom: number;
  setBarangay: (barangay: string | null) => void;
  clearBarangay: () => void;
  toggleCategory: (category: JobCategory) => void;
  clearCategories: () => void;
  setWorkerPins: (pins: WorkerPin[]) => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedBarangay: null,
  selectedCategories: [],
  workerPins: [],
  mapCenter: DEFAULT_MAP_CENTER,
  mapZoom: DEFAULT_MAP_ZOOM,

  setBarangay: (barangay) => set({ selectedBarangay: barangay }),

  clearBarangay: () =>
    set({
      selectedBarangay: null,
      mapCenter: DEFAULT_MAP_CENTER,
      mapZoom: DEFAULT_MAP_ZOOM,
    }),

  toggleCategory: (category) =>
    set((state) => ({
      selectedCategories: state.selectedCategories.includes(category)
        ? state.selectedCategories.filter((c) => c !== category)
        : [...state.selectedCategories, category],
    })),

  clearCategories: () => set({ selectedCategories: [] }),

  setWorkerPins: (pins) => set({ workerPins: pins }),

  setMapCenter: (center) => set({ mapCenter: center }),

  setMapZoom: (zoom) => set({ mapZoom: zoom }),
}));
