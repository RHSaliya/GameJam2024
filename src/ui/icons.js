// Replaced with the full vector icon set in Task 6.
export function drawIcon(scene, name, x, y, size = 16, color = 0xffffff) {
    return scene.add.graphics().fillStyle(color, 1).fillCircle(x, y, size / 2);
}
