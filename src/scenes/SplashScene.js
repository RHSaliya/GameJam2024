import Phaser from 'phaser'
import { CAMERA_VIEW_HEIGHT, CAMERA_VIEW_WIDTH, configureSharpCamera, GAME_CENTER_X, GAME_CENTER_Y, GAME_HEIGHT, GAME_WIDTH } from '../config/layout'
import { preloadAudio } from '../services/AudioService'
import { addBrandTitle, textStyle } from '../ui'


export default class SplashScene extends Phaser.Scene {
    constructor() {
        super('splash')
        this.splashImage = null;
    }

    preload() {
        this.load.image('background-splash', 'assets/menu-space-v2.png');
        this.load.image('background-splash2', 'assets/spacetitle.png');
        preloadAudio(this)
    }


    create() {
        configureSharpCamera(this);
        this.splashImage = this.add.tileSprite(GAME_CENTER_X, GAME_CENTER_Y, CAMERA_VIEW_WIDTH, CAMERA_VIEW_HEIGHT, 'background-splash');
        this.splashImage.alpha = 0.82;
        this.splashImage.setTileScale(Math.max(GAME_WIDTH / 1024, GAME_HEIGHT / 1024) * 1.08);
        // Calculate the center of the screen
        const centerX = GAME_CENTER_X;
        this.splashImage2 = this.add.sprite(centerX, 188, 'background-splash2').setScale(0.48);
        addBrandTitle(this, centerX, 352, { fontSize: 48 });
        this.add.text(centerX, 450, 'PREPARING LAUNCH…', textStyle(22, '#aeb8da')).setOrigin(0.5);
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
