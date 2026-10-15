import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateProgression } from './progressionSystem.ts';
import type { Activity, SummitLog, RunningLog } from '../types/activity.ts';

test('calculateProgression starts at Level 1 for 0 activities', () => {
  const stats = calculateProgression([]);
  assert.equal(stats.currentLevel, 1);
  assert.equal(stats.levelTitle, 'Trail Scout');
  assert.equal(stats.currentExp, 0);
  assert.equal(stats.unlockedBadgesCount, 0);
});

test('calculateProgression calculates XP and unlocks 10+ repeat badge when peak has 10 ascents', () => {
  const activities: Activity[] = [];

  // Add 10 summits of Bukhansan (700m elevation gain each)
  for (let i = 1; i <= 10; i++) {
    activities.push({
      id: `buk-${i}`,
      activityType: 'summit',
      mountainId: 'bukhansan',
      mountainName: 'Bukhansan',
      koreanName: '북한산',
      peakName: 'Baegundae',
      elevationM: 836,
      summitNumber: i,
      date: `2025-0${(i % 9) + 1}-10`,
      durationMinutes: 180,
      distanceKm: 8,
      elevationGainM: 700,
      weather: i === 1 ? 'Crisp Sunrise' : i === 2 ? 'Winter Snow / Ice' : 'Clear / Sunny',
      companions: 'Solo',
      trailTaken: 'Course',
      location: 'Seoul',
      coordinates: { lat: 37.6, lng: 126.9 },
      notes: 'Ascent',
      photos: [],
    } as SummitLog);
  }

  const stats = calculateProgression(activities);
  // Total elevation: 10 * 700 = 7000
  // Summit bonus: 10 * 150 = 1500
  // Repeat 10 bonus: 1500
  // Repeat 5 bonus: 0 (subsumed or separate: 1500)
  // Total XP = 7000 + 1500 + 1500 = 10,000 XP -> Level 3 Peak Conqueror
  assert.equal(stats.currentLevel, 3);
  assert.equal(stats.levelTitle, 'Peak Conqueror');
  assert.equal(stats.totalSummits, 10);
  assert.equal(stats.totalRepeatsOnTopMountain, 10);

  // Check badges
  const tenBadge = stats.badges.find((b) => b.id === 'ten-repeats');
  assert.ok(tenBadge?.unlocked);

  const winterBadge = stats.badges.find((b) => b.id === 'winter-snow');
  assert.ok(winterBadge?.unlocked);
});
