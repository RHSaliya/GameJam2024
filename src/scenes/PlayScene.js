import Phaser from 'phaser';
import HealthBar from '../components/HealthBar';
import Bullet from '../components/Bullet';

export default class PlayScene extends Phaser.Scene {
    lastFired = 0;
    lastAsteroid = 0;

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
            space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            enter: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
        }

        this.healthBar.decreaseHealth(0.1);
        this.cameras.main.addListener(Phaser.Cameras.Scene2D.Events.FOLLOW_UPDATE, () => {
            this.healthBar.updateHealthBar();
        }, this);

        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 30,
            runChildUpdate: true
        });
    }

    update(time, delta) {
        const { left, right, up, left_a, right_d, up_w, enter, space } = this.keys;
        this.visibleRect = this.cameras.main.worldView;

        //console.log("visibleRect",this.visibleRect);
        //this.asteroid1 = this.add.image(this.visibleRect.x, this.visibleRect.y, 'space', 'asteroid1');

        

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


        if ((enter.isDown || space.isDown) && time > this.lastFired) {
            console.log("fire");
            const bullet = this.bullets.get();

            if (bullet) {
                bullet.fire(this.ship);

                this.lastFired = time + 100;
            }
        }

        console.log("time", time);
        if(time > this.lastAsteroid){
            this.newAsteroid = this.add.image(Phaser.Math.Between(this.visibleRect.x, this.visibleRect.width), 
            Phaser.Math.Between(this.visibleRect.y, this.visibleRect.height), 'space', 'blue');
            this.lastAsteroid = time + 2000;
            this.moveAsteroid(this.newAsteroid, 3);
            this.resetAsteroidPosition(this.newAsteroid);
        }
        // this.moveAsteroid(this.lastAsteroid, 3);
        // this.resetAsteroidPosition(this.lastAsteroid);

    }

    moveAsteroid(asteroid, speed) {

        console.log("asteroid", asteroid);
        // increase the position of the asteroid on the vertical axis
        asteroid.y += speed;
        // if the asteroid hits the bottom of the screen call the reset function
        if (asteroid.y > this.visibleRect.height) {
            // 2.1 call a reset position function
            this.resetAsteroidPosition(asteroid);
        }
    }

    resetAsteroidPosition(asteroid) {
        if (asteroid.x > this.visibleRect.width) {
            asteroid.x = 0;
        } else if (asteroid.x < 0) {
            asteroid.x = this.visibleRect.width;
        }

        if (asteroid.y > this.visibleRect.height) {
            asteroid.y = 0;
        } else if (asteroid.y < 0) {
            asteroid.y = this.visibleRect.height;
        }
    }
}