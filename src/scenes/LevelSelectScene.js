import Phaser from 'phaser';
import { LEVELS } from '../config/gameData';
import { playerProfile } from '../services/PlayerProfile';
import { addBackButton, addButton, addPanel, addSpaceBackground, addTitle, COLORS, fadeToScene, textStyle } from '../ui';
import { configureSharpCamera } from '../config/layout';

export default class LevelSelectScene extends Phaser.Scene {
    constructor() { super('levels'); }

    preload() { this.load.image('menu', 'assets/menu-space-v2.png'); }

    create() {
        configureSharpCamera(this);
        addSpaceBackground(this);
        addTitle(this, 'MISSION SELECT', 'Complete sectors to unlock advanced deep-space operations');
        const profile = playerProfile.data;

        LEVELS.forEach((level, index) => {
            const column = index % 2;
            const row = Math.floor(index / 2);
            const x = column ? 945 : 335;
            const y = 142 + row * 132;
            const unlocked = level.id <= profile.unlockedLevel;
            const complete = profile.completedLevels.includes(level.id);

            addPanel(this, x, y, 570, 114, unlocked ? 0.94 : 0.6);

            // Sector badge
            const sectorColor = complete ? '#7ae582' : unlocked ? '#5ce1e6' : '#565e7d';
            this.add.text(x - 255, y - 43, `SECTOR 0${level.id} • ${level.name.toUpperCase()}`, textStyle(24, unlocked ? '#ffffff' : '#69718d'));
            this.add.text(x - 255, y - 10, unlocked ? level.subtitle : 'SECURITY LOCK ACTIVE', textStyle(17, unlocked ? COLORS.muted : '#565e7d'));
            this.add.text(x - 255, y + 21, unlocked ? `TARGET: ${level.targetKills} ENEMIES  •  REWARD: ◆ ${level.reward}` : 'Clear earlier sectors to bypass lock', textStyle(16, unlocked ? '#ffd166' : '#565e7d'));

            addButton(this, x + 205, y + 24, complete ? 'REPLAY' : unlocked ? 'LAUNCH' : 'LOCKED', () => fadeToScene(this, 'play', { levelId: level.id }), {
                width: 135, height: 40, fontSize: 18, disabled: !unlocked,
                accent: complete ? COLORS.green : COLORS.cyan,
            });

            if (complete) {
                this.add.text(x + 245, y - 38, '★ CLEARED', textStyle(15, '#7ae582')).setOrigin(0.5);
            }
        });

        addBackButton(this);
    }
}
