import Phaser from 'phaser';
import { ACHIEVEMENTS } from '../config/gameData';
import { playerProfile } from '../services/PlayerProfile';
import { addBackButton, addPanel, addSpaceBackground, addTitle, COLORS, textStyle } from '../ui';
import { configureSharpCamera } from '../config/layout';

export default class AchievementsScene extends Phaser.Scene {
    constructor() { super('achievements'); }
    preload() { this.load.image('menu', 'assets/menu.png'); }
    create() {
        configureSharpCamera(this);
        addSpaceBackground(this);
        const unlockedIds = playerProfile.data.achievements;
        addTitle(this, 'ACHIEVEMENTS', `${unlockedIds.length}/${ACHIEVEMENTS.length} unlocked`);
        ACHIEVEMENTS.forEach((achievement, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = col ? 945 : 335;
            const y = 140 + row * 101;
            const unlocked = unlockedIds.includes(achievement.id);
            addPanel(this, x, y, 570, 82, unlocked ? 0.95 : 0.58);
            this.add.text(x - 255, y - 30, unlocked ? '★' : '☆', textStyle(31, unlocked ? '#ffd166' : '#69718d'));
            this.add.text(x - 210, y - 27, achievement.name, textStyle(23, unlocked ? '#ffffff' : '#7b849f'));
            this.add.text(x - 210, y + 1, achievement.description, textStyle(15, unlocked ? COLORS.muted : '#69718d')).setWordWrapWidth(390);
            this.add.text(x + 250, y + 22, `◆ ${achievement.reward}`, textStyle(16, unlocked ? '#ffd166' : '#69718d')).setOrigin(1);
        });
        addBackButton(this);
    }
}
