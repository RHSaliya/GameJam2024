import Phaser from 'phaser';

export default class WeaponPowerUp extends Phaser.Physics.Arcade.Image {
    constructor(scene) {
        super(scene, 0, 0, 'weapon-core-pulse');
        this.setDepth(130);
    }

    show(x, y, weapon, ship) {
        this.weaponId = weapon.id;
        this.ship = ship;
        this.spawnTime = this.scene.time.now;
        this.setTexture(`weapon-core-${weapon.id}`);
        this.enableBody(true, x, y, true, true);
        this.body.allowGravity = false;
        this.setAlpha(1).setScale(0.78).setAngularVelocity(120);
        this.setVelocity(Phaser.Math.Between(-55, 55), Phaser.Math.Between(-55, 55));
    }

    update(time) {
        if (!this.active) return;
        const age = time - this.spawnTime;
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.ship.x, this.ship.y);
        if (age > 100 && distance < 320) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.ship.x, this.ship.y);
            const speed = Phaser.Math.Linear(420, 220, Math.min(1, distance / 320));
            this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
        }
        if (age <= 9000) return;
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 220,
            onComplete: () => this.disableBody(true, true),
        });
        this.spawnTime = Number.POSITIVE_INFINITY;
    }

    collect() {
        if (!this.active) return undefined;
        const weaponId = this.weaponId;
        this.disableBody(true, true);
        return weaponId;
    }
}
