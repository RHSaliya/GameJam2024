import test from 'node:test';
import assert from 'node:assert/strict';
import { COLORS, RADII, SPACING, TYPE } from '../src/ui/theme.js';

const TOKENS = ['display', 'title', 'heading', 'body', 'label', 'caption'];

test('the palette keeps every colour the scenes already reference', () => {
    ['navy', 'panel', 'panelDark', 'cyan', 'yellow', 'green', 'red', 'purple', 'white', 'muted']
        .forEach(key => assert.ok(key in COLORS, `missing colour ${key}`));
    assert.equal(COLORS.cyan, 0x5ce1e6);
    assert.equal(COLORS.yellow, 0xffd166);
    assert.equal(COLORS.green, 0x7ae582);
    assert.equal(COLORS.red, 0xff6b6b);
    // `muted` is a CSS string because it is passed straight to text styles.
    assert.equal(COLORS.muted, '#9ea9d1');
});

test('the type scale has exactly six descending steps', () => {
    assert.deepEqual(Object.keys(TYPE), TOKENS);
    const sizes = TOKENS.map(token => TYPE[token].size);
    assert.deepEqual(sizes, [44, 32, 24, 18, 14, 12]);
    sizes.slice(1).forEach((size, index) => assert.ok(size < sizes[index], 'sizes must descend'));
});

test('only the small uppercase steps carry letter-spacing', () => {
    ['display', 'title', 'heading', 'body'].forEach(token => assert.equal(TYPE[token].letterSpacing, 0));
    assert.ok(TYPE.label.letterSpacing > 0);
    assert.ok(TYPE.caption.letterSpacing > TYPE.label.letterSpacing);
});

test('spacing and radii are positive and ordered', () => {
    const spacing = Object.values(SPACING);
    spacing.slice(1).forEach((value, index) => assert.ok(value > spacing[index]));
    assert.ok(Object.values(RADII).every(value => value > 0));
});
