/**
 * Pre-bundled barangay data for Quezon City.
 * Coordinates match the seed data from supabase/migrations/004_seed_barangays.sql.
 * All coordinates fall within QC bounding box: lat 14.58-14.78, lng 121.0-121.12
 */

export interface BarangayData {
  name: string;
  lat: number;
  lng: number;
  bounds: [[number, number], [number, number]]; // [[south, west], [north, east]]
}

export const barangays: BarangayData[] = [
  {
    name: 'Bagong Pag-asa',
    lat: 14.665,
    lng: 121.025,
    bounds: [[14.660, 121.020], [14.670, 121.030]],
  },
  {
    name: 'Bahay Toro',
    lat: 14.675,
    lng: 121.030,
    bounds: [[14.670, 121.025], [14.680, 121.035]],
  },
  {
    name: 'Batasan Hills',
    lat: 14.688,
    lng: 121.088,
    bounds: [[14.680, 121.080], [14.695, 121.095]],
  },
  {
    name: 'Commonwealth',
    lat: 14.703,
    lng: 121.083,
    bounds: [[14.695, 121.075], [14.710, 121.090]],
  },
  {
    name: 'Culiat',
    lat: 14.670,
    lng: 121.045,
    bounds: [[14.665, 121.040], [14.675, 121.050]],
  },
  {
    name: 'Diliman',
    lat: 14.653,
    lng: 121.043,
    bounds: [[14.645, 121.035], [14.660, 121.050]],
  },
  {
    name: 'Don Manuel',
    lat: 14.645,
    lng: 121.020,
    bounds: [[14.640, 121.015], [14.650, 121.025]],
  },
  {
    name: 'Fairview',
    lat: 14.730,
    lng: 121.070,
    bounds: [[14.720, 121.060], [14.740, 121.080]],
  },
  {
    name: 'Holy Spirit',
    lat: 14.677,
    lng: 121.082,
    bounds: [[14.670, 121.075], [14.683, 121.088]],
  },
  {
    name: 'Kamuning',
    lat: 14.630,
    lng: 121.040,
    bounds: [[14.625, 121.035], [14.635, 121.045]],
  },
  {
    name: 'Krus na Ligas',
    lat: 14.649,
    lng: 121.059,
    bounds: [[14.645, 121.055], [14.653, 121.063]],
  },
  {
    name: 'Loyola Heights',
    lat: 14.642,
    lng: 121.072,
    bounds: [[14.635, 121.065], [14.648, 121.078]],
  },
  {
    name: 'Matandang Balara',
    lat: 14.668,
    lng: 121.078,
    bounds: [[14.660, 121.070], [14.675, 121.085]],
  },
  {
    name: 'New Era',
    lat: 14.685,
    lng: 121.040,
    bounds: [[14.680, 121.035], [14.690, 121.045]],
  },
  {
    name: 'North Fairview',
    lat: 14.750,
    lng: 121.070,
    bounds: [[14.740, 121.060], [14.760, 121.080]],
  },
  {
    name: 'Novaliches Proper',
    lat: 14.728,
    lng: 121.043,
    bounds: [[14.720, 121.035], [14.735, 121.050]],
  },
  {
    name: 'Old Balara',
    lat: 14.662,
    lng: 121.066,
    bounds: [[14.655, 121.060], [14.668, 121.072]],
  },
  {
    name: 'Pansol',
    lat: 14.640,
    lng: 121.060,
    bounds: [[14.635, 121.055], [14.645, 121.065]],
  },
  {
    name: 'Pasong Tamo',
    lat: 14.686,
    lng: 121.056,
    bounds: [[14.680, 121.050], [14.692, 121.062]],
  },
  {
    name: 'Payatas',
    lat: 14.710,
    lng: 121.100,
    bounds: [[14.700, 121.090], [14.720, 121.110]],
  },
  {
    name: 'Phil-Am',
    lat: 14.640,
    lng: 121.035,
    bounds: [[14.635, 121.030], [14.645, 121.040]],
  },
  {
    name: 'Project 6',
    lat: 14.651,
    lng: 121.026,
    bounds: [[14.645, 121.020], [14.657, 121.032]],
  },
  {
    name: 'Quezon City Central',
    lat: 14.638,
    lng: 121.048,
    bounds: [[14.630, 121.040], [14.645, 121.055]],
  },
  {
    name: 'Sangandaan',
    lat: 14.686,
    lng: 121.016,
    bounds: [[14.680, 121.010], [14.692, 121.022]],
  },
  {
    name: 'Sauyo',
    lat: 14.718,
    lng: 121.048,
    bounds: [[14.710, 121.040], [14.725, 121.055]],
  },
  {
    name: 'Sienna',
    lat: 14.705,
    lng: 121.060,
    bounds: [[14.700, 121.055], [14.710, 121.065]],
  },
  {
    name: 'South Triangle',
    lat: 14.626,
    lng: 121.036,
    bounds: [[14.620, 121.030], [14.632, 121.042]],
  },
  {
    name: 'Tandang Sora',
    lat: 14.698,
    lng: 121.048,
    bounds: [[14.690, 121.040], [14.705, 121.055]],
  },
  {
    name: 'Teachers Village',
    lat: 14.650,
    lng: 121.055,
    bounds: [[14.645, 121.050], [14.655, 121.060]],
  },
  {
    name: 'UP Campus',
    lat: 14.657,
    lng: 121.065,
    bounds: [[14.648, 121.055], [14.665, 121.075]],
  },
  {
    name: 'Vasra',
    lat: 14.655,
    lng: 121.025,
    bounds: [[14.650, 121.020], [14.660, 121.030]],
  },
  {
    name: 'Veterans Village',
    lat: 14.686,
    lng: 121.066,
    bounds: [[14.680, 121.060], [14.692, 121.072]],
  },
];
