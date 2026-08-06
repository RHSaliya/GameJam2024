import { RENDER_SCALE } from '../config/layout.js';
import { TYPE } from './theme.js';

const toCssColor = color => (typeof color === 'number'
    ? `#${color.toString(16).padStart(6, '0')}`
    : color);

// Accepts either a raw pixel size (the original signature, still used across
// the scenes) or one of the six named scale tokens. Tokens additionally carry
// letter-spacing; numeric callers get exactly the object they always got.
export const textStyle = (sizeOrToken = 28, color = '#ffffff') => {
    if (typeof sizeOrToken === 'string' && !TYPE[sizeOrToken]) {
        console.warn(`textStyle: unknown size token "${sizeOrToken}", falling back to "body"`);
    }
    const token = typeof sizeOrToken === 'string' ? (TYPE[sizeOrToken] || TYPE.body) : undefined;
    const size = token ? token.size : sizeOrToken;
    const style = {
        fontFamily: 'Caramel, "Arial Rounded MT Bold", Arial, sans-serif',
        fontStyle: 'bold',
        fontSize: `${size}px`,
        color: toCssColor(color),
        stroke: '#080a18',
        strokeThickness: Math.max(2, Math.round(size / 16)),
        resolution: RENDER_SCALE,
    };
    if (token?.letterSpacing) style.letterSpacing = token.letterSpacing;
    return style;
};
