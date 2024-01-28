import Phaser from 'phaser'

import HelloWorldScene from './HelloWorldScene'
import SplashScene from './scenes/SplashScene'
import MenuScene from './scenes/MenuScene'
import PlayScene from './scenes/PlayScene'
import CreditScene from './scenes/Credits'
import EndScene from './scenes/EndScene'
import OptionsScene from './scenes/OptionsScene'
import InstructionsScene from './scenes/InstructionsScene'
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';


const config = {
	type: Phaser.AUTO,
	parent: 'app',
	width: 800,
	height: 600,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 200 },
		},
	},
	scale: { 
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH
	},
	plugins: {
		scene: [{
			key: 'rexUI',
			plugin: UIPlugin,
			mapping: 'rexUI'
		},
	]
}	
}

const game = new Phaser.Game(config)
const totalScore = 0;
game.scene.add('splash', SplashScene)
game.scene.add('hello-world', HelloWorldScene)
game.scene.add('menu', MenuScene)
game.scene.add('play', PlayScene)
game.scene.add('credits', CreditScene)
game.scene.add('end', EndScene)
game.scene.add('options', OptionsScene)
game.scene.add('instructions', InstructionsScene)

//game.scene.start('play')
game.scene.start('splash')
// game.scene.start('hello-world')

export default game
