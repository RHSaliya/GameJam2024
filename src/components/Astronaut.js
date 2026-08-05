import Phaser from 'phaser';
import { getAstronautVariant } from '../config/gameData';

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
        this.variant = getAstronautVariant();
        this.enableBody(true, x, y, true, true);
        this.setTexture(this.variant.texture).setAlpha(1).clearTint();
        const displaySize = Phaser.Math.Between(72, 84);
        this.setDisplaySize(displaySize, displaySize);
        this.body.setSize(this.width * 0.52, this.height * 0.72, true);
        this.spawnTime = this.scene.time.now;
        const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY) + Phaser.Math.FloatBetween(-0.25, 0.25);
        this.scene.physics.velocityFromRotation(angle, Phaser.Math.Between(25, 55), this.body.velocity);
        this.setAngularVelocity(Phaser.Math.Between(-50, 50));
    }

    collect() {
        if (!this.active || !this.variant) return undefined;
        const rescue = { points: this.variant.score, role: this.variant.role };
        this.disableBody(true, true);
        return rescue;
    }

    update(time) {
        if (!this.active || time - this.spawnTime < 7000) return;
        const camera = this.scene.cameras.main.worldView;
        if (this.x < camera.left - 140 || this.x > camera.right + 140 || this.y < camera.top - 140 || this.y > camera.bottom + 140) {
            this.disableBody(true, true);
        }
    }
}
