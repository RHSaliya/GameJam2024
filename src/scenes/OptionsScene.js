import Phaser from 'phaser'
import '../../public/font.css';
export default class OptionsScene extends Phaser.Scene {
    constructor() {
        super('options');
        this.optionsImage = null;
        this.themeMusic = null;

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
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Display volume text
        this.add.text(width / 2 - 50, height / 2 - 50, 'Volume:', { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' });

        // Create volume slider background
        const sliderBackground = this.add.rectangle(width / 2, height / 2, 300, 10, 0x666666);
        
        // Create volume slider handle
        const sliderHandle = this.add.rectangle(width / 2 - 150, height / 2, 10, 20, 0xffffff);
        sliderHandle.setInteractive();

        // Load theme music
        this.themeMusic = this.sound.add('themeMusic', { loop: true });

        // Set initial volume based on stored settings or default to 0.5
        let initialVolume = parseFloat(localStorage.getItem('volume')) || 0.5;
        this.updateVolume(initialVolume);

        // Update volume based on slider position
        sliderHandle.on('pointerdown', (pointer, dragX) => {
            sliderHandle.setData('dragging', true);
        });

        this.input.on('pointermove', (pointer) => {
            if (sliderHandle.getData('dragging')) {
                let newValue = Phaser.Math.Clamp((pointer.x - (width / 2 - 150)) / 300, 0, 1);
                this.updateVolume(newValue);
                sliderHandle.x = Phaser.Math.Clamp(pointer.x, width / 2 - 150, width / 2 + 150);
            }
        });

        this.input.on('pointerup', () => {
            sliderHandle.setData('dragging', false);
        });

        sliderHandle.on('pointerover', () => sliderHandle.setFillStyle(Phaser.Display.Color.HexStringToColor('#ff0').color));
        sliderHandle.on('pointerout', () => sliderHandle.setFillStyle(Phaser.Display.Color.HexStringToColor('#ffffff').color));

}
updateVolume(value) {
    if (this.themeMusic) {
        this.themeMusic.setVolume(value);
        localStorage.setItem('volume', value.toString()); // Store volume setting
    }
}
}