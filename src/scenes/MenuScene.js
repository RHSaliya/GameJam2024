import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('menu');
    }
    preload() {
        this.load.image('menu', 'assets/menu.png');
        this.load.audio('titleMusic', 'assets/Sound/TitleTheme.wav');
    }
    create() {
        //Playing music title
        const titleMusic = this.sound.add('titleMusic', { loop: true });
        titleMusic.play();

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
        const fontSize = gameWidth * 24 / 800;
        const firstButtonHeight = gameHeight * 250 / 600;

        const buttonStyle = {
            fill: '#0f0',
            fontSize: `${fontSize}px`,
            fontFamily: 'sans-serif',
        }

        const buttonHoverStyle = {
            fill: '#ff0',
            fontFamily: 'sans-serif',
        }

        const buttonPoitionX = gameWidth / 2;
        const startButton = this.add.text(buttonPoitionX, firstButtonHeight, 'Start', buttonStyle)
            .setInteractive()
            .setOrigin(0.5)
            .setPadding(10)
            .on('pointerover', () => startButton.setStyle(buttonHoverStyle))
            .on('pointerout', () => startButton.setStyle(buttonStyle))
            .on('pointerdown', () => {
                titleMusic.stop();
                this.scene.start('play')
            });
        // options button
        const optionsButton = this.add.text(buttonPoitionX, startButton.y + startButton.height, 'Options', buttonStyle)
            .setInteractive()
            .setOrigin(0.5)
            .setPadding(10)
            .on('pointerover', () => optionsButton.setStyle(buttonHoverStyle))
            .on('pointerout', () => optionsButton.setStyle(buttonStyle))
            .on('pointerdown', () => {
                titleMusic.stop(); this.scene.start('options')
            });
        // credits button
        const creditsButton = this.add.text(buttonPoitionX, optionsButton.y + optionsButton.height, 'Credits', buttonStyle)
            .setInteractive()
            .setOrigin(0.5)
            .setPadding(10)
            .on('pointerover', () => creditsButton.setStyle(buttonHoverStyle))
            .on('pointerout', () => creditsButton.setStyle(buttonStyle))
            .on('pointerdown', () => {
                titleMusic.stop(); this.scene.start('credits')
            });
    }
}