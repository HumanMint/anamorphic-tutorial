import Papa from 'papaparse';
import fallbackData from '../data/cameras-fallback.json';
import { CSV_URL, CACHE_KEY, CACHE_TTL_MS } from './constants';

const sanitize = (val) => typeof val === 'string' ? val.replace(/[<>"'&]/g, '') : '';

const parseCSV = (csvText) => {
  const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  if (results.errors.length > 0) {
    console.warn('CSV parse warnings:', results.errors);
  }

  const brands = {};
  results.data.forEach(row => {
    if (!row.Brand || !row.Model) return;
    const brand = sanitize(row.Brand);
    const model = sanitize(row.Model);
    if (!brands[brand]) brands[brand] = {};
    if (!brands[brand][model]) brands[brand][model] = [];

    brands[brand][model].push({
      name: sanitize(row.Mode),
      width: parseFloat(row.Width),
      height: parseFloat(row.Height),
      resolution: sanitize(row.Resolution),
      nativeAnamorphic: row.NativeAnamorphic?.toLowerCase() === 'true',
      supportedSqueezes: row.SupportedSqueezes
        ? row.SupportedSqueezes.split(';')
            .map(s => parseFloat(s.trim()))
            .filter(n => !Number.isNaN(n))
        : []
    });
  });

  if (Object.keys(brands).length === 0) {
    throw new Error('CSV parsed but produced no valid camera brands');
  }

  return brands;
};

const readCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL_MS) return data;
  } catch {
    // Private browsing or corrupt cache
  }
  return null;
};

const writeCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // Private browsing or quota exceeded
  }
};

export const loadCameraData = async () => {
  // Try cache first
  const cached = readCache();
  if (cached) return cached;

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error(`CSV fetch failed: ${response.status} ${response.statusText}`);
    }
    const csvText = await response.text();
    const brands = parseCSV(csvText);
    writeCache(brands);
    return brands;
  } catch (err) {
    console.warn('Live CSV fetch failed, using bundled fallback:', err);
    return fallbackData;
  }
};
