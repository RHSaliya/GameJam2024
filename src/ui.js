import Phaser from 'phaser';
import {
    CAMERA_VIEW_HEIGHT, CAMERA_VIEW_WIDTH, GAME_CENTER_X, GAME_HEIGHT, GAME_WIDTH,
    RENDER_SCALE, watchResponsiveLayout,
} from './config/layout';
import { playMusic } from './services/AudioService';
import { playerProfile } from './services/PlayerProfile';

export const COLORS = {
    navy: 0x0c1024,
    panel: 0x1a2244,
    panelDark: 0x121730,
    cyan: 0x5ce1e6,
    yellow: 0xffd166,
    green: 0x7ae582,
    red: 0xff6b6b,
    purple: 0xa06ee1,
    white: 0xffffff,
    muted: '#9ea9d1',
};

export const textStyle = (size = 28, color = '#ffffff') => {
    const cssColor = typeof color === 'number'
        ? `#${color.toString(16).padStart(6, '0')}`
        : color;
    return {
        fontFamily: 'Caramel, "Arial Rounded MT Bold", Arial, sans-serif',
        fontStyle: 'bold',
        fontSize: `${size}px`,
        color: cssColor,
        stroke: '#080a18',
        strokeThickness: Math.max(2, Math.round(size / 16)),
        resolution: RENDER_SCALE,
    };
};

export function addSpaceBackground(scene, key = 'menu', options = {}) {
    playMusic(scene, 'titleMusic', { volume: 0.42 });
    const width = GAME_WIDTH;
    const height = GAME_HEIGHT;
    const backgroundExtent = Math.max(CAMERA_VIEW_WIDTH, CAMERA_VIEW_HEIGHT);
    const animated = options.animated === true;
    const bg = animated
        ? scene.add.tileSprite(width / 2, height / 2, CAMERA_VIEW_WIDTH, CAMERA_VIEW_HEIGHT, key)
            .setTileScale(Math.max(width / 1024, height / 1024) * 1.08)
            .setAlpha(0.78)
        : scene.add.image(width / 2, height / 2, key)
            .setDisplaySize(backgroundExtent, backgroundExtent).setAlpha(0.78);
    bg.setDepth(-2);

    if (animated) {
        scene.tweens.add({
            targets: bg,
            tilePositionX: 120,
            tilePositionY: 72,
            duration: 18000,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1,
        });
    }

    const veil = scene.add.rectangle(width / 2, height / 2, CAMERA_VIEW_WIDTH, CAMERA_VIEW_HEIGHT, COLORS.navy, 0.35).setDepth(-1);
    watchResponsiveLayout(scene, layout => {
        if (!bg.active) return;
        if (animated) bg.setSize(layout.cameraWidth, layout.cameraHeight);
        else {
            const extent = Math.max(layout.cameraWidth, layout.cameraHeight);
            bg.setDisplaySize(extent, extent);
        }
        veil.setSize(layout.cameraWidth, layout.cameraHeight);
    });
    return bg;
}

export function addBrandTitle(scene, x, y, options = {}) {
    const size = options.fontSize || 38;
    const gap = Math.round(size * 0.78);
    const container = scene.add.container(x, y);

    const top = scene.add.text(0, -gap / 2, 'QUARREL THROUGH', textStyle(size, '#ffffff'))
        .setOrigin(0.5)
        .setShadow(0, 4, 'rgba(0, 0, 0, 0.8)', 8, true, true);
    const bottom = scene.add.text(0, gap / 2, 'THE COSMOS', textStyle(Math.round(size * 0.94), '#ffd166'))
        .setOrigin(0.5)
        .setShadow(0, 4, 'rgba(92, 225, 230, 0.6)', 10, true, true);

    container.add([top, bottom]);

    scene.tweens.add({
        targets: container,
        y: y - 4,
        duration: 2200,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
    });

    return container;
}

export function addTitle(scene, title, subtitle = '') {
    const centerX = GAME_CENTER_X;
    const titleText = scene.add.text(centerX, 38, title, textStyle(42, '#ffffff'))
        .setOrigin(0.5)
        .setShadow(0, 3, '#080a18', 6);
    if (subtitle) {
        scene.add.text(centerX, 75, subtitle, textStyle(19, COLORS.muted))
            .setOrigin(0.5);
    }
    return titleText;
}

export function addPanel(scene, x, y, width, height, alpha = 0.92) {
    const container = scene.add.container(x, y);

    // Dark semi-transparent backdrop panel
    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.panelDark, alpha);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    bg.lineStyle(2, COLORS.cyan, 0.45);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

    // Inner subtle glass glow line at top edge
    const glow = scene.add.graphics();
    glow.lineStyle(1.5, 0xffffff, 0.22);
    glow.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, 2, 4);

    container.add([bg, glow]);
    return container;
}

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
    const button = addButton(scene, 92, GAME_HEIGHT - 36, '‹ BACK', () => scene.scene.start(target, data), {
        width: 125, height: 42, fontSize: 22, accent: COLORS.yellow,
    });
    watchResponsiveLayout(scene, layout => {
        if (button.active) button.setPosition(layout.safeLeft + 52, layout.safeBottom + 4);
    });
    return button;
}

export function formatNumber(value) {
    return Math.max(0, Number(value) || 0).toLocaleString('en-US');
}

export function showToast(scene, message, color = COLORS.green) {
    const toast = scene.add.container(GAME_CENTER_X, 535).setDepth(5000);
    const width = Math.max(380, message.length * 16 + 80);

    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.panelDark, 0.98);
    bg.fillRoundedRect(-width / 2, -24, width, 48, 12);
    bg.lineStyle(2.5, color, 0.95);
    bg.strokeRoundedRect(-width / 2, -24, width, 48, 12);

    const text = scene.add.text(0, 0, message, textStyle(21, '#ffffff')).setOrigin(0.5);
    toast.add([bg, text]);
    toast.setAlpha(0);
    const stopWatchingLayout = watchResponsiveLayout(scene, layout => {
        if (toast.active) toast.setPosition(GAME_CENTER_X, layout.safeBottom - 25);
    });

    scene.tweens.add({
        targets: toast,
        alpha: 1,
        y: '-=23',
        duration: 220,
        ease: 'Back.out',
        yoyo: true,
        hold: 1700,
        onComplete: () => {
            stopWatchingLayout();
            toast.destroy();
        },
    });
}
