import Phaser from 'phaser'
import { CAMERA_VIEW_HEIGHT, CAMERA_VIEW_WIDTH, configureSharpCamera, GAME_CENTER_X, GAME_CENTER_Y, GAME_HEIGHT, GAME_WIDTH, watchResponsiveLayout } from '../config/layout'
import { preloadAudio } from '../services/AudioService'
import { addBrandTitle, COLORS, fadeToScene, textStyle } from '../ui'

// Phaser's XHR loader has no timeout by default (loaderTimeout defaults to 0
// in Config.js), so a request that stalls without ever resolving or erroring
// — a dead proxy, a dropped connection mid-flight — would leave 'complete'
// unfired forever. This ceiling guarantees the splash always yields to the
// menu even if the loader itself never reports back.
const SPLASH_FAILSAFE_MS = 8000;

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
        watchResponsiveLayout(this, layout => {
            if (this.splashImage?.active) this.splashImage.setSize(layout.cameraWidth, layout.cameraHeight);
        });
        // Calculate the center of the screen
        const centerX = GAME_CENTER_X;
        this.splashImage2 = this.add.sprite(centerX, 188, 'background-splash2').setScale(0.48);
        addBrandTitle(this, centerX, 352, { fontSize: 48 });

        this.statusText = this.add.text(centerX, 442, 'PREPARING LAUNCH…', textStyle('label', '#aeb8da')).setOrigin(0.5);

        const barWidth = 420;
        const barHeight = 10;
        this.progressTrack = this.add.graphics();
        this.progressTrack.fillStyle(COLORS.panelDark, 0.9);
        this.progressTrack.fillRoundedRect(centerX - barWidth / 2, 470, barWidth, barHeight, barHeight / 2);
        this.progressTrack.lineStyle(1.5, COLORS.cyan, 0.35);
        this.progressTrack.strokeRoundedRect(centerX - barWidth / 2, 470, barWidth, barHeight, barHeight / 2);
        this.progressFill = this.add.graphics();

        this.drawProgress = value => {
            const clamped = Math.min(1, Math.max(0, value));
            this.progressFill.clear();
            if (clamped <= 0) return;
            this.progressFill.fillStyle(COLORS.cyan, 0.95);
            this.progressFill.fillRoundedRect(
                centerX - barWidth / 2 + 2, 472,
                Math.max(barHeight - 4, (barWidth - 4) * clamped), barHeight - 4,
                (barHeight - 4) / 2,
            );
        };
        this.drawProgress(0);

        // Preloading the menu's assets here is what gives the bar something
        // real to measure, and it means the menu appears instantly afterwards
        // instead of flashing an unstyled frame.
        this.load.image('menu', 'assets/menu-space-v2.png');
        this.load.image('titleImage', 'assets/spacetitle.png');
        this.load.on('progress', value => this.drawProgress(value));
        this.load.once('complete', () => {
            this.drawProgress(1);
            this.statusText.setText('READY');
            // A short beat so a cached instant load does not flash the splash.
            this.time.delayedCall(420, () => this.launch());
        });
        this.load.start();

        // Belt-and-braces: guarantee the menu is reached even if 'complete'
        // never fires (see SPLASH_FAILSAFE_MS above). launch()'s own latch
        // makes it harmless if the loader also completes around the same time.
        this.time.delayedCall(SPLASH_FAILSAFE_MS, () => this.launch());
    }

    update(time, diff) {
        this.splashImage.tilePositionX += diff * 0.017;
        this.splashImage.tilePositionY += diff * 0.009;
        if (this.splashImage.alpha < 1) this.splashImage.alpha += 0.01;
    }

    launch() {
        // The scene keeps updating behind the fade, so the latch stops a second
        // start being queued.
        if (this.launching) return;
        this.launching = true;
        fadeToScene(this, 'menu');
    }
}
