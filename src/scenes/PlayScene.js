import Phaser from 'phaser';
import HealthBar from '../components/HealthBar';
import Bullet from '../components/Bullet';
import Asteroid from '../components/Asteroid';
import Astronaut from '../components/Astronaut';
import TouchControls from '../components/TouchControls';
import { getLevel, getSkin } from '../config/gameData';
import { playerProfile } from '../services/PlayerProfile';
import { COLORS, textStyle } from '../ui';
import { configureSharpCamera, GAME_CENTER_X, GAME_CENTER_Y, GAME_HEIGHT, GAME_WIDTH } from '../config/layout';

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
        ['Pew1', 'Pew2', 'Pew3', 'ShipAccelerate', 'HitSound', 'DeathSound', 'Explosion', 'GameTheme'].forEach(name => {
            const key = name === 'ShipAccelerate' ? 'accelerationSound' : name === 'GameTheme' ? 'gameTheme' : name.charAt(0).toLowerCase() + name.slice(1);
            this.load.audio(key, `assets/Sound/${name}.mp3`);
        });
    }

    create() {
        configureSharpCamera(this);
        this.runStartedAt = this.time.now;
        this.lastAsteroid = this.time.now + 900;
        this.lastAstronaut = this.time.now;
        this.lastFired = 0;
        this.lastScoreTick = this.time.now;
        this.score = 0;
        this.kills = 0;
        this.ending = false;
        this.isPaused = false;
        this.effects = playerProfile.getUpgradeEffects();
        this.totalBullets = this.effects.startingAmmo;
        this.sound.volume = playerProfile.data.settings.volume;

        this.bg = this.add.tileSprite(GAME_CENTER_X, GAME_CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 'background-play').setScrollFactor(0);
        this.stars = this.add.tileSprite(GAME_CENTER_X, GAME_CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 'stars').setScrollFactor(0).setAlpha(0.82);
        this.themeMusic = this.sound.add('gameTheme', { loop: true, volume: 0.5 });
        this.themeMusic.play();

        this.ship = this.physics.add.image(GAME_CENTER_X, GAME_CENTER_Y, 'ship')
            .setDepth(20).setScale(0.45).setDrag(260).setAngularDrag(500)
            .setMaxVelocity(this.effects.maxVelocity);
        const skin = getSkin(playerProfile.data.selectedSkin);
        if (skin.tint !== 0xffffff) this.ship.setTint(skin.tint);
        this.ship.body.allowGravity = false;
        this.cameras.main.startFollow(this.ship, true, 0.08, 0.08);

        this.thrustEmitter = this.add.particles(0, 0, 'muzzleflash7', {
            speed: 90, lifespan: 280, frequency: 45, quantity: 1,
            angle: { onEmit: () => this.ship.angle + 180 + Phaser.Math.Between(-8, 8) },
            scale: { start: 0.24, end: 0 }, alpha: { start: 0.75, end: 0 }, blendMode: 'ADD',
        }).startFollow(this.ship).stop();

        this.healthBar = new HealthBar(this, this.effects.maxHealth);
        this.bullets = this.physics.add.group({ classType: Bullet, maxSize: 45, runChildUpdate: true });
        this.asteroids = this.physics.add.group({ classType: Asteroid, maxSize: 45, runChildUpdate: true });
        this.astronauts = this.physics.add.group({ classType: Astronaut, maxSize: 12, runChildUpdate: true });

        this.physics.add.overlap(this.bullets, this.asteroids, (bullet, asteroid) => this.hitAsteroid(bullet, asteroid));
        this.physics.add.overlap(this.ship, this.asteroids, (_ship, asteroid) => this.hitShip(asteroid));

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
        this.add.text(84, 42, `MISSION ${this.level.id} • ${this.level.name}`, textStyle(18, '#aeb8da')).setScrollFactor(0).setDepth(2000);
        this.scoreText = this.add.text(GAME_WIDTH - 84, 18, 'SCORE 0', textStyle(25)).setOrigin(1, 0).setScrollFactor(0).setDepth(2000);
        this.objectiveText = this.add.text(GAME_WIDTH - 84, 50, `TARGET 0/${this.level.targetKills}`, textStyle(20, '#ffd166')).setOrigin(1, 0).setScrollFactor(0).setDepth(2000);
        this.ammoText = this.add.text(GAME_CENTER_X, 20, `AMMO ${this.totalBullets}`, textStyle(22, '#ffffff')).setOrigin(0.5, 0).setScrollFactor(0).setDepth(2000);
        this.pauseButton = this.add.circle(GAME_CENTER_X, 64, 25, COLORS.panelDark, 0.8).setStrokeStyle(2, COLORS.cyan, 0.7)
            .setScrollFactor(0).setDepth(3000).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.togglePause());
        this.add.text(GAME_CENTER_X, 64, 'Ⅱ', textStyle(19)).setOrigin(0.5).setScrollFactor(0).setDepth(3001);
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
            if (!this.accelerationSound?.isPlaying) {
                this.accelerationSound = this.sound.add('accelerationSound', { volume: 0.35, loop: true });
                this.accelerationSound.play();
            }
        } else {
            this.ship.setAcceleration(0);
            this.thrustEmitter.stop();
            this.accelerationSound?.stop();
        }
        if (fire && time >= this.lastFired) this.fire(time);

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
        if (this.totalBullets <= 0) return;
        const bullet = this.bullets.get();
        if (!bullet) return;
        bullet.fire(this.ship);
        this.totalBullets -= 1;
        this.lastFired = time + this.effects.fireCooldown;
        this.sound.play(`pew${Phaser.Math.Between(1, 3)}`, { volume: 0.55 });
        this.refreshHud();
    }

    spawnAsteroid(time) {
        const asteroid = this.asteroids.get();
        if (!asteroid) return;
        asteroid.body.allowGravity = false;
        asteroid.show(this.ship, this.level.asteroidSpeed + Math.floor(this.kills * 1.4));
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
        if (!asteroid.destroyMe()) return;
        bullet.disableBody(true, true);
        this.kills += 1;
        this.score += 30 + this.level.id * 5;
        this.totalBullets += 3;
        this.sound.play('explosion', { volume: 0.6 });
        this.refreshHud();
        if (this.kills >= this.level.targetKills) this.finish(true);
    }

    hitShip(asteroid) {
        if (!asteroid.destroyMe()) return;
        const damage = Math.max(5, this.level.collisionDamage - this.effects.collisionReduction);
        this.healthBar.decreaseHealth(damage);
        this.totalBullets += 2;
        this.cameras.main.shake(130, 0.012);
        this.sound.play('hitSound', { volume: 0.7 });
        if (playerProfile.data.settings.vibration) navigator.vibrate?.(45);
        this.refreshHud();
        if (this.healthBar.getHealth() <= 0) this.finish(false);
    }

    refreshHud() {
        this.scoreText.setText(`SCORE ${Math.floor(this.score)}`);
        this.objectiveText.setText(`TARGET ${this.kills}/${this.level.targetKills}`);
        this.ammoText.setText(`AMMO ${this.totalBullets}`);
    }

    togglePause() {
        if (this.ending) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.physics.world.pause();
            this.themeMusic.pause();
            this.touch.reset();
            this.accelerationSound?.stop();
            this.thrustEmitter.stop();
            this.pauseOverlay = this.add.container(GAME_CENTER_X, GAME_CENTER_Y).setScrollFactor(0).setDepth(5000);
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
        if (!victory) this.sound.play('deathSound', { volume: 0.75 });
        const seconds = Math.max(1, Math.floor((this.time.now - this.runStartedAt) / 1000));
        this.time.delayedCall(victory ? 450 : 650, () => this.scene.start('end', {
            victory, score: Math.floor(this.score), kills: this.kills, seconds, levelId: this.level.id,
        }));
    }

    stopAudio() {
        this.themeMusic?.stop();
        this.accelerationSound?.stop();
    }
}
