import test from 'node:test';
import assert from 'node:assert/strict';
import { textStyle } from '../src/ui/text.js';
import { TYPE } from '../src/ui/theme.js';

test('numeric sizes keep the exact style contract the scenes already rely on', () => {
    const style = textStyle(24, '#ffd166');
    assert.equal(style.fontSize, '24px');
    assert.equal(style.color, '#ffd166');
    assert.equal(style.fontStyle, 'bold');
    assert.ok(style.fontFamily.startsWith('Caramel'));
    assert.equal(style.stroke, '#080a18');
    // Math.max(2, Math.round(24 / 16)) === 2
    assert.equal(style.strokeThickness, 2);
    assert.equal(style.letterSpacing, undefined);
});

test('stroke thickness still scales with the font size', () => {
    assert.equal(textStyle(12).strokeThickness, 2);
    assert.equal(textStyle(44).strokeThickness, 3);
    assert.equal(textStyle(96).strokeThickness, 6);
});

test('numeric colours are converted to padded css hex', () => {
    assert.equal(textStyle(20, 0xffd166).color, '#ffd166');
    assert.equal(textStyle(20, 0x0c1024).color, '#0c1024');
    assert.equal(textStyle(20).color, '#ffffff');
});

test('named tokens resolve to their scale size and tracking', () => {
    assert.equal(textStyle('display').fontSize, `${TYPE.display.size}px`);
    assert.equal(textStyle('heading').fontSize, '24px');
    assert.equal(textStyle('label').letterSpacing, TYPE.label.letterSpacing);
    assert.equal(textStyle('caption').letterSpacing, TYPE.caption.letterSpacing);
    // Steps with no tracking must not emit the property at all, so their
    // rendering stays byte-identical to the pre-token behaviour.
    assert.equal(textStyle('body').letterSpacing, undefined);
});

test('an unknown token falls back to the body step instead of producing NaN', () => {
    assert.equal(textStyle('nonsense').fontSize, `${TYPE.body.size}px`);
});
