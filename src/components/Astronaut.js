import Phaser from 'phaser';

export default class Astronaut extends Phaser.Physics.Arcade.Image {
    constructor(scene) {
        super(scene, 0, 0, 'astronaut1');
        this.setDepth(15);
    }

    show(ship) {
        const camera = this.scene.cameras.main.worldView;
        const side = Phaser.Math.Between(0, 3);
        let x = Phaser.Math.Between(camera.left - 90, camera.right + 90);
        let y = Phaser.Math.Between(camera.top - 90, camera.bottom + 90);
        if (side === 0) x = camera.left - 90;
        if (side === 1) x = camera.right + 90;
        if (side === 2) y = camera.top - 90;
        if (side === 3) y = camera.bottom + 90;
        this.enableBody(true, x, y, true, true);
        this.setTexture(`astronaut${Phaser.Math.Between(1, 4)}`)
            .setScale(Phaser.Math.FloatBetween(0.12, 0.28))
            .setAlpha(Phaser.Math.FloatBetween(0.45, 0.72));
        this.spawnTime = this.scene.time.now;
        const angle = Phaser.Math.Angle.Between(x, y, ship.x, ship.y) + Phaser.Math.FloatBetween(-0.6, 0.6);
        this.scene.physics.velocityFromRotation(angle, Phaser.Math.Between(25, 55), this.body.velocity);
        this.setAngularVelocity(Phaser.Math.Between(-50, 50));
    }

    update(time) {
        if (!this.active || time - this.spawnTime < 7000) return;
        const camera = this.scene.cameras.main.worldView;
        if (this.x < camera.left - 140 || this.x > camera.right + 140 || this.y < camera.top - 140 || this.y > camera.bottom + 140) {
            this.disableBody(true, true);
        }
    }
}
