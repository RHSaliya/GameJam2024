import { COLORS } from './theme.js';

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
