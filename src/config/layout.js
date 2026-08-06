export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 600;
export const GAME_CENTER_X = GAME_WIDTH / 2;
export const GAME_CENTER_Y = GAME_HEIGHT / 2;
export const SAFE_EDGE = 40;
export const RESPONSIVE_LAYOUT_EVENT = 'responsive-layout';

// Keep very high-density and desktop displays sharp without creating a WebGL
// buffer large enough to exhaust mobile GPU memory on 4K/8K screens.
export const MAX_RENDER_DIMENSION = 4096;
export const MAX_RENDER_PIXELS = 10_000_000;

const finitePositive = (value, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
};

export function calculateViewportLayout(cssWidth, cssHeight, devicePixelRatio = 1) {
    const width = finitePositive(cssWidth, GAME_WIDTH);
    const height = finitePositive(cssHeight, GAME_HEIGHT);
    const requestedPixelRatio = finitePositive(devicePixelRatio, 1);
    const dimensionRatio = Math.min(MAX_RENDER_DIMENSION / width, MAX_RENDER_DIMENSION / height);
    const pixelBudgetRatio = Math.sqrt(MAX_RENDER_PIXELS / (width * height));
    const renderPixelRatio = Math.max(0.25, Math.min(requestedPixelRatio, dimensionRatio, pixelBudgetRatio));
    const renderWidth = Math.max(1, Math.round(width * renderPixelRatio));
    const renderHeight = Math.max(1, Math.round(height * renderPixelRatio));
    const renderScale = Math.min(renderWidth / GAME_WIDTH, renderHeight / GAME_HEIGHT);
    const cameraWidth = renderWidth / renderScale;
    const cameraHeight = renderHeight / renderScale;
    const cameraLeft = GAME_CENTER_X - cameraWidth / 2;
    const cameraTop = GAME_CENTER_Y - cameraHeight / 2;

    return Object.freeze({
        cssWidth: width,
        cssHeight: height,
        renderPixelRatio,
        renderWidth,
        renderHeight,
        renderScale,
        textResolution: Math.min(4, Math.max(1, renderScale)),
        cameraWidth,
        cameraHeight,
        cameraLeft,
        cameraRight: cameraLeft + cameraWidth,
        cameraTop,
        cameraBottom: cameraTop + cameraHeight,
        safeLeft: cameraLeft + SAFE_EDGE,
        safeRight: cameraLeft + cameraWidth - SAFE_EDGE,
        safeTop: cameraTop + SAFE_EDGE,
        safeBottom: cameraTop + cameraHeight - SAFE_EDGE,
        cssContentScale: Math.min(width / GAME_WIDTH, height / GAME_HEIGHT),
        isPortrait: height > width,
    });
}

function readCssViewport() {
    if (typeof window === 'undefined') return { width: GAME_WIDTH, height: GAME_HEIGHT, pixelRatio: 1 };
    const viewport = window.visualViewport;
    return {
        width: viewport?.width || window.innerWidth || window.screen?.width || GAME_WIDTH,
        height: viewport?.height || window.innerHeight || window.screen?.height || GAME_HEIGHT,
        pixelRatio: window.devicePixelRatio || 1,
    };
}

let currentLayout = (() => {
    const viewport = readCssViewport();
    return calculateViewportLayout(viewport.width, viewport.height, viewport.pixelRatio);
})();

export let RENDER_WIDTH = currentLayout.renderWidth;
export let RENDER_HEIGHT = currentLayout.renderHeight;
export let RENDER_SCALE = currentLayout.renderScale;
export let CAMERA_VIEW_WIDTH = currentLayout.cameraWidth;
export let CAMERA_VIEW_HEIGHT = currentLayout.cameraHeight;

function commitLayout(layout) {
    currentLayout = layout;
    RENDER_WIDTH = layout.renderWidth;
    RENDER_HEIGHT = layout.renderHeight;
    RENDER_SCALE = layout.renderScale;
    CAMERA_VIEW_WIDTH = layout.cameraWidth;
    CAMERA_VIEW_HEIGHT = layout.cameraHeight;
    return layout;
}

export function refreshViewportLayout(cssWidth, cssHeight, devicePixelRatio) {
    if (cssWidth === undefined || cssHeight === undefined) {
        const viewport = readCssViewport();
        return commitLayout(calculateViewportLayout(viewport.width, viewport.height, viewport.pixelRatio));
    }
    return commitLayout(calculateViewportLayout(cssWidth, cssHeight, devicePixelRatio));
}

export function getViewportLayout() {
    return currentLayout;
}

export function getPhysicalViewport() {
    const layout = refreshViewportLayout();
    return { width: layout.renderWidth, height: layout.renderHeight, layout };
}

export function configureSharpCamera(scene, layout = currentLayout) {
    const camera = scene.cameras.main;
    camera.setZoom(layout.renderScale);
    camera.centerOn(GAME_CENTER_X, GAME_CENTER_Y);
    camera.roundPixels = true;
    scene.children?.list?.forEach(child => child.setResolution?.(layout.textResolution));
    return layout;
}

export function applyResponsiveLayout(scene, layout = currentLayout) {
    configureSharpCamera(scene, layout);
    scene.events.emit(RESPONSIVE_LAYOUT_EVENT, layout);
    return layout;
}

export function watchResponsiveLayout(scene, callback) {
    const handler = layout => callback(layout);
    scene.events.on(RESPONSIVE_LAYOUT_EVENT, handler);
    scene.events.once('shutdown', () => scene.events.off(RESPONSIVE_LAYOUT_EVENT, handler));
    callback(currentLayout);
    return handler;
}
