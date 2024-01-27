import Phaser from 'phaser'

class Bullet extends Phaser.Physics.Arcade.Image {
    constructor(scene) {
        super(scene, 0, 0, 'space', 'blaster');

        this.setBlendMode(1);
        this.setDepth(1);

        this.speed = 600;
        this.lifespan = 1000;

        this._temp = new Phaser.Math.Vector2();
    }

    fire(ship) {
        this.lifespan = 1000;

        this.setActive(true);
        this.setVisible(true);
        this.setAngle(ship.body.rotation);
        this.setPosition(ship.x, ship.y);
        this.body.reset(ship.x, ship.y);

        const angle = Phaser.Math.DegToRad(ship.body.rotation);

        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);

        this.body.velocity.x *= 2;
        this.body.velocity.y *= 2;
    }

    update(time, delta) {
        this.lifespan -= delta;

        if (this.lifespan <= 0) {
            this.setActive(false);
            this.setVisible(false);
            this.body.stop();
        }
    }
}

export default class AsteroidScene extends Phaser.Scene {
    lastFired = 0;

    preload() {
        this.load.image('background', '/assets/space/nebula.jpg');
        this.load.image('stars', '/assets/space/stars.png');
        this.load.atlas('space', '/assets/space/space.png', '/assets/space/space.json');
        this.load.image('asteroid1', '/assets/space/asteroid1.png');
        this.load.image('asteroid2', '/assets/space/asteroid2.png');
        this.load.image('asteroid3', '/assets/space/asteroid3.png');
        this.load.image('asteroid4', '/assets/space/asteroid4.png');

        
    }
    create() {
        //  Prepare some spritesheets and animations

        this.textures.addSpriteSheetFromAtlas('mine-sheet', { atlas: 'space', frame: 'mine', frameWidth: 64 });
        this.textures.addSpriteSheetFromAtlas('asteroid1-sheet', { atlas: 'space', frame: 'asteroid1', frameWidth: 96 });
        this.textures.addSpriteSheetFromAtlas('asteroid2-sheet', { atlas: 'space', frame: 'asteroid2', frameWidth: 96 });
        this.textures.addSpriteSheetFromAtlas('asteroid3-sheet', { atlas: 'space', frame: 'asteroid3', frameWidth: 96 });
        this.textures.addSpriteSheetFromAtlas('asteroid4-sheet', { atlas: 'space', frame: 'asteroid4', frameWidth: 64 });

        this.anims.create({ key: 'mine-anim', frames: this.anims.generateFrameNumbers('mine-sheet', { start: 0, end: 15 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid1-anim', frames: this.anims.generateFrameNumbers('asteroid1-sheet', { start: 0, end: 24 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid2-anim', frames: this.anims.generateFrameNumbers('asteroid2-sheet', { start: 0, end: 24 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid3-anim', frames: this.anims.generateFrameNumbers('asteroid3-sheet', { start: 0, end: 24 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid4-anim', frames: this.anims.generateFrameNumbers('asteroid4-sheet', { start: 0, end: 23 }), frameRate: 20, repeat: -1 });

        //  World size is 8000 x 6000
        this.bg = this.add.tileSprite(400, 300, 800, 600, 'background').setScrollFactor(0);

        //  Add our planets, etc
        this.add.image(512, 680, 'space', 'blue-planet').setOrigin(0).setScrollFactor(0.6);
        this.add.image(2833, 1246, 'space', 'brown-planet').setOrigin(0).setScrollFactor(0.6);
        this.add.image(3875, 531, 'space', 'sun').setOrigin(0).setScrollFactor(0.6);
        const galaxy = this.add.image(5345 + 1024, 327 + 1024, 'space', 'galaxy').setBlendMode(1).setScrollFactor(0.6);
        this.add.image(908, 3922, 'space', 'gas-giant').setOrigin(0).setScrollFactor(0.6);
        this.add.image(3140, 2974, 'space', 'brown-planet').setOrigin(0).setScrollFactor(0.6).setScale(0.8).setTint(0x882d2d);
        this.add.image(6052, 4280, 'space', 'purple-planet').setOrigin(0).setScrollFactor(0.6);

        //  Create some random asteroids
        this.visibleRect = this.cameras.main.worldView;
        console.log("width", this.visibleRect.width);
        console.log("height", this.visibleRect.height);
        console.log("x", this.cameras.main.worldView.x);
        console.log("y", this.visibleRect.y);
        console.log("right", this.visibleRect.right);
        console.log("bottom", this.visibleRect.bottom);
        console.log("visibleRect", this.visibleRect);
        this.asteroid1 = this.add.image(this.visibleRect.x, this.visibleRect.y, 'space', 'asteroid1');
        this.asteroid2 = this.add.image(Phaser.Math.Between(4000, 3000), Phaser.Math.Between(4000, 3000), 'space', 'asteroid2');


        const x = this.visibleRect.x + Phaser.Math.Between(0, this.visibleRect.width);
        const y = this.visibleRect.y + Phaser.Math.Between(0, this.visibleRect.height);

        // Create our asteroid1_sprite

        // this.asteroid1_sprite = this.add.sprite(x, y, "asteroid1_sprite");
        // this.anims.create({
        //     key: "asteroid1_anim",
        //     frames: this.anims.generateFrameNumbers('asteroid1-sheet', { start: 0, end: 24 }),
        //     frameRate: 20,
        //     repeat: -1
        // });
        // this.asteroid1_sprite.play("asteroid1_anim");








        //    this.asteroid2 = this.add.image(Phaser.Math.Between(0, 8000),Phaser.Math.Between(0, 6000),'space','asteroid3');
        //    this.asteroid3 = this.add.image(Phaser.Math.Between(0, 8000),Phaser.Math.Between(0, 6000),'space','asteroid4');
        //    this.asteroid4 = this.add.image(Phaser.Math.Between(0, 8000),Phaser.Math.Between(0, 6000),'space','asteroid1');
        //    this.asteroid5 = this.add.image(Phaser.Math.Between(0, 8000),Phaser.Math.Between(0, 6000),'space','asteroid2');
        //    this.asteroid6 = this.add.image(Phaser.Math.Between(0, 8000),Phaser.Math.Between(0, 6000),'space','asteroid3');
        //    this.asteroid7 = this.add.image(Phaser.Math.Between(0, 8000),Phaser.Math.Between(0, 6000),'space','asteroid4');
        //    this.asteroid8 = this.add.image(Phaser.Math.Between(0, 8000),Phaser.Math.Between(0, 6000),'space','asteroid1');
        //    this.asteroid9 = this.add.image(Phaser.Math.Between(0, 8000),Phaser.Math.Between(0, 6000),'space','asteroid2');




        for (let i = 0; i < 8; i++) {
            this.add.image(Phaser.Math.Between(0, 8000), Phaser.Math.Between(0, 6000), 'space', 'eyes').setBlendMode(1).setScrollFactor(0.8);
        }

        this.stars = this.add.tileSprite(400, 300, 800, 600, 'stars').setScrollFactor(0);

        const emitter = this.add.particles(0, 0, 'space', {
            frame: 'blue',
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

        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 30,
            runChildUpdate: true
        });

        this.ship = this.physics.add.image(4000, 3000, 'space', 'ship').setDepth(2);

        this.ship.setDrag(300);
        this.ship.setAngularDrag(400);
        this.ship.setMaxVelocity(600);

        emitter.startFollow(this.ship);

        this.cameras.main.startFollow(this.ship);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.fire = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.add.sprite(4300, 3000).play('asteroid1-anim');

        this.tweens.add({
            targets: galaxy,
            angle: 360,
            duration: 100000,
            ease: 'Linear',
            loop: -1
        });
    }

    moveAsteroid(asteroid, speed) {


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

    update(time, delta) {
        
        const { left, right, up } = this.cursors;


        this.moveAsteroid(this.asteroid1, 3);
        this.resetAsteroidPosition(this.asteroid1);

        if (left.isDown) {
            this.ship.setAngularVelocity(-150);
        }
        else if (right.isDown) {
            this.ship.setAngularVelocity(150);
        }
        else {
            this.ship.setAngularVelocity(0);
        }

        if (up.isDown) {
            this.physics.velocityFromRotation(this.ship.rotation, 600, this.ship.body.acceleration);
        }
        else {
            this.ship.setAcceleration(0);
        }

        if (this.fire.isDown && time > this.lastFired) {
            const bullet = this.bullets.get();

            if (bullet) {
                bullet.fire(this.ship);

                this.lastFired = time + 100;
            }
        }

        this.bg.tilePositionX += this.ship.body.deltaX() * 0.5;
        this.bg.tilePositionY += this.ship.body.deltaY() * 0.5;

        this.stars.tilePositionX += this.ship.body.deltaX() * 2;
        this.stars.tilePositionY += this.ship.body.deltaY() * 2;
    }
}
