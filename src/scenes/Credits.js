import Phaser from 'phaser'
import '../../public/font.css';
export default class CreditScene extends Phaser.Scene {
    constructor() {
        super('credits');
        this.creditImage = null;
    }

    preload() {
        // Load any assets like images or fonts if required
        this.load.image('background-credit', '/assets/credit-space.jpg');
    }

    create() {
        // Add background image
        this.creditImage = this.add.sprite(0, 0, 'background-credit');
        this.creditImage.setOrigin(0, 0);
        this.creditImage.alpha = 0.6;
        const scaleX = +this.sys.game.config.width / this.creditImage.width;
        const scaleY = +this.sys.game.config.height / this.creditImage.height;
        const scale = Math.max(scaleX, scaleY);
        this.creditImage.setScale(scale).setScrollFactor(0);
    
        const buttonStyle = {
            color: '#ffffff',
            fontSize: 25,
            fontFamily: 'Caramel',
        }
    
        const buttonHoverStyle = {
            color: '#ff0',
            fontFamily: 'Caramel',
        }
    
        // Create the credits text
        var creditsText = "Quarrel through the cosmos\n\n" +
            "Developed by: Team Ubihard\n" +
            "Special Thanks to: Shiftkey Labs\n" +
            "Inspiration Source: Make me laugh....hehehehe \n" +
            "Phaser Community\n\n" +
            "Music by Eldon the Rapper\n" +
            "Sound Designer: Eldon\n\n" +
            "Artist Name: Carlos \n\n" +
            "Developed by:\nCarlos\nEldon\nHarshpreet\nLoki\nRachit\nRahul";
    
        var text = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, creditsText, { 
            fontFamily: 'Caramel', 
            fontSize: 24, 
            color: '#ffffff' 
        }).setOrigin(0.5);
    
        // Add a button to skip the credits animation and return to the main menu
        var skipButton = this.add.text(70, +this.sys.game.config.height - 100, 'Skip', buttonStyle);
        skipButton.setInteractive(); // Enable button interactivity
        skipButton.on('pointerover', () => skipButton.setStyle(buttonHoverStyle))
        skipButton.on('pointerout', () => skipButton.setStyle(buttonStyle))
        skipButton.on('pointerdown', function () {
            // Transition back to the main menu
            this.scene.start('menu');
        }, this);
    }
    
    
}