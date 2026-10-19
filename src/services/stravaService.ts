import { RunningLog, Activity } from '../types/activity';
import { formatPace } from '../utils/activityStats';

export interface StravaAthlete {
  id: number;
  username?: string;
  firstname: string;
  lastname: string;
  profile?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface StravaAuthPayload {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: StravaAthlete;
  canReadActivities?: boolean;
  restrictionReason?: string | null;
  scope?: string;
}

export interface StravaActivitySummary {
  id: number | string;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  type: string; // "Run", "TrailRun", "Hike", "Walk", etc.
  start_date_local: string; // ISO
  start_latlng?: [number, number];
  average_speed?: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  location_city?: string;
  description?: string;
}

const STRAVA_STORAGE_KEY = 'peakpulse_strava_auth_v1';

export function getStoredStravaAuth(): StravaAuthPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STRAVA_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredStravaAuth(payload: StravaAuthPayload): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STRAVA_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Could not save Strava auth to localStorage', err);
  }
}

export function clearStoredStravaAuth(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STRAVA_STORAGE_KEY);
  } catch (err) {
    console.warn('Could not remove Strava auth', err);
  }
}

/**
 * Fetch server configuration for Strava OAuth
 */
export async function getStravaConfig(): Promise<{
  configured: boolean;
  clientId: string;
  appUrl: string;
  redirectUri: string;
}> {
  try {
    const res = await fetch('/api/strava/config');
    if (!res.ok) throw new Error('Failed to fetch Strava config');
    return await res.json();
  } catch (err) {
    console.warn('Failed to load server config, using fallback:', err);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return {
      configured: false,
      clientId: '',
      appUrl: origin,
      redirectUri: `${origin}/auth/callback`,
    };
  }
}

/**
 * Triggers Popup-based Strava OAuth flow following AI Studio OAuth Integration guidelines
 */
export async function openStravaOAuthPopup(customClientId?: string): Promise<StravaAuthPayload> {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectUri = `${origin}/auth/callback`;

  // 1. Get the provider authorization URL from backend with approval_prompt=force
  const query = new URLSearchParams({
    redirect_uri: redirectUri,
    scope: 'read,activity:read,activity:read_all',
    approval_prompt: 'force',
  });
  if (customClientId) {
    query.set('client_id', customClientId);
  }

  const res = await fetch(`/api/strava/auth-url?${query.toString()}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to generate Strava authorization URL.');
  }

  const { url } = await res.json();

  // 2. Open Strava Authorization Provider URL directly in popup
  const authWindow = window.open(
    url,
    'strava_oauth_popup',
    'width=600,height=720,status=no,resizable=yes'
  );

  if (!authWindow) {
    throw new Error('Popup blocked by browser. Please allow popups for this site to connect Strava.');
  }

  // 3. Listen for postMessage from the callback window
  return new Promise((resolve, reject) => {
    let resolved = false;

    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const eventOrigin = event.origin;
      if (
        !eventOrigin.endsWith('.run.app') &&
        !eventOrigin.includes('localhost') &&
        !eventOrigin.includes('127.0.0.1')
      ) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.payload) {
        resolved = true;
        window.removeEventListener('message', handleMessage);
        const authData: StravaAuthPayload = event.data.payload;
        saveStoredStravaAuth(authData);
        resolve(authData);
      } else if (event.data?.type === 'STRAVA_CODE_RECEIVED') {
        resolved = true;
        window.removeEventListener('message', handleMessage);
        const code = event.data.code;
        // Exchange code with backend API for full access token and athlete data
        fetch('/api/strava/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            grant_type: 'authorization_code',
            client_id: customClientId,
          }),
        })
          .then(async (tokenRes) => {
            const tokenData = await tokenRes.json();
            if (!tokenRes.ok) {
              throw new Error(tokenData.message || tokenData.error || 'Failed to exchange authorization code');
            }
            const authPayload: StravaAuthPayload = {
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token || '',
              expires_at: tokenData.expires_at || Math.floor(Date.now() / 1000) + 21600,
              athlete: tokenData.athlete,
            };
            saveStoredStravaAuth(authPayload);
            resolve(authPayload);
          })
          .catch((err) => {
            reject(err);
          });
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        resolved = true;
        window.removeEventListener('message', handleMessage);
        reject(new Error(event.data.error || 'Strava authentication was canceled.'));
      }
    };

    window.addEventListener('message', handleMessage);

    // Timeout check if popup is closed by user without authorization
    const checkClosedInterval = setInterval(() => {
      if (authWindow.closed && !resolved) {
        clearInterval(checkClosedInterval);
        window.removeEventListener('message', handleMessage);
        reject(new Error('Strava authorization window was closed.'));
      }
    }, 1000);
  });
}

/**
 * Proactively refreshes an expired Strava session using a refresh token
 */
export async function refreshStravaToken(refreshToken?: string): Promise<StravaAuthPayload> {
  const current = getStoredStravaAuth();
  const tokenCandidate = (refreshToken || current?.refresh_token || current?.access_token || '')
    .replace(/^Bearer\s+/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();

  if (!tokenCandidate) {
    throw new Error('No refresh token available to renew Strava session.');
  }

  const res = await fetch('/api/strava/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: tokenCandidate,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Strava token refresh failed.');
  }

  const updated: StravaAuthPayload = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || tokenCandidate,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + 21600,
    athlete: data.athlete || current?.athlete,
  };
  saveStoredStravaAuth(updated);
  return updated;
}

/**
 * Fetch activities from Strava API via backend proxy with auto-refresh capability
 */
export async function fetchStravaActivities(
  accessToken: string,
  refreshToken?: string,
  page = 1,
  perPage = 100,
  clientId?: string,
  clientSecret?: string
): Promise<StravaActivitySummary[]> {
  const cleanAccessToken = (accessToken || '')
    .replace(/^Bearer\s+/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();

  const cleanRefreshToken = (refreshToken || '')
    .replace(/^Bearer\s+/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();

  const res = await fetch('/api/strava/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: cleanAccessToken,
      refresh_token: cleanRefreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      page,
      per_page: perPage,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg =
      data.message ||
      data.error ||
      'Failed to fetch Strava activities. Token may be expired or lack activity permissions.';

    const err = new Error(errorMsg);
    (err as any).status = res.status;
    (err as any).needsActivityPermission = Boolean(data.needsActivityPermission);
    (err as any).isDeveloperAppLimit = Boolean(data.isDeveloperAppLimit);
    (err as any).details = data.details || [];
    throw err;
  }

  // If the server auto-refreshed our token, update storage and cache
  if (data.refreshed_auth && data.refreshed_auth.access_token) {
    saveStoredStravaAuth(data.refreshed_auth);
  }

  return Array.isArray(data.activities) ? data.activities : [];
}

/**
 * High quality sample activities for instant preview & testing
 */
export const SAMPLE_STRAVA_ACTIVITIES: StravaActivitySummary[] = [
  {
    id: 99101,
    name: 'Haeundae Marine City Coastal 10K',
    distance: 10240,
    moving_time: 3120, // 52 mins
    elapsed_time: 3200,
    total_elevation_gain: 42,
    type: 'Run',
    start_date_local: '2026-04-14T06:45:00Z',
    start_latlng: [35.1587, 129.1603],
    average_speed: 3.28,
    average_heartrate: 152,
    max_heartrate: 168,
    average_cadence: 88,
    location_city: 'Busan',
    description: 'Brisk oceanfront morning run along Dongbaekseom and Haeundae Beach promenade.',
  },
  {
    id: 99102,
    name: 'Geumjeongsan Fortress Ridge Trail Run',
    distance: 12500,
    moving_time: 4800, // 80 mins
    elapsed_time: 5100,
    total_elevation_gain: 580,
    type: 'TrailRun',
    start_date_local: '2026-04-10T07:15:00Z',
    start_latlng: [35.2758, 129.0569],
    average_speed: 2.6,
    average_heartrate: 165,
    max_heartrate: 182,
    average_cadence: 82,
    location_city: 'Busan',
    description: 'Technical mountain trail traverse from South Gate to Godangbong peak.',
  },
  {
    id: 99103,
    name: 'Oncheoncheon Stream Spring Recovery Run',
    distance: 7800,
    moving_time: 2460, // 41 mins
    elapsed_time: 2520,
    total_elevation_gain: 18,
    type: 'Run',
    start_date_local: '2026-04-06T18:30:00Z',
    start_latlng: [35.2078, 129.0883],
    average_speed: 3.17,
    average_heartrate: 144,
    max_heartrate: 158,
    average_cadence: 86,
    location_city: 'Busan',
    description: 'Smooth evening tempo run along the lit riverside track.',
  },
  {
    id: 99104,
    name: 'Gwangalli Diamond Bridge Sunset 8K',
    distance: 8200,
    moving_time: 2580, // 43 mins
    elapsed_time: 2640,
    total_elevation_gain: 25,
    type: 'Run',
    start_date_local: '2026-04-02T18:10:00Z',
    start_latlng: [35.1531, 129.1186],
    average_speed: 3.18,
    average_heartrate: 148,
    max_heartrate: 162,
    average_cadence: 87,
    location_city: 'Busan',
    description: 'Coastline loop with panoramic view of Gwangan Bridge illumination.',
  },
];

/**
 * Normalizes a Strava activity into a PeakPulse RunningLog
 */
export function convertStravaActivityToRunningLog(act: StravaActivitySummary): RunningLog {
  const distanceKm = Number(((act.distance || 0) / 1000).toFixed(2));
  const durationMinutes = Math.max(1, Math.round((act.moving_time || act.elapsed_time || 60) / 60));
  const elevationGainM = Math.round(act.total_elevation_gain || 0);

  // Date parsing: "2026-03-24T06:30:00Z" -> "2026-03-24"
  const rawDate = act.start_date_local || new Date().toISOString();
  const dateStr = rawDate.substring(0, 10);
  const timeStr = rawDate.length >= 16 ? rawDate.substring(11, 16) : undefined;

  // Pace formatting: mm:ss per km
  const pace = formatPace(durationMinutes, distanceKm);

  // Detect route type based on elevation gain and activity type
  let routeType: RunningLog['routeType'] = 'City Loop';
  const typeLower = (act.type || '').toLowerCase();
  if (typeLower.includes('trail') || elevationGainM > 180) {
    routeType = 'Mountain Trail';
  } else if (
    (act.name && act.name.toLowerCase().includes('river')) ||
    (act.name && act.name.toLowerCase().includes('beach')) ||
    (act.name && act.name.toLowerCase().includes('stream'))
  ) {
    routeType = 'Riverfront';
  } else if (
    (act.name && act.name.toLowerCase().includes('park')) ||
    (act.name && act.name.toLowerCase().includes('track'))
  ) {
    routeType = 'Track / Park';
  }

  // Location heuristic
  let locationName = act.location_city || 'Busan / Korea Running Course';
  if (act.start_latlng && act.start_latlng.length === 2) {
    const [lat, lng] = act.start_latlng;
    if (lat >= 35.0 && lat <= 35.4 && lng >= 128.8 && lng <= 129.3) {
      locationName = 'Busan, South Korea';
    } else if (lat >= 37.4 && lat <= 37.7 && lng >= 126.8 && lng <= 127.2) {
      locationName = 'Seoul, South Korea';
    }
  }

  // Coordinates
  const coordinates =
    act.start_latlng && act.start_latlng.length === 2
      ? { lat: Number(act.start_latlng[0].toFixed(4)), lng: Number(act.start_latlng[1].toFixed(4)) }
      : { lat: 35.1796, lng: 129.0756 }; // Busan City Center default

  const cadence = act.average_cadence
    ? Math.round(act.average_cadence * (act.average_cadence < 100 ? 2 : 1))
    : undefined;

  const notes = [
    `Strava Activity: ${act.name}`,
    act.description ? `Notes: ${act.description}` : null,
    act.average_heartrate ? `Avg HR: ${Math.round(act.average_heartrate)} bpm` : null,
    act.max_heartrate ? `Max HR: ${Math.round(act.max_heartrate)} bpm` : null,
    cadence ? `Cadence: ${cadence} spm` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    id: `strava_${act.id}`,
    activityType: 'running',
    title: act.name || 'Strava Run',
    date: dateStr,
    startTime: timeStr,
    distanceKm,
    durationMinutes,
    elevationGainM,
    paceMinPerKm: pace,
    locationName,
    routeType,
    coordinates,
    notes,
    photos: [],
    avgCadence: cadence,
  };
}

/**
 * Parses Strava's exported `activities.csv` file from user's account archive
 */
export function parseStravaCsv(csvText: string): RunningLog[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

  const idIdx = headers.findIndex((h) => h === 'activity id' || h === 'id');
  const dateIdx = headers.findIndex((h) => h === 'activity date' || h === 'date');
  const nameIdx = headers.findIndex((h) => h === 'activity name' || h === 'title' || h === 'name');
  const typeIdx = headers.findIndex((h) => h === 'activity type' || h === 'type');
  const distIdx = headers.findIndex((h) => h === 'distance');
  const movingTimeIdx = headers.findIndex((h) => h === 'moving time' || h === 'elapsed time');
  const elevIdx = headers.findIndex((h) => h === 'elevation gain' || h.includes('elevation'));

  const parsedRuns: RunningLog[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV row parser handling quotes
    const row = parseCsvLine(lines[i]);
    if (row.length <= Math.max(dateIdx, distIdx)) continue;

    const rawType = (typeIdx !== -1 ? row[typeIdx] : 'Run').toLowerCase();
    // Accept runs, walks, hikes, or trails
    if (!rawType.includes('run') && !rawType.includes('walk') && !rawType.includes('hike')) {
      continue;
    }

    const id = idIdx !== -1 && row[idIdx] ? row[idIdx] : `csv_${Date.now()}_${i}`;
    const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : `Strava Run ${i}`;

    // Distance can be in meters (e.g. 10250.5) or km (e.g. 10.25)
    let rawDist = distIdx !== -1 ? parseFloat(row[distIdx]) : 0;
    if (rawDist > 200) {
      rawDist = rawDist / 1000;
    }
    const distanceKm = Number((rawDist || 5).toFixed(2));

    // Time in seconds or minutes
    let rawSeconds = movingTimeIdx !== -1 ? parseFloat(row[movingTimeIdx]) : 1800;
    const durationMinutes = Math.max(1, Math.round(rawSeconds / 60));

    // Elevation gain
    const elevationGainM = elevIdx !== -1 ? Math.round(parseFloat(row[elevIdx]) || 0) : 0;

    // Date
    let dateStr = new Date().toISOString().substring(0, 10);
    if (dateIdx !== -1 && row[dateIdx]) {
      const parsedDate = new Date(row[dateIdx]);
      if (!isNaN(parsedDate.getTime())) {
        dateStr = parsedDate.toISOString().substring(0, 10);
      } else {
        const parts = row[dateIdx].substring(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) dateStr = parts;
      }
    }

    const pace = formatPace(durationMinutes, distanceKm);

    parsedRuns.push({
      id: `strava_${id}`,
      activityType: 'running',
      title: name,
      date: dateStr,
      distanceKm,
      durationMinutes,
      elevationGainM,
      paceMinPerKm: pace,
      locationName: 'Busan / Korea Running Route',
      routeType: elevationGainM > 180 ? 'Mountain Trail' : 'City Loop',
      coordinates: { lat: 35.1796, lng: 129.0756 },
      notes: `Imported from Strava CSV archive: ${name}`,
      photos: [],
    });
  }

  return parsedRuns;
}

/**
 * Parses standard GPX file into a RunningLog with coordinates and distance
 */
export function parseGpxFile(gpxText: string, filename = 'Strava Activity'): RunningLog {
  const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
  const eleRegex = /<ele>([^<]+)<\/ele>/;
  const timeRegex = /<time>([^<]+)<\/time>/;
  const nameRegex = /<name>([^<]+)<\/name>/;

  const titleMatch = gpxText.match(nameRegex);
  const title = titleMatch ? titleMatch[1].trim() : filename.replace(/\.gpx$/i, '');

  const points: { lat: number; lng: number; ele?: number; time?: string }[] = [];
  let match;

  while ((match = trkptRegex.exec(gpxText)) !== null) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    const inner = match[3];

    const eleMatch = inner.match(eleRegex);
    const timeMatch = inner.match(timeRegex);

    points.push({
      lat,
      lng,
      ele: eleMatch ? parseFloat(eleMatch[1]) : undefined,
      time: timeMatch ? timeMatch[1] : undefined,
    });
  }

  if (points.length === 0) {
    throw new Error('No GPS trackpoints found in GPX file.');
  }

  // Calculate distance via Haversine formula
  let totalDistanceM = 0;
  let totalElevGainM = 0;

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    totalDistanceM += haversineDistanceM(p1.lat, p1.lng, p2.lat, p2.lng);

    if (p1.ele !== undefined && p2.ele !== undefined && p2.ele > p1.ele) {
      totalElevGainM += p2.ele - p1.ele;
    }
  }

  const distanceKm = Number((totalDistanceM / 1000).toFixed(2));
  const elevationGainM = Math.round(totalElevGainM);

  // Time & Duration
  let durationMinutes = 30;
  let dateStr = new Date().toISOString().substring(0, 10);
  let startTime: string | undefined;

  const firstPt = points[0];
  const lastPt = points[points.length - 1];

  if (firstPt.time && lastPt?.time) {
    const tStart = new Date(firstPt.time);
    const tEnd = new Date(lastPt.time);
    if (!isNaN(tStart.getTime()) && !isNaN(tEnd.getTime())) {
      dateStr = tStart.toISOString().substring(0, 10);
      startTime = tStart.toTimeString().substring(0, 5);
      const diffSecs = (tEnd.getTime() - tStart.getTime()) / 1000;
      if (diffSecs > 60) {
        durationMinutes = Math.round(diffSecs / 60);
      }
    }
  }

  const pace = formatPace(durationMinutes, distanceKm);
  const startPt = points[0];

  return {
    id: `gpx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    activityType: 'running',
    title,
    date: dateStr,
    startTime,
    distanceKm: Math.max(0.5, distanceKm),
    durationMinutes,
    elevationGainM,
    paceMinPerKm: pace,
    locationName:
      startPt.lat >= 35.0 && startPt.lat <= 35.4 ? 'Busan, South Korea' : 'GPS Trail Track',
    routeType: elevationGainM > 180 ? 'Mountain Trail' : 'City Loop',
    coordinates: {
      lat: Number(startPt.lat.toFixed(4)),
      lng: Number(startPt.lng.toFixed(4)),
    },
    notes: `Imported from GPS track file: ${points.length} trackpoints, ${elevationGainM}m elevation gain.`,
    photos: [],
  };
}

function haversineDistanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}
