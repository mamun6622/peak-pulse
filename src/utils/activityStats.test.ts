import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMountainSummaries,
  calculateMonthlyStats,
  calculatePersonalRecords,
  formatDuration,
  formatPace,
} from './activityStats.ts';
import type { Activity, SummitLog, RunningLog } from '../types/activity.ts';

const mockActivities: Activity[] = [
  {
    id: 's1',
    activityType: 'summit',
    mountainId: 'bukhansan',
    mountainName: 'Bukhansan',
    koreanName: '북한산',
    peakName: 'Baegundae',
    elevationM: 836,
    summitNumber: 1,
    date: '2025-04-10',
    durationMinutes: 240,
    distanceKm: 8.5,
    elevationGainM: 710,
    weather: 'Clear / Sunny',
    companions: 'Solo',
    trailTaken: 'Bukhansanseong Course',
    location: 'Seoul',
    coordinates: { lat: 37.6608, lng: 126.9933 },
    notes: 'First spring summit of Bukhansan Baegundae.',
    photos: [{ id: 'p1', url: '/demo1.jpg', caption: 'At the summit rock' }],
  },
  {
    id: 's2',
    activityType: 'summit',
    mountainId: 'bukhansan',
    mountainName: 'Bukhansan',
    koreanName: '북한산',
    peakName: 'Baegundae',
    elevationM: 836,
    summitNumber: 2,
    date: '2025-05-18',
    durationMinutes: 210,
    distanceKm: 8.2,
    elevationGainM: 710,
    weather: 'Crisp Sunrise',
    companions: 'Friends',
    trailTaken: 'Ui-dong Course',
    location: 'Seoul',
    coordinates: { lat: 37.6608, lng: 126.9933 },
    notes: 'Sunrise hike.',
    photos: [{ id: 'p2', url: '/demo2.jpg', caption: 'Sunrise over Seoul' }],
  },
  {
    id: 's3',
    activityType: 'summit',
    mountainId: 'inwangsan',
    mountainName: 'Inwangsan',
    koreanName: '인왕산',
    peakName: 'Gichabawi',
    elevationM: 338,
    summitNumber: 1,
    date: '2025-05-22',
    durationMinutes: 90,
    distanceKm: 4.5,
    elevationGainM: 280,
    weather: 'Sunset Golden Hour',
    companions: 'Solo',
    trailTaken: 'Seoul City Wall Trail',
    location: 'Seoul',
    coordinates: { lat: 37.5833, lng: 126.9583 },
    notes: 'Evening after work climb.',
    photos: [],
  },
  {
    id: 'r1',
    activityType: 'running',
    title: 'Han River Sunset 10K',
    date: '2025-05-25',
    distanceKm: 10.2,
    durationMinutes: 52,
    elevationGainM: 35,
    paceMinPerKm: '5:06',
    locationName: 'Yeouido Hangang Park',
    routeType: 'Riverfront',
    coordinates: { lat: 37.5284, lng: 126.9328 },
    notes: 'Smooth riverfront tempo run.',
    photos: [],
  },
];

test('calculateMountainSummaries aggregates repeat summits properly and sorts by count descending', () => {
  const summaries = calculateMountainSummaries(mockActivities);
  assert.equal(summaries.length, 2);
  // Bukhansan has 2 summits, Inwangsan has 1
  assert.equal(summaries[0].mountainName, 'Bukhansan');
  assert.equal(summaries[0].totalSummits, 2);
  assert.equal(summaries[0].firstSummitDate, '2025-04-10');
  assert.equal(summaries[0].latestSummitDate, '2025-05-18');
  assert.equal(summaries[0].totalElevationGainedM, 1420);
  assert.equal(summaries[0].photoCount, 2);

  assert.equal(summaries[1].mountainName, 'Inwangsan');
  assert.equal(summaries[1].totalSummits, 1);
});

test('calculateMonthlyStats aggregates by YYYY-MM correctly', () => {
  const monthly = calculateMonthlyStats(mockActivities);
  assert.equal(monthly.length, 2); // 2025-05 and 2025-04

  const may = monthly.find((m) => m.monthKey === '2025-05');
  assert.ok(may);
  // In May 2025: 1 Bukhansan summit (8.2km) + 1 Inwangsan summit (4.5km) + 1 run (10.2km) = 22.9km
  assert.equal(may.totalSummits, 2);
  assert.equal(may.totalRuns, 1);
  assert.equal(may.totalDistanceKm, 22.9);
  assert.equal(may.totalElevationGainM, 710 + 280 + 35);
});

test('calculatePersonalRecords extracts all-time peaks and stats correctly', () => {
  const records = calculatePersonalRecords(mockActivities);
  assert.equal(records.totalSummitsBagged, 3);
  assert.equal(records.totalUniquePeaks, 2);
  assert.equal(records.highestPeakBagged?.name, 'Bukhansan (Baegundae)');
  assert.equal(records.highestPeakBagged?.elevationM, 836);
  assert.equal(records.mostRepeatedMountain?.name, 'Bukhansan');
  assert.equal(records.mostRepeatedMountain?.count, 2);
  assert.equal(records.longestRunKm?.distanceKm, 10.2);
});

test('formatDuration and formatPace output clean string formats', () => {
  assert.equal(formatDuration(90), '1h 30m');
  assert.equal(formatDuration(45), '45m');
  assert.equal(formatDuration(120), '2h');
  assert.equal(formatDuration(0), '0m');

  assert.equal(formatPace(50, 10), '5:00');
  assert.equal(formatPace(52, 10), '5:12');
});
