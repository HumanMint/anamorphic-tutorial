// Layout breakpoints (aligned with Tailwind defaults)
export const BREAKPOINTS = { SM: 380, MD: 768, LG: 1024 };

// Sensor scaling factors per breakpoint
export const SCALE_FACTORS = { SM: 3, MD: 4, LG: 8 };

// Animation configuration
export const ANIMATION = {
  ELASTIC: { ease: 'outElastic(1, 0.6)', duration: 1400 },
  METRIC_POP: { duration: 300, ease: 'outQuart' },
  METRIC_SETTLE: { duration: 800, ease: 'outElastic(1, 0.5)' },
  REDUCED_MOTION: { ease: 'linear', duration: 0 },
};

// Color tokens
export const COLORS = {
  ACCENT: '#ff4400',
  INCREASE: '#ff4400',
  DECREASE: '#3d5afe',
  TEXT_DEFAULT: '#4b5563',
};

// Data source
export const CSV_URL = 'https://raw.githubusercontent.com/humanmint/atlas-vision/main/public/data/cameras.csv';
export const CACHE_KEY = 'anamorphic_camera_data';
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Standard delivery ratios in cinematography
export const DELIVERY_RATIOS = [
  { value: 1.78, label: '1.78:1', sublabel: 'HD' },
  { value: 1.90, label: '1.90:1', sublabel: '' },
  { value: 2.39, label: '2.39:1', sublabel: 'SCOPE' },
  { value: 2.76, label: '2.76:1', sublabel: '' },
];

// Resize debounce delay (ms)
export const RESIZE_DEBOUNCE_MS = 150;
