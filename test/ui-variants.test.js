import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveButtonSize, resolveButtonStyle, resolvePanelStyle } from '../src/ui/variants.js';
import { COLORS } from '../src/ui/theme.js';

// These four assertions are the regression guard for every existing call site:
// no scene passes a variant yet, so the defaults must reproduce today's exact
// rendering values from the pre-split src/ui.js.
test('the default button variant reproduces the current styling exactly', () => {
    const resting = resolveButtonStyle({ accent: COLORS.cyan });
    assert.equal(resting.fill, COLORS.panel);
    assert.equal(resting.fillAlpha, 0.92);
    assert.equal(resting.stroke, COLORS.cyan);
    assert.equal(resting.strokeAlpha, 0.65);
    assert.equal(resting.strokeWidth, 2);
    assert.equal(resting.labelColor, '#ffffff');
});

test('the default button reproduces the current hover, press, selected and disabled states', () => {
    assert.equal(resolveButtonStyle({ accent: COLORS.cyan, pressed: true }).fillAlpha, 0.98);
    assert.equal(resolveButtonStyle({ accent: COLORS.cyan, hovered: true }).strokeAlpha, 0.95);
    assert.equal(resolveButtonStyle({ accent: COLORS.cyan, hovered: true }).strokeWidth, 3);
    assert.equal(resolveButtonStyle({ accent: COLORS.cyan, selected: true }).strokeWidth, 3);

    const disabled = resolveButtonStyle({ accent: COLORS.cyan, disabled: true });
    assert.equal(disabled.fill, 0x12162b);
    assert.equal(disabled.fillAlpha, 0.4);
    assert.equal(disabled.stroke, 0x3a4263);
    assert.equal(disabled.strokeAlpha, 0.3);
    assert.equal(disabled.labelColor, '#5a6385');
});

test('an explicit fill override still wins, as options.fill does today', () => {
    assert.equal(resolveButtonStyle({ accent: COLORS.cyan, fill: 0x123456 }).fill, 0x123456);
    // ...but never over a disabled button, which today forces its own fill.
    assert.equal(resolveButtonStyle({ accent: COLORS.cyan, fill: 0x123456, disabled: true }).fill, 0x12162b);
});

test('primary and danger read as stronger than secondary', () => {
    const primary = resolveButtonStyle({ variant: 'primary', accent: COLORS.cyan });
    assert.equal(primary.fill, COLORS.cyan);
    assert.ok(primary.strokeAlpha >= 0.9);
    // A filled accent button needs dark text to stay legible.
    assert.equal(primary.labelColor, '#06121a');

    const danger = resolveButtonStyle({ variant: 'danger', accent: COLORS.cyan });
    assert.equal(danger.stroke, COLORS.red, 'danger ignores the passed accent');

    const ghost = resolveButtonStyle({ variant: 'ghost', accent: COLORS.cyan });
    assert.ok(ghost.fillAlpha < 0.5, 'ghost is mostly transparent');
});

test('button sizes are ordered and md matches the current defaults', () => {
    assert.deepEqual(resolveButtonSize('md'), { width: 220, height: 50, fontSize: 24 });
    const [sm, md, lg] = ['sm', 'md', 'lg'].map(resolveButtonSize);
    assert.ok(sm.height < md.height && md.height < lg.height);
    assert.ok(sm.fontSize < md.fontSize && md.fontSize < lg.fontSize);
    assert.deepEqual(resolveButtonSize('nonsense'), resolveButtonSize('md'));
});

test('the default panel variant reproduces the current styling exactly', () => {
    const panel = resolvePanelStyle({});
    assert.equal(panel.fill, COLORS.panelDark);
    assert.equal(panel.fillAlpha, 0.92);
    assert.equal(panel.stroke, COLORS.cyan);
    assert.equal(panel.strokeAlpha, 0.45);
    assert.equal(panel.strokeWidth, 2);
    assert.equal(panel.radius, 12);
    // The explicit alpha argument every current call site passes must win.
    assert.equal(resolvePanelStyle({ alpha: 0.6 }).fillAlpha, 0.6);
});
