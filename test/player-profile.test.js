import test from 'node:test';
import assert from 'node:assert/strict';
import { PlayerProfile, normalizeProfile, sanitizeDisplayName } from '../src/services/PlayerProfile.js';
import { pilotNameKey } from '../src/services/LeaderboardService.js';

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

test('locks a pilot name once and preserves it when progress is reset', () => {
    const profile = new PlayerProfile(new MemoryStorage());
    assert.equal(profile.data.pilotNameLocked, false);
    assert.equal(profile.lockDisplayName('  Nova  Ace! ').displayName, 'Nova Ace');
    assert.equal(profile.data.pilotNameLocked, true);
    assert.equal(profile.data.pilotNameVersion, 1);
    assert.equal(profile.lockDisplayName('Replacement').reason, 'LOCKED');
    profile.reset();
    assert.equal(profile.data.displayName, 'Nova Ace');
    assert.equal(profile.data.pilotNameLocked, true);
});

test('prompts legacy profiles for a permanent name without losing progress', () => {
    const storage = new MemoryStorage();
    storage.setItem('quarrel-profile-v2', JSON.stringify({
        displayName: 'Pilot-4587',
        pilotNameLocked: true,
        credits: 559,
        bestScore: 538,
    }));
    const profile = new PlayerProfile(storage);
    assert.equal(profile.data.displayName, '');
    assert.equal(profile.data.pilotNameLocked, false);
    assert.equal(profile.data.pilotNameVersion, 0);
    assert.equal(profile.data.credits, 559);
    assert.equal(profile.data.bestScore, 538);
});

test('pilot name reservations are case and separator insensitive', () => {
    assert.equal(pilotNameKey('Nova Ace'), 'nova-ace');
    assert.equal(pilotNameKey('nova_ace'), 'nova-ace');
    assert.equal(pilotNameKey('NOVA-ACE'), 'nova-ace');
});

test('migrates the legacy master volume and clamps separate audio levels', () => {
    const defaults = normalizeProfile();
    assert.equal(defaults.settings.masterVolume, 1);
    assert.equal(defaults.settings.musicVolume, 0.55);
    assert.equal(defaults.settings.sfxVolume, 0.75);

    const legacy = normalizeProfile({ settings: { volume: 0.4, vibration: false } });
    assert.equal(legacy.settings.masterVolume, 0.4);
    assert.equal(legacy.settings.musicVolume, 1);
    assert.equal(legacy.settings.sfxVolume, 1);
    assert.equal(legacy.settings.vibration, false);

    const split = normalizeProfile({ settings: { masterVolume: -2, musicVolume: 2, sfxVolume: -1 } });
    assert.equal(split.settings.masterVolume, 0);
    assert.equal(split.settings.musicVolume, 1);
    assert.equal(split.settings.sfxVolume, 0);
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

test('only endless runs are stored in local leaderboard records', () => {
    const profile = new PlayerProfile(new MemoryStorage());
    profile.recordRun({ mode: 'campaign', victory: true, score: 900, kills: 8, seconds: 30, levelId: 1 });
    profile.recordRun({ mode: 'endless', victory: false, score: 600, kills: 12, seconds: 45, threat: 2, levelId: 1 });
    assert.equal(profile.data.bestScore, 900);
    assert.equal(profile.data.endlessBestScore, 600);
    assert.equal(profile.data.endlessScores.length, 1);
    assert.equal(profile.data.endlessScores[0].mode, 'endless');
    assert.equal(profile.data.endlessScores[0].threat, 2);
});
