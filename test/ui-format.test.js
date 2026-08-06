import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNumber, formatTime } from '../src/ui/format.js';

test('numbers are grouped and never negative', () => {
    assert.equal(formatNumber(1240), '1,240');
    assert.equal(formatNumber(0), '0');
    assert.equal(formatNumber(-50), '0');
    assert.equal(formatNumber('not-a-number'), '0');
    assert.equal(formatNumber(undefined), '0');
});

test('times render as minutes and padded seconds', () => {
    assert.equal(formatTime(0), '0:00');
    assert.equal(formatTime(9), '0:09');
    assert.equal(formatTime(65), '1:05');
    assert.equal(formatTime(155), '2:35');
    assert.equal(formatTime(3600), '60:00');
});

test('malformed durations degrade to zero rather than NaN', () => {
    assert.equal(formatTime(-12), '0:00');
    assert.equal(formatTime('abc'), '0:00');
    assert.equal(formatTime(undefined), '0:00');
});
