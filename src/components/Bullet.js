import Phaser from 'phaser';

export default class Bullet extends Phaser.Physics.Arcade.Image {
    constructor(scene) {
        super(scene, 0, 0, 'projectile-pulse');
        this.setBlendMode(1).setDepth(10);
    }

    fire(ship, weapon, projectile, aimAssistAngle) {
        this.lifespan = 900;
        this.damage = projectile.damage || 1;
        this.remainingImpacts = (projectile.pierce || 0) + 1;
        this.homing = projectile.homing || 0;
        this.speed = projectile.speed || 1150;
        this.hitTargets = new WeakSet();
        const baseRotation = aimAssistAngle !== undefined ? aimAssistAngle : ship.rotation;
        const forwardAngle = baseRotation - Math.PI / 2 + Phaser.Math.DegToRad(projectile.angle || 0);
        const sideOffset = projectile.offset || 0;
        const x = ship.x - Math.sin(forwardAngle) * sideOffset;
        const y = ship.y + Math.cos(forwardAngle) * sideOffset;
        this.enableBody(true, x, y, true, true);
        this.body.allowGravity = false;
        this.setTexture(`projectile-${weapon.id}`)
            .setRotation(forwardAngle + Math.PI / 2)
            .setScale(projectile.scale || 0.5)
            .clearTint();
        this.scene.physics.velocityFromRotation(forwardAngle, this.speed, this.body.velocity);
    }

    registerHit(target) {
        if (!this.active || this.hitTargets.has(target)) return false;
        this.hitTargets.add(target);
        return true;
    }

    consumeImpact() {
        this.remainingImpacts -= 1;
        if (this.remainingImpacts > 0) return false;
        this.disableBody(true, true);
        return true;
    }

    update(_time, delta) {
        if (!this.active) return;
        if (this.homing > 0) this.steerTowardNearestTarget();
        this.lifespan -= delta;
        if (this.lifespan <= 0) this.disableBody(true, true);
    }

    steerTowardNearestTarget() {
        let nearest;
        let nearestDistance = 460;
        this.scene.asteroids?.getChildren().forEach(target => {
            if (!target.active || target.exploding) return;
            const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
            if (distance >= nearestDistance) return;
            nearest = target;
            nearestDistance = distance;
        });
        if (!nearest) return;
        const desired = new Phaser.Math.Vector2(nearest.x - this.x, nearest.y - this.y).normalize().scale(this.speed);
        this.body.velocity.lerp(desired, this.homing);
        this.setRotation(this.body.velocity.angle() + Math.PI / 2);
    }
}
