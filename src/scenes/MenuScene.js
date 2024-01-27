import Phaser from "phaser";
import '../../public/font.css';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('menu');
    }
    preload() {
        this.load.image('menu', 'assets/menu.png');
        this.load.image('titleImage','assets/spacetitle.png')
        this.load.image('title','assets/title.png')
        this.load.text('Caramel', '../../public/font.css');
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
        const fontSize = gameWidth * 45 / 800;
        const firstButtonHeight = gameHeight * 450 / 600;

        const buttonStyle = {
            fontFamily: 'Caramel',
            fill: '#ffffff',
            fontWeight: 800,
            fontSize: `${fontSize}px`,
        }

        const buttonHoverStyle = {
            fontFamily: 'Caramel',
            fill: '#ff0',
            fontWeight: 800,
            fontSize: `${fontSize}px`,
        }
        const scaleTI = 1; // Adjust scale as needed

        // Add the image
        const spacetitle = this.add.image(0, 0, 'titleImage');
        
        // Set the origin to the center of the image
        spacetitle.setOrigin(0.5);
        
        // Set the scale and scroll factor
        spacetitle.setScale(scaleTI).setScrollFactor(0);
        
        // Calculate the x-coordinate to center the image horizontally
        const centerX = this.cameras.main.width / 2;
        spacetitle.x = centerX;       
        spacetitle.y = gameHeight * 210 / 600;
        
         // Add the image
         const title = this.add.image(0, 0, 'title');
        
         // Set the origin to the center of the image
         title.setOrigin(0.5);
         
         // Set the scale and scroll factor
         title.setScale(scaleTI).setScrollFactor(0);
 
         title.x = centerX;       
         title.y = gameHeight * 320 / 600;

        const buttonPoitionX = gameWidth / 2;
        const startButton = this.add.text(buttonPoitionX, firstButtonHeight, 'Start', buttonStyle)
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerover', () => startButton.setStyle(buttonHoverStyle))
            .on('pointerout', () => startButton.setStyle(buttonStyle))
            .on('pointerdown', () => this.scene.start('play'));
        // options button
        const optionsButton = this.add.text(buttonPoitionX, startButton.y + startButton.height, 'Options', buttonStyle)
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerover', () => optionsButton.setStyle(buttonHoverStyle))
            .on('pointerout', () => optionsButton.setStyle(buttonStyle))
            .on('pointerdown', () => this.scene.start('options'));
        // credits button
        const creditsButton = this.add.text(buttonPoitionX, optionsButton.y + optionsButton.height, 'Credits', buttonStyle)
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerover', () => creditsButton.setStyle(buttonHoverStyle))
            .on('pointerout', () => creditsButton.setStyle(buttonStyle))
            .on('pointerdown', () => this.scene.start('credits'));
    }
}