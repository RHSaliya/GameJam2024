import Phaser from 'phaser';
import { chooseEnemyType, ENEMY_TYPES } from '../config/gameData';

export default class Asteroid extends Phaser.Physics.Arcade.Image {
    constructor(scene) {
        super(scene, 0, 0, 'enemy-drifter');
        this.setDepth(100);
        this.exploding = false;
    }

    show(ship, minSpeed = 100, levelId = 1, spawn) {
        // Clear any damage-flash tween left over from this body's previous life
        // in the pool so the respawned enemy cannot inherit its alpha.
        this.scene.tweens.killTweensOf(this);
        this.exploding = false;
        this.ship = ship;
        this.enemyType = chooseEnemyType(levelId);
        this.definition = ENEMY_TYPES[this.enemyType];
        this.hp = this.definition.hp + (this.enemyType === 'juggernaut' && levelId >= 6 ? 1 : 0);
        this.maxHp = this.hp;
        this.coinValue = this.definition.coins;
        this.scoreValue = this.definition.score;
        this.setAlpha(1).clearTint().setTexture(this.definition.texture);

        const camera = this.scene.cameras.main.worldView;
        const x = spawn?.x ?? camera.left - 120;
        const y = spawn?.y ?? Phaser.Math.Between(camera.top, camera.bottom);
        const targetX = spawn?.targetX ?? ship.x;
        const targetY = spawn?.targetY ?? ship.y;

        this.enableBody(true, x, y, true, true);
        const displaySize = Phaser.Math.Between(...this.definition.displaySize);
        this.setDisplaySize(displaySize, displaySize);
        this.body.setSize(this.width * 0.64, this.height * 0.68, true);
        this.setMass(8 * this.scaleX);
        this.spawnTime = this.scene.time.now;
        this.moveSpeed = (minSpeed + Phaser.Math.Between(0, 70)) * this.definition.speed;
        const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        this.setRotation(angle + Math.PI / 2);
        this.scene.physics.velocityFromRotation(angle, this.moveSpeed, this.body.velocity);
        this.setAngularVelocity(0);
    }

    update(time) {
        if (!this.active || this.exploding) return;
        if (this.definition.steering > 0 && this.ship?.active) {
            const desired = new Phaser.Math.Vector2(this.ship.x - this.x, this.ship.y - this.y).normalize().scale(this.moveSpeed);
            this.body.velocity.lerp(desired, this.definition.steering);
        }
        if (this.body.velocity.lengthSq() > 0) {
            const heading = this.body.velocity.angle() + Math.PI / 2;
            this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, heading, 0.045);
        }
        if (time - this.spawnTime < 5000) return;
        const camera = this.scene.cameras.main.worldView;
        if (this.x < camera.left - 180 || this.x > camera.right + 180 || this.y < camera.top - 180 || this.y > camera.bottom + 180) {
            this.disableBody(true, true);
        }
    }

    takeHit(damage = 1) {
        if (!this.active || this.exploding) return { destroyed: false };
        this.hp -= Math.max(1, Math.floor(Number(damage) || 1));
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
