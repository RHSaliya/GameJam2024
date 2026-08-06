export function formatNumber(value) {
    return Math.max(0, Number(value) || 0).toLocaleString('en-US');
}

export function formatTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(total / 60);
    return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}
