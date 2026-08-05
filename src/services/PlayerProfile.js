import { ACHIEVEMENTS, LEVELS, SKINS, UPGRADES } from '../config/gameData.js';

const STORAGE_KEY = 'quarrel-profile-v2';

export function createDefaultProfile() {
    return {
        version: 2,
        displayName: '',
        pilotNameLocked: false,
        pilotNameVersion: 0,
        credits: 0,
        bestScore: 0,
        endlessBestScore: 0,
        totalScore: 0,
        totalKills: 0,
        totalCoins: 0,
        totalRuns: 0,
        longestRun: 0,
        completedLevels: [],
        unlockedLevel: 1,
        upgrades: { hull: 0, engine: 0, blaster: 0, shield: 0 },
        unlockedSkins: ['classic'],
        selectedSkin: 'classic',
        achievements: [],
        localScores: [],
        endlessScores: [],
        settings: {
            masterVolume: 1,
            musicVolume: 0.55,
            sfxVolume: 0.75,
            vibration: true,
            autoFire: false,
            aimAssist: true,
            touchMode: 'joystick',
        },
    };
}

export function normalizeProfile(value = {}) {
    const defaults = createDefaultProfile();
    const pilotNameLocked = Boolean(value.pilotNameLocked);
    const savedSettings = value.settings || {};
    const hasLegacyVolume = savedSettings.volume !== undefined && Number.isFinite(Number(savedSettings.volume));
    const legacyVolume = hasLegacyVolume ? clampVolume(savedSettings.volume, defaults.settings.sfxVolume) : undefined;
    const completedLevels = Array.isArray(value.completedLevels)
        ? value.completedLevels.filter(id => LEVELS.some(level => level.id === Number(id))).map(Number)
        : [];
    const unlockedSkins = Array.isArray(value.unlockedSkins)
        ? value.unlockedSkins.filter(id => SKINS.some(skin => skin.id === id))
        : ['classic'];
    const endlessScores = Array.isArray(value.endlessScores)
        ? value.endlessScores
            .filter(item => item?.mode === 'endless')
            .map(item => ({
                mode: 'endless',
                name: sanitizeDisplayName(item.name),
                score: Math.max(0, Math.floor(Number(item.score) || 0)),
                threat: Math.min(6, Math.max(1, Math.floor(Number(item.threat) || 1))),
                at: Math.max(0, Number(item.at) || 0),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
        : [];
    if (!unlockedSkins.includes('classic')) unlockedSkins.unshift('classic');

    return {
        ...defaults,
        ...value,
        version: 2,
        displayName: pilotNameLocked ? sanitizeDisplayName(value.displayName) : '',
        pilotNameLocked,
        pilotNameVersion: Number(value.pilotNameVersion) === 1 ? 1 : 0,
        credits: Math.max(0, Math.floor(Number(value.credits) || 0)),
        completedLevels: [...new Set(completedLevels)],
        unlockedLevel: Math.min(LEVELS.length, Math.max(1, Math.floor(Number(value.unlockedLevel) || 1))),
        upgrades: Object.fromEntries(Object.keys(UPGRADES).map(key => [key, Math.min(4, Math.max(0, Math.floor(Number(value.upgrades?.[key]) || 0)))])),
        unlockedSkins: [...new Set(unlockedSkins)],
        selectedSkin: unlockedSkins.includes(value.selectedSkin) ? value.selectedSkin : 'classic',
        achievements: Array.isArray(value.achievements) ? [...new Set(value.achievements)] : [],
        localScores: Array.isArray(value.localScores) ? value.localScores.slice(0, 10) : [],
        endlessBestScore: Math.max(
            0,
            Math.floor(Number(value.endlessBestScore) || 0),
            ...endlessScores.map(item => item.score),
        ),
        endlessScores,
        settings: {
            masterVolume: clampVolume(savedSettings.masterVolume, legacyVolume ?? defaults.settings.masterVolume),
            musicVolume: clampVolume(savedSettings.musicVolume, hasLegacyVolume ? 1 : defaults.settings.musicVolume),
            sfxVolume: clampVolume(savedSettings.sfxVolume, hasLegacyVolume ? 1 : defaults.settings.sfxVolume),
            vibration: savedSettings.vibration ?? defaults.settings.vibration,
            autoFire: savedSettings.autoFire ?? defaults.settings.autoFire,
            aimAssist: savedSettings.aimAssist ?? defaults.settings.aimAssist,
            touchMode: ['joystick', 'buttons'].includes(savedSettings.touchMode) ? savedSettings.touchMode : defaults.settings.touchMode,
        },
    };
}

function clampVolume(value, fallback) {
    const volume = Number(value);
    return Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : fallback;
}

export function sanitizeDisplayName(name) {
    const cleaned = cleanDisplayName(name);
    return cleaned || 'Anonymous Pilot';
}

export function cleanDisplayName(name) {
    return String(name).replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, ' ').slice(0, 18);
}

export class PlayerProfile {
    constructor(storage = typeof window !== 'undefined' ? window.localStorage : undefined) {
        this.storage = storage;
        this.data = this.load();
    }

    load() {
        try {
            const saved = this.storage?.getItem(STORAGE_KEY);
            if (saved) {
                const value = JSON.parse(saved);
                // Profiles from the editable-name release must choose their
                // permanent unique name once without losing any progress.
                if (Number(value.pilotNameVersion) !== 1) value.pilotNameLocked = false;
                return normalizeProfile(value);
            }
            const legacyScore = Math.max(0, Math.floor(Number(this.storage?.getItem('maxScore')) || 0));
            return normalizeProfile(legacyScore ? { bestScore: legacyScore } : undefined);
        } catch {
            return createDefaultProfile();
        }
    }

    save() {
        this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.data));
        return this.data;
    }

    lockDisplayName(name) {
        if (this.data.pilotNameLocked) return { ok: false, reason: 'LOCKED' };
        const displayName = cleanDisplayName(name);
        if (displayName.length < 3) return { ok: false, reason: 'INVALID' };
        this.data.displayName = displayName;
        this.data.pilotNameLocked = true;
        this.data.pilotNameVersion = 1;
        this.save();
        return { ok: true, displayName };
    }

    getUpgradeEffects() {
        const { hull, engine, blaster, shield } = this.data.upgrades;
        return {
            maxHealth: 100 + hull * 20,
            acceleration: 560 + engine * 70,
            maxVelocity: 500 + engine * 25,
            startingAmmo: 45 + blaster * 10,
            fireCooldown: Math.max(65, 125 - blaster * 15),
            collisionReduction: shield * 3,
        };
    }

    buyUpgrade(key) {
        const definition = UPGRADES[key];
        const rank = this.data.upgrades[key];
        if (!definition || rank >= definition.costs.length) return { ok: false, reason: 'MAX' };
        const cost = definition.costs[rank];
        if (this.data.credits < cost) return { ok: false, reason: 'CREDITS', cost };
        this.data.credits -= cost;
        this.data.upgrades[key] += 1;
        const unlocked = this.checkAchievements();
        this.save();
        return { ok: true, cost, unlocked };
    }

    buyOrSelectSkin(id) {
        const skin = SKINS.find(item => item.id === id);
        if (!skin) return { ok: false, reason: 'UNKNOWN' };
        if (!this.data.unlockedSkins.includes(id)) {
            if (this.data.credits < skin.price) return { ok: false, reason: 'CREDITS', cost: skin.price };
            this.data.credits -= skin.price;
            this.data.unlockedSkins.push(id);
        }
        this.data.selectedSkin = id;
        const unlocked = this.checkAchievements();
        this.save();
        return { ok: true, unlocked };
    }

    recordRun(run) {
        const score = Math.max(0, Math.floor(Number(run.score) || 0));
        const kills = Math.max(0, Math.floor(Number(run.kills) || 0));
        const seconds = Math.max(0, Math.floor(Number(run.seconds) || 0));
        const coins = Math.max(0, Math.floor(Number(run.coins) || 0));
        const levelId = Math.min(LEVELS.length, Math.max(1, Math.floor(Number(run.levelId) || 1)));
        const mode = run.mode === 'endless' ? 'endless' : 'campaign';
        const campaignVictory = mode === 'campaign' && Boolean(run.victory);
        const threat = Math.min(6, Math.max(1, Math.floor(Number(run.threat) || 1)));
        const level = LEVELS[levelId - 1];
        const firstCompletion = campaignVictory && !this.data.completedLevels.includes(levelId);
        const creditsEarned = coins + Math.floor(score / 8) + kills * 3 + (firstCompletion ? level.reward : campaignVictory ? Math.floor(level.reward * 0.25) : 0);

        this.data.credits += creditsEarned;
        this.data.bestScore = Math.max(this.data.bestScore, score);
        if (mode === 'endless') this.data.endlessBestScore = Math.max(this.data.endlessBestScore, score);
        this.data.totalScore += score;
        this.data.totalKills += kills;
        this.data.totalCoins += coins;
        this.data.totalRuns += 1;
        this.data.longestRun = Math.max(this.data.longestRun, seconds);
        if (campaignVictory) {
            this.data.completedLevels.push(levelId);
            this.data.completedLevels = [...new Set(this.data.completedLevels)];
            this.data.unlockedLevel = Math.min(LEVELS.length, Math.max(this.data.unlockedLevel, levelId + 1));
        }
        if (mode === 'endless') {
            this.data.endlessScores.unshift({ mode, name: this.data.displayName, score, threat, at: Date.now() });
            this.data.endlessScores.sort((a, b) => b.score - a.score);
            this.data.endlessScores = this.data.endlessScores.slice(0, 10);
        }
        const unlocked = this.checkAchievements();
        this.save();
        return { creditsEarned, firstCompletion, unlocked };
    }

    checkAchievements() {
        const unlocked = [];
        for (const achievement of ACHIEVEMENTS) {
            if (!this.data.achievements.includes(achievement.id) && achievement.test(this.data)) {
                this.data.achievements.push(achievement.id);
                this.data.credits += achievement.reward;
                unlocked.push(achievement);
            }
        }
        return unlocked;
    }

    reset() {
        const { displayName, pilotNameLocked, pilotNameVersion, settings } = this.data;
        this.data = { ...createDefaultProfile(), displayName, pilotNameLocked, pilotNameVersion, settings };
        return this.save();
    }
}

export const playerProfile = new PlayerProfile();
