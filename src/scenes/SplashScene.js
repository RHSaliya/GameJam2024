import Phaser from 'phaser'


export default class SplashScene extends Phaser.Scene {
    constructor() {
        super('splash')
        this.splashImage = null;
    }

    preload() {
        // this.load.image('background', '/public/assets/splash.png');
    }


    create() {
        this.cameras.main.setBackgroundColor('#FFFFFF');
        this.splashImage = this.add.image(0, 0, 'background');
        this.splashImage.setOrigin(0, 0);
        this.splashImage.alpha = 0.6;
        this.splashImage.setDisplaySize(+this.game.config.width, +this.game.config.height);
    }

    update(time, diff) {
        if (this.splashImage.alpha < 1) {
            this.splashImage.alpha += 0.01;
        } else {
            this.splashImage.destroy();
            this.scene.start('hello-world');
        }
    }
}