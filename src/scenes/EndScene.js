import Phaser from 'phaser';

export default class EndScene extends Phaser.Scene {
    constructor() {
        super('end');
    }

    preload() {
        this.load.image('endGameScene', 'assets/darthVader.jpeg');
    }

    create(data) {
        const totalScore = data.totalScore || 0; // Default to 0 if totalScore is not provided

        // Add the menu background
        const background = this.add.image(0, 0, 'endGameScene').setOrigin(0);
        const scaleX = +this.sys.game.config.width / background.width;
        const scaleY = +this.sys.game.config.height / background.height;
        const scale = Math.max(scaleX, scaleY);
        background.setScale(scale).setScrollFactor(0);

        // Add "Game Over" text
        const gameOverText = this.add.text(+this.sys.game.config.width / 2, +this.sys.game.config.height / 2 - 50, 'Game Over', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#fff'
        });
        gameOverText.setOrigin(0.5);
        
        // Display total score
        const totalScoreText = this.add.text(+this.sys.game.config.width / 2, +this.sys.game.config.height / 2, `Total Score: ${totalScore}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#fff'
        });
        totalScoreText.setOrigin(0.5);


        // Add restart button
        const buttonStyle = {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#0f0', // Default color green
            padding: 10
        };

        const buttonHoverStyle = {
            color: '#ff0' // Hover color yellow
        };

        // @ts-ignore
        const restartButton = this.add.text(+this.sys.game.config.width / 2, +this.sys.game.config.height * 0.8, 'Restart', buttonStyle);
        restartButton.setOrigin(0.5);
        restartButton.setInteractive();

        restartButton.on('pointerover', () => {
            restartButton.setStyle(buttonHoverStyle);
        });

        restartButton.on('pointerout', () => {
            restartButton.setStyle(buttonStyle);
        });

        restartButton.on('pointerdown', () => {
            this.scene.start('menu');
        });
    }
}