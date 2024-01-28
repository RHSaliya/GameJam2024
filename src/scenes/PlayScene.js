import Phaser from 'phaser';
import HealthBar from '../components/HealthBar';
import Bullet from '../components/Bullet';
import Asteroid from '../components/Asteroid';
import PlayerScore from '../components/PlayerScore';

export default class PlayScene extends Phaser.Scene {
    lastFired = 0;
    fireChange = -1;
    totalBullets = 50;
    bulletSoundIndex = 0;
    bulletSoundTimes = [0, 200, 500];

    constructor() {
        super('play');
    }
    preload() {
        this.load.image('background-play', '/assets/menu.png');
        this.load.image('asteroid1', '/assets/asteroid1.png');
        this.load.image('asteroid2', '/assets/asteroid2.png');
        this.load.image('asteroid3', '/assets/asteroid3.png');
        this.load.image('asteroid4', '/assets/asteroid4.png');
        this.load.image('stars', '/assets/space/stars.png');
        this.load.image('ship', '/assets/space/Spaceship.png');
        this.load.image('projectiles', '/assets/projectiles.png');
        this.load.atlas('space', '/assets/space/space.png', '/assets/space/space.json');
        this.load.audio('Pew1', 'assets/Sound/Pew1.wav');
        this.load.audio('Pew2', 'assets/Sound/Pew2.wav');
        this.load.audio('Pew3', 'assets/Sound/Pew3.wav');
        this.load.audio('accelerationSound', 'assets/Sound/ShipAccelerate.wav');
        this.load.audio('hitSound', 'assets/Sound/HitSound.wav');
        this.load.audio('deathSound', 'assets/Sound/DeathSound.wav');
        this.load.audio('explosionSound', 'assets/Sound/Explosion.wav')
    }

    create() {
        this.multiplierStartTime = this.game.getTime();
        this.scoreStartTime = this.multiplierStartTime;
        this.lastAsteroid = this.multiplierStartTime + 3000;
        this.totalBullets = 50;
        this.bg = this.add.tileSprite(400, 300, 800, 600, 'background-play').setScrollFactor(0);


        this.stars = this.add.tileSprite(400, 300, 800, 600, 'stars').setScrollFactor(0);

        const emitter = this.add.particles(0, 0, 'space', {
            frame: 'muzzleflash7',
            speed: 100,
            lifespan: {
                onEmit: (particle, key, t, value) => {
                    return Phaser.Math.Percent(this.ship.body.speed, 0, 300) * 500;
                }
            },
            alpha: {
                onEmit: (particle, key, t, value) => {
                    return Phaser.Math.Percent(this.ship.body.speed, 0, 300);
                }
            },
            angle: {
                onEmit: (particle, key, t, value) => {
                    return (this.ship.angle - 180) + Phaser.Math.Between(-10, 10);
                }
            },
            scale: { start: 0.3, end: 0 },
            blendMode: 'ADD'
        });

        this.ship = this.physics.add.image(10, 10, 'ship')
            .setDepth(20)
            .setScale(0.5)
            .setDrag(300)
            .setAngularDrag(400)
            .setMaxVelocity(600);
        this.cameras.main.startFollow(this.ship);
        emitter.startFollow(this.ship);

        this.healthBar = new HealthBar(this);
        this.playerScore = new PlayerScore(this);

        this.keys = {
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            left_a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right_d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            up_w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            enter: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
        }

        this.cameras.main.addListener(Phaser.Cameras.Scene2D.Events.FOLLOW_UPDATE, () => {
            this.healthBar.updateHealthBar();
            this.playerScore.drawScore();
        }, this);

        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 30,
            runChildUpdate: true
        });


        this.asteroids = this.physics.add.group({
            classType: Asteroid,
            maxSize: 20,
            runChildUpdate: true
        });

        this.physics.add.collider(this.bullets, this.asteroids, (bullet, asteroid) => {
            bullet.destroy();
            asteroid.destroy();
            this.totalBullets += 4;
            this.refreshBulletText();
            this.playerScore.addScore(10);

            //Play the explosion sound
            this.sound.play('explosionSound');
        });

        this.physics.add.collider(this.ship, this.asteroids, (ship, asteroid) => {
            this.healthBar.decreaseHealth(20);
            asteroid.destroy();

            //Play the hit sound
            if (this.healthBar.getHealth() >= 25) {
                this.sound.play('hitSound');
            }

            if (this.healthBar.getHealth() <= 0) {
                // Stop the acceleration sound if it's playing
                if (this.accelerationSound && this.accelerationSound.isPlaying) {
                    this.accelerationSound.stop();
                }

                this.sound.play('deathSound');
                this.scene.start('end', {
                    totalScore:
                        this.playerScore.getScore()
                });
            }
        });
        const buttonStyle = {
            color: '#ffffff',
            fontSize: 45,
            fontFamily: 'Caramel',
        }

        const buttonHoverStyle = {
            color: '#ff0',
            fontFamily: 'Caramel',
        }
        var BackButton = this.add.text(30, +this.sys.game.config.height - 50, 'Back', buttonStyle);
        BackButton.setInteractive(); // Enable button interactivity
        BackButton.setScrollFactor(0);
        BackButton.on('pointerover', () => BackButton.setStyle(buttonHoverStyle))
        BackButton.on('pointerout', () => BackButton.setStyle(buttonStyle))
        BackButton.on('pointerdown', function () {
            // Transition back to the main menu
            this.scene.start('menu');
        }, this);


        this.bulletText = this.add.text(30, 60, 'Bullets: ' + this.totalBullets, {
            fontFamily: 'Caramel',
            fontSize: '30px',
            color: '#ffffff'
        });
        this.bulletText.setScrollFactor(0);
    }

    multiplier = 1;

    update(time, delta) {
        const { left, right, left_a, right_d, enter, space } = this.keys;
        this.visibleRect = this.cameras.main.worldView;

        const timeSinceLastFire = time - this.fireChange;

        if (time > this.multiplierStartTime + 60000) {
            this.multiplier += 0.1;
            this.multiplierStartTime = time;
        }

        if (time - this.scoreStartTime > 1000) {
            this.playerScore.addScore(1 * this.multiplier);
            this.scoreStartTime = time;
        }

        // Update bullet sound index based on time
        if (timeSinceLastFire < this.bulletSoundTimes[1]) {
            this.bulletSoundIndex = 0; // Pew1
        } else if (timeSinceLastFire < this.bulletSoundTimes[2]) {
            this.bulletSoundIndex = 1; // Pew2
        } else {
            this.bulletSoundIndex = 2; // Pew3
        }

        if (left.isDown || left_a.isDown) {
            this.ship.setAngularVelocity(-150 * this.multiplier);
        }
        else if (right.isDown || right_d.isDown) {
            this.ship.setAngularVelocity(150 * this.multiplier);
        }
        else {
            this.ship.setAngularVelocity(0);
        }

        this.handleAcceleration(time)


        if ((enter.isDown || space.isDown) && time > this.lastFired) {
            const bullet = this.bullets.get();

            if (this.fireChange == -1) {
                this.fireChange = time;
            }
            if (bullet && this.totalBullets > 0) {
                this.totalBullets--;
                this.refreshBulletText();
                bullet.fire(this.ship);

                // Play shooting sound based on bullet sound index
                const bulletSoundKey = `Pew${this.bulletSoundIndex + 1}`;
                this.sound.play(bulletSoundKey);

                this.lastFired = time + 100;
            }
        } else if (enter.isUp && space.isUp) {
            this.fireChange = -1
        }

        if (time > this.lastAsteroid) {
            const asteroid = this.asteroids.get();

            if (asteroid) {
                asteroid.minSpeed = Math.min((asteroid.minSpeed + this.playerScore.getScore() / 5) * this.multiplier, 500);
                asteroid.show(this.ship);
                asteroid.body.allowGravity = false;

                this.lastAsteroid = time + Math.max(2000 - this.playerScore.getScore() / 5 * this.multiplier, 1000);
            }
        }

        this.bg.tilePositionX += this.ship.body.deltaX() * 0.5;
        this.bg.tilePositionY += this.ship.body.deltaY() * 0.5;

        this.stars.tilePositionX += this.ship.body.deltaX() * 2;
        this.stars.tilePositionY += this.ship.body.deltaY() * 2;
    }

    refreshBulletText() {
        this.bulletText.setText('Bullets: ' + this.totalBullets);
    }

    handleAcceleration(time) {
        const { up, up_w } = this.keys;
        if (up.isDown || up_w.isDown) {
            this.physics.velocityFromRotation(this.ship.rotation, 600, this.ship.body.acceleration);
            // Play acceleration sound if it's not already playing
            if (!this.accelerationSound || !this.accelerationSound.isPlaying) {
                this.accelerationSound = this.sound.add('accelerationSound');
                this.accelerationSound.play();
            }
        }
        else {
            this.ship.setAcceleration(0);
            // Stop the acceleration sound
            if (this.accelerationSound && this.accelerationSound.isPlaying) {
                this.accelerationSound.stop();
            }
        }
    }
}

