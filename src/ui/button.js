import Phaser from 'phaser';
import { GAME_HEIGHT, watchResponsiveLayout } from '../config/layout.js';
import { playerProfile } from '../services/PlayerProfile.js';
import { COLORS } from './theme.js';
import { textStyle } from './text.js';
import { fadeToScene } from './transitions.js';

export function addButton(scene, x, y, label, onPress, options = {}) {
    const width = options.width || 220;
    const height = options.height || 50;
    const accentColor = options.accent || COLORS.cyan;
    const container = scene.add.container(x, y);
    let selected = false;

    const bgGraphics = scene.add.graphics();
    const drawButton = (hovered = false, pressed = false) => {
        bgGraphics.clear();
        const radius = 10;
        const fill = options.disabled
            ? 0x12162b
            : hovered
            ? Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(COLORS.panel),
                Phaser.Display.Color.ValueToColor(accentColor),
                100, 30
              ).color
            : (options.fill ?? COLORS.panel);

        const fillAlpha = options.disabled ? 0.4 : pressed ? 0.98 : 0.92;
        bgGraphics.fillStyle(fill, fillAlpha);
        bgGraphics.fillRoundedRect(-width / 2, -height / 2, width, height, radius);

        const strokeColor = options.disabled ? 0x3a4263 : accentColor;
        const strokeAlpha = options.disabled ? 0.3 : (hovered || selected) ? 0.95 : 0.65;
        const strokeWidth = (hovered || selected) ? 3 : 2;
        bgGraphics.lineStyle(strokeWidth, strokeColor, strokeAlpha);
        bgGraphics.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    };

    drawButton();

    const labelColor = options.disabled ? '#5a6385' : '#ffffff';
    const labelText = scene.add.text(0, 0, label, textStyle(options.fontSize || 24, labelColor))
        .setOrigin(0.5);

    container.add([bgGraphics, labelText]);
    container.setSize(width, height);

    if (!options.disabled) {
        container.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                drawButton(true, false);
                scene.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 120, ease: 'Quad.out' });
            })
            .on('pointerout', () => {
                drawButton(false, false);
                scene.tweens.add({ targets: container, scaleX: 1.0, scaleY: 1.0, duration: 140, ease: 'Quad.out' });
            })
            .on('pointerdown', pointer => {
                pointer.event?.preventDefault?.();
                drawButton(true, true);
                if (playerProfile.data.settings.vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
                    try { navigator.vibrate(10); } catch (_) {}
                }
                scene.tweens.add({ targets: container, scaleX: 0.96, scaleY: 0.96, duration: 80, ease: 'Quad.out' });
                onPress?.();
            })
            .on('pointerup', () => {
                drawButton(true, false);
                scene.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 100, ease: 'Quad.out' });
            });
    }

    container.background = bgGraphics;
    container.label = labelText;
    container.setSelected = value => {
        selected = Boolean(value);
        drawButton();
        return container;
    };
    return container;
}

export function addBackButton(scene, target = 'menu', data) {
    const button = addButton(scene, 92, GAME_HEIGHT - 36, '‹ BACK', () => fadeToScene(scene, target, data), {
        width: 125, height: 42, fontSize: 22, accent: COLORS.yellow,
    });
    watchResponsiveLayout(scene, layout => {
        if (button.active) button.setPosition(layout.safeLeft + 52, layout.safeBottom + 4);
    });
    return button;
}
