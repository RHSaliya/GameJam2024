import Phaser from 'phaser'
import '../../public/font.css';
// Import the necessary UIPlugin from the rexUI package
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

export default class OptionsScene extends Phaser.Scene {
    constructor() {
        super('options');
        this.optionsImage = null;
    }
    preload() {
        // Load any assets like images or fonts if required
        this.load.image('background-options', '/assets/menu.png');

        // Load the UIPlugin
        this.load.scenePlugin({
            key: 'rexUI',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
            sceneKey: 'rexUI'
        });
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

        // Define slider configuration
        const sliderConfig = {
            x: 400, // Adjust the position as needed
            y: 500,
            width: 300,
            height: 20,
            orientation: 'x', // Horizontal slider
            value: 0.5, // Initial volume value
            input: 'drag',
            track: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x000000),
            thumb: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0xffffff),
            input: 'drag',
            easeValue: { duration: 1000 }
        };

        // Create the slider
        const volumeSlider = this.rexUI.add.slider(sliderConfig);

        // Add the slider to the scene
        this.add.existing(volumeSlider);

        // Callback function to handle volume changes
        volumeSlider.on('valuechange', function (newValue, oldValue) {
            // Adjust volume based on newValue
            console.log('Volume:', newValue);
            // You can implement volume adjustment logic here
        });

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