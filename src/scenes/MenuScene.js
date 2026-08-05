import Phaser from 'phaser';
import '../../public/font.css';
import { playerProfile } from '../services/PlayerProfile';
import { addButton, addSpaceBackground, formatNumber, textStyle, COLORS } from '../ui';
import { configureSharpCamera } from '../config/layout';

export default class MenuScene extends Phaser.Scene {
    constructor() { super('menu'); }

    preload() {
        this.load.image('menu', 'assets/menu.png');
        this.load.image('titleImage', 'assets/spacetitle.png');
        this.load.image('title', 'assets/title.png');
        this.load.image('ship', 'assets/space/Spaceship.png');
        this.load.audio('titleMusic', 'assets/Sound/TitleTheme.mp3');
    }

    create() {
        configureSharpCamera(this);
        addSpaceBackground(this);
        const volume = playerProfile.data.settings.volume;
        this.sound.volume = volume;
        this.music = this.sound.add('titleMusic', { loop: true, volume: Math.min(0.65, volume) });
        this.music.play();
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.music?.stop());

        this.add.image(640, 62, 'titleImage').setScale(0.42);
        this.add.image(640, 172, 'title').setScale(0.52);

        const profile = playerProfile.data;
        this.add.rectangle(640, 242, 900, 56, COLORS.panelDark, 0.9).setStrokeStyle(1, COLORS.cyan, 0.5);
        this.nameText = this.add.text(220, 231, profile.displayName, textStyle(25, '#ffffff'));
        this.add.text(1060, 231, `◆ ${formatNumber(profile.credits)}`, textStyle(25, '#ffd166')).setOrigin(1, 0);
        this.add.text(640, 271, `BEST ${formatNumber(profile.bestScore)}   •   MISSIONS ${profile.completedLevels.length}/6`, textStyle(17, COLORS.muted)).setOrigin(0.5);

        const go = (scene, data) => { this.music?.stop(); this.scene.start(scene, data); };
        addButton(this, 440, 337, 'CAMPAIGN', () => go('levels'), { width: 360, accent: COLORS.green });
        addButton(this, 840, 337, 'HANGAR', () => go('hangar'), { width: 360, accent: COLORS.yellow });
        addButton(this, 440, 401, 'ACHIEVEMENTS', () => go('achievements'), { width: 360 });
        addButton(this, 840, 401, 'LEADERBOARD', () => go('leaderboard'), { width: 360 });
        addButton(this, 440, 465, 'HOW TO PLAY', () => go('instructions'), { width: 360 });
        addButton(this, 840, 465, 'OPTIONS', () => go('options'), { width: 360 });
        addButton(this, 640, 532, 'EDIT PILOT NAME', () => this.renamePilot(), { width: 320, height: 42, fontSize: 21 });

        this.add.text(1260, 585, 'v2.1', textStyle(14, '#7781a4')).setOrigin(1);
    }

    renamePilot() {
        const nextName = window.prompt('Choose a public leaderboard name (18 characters max):', playerProfile.data.displayName);
        if (nextName === null) return;
        playerProfile.setDisplayName(nextName);
        this.nameText.setText(playerProfile.data.displayName);
    }
}
