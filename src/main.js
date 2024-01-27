import Phaser from 'phaser'

import HelloWorldScene from './HelloWorldScene'
import SplashScene from './scenes/SplashScene'
import MenuScene from './scenes/MenuScene'

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
}

const game = new Phaser.Game(config)

game.scene.add('splash', SplashScene)
game.scene.add('hello-world', HelloWorldScene)
game.scene.add('menu', MenuScene)

// game.scene.start('menu')
game.scene.start('splash')
// game.scene.start('hello-world')

export default game
