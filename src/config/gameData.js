export const LEVELS = [
    { id: 1, name: 'First Flight', subtitle: 'Learn the lanes', targetKills: 8, spawnDelay: 1500, asteroidSpeed: 105, collisionDamage: 18, reward: 120 },
    { id: 2, name: 'Meteor Shower', subtitle: 'The field gets crowded', targetKills: 14, spawnDelay: 1250, asteroidSpeed: 130, collisionDamage: 20, reward: 190 },
    { id: 3, name: 'Red Horizon', subtitle: 'Fast rocks, little mercy', targetKills: 20, spawnDelay: 1050, asteroidSpeed: 160, collisionDamage: 22, reward: 280 },
    { id: 4, name: 'Gravity Well', subtitle: 'Hold your nerve', targetKills: 27, spawnDelay: 900, asteroidSpeed: 195, collisionDamage: 24, reward: 390 },
    { id: 5, name: 'Cosmic Storm', subtitle: 'A veteran challenge', targetKills: 35, spawnDelay: 760, asteroidSpeed: 235, collisionDamage: 26, reward: 520 },
    { id: 6, name: 'The Last Orbit', subtitle: 'Master the cosmos', targetKills: 45, spawnDelay: 650, asteroidSpeed: 280, collisionDamage: 28, reward: 750 },
];

export const UPGRADES = {
    hull: { name: 'Reinforced Hull', description: '+20 maximum health', costs: [140, 300, 560, 900] },
    engine: { name: 'Ion Engine', description: '+70 thrust and +25 max speed', costs: [120, 260, 500, 820] },
    blaster: { name: 'Pulse Blaster', description: '+10 ammo and faster fire', costs: [130, 280, 520, 850] },
    shield: { name: 'Kinetic Shield', description: '-3 collision damage', costs: [160, 340, 620, 980] },
};

export const SKINS = [
    { id: 'classic', name: 'Classic', description: 'The original Mostly Green hull', tint: 0xffffff, price: 0 },
    { id: 'solar', name: 'Solar Flare', description: 'Forged in a yellow star', tint: 0xffd166, price: 240 },
    { id: 'nebula', name: 'Nebula', description: 'A violet deep-space finish', tint: 0xd98cff, price: 480 },
    { id: 'ion', name: 'Ion Frost', description: 'Cold blue reactor plating', tint: 0x72ddf7, price: 760 },
    { id: 'void', name: 'Void Runner', description: 'Experimental crimson stealth coat', tint: 0xff6b6b, price: 1100 },
];

export const ACHIEVEMENTS = [
    { id: 'first_blood', name: 'First Blood', description: 'Destroy your first asteroid', reward: 50, test: s => s.totalKills >= 1 },
    { id: 'mission_ready', name: 'Mission Ready', description: 'Complete your first mission', reward: 75, test: s => s.completedLevels.length >= 1 },
    { id: 'survivor', name: 'Space Survivor', description: 'Stay alive for 60 seconds in one run', reward: 100, test: s => s.longestRun >= 60 },
    { id: 'centurion', name: 'Centurion', description: 'Destroy 100 asteroids', reward: 180, test: s => s.totalKills >= 100 },
    { id: 'high_flyer', name: 'High Flyer', description: 'Score 1,000 points in one run', reward: 150, test: s => s.bestScore >= 1000 },
    { id: 'engineer', name: 'Chief Engineer', description: 'Max out any upgrade', reward: 200, test: s => Object.values(s.upgrades).some(level => level >= 4) },
    { id: 'collector', name: 'Fleet Collector', description: 'Own four ship skins', reward: 220, test: s => s.unlockedSkins.length >= 4 },
    { id: 'cosmic_hero', name: 'Cosmic Hero', description: 'Complete every mission', reward: 500, test: s => s.completedLevels.length >= LEVELS.length },
];

export function getLevel(levelId) {
    return LEVELS.find(level => level.id === Number(levelId)) || LEVELS[0];
}

export function getSkin(skinId) {
    return SKINS.find(skin => skin.id === skinId) || SKINS[0];
}
