export const LEVELS = [
    { id: 1, name: 'First Flight', subtitle: 'Learn the lanes', targetKills: 8, spawnDelay: 1500, asteroidSpeed: 105, collisionDamage: 18, reward: 120, parTime: 55, maxSpeedBonus: 400 },
    { id: 2, name: 'Meteor Shower', subtitle: 'The field gets crowded', targetKills: 14, spawnDelay: 1250, asteroidSpeed: 130, collisionDamage: 20, reward: 190, parTime: 75, maxSpeedBonus: 650 },
    { id: 3, name: 'Red Horizon', subtitle: 'Fast rocks, little mercy', targetKills: 20, spawnDelay: 1050, asteroidSpeed: 160, collisionDamage: 22, reward: 280, parTime: 95, maxSpeedBonus: 900 },
    { id: 4, name: 'Gravity Well', subtitle: 'Hold your nerve', targetKills: 27, spawnDelay: 900, asteroidSpeed: 195, collisionDamage: 24, reward: 390, parTime: 115, maxSpeedBonus: 1200 },
    { id: 5, name: 'Cosmic Storm', subtitle: 'A veteran challenge', targetKills: 35, spawnDelay: 760, asteroidSpeed: 235, collisionDamage: 26, reward: 520, parTime: 140, maxSpeedBonus: 1550 },
    { id: 6, name: 'The Last Orbit', subtitle: 'Master the cosmos', targetKills: 45, spawnDelay: 650, asteroidSpeed: 280, collisionDamage: 28, reward: 750, parTime: 165, maxSpeedBonus: 2000 },
];

export function getCampaignSpeedBonus(levelId, seconds) {
    const level = getLevel(levelId);
    const completionTime = Math.max(0, Number(seconds) || 0);
    const fullBonusTime = level.parTime * 0.5;
    const bonusCutoff = level.parTime * 1.5;
    const ratio = Math.min(1, Math.max(0, (bonusCutoff - completionTime) / (bonusCutoff - fullBonusTime)));
    return Math.round(level.maxSpeedBonus * ratio);
}

export function getEndlessDifficulty(kills = 0) {
    const destroyed = Math.max(0, Math.floor(Number(kills) || 0));
    const tier = Math.min(6, 1 + Math.floor(destroyed / 10));
    return {
        tier,
        asteroidSpeed: Math.min(340, 105 + Math.floor(destroyed * 1.4)),
        spawnDelay: Math.max(420, 1500 - destroyed * 9),
        collisionDamage: Math.min(34, 18 + Math.floor(destroyed / 10) * 2),
        scorePerSecond: 2 + tier,
    };
}

export const UPGRADES = {
    hull: { name: 'Reinforced Hull', description: '+20 maximum health', costs: [140, 300, 560, 900] },
    engine: { name: 'Ion Engine', description: '+70 thrust and +25 max speed', costs: [120, 260, 500, 820] },
    blaster: { name: 'Pulse Blaster', description: '+10 ammo and faster fire', costs: [130, 280, 520, 850] },
    shield: { name: 'Kinetic Shield', description: '-3 collision damage', costs: [160, 340, 620, 980] },
};

export const WEAPONS = {
    pulse: {
        id: 'pulse', name: 'Pulse Blaster', color: 0xffd166, cooldownMultiplier: 1,
        texture: 'assets/space/projectile-pulse.png',
        ammoCost: 1, pickupShots: 28,
        projectiles: [{ angle: 0, offset: 0, speed: 1150, damage: 1, pierce: 0, scale: 0.5 }],
    },
    solar: {
        id: 'solar', name: 'Solar Barrage', color: 0xffa62b, cooldownMultiplier: 1.35,
        texture: 'assets/space/projectile-solar.png',
        ammoCost: 1, pickupShots: 18,
        projectiles: [
            { angle: -12, offset: -8, speed: 1050, damage: 1, pierce: 0, scale: 0.43 },
            { angle: 0, offset: 0, speed: 1100, damage: 1, pierce: 0, scale: 0.48 },
            { angle: 12, offset: 8, speed: 1050, damage: 1, pierce: 0, scale: 0.43 },
        ],
    },
    phase: {
        id: 'phase', name: 'Phase Lance', color: 0xd98cff, cooldownMultiplier: 1.2,
        texture: 'assets/space/projectile-phase.png',
        ammoCost: 1, pickupShots: 20,
        projectiles: [{ angle: 0, offset: 0, speed: 1380, damage: 1, pierce: 2, scale: 0.62 }],
    },
    ion: {
        id: 'ion', name: 'Ion Repeater', color: 0x72ddf7, cooldownMultiplier: 0.66,
        texture: 'assets/space/projectile-ion.png',
        ammoCost: 1, pickupShots: 24,
        projectiles: [
            { angle: 0, offset: -10, speed: 1220, damage: 1, pierce: 0, scale: 0.38 },
            { angle: 0, offset: 10, speed: 1220, damage: 1, pierce: 0, scale: 0.38 },
        ],
    },
    seeker: {
        id: 'seeker', name: 'Void Seeker', color: 0xff4d6d, cooldownMultiplier: 1.55,
        texture: 'assets/space/projectile-seeker.png',
        ammoCost: 1, pickupShots: 14,
        projectiles: [{ angle: 0, offset: 0, speed: 760, damage: 2, pierce: 0, homing: 0.075, scale: 0.55 }],
    },
};

export const SKINS = [
    {
        id: 'classic', name: 'Classic', texture: 'assets/space/ship-classic.png', weaponId: 'pulse', price: 0,
        description: 'Balanced frame • Pulse Blaster', stats: { hull: 1, acceleration: 1, maxVelocity: 1, armor: 0 },
    },
    {
        id: 'solar', name: 'Solar Flare', texture: 'assets/space/ship-solar.png', weaponId: 'solar', price: 240,
        description: 'Armored interceptor • 3-way Solar Barrage', stats: { hull: 1.15, acceleration: 0.9, maxVelocity: 0.92, armor: 2 },
    },
    {
        id: 'nebula', name: 'Nebula', texture: 'assets/space/ship-nebula.png', weaponId: 'phase', price: 480,
        description: 'Agile explorer • Piercing Phase Lance', stats: { hull: 0.95, acceleration: 1.08, maxVelocity: 1.06, armor: 0 },
    },
    {
        id: 'ion', name: 'Ion Frost', texture: 'assets/space/ship-ion.png', weaponId: 'ion', price: 760,
        description: 'Fragile speedster • Twin Ion Repeater', stats: { hull: 0.82, acceleration: 1.22, maxVelocity: 1.18, armor: 0 },
    },
    {
        id: 'void', name: 'Void Runner', texture: 'assets/space/ship-void.png', weaponId: 'seeker', price: 1100,
        description: 'Stealth racer • Homing Void Seeker', stats: { hull: 0.88, acceleration: 1.14, maxVelocity: 1.24, armor: 0 },
    },
];

export const ACHIEVEMENTS = [
    { id: 'first_blood', name: 'First Blood', description: 'Destroy your first asteroid', reward: 50, test: s => s.totalKills >= 1 },
    { id: 'mission_ready', name: 'Mission Ready', description: 'Complete your first mission', reward: 75, test: s => s.completedLevels.length >= 1 },
    { id: 'survivor', name: 'Space Survivor', description: 'Stay alive for 60 seconds in one run', reward: 100, test: s => s.longestRun >= 60 },
    { id: 'centurion', name: 'Centurion', description: 'Destroy 100 asteroids', reward: 180, test: s => s.totalKills >= 100 },
    { id: 'high_flyer', name: 'High Flyer', description: 'Score 1,000 points in one run', reward: 150, test: s => s.bestScore >= 1000 },
    { id: 'engineer', name: 'Chief Engineer', description: 'Max out any upgrade', reward: 200, test: s => Object.values(s.upgrades).some(level => level >= 4) },
    { id: 'collector', name: 'Fleet Collector', description: 'Own four ships', reward: 220, test: s => s.unlockedSkins.length >= 4 },
    { id: 'treasure_hunter', name: 'Treasure Hunter', description: 'Collect 250 mission coins', reward: 250, test: s => s.totalCoins >= 250 },
    { id: 'cosmic_hero', name: 'Cosmic Hero', description: 'Complete every mission', reward: 500, test: s => s.completedLevels.length >= LEVELS.length },
];

export function getLevel(levelId) {
    return LEVELS.find(level => level.id === Number(levelId)) || LEVELS[0];
}

export function getSkin(skinId) {
    return SKINS.find(skin => skin.id === skinId) || SKINS[0];
}

export function getWeapon(weaponId) {
    return WEAPONS[weaponId] || WEAPONS.pulse;
}

export function getWeaponPickupChoices(nativeWeaponId) {
    return Object.values(WEAPONS).filter(weapon => weapon.id !== nativeWeaponId);
}
