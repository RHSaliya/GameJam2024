import { GAME_CENTER_X, GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from './config/layout';
import { playMusic } from './services/AudioService';

export const COLORS = {
    navy: 0x11162d,
    panel: 0x20284c,
    panelDark: 0x151b35,
    cyan: 0x5ce1e6,
    yellow: 0xffd166,
    green: 0x7ae582,
    red: 0xff6b6b,
    white: 0xffffff,
    muted: '#aeb8da',
};

export const textStyle = (size = 28, color = '#ffffff') => ({
    fontFamily: 'Caramel, "Arial Rounded MT Bold", Arial, sans-serif',
    fontStyle: 'bold',
    fontSize: `${size}px`,
    color,
    stroke: '#090c1a',
    strokeThickness: Math.max(1, Math.round(size / 18)),
    resolution: RENDER_SCALE,
});

export function addSpaceBackground(scene, key = 'menu', options = {}) {
    playMusic(scene, 'titleMusic', { volume: 0.42 });
    const width = GAME_WIDTH;
    const height = GAME_HEIGHT;
    const animated = options.animated === true;
    const bg = animated
        ? scene.add.tileSprite(width / 2, height / 2, width, height, key)
            .setTileScale(Math.max(width / 1024, height / 1024) * 1.08)
            .setAlpha(0.78)
        : scene.add.image(width / 2, height / 2, key).setDisplaySize(width, width).setAlpha(0.78);
    bg.setDepth(-2);

    if (animated) {
        scene.tweens.add({
            targets: bg,
            tilePositionX: 1024,
            tilePositionY: 1024,
            duration: 60000,
            ease: 'Linear',
            repeat: -1,
        });
    }

    scene.add.rectangle(width / 2, height / 2, width, height, COLORS.navy, 0.3).setDepth(-1);
    return bg;
}

export function addTitle(scene, title, subtitle = '') {
    const centerX = GAME_CENTER_X;
    scene.add.text(centerX, 38, title, textStyle(42, '#ffffff')).setOrigin(0.5);
    if (subtitle) scene.add.text(centerX, 74, subtitle, textStyle(20, COLORS.muted)).setOrigin(0.5);
}

export function addPanel(scene, x, y, width, height, alpha = 0.9) {
    return scene.add.rectangle(x, y, width, height, COLORS.panelDark, alpha)
        .setStrokeStyle(2, COLORS.cyan, 0.45);
}

export function addButton(scene, x, y, label, onPress, options = {}) {
    const width = options.width || 220;
    const height = options.height || 50;
    const fill = options.fill ?? COLORS.panel;
    const container = scene.add.container(x, y);
    const background = scene.add.rectangle(0, 0, width, height, fill, options.disabled ? 0.45 : 0.95)
        .setStrokeStyle(2, options.accent || COLORS.cyan, options.disabled ? 0.25 : 0.8);
    const labelText = scene.add.text(0, 0, label, textStyle(options.fontSize || 26, options.disabled ? '#7e87a6' : '#ffffff')).setOrigin(0.5);
    container.add([background, labelText]);
    container.setSize(width, height);
    if (!options.disabled) {
        container.setInteractive({ useHandCursor: true })
            .on('pointerover', () => background.setFillStyle(options.accent || COLORS.cyan, 0.28))
            .on('pointerout', () => background.setFillStyle(fill, 0.95))
            .on('pointerdown', pointer => {
                pointer.event?.preventDefault?.();
                background.setScale(0.97);
                onPress?.();
            })
            .on('pointerup', () => background.setScale(1));
    }
    container.background = background;
    container.label = labelText;
    return container;
}

export function addBackButton(scene, target = 'menu', data) {
    return addButton(scene, 86, GAME_HEIGHT - 35, '‹ BACK', () => scene.scene.start(target, data), {
        width: 120, height: 42, fontSize: 22,
    });
}

export function formatNumber(value) {
    return Math.max(0, Number(value) || 0).toLocaleString('en-US');
}

export function showToast(scene, message, color = COLORS.green) {
    const toast = scene.add.container(GAME_CENTER_X, 535).setDepth(5000);
    const bg = scene.add.rectangle(0, 0, 520, 48, COLORS.panelDark, 0.97).setStrokeStyle(2, color, 0.9);
    const text = scene.add.text(0, 0, message, textStyle(22)).setOrigin(0.5);
    toast.add([bg, text]);
    toast.setAlpha(0);
    scene.tweens.add({ targets: toast, alpha: 1, y: 515, duration: 180, yoyo: true, hold: 1500, onComplete: () => toast.destroy() });
}
