import test from 'node:test';
import assert from 'node:assert/strict';
import { versionCodeFromName } from '../scripts/sync-native-version.mjs';

test('version codes are derived from semver and increase monotonically', () => {
    assert.equal(versionCodeFromName('1.0.0'), 10000);
    assert.equal(versionCodeFromName('2.0.0'), 20000);
    assert.equal(versionCodeFromName('2.1.0'), 20100);
    assert.equal(versionCodeFromName('2.1.7'), 20107);
    assert.ok(versionCodeFromName('2.0.0') > versionCodeFromName('1.99.99'));
    assert.ok(versionCodeFromName('2.0.1') > versionCodeFromName('2.0.0'));
});

test('the derived code always clears the checked-in Android versionCode of 1', () => {
    assert.ok(versionCodeFromName('0.0.1') > 1);
});

test('malformed versions fall back to a valid positive code', () => {
    assert.equal(versionCodeFromName(''), 1);
    assert.equal(versionCodeFromName('not-a-version'), 1);
    assert.equal(versionCodeFromName('3'), 30000);
    assert.equal(versionCodeFromName('3.2'), 30200);
});

test('version segments are clamped so a large patch cannot overflow into minor', () => {
    assert.equal(versionCodeFromName('1.0.150'), 10099);
    assert.equal(versionCodeFromName('1.150.0'), 19900);
});
