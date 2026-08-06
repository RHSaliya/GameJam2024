import {
    CAMERA_VIEW_HEIGHT, CAMERA_VIEW_WIDTH, GAME_CENTER_X, GAME_HEIGHT, GAME_WIDTH,
    watchResponsiveLayout,
} from '../config/layout.js';
import { playMusic } from '../services/AudioService.js';
import { COLORS } from './theme.js';
import { textStyle } from './text.js';

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
