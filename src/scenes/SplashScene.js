import Phaser from 'phaser'
import { configureSharpCamera, GAME_CENTER_X, GAME_CENTER_Y, GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from '../config/layout'
import { preloadAudio } from '../services/AudioService'


export default class SplashScene extends Phaser.Scene {
    constructor() {
        super('splash')
        this.splashImage = null;
    }

    preload() {
        this.load.text('Caramel', 'assets/fonts/caramel_3/Caramel.ttf');
        this.load.image('background-splash', 'assets/menu.png');
        this.load.image('background-splash2', 'assets/spacetitle.png');
        this.load.image('title', 'assets/title.png')
        preloadAudio(this)
    }


    create() {
        configureSharpCamera(this);
        this.splashImage = this.add.tileSprite(GAME_CENTER_X, GAME_CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 'background-splash');
        this.splashImage.alpha = 0.6;
        this.splashImage.setTileScale(Math.max(GAME_WIDTH / 1024, GAME_HEIGHT / 1024) * 1.08);
        // Calculate the center of the screen
        const centerX = GAME_CENTER_X;
        const centerY = GAME_CENTER_Y;

        // Position splashImage2
        this.splashImage2 = this.add.sprite(centerX, centerY - 60, 'background-splash2'); // Adjust the vertical position
        this.splashImage2.setOrigin(0.5, 1); // Set origin to bottom center
        this.splashImage2.setScale(0.6);
        // Position title at the center of the screen
        const title = this.add.image(centerX, centerY, 'title'); // Center horizontally and vertically
        title.setOrigin(0.5); // Set origin to center
        // Set the scale and scroll factor for title
        title.setScale(1);

        const style =
        {
            fontSize: '45px',
            color: '#ffffff',
            fontFamily: 'Caramel, "Arial Rounded MT Bold", Arial, sans-serif',
            fontStyle: 'bold',
            resolution: RENDER_SCALE,
        };

        const loadingText = this.add.text(centerX, title.y + title.displayHeight + 10, 'Loading....', style);
        loadingText.setOrigin(0.5); // Set origin to center
    }

    update(time, diff) {
        this.splashImage.tilePositionX += diff * 0.017;
        this.splashImage.tilePositionY += diff * 0.009;
        if (this.splashImage.alpha < 1) {
            this.splashImage.alpha += 0.01;
        } else if (time > 3000) {
            this.scene.start('menu');
        }
    }
}
