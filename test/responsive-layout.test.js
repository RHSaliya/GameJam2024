import test from 'node:test';
import assert from 'node:assert/strict';
import {
    GAME_HEIGHT, GAME_WIDTH, MAX_RENDER_DIMENSION, MAX_RENDER_PIXELS,
    calculateViewportLayout,
} from '../src/config/layout.js';

const representativeScreens = [
    [480, 270, 2],       // compact 16:9 phone
    [915, 412, 3],       // modern ultrawide Android phone
    [1024, 768, 2],      // 4:3 tablet
    [1366, 1024, 2],     // large tablet
    [1920, 1080, 1],     // desktop / TV
    [3440, 1440, 1],     // ultrawide monitor
    [7680, 4320, 2],     // 8K high-density display
];

test('responsive camera always contains the complete authored game area', () => {
    representativeScreens.forEach(([width, height, pixelRatio]) => {
        const layout = calculateViewportLayout(width, height, pixelRatio);
        assert.ok(layout.cameraLeft <= 0);
        assert.ok(layout.cameraRight >= GAME_WIDTH);
        assert.ok(layout.cameraTop <= 0);
        assert.ok(layout.cameraBottom >= GAME_HEIGHT);
        assert.ok(layout.renderWidth > 0);
        assert.ok(layout.renderHeight > 0);
    });
});

test('tablets reveal extra vertical background while ultrawide screens reveal extra horizontal background', () => {
    const tablet = calculateViewportLayout(1024, 768, 2);
    assert.equal(Math.round(tablet.cameraWidth), GAME_WIDTH);
    assert.equal(Math.round(tablet.cameraHeight), 960);

    const ultrawide = calculateViewportLayout(2520, 1080, 1);
    assert.equal(Math.round(ultrawide.cameraHeight), GAME_HEIGHT);
    assert.equal(Math.round(ultrawide.cameraWidth), 1400);
});

test('CSS sizing remains density independent', () => {
    const standard = calculateViewportLayout(1280, 720, 1);
    const retina = calculateViewportLayout(1280, 720, 3);
    assert.ok(Math.abs(standard.cssContentScale - retina.cssContentScale) < 1e-9);
    assert.ok(Math.abs(standard.cameraWidth - retina.cameraWidth) < 1);
    assert.ok(Math.abs(standard.cameraHeight - retina.cameraHeight) < 1);
});

test('render buffers stay within mobile-safe GPU limits at extreme resolutions', () => {
    const layout = calculateViewportLayout(7680, 4320, 2);
    assert.ok(layout.renderWidth <= MAX_RENDER_DIMENSION);
    assert.ok(layout.renderHeight <= MAX_RENDER_DIMENSION);
    assert.ok(layout.renderWidth * layout.renderHeight <= MAX_RENDER_PIXELS);
});

test('portrait screens are detected while preserving the complete landscape canvas behind the rotate prompt', () => {
    const layout = calculateViewportLayout(390, 844, 3);
    assert.equal(layout.isPortrait, true);
    assert.ok(layout.cameraWidth >= GAME_WIDTH);
    assert.ok(layout.cameraHeight >= GAME_HEIGHT);
});
