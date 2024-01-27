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
        const fontSize = +this.sys.game.config.height * 24 / 800;
    }
}