import Phaser from 'phaser';

const ENEMY_TYPES = {
    drifter: { texture: 'asteroid1', tint: 0xffffff, hp: 1, speed: 1, scale: [0.3, 0.47], coins: 1, score: 35, steering: 0 },
    striker: { texture: 'asteroid2', tint: 0xff7777, hp: 1, speed: 1.55, scale: [0.22, 0.32], coins: 1, score: 55, steering: 0 },
    hunter: { texture: 'asteroid4', tint: 0x72ddf7, hp: 2, speed: 1.05, scale: [0.3, 0.4], coins: 2, score: 80, steering: 0.018 },
    juggernaut: { texture: 'asteroid5', tint: 0xd98cff, hp: 3, speed: 0.68, scale: [0.45, 0.55], coins: 4, score: 120, steering: 0.006 },
};

export default class Asteroid extends Phaser.Physics.Arcade.Image {
    constructor(scene) {
        super(scene, 0, 0, 'asteroid1');
        this.setDepth(100);
        this.exploding = false;
    }

    chooseType(levelId) {
        const roll = Math.random();
        if (levelId >= 4 && roll < 0.14) return 'juggernaut';
        if (levelId >= 2 && roll < 0.34) return 'hunter';
        if (roll < 0.58) return 'striker';
        return 'drifter';
    }

    show(ship, minSpeed = 100, levelId = 1) {
        this.exploding = false;
        this.ship = ship;
        this.enemyType = this.chooseType(levelId);
        this.definition = ENEMY_TYPES[this.enemyType];
        this.hp = this.definition.hp + (this.enemyType === 'juggernaut' && levelId >= 6 ? 1 : 0);
        this.maxHp = this.hp;
        this.coinValue = this.definition.coins;
        this.scoreValue = this.definition.score;
        this.setAlpha(1).setTint(this.definition.tint).setTexture(this.definition.texture);

        const camera = this.scene.cameras.main.worldView;
        const side = Phaser.Math.Between(0, 3);
        const padding = 120;
        let x = Phaser.Math.Between(camera.left - padding, camera.right + padding);
        let y = Phaser.Math.Between(camera.top - padding, camera.bottom + padding);
        if (side === 0) x = camera.left - padding;
        if (side === 1) x = camera.right + padding;
        if (side === 2) y = camera.top - padding;
        if (side === 3) y = camera.bottom + padding;

        this.setScale(Phaser.Math.FloatBetween(...this.definition.scale));
        this.enableBody(true, x, y, true, true);
        this.setMass(8 * this.scale);
        this.spawnTime = this.scene.time.now;
        this.moveSpeed = (minSpeed + Phaser.Math.Between(0, 70)) * this.definition.speed;
        const angle = Phaser.Math.Angle.Between(x, y, ship.x, ship.y);
        this.setRotation(angle);
        this.scene.physics.velocityFromRotation(angle, this.moveSpeed, this.body.velocity);
        this.setAngularVelocity(Phaser.Math.Between(-65, 65));
    }

    update(time) {
        if (!this.active || this.exploding) return;
        if (this.definition.steering > 0 && this.ship?.active) {
            const desired = new Phaser.Math.Vector2(this.ship.x - this.x, this.ship.y - this.y).normalize().scale(this.moveSpeed);
            this.body.velocity.lerp(desired, this.definition.steering);
        }
        if (time - this.spawnTime < 5000) return;
        const camera = this.scene.cameras.main.worldView;
        if (this.x < camera.left - 180 || this.x > camera.right + 180 || this.y < camera.top - 180 || this.y > camera.bottom + 180) {
            this.disableBody(true, true);
        }
    }

    takeHit() {
        if (!this.active || this.exploding) return { destroyed: false };
        this.hp -= 1;
        if (this.hp > 0) {
            this.scene.tweens.add({ targets: this, alpha: 0.35, duration: 55, yoyo: true });
            return { destroyed: false, hp: this.hp, maxHp: this.maxHp };
        }
        const x = this.x;
        const y = this.y;
        const coins = this.coinValue;
        const score = this.scoreValue;
        this.destroyMe();
        return { destroyed: true, x, y, coins, score, type: this.enemyType };
    }

    destroyMe() {
        if (!this.active || this.exploding) return false;
        this.exploding = true;
        this.body.enable = false;
        this.clearTint();
        ['destroy1', 'destroy2', 'destroy3'].forEach((texture, index) => this.scene.time.delayedCall(index * 65, () => {
            if (this.scene) this.setTexture(texture);
        }));
        this.scene.time.delayedCall(195, () => this.disableBody(true, true));
        return true;
    }
}
