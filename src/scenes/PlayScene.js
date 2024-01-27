import Phaser from 'phaser';
import HealthBar from '../components/HealthBar';
import Bullet from '../components/Bullet';
import Asteroids from '../components/Asteroids';
import PlayerScore from '../components/PlayerScore';

export default class PlayScene extends Phaser.Scene {
    lastFired = 0;
    lastAsteroid = 3000;
    fireChange = -1
    bulletSoundIndex = 0;
    bulletSoundTimes = [0, 3000, 6000];

    constructor() {
        super('play');
    }

    preload() {
        this.load.image('background-play', '/assets/space/nebula.jpg');
        this.load.image('asteroid1', '/assets/asteroid1.png');
        this.load.image('stars', '/assets/space/stars.png');
        this.load.image('ship', '/assets/space/ship.png');
        this.load.atlas('space', '/assets/space/space.png', '/assets/space/space.json');
        this.load.audio('Pew1', 'assets/Sound/Pew1.wav');
        this.load.audio('Pew2', 'assets/Sound/Pew2.wav');
        this.load.audio('Pew3', 'assets/Sound/Pew3.wav');
        this.load.audio('accelerationSound', 'assets/Sound/ShipAccelerate.wav');
    }

    create() {
        this.bg = this.add.tileSprite(400, 300, 800, 600, 'background-play').setScrollFactor(0);

        const emitter = this.add.particles(0, 0, 'space', {
            frame: 'red',
            speed: 100,
            lifespan: {
                onEmit: (particle, key, t, value) => {
                    return Phaser.Math.Percent(this.ship.body.speed, 0, 300) * 2000;
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
            scale: { start: 0.6, end: 0 },
            blendMode: 'ADD'
        });

        this.ship = this.physics.add.image(10, 10, 'ship')
            .setDepth(20);
        this.ship.body.allowGravity = false;
        this.ship.body.setMaxVelocity(200);
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
            classType: Asteroids,
            maxSize: 20,
            runChildUpdate: true
        });

        this.physics.add.collider(this.bullets, this.asteroids, (bullet, asteroid) => {
            bullet.destroy();
            asteroid.destroy();
            this.playerScore.addScore(10);
        });

        this.physics.add.collider(this.ship, this.asteroids, (ship, asteroid) => {
            this.healthBar.decreaseHealth(25);
            asteroid.destroy();
            if (this.healthBar.getHealth() <= 0) {
                this.scene.start('end', {
                    totalScore:
                        this.playerScore.getScore()
                });
            }
        });
        const buttonStyle = {
            fill: '#ffffff',
            fontSize: 45,
            fontFamily: 'Caramel',
        }

        const buttonHoverStyle = {
            fill: '#ff0',
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

    }

    update(time, delta) {
        const { left, right, up, left_a, right_d, up_w, enter, space } = this.keys;
        this.visibleRect = this.cameras.main.worldView;

        const timeSinceLastFire = time - this.fireChange;

        // Update bullet sound index based on time
        if (timeSinceLastFire < this.bulletSoundTimes[1]) {
            this.bulletSoundIndex = 0; // Pew1
        } else if (timeSinceLastFire < this.bulletSoundTimes[2]) {
            this.bulletSoundIndex = 1; // Pew2
        } else {
            this.bulletSoundIndex = 2; // Pew3
        }

        if (left.isDown || left_a.isDown) {
            this.ship.setAngularVelocity(-150);
        }
        else if (right.isDown || right_d.isDown) {
            this.ship.setAngularVelocity(150);
        }
        else {
            this.ship.setAngularVelocity(0);
        }

        if (up.isDown || up_w.isDown) {
            this.physics.velocityFromRotation(this.ship.rotation, 600, this.ship.body.acceleration);
            // Play acceleration sound if it's not already playing
            if (!this.accelerationSound || !this.accelerationSound.isPlaying) {
                this.accelerationSound = this.sound.add('accelerationSound');
                this.accelerationSound.play();
            }
        }
        else {
            this.ship.body.setVelocity(50);
            this.physics.velocityFromRotation(this.ship.rotation, 0, this.ship.body.acceleration);
            // Stop the acceleration sound
            if (this.accelerationSound && this.accelerationSound.isPlaying) {
                this.accelerationSound.stop();
            }
        }


        if ((enter.isDown || space.isDown) && time > this.lastFired) {
            const bullet = this.bullets.get();

            if (this.fireChange == -1) {
                this.fireChange = time;
            }
            if (bullet) {
                bullet.fire(this.ship);

                // Play shooting sound based on bullet sound index
                const bulletSoundKey = `Pew${this.bulletSoundIndex + 1}`;
                this.sound.play(bulletSoundKey);

                //Playing shooting sound
                //this.sound.play('shootingSound');

                this.lastFired = time + 100;
            }
        } else if (enter.isUp && space.isUp) {
            this.fireChange = -1
        }

        if (time > this.lastAsteroid) {
            const asteroid = this.asteroids.get();

            if (asteroid) {
                asteroid.show(this.ship);
                asteroid.body.allowGravity = false;

                this.lastAsteroid = time + 3000;
            }
        }

    }
}