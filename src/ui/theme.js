export const COLORS = {
    navy: 0x0c1024,
    panel: 0x1a2244,
    panelDark: 0x121730,
    cyan: 0x5ce1e6,
    yellow: 0xffd166,
    green: 0x7ae582,
    red: 0xff6b6b,
    purple: 0xa06ee1,
    white: 0xffffff,
    muted: '#9ea9d1',
};

// Six named steps replacing the ~16 ad-hoc font sizes the scenes used to pick
// individually. letterSpacing is in pixels, matching Phaser's Text config, and
// is only applied to the small uppercase steps where tracking aids legibility.
export const TYPE = {
    display: { size: 44, letterSpacing: 0 },
    title: { size: 32, letterSpacing: 0 },
    heading: { size: 24, letterSpacing: 0 },
    body: { size: 18, letterSpacing: 0 },
    label: { size: 14, letterSpacing: 2.2 },
    caption: { size: 12, letterSpacing: 2.6 },
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 };

export const RADII = { sm: 8, md: 12, lg: 16, pill: 999 };
