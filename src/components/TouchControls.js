import Phaser from 'phaser';
import { COLORS, textStyle } from '../ui';

export default class TouchControls {
    constructor(scene) {
        this.scene = scene;
        this.pressed = new Map();
        this.controls = [];
        scene.input.addPointer(4);
        this.createButton(112, 500, 58, 'LEFT', '↺');
        this.createButton(258, 500, 58, 'RIGHT', '↻');
        this.createButton(1025, 500, 62, 'THRUST', '▲');
        this.createButton(1170, 492, 70, 'FIRE', 'FIRE', COLORS.red);
        scene.input.on('pointerup', pointer => this.releasePointer(pointer.id));
        scene.input.on('pointerupoutside', pointer => this.releasePointer(pointer.id));
        scene.input.on('gameout', () => this.reset());
        scene.events.once('shutdown', () => this.destroy());
    }

    createButton(x, y, radius, action, label, accent = COLORS.cyan) {
        const circle = this.scene.add.circle(x, y, radius, COLORS.panelDark, 0.48)
            .setStrokeStyle(3, accent, 0.7)
            .setDepth(3000);
        const text = this.scene.add.text(x, y, label, textStyle(label.length > 2 ? 20 : 31))
            .setOrigin(0.5).setDepth(3001).setAlpha(0.82);
        const hitRadius = radius * 1.32;
        const hitZone = this.scene.add.zone(x, y, hitRadius * 2, hitRadius * 2)
            .setDepth(3002)
            .setInteractive(new Phaser.Geom.Circle(hitRadius, hitRadius, hitRadius), Phaser.Geom.Circle.Contains);
        hitZone.on('pointerdown', pointer => {
            this.pressed.set(pointer.id, action);
            circle.setFillStyle(accent, 0.4);
            circle.setScale(0.94);
        });
        hitZone.on('pointerup', pointer => this.releasePointer(pointer.id));
        this.controls.push({ circle, text, hitZone, action });
    }

    releasePointer(pointerId) {
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
        this.controls.forEach(item => item.circle.setFillStyle(COLORS.panelDark, 0.48).setScale(1));
    }
    setVisible(visible) { this.controls.forEach(item => { item.circle.setVisible(visible); item.text.setVisible(visible); item.hitZone.setVisible(visible); }); }
    destroy() {
        this.scene.input.off('gameout');
        this.controls.forEach(item => { item.circle.destroy(); item.text.destroy(); item.hitZone.destroy(); });
        this.controls = [];
    }
}
