import Phaser from 'phaser';

export default class Coin extends Phaser.Physics.Arcade.Image {
    constructor(scene) {
        super(scene, 0, 0, 'coin');
        this.setDepth(120);
    }

    show(x, y, value, ship) {
        this.value = value;
        this.ship = ship;
        this.spawnTime = this.scene.time.now;
        this.enableBody(true, x, y, true, true);
        this.body.allowGravity = false;
        const size = value >= 3 ? 44 : 36;
        this.setAlpha(1).setDisplaySize(size, size);
        this.setAngularVelocity(Phaser.Math.Between(-180, 180));
        this.setVelocity(Phaser.Math.Between(-80, 80), Phaser.Math.Between(-80, 80));
    }

    update(time) {
        if (!this.active) return;
        const age = time - this.spawnTime;
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.ship.x, this.ship.y);
        if (age > 350 && distance < 250) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.ship.x, this.ship.y);
            this.scene.physics.velocityFromRotation(angle, 330, this.body.velocity);
        }
        if (age > 6500) {
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                duration: 250,
                onComplete: () => this.disableBody(true, true),
            });
            this.spawnTime = Number.POSITIVE_INFINITY;
        }
    }

    collect() {
        if (!this.active) return 0;
        const value = this.value;
        this.disableBody(true, true);
        return value;
    }
}
