import { ACHIEVEMENTS, LEVELS, SKINS, UPGRADES } from '../config/gameData.js';

const STORAGE_KEY = 'quarrel-profile-v2';

export function createDefaultProfile() {
    return {
        version: 2,
        displayName: `Pilot-${Math.floor(1000 + Math.random() * 9000)}`,
        credits: 0,
        bestScore: 0,
        totalScore: 0,
        totalKills: 0,
        totalRuns: 0,
        longestRun: 0,
        completedLevels: [],
        unlockedLevel: 1,
        upgrades: { hull: 0, engine: 0, blaster: 0, shield: 0 },
        unlockedSkins: ['classic'],
        selectedSkin: 'classic',
        achievements: [],
        localScores: [],
        settings: { volume: 0.65, vibration: true },
    };
}

export function normalizeProfile(value = {}) {
    const defaults = createDefaultProfile();
    const completedLevels = Array.isArray(value.completedLevels)
        ? value.completedLevels.filter(id => LEVELS.some(level => level.id === Number(id))).map(Number)
        : [];
    const unlockedSkins = Array.isArray(value.unlockedSkins)
        ? value.unlockedSkins.filter(id => SKINS.some(skin => skin.id === id))
        : ['classic'];
    if (!unlockedSkins.includes('classic')) unlockedSkins.unshift('classic');

    return {
        ...defaults,
        ...value,
        version: 2,
        displayName: sanitizeDisplayName(value.displayName || defaults.displayName),
        credits: Math.max(0, Math.floor(Number(value.credits) || 0)),
        completedLevels: [...new Set(completedLevels)],
        unlockedLevel: Math.min(LEVELS.length, Math.max(1, Math.floor(Number(value.unlockedLevel) || 1))),
        upgrades: Object.fromEntries(Object.keys(UPGRADES).map(key => [key, Math.min(4, Math.max(0, Math.floor(Number(value.upgrades?.[key]) || 0)))])),
        unlockedSkins: [...new Set(unlockedSkins)],
        selectedSkin: unlockedSkins.includes(value.selectedSkin) ? value.selectedSkin : 'classic',
        achievements: Array.isArray(value.achievements) ? [...new Set(value.achievements)] : [],
        localScores: Array.isArray(value.localScores) ? value.localScores.slice(0, 10) : [],
        settings: { ...defaults.settings, ...(value.settings || {}) },
    };
}

export function sanitizeDisplayName(name) {
    const cleaned = String(name).replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 18);
    return cleaned || 'Anonymous Pilot';
}

export class PlayerProfile {
    constructor(storage = typeof window !== 'undefined' ? window.localStorage : undefined) {
        this.storage = storage;
        this.data = this.load();
    }

    load() {
        try {
            const saved = this.storage?.getItem(STORAGE_KEY);
            if (saved) return normalizeProfile(JSON.parse(saved));
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

    setDisplayName(name) {
        this.data.displayName = sanitizeDisplayName(name);
        return this.save();
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
        const levelId = Math.min(LEVELS.length, Math.max(1, Math.floor(Number(run.levelId) || 1)));
        const level = LEVELS[levelId - 1];
        const firstCompletion = Boolean(run.victory) && !this.data.completedLevels.includes(levelId);
        const creditsEarned = Math.floor(score / 8) + kills * 3 + (firstCompletion ? level.reward : run.victory ? Math.floor(level.reward * 0.25) : 0);

        this.data.credits += creditsEarned;
        this.data.bestScore = Math.max(this.data.bestScore, score);
        this.data.totalScore += score;
        this.data.totalKills += kills;
        this.data.totalRuns += 1;
        this.data.longestRun = Math.max(this.data.longestRun, seconds);
        if (run.victory) {
            this.data.completedLevels.push(levelId);
            this.data.completedLevels = [...new Set(this.data.completedLevels)];
            this.data.unlockedLevel = Math.min(LEVELS.length, Math.max(this.data.unlockedLevel, levelId + 1));
        }
        this.data.localScores.unshift({ name: this.data.displayName, score, level: levelId, at: Date.now() });
        this.data.localScores.sort((a, b) => b.score - a.score);
        this.data.localScores = this.data.localScores.slice(0, 10);
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
        this.data = createDefaultProfile();
        return this.save();
    }
}

export const playerProfile = new PlayerProfile();
