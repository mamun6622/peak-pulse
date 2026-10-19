import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertStravaActivityToRunningLog,
  parseStravaCsv,
  parseGpxFile,
  SAMPLE_STRAVA_ACTIVITIES,
  StravaActivitySummary,
} from './stravaService';

test('convertStravaActivityToRunningLog transforms Strava payload accurately', () => {
  const stravaSample: StravaActivitySummary = {
    id: 987654321,
    name: 'Morning Haeundae Coast 10K',
    distance: 10250, // 10.25 km
    moving_time: 3000, // 50 mins
    elapsed_time: 3120,
    total_elevation_gain: 125,
    type: 'Run',
    start_date_local: '2026-04-12T06:30:00Z',
    start_latlng: [35.1587, 129.1603],
    average_speed: 3.41,
    average_heartrate: 154,
    max_heartrate: 172,
    average_cadence: 88,
  };

  const runningLog = convertStravaActivityToRunningLog(stravaSample);

  assert.equal(runningLog.id, 'strava_987654321');
  assert.equal(runningLog.activityType, 'running');
  assert.equal(runningLog.title, 'Morning Haeundae Coast 10K');
  assert.equal(runningLog.distanceKm, 10.25);
  assert.equal(runningLog.durationMinutes, 50);
  assert.equal(runningLog.elevationGainM, 125);
  assert.equal(runningLog.date, '2026-04-12');
  assert.equal(runningLog.paceMinPerKm, '4:53');
  assert.equal(runningLog.coordinates.lat, 35.1587);
  assert.equal(runningLog.coordinates.lng, 129.1603);
  assert.equal(runningLog.avgCadence, 176); // converted to spm
  assert.ok(runningLog.notes.includes('154 bpm'));
});

test('parseStravaCsv parses exported activities.csv lines correctly', () => {
  const mockCsv = `Activity ID,Activity Date,Activity Name,Activity Type,Activity Description,Elapsed Time,Distance,Max Heart Rate,Elevation Gain
112233,"2026-03-15 07:15:00","Oncheoncheon Stream 8K Run",Run,"Great weather",2400,8200,165,45
445566,"2026-03-20 06:45:00","Geumjeongsan Trail Run",TrailRun,"Up to South Gate",3600,7500,175,380
999999,"2026-03-22 10:00:00","Casual Bike Ride",Ride,"Sunday ride",7200,30000,140,200`;

  const logs = parseStravaCsv(mockCsv);

  assert.equal(logs.length, 2, 'Should only parse Run and TrailRun, skipping Bike Ride');
  assert.equal(logs[0].title, 'Oncheoncheon Stream 8K Run');
  assert.equal(logs[0].distanceKm, 8.2);
  assert.equal(logs[0].durationMinutes, 40);
  assert.equal(logs[0].date, '2026-03-15');

  assert.equal(logs[1].title, 'Geumjeongsan Trail Run');
  assert.equal(logs[1].distanceKm, 7.5);
  assert.equal(logs[1].elevationGainM, 380);
  assert.equal(logs[1].routeType, 'Mountain Trail');
});

test('parseGpxFile parses GPS trackpoints and computes distance and elevation', () => {
  const mockGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Strava">
  <trk>
    <name>Gwangalli Beach Sunrise Run</name>
    <trkseg>
      <trkpt lat="35.1531" lon="129.1186">
        <ele>5.0</ele>
        <time>2026-05-01T06:00:00Z</time>
      </trkpt>
      <trkpt lat="35.1570" lon="129.1230">
        <ele>12.0</ele>
        <time>2026-05-01T06:05:00Z</time>
      </trkpt>
      <trkpt lat="35.1610" lon="129.1280">
        <ele>20.0</ele>
        <time>2026-05-01T06:12:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

  const log = parseGpxFile(mockGpx, 'test.gpx');

  assert.equal(log.title, 'Gwangalli Beach Sunrise Run');
  assert.ok(log.distanceKm > 0.8 && log.distanceKm < 2.0);
  assert.equal(log.date, '2026-05-01');
  assert.equal(log.elevationGainM, 15);
  assert.equal(log.coordinates.lat, 35.1531);
});

test('SAMPLE_STRAVA_ACTIVITIES provides valid Korean running routes', () => {
  assert.ok(Array.isArray(SAMPLE_STRAVA_ACTIVITIES));
  assert.ok(SAMPLE_STRAVA_ACTIVITIES.length >= 4);

  const convertedSamples = SAMPLE_STRAVA_ACTIVITIES.map(convertStravaActivityToRunningLog);
  assert.equal(convertedSamples.length, SAMPLE_STRAVA_ACTIVITIES.length);
  for (const sample of convertedSamples) {
    assert.equal(sample.activityType, 'running');
    assert.ok(sample.distanceKm > 0);
    assert.ok(sample.durationMinutes > 0);
    assert.ok(sample.paceMinPerKm.includes(':'));
  }
});

