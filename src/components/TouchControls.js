import Phaser from 'phaser';
import { COLORS, textStyle } from '../ui';
import { GAME_HEIGHT, GAME_WIDTH, watchResponsiveLayout } from '../config/layout';
import { playerProfile } from '../services/PlayerProfile';

export default class TouchControls {
    constructor(scene) {
        this.scene = scene;
        this.pressed = new Map();
        this.controls = [];
        this.joystickState = { active: false, pointerId: null, baseX: 155, baseY: GAME_HEIGHT - 86, x: 155, y: GAME_HEIGHT - 86, angle: 0, distance: 0 };
        scene.input.addPointer(5);

        this.mode = playerProfile.data.settings.touchMode || 'joystick';
        if (this.mode === 'joystick') {
            this.createJoystick();
            const rightEdge = GAME_WIDTH;
            this.createButton(rightEdge - 250, GAME_HEIGHT - 82, 55, 'THRUST', 'DRIVE', COLORS.cyan);
            this.createButton(rightEdge - 78, GAME_HEIGHT - 82, 62, 'FIRE', 'FIRE', COLORS.red);
        } else {
            const rightEdge = GAME_WIDTH;
            this.createButton(90, GAME_HEIGHT - 82, 52, 'LEFT', 'LEFT');
            this.createButton(220, GAME_HEIGHT - 82, 52, 'RIGHT', 'RIGHT');
            this.createButton(rightEdge - 250, GAME_HEIGHT - 82, 55, 'THRUST', 'DRIVE', COLORS.cyan);
            this.createButton(rightEdge - 78, GAME_HEIGHT - 82, 62, 'FIRE', 'FIRE', COLORS.red);
        }

        this.onPointerUpHandler = pointer => this.releasePointer(pointer.id);
        this.onPointerMoveHandler = pointer => this.updatePointer(pointer);
        this.onGameOutHandler = () => this.reset();
        scene.input.on('pointerup', this.onPointerUpHandler);
        scene.input.on('pointerupoutside', this.onPointerUpHandler);
        scene.input.on('pointermove', this.onPointerMoveHandler);
        scene.input.on('gameout', this.onGameOutHandler);
        scene.events.once('shutdown', () => this.destroy());
        watchResponsiveLayout(scene, layout => this.applyLayout(layout));
    }

    triggerHaptic() {
        if (playerProfile.data.settings.vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(12); } catch (_) {}
        }
    }

    createJoystick() {
        const baseX = this.joystickState.baseX;
        const baseY = this.joystickState.baseY;
        const outerRadius = 72;
        const innerRadius = 31;

        const halo = this.scene.add.circle(baseX, baseY, outerRadius + 11, COLORS.cyan, 0.06)
            .setStrokeStyle(1, COLORS.cyan, 0.16).setDepth(2998);
        const baseCircle = this.scene.add.circle(baseX, baseY, outerRadius, 0x080d20, 0.78)
            .setStrokeStyle(4, COLORS.cyan, 0.48).setDepth(2999);
        const guideCircle = this.scene.add.circle(baseX, baseY, 49, COLORS.panelDark, 0.28)
            .setStrokeStyle(2, COLORS.cyan, 0.18).setDepth(3000);
        const stickShadow = this.scene.add.circle(baseX, baseY + 4, innerRadius + 5, 0x000000, 0.34)
            .setDepth(3001);
        const stickCircle = this.scene.add.circle(baseX, baseY, innerRadius, COLORS.cyan, 0.72)
            .setStrokeStyle(3, COLORS.white, 0.82).setDepth(3002);
        const stickCore = this.scene.add.circle(baseX, baseY - 3, 13, COLORS.white, 0.16)
            .setDepth(3003);
        const label = this.scene.add.text(baseX, baseY + 52, 'STEER', textStyle(13, '#bffcff'))
            .setOrigin(0.5).setAlpha(0.78).setDepth(3004);

        const hitRadius = 92;
        const hitZone = this.scene.add.zone(baseX, baseY, hitRadius * 2, hitRadius * 2)
            .setDepth(3005)
            .setInteractive(new Phaser.Geom.Circle(hitRadius, hitRadius, hitRadius), Phaser.Geom.Circle.Contains);

        hitZone.on('pointerdown', pointer => {
            this.joystickState.active = true;
            this.joystickState.pointerId = pointer.id;
            this.triggerHaptic();
            halo.setAlpha(0.18);
            baseCircle.setStrokeStyle(4, COLORS.cyan, 0.9);
            this.updateJoystick(pointer);
        });

        this.joystickElements = {
            halo, baseCircle, guideCircle, stickShadow, stickCircle, stickCore, label, hitZone,
            baseX, baseY, outerRadius,
        };
    }

    updatePointer(pointer) {
        if (this.joystickState.active && this.joystickState.pointerId === pointer.id) {
            this.updateJoystick(pointer);
        }
    }

    updateJoystick(pointer) {
        if (!this.joystickElements) return;
        const { baseX, baseY, outerRadius, stickCircle, stickShadow, stickCore } = this.joystickElements;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
        const dx = worldPoint.x - baseX;
        const dy = worldPoint.y - baseY;
        const distance = Math.min(outerRadius, Math.hypot(dx, dy));
        const angle = Math.atan2(dy, dx);

        const stickX = baseX + Math.cos(angle) * distance;
        const stickY = baseY + Math.sin(angle) * distance;
        stickCircle.setPosition(stickX, stickY);
        stickShadow.setPosition(stickX, stickY + 4);
        stickCore.setPosition(stickX, stickY - 3);

        this.joystickState.x = stickX;
        this.joystickState.y = stickY;
        this.joystickState.angle = angle;
        this.joystickState.distance = distance;

        // The joystick is absolute aiming: its angle maps directly to ship facing.
        // DRIVE remains a separate button and is never inferred from stick distance.
    }

    createButton(x, y, radius, action, label, accent = COLORS.cyan) {
        const container = this.scene.add.container(x, y).setDepth(3000);
        const halo = this.scene.add.circle(0, 0, radius + 10, accent, 0.055)
            .setStrokeStyle(1, accent, 0.15);
        const outer = this.scene.add.circle(0, 0, radius + 3, 0x080d20, 0.8)
            .setStrokeStyle(4, accent, 0.68);
        const inner = this.scene.add.circle(0, 0, radius - 5, COLORS.panelDark, 0.9)
            .setStrokeStyle(2, COLORS.white, 0.12);
        const shine = this.scene.add.rectangle(-radius * 0.18, -radius * 0.52, radius * 0.7, 2, COLORS.white, 0.2)
            .setRotation(-0.08);
        const icon = this.createActionIcon(action, accent, radius);
        const text = this.scene.add.text(0, radius * 0.43, label, textStyle(label.length > 4 ? 13 : 16, '#ffffff'))
            .setOrigin(0.5).setAlpha(0.9);
        container.add([halo, outer, inner, shine, icon, text]);

        const setPressed = pressed => {
            this.scene.tweens.killTweensOf(container);
            container.setScale(pressed ? 0.93 : 1);
            halo.setAlpha(pressed ? 0.2 : 0.055);
            outer.setStrokeStyle(pressed ? 5 : 4, accent, pressed ? 1 : 0.68);
            inner.setFillStyle(pressed ? accent : COLORS.panelDark, pressed ? 0.3 : 0.9);
            icon.setScale(pressed ? 0.9 : 1);
        };

        const hitRadius = radius + 7;
        const hitZone = this.scene.add.zone(x, y, hitRadius * 2, hitRadius * 2)
            .setDepth(3006)
            .setInteractive(new Phaser.Geom.Circle(hitRadius, hitRadius, hitRadius), Phaser.Geom.Circle.Contains);
        hitZone.on('pointerdown', pointer => {
            pointer.event?.preventDefault?.();
            this.pressed.set(pointer.id, action);
            this.triggerHaptic();
            setPressed(true);
        });
        hitZone.on('pointerup', pointer => this.releasePointer(pointer.id));
        hitZone.on('pointerout', pointer => this.releasePointer(pointer.id));
        this.controls.push({ container, halo, outer, inner, icon, text, hitZone, action, accent, setPressed });
    }

    createActionIcon(action, accent, radius) {
        const graphics = this.scene.add.graphics();
        const iconY = -radius * 0.16;
        graphics.lineStyle(3, accent, 0.98);
        if (action === 'FIRE') {
            graphics.strokeCircle(0, iconY, 11);
            graphics.lineBetween(-20, iconY, -13, iconY);
            graphics.lineBetween(13, iconY, 20, iconY);
            graphics.lineBetween(0, iconY - 20, 0, iconY - 13);
            graphics.lineBetween(0, iconY + 13, 0, iconY + 20);
            graphics.fillStyle(COLORS.white, 0.95).fillCircle(0, iconY, 4);
        } else if (action === 'THRUST') {
            graphics.fillStyle(accent, 0.95).fillTriangle(0, iconY - 17, -13, iconY + 9, 13, iconY + 9);
            graphics.fillStyle(COLORS.white, 0.75).fillTriangle(0, iconY - 7, -5, iconY + 5, 5, iconY + 5);
            graphics.lineStyle(3, accent, 0.72).lineBetween(-8, iconY + 16, -3, iconY + 26);
            graphics.lineBetween(8, iconY + 16, 3, iconY + 26);
        } else {
            const symbol = action === 'LEFT' ? '‹' : '›';
            const direction = this.scene.add.text(0, iconY - 2, symbol, textStyle(42, '#ffffff')).setOrigin(0.5);
            return direction;
        }
        return graphics;
    }

    applyLayout(layout) {
        const left = layout.cameraLeft;
        const right = layout.cameraRight;
        const bottom = layout.cameraBottom;
        const controlY = bottom - 82;
        const positions = {
            LEFT: { x: left + 90, y: controlY },
            RIGHT: { x: left + 220, y: controlY },
            THRUST: { x: right - 250, y: controlY },
            FIRE: { x: right - 78, y: controlY },
        };
        this.controls.forEach(control => {
            const position = positions[control.action];
            if (!position) return;
            control.container.setPosition(position.x, position.y);
            control.hitZone.setPosition(position.x, position.y);
        });

        if (!this.joystickElements) return;
        const baseX = left + 155;
        const baseY = bottom - 86;
        const elements = this.joystickElements;
        elements.halo.setPosition(baseX, baseY);
        elements.baseCircle.setPosition(baseX, baseY);
        elements.guideCircle.setPosition(baseX, baseY);
        elements.stickShadow.setPosition(baseX, baseY + 4);
        elements.stickCircle.setPosition(baseX, baseY);
        elements.stickCore.setPosition(baseX, baseY - 3);
        elements.label.setPosition(baseX, baseY + 52);
        elements.hitZone.setPosition(baseX, baseY);
        elements.baseX = baseX;
        elements.baseY = baseY;
        this.joystickState = {
            ...this.joystickState,
            active: false,
            pointerId: null,
            baseX,
            baseY,
            x: baseX,
            y: baseY,
            distance: 0,
        };
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
                this.joystickElements.stickShadow.setPosition(this.joystickElements.baseX, this.joystickElements.baseY + 4);
                this.joystickElements.stickCore.setPosition(this.joystickElements.baseX, this.joystickElements.baseY - 3);
                this.joystickElements.halo.setAlpha(0.06);
                this.joystickElements.baseCircle.setStrokeStyle(4, COLORS.cyan, 0.48);
            }
        }
        const action = this.pressed.get(pointerId);
        if (!action) return;
        this.pressed.delete(pointerId);
        if (![...this.pressed.values()].includes(action)) {
            const control = this.controls.find(item => item.action === action);
            control?.setPressed(false);
        }
    }

    isDown(action) { return [...this.pressed.values()].includes(action); }

    getAimRotation() {
        if (!this.joystickState.active || this.joystickState.distance <= 12) return undefined;
        return Phaser.Math.Angle.Wrap(this.joystickState.angle + Math.PI / 2);
    }

    reset() {
        this.pressed.clear();
        this.joystickState.active = false;
        this.joystickState.pointerId = null;
        this.controls.forEach(item => item.setPressed(false));
        if (this.joystickElements) {
            this.joystickElements.stickCircle.setPosition(this.joystickElements.baseX, this.joystickElements.baseY);
            this.joystickElements.stickShadow.setPosition(this.joystickElements.baseX, this.joystickElements.baseY + 4);
            this.joystickElements.stickCore.setPosition(this.joystickElements.baseX, this.joystickElements.baseY - 3);
            this.joystickElements.halo.setAlpha(0.06);
            this.joystickElements.baseCircle.setStrokeStyle(4, COLORS.cyan, 0.48);
        }
    }

    setVisible(visible) {
        this.controls.forEach(item => { item.container.setVisible(visible); item.hitZone.setVisible(visible); });
        if (this.joystickElements) {
            ['halo', 'baseCircle', 'guideCircle', 'stickShadow', 'stickCircle', 'stickCore', 'label', 'hitZone']
                .forEach(key => this.joystickElements[key].setVisible(visible));
        }
    }

    destroy() {
        // Detach exactly the handlers this instance registered — the bare
        // off('gameout') removed every listener on the scene, and the
        // pointerupoutside binding was never removed at all.
        if (this.onGameOutHandler) this.scene.input.off('gameout', this.onGameOutHandler);
        if (this.onPointerUpHandler) {
            this.scene.input.off('pointerup', this.onPointerUpHandler);
            this.scene.input.off('pointerupoutside', this.onPointerUpHandler);
        }
        if (this.onPointerMoveHandler) this.scene.input.off('pointermove', this.onPointerMoveHandler);
        this.controls.forEach(item => { item.container.destroy(true); item.hitZone.destroy(); });
        this.controls = [];
        if (this.joystickElements) {
            ['halo', 'baseCircle', 'guideCircle', 'stickShadow', 'stickCircle', 'stickCore', 'label', 'hitZone']
                .forEach(key => this.joystickElements[key].destroy());
        }
    }
}
