import Phaser from 'phaser';
import HealthBar from '../components/HealthBar';
import Bullet from '../components/Bullet';
import Asteroid from '../components/Asteroid';
import Astronaut from '../components/Astronaut';
import TouchControls from '../components/TouchControls';
import Coin from '../components/Coin';
import { getLevel, getSkin } from '../config/gameData';
import { playerProfile } from '../services/PlayerProfile';
import { COLORS, textStyle } from '../ui';
import { configureSharpCamera, GAME_CENTER_X, GAME_CENTER_Y, GAME_HEIGHT, GAME_WIDTH } from '../config/layout';
import { playMusic, playSfx, preloadAudio, stopMusic } from '../services/AudioService';

export default class PlayScene extends Phaser.Scene {
    constructor() { super('play'); }

    init(data) { this.level = getLevel(data?.levelId); }

    preload() {
        this.load.image('background-play', 'assets/menu.png');
        for (let i = 1; i <= 5; i += 1) this.load.image(`asteroid${i}`, `assets/asteroid${i}.png`);
        for (let i = 1; i <= 3; i += 1) this.load.image(`destroy${i}`, `assets/destroy${i}.png`);
        for (let i = 1; i <= 4; i += 1) this.load.image(`astronaut${i}`, `assets/Astronaut${i}.png`);
        this.load.image('muzzleflash7', 'assets/space/muzzleflash7.png');
        this.load.image('stars', 'assets/space/stars.png');
        this.load.image('ship', 'assets/space/Spaceship.png');
        this.load.image('projectiles', 'assets/projectiles.png');
        preloadAudio(this, [
            'pew1', 'pew2', 'pew3', 'accelerationSound', 'lowHealthAccelerationSound',
            'impact', 'deathSound', 'explosion', 'gameTheme', 'coinPickup', 'emptyAmmo',
            'victorySting', 'uiClick',
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
        this.effects = playerProfile.getUpgradeEffects();
        this.totalBullets = this.effects.startingAmmo;

        this.bg = this.add.tileSprite(GAME_CENTER_X, GAME_CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 'background-play');
        this.stars = this.add.tileSprite(GAME_CENTER_X, GAME_CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 'stars').setAlpha(0.82);
        this.themeMusic = playMusic(this, 'gameTheme', { volume: 0.44, fade: 650 });
        this.thrustSounds = {
            normal: this.sound.add('accelerationSound', { loop: true, volume: 0 }),
            damaged: this.sound.add('lowHealthAccelerationSound', { loop: true, volume: 0 }),
        };
        this.activeThrustSound = undefined;

        this.ship = this.physics.add.image(GAME_CENTER_X, GAME_CENTER_Y, 'ship')
            .setDepth(20).setScale(0.45).setDrag(260).setAngularDrag(500)
            .setMaxVelocity(this.effects.maxVelocity);
        const skin = getSkin(playerProfile.data.selectedSkin);
        if (skin.tint !== 0xffffff) this.ship.setTint(skin.tint);
        this.ship.body.allowGravity = false;
        // Gameplay uses a fixed logical viewport. Camera follow works in backing
        // buffer coordinates and would shift touch UI on high-DPI phones.
        this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

        this.thrustEmitter = this.add.particles(0, 0, 'muzzleflash7', {
            speed: 90, lifespan: 280, frequency: 45, quantity: 1,
            angle: { onEmit: () => this.ship.angle + 180 + Phaser.Math.Between(-8, 8) },
            scale: { start: 0.24, end: 0 }, alpha: { start: 0.75, end: 0 }, blendMode: 'ADD',
        }).startFollow(this.ship).stop();

        this.healthBar = new HealthBar(this, this.effects.maxHealth);
        this.createCoinTexture();
        this.bullets = this.physics.add.group({ classType: Bullet, maxSize: 45, runChildUpdate: true });
        this.asteroids = this.physics.add.group({ classType: Asteroid, maxSize: 45, runChildUpdate: true });
        this.astronauts = this.physics.add.group({ classType: Astronaut, maxSize: 12, runChildUpdate: true });
        this.coins = this.physics.add.group({ classType: Coin, maxSize: 30, runChildUpdate: true });

        this.physics.add.overlap(this.bullets, this.asteroids, (bullet, asteroid) => this.hitAsteroid(bullet, asteroid));
        this.physics.add.overlap(this.ship, this.asteroids, (_ship, asteroid) => this.hitShip(asteroid));
        this.physics.add.overlap(this.ship, this.coins, (_ship, coin) => this.collectCoin(coin));

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
        this.add.text(84, 42, `MISSION ${this.level.id} • ${this.level.name}`, textStyle(18, '#aeb8da')).setDepth(2000);
        this.scoreText = this.add.text(GAME_WIDTH - 84, 18, 'SCORE 0', textStyle(25)).setOrigin(1, 0).setDepth(2000);
        this.objectiveText = this.add.text(GAME_WIDTH - 84, 50, `TARGET 0/${this.level.targetKills}`, textStyle(20, '#ffd166')).setOrigin(1, 0).setDepth(2000);
        this.ammoText = this.add.text(GAME_CENTER_X - 90, 20, `AMMO ${this.totalBullets}`, textStyle(22, '#ffffff')).setOrigin(0.5, 0).setDepth(2000);
        this.coinText = this.add.text(GAME_CENTER_X + 105, 20, 'COINS 0', textStyle(22, '#ffd166')).setOrigin(0.5, 0).setDepth(2000);
        this.pauseButton = this.add.circle(GAME_CENTER_X, 64, 25, COLORS.panelDark, 0.8).setStrokeStyle(2, COLORS.cyan, 0.7)
            .setDepth(3000).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.togglePause());
        this.add.text(GAME_CENTER_X, 64, 'Ⅱ', textStyle(19)).setOrigin(0.5).setDepth(3001);
    }

    update(time) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.pause)) this.togglePause();
        if (this.ending || this.isPaused) return;
        const left = this.keys.left.isDown || this.keys.altLeft.isDown || this.touch.isDown('LEFT');
        const right = this.keys.right.isDown || this.keys.altRight.isDown || this.touch.isDown('RIGHT');
        const thrust = this.keys.thrust.isDown || this.keys.altThrust.isDown || this.touch.isDown('THRUST');
        const fire = this.keys.fire.isDown || this.touch.isDown('FIRE');

        this.ship.setAngularVelocity(left ? -175 : right ? 175 : 0);
        if (thrust) {
            this.physics.velocityFromRotation(this.ship.rotation, this.effects.acceleration, this.ship.body.acceleration);
            this.thrustEmitter.start();
            this.setThrustAudio(true);
        } else {
            this.ship.setAcceleration(0);
            this.thrustEmitter.stop();
            this.setThrustAudio(false);
        }
        if (fire && time >= this.lastFired) this.fire(time);
        this.physics.world.wrap(this.ship, 36);

        if (time - this.lastScoreTick >= 1000) {
            this.score += 2 + this.level.id;
            this.lastScoreTick = time;
            this.refreshHud();
        }
        if (time >= this.lastAsteroid) this.spawnAsteroid(time);
        if (time - this.lastAstronaut > 6500) this.spawnAstronaut(time);

        this.bg.tilePositionX += this.ship.body.deltaX() * 0.45;
        this.bg.tilePositionY += this.ship.body.deltaY() * 0.45;
        this.stars.tilePositionX += this.ship.body.deltaX() * 1.6;
        this.stars.tilePositionY += this.ship.body.deltaY() * 1.6;
    }

    fire(time) {
        if (this.totalBullets <= 0) {
            if (time >= this.lastEmptyAmmoCue) {
                playSfx(this, 'emptyAmmo', { volume: 0.65 });
                this.lastEmptyAmmoCue = time + 420;
            }
            return;
        }
        const bullet = this.bullets.get();
        if (!bullet) return;
        bullet.fire(this.ship);
        this.totalBullets -= 1;
        this.lastFired = time + this.effects.fireCooldown;
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

    spawnAsteroid(time) {
        const asteroid = this.asteroids.get();
        if (!asteroid) return;
        asteroid.body.allowGravity = false;
        asteroid.show(this.ship, this.level.asteroidSpeed + Math.floor(this.kills * 1.4), this.level.id);
        this.lastAsteroid = time + Math.max(420, this.level.spawnDelay - this.kills * 8);
    }

    spawnAstronaut(time) {
        const astronaut = this.astronauts.get();
        if (astronaut) {
            astronaut.body.allowGravity = false;
            astronaut.show(this.ship);
        }
        this.lastAstronaut = time;
    }

    hitAsteroid(bullet, asteroid) {
        const hit = asteroid.takeHit();
        if (!hit.destroyed && hit.hp === undefined) return;
        bullet.disableBody(true, true);
        if (!hit.destroyed) {
            this.score += 5;
            playSfx(this, 'impact', { volume: 0.22, rate: Phaser.Math.FloatBetween(0.96, 1.04) });
            this.refreshHud();
            return;
        }
        this.kills += 1;
        this.score += hit.score + this.level.id * 5;
        this.totalBullets += 3;
        this.spawnCoin(hit.x, hit.y, hit.coins);
        playSfx(this, 'explosion', { volume: 0.68, rate: Phaser.Math.FloatBetween(0.94, 1.05) });
        this.refreshHud();
        if (this.kills >= this.level.targetKills) this.finish(true);
    }

    spawnCoin(x, y, value) {
        const coin = this.coins.get();
        if (coin) coin.show(x, y, value, this.ship);
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
        const damage = Math.max(5, this.level.collisionDamage - this.effects.collisionReduction);
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
        this.objectiveText.setText(`TARGET ${this.kills}/${this.level.targetKills}`);
        this.ammoText.setText(`AMMO ${this.totalBullets}`);
        this.coinText.setText(`COINS ${this.runCoins}`);
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
            const quit = this.add.text(0, 70, 'QUIT MISSION', textStyle(25, '#ff6b6b')).setOrigin(0.5).setPadding(20).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
                this.stopAudio();
                this.scene.start('levels');
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
        this.time.delayedCall(victory ? 900 : 650, () => this.scene.start('end', {
            victory, score: Math.floor(this.score), kills: this.kills, coins: this.runCoins, seconds, levelId: this.level.id,
        }));
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
