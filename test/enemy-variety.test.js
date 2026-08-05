import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
    ASTRONAUT_VARIANTS, chooseEnemyType, ENEMY_TYPES, getAstronautVariant, getEnemyWaveSize,
} from '../src/config/gameData.js';

test('every enemy class has unique production art and valid combat rewards', () => {
    const enemies = Object.values(ENEMY_TYPES);
    assert.equal(enemies.length, 6);
    assert.equal(new Set(enemies.map(enemy => enemy.texturePath)).size, enemies.length);
    enemies.forEach(enemy => {
        assert.ok(existsSync(`public/${enemy.texturePath}`), `${enemy.texturePath} should exist`);
        assert.ok(enemy.hp > 0);
        assert.ok(enemy.score > 0);
    });
});

test('enemy variety expands with threat tier and later waves can be scattered', () => {
    const openingTypes = new Set(Array.from({ length: 20 }, (_, index) => chooseEnemyType(1, () => index / 20)));
    assert.deepEqual([...openingTypes].sort(), ['drifter', 'striker', 'swarmer']);
    assert.equal(chooseEnemyType(6, () => 0.999), 'juggernaut');
    assert.equal(getEnemyWaveSize(1, () => 0), 1);
    assert.equal(getEnemyWaveSize(3, () => 0.2), 2);
    assert.equal(getEnemyWaveSize(6, () => 0.1), 3);
});

test('astronaut variants use unique art and always award rescue points', () => {
    assert.equal(ASTRONAUT_VARIANTS.length, 4);
    assert.equal(new Set(ASTRONAUT_VARIANTS.map(astronaut => astronaut.texturePath)).size, 4);
    ASTRONAUT_VARIANTS.forEach(astronaut => {
        assert.ok(existsSync(`public/${astronaut.texturePath}`), `${astronaut.texturePath} should exist`);
        assert.ok(astronaut.score >= 175);
    });
    assert.equal(getAstronautVariant(() => 0).role, 'PILOT');
    assert.equal(getAstronautVariant(() => 0.999).role, 'MEDIC');
});
