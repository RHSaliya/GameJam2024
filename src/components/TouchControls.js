import Phaser from 'phaser';
import { COLORS, textStyle } from '../ui';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/layout';
import { playerProfile } from '../services/PlayerProfile';

export default class TouchControls {
    constructor(scene) {
        this.scene = scene;
        this.pressed = new Map();
        this.controls = [];
        this.joystickState = { active: false, pointerId: null, baseX: 180, baseY: GAME_HEIGHT - 100, x: 180, y: GAME_HEIGHT - 100, angle: 0, distance: 0 };
        scene.input.addPointer(5);

        this.mode = playerProfile.data.settings.touchMode || 'joystick';
        if (this.mode === 'joystick') {
            this.createJoystick();
            // Right side buttons: Thrust and Fire
            const rightEdge = GAME_WIDTH;
            this.createButton(rightEdge - 210, GAME_HEIGHT - 90, 60, 'THRUST', '▲', COLORS.cyan);
            this.createButton(rightEdge - 85, GAME_HEIGHT - 95, 72, 'FIRE', 'FIRE', COLORS.red);
        } else {
            // Classic button layout anchored dynamically to screen boundaries
            const rightEdge = GAME_WIDTH;
            this.createButton(100, GAME_HEIGHT - 90, 58, 'LEFT', '↺');
            this.createButton(235, GAME_HEIGHT - 90, 58, 'RIGHT', '↻');
            this.createButton(rightEdge - 210, GAME_HEIGHT - 90, 62, 'THRUST', '▲');
            this.createButton(rightEdge - 85, GAME_HEIGHT - 95, 72, 'FIRE', 'FIRE', COLORS.red);
        }

        this.onPointerUpHandler = pointer => this.releasePointer(pointer.id);
        this.onPointerMoveHandler = pointer => this.updatePointer(pointer);
        scene.input.on('pointerup', this.onPointerUpHandler);
        scene.input.on('pointerupoutside', this.onPointerUpHandler);
        scene.input.on('pointermove', this.onPointerMoveHandler);
        scene.input.on('gameout', () => this.reset());
        scene.events.once('shutdown', () => this.destroy());
    }

    triggerHaptic() {
        if (playerProfile.data.settings.vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(12); } catch (_) {}
        }
    }

    createJoystick() {
        const baseX = 180;
        const baseY = GAME_HEIGHT - 100;
        const outerRadius = 80;
        const innerRadius = 38;

        const baseCircle = this.scene.add.circle(baseX, baseY, outerRadius, COLORS.panelDark, 0.45)
            .setStrokeStyle(3, COLORS.cyan, 0.6)
            .setDepth(3000);
        const stickCircle = this.scene.add.circle(baseX, baseY, innerRadius, COLORS.cyan, 0.6)
            .setStrokeStyle(2, COLORS.white, 0.8)
            .setDepth(3001);

        const hitRadius = outerRadius * 1.6;
        const hitZone = this.scene.add.zone(baseX, baseY, hitRadius * 2, hitRadius * 2)
            .setDepth(3002)
            .setInteractive(new Phaser.Geom.Circle(hitRadius, hitRadius, hitRadius), Phaser.Geom.Circle.Contains);

        hitZone.on('pointerdown', pointer => {
            this.joystickState.active = true;
            this.joystickState.pointerId = pointer.id;
            this.triggerHaptic();
            this.updateJoystick(pointer);
        });

        this.joystickElements = { baseCircle, stickCircle, hitZone, baseX, baseY, outerRadius };
    }

    updatePointer(pointer) {
        if (this.joystickState.active && this.joystickState.pointerId === pointer.id) {
            this.updateJoystick(pointer);
        }
    }

    updateJoystick(pointer) {
        if (!this.joystickElements) return;
        const { baseX, baseY, outerRadius, stickCircle } = this.joystickElements;
        const dx = pointer.x - baseX;
        const dy = pointer.y - baseY;
        const distance = Math.min(outerRadius, Math.hypot(dx, dy));
        const angle = Math.atan2(dy, dx);

        const stickX = baseX + Math.cos(angle) * distance;
        const stickY = baseY + Math.sin(angle) * distance;
        stickCircle.setPosition(stickX, stickY);

        this.joystickState.x = stickX;
        this.joystickState.y = stickY;
        this.joystickState.angle = angle;
        this.joystickState.distance = distance;

        // Map joystick direction strictly to ship rotation (LEFT / RIGHT). THRUST is only activated by the Accelerate button.
        if (distance > 12) {
            const targetRotation = angle + Math.PI / 2;
            const currentRotation = this.scene.ship ? this.scene.ship.rotation : 0;
            const diff = Phaser.Math.Angle.Wrap(targetRotation - currentRotation);

            if (diff < -0.12) {
                this.pressed.set(`joy_${pointer.id}_L`, 'LEFT');
                this.pressed.delete(`joy_${pointer.id}_R`);
            } else if (diff > 0.12) {
                this.pressed.set(`joy_${pointer.id}_R`, 'RIGHT');
                this.pressed.delete(`joy_${pointer.id}_L`);
            } else {
                this.pressed.delete(`joy_${pointer.id}_L`);
                this.pressed.delete(`joy_${pointer.id}_R`);
            }
        } else {
            this.pressed.delete(`joy_${pointer.id}_L`);
            this.pressed.delete(`joy_${pointer.id}_R`);
        }
        this.pressed.delete(`joy_${pointer.id}_T`);
    }

    createButton(x, y, radius, action, label, accent = COLORS.cyan) {
        const circle = this.scene.add.circle(x, y, radius, COLORS.panelDark, 0.48)
            .setStrokeStyle(3, accent, 0.7)
            .setDepth(3000);
        const text = this.scene.add.text(x, y, label, textStyle(label.length > 2 ? 20 : 31))
            .setOrigin(0.5).setDepth(3001).setAlpha(0.82);
        const hitRadius = radius * 1.35;
        const hitZone = this.scene.add.zone(x, y, hitRadius * 2, hitRadius * 2)
            .setDepth(3002)
            .setInteractive(new Phaser.Geom.Circle(hitRadius, hitRadius, hitRadius), Phaser.Geom.Circle.Contains);
        hitZone.on('pointerdown', pointer => {
            this.pressed.set(pointer.id, action);
            this.triggerHaptic();
            circle.setFillStyle(accent, 0.4);
            circle.setScale(0.94);
        });
        hitZone.on('pointerup', pointer => this.releasePointer(pointer.id));
        this.controls.push({ circle, text, hitZone, action, accent });
    }

    releasePointer(pointerId) {
        if (this.joystickState.pointerId === pointerId) {
            this.joystickState.active = false;
            this.joystickState.pointerId = null;
            this.joystickState.distance = 0;
            this.pressed.delete(`joy_${pointerId}_L`);
            this.pressed.delete(`joy_${pointerId}_R`);
            this.pressed.delete(`joy_${pointerId}_T`);
            if (this.joystickElements) {
                this.joystickElements.stickCircle.setPosition(this.joystickElements.baseX, this.joystickElements.baseY);
            }
        }
        const action = this.pressed.get(pointerId);
        if (!action) return;
        this.pressed.delete(pointerId);
        if (![...this.pressed.values()].includes(action)) {
            const control = this.controls.find(item => item.action === action);
            control?.circle.setFillStyle(COLORS.panelDark, 0.48).setScale(1);
        }
    }

    isDown(action) { return [...this.pressed.values()].includes(action); }

    reset() {
        this.pressed.clear();
        this.joystickState.active = false;
        this.joystickState.pointerId = null;
        this.controls.forEach(item => item.circle.setFillStyle(COLORS.panelDark, 0.48).setScale(1));
        if (this.joystickElements) {
            this.joystickElements.stickCircle.setPosition(this.joystickElements.baseX, this.joystickElements.baseY);
        }
    }

    setVisible(visible) {
        this.controls.forEach(item => { item.circle.setVisible(visible); item.text.setVisible(visible); item.hitZone.setVisible(visible); });
        if (this.joystickElements) {
            this.joystickElements.baseCircle.setVisible(visible);
            this.joystickElements.stickCircle.setVisible(visible);
            this.joystickElements.hitZone.setVisible(visible);
        }
    }

    destroy() {
        this.scene.input.off('gameout');
        if (this.onPointerUpHandler) this.scene.input.off('pointerup', this.onPointerUpHandler);
        if (this.onPointerMoveHandler) this.scene.input.off('pointermove', this.onPointerMoveHandler);
        this.controls.forEach(item => { item.circle.destroy(); item.text.destroy(); item.hitZone.destroy(); });
        this.controls = [];
        if (this.joystickElements) {
            this.joystickElements.baseCircle.destroy();
            this.joystickElements.stickCircle.destroy();
            this.joystickElements.hitZone.destroy();
        }
    }
}
