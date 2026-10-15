import test from 'node:test';
import assert from 'node:assert/strict';
import { OperationType, handleFirestoreError } from './firebase';

test('OperationType enum has correct operations', () => {
  assert.equal(OperationType.CREATE, 'create');
  assert.equal(OperationType.UPDATE, 'update');
  assert.equal(OperationType.DELETE, 'delete');
  assert.equal(OperationType.LIST, 'list');
  assert.equal(OperationType.GET, 'get');
  assert.equal(OperationType.WRITE, 'write');
});

test('handleFirestoreError formats structured error JSON string', () => {
  try {
    handleFirestoreError(new Error('Missing or insufficient permissions'), OperationType.WRITE, 'activities/act_1');
    assert.fail('Expected error to be thrown');
  } catch (err: any) {
    const parsed = JSON.parse(err.message);
    assert.equal(parsed.operationType, 'write');
    assert.equal(parsed.path, 'activities/act_1');
    assert.match(parsed.error, /Missing or insufficient permissions/);
    assert.ok(parsed.authInfo);
  }
});
