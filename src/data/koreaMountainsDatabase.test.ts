import test from 'node:test';
import assert from 'node:assert/strict';
import { KOREA_ALL_MOUNTAINS } from '../data/koreaMountainsDatabase';

test('KOREA_ALL_MOUNTAINS has extensive Busan small and large mountains', () => {
  const busanMountains = KOREA_ALL_MOUNTAINS.filter((m) => m.province === 'Busan');
  assert.ok(busanMountains.length >= 40, `Busan should have at least 40 mountains, found ${busanMountains.length}`);

  // Prominent Busan summits
  const geumjeongsan = busanMountains.find((m) => m.name === 'Geumjeongsan');
  assert.ok(geumjeongsan, 'Geumjeongsan should exist in Busan');
  assert.equal(geumjeongsan.elevationM, 802);

  const jangsan = busanMountains.find((m) => m.name === 'Jangsan');
  assert.ok(jangsan, 'Jangsan should exist in Busan');
  assert.equal(jangsan.elevationM, 634);

  const baegyangsan = busanMountains.find((m) => m.name === 'Baegyangsan');
  assert.ok(baegyangsan, 'Baegyangsan should exist in Busan');
  assert.equal(baegyangsan.elevationM, 642);

  const dalumsan = busanMountains.find((m) => m.name === 'Dalumsan');
  assert.ok(dalumsan, 'Dalumsan should exist in Busan');
  assert.equal(dalumsan.elevationM, 587);

  // Small Busan hills & coastal landmarks
  const amisan = busanMountains.find((m) => m.name === 'Amisan');
  assert.ok(amisan, 'Amisan should exist in Busan');
  assert.equal(amisan.elevationM, 220);

  const yongdusan = busanMountains.find((m) => m.name === 'Yongdusan');
  assert.ok(yongdusan, 'Yongdusan should exist in Busan');
  assert.equal(yongdusan.elevationM, 49);

  const dongbaekseom = busanMountains.find((m) => m.name === 'Dongbaekseom Island Peak');
  assert.ok(dongbaekseom, 'Dongbaekseom should exist in Busan');
  assert.equal(dongbaekseom.elevationM, 53);

  const amnamsan = busanMountains.find((m) => m.name === 'Amnamsan');
  assert.ok(amnamsan, 'Amnamsan should exist in Busan');
  assert.equal(amnamsan.elevationM, 149);
});

test('KOREA_ALL_MOUNTAINS has nationwide coverage across all provinces', () => {
  const seoulMountains = KOREA_ALL_MOUNTAINS.filter((m) => m.province === 'Seoul');
  assert.ok(seoulMountains.length >= 15, `Seoul should have at least 15 mountains, found ${seoulMountains.length}`);

  const gangwonMountains = KOREA_ALL_MOUNTAINS.filter((m) => m.province === 'Gangwon');
  assert.ok(gangwonMountains.length >= 10, 'Gangwon should have at least 10 mountains');

  const jejuMountains = KOREA_ALL_MOUNTAINS.filter((m) => m.province === 'Jeju');
  assert.ok(jejuMountains.length >= 8, 'Jeju should have at least 8 mountains/oreums');

  assert.ok(KOREA_ALL_MOUNTAINS.length >= 120, `Total Korea mountains should be at least 120, found ${KOREA_ALL_MOUNTAINS.length}`);
});

test('KOREA_ALL_MOUNTAINS has unique IDs and valid coordinates', () => {
  const ids = new Set<string>();
  for (const m of KOREA_ALL_MOUNTAINS) {
    assert.ok(!ids.has(m.id), `Duplicate mountain ID found: ${m.id}`);
    ids.add(m.id);

    assert.ok(m.elevationM > 0, `Mountain ${m.id} must have positive elevation`);
    assert.ok(m.coordinates.lat >= 33.0 && m.coordinates.lat <= 38.6, `Mountain ${m.id} lat out of bounds: ${m.coordinates.lat}`);
    assert.ok(m.coordinates.lng >= 126.0 && m.coordinates.lng <= 131.0, `Mountain ${m.id} lng out of bounds: ${m.coordinates.lng}`);
  }
});
