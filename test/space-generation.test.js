import test from 'node:test';
import assert from 'node:assert/strict';
import { generateEdgeSpawn } from '../src/services/SpaceGenerator.js';

test('space objects spawn outside the visible playfield', () => {
    let state = 17;
    const random = () => {
        state = (state * 48271) % 0x7fffffff;
        return state / 0x7fffffff;
    };

    for (let index = 0; index < 100; index += 1) {
        const spawn = generateEdgeSpawn({ width: 1280, height: 600, padding: 100, random });
        assert.ok(spawn.x <= -85 || spawn.x >= 1365 || spawn.y <= -85 || spawn.y >= 685);
        assert.ok(spawn.targetX >= 0 && spawn.targetX <= 1280);
        assert.ok(spawn.targetY >= 0 && spawn.targetY <= 600);
    }
});

test('space generation favors the direction of travel at speed', () => {
    const spawn = generateEdgeSpawn({
        width: 1280,
        height: 600,
        travelVelocity: { x: 300, y: 0 },
        random: () => 0.5,
    });
    assert.equal(spawn.biased, true);
    assert.ok(spawn.x > 1280);
    assert.equal(spawn.targetX, 640);
    assert.equal(spawn.targetY, 300);
});

test('space generation can stay outside a tablet camera while targeting the centered ship', () => {
    const spawn = generateEdgeSpawn({
        width: 1280,
        height: 960,
        centerX: 640,
        centerY: 300,
        padding: 100,
        random: () => 0.5,
    });
    assert.ok(spawn.x <= -100 || spawn.x >= 1380 || spawn.y <= -280 || spawn.y >= 880);
    assert.equal(spawn.targetX, 640);
    assert.equal(spawn.targetY, 300);
});
