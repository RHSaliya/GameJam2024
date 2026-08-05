import Phaser from 'phaser';

export default class Bullet extends Phaser.Physics.Arcade.Image {
    constructor(scene) {
        super(scene, 0, 0, 'projectiles');
        this.setBlendMode(1).setDepth(10).setScale(0.5);
        this.speed = 1150;
    }

    fire(ship) {
        this.lifespan = 900;
        this.enableBody(true, ship.x, ship.y, true, true);
        this.setAngle(ship.body.rotation);
        const angle = Phaser.Math.DegToRad(ship.body.rotation);
        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
    }

    update(_time, delta) {
        if (!this.active) return;
        this.lifespan -= delta;
        if (this.lifespan <= 0) this.disableBody(true, true);
    }
}
