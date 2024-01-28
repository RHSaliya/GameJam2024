import Phaser from 'phaser'


export default class SplashScene extends Phaser.Scene {
    constructor() {
        super('splash')
        this.splashImage = null;
    }

    preload() {
        this.load.text('Caramel', 'assets/fonts/caramel_3/Caramel.ttf');
        this.load.image('background-splash', '/public/assets/menu.png');
        this.load.image('background-splash2', '/public/assets/spacetitle.png');
        this.load.image('title', 'assets/title.png')
    }


    create() {
        this.splashImage = this.add.sprite(0, 0, 'background-splash');
        this.splashImage.setOrigin(0, 0);
        this.splashImage.alpha = 0.6;
        const scaleX = +this.sys.game.config.width / this.splashImage.width;
        const scaleY = +this.sys.game.config.height / this.splashImage.height;
        const scale = Math.max(scaleX, scaleY);
        this.splashImage.setScale(scale).setScrollFactor(0);
        // Calculate the center of the screen
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Position splashImage2
        this.splashImage2 = this.add.sprite(centerX, centerY - 100, 'background-splash2'); // Adjust the vertical position
        this.splashImage2.setOrigin(0.5, 1); // Set origin to bottom center
        this.splashImage2.setScale(0.75, 0.6).setScrollFactor(0);
        // Position title at the center of the screen
        const title = this.add.image(centerX - 10, centerY, 'title'); // Center horizontally and vertically
        title.setOrigin(0.5); // Set origin to center
        // Set the scale and scroll factor for title
        title.setScale(1).setScrollFactor(0);
        
        const startButton = this.add.text(0, 0, '', {
            fontFamily: 'Caramel',
            fontSize: `0px`,
        });

        const loadingText = this.add.text(centerX, title.y + title.displayHeight + 10, 'Loading....', {
            fontSize: '45px',
            color: '#ffffff',
            fontFamily: 'Caramel',
        });

        loadingText.setOrigin(0.5); // Set origin to center
        loadingText.setScrollFactor(0);

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