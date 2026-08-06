import test from 'node:test';
import assert from 'node:assert/strict';
import { fadeToScene } from '../src/ui/transitions.js';

// Minimal hand-rolled fake exposing only the surface fadeToScene touches:
// scene.events.once(event, cb), scene.cameras.main.fadeOut(...),
// scene.cameras.main.once('camerafadeoutcomplete', cb), scene.scene.start(key, data).
// Listeners are `once` semantics (consumed on emit) to mirror Phaser's EventEmitter.
function createFakeScene() {
    const eventListeners = {};
    const cameraListeners = {};
    const startCalls = [];
    const fadeOutCalls = [];

    const emitOnce = (registry, event, ...args) => {
        const callbacks = registry[event] || [];
        registry[event] = [];
        callbacks.forEach(cb => cb(...args));
    };

    const scene = {
        events: {
            once(event, cb) { (eventListeners[event] ||= []).push(cb); },
            emit(event, ...args) { emitOnce(eventListeners, event, ...args); },
        },
        cameras: {
            main: {
                fadeOut(...args) { fadeOutCalls.push(args); },
                once(event, cb) { (cameraListeners[event] ||= []).push(cb); },
                emitFadeComplete() { emitOnce(cameraListeners, 'camerafadeoutcomplete'); },
            },
        },
        scene: {
            start(key, data) { startCalls.push({ key, data }); },
        },
    };

    return { scene, startCalls, fadeOutCalls };
}

test('a single call navigates once, only after the fade completes', () => {
    const { scene, startCalls } = createFakeScene();
    fadeToScene(scene, 'hangar', { foo: 1 });

    assert.equal(startCalls.length, 0, 'scene.scene.start must not fire before camerafadeoutcomplete');

    scene.cameras.main.emitFadeComplete();

    assert.equal(startCalls.length, 1);
    assert.deepEqual(startCalls[0], { key: 'hangar', data: { foo: 1 } });
});

test('a double-tap (or triple-tap) queues exactly one navigation, to the first destination', () => {
    const { scene, startCalls } = createFakeScene();
    fadeToScene(scene, 'hangar');
    fadeToScene(scene, 'achievements');
    fadeToScene(scene, 'options');

    scene.cameras.main.emitFadeComplete();

    assert.equal(startCalls.length, 1, 'only the first tap should ever reach scene.scene.start');
    assert.equal(startCalls[0].key, 'hangar');
});

// Phaser reuses Scene instances across restarts — the same `scene` object comes
// back every time the player revisits, say, the Hangar. If `__transitioning`
// were never cleared, the FIRST navigation away from a scene would set the guard
// permanently, and every later fadeToScene() call from that same instance would
// silently no-op — wedging the button dead for the rest of the session. This
// test exists to catch a regression of the `scene.events.once('shutdown', ...)`
// reset that prevents exactly that.
test('shutdown clears the guard so the same scene instance can navigate again later', () => {
    const { scene, startCalls } = createFakeScene();

    fadeToScene(scene, 'hangar');
    scene.cameras.main.emitFadeComplete();
    scene.events.emit('shutdown');

    fadeToScene(scene, 'hangar');
    scene.cameras.main.emitFadeComplete();

    assert.equal(startCalls.length, 2, 'a second visit after shutdown must be able to navigate again');
});

test('a second call while a transition is still in flight (no shutdown yet) does not queue a second start', () => {
    const { scene, startCalls } = createFakeScene();

    fadeToScene(scene, 'hangar');
    fadeToScene(scene, 'hangar'); // still mid-fade — shutdown has not fired

    scene.cameras.main.emitFadeComplete();

    assert.equal(startCalls.length, 1);
});

test('the default fade duration (220ms) is passed through to fadeOut', () => {
    const { scene, fadeOutCalls } = createFakeScene();
    fadeToScene(scene, 'hangar');

    assert.equal(fadeOutCalls.length, 1);
    assert.deepEqual(fadeOutCalls[0], [220, 8, 11, 30]);
});
