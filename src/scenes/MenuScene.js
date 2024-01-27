import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('menu');
    }
    preload() {
        this.load.image('menu', 'assets/menu.png');
    }
    create() {
        const background = this.add.image(0, 0, 'menu');
        background.setOrigin(0);
        const scaleX = +this.sys.game.config.width / background.width;
        const scaleY = +this.sys.game.config.height / background.height;
        const scale = Math.max(scaleX, scaleY);
        background.setScale(scale).setScrollFactor(0);

        // There will be three buttons start, options, credits and exit
        // start button

        const gameWidth = +this.sys.game.config.width;
        const gameHeight = +this.sys.game.config.height;

        const buttonStyle = {
            fill: '#0f0',
            fontSize: '24px',
            fontFamily: 'sans-serif',
        }

        const buttonHoverStyle = {
            fill: '#ff0',
            fontSize: '24px',
            fontFamily: 'sans-serif',
        }

        const buttonPoitionX = gameWidth / 2;
        const startButton = this.add.text(buttonPoitionX, 250, 'Start', buttonStyle)
            .setInteractive()
            .setOrigin(0.5)
            .setPadding(10)
            .on('pointerover', () => startButton.setStyle(buttonHoverStyle))
            .on('pointerout', () => startButton.setStyle(buttonStyle))
            .on('pointerdown', () => this.scene.start('hello-world'));
        // options button
        const optionsButton = this.add.text(buttonPoitionX, startButton.y + startButton.height, 'Options', buttonStyle)
            .setInteractive()
            .setOrigin(0.5)
            .setPadding(10)
            .on('pointerover', () => optionsButton.setStyle(buttonHoverStyle))
            .on('pointerout', () => optionsButton.setStyle(buttonStyle))
            .on('pointerdown', () => this.scene.start('options'));
        // credits button
        const creditsButton = this.add.text(buttonPoitionX, optionsButton.y + optionsButton.height, 'Credits', buttonStyle)
            .setInteractive()
            .setOrigin(0.5)
            .setPadding(10)
            .on('pointerover', () => creditsButton.setStyle(buttonHoverStyle))
            .on('pointerout', () => creditsButton.setStyle(buttonStyle))
            .on('pointerdown', () => this.scene.start('credits'));

        const asteroidButton = this.add.text(buttonPoitionX, creditsButton.y + creditsButton.height, 'Asteroid', buttonStyle)
            .setInteractive()
            .setOrigin(0.5)
            .setPadding(10)
            .on('pointerover', () => asteroidButton.setStyle(buttonHoverStyle))
            .on('pointerout', () => asteroidButton.setStyle(buttonStyle))
            .on('pointerdown', () => this.scene.start('asteroid'));
    }
}