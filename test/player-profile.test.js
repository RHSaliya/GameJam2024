import test from 'node:test';
import assert from 'node:assert/strict';
import { PlayerProfile, normalizeProfile, sanitizeDisplayName } from '../src/services/PlayerProfile.js';

class MemoryStorage {
    constructor() { this.values = new Map(); }
    getItem(key) { return this.values.get(key) ?? null; }
    setItem(key, value) { this.values.set(key, value); }
}

test('normalizes corrupted progression without losing valid unlocks', () => {
    const profile = normalizeProfile({
        credits: -9,
        unlockedLevel: 99,
        completedLevels: [1, 1, 9],
        upgrades: { hull: 20, engine: -2 },
        unlockedSkins: ['classic', 'missing'],
    });
    assert.equal(profile.credits, 0);
    assert.equal(profile.unlockedLevel, 6);
    assert.deepEqual(profile.completedLevels, [1]);
    assert.equal(profile.upgrades.hull, 4);
    assert.equal(profile.upgrades.engine, 0);
    assert.deepEqual(profile.unlockedSkins, ['classic']);
});

test('sanitizes public leaderboard names', () => {
    assert.equal(sanitizeDisplayName('  Ace<script>🚀  '), 'Acescript');
    assert.equal(sanitizeDisplayName('!@#$'), 'Anonymous Pilot');
    assert.equal(sanitizeDisplayName('A very very very long pilot name').length, 18);
});

test('a first victory rewards credits, achievements, and the next mission', () => {
    const profile = new PlayerProfile(new MemoryStorage());
    const result = profile.recordRun({ victory: true, score: 400, kills: 8, seconds: 32, levelId: 1 });
    assert.equal(result.firstCompletion, true);
    assert.equal(result.creditsEarned, 194);
    assert.equal(profile.data.unlockedLevel, 2);
    assert.deepEqual(profile.data.completedLevels, [1]);
    assert.ok(profile.data.achievements.includes('first_blood'));
    assert.ok(profile.data.achievements.includes('mission_ready'));
    assert.equal(profile.data.credits, 319);
});

test('upgrades and skins require credits and apply permanent effects', () => {
    const profile = new PlayerProfile(new MemoryStorage());
    assert.equal(profile.buyUpgrade('hull').reason, 'CREDITS');
    profile.data.credits = 1000;
    assert.equal(profile.buyUpgrade('hull').ok, true);
    assert.equal(profile.getUpgradeEffects().maxHealth, 120);
    assert.equal(profile.buyOrSelectSkin('solar').ok, true);
    assert.equal(profile.data.selectedSkin, 'solar');
    assert.ok(profile.data.unlockedSkins.includes('solar'));
});

test('collected mission coins are banked into the persistent economy', () => {
    const profile = new PlayerProfile(new MemoryStorage());
    const result = profile.recordRun({ victory: false, score: 0, kills: 0, coins: 17, seconds: 8, levelId: 1 });
    assert.equal(result.creditsEarned, 17);
    assert.equal(profile.data.credits, 17);
    assert.equal(profile.data.totalCoins, 17);
});
