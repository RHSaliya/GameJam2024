import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const barrel = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');

const SUBMODULES = ['theme', 'format', 'text', 'panel', 'button', 'background', 'toast', 'transitions', 'icons'];

test('the barrel re-exports every ui submodule', () => {
    SUBMODULES.forEach(name => {
        assert.match(barrel, new RegExp(`export \\* from '\\./ui/${name}\\.js'`),
            `src/ui.js must re-export ./ui/${name}.js`);
    });
});

test('the barrel holds no implementation of its own', () => {
    const withoutExports = barrel.replace(/export \* from '[^']+';?/g, '').replace(/\/\/[^\n]*/g, '').trim();
    assert.equal(withoutExports, '', 'src/ui.js should contain only re-exports and comments');
});

test('every symbol the scenes import from ../ui is still provided', () => {
    const required = [
        'COLORS', 'textStyle', 'addSpaceBackground', 'addBrandTitle', 'addTitle',
        'addPanel', 'addButton', 'addBackButton', 'formatNumber', 'showToast',
    ];
    const sources = SUBMODULES
        .map(name => readFileSync(new URL(`../src/ui/${name}.js`, import.meta.url), 'utf8'))
        .join('\n');
    required.forEach(symbol => {
        assert.match(sources, new RegExp(`export (const|function|class)\\s+${symbol}\\b`),
            `no ui submodule exports ${symbol}`);
    });
});
