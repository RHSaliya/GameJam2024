import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { getWeapon, getWeaponPickupChoices, SKINS, WEAPONS } from '../src/config/gameData.js';

test('every unlockable ship has a unique texture and signature weapon', () => {
    assert.equal(new Set(SKINS.map(ship => ship.texture)).size, SKINS.length);
    assert.equal(new Set(SKINS.map(ship => ship.weaponId)).size, SKINS.length);
    SKINS.forEach(ship => {
        assert.equal(getWeapon(ship.weaponId).id, ship.weaponId);
        assert.ok(existsSync(`public/${ship.texture}`), `${ship.texture} should exist`);
        assert.ok(ship.stats.hull > 0);
        assert.ok(ship.stats.acceleration > 0);
        assert.ok(ship.stats.maxVelocity > 0);
    });
});

test('weapon cores let every ship borrow all other signature attacks', () => {
    SKINS.forEach(ship => {
        const choices = getWeaponPickupChoices(ship.weaponId);
        assert.equal(choices.length, SKINS.length - 1);
        assert.ok(choices.every(weapon => weapon.id !== ship.weaponId));
    });
});

test('signature attacks have distinct firing behavior', () => {
    assert.equal(WEAPONS.pulse.projectiles.length, 1);
    assert.equal(WEAPONS.solar.projectiles.length, 3);
    assert.equal(WEAPONS.phase.projectiles[0].pierce, 2);
    assert.equal(WEAPONS.ion.projectiles.length, 2);
    assert.ok(WEAPONS.ion.cooldownMultiplier < 1);
    assert.ok(WEAPONS.seeker.projectiles[0].homing > 0);
    assert.equal(WEAPONS.seeker.projectiles[0].damage, 2);
});

test('every signature weapon has its own projectile asset', () => {
    const textures = Object.values(WEAPONS).map(weapon => weapon.texture);
    assert.equal(new Set(textures).size, Object.keys(WEAPONS).length);
    textures.forEach(texture => assert.ok(existsSync(`public/${texture}`), `${texture} should exist`));
});
