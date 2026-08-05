import Phaser from 'phaser';
import { LEVELS } from '../config/gameData';
import { playerProfile } from '../services/PlayerProfile';
import { addBackButton, addButton, addPanel, addSpaceBackground, addTitle, COLORS, textStyle } from '../ui';
import { configureSharpCamera } from '../config/layout';

export default class LevelSelectScene extends Phaser.Scene {
    constructor() { super('levels'); }

    preload() { this.load.image('menu', 'assets/menu-space-v2.png'); }

    create() {
        configureSharpCamera(this);
        addSpaceBackground(this);
        addTitle(this, 'MISSION SELECT', 'Complete missions to unlock the next sector');
        const profile = playerProfile.data;
        LEVELS.forEach((level, index) => {
            const column = index % 2;
            const row = Math.floor(index / 2);
            const x = column ? 945 : 335;
            const y = 142 + row * 132;
            const unlocked = level.id <= profile.unlockedLevel;
            const complete = profile.completedLevels.includes(level.id);
            addPanel(this, x, y, 570, 112, unlocked ? 0.92 : 0.62);
            this.add.text(x - 255, y - 43, `${level.id}. ${level.name}`, textStyle(27, unlocked ? '#ffffff' : '#78819d'));
            this.add.text(x - 255, y - 10, unlocked ? level.subtitle : 'LOCKED', textStyle(18, unlocked ? COLORS.muted : '#69718d'));
            this.add.text(x - 255, y + 21, unlocked ? `TARGET ${level.targetKills}  •  ◆ ${level.reward}` : 'Complete the previous mission', textStyle(17, unlocked ? '#ffd166' : '#69718d'));
            addButton(this, x + 205, y + 27, complete ? 'REPLAY' : unlocked ? 'LAUNCH' : 'LOCKED', () => this.scene.start('play', { levelId: level.id }), {
                width: 130, height: 38, fontSize: 18, disabled: !unlocked,
                accent: complete ? COLORS.green : COLORS.cyan,
            });
            if (complete) this.add.text(x + 245, y - 38, '✓', textStyle(28, '#7ae582')).setOrigin(0.5);
        });
        addBackButton(this);
    }
}
