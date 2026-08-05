import test from 'node:test';
import assert from 'node:assert/strict';
import { getEndlessDifficulty } from '../src/config/gameData.js';

test('endless mode starts at campaign-one difficulty and raises its threat tier', () => {
    assert.deepEqual(getEndlessDifficulty(0), {
        tier: 1,
        asteroidSpeed: 105,
        spawnDelay: 1500,
        collisionDamage: 18,
        scorePerSecond: 3,
    });
    assert.equal(getEndlessDifficulty(10).tier, 2);
    assert.equal(getEndlessDifficulty(50).tier, 6);
});

test('endless pressure keeps increasing while its safety bounds hold', () => {
    const veteran = getEndlessDifficulty(100);
    const extreme = getEndlessDifficulty(1000);
    assert.ok(veteran.asteroidSpeed > getEndlessDifficulty(50).asteroidSpeed);
    assert.equal(extreme.tier, 6);
    assert.equal(extreme.asteroidSpeed, 340);
    assert.equal(extreme.spawnDelay, 420);
    assert.equal(extreme.collisionDamage, 34);
});
