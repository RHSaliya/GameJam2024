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
import { RENDER_HEIGHT, RENDER_WIDTH } from './config/layout'

const config = {
	type: Phaser.AUTO,
	parent: 'app',
	width: RENDER_WIDTH,
	height: RENDER_HEIGHT,
	physics: {
		default: 'arcade',
		arcade: {
			debug: false,
			gravity: { y: 200 },
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

export default game
