import Phaser from 'phaser'


export default class SplashScene extends Phaser.Scene {
    constructor() {
        super('splash')
        this.splashImage = null;
    }

    preload() {
        this.load.image('background-splash', '/public/assets/splash.png');
    }


    create() {
        this.splashImage = this.add.sprite(0, 0, 'background-splash');
        this.splashImage.setOrigin(0, 0);
        this.splashImage.alpha = 0.6;
        const scaleX = +this.sys.game.config.width / this.splashImage.width;
        const scaleY = +this.sys.game.config.height / this.splashImage.height;
        const scale = Math.max(scaleX, scaleY);
        this.splashImage.setScale(scale).setScrollFactor(0);
    }

    update(time, diff) {
        if (this.splashImage.alpha < 1) {
            this.splashImage.alpha += 0.01;
        } else if (time > 3000) {
            this.splashImage.destroy();
            this.scene.switch('menu');
        }
    }
}