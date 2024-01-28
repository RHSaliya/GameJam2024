import Phaser from 'phaser'
import '../../public/font.css';
export default class OptionsScene extends Phaser.Scene {
    constructor() {
        super('options');
        this.optionsImage = null;

    }
    preload() {
        // Load any assets like images or fonts if required
        this.load.image('background-options', '/assets/menu.png');
    }

    create() {
        // Add background image
        this.optionImage = this.add.sprite(0, 0, 'background-options');
        this.optionImage.setOrigin(0, 0);
        this.optionImage.alpha = 0.6;
        const scaleX = +this.sys.game.config.width / this.optionImage.width;
        const scaleY = +this.sys.game.config.height / this.optionImage.height;
        const scale = Math.max(scaleX, scaleY);
        this.optionImage.setScale(scale).setScrollFactor(0);
        const buttonStyle = {
            color: '#ffffff',
            fontSize: 45,
            fontFamily: 'Caramel',
        }

        const buttonHoverStyle = {
            color: '#ff0',
            fontFamily: 'Caramel',
        }
        // Add a button to skip the credits animation and return to the main menu
        var BackButton = this.add.text(70, +this.sys.game.config.height - 100, 'Back', buttonStyle);
        BackButton.setInteractive(); // Enable button interactivity
        BackButton.on('pointerover', () => BackButton.setStyle(buttonHoverStyle))
        BackButton.on('pointerout', () => BackButton.setStyle(buttonStyle))
        BackButton.on('pointerdown', function () {
            // Transition back to the main menu
            this.scene.start('menu');
        }, this);
    }

}