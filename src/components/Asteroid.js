import Phaser from 'phaser';

export default class Asteroid extends Phaser.Physics.Arcade.Image {
    constructor(scene) {
        super(scene, 0, 0, 'asteroid1');
        this.setDepth(100);
        this.minSpeed = 100;
        this.exploding = false;
    }

    show(ship, minSpeed = 100) {
        this.exploding = false;
        this.setAlpha(1).clearTint();
        const camera = this.scene.cameras.main.worldView;
        const side = Phaser.Math.Between(0, 3);
        const padding = 120;
        let x = Phaser.Math.Between(camera.left - padding, camera.right + padding);
        let y = Phaser.Math.Between(camera.top - padding, camera.bottom + padding);
        if (side === 0) x = camera.left - padding;
        if (side === 1) x = camera.right + padding;
        if (side === 2) y = camera.top - padding;
        if (side === 3) y = camera.bottom + padding;

        const rare = Math.random() < 0.1;
        this.setTexture(rare ? 'asteroid5' : `asteroid${Phaser.Math.Between(1, 4)}`);
        this.setScale(rare ? 0.42 : Phaser.Math.FloatBetween(0.28, 0.48));
        this.enableBody(true, x, y, true, true);
        this.setMass(8 * this.scale);
        this.spawnTime = this.scene.time.now;
        const angle = Phaser.Math.Angle.Between(x, y, ship.x, ship.y);
        this.setRotation(angle);
        this.scene.physics.velocityFromRotation(angle, minSpeed + Phaser.Math.Between(0, 90), this.body.velocity);
    }

    update(time) {
        if (!this.active || this.exploding || time - this.spawnTime < 5000) return;
        const camera = this.scene.cameras.main.worldView;
        if (this.x < camera.left - 180 || this.x > camera.right + 180 || this.y < camera.top - 180 || this.y > camera.bottom + 180) {
            this.disableBody(true, true);
        }
    }

    destroyMe() {
        if (!this.active || this.exploding) return false;
        this.exploding = true;
        this.body.enable = false;
        const frames = ['destroy1', 'destroy2', 'destroy3'];
        frames.forEach((texture, index) => this.scene.time.delayedCall(index * 65, () => {
            if (this.scene) this.setTexture(texture);
        }));
        this.scene.time.delayedCall(frames.length * 65, () => this.disableBody(true, true));
        return true;
    }
}
