import Phaser from 'phaser';
import '../../public/font.css';
import { playerProfile } from '../services/PlayerProfile';
import { addButton, addSpaceBackground, formatNumber, textStyle, COLORS } from '../ui';
import { configureSharpCamera, GAME_CENTER_X, GAME_WIDTH } from '../config/layout';
import { preloadAudio } from '../services/AudioService';

export default class MenuScene extends Phaser.Scene {
    constructor() { super('menu'); }

    preload() {
        this.load.image('menu', 'assets/menu.png');
        this.load.image('titleImage', 'assets/spacetitle.png');
        this.load.image('title', 'assets/title.png');
        this.load.image('ship', 'assets/space/Spaceship.png');
        preloadAudio(this, ['titleMusic', 'uiClick']);
    }

    create() {
        configureSharpCamera(this);
        addSpaceBackground(this);
        const centerX = GAME_CENTER_X;

        // Anchor the complete brand and action grid to the true viewport center.
        this.add.image(centerX, 52, 'titleImage').setScale(0.38);
        this.add.image(centerX, 150, 'title').setScale(0.46);

        const profile = playerProfile.data;
        this.add.text(28, 20, `BEST SCORE ${formatNumber(profile.bestScore)}`, textStyle(24, '#ffffff'));
        this.add.text(GAME_WIDTH - 28, 20, `◆ ${formatNumber(profile.credits)}`, textStyle(25, '#ffd166')).setOrigin(1, 0);

        const go = (scene, data) => this.scene.start(scene, data);
        const left = centerX - 200;
        const right = centerX + 200;
        addButton(this, left, 278, 'CAMPAIGN', () => go('levels'), { width: 360, accent: COLORS.green });
        addButton(this, right, 278, 'HANGAR', () => go('hangar'), { width: 360, accent: COLORS.yellow });
        addButton(this, left, 342, 'ACHIEVEMENTS', () => go('achievements'), { width: 360 });
        addButton(this, right, 342, 'LEADERBOARD', () => go('leaderboard'), { width: 360 });
        addButton(this, left, 406, 'HOW TO PLAY', () => go('instructions'), { width: 360 });
        addButton(this, right, 406, 'OPTIONS', () => go('options'), { width: 360 });
        addButton(this, centerX, 476, 'EDIT PILOT NAME', () => this.renamePilot(), { width: 320, height: 42, fontSize: 21 });

        this.nameText = this.add.text(28, 564, profile.displayName, textStyle(22, '#ffffff')).setOrigin(0, 1);
        this.add.text(GAME_WIDTH - 20, 585, 'v2.1', textStyle(14, '#7781a4')).setOrigin(1);
    }

    renamePilot() {
        const nextName = window.prompt('Choose a public leaderboard name (18 characters max):', playerProfile.data.displayName);
        if (nextName === null) return;
        playerProfile.setDisplayName(nextName);
        this.nameText.setText(playerProfile.data.displayName);
    }
}
