import test from 'node:test';
import assert from 'node:assert';
import { calculateMountainSummaries } from './activityStats';
import { SummitLog } from '../types/activity';

test('calculateMountainSummaries selects explicitly marked isCover photo from newest summit', () => {
  const summits: SummitLog[] = [
    {
      id: 'summit-1',
      activityType: 'summit',
      mountainId: 'bukhansan',
      mountainName: 'Bukhansan',
      koreanName: '북한산',
      peakName: 'Baegundae',
      elevationM: 836,
      summitNumber: 1,
      date: '2025-01-01',
      durationMinutes: 180,
      distanceKm: 8,
      elevationGainM: 700,
      weather: 'Clear / Sunny',
      companions: 'Solo',
      trailTaken: 'Main Trail',
      location: 'Seoul',
      coordinates: { lat: 37.6, lng: 126.9 },
      notes: 'Initial summit',
      photos: [
        { id: 'p1', url: 'https://example.com/old_photo.jpg', caption: 'Old photo', isCover: true },
      ],
    },
    {
      id: 'summit-2',
      activityType: 'summit',
      mountainId: 'bukhansan',
      mountainName: 'Bukhansan',
      koreanName: '북한산',
      peakName: 'Baegundae',
      elevationM: 836,
      summitNumber: 2,
      date: '2026-05-01',
      durationMinutes: 200,
      distanceKm: 9,
      elevationGainM: 720,
      weather: 'Clear / Sunny',
      companions: 'Solo',
      trailTaken: 'Ridge Trail',
      location: 'Seoul',
      coordinates: { lat: 37.6, lng: 126.9 },
      notes: 'Recent summit with new cover',
      photos: [
        { id: 'p2', url: 'https://example.com/new_cover.jpg', caption: 'New cover photo', isCover: true },
        { id: 'p3', url: 'https://example.com/secondary.jpg', caption: 'Secondary photo', isCover: false },
      ],
    },
  ];

  const summaries = calculateMountainSummaries(summits);
  assert.strictEqual(summaries.length, 1);
  assert.strictEqual(summaries[0].coverPhoto, 'https://example.com/new_cover.jpg');
});
