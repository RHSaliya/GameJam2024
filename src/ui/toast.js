import { GAME_CENTER_X, watchResponsiveLayout } from '../config/layout.js';
import { COLORS } from './theme.js';
import { textStyle } from './text.js';

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
