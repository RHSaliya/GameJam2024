// Phaser keeps the outgoing scene updating during a camera fade, so the guard
// flag stops a second tap from queueing another start mid-fade — the same
// class of bug SplashScene's `launching` latch guards against (that one
// resets its flag at the top of create() instead of on shutdown, since it
// only ever needs to survive a single launch).
//
// Phaser reuses a Scene instance across restarts, so the flag MUST be cleared
// on shutdown. Without that reset the first navigation away from a scene would
// permanently wedge every later navigation from it.
export function fadeToScene(scene, key, data, duration = 220) {
    if (scene.__transitioning) return;
    scene.__transitioning = true;
    scene.events.once('shutdown', () => { scene.__transitioning = false; });
    scene.cameras.main.fadeOut(duration, 8, 11, 30);
    scene.cameras.main.once('camerafadeoutcomplete', () => {
        scene.scene.start(key, data);
    });
}
