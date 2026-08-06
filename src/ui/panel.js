import { resolvePanelStyle } from './variants.js';

export function addPanel(scene, x, y, width, height, alpha = 0.92, options = {}) {
    const container = scene.add.container(x, y);
    const style = resolvePanelStyle({ ...options, alpha });

    // Dark semi-transparent backdrop panel
    const bg = scene.add.graphics();
    bg.fillStyle(style.fill, style.fillAlpha);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, style.radius);
    bg.lineStyle(style.strokeWidth, style.stroke, style.strokeAlpha);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, style.radius);

    // Inner subtle glass glow line at top edge
    const glow = scene.add.graphics();
    glow.lineStyle(1.5, 0xffffff, 0.22);
    glow.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, 2, 4);

    container.add([bg, glow]);
    return container;
}
