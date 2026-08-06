import { COLORS, RADII } from './theme.js';

const BUTTON_SIZES = {
    sm: { width: 150, height: 40, fontSize: 19 },
    md: { width: 220, height: 50, fontSize: 24 },
    lg: { width: 320, height: 60, fontSize: 28 },
};

export function resolveButtonSize(size = 'md') {
    return { ...(BUTTON_SIZES[size] || BUTTON_SIZES.md) };
}

// `secondary` is the historical look: every call site that passes no variant
// must come out of here byte-identical to the pre-split implementation.
export function resolveButtonStyle({
    variant = 'secondary', accent = COLORS.cyan, fill,
    disabled = false, hovered = false, pressed = false, selected = false,
} = {}) {
    if (disabled) {
        return {
            fill: 0x12162b, fillAlpha: 0.4,
            stroke: 0x3a4263, strokeAlpha: 0.3, strokeWidth: 2,
            labelColor: '#5a6385',
        };
    }

    const emphasised = hovered || selected;
    const base = {
        fillAlpha: pressed ? 0.98 : 0.92,
        strokeAlpha: emphasised ? 0.95 : 0.65,
        strokeWidth: emphasised ? 3 : 2,
        labelColor: '#ffffff',
    };

    if (variant === 'primary') {
        return { ...base, fill: accent, strokeAlpha: 0.95, strokeWidth: 3, stroke: accent, labelColor: '#06121a' };
    }
    if (variant === 'danger') {
        return { ...base, fill: fill ?? COLORS.panel, stroke: COLORS.red, strokeAlpha: emphasised ? 1 : 0.75 };
    }
    if (variant === 'ghost') {
        return { ...base, fill: fill ?? COLORS.panel, fillAlpha: pressed ? 0.35 : 0.18, stroke: accent };
    }
    return { ...base, fill: fill ?? COLORS.panel, stroke: accent };
}

export function resolvePanelStyle({ variant = 'default', accent = COLORS.cyan, alpha } = {}) {
    const base = {
        fill: COLORS.panelDark,
        fillAlpha: alpha ?? 0.92,
        stroke: accent,
        strokeAlpha: 0.45,
        strokeWidth: 2,
        radius: RADII.md,
    };
    if (variant === 'raised') return { ...base, fill: COLORS.panel, strokeAlpha: 0.7 };
    if (variant === 'inset') return { ...base, fill: COLORS.navy, strokeAlpha: 0.28 };
    if (variant === 'danger') return { ...base, stroke: COLORS.red, strokeAlpha: 0.6 };
    return base;
}
