import type { Activity, SummitLog, RunningLog, MountainSummary, MonthlyStats, PersonalRecords } from '../types/activity.ts';

/**
 * Groups summit activities by mountain and compiles repeat counts, dates, and elevation totals.
 * Mountains are sorted by summit count descending (most summited mountain first).
 */
export function calculateMountainSummaries(activities: Activity[]): MountainSummary[] {
  const summits = activities.filter((a): a is SummitLog => a.activityType === 'summit');
  const groupMap = new Map<string, SummitLog[]>();

  for (const summit of summits) {
    const key = summit.mountainName.toLowerCase().trim();
    const existing = groupMap.get(key) || [];
    existing.push(summit);
    groupMap.set(key, existing);
  }

  const summaries: MountainSummary[] = [];

  for (const [, list] of groupMap.entries()) {
    // Sort summits chronologically ascending
    const sortedSummits = [...list].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Dynamically assign summitNumber chronologically by date order
    sortedSummits.forEach((s, idx) => {
      s.summitNumber = idx + 1;
    });

    const ref = sortedSummits[sortedSummits.length - 1]; // latest summit for metadata
    const first = sortedSummits[0];

    const totalDistanceKm = sortedSummits.reduce((acc, s) => acc + (s.distanceKm || 0), 0);
    const totalElevationGainedM = sortedSummits.reduce((acc, s) => acc + (s.elevationGainM || 0), 0);
    const photoCount = sortedSummits.reduce((acc, s) => acc + (s.photos?.length || 0), 0);

    // Pick cover photo: prioritize photo with isCover === true (newest summit takes precedence)
    let coverPhoto: string | undefined;
    const reversedSummits = [...sortedSummits].reverse();
    for (const s of reversedSummits) {
      if (s.photos && s.photos.length > 0) {
        const markedCover = s.photos.find((p) => p.isCover);
        if (markedCover) {
          coverPhoto = markedCover.url;
          break;
        }
      }
    }
    // Fallback: if no photo is marked isCover, use the first photo from the most recent summit
    if (!coverPhoto) {
      for (const s of reversedSummits) {
        if (s.photos && s.photos.length > 0) {
          coverPhoto = s.photos[0].url;
          break;
        }
      }
    }

    summaries.push({
      mountainId: ref.mountainId || ref.mountainName.toLowerCase().replace(/\s+/g, '-'),
      mountainName: ref.mountainName,
      koreanName: ref.koreanName || '',
      peakName: ref.peakName,
      elevationM: ref.elevationM,
      totalSummits: sortedSummits.length,
      firstSummitDate: first.date,
      latestSummitDate: ref.date,
      totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
      totalElevationGainedM: Math.round(totalElevationGainedM),
      coordinates: ref.coordinates || { lat: 37.5, lng: 127.0 },
      region: ref.location || 'South Korea',
      summits: sortedSummits.reverse(), // Reverse to show latest first in detail view
      photoCount,
      coverPhoto,
    });
  }

  // Sort by repeat counts descending, then elevation
  return summaries.sort((a, b) => {
    if (b.totalSummits !== a.totalSummits) {
      return b.totalSummits - a.totalSummits;
    }
    return b.elevationM - a.elevationM;
  });
}

/**
 * Calculates monthly aggregated stats for distances, elevation, summits, and runs.
 * Returns sorted chronologically descending.
 */
export function calculateMonthlyStats(activities: Activity[]): MonthlyStats[] {
  const monthMap = new Map<string, MonthlyStats>();

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (const act of activities) {
    if (!act.date) continue;
    const dateObj = new Date(act.date);
    if (isNaN(dateObj.getTime())) continue;

    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // 1-12
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const label = `${monthNames[month - 1]} ${year}`;

    const existing = monthMap.get(monthKey) || {
      monthKey,
      label,
      year,
      month,
      totalDistanceKm: 0,
      totalElevationGainM: 0,
      totalSummits: 0,
      totalRuns: 0,
      totalDurationMinutes: 0,
      activityCount: 0,
    };

    existing.totalDistanceKm += act.distanceKm || 0;
    existing.totalElevationGainM += act.elevationGainM || 0;
    existing.totalDurationMinutes += act.durationMinutes || 0;
    existing.activityCount += 1;

    if (act.activityType === 'summit') {
      existing.totalSummits += 1;
    } else {
      existing.totalRuns += 1;
    }

    monthMap.set(monthKey, existing);
  }

  const list = Array.from(monthMap.values()).map((m) => ({
    ...m,
    totalDistanceKm: Number(m.totalDistanceKm.toFixed(1)),
    totalElevationGainM: Math.round(m.totalElevationGainM),
  }));

  // Sort descending by monthKey
  return list.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

/**
 * Calculates all-time personal records across summits and running.
 */
export function calculatePersonalRecords(activities: Activity[]): PersonalRecords {
  const summits = activities.filter((a): a is SummitLog => a.activityType === 'summit');
  const runs = activities.filter((a): a is RunningLog => a.activityType === 'running');

  let highestPeakBagged: PersonalRecords['highestPeakBagged'] = null;
  let biggestElevationDayM: PersonalRecords['biggestElevationDayM'] = null;
  let totalElevationClimbedM = 0;

  for (const s of summits) {
    totalElevationClimbedM += s.elevationGainM || 0;
    if (!highestPeakBagged || s.elevationM > highestPeakBagged.elevationM) {
      highestPeakBagged = {
        name: `${s.mountainName} (${s.peakName})`,
        elevationM: s.elevationM,
        date: s.date,
      };
    }

    if (!biggestElevationDayM || (s.elevationGainM || 0) > biggestElevationDayM.elevationGainM) {
      biggestElevationDayM = {
        title: `${s.mountainName} (${s.peakName})`,
        elevationGainM: s.elevationGainM,
        date: s.date,
      };
    }
  }

  for (const r of runs) {
    totalElevationClimbedM += r.elevationGainM || 0;
    if (!biggestElevationDayM || (r.elevationGainM || 0) > biggestElevationDayM.elevationGainM) {
      biggestElevationDayM = {
        title: r.title,
        elevationGainM: r.elevationGainM,
        date: r.date,
      };
    }
  }

  let longestRunKm: PersonalRecords['longestRunKm'] = null;
  let totalRunningKm = 0;

  for (const r of runs) {
    totalRunningKm += r.distanceKm || 0;
    if (!longestRunKm || r.distanceKm > longestRunKm.distanceKm) {
      longestRunKm = {
        title: r.title,
        distanceKm: r.distanceKm,
        date: r.date,
      };
    }
  }

  // Mountain repeat records
  const mountainSummaries = calculateMountainSummaries(activities);
  let mostRepeatedMountain: PersonalRecords['mostRepeatedMountain'] = null;
  if (mountainSummaries.length > 0) {
    const top = mountainSummaries[0];
    mostRepeatedMountain = {
      name: top.mountainName,
      koreanName: top.koreanName,
      count: top.totalSummits,
      elevationM: top.elevationM,
    };
  }

  return {
    highestPeakBagged,
    mostRepeatedMountain,
    longestRunKm,
    biggestElevationDayM,
    totalSummitsBagged: summits.length,
    totalUniquePeaks: mountainSummaries.length,
    totalRunningKm: Number(totalRunningKm.toFixed(1)),
    totalElevationClimbedM: Math.round(totalElevationClimbedM),
  };
}

/**
 * Formats minutes into human-readable hours and minutes (e.g. "3h 45m" or "52m")
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

/**
 * Formats pace in min/km
 */
export function formatPace(durationMinutes: number, distanceKm: number): string {
  if (!distanceKm || distanceKm <= 0 || !durationMinutes) return '0:00';
  const paceTotalMinutes = durationMinutes / distanceKm;
  const minutes = Math.floor(paceTotalMinutes);
  const seconds = Math.round((paceTotalMinutes - minutes) * 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
