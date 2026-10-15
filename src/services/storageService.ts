import { Activity } from '../types/activity';
import { INITIAL_ACTIVITIES } from '../data/seedActivities';
import { getIdbActivities, setIdbActivities, clearIdbActivities } from './idbStorage';

const STORAGE_KEY = 'peakpulse_korea_v5';

// In-memory cache for synchronous access
let memoryActivities: Activity[] = [];
let isInitialized = false;

/**
 * Initialize storage from IndexedDB (or localStorage fallback).
 * Returns the current list of activities.
 */
export async function initStorage(): Promise<Activity[]> {
  try {
    // 1. Check IndexedDB first
    const idbData = await getIdbActivities();
    if (idbData && Array.isArray(idbData)) {
      memoryActivities = idbData;
      isInitialized = true;
      // Sync to localStorage if possible without crashing
      syncToLocalStorageSafely(idbData);
      return idbData;
    }

    // 2. If IDB is empty, check localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryActivities = parsed;
        isInitialized = true;
        // Seed into IDB for future-proofing
        setIdbActivities(parsed);
        return parsed;
      }
    }

    // 3. Clean slate by default (as user requested: "not pre added details I will add mountain and summit")
    memoryActivities = [];
    isInitialized = true;
    setIdbActivities([]);
    syncToLocalStorageSafely([]);
    return [];
  } catch (err) {
    console.warn('Storage initialization fallback to memory/empty:', err);
    memoryActivities = [];
    isInitialized = true;
    return [];
  }
}

/**
 * Synchronous loader for immediate render (reads from memory cache or localStorage).
 */
export function loadActivities(): Activity[] {
  if (isInitialized) {
    return memoryActivities;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryActivities = parsed;
      return parsed;
    }
    return [];
  } catch {
    return memoryActivities;
  }
}

/**
 * Safe helper to sync activities to localStorage without throwing QuotaExceededError.
 * If quota is exceeded, saves a lightweight version or gracefully skips localStorage.
 */
function syncToLocalStorageSafely(activities: Activity[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  } catch (err: any) {
    // If quota exceeded (due to embedded photo base64 strings), strip/truncate photos for localStorage
    // while IndexedDB safely stores the full photos
    try {
      const lightweight = activities.map((act) => ({
        ...act,
        photos: act.photos.map((p) => ({
          ...p,
          // If url is huge data URI, replace with placeholder in localStorage only
          url: p.url.length > 50000 ? p.url.slice(0, 500) + '...[cached_in_idb]' : p.url,
        })),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
    } catch {
      // If even lightweight exceeds or localStorage is unavailable, silent catch
      // Data is already safely preserved in IndexedDB and memory
    }
  }
}

export function saveActivities(activities: Activity[]): void {
  memoryActivities = activities;
  isInitialized = true;

  // Persist to IndexedDB (async, no quota limits)
  setIdbActivities(activities).catch((err) => {
    console.warn('IDB write failed:', err);
  });

  // Persist to localStorage safely
  syncToLocalStorageSafely(activities);
}

export function addActivity(newActivity: Activity): Activity[] {
  const current = loadActivities();
  const updated = [newActivity, ...current];
  saveActivities(updated);
  return updated;
}

export function updateActivity(updatedActivity: Activity): Activity[] {
  const current = loadActivities();
  const updated = current.map((a) => (a.id === updatedActivity.id ? updatedActivity : a));
  saveActivities(updated);
  return updated;
}

export function deleteActivity(id: string): Activity[] {
  const current = loadActivities();
  const updated = current.filter((a) => a.id !== id);
  saveActivities(updated);
  return updated;
}

export function loadSampleSeedData(): Activity[] {
  saveActivities(INITIAL_ACTIVITIES);
  return INITIAL_ACTIVITIES;
}

export function clearAllActivities(): Activity[] {
  clearIdbActivities().catch(() => {});
  saveActivities([]);
  return [];
}

export function resetToSeedData(): Activity[] {
  return loadSampleSeedData();
}

export function exportActivitiesToJson(activities: Activity[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activities, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `peakpulse_korea_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importActivitiesFromJson(jsonText: string): Activity[] {
  const parsed = JSON.parse(jsonText);
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid JSON format: expected an array of activities');
  }
  saveActivities(parsed);
  return parsed;
}
