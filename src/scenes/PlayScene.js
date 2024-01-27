import Phaser from 'phaser';
import HealthBar from '../components/HealthBar';

export default class PlayScene extends Phaser.Scene {
    constructor() {
        super('play');
    }

    preload() {
        this.load.image('background-play', '/assets/space/nebula.jpg');
        this.load.image('stars', '/assets/space/stars.png');
        this.load.image('ship', '/assets/space/ship.png');
        this.load.atlas('space', '/assets/space/space.png', '/assets/space/space.json');
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

        this.keys = {
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            left_a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right_d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            up_w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        }

        this.healthBar.decreaseHealth(0.1);
        this.cameras.main.addListener(Phaser.Cameras.Scene2D.Events.FOLLOW_UPDATE, () => {
            this.healthBar.updateHealthBar();
        }, this);
    }

    update(time, delta) {
        const { left, right, up, left_a, right_d, up_w } = this.keys;

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
        }
        else {
            this.ship.body.setVelocity(0);
            this.physics.velocityFromRotation(0, 0, this.ship.body.acceleration);
        }

    }
}