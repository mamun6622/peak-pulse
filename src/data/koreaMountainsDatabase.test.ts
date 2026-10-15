import test from 'node:test';
import assert from 'node:assert/strict';
import { KOREA_ALL_MOUNTAINS } from '../data/koreaMountainsDatabase';

test('KOREA_ALL_MOUNTAINS has Busan and other regional mountains', () => {
  const busanMountains = KOREA_ALL_MOUNTAINS.filter((m) => m.province === 'Busan');
  assert.ok(busanMountains.length >= 15, 'Busan should have at least 15 mountains');

  const geumjeongsan = busanMountains.find((m) => m.name === 'Geumjeongsan');
  assert.ok(geumjeongsan, 'Geumjeongsan should exist in Busan');
  assert.equal(geumjeongsan.elevationM, 802);

  const jangsan = busanMountains.find((m) => m.name === 'Jangsan');
  assert.ok(jangsan, 'Jangsan should exist in Busan');

  const seoulMountains = KOREA_ALL_MOUNTAINS.filter((m) => m.province === 'Seoul');
  assert.ok(seoulMountains.length >= 10, 'Seoul should have at least 10 mountains');

  assert.ok(KOREA_ALL_MOUNTAINS.length >= 50, 'Total Korea mountains should be at least 50');
});
