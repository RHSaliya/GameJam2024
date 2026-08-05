const TWO_PI = Math.PI * 2;

export function generateEdgeSpawn({
    width,
    height,
    padding = 120,
    travelVelocity = { x: 0, y: 0 },
    forwardBias = 0.7,
    targetSpread = 0.22,
    random = Math.random,
}) {
    const centerX = width / 2;
    const centerY = height / 2;
    const travelSpeed = Math.hypot(travelVelocity.x, travelVelocity.y);
    const biased = travelSpeed > 40 && random() < forwardBias;
    const angle = biased
        ? Math.atan2(travelVelocity.y, travelVelocity.x) + (random() - 0.5) * Math.PI * 0.72
        : random() * TWO_PI;
    const edgePadding = padding * (0.85 + random() * 0.45);
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    const distanceToVerticalEdge = (width / 2 + edgePadding) / Math.max(0.0001, Math.abs(directionX));
    const distanceToHorizontalEdge = (height / 2 + edgePadding) / Math.max(0.0001, Math.abs(directionY));
    const distance = Math.min(distanceToVerticalEdge, distanceToHorizontalEdge);

    return {
        x: centerX + directionX * distance,
        y: centerY + directionY * distance,
        targetX: centerX + (random() - 0.5) * width * targetSpread * 2,
        targetY: centerY + (random() - 0.5) * height * targetSpread * 2,
        biased,
    };
}
