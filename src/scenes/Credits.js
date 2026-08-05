import Phaser from 'phaser'
import '../../public/font.css';
import { configureSharpCamera, GAME_CENTER_X, GAME_CENTER_Y, GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from '../config/layout';
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
        configureSharpCamera(this);
        // Add background image
        this.creditImage = this.add.sprite(0, 0, 'background-credit');
        this.creditImage.setOrigin(0, 0);
        this.creditImage.alpha = 0.6;
        const scaleX = GAME_WIDTH / this.creditImage.width;
        const scaleY = GAME_HEIGHT / this.creditImage.height;
        const scale = Math.max(scaleX, scaleY);
        this.creditImage.setScale(scale);
    
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
        var creditsText = "Quarrel Through The Cosmos\n\n" +
            "Developed by Team Mostly Green\n" +
            "Special Thanks to Shiftkey Labs & the Phaser community\n" +
            "Inspiration Source: Make me laugh....hehehehe \n\n" +
            "Original music and sound by Eldon\n" +
            "Additional interface effects created for this release\n\n" +
            "Art by Carson \n\n" +
            "Developed by Rahul, Loki, Rachit & Harshpreet";
    
        var text = this.add.text(GAME_CENTER_X, GAME_CENTER_Y, creditsText, { 
            fontFamily: 'Caramel, "Arial Rounded MT Bold", Arial, sans-serif',
            fontStyle: 'bold',
            fontSize: 24, 
            color: '#ffffff',
            resolution: RENDER_SCALE,
        }).setOrigin(0.5);
    
        // Add a button to skip the credits animation and return to the main menu
        var skipButton = this.add.text(84, GAME_HEIGHT - 70, 'Skip', buttonStyle);
        skipButton.setInteractive(); // Enable button interactivity
        skipButton.on('pointerover', () => skipButton.setStyle(buttonHoverStyle))
        skipButton.on('pointerout', () => skipButton.setStyle(buttonStyle))
        skipButton.on('pointerdown', function () {
            // Transition back to the main menu
            this.scene.start('menu');
        }, this);
    }
    
    
}
