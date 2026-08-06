import { COLORS } from './theme.js';

// Each painter draws into a Graphics object already translated to (x, y),
// using a unit radius so callers control size in one place. Emoji were
// previously used for these and resolved to the host OS emoji font, which
// rendered full-colour and inconsistently across platforms.
const PAINTERS = {
    target(g, r, color) {
        g.lineStyle(Math.max(1.5, r * 0.18), color, 1);
        g.strokeCircle(0, 0, r);
        g.strokeCircle(0, 0, r * 0.45);
        g.lineBetween(-r * 1.35, 0, -r * 0.9, 0);
        g.lineBetween(r * 0.9, 0, r * 1.35, 0);
        g.lineBetween(0, -r * 1.35, 0, -r * 0.9);
        g.lineBetween(0, r * 0.9, 0, r * 1.35);
        g.fillStyle(color, 1).fillCircle(0, 0, r * 0.16);
    },
    coin(g, r, color) {
        g.fillStyle(color, 1).fillCircle(0, 0, r);
        g.lineStyle(Math.max(1.5, r * 0.16), COLORS.navy, 0.85).strokeCircle(0, 0, r * 0.62);
        g.fillStyle(0xffffff, 0.55).fillCircle(-r * 0.32, -r * 0.36, r * 0.2);
    },
    clock(g, r, color) {
        g.lineStyle(Math.max(1.5, r * 0.16), color, 1).strokeCircle(0, 0, r);
        g.lineBetween(0, 0, 0, -r * 0.55);
        g.lineBetween(0, 0, r * 0.42, 0);
    },
    gem(g, r, color) {
        g.fillStyle(color, 1).fillPoints([
            { x: 0, y: -r }, { x: r, y: 0 }, { x: 0, y: r }, { x: -r, y: 0 },
        ], true);
        g.fillStyle(0xffffff, 0.4).fillPoints([
            { x: 0, y: -r }, { x: r * 0.42, y: 0 }, { x: 0, y: r * 0.28 },
        ], true);
    },
    skull(g, r, color) {
        g.fillStyle(color, 1).fillCircle(0, -r * 0.18, r * 0.82);
        g.fillRect(-r * 0.42, r * 0.34, r * 0.84, r * 0.5);
        g.fillStyle(COLORS.navy, 1);
        g.fillCircle(-r * 0.34, -r * 0.22, r * 0.24);
        g.fillCircle(r * 0.34, -r * 0.22, r * 0.24);
    },
    lock(g, r, color) {
        g.lineStyle(Math.max(1.5, r * 0.2), color, 1);
        g.beginPath();
        g.arc(0, -r * 0.28, r * 0.48, Math.PI, 0);
        g.strokePath();
        g.fillStyle(color, 1).fillRoundedRect(-r * 0.72, -r * 0.28, r * 1.44, r * 1.12, r * 0.2);
    },
    star(g, r, color) {
        const points = [];
        for (let index = 0; index < 10; index += 1) {
            const radius = index % 2 === 0 ? r : r * 0.44;
            const angle = (Math.PI / 5) * index - Math.PI / 2;
            points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
        }
        g.fillStyle(color, 1).fillPoints(points, true);
    },
    chevron(g, r, color) {
        g.fillStyle(color, 1).fillPoints([
            { x: -r * 0.6, y: -r }, { x: r * 0.7, y: 0 }, { x: -r * 0.6, y: r },
            { x: -r * 0.2, y: 0 },
        ], true);
    },
    pause(g, r, color) {
        g.fillStyle(color, 1);
        g.fillRoundedRect(-r * 0.6, -r, r * 0.42, r * 2, r * 0.14);
        g.fillRoundedRect(r * 0.18, -r, r * 0.42, r * 2, r * 0.14);
    },
};

export function drawIcon(scene, name, x, y, size = 16, color = COLORS.white) {
    const graphics = scene.add.graphics({ x, y });
    const painter = PAINTERS[name];
    if (painter) painter(graphics, size / 2, color);
    return graphics;
}

export const ICON_NAMES = Object.keys(PAINTERS);
