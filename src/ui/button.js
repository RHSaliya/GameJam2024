import { GAME_HEIGHT, watchResponsiveLayout } from '../config/layout.js';
import { playerProfile } from '../services/PlayerProfile.js';
import { COLORS } from './theme.js';
import { textStyle } from './text.js';
import { fadeToScene } from './transitions.js';
import { resolveButtonSize, resolveButtonStyle } from './variants.js';

export function addButton(scene, x, y, label, onPress, options = {}) {
    const defaults = resolveButtonSize(options.size);
    const width = options.width || defaults.width;
    const height = options.height || defaults.height;
    const accentColor = options.accent || COLORS.cyan;
    const container = scene.add.container(x, y);
    let selected = false;

    const bgGraphics = scene.add.graphics();
    const drawButton = (hovered = false, pressed = false) => {
        bgGraphics.clear();
        const style = resolveButtonStyle({
            variant: options.variant, accent: accentColor, fill: options.fill,
            disabled: options.disabled, hovered, pressed, selected,
        });
        bgGraphics.fillStyle(style.fill, style.fillAlpha);
        bgGraphics.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        bgGraphics.lineStyle(style.strokeWidth, style.stroke, style.strokeAlpha);
        bgGraphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    };

    drawButton();

    const labelColor = resolveButtonStyle({
        variant: options.variant, accent: accentColor, disabled: options.disabled,
    }).labelColor;
    const labelText = scene.add.text(0, 0, label, textStyle(options.fontSize || defaults.fontSize, labelColor))
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
