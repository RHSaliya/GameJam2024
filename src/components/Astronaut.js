import Phaser from 'phaser';

export default class Astronaut extends Phaser.Physics.Arcade.Image {
    constructor(scene) {
        super(scene, 0, 0, 'astronaut1');
        this.setDepth(15);
    }

    show(ship, spawn) {
        const camera = this.scene.cameras.main.worldView;
        const x = spawn?.x ?? camera.right + 90;
        const y = spawn?.y ?? Phaser.Math.Between(camera.top, camera.bottom);
        const targetX = spawn?.targetX ?? ship.x;
        const targetY = spawn?.targetY ?? ship.y;
        this.enableBody(true, x, y, true, true);
        this.setTexture(`astronaut${Phaser.Math.Between(1, 4)}`)
            .setScale(Phaser.Math.FloatBetween(0.12, 0.28))
            .setAlpha(Phaser.Math.FloatBetween(0.45, 0.72));
        this.spawnTime = this.scene.time.now;
        const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY) + Phaser.Math.FloatBetween(-0.25, 0.25);
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
