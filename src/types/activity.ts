export type ActivityType = 'summit' | 'running';

export interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  isCover?: boolean;
}

export interface SummitLog {
  id: string;
  activityType: 'summit';
  mountainId: string;
  mountainName: string;
  koreanName: string;
  peakName: string;
  elevationM: number;
  summitNumber: number; // e.g. 14th summit of Bukhansan
  date: string; // ISO format: YYYY-MM-DD
  startTime?: string;
  durationMinutes: number;
  distanceKm: number;
  elevationGainM: number;
  weather: 'Clear / Sunny' | 'Crisp Sunrise' | 'Autumn Foliage' | 'Winter Snow / Ice' | 'Misty / Foggy' | 'Sunset Golden Hour';
  companions: 'Solo' | 'Hiking Club' | 'Friends';
  trailTaken: string;
  location: string;
  coordinates: { lat: number; lng: number };
  notes: string;
  photos: PhotoItem[];
}

export interface RunningLog {
  id: string;
  activityType: 'running';
  title: string;
  date: string; // ISO format: YYYY-MM-DD
  startTime?: string;
  distanceKm: number;
  durationMinutes: number;
  elevationGainM: number;
  paceMinPerKm: string; // e.g. "5:12"
  locationName: string;
  routeType: 'Riverfront' | 'Mountain Trail' | 'City Loop' | 'Track / Park';
  shoes?: string;
  coordinates: { lat: number; lng: number };
  notes: string;
  photos: PhotoItem[];
  avgCadence?: number;
}

export type Activity = SummitLog | RunningLog;

export interface MountainSummary {
  mountainId: string;
  mountainName: string;
  koreanName: string;
  peakName: string;
  elevationM: number;
  totalSummits: number;
  firstSummitDate: string;
  latestSummitDate: string;
  totalDistanceKm: number;
  totalElevationGainedM: number;
  coordinates: { lat: number; lng: number };
  region: string;
  summits: SummitLog[];
  photoCount: number;
  coverPhoto?: string;
}

export interface MonthlyStats {
  monthKey: string; // "2026-03"
  label: string; // "Mar 2026"
  year: number;
  month: number;
  totalDistanceKm: number;
  totalElevationGainM: number;
  totalSummits: number;
  totalRuns: number;
  totalDurationMinutes: number;
  activityCount: number;
}

export interface PersonalRecords {
  highestPeakBagged: { name: string; elevationM: number; date: string } | null;
  mostRepeatedMountain: { name: string; koreanName: string; count: number; elevationM: number } | null;
  longestRunKm: { title: string; distanceKm: number; date: string } | null;
  biggestElevationDayM: { title: string; elevationGainM: number; date: string } | null;
  totalSummitsBagged: number;
  totalUniquePeaks: number;
  totalRunningKm: number;
  totalElevationClimbedM: number;
}
