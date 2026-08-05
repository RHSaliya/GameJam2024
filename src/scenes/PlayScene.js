import Phaser from 'phaser';
import HealthBar from '../components/HealthBar';
import Bullet from '../components/Bullet';
import Asteroid from '../components/Asteroid';
import Astronaut from '../components/Astronaut';
import TouchControls from '../components/TouchControls';
import Coin from '../components/Coin';
import WeaponPowerUp from '../components/WeaponPowerUp';
import {
    getCampaignSpeedBonus, getEndlessDifficulty, getLevel, getSkin, getWeapon,
    getWeaponPickupChoices, SKINS, WEAPONS,
} from '../config/gameData';
import { playerProfile } from '../services/PlayerProfile';
import { COLORS, showToast, textStyle } from '../ui';
import { configureSharpCamera, GAME_CENTER_X, GAME_CENTER_Y, GAME_HEIGHT, GAME_WIDTH } from '../config/layout';
import { playMusic, playSfx, preloadAudio, stopMusic } from '../services/AudioService';
import { generateEdgeSpawn } from '../services/SpaceGenerator';

export default class PlayScene extends Phaser.Scene {
    constructor() { super('play'); }

    init(data) {
        this.mode = data?.mode === 'endless' ? 'endless' : 'campaign';
        this.level = getLevel(data?.levelId);
    }

    preload() {
        for (let i = 1; i <= 5; i += 1) this.load.image(`asteroid${i}`, `assets/asteroid${i}.png`);
        for (let i = 1; i <= 3; i += 1) this.load.image(`destroy${i}`, `assets/destroy${i}.png`);
        for (let i = 1; i <= 4; i += 1) this.load.image(`astronaut${i}`, `assets/Astronaut${i}.png`);
        this.load.image('muzzleflash7', 'assets/space/muzzleflash7.png');
        this.load.image('stars', 'assets/space/stars.png');
        SKINS.forEach(ship => this.load.image(`ship-${ship.id}`, ship.texture));
        this.load.image('projectiles', 'assets/projectiles.png');
        preloadAudio(this, [
            'pew1', 'pew2', 'pew3', 'accelerationSound', 'lowHealthAccelerationSound',
            'impact', 'deathSound', 'explosion', 'gameTheme', 'coinPickup', 'emptyAmmo',
            'victorySting',
        ]);
    }

    create() {
        configureSharpCamera(this);
        this.runStartedAt = this.time.now;
        this.lastAsteroid = this.time.now + 900;
        this.lastAstronaut = this.time.now;
        this.lastFired = 0;
        this.lastEmptyAmmoCue = 0;
        this.lastScoreTick = this.time.now;
        this.score = 0;
        this.kills = 0;
        this.runCoins = 0;
        this.ending = false;
        this.isPaused = false;
        this.shipDefinition = getSkin(playerProfile.data.selectedSkin);
        const upgradeEffects = playerProfile.getUpgradeEffects();
        this.effects = {
            ...upgradeEffects,
            maxHealth: Math.round(upgradeEffects.maxHealth * this.shipDefinition.stats.hull),
            acceleration: Math.round(upgradeEffects.acceleration * this.shipDefinition.stats.acceleration),
            maxVelocity: Math.round(upgradeEffects.maxVelocity * this.shipDefinition.stats.maxVelocity),
            collisionReduction: upgradeEffects.collisionReduction + this.shipDefinition.stats.armor,
        };
        this.totalBullets = this.effects.startingAmmo;
        this.nativeWeaponId = this.shipDefinition.weaponId;
        this.activeWeaponId = this.nativeWeaponId;
        this.weaponShotsRemaining = 0;
        this.travelVelocity = new Phaser.Math.Vector2();

        this.createSpaceField();
        this.themeMusic = playMusic(this, 'gameTheme', { volume: 0.44, fade: 650 });
        this.thrustSounds = {
            normal: this.sound.add('accelerationSound', { loop: true, volume: 0 }),
            damaged: this.sound.add('lowHealthAccelerationSound', { loop: true, volume: 0 }),
        };
        this.activeThrustSound = undefined;

        this.ship = this.physics.add.image(GAME_CENTER_X, GAME_CENTER_Y, `ship-${this.shipDefinition.id}`)
            .setDepth(20).setScale(0.45).setDrag(260).setAngularDrag(500)
            .setMaxVelocity(this.effects.maxVelocity);
        this.ship.body.allowGravity = false;
        this.ship.body.setSize(110, 175, true);
        // Gameplay uses a fixed logical viewport. Camera follow works in backing
        // buffer coordinates and would shift touch UI on high-DPI phones.
        this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

        this.thrustEmitter = this.add.particles(0, 0, 'muzzleflash7', {
            speed: 90, lifespan: 280, frequency: 45, quantity: 1,
            angle: { onEmit: () => this.ship.angle + 90 + Phaser.Math.Between(-8, 8) },
            scale: { start: 0.24, end: 0 }, alpha: { start: 0.75, end: 0 }, blendMode: 'ADD',
        }).startFollow(this.ship).stop();

        this.healthBar = new HealthBar(this, this.effects.maxHealth);
        this.createCoinTexture();
        this.createWeaponCoreTextures();
        this.bullets = this.physics.add.group({ classType: Bullet, maxSize: 80, runChildUpdate: true });
        this.asteroids = this.physics.add.group({ classType: Asteroid, maxSize: 45, runChildUpdate: true });
        this.astronauts = this.physics.add.group({ classType: Astronaut, maxSize: 12, runChildUpdate: true });
        this.coins = this.physics.add.group({ classType: Coin, maxSize: 30, runChildUpdate: true });
        this.weaponPowerUps = this.physics.add.group({ classType: WeaponPowerUp, maxSize: 4, runChildUpdate: true });

        this.physics.add.overlap(this.bullets, this.asteroids, (bullet, asteroid) => this.hitAsteroid(bullet, asteroid));
        this.physics.add.overlap(this.ship, this.asteroids, (_ship, asteroid) => this.hitShip(asteroid));
        this.physics.add.overlap(this.ship, this.coins, (_ship, coin) => this.collectCoin(coin));
        this.physics.add.overlap(this.ship, this.weaponPowerUps, (_ship, powerUp) => this.collectWeaponPowerUp(powerUp));

        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            altLeft: Phaser.Input.Keyboard.KeyCodes.A,
            altRight: Phaser.Input.Keyboard.KeyCodes.D,
            thrust: Phaser.Input.Keyboard.KeyCodes.UP,
            altThrust: Phaser.Input.Keyboard.KeyCodes.W,
            fire: Phaser.Input.Keyboard.KeyCodes.SPACE,
            pause: Phaser.Input.Keyboard.KeyCodes.ESC,
        });
        this.touch = new TouchControls(this);
        this.createHud();
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopAudio());
    }

    createHud() {
        const runName = this.mode === 'endless' ? 'ENDLESS MODE' : `MISSION ${this.level.id} • ${this.level.name}`;
        this.add.text(84, 42, runName, textStyle(18, '#aeb8da')).setDepth(2000);
        this.scoreText = this.add.text(GAME_WIDTH - 84, 18, 'SCORE 0', textStyle(25)).setOrigin(1, 0).setDepth(2000);
        const objective = this.mode === 'endless' ? 'DESTROYED 0 • THREAT 1' : `TARGET 0/${this.level.targetKills}`;
        this.objectiveText = this.add.text(GAME_WIDTH - 84, 50, objective, textStyle(20, '#ffd166')).setOrigin(1, 0).setDepth(2000);
        this.ammoText = this.add.text(GAME_CENTER_X - 90, 20, `AMMO ${this.totalBullets}`, textStyle(22, '#ffffff')).setOrigin(0.5, 0).setDepth(2000);
        this.coinText = this.add.text(GAME_CENTER_X + 105, 20, 'COINS 0', textStyle(22, '#ffd166')).setOrigin(0.5, 0).setDepth(2000);
        this.pauseButton = this.add.circle(GAME_CENTER_X, 64, 25, COLORS.panelDark, 0.8).setStrokeStyle(2, COLORS.cyan, 0.7)
            .setDepth(3000).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.togglePause());
        this.add.text(GAME_CENTER_X, 64, 'Ⅱ', textStyle(19)).setOrigin(0.5).setDepth(3001);
        this.weaponText = this.add.text(GAME_CENTER_X, 102, '', textStyle(18, '#ffd166')).setOrigin(0.5).setDepth(2000);
        this.refreshHud();
    }

    update(time, delta) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.pause)) this.togglePause();
        if (this.ending || this.isPaused) return;
        const left = this.keys.left.isDown || this.keys.altLeft.isDown || this.touch.isDown('LEFT');
        const right = this.keys.right.isDown || this.keys.altRight.isDown || this.touch.isDown('RIGHT');
        const thrust = this.keys.thrust.isDown || this.keys.altThrust.isDown || this.touch.isDown('THRUST');
        const fire = this.keys.fire.isDown || this.touch.isDown('FIRE');

        this.ship.setAngularVelocity(left ? -175 : right ? 175 : 0);
        const travel = this.updateTravel(thrust, delta);
        this.shiftWorld(travel.x, travel.y);
        this.scrollSpace(travel.x, travel.y, delta);
        if (thrust) {
            this.thrustEmitter.start();
            this.setThrustAudio(true);
        } else {
            this.thrustEmitter.stop();
            this.setThrustAudio(false);
        }
        if (fire && time >= this.lastFired) this.fire(time);

        if (this.mode === 'endless' && time - this.lastScoreTick >= 1000) {
            this.score += this.getDifficulty().scorePerSecond;
            this.lastScoreTick = time;
            this.refreshHud();
        }
        if (time >= this.lastAsteroid) this.spawnAsteroid(time);
        if (time - this.lastAstronaut > 6500) this.spawnAstronaut(time);
    }

    createSpaceField() {
        this.createStarTexture('stars-far-generated', 150, 0.45, 1.15, ['0x8aa4d6', '0xb7c9ee', '0xffffff']);
        this.createStarTexture('stars-near-generated', 52, 0.9, 2.15, ['0x5ce1e6', '0xffffff', '0xffd166']);
        // Keep the base free of baked-in stars. Every visible point of light is
        // part of a parallax layer below, so nothing appears pinned to screen.
        this.bg = this.add.rectangle(GAME_CENTER_X, GAME_CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x080b1e, 1)
            .setDepth(-40);
        const far = this.add.tileSprite(GAME_CENTER_X, GAME_CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 'stars-far-generated')
            .setDepth(-30).setAlpha(0.7).setTileScale(0.9);
        const middle = this.add.tileSprite(GAME_CENTER_X, GAME_CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 'stars')
            .setDepth(-25).setAlpha(0.46).setTileScale(1.05);
        const near = this.add.tileSprite(GAME_CENTER_X, GAME_CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 'stars-near-generated')
            .setDepth(-20).setAlpha(0.72).setTileScale(1.15);
        this.spaceLayers = [
            { sprite: far, parallax: 0.22, drift: 0.002 },
            { sprite: middle, parallax: 0.72, drift: -0.004 },
            { sprite: near, parallax: 1.35, drift: 0.007 },
        ];
    }

    createStarTexture(key, count, minRadius, maxRadius, colors) {
        if (this.textures.exists(key)) return;
        const random = new Phaser.Math.RandomDataGenerator([key]);
        const graphics = this.make.graphics({ add: false });
        for (let index = 0; index < count; index += 1) {
            const color = Number(colors[random.integerInRange(0, colors.length - 1)]);
            graphics.fillStyle(color, random.realInRange(0.35, 0.95));
            graphics.fillCircle(
                random.realInRange(0, 512),
                random.realInRange(0, 512),
                random.realInRange(minRadius, maxRadius),
            );
        }
        graphics.generateTexture(key, 512, 512);
        graphics.destroy();
    }

    updateTravel(thrust, delta) {
        const seconds = Math.min(50, Math.max(0, delta)) / 1000;
        if (thrust) {
            const acceleration = new Phaser.Math.Vector2();
            this.physics.velocityFromRotation(this.ship.rotation - Math.PI / 2, this.effects.acceleration, acceleration);
            this.travelVelocity.x += acceleration.x * seconds;
            this.travelVelocity.y += acceleration.y * seconds;
        } else {
            const speed = this.travelVelocity.length();
            if (speed > 0) this.travelVelocity.setLength(Math.max(0, speed - 260 * seconds));
        }
        if (this.travelVelocity.length() > this.effects.maxVelocity) {
            this.travelVelocity.setLength(this.effects.maxVelocity);
        }

        this.ship.setPosition(GAME_CENTER_X, GAME_CENTER_Y).setVelocity(0).setAcceleration(0);
        this.ship.body.updateFromGameObject();
        return {
            x: this.travelVelocity.x * seconds,
            y: this.travelVelocity.y * seconds,
        };
    }

    shiftWorld(deltaX, deltaY) {
        if (deltaX === 0 && deltaY === 0) return;
        [this.bullets, this.asteroids, this.astronauts, this.coins, this.weaponPowerUps].forEach(group => {
            group.getChildren().forEach(object => {
                if (!object.active) return;
                object.x -= deltaX;
                object.y -= deltaY;
                if (!object.body) return;
                // Translate the body's current and previous snapshots equally.
                // This preserves the object's own velocity delta while moving
                // the world opposite the centered ship's travel.
                object.body.position.x -= deltaX;
                object.body.position.y -= deltaY;
                object.body.prev.x -= deltaX;
                object.body.prev.y -= deltaY;
                if (object.body.prevFrame) {
                    object.body.prevFrame.x -= deltaX;
                    object.body.prevFrame.y -= deltaY;
                }
            });
        });
    }

    scrollSpace(deltaX, deltaY, delta) {
        this.spaceLayers.forEach(layer => {
            layer.sprite.tilePositionX += deltaX * layer.parallax + delta * layer.drift;
            layer.sprite.tilePositionY += deltaY * layer.parallax + delta * layer.drift * 0.35;
        });
    }

    fire(time) {
        const weapon = getWeapon(this.activeWeaponId);
        if (this.totalBullets < weapon.ammoCost) {
            if (time >= this.lastEmptyAmmoCue) {
                playSfx(this, 'emptyAmmo', { volume: 0.65 });
                this.lastEmptyAmmoCue = time + 420;
            }
            return;
        }
        let fired = 0;
        weapon.projectiles.forEach(projectile => {
            const bullet = this.bullets.get();
            if (!bullet) return;
            bullet.fire(this.ship, weapon, projectile);
            fired += 1;
        });
        if (fired === 0) return;
        this.totalBullets -= weapon.ammoCost;
        this.lastFired = time + this.effects.fireCooldown * weapon.cooldownMultiplier;
        if (this.weaponShotsRemaining > 0) {
            this.weaponShotsRemaining -= 1;
            if (this.weaponShotsRemaining === 0) {
                this.activeWeaponId = this.nativeWeaponId;
                showToast(this, `${getWeapon(this.nativeWeaponId).name} restored`, getWeapon(this.nativeWeaponId).color);
            }
        }
        playSfx(this, `pew${Phaser.Math.Between(1, 3)}`, {
            volume: 0.9,
            rate: Phaser.Math.FloatBetween(0.94, 1.06),
            detune: Phaser.Math.Between(-45, 45),
        });
        this.refreshHud();
    }

    createCoinTexture() {
        if (this.textures.exists('coin')) return;
        const graphics = this.make.graphics({ add: false });
        graphics.fillStyle(0xffd166, 1).fillCircle(36, 36, 32);
        graphics.lineStyle(6, 0xffa62b, 1).strokeCircle(36, 36, 30);
        graphics.fillStyle(0xffffff, 0.75).fillCircle(24, 22, 8);
        graphics.generateTexture('coin', 72, 72);
        graphics.destroy();
    }

    createWeaponCoreTextures() {
        Object.values(WEAPONS).forEach(weapon => {
            const key = `weapon-core-${weapon.id}`;
            if (this.textures.exists(key)) return;
            const graphics = this.make.graphics({ add: false });
            graphics.fillStyle(0x090c1a, 0.95).fillCircle(32, 32, 27);
            graphics.lineStyle(4, weapon.color, 1).strokeCircle(32, 32, 25);
            graphics.fillStyle(weapon.color, 1).fillPoints([
                { x: 32, y: 9 }, { x: 51, y: 32 },
                { x: 32, y: 55 }, { x: 13, y: 32 },
            ], true);
            graphics.fillStyle(0xffffff, 0.82).fillCircle(26, 24, 5);
            graphics.generateTexture(key, 64, 64);
            graphics.destroy();
        });
    }

    spawnAsteroid(time) {
        const asteroid = this.asteroids.get();
        if (!asteroid) return;
        const difficulty = this.getDifficulty();
        asteroid.body.allowGravity = false;
        asteroid.show(this.ship, difficulty.asteroidSpeed, difficulty.tier, this.generateSpawn(125, 0.72, 0.2));
        this.lastAsteroid = time + difficulty.spawnDelay;
    }

    spawnAstronaut(time) {
        const astronaut = this.astronauts.get();
        if (astronaut) {
            astronaut.body.allowGravity = false;
            astronaut.show(this.ship, this.generateSpawn(105, 0.55, 0.36));
        }
        this.lastAstronaut = time;
    }

    generateSpawn(padding, forwardBias, targetSpread) {
        return generateEdgeSpawn({
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            padding,
            forwardBias,
            targetSpread,
            travelVelocity: this.travelVelocity,
        });
    }

    hitAsteroid(bullet, asteroid) {
        if (!bullet.registerHit(asteroid)) return;
        const hit = asteroid.takeHit(bullet.damage);
        if (!hit.destroyed && hit.hp === undefined) return;
        bullet.consumeImpact();
        if (!hit.destroyed) {
            this.score += 5;
            playSfx(this, 'impact', { volume: 0.22, rate: Phaser.Math.FloatBetween(0.96, 1.04) });
            this.refreshHud();
            return;
        }
        this.kills += 1;
        this.score += hit.score + this.getDifficulty().tier * 5;
        this.totalBullets += 3;
        this.spawnCoin(hit.x, hit.y, hit.coins);
        this.maybeSpawnWeaponPowerUp(hit.x, hit.y);
        playSfx(this, 'explosion', { volume: 0.68, rate: Phaser.Math.FloatBetween(0.94, 1.05) });
        this.refreshHud();
        if (this.mode === 'campaign' && this.kills >= this.level.targetKills) this.finish(true);
    }

    spawnCoin(x, y, value) {
        const coin = this.coins.get();
        if (coin) coin.show(x, y, value, this.ship);
    }

    maybeSpawnWeaponPowerUp(x, y) {
        if (this.kills % 6 !== 0 && Math.random() >= 0.08) return;
        const choices = getWeaponPickupChoices(this.nativeWeaponId);
        const weapon = Phaser.Utils.Array.GetRandom(choices);
        const powerUp = this.weaponPowerUps.get();
        if (powerUp && weapon) powerUp.show(x, y, weapon, this.ship);
    }

    collectWeaponPowerUp(powerUp) {
        const weaponId = powerUp.collect();
        if (!weaponId) return;
        const weapon = getWeapon(weaponId);
        this.activeWeaponId = weapon.id;
        this.weaponShotsRemaining = weapon.pickupShots;
        playSfx(this, 'coinPickup', { volume: 0.85, rate: 1.25 });
        if (playerProfile.data.settings.vibration) navigator.vibrate?.([12, 25, 12]);
        showToast(this, `${weapon.name} acquired • ${weapon.pickupShots} shots`, weapon.color);
        this.refreshHud();
    }

    collectCoin(coin) {
        const value = coin.collect();
        if (!value) return;
        this.runCoins += value;
        this.score += value * 8;
        this.totalBullets += value >= 3 ? 2 : 0;
        playSfx(this, 'coinPickup', { volume: 0.7, rate: 0.96 + Math.min(value, 4) * 0.035 });
        if (playerProfile.data.settings.vibration) navigator.vibrate?.(12);
        this.refreshHud();
    }

    hitShip(asteroid) {
        if (!asteroid.destroyMe()) return;
        const damage = Math.max(5, this.getDifficulty().collisionDamage - this.effects.collisionReduction);
        this.healthBar.decreaseHealth(damage);
        this.totalBullets += 2;
        this.cameras.main.shake(130, 0.012);
        playSfx(this, 'impact', { volume: 0.5, rate: 0.88 });
        if (playerProfile.data.settings.vibration) navigator.vibrate?.(45);
        this.refreshHud();
        if (this.healthBar.getHealth() <= 0) this.finish(false);
    }

    refreshHud() {
        this.scoreText.setText(`SCORE ${Math.floor(this.score)}`);
        this.objectiveText.setText(this.mode === 'endless'
            ? `DESTROYED ${this.kills} • THREAT ${this.getDifficulty().tier}`
            : `TARGET ${this.kills}/${this.level.targetKills}`);
        this.ammoText.setText(`AMMO ${this.totalBullets}`);
        this.coinText.setText(`COINS ${this.runCoins}`);
        const weapon = getWeapon(this.activeWeaponId);
        const weaponSuffix = this.weaponShotsRemaining > 0 ? ` • ${this.weaponShotsRemaining} SHOTS` : ' • NATIVE';
        this.weaponText?.setText(`${weapon.name.toUpperCase()}${weaponSuffix}`)
            .setColor(`#${weapon.color.toString(16).padStart(6, '0')}`);
    }

    togglePause() {
        if (this.ending) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.physics.world.pause();
            this.themeMusic.pause();
            this.touch.reset();
            this.setThrustAudio(false, true);
            this.thrustEmitter.stop();
            this.pauseOverlay = this.add.container(GAME_CENTER_X, GAME_CENTER_Y).setDepth(5000);
            const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x090c1a, 0.82).setInteractive();
            const title = this.add.text(0, -80, 'PAUSED', textStyle(44)).setOrigin(0.5);
            const resume = this.add.text(0, 0, 'RESUME', textStyle(30, '#7ae582')).setOrigin(0.5).setPadding(25).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.togglePause());
            const quitLabel = this.mode === 'endless' ? 'QUIT RUN' : 'QUIT MISSION';
            const quit = this.add.text(0, 70, quitLabel, textStyle(25, '#ff6b6b')).setOrigin(0.5).setPadding(20).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
                this.stopAudio();
                this.scene.start(this.mode === 'endless' ? 'menu' : 'levels');
            });
            this.pauseOverlay.add([bg, title, resume, quit]);
        } else {
            this.physics.world.resume();
            this.themeMusic.resume();
            this.pauseOverlay?.destroy();
        }
    }

    finish(victory) {
        if (this.ending) return;
        this.ending = true;
        this.physics.world.pause();
        this.touch.reset();
        this.stopAudio();
        playSfx(this, victory ? 'victorySting' : 'deathSound', { volume: victory ? 0.9 : 0.72 });
        const seconds = Math.max(1, Math.floor((this.time.now - this.runStartedAt) / 1000));
        const speedBonus = this.mode === 'campaign' && victory
            ? getCampaignSpeedBonus(this.level.id, seconds)
            : 0;
        this.time.delayedCall(victory ? 900 : 650, () => this.scene.start('end', {
            mode: this.mode, victory: this.mode === 'campaign' && victory,
            score: Math.floor(this.score) + speedBonus,
            speedBonus,
            threat: this.getDifficulty().tier,
            kills: this.kills, coins: this.runCoins, seconds, levelId: this.level.id,
        }));
    }

    getDifficulty() {
        if (this.mode === 'endless') return getEndlessDifficulty(this.kills);
        return {
            tier: this.level.id,
            asteroidSpeed: this.level.asteroidSpeed + Math.floor(this.kills * 1.4),
            spawnDelay: Math.max(420, this.level.spawnDelay - this.kills * 8),
            collisionDamage: this.level.collisionDamage,
        };
    }

    stopAudio() {
        stopMusic(this);
        Object.values(this.thrustSounds || {}).forEach(sound => sound.stop());
        this.activeThrustSound = undefined;
    }

    setThrustAudio(active, immediate = false) {
        if (!active) {
            const current = this.activeThrustSound;
            this.activeThrustSound = undefined;
            if (!current?.isPlaying) return;
            this.tweens.killTweensOf(current);
            if (immediate) current.stop();
            else this.tweens.add({ targets: current, volume: 0, duration: 110, onComplete: () => current.stop() });
            return;
        }

        const damaged = this.healthBar.getHealth() / this.healthBar.maxHealth <= 0.3;
        const desired = damaged ? this.thrustSounds.damaged : this.thrustSounds.normal;
        if (this.activeThrustSound === desired) return;
        this.setThrustAudio(false, true);
        this.activeThrustSound = desired;
        desired.setVolume(0);
        desired.play();
        this.tweens.add({
            targets: desired,
            volume: 0.3 * playerProfile.data.settings.masterVolume * playerProfile.data.settings.sfxVolume,
            duration: 140,
            ease: 'Sine.easeOut',
        });
    }
}
