import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyAdminPasskey, updateAdminPasskey, getAdminPasskey } from './authService.ts';

test('verifyAdminPasskey checks against initial default passkey and handles empty', () => {
  assert.equal(verifyAdminPasskey('wrong_passkey'), false);
  assert.equal(verifyAdminPasskey(''), false);
  assert.equal(verifyAdminPasskey('admin2026'), true);
  assert.equal(verifyAdminPasskey('mamun2026'), true);
});

test('updateAdminPasskey enforces minimum length of 4 characters', () => {
  assert.equal(updateAdminPasskey('12'), false);
  assert.equal(updateAdminPasskey(''), false);
});
