import Phaser from 'phaser'

import SplashScene from './scenes/SplashScene'
import MenuScene from './scenes/MenuScene'
import PlayScene from './scenes/PlayScene'
import CreditScene from './scenes/Credits'
import EndScene from './scenes/EndScene'
import OptionsScene from './scenes/OptionsScene'
import InstructionsScene from './scenes/InstructionsScene'
import LevelSelectScene from './scenes/LevelSelectScene'
import HangarScene from './scenes/HangarScene'
import AchievementsScene from './scenes/AchievementsScene'
import LeaderboardScene from './scenes/LeaderboardScene'
import { applyResponsiveLayout, getPhysicalViewport, RENDER_HEIGHT, RENDER_WIDTH } from './config/layout'

const config = {
	type: Phaser.AUTO,
	parent: 'app',
	width: RENDER_WIDTH,
	height: RENDER_HEIGHT,
	physics: {
		default: 'arcade',
		arcade: {
			debug: false,
			// Nothing in this game falls: every body opts out individually. A
			// non-zero world gravity only means a body that forgets to do so
			// silently drifts off the playfield.
			gravity: { y: 0 },
		},
	},
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		fullscreenTarget: 'app',
	},
	input: { activePointers: 5, touch: { capture: true } },
	render: { antialias: true, pixelArt: false },
}

const game = new Phaser.Game(config)
game.scene.add('splash', SplashScene)
game.scene.add('menu', MenuScene)
game.scene.add('play', PlayScene)
game.scene.add('credits', CreditScene)
game.scene.add('end', EndScene)
game.scene.add('options', OptionsScene)
game.scene.add('instructions', InstructionsScene)
game.scene.add('levels', LevelSelectScene)
game.scene.add('hangar', HangarScene)
game.scene.add('achievements', AchievementsScene)
game.scene.add('leaderboard', LeaderboardScene)

// VITE_START_SCENE is useful for native smoke tests and is omitted in normal builds.
game.scene.start(import.meta.env.VITE_START_SCENE || 'splash', { levelId: 1 })

// Native WebViews keep JavaScript alive when Android moves the app to the
// background. Explicitly pause every active sound so no audio leaks into other
// apps. Only looping music that was playing before the transition is resumed;
// one-shot effects and thrust audio are discarded.
let audioSuspendedByLifecycle = false
// Only sounds this handler paused may be resumed or stopped later. Anything the
// game itself paused (the pause menu mutes the music that way) has to be left
// exactly as it was, or resuming the run would find its music already stopped.
const lifecyclePaused = new Set()
const lifecycleMusic = new Set()

const suspendGameAudio = () => {
	if (audioSuspendedByLifecycle) return
	audioSuspendedByLifecycle = true
	lifecyclePaused.clear()
	lifecycleMusic.clear()
	game.sound.sounds.forEach(sound => {
		if (!sound.isPlaying) return
		if (sound.loop && !['accelerationSound', 'lowHealthAccelerationSound'].includes(sound.key)) lifecycleMusic.add(sound)
		lifecyclePaused.add(sound)
		sound.pause()
	})
}

const resumeGameAudio = () => {
	if (!audioSuspendedByLifecycle || document.visibilityState === 'hidden' || !document.hasFocus()) return
	audioSuspendedByLifecycle = false
	lifecyclePaused.forEach(sound => {
		if (!sound.isPaused) return
		if (lifecycleMusic.has(sound)) sound.resume()
		else sound.stop()
	})
	lifecyclePaused.clear()
	lifecycleMusic.clear()
}

document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'hidden') suspendGameAudio()
	else resumeGameAudio()
})
window.addEventListener('blur', suspendGameAudio)
window.addEventListener('focus', resumeGameAudio)
window.addEventListener('pagehide', suspendGameAudio)
window.addEventListener('pageshow', resumeGameAudio)

let resizeFrame;
const syncPhysicalResolution = () => {
	window.cancelAnimationFrame(resizeFrame)
	resizeFrame = window.requestAnimationFrame(() => {
		const viewport = getPhysicalViewport()
		if (game.scale.width !== viewport.width || game.scale.height !== viewport.height) {
			game.scale.setGameSize(viewport.width, viewport.height)
		}
		// Scale Manager updates camera viewports with the canvas size. Applying the
		// logical layout on the following frame keeps pointer mapping, HUD anchors,
		// backgrounds, and text resolution in sync with that new viewport.
		window.requestAnimationFrame(() => {
			game.scene.getScenes(true).forEach(scene => applyResponsiveLayout(scene, viewport.layout))
		})
	})
}
window.addEventListener('resize', syncPhysicalResolution)
window.addEventListener('orientationchange', syncPhysicalResolution)
window.visualViewport?.addEventListener('resize', syncPhysicalResolution)
window.setTimeout(syncPhysicalResolution, 200)
window.setTimeout(syncPhysicalResolution, 800)

export default game
