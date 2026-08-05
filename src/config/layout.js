export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 600;

const pixelRatio = window.devicePixelRatio || 1;
const viewportLongSide = Math.max(window.screen.width, window.screen.height);
const viewportShortSide = Math.min(window.screen.width, window.screen.height);
// Every scene is authored on this stable 1280x600 logical canvas. Physical
// displays may reveal extra background around it, but never shrink or crop UI.
export const GAME_CENTER_X = GAME_WIDTH / 2;
export const GAME_CENTER_Y = GAME_HEIGHT / 2;
export const SAFE_EDGE = 84;

// The WebGL backing buffer matches the device's physical landscape pixels.
export const RENDER_WIDTH = Math.round(viewportLongSide * pixelRatio);
export const RENDER_HEIGHT = Math.round(viewportShortSide * pixelRatio);
export const RENDER_SCALE = Math.min(RENDER_WIDTH / GAME_WIDTH, RENDER_HEIGHT / GAME_HEIGHT);
// Tablets expose extra height while ultrawide phones expose extra width.
// Background layers cover the complete camera without changing UI coordinates.
export const CAMERA_VIEW_WIDTH = RENDER_WIDTH / RENDER_SCALE;
export const CAMERA_VIEW_HEIGHT = RENDER_HEIGHT / RENDER_SCALE;

export function getPhysicalViewport() {
    const longSide = Math.max(window.innerWidth, window.innerHeight);
    const shortSide = Math.min(window.innerWidth, window.innerHeight);
    return {
        width: Math.round(longSide * pixelRatio),
        height: Math.round(shortSide * pixelRatio),
    };
}

export function configureSharpCamera(scene) {
    const camera = scene.cameras.main;
    camera.setZoom(RENDER_SCALE);
    camera.centerOn(GAME_CENTER_X, GAME_CENTER_Y);
    camera.roundPixels = true;
}
