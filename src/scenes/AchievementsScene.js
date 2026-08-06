import Phaser from 'phaser';
import { ACHIEVEMENTS } from '../config/gameData';
import { playerProfile } from '../services/PlayerProfile';
import { addBackButton, addPanel, addSpaceBackground, addTitle, COLORS, textStyle } from '../ui';
import { configureSharpCamera, watchResponsiveLayout } from '../config/layout';

export default class AchievementsScene extends Phaser.Scene {
    constructor() { super('achievements'); }
    preload() { this.load.image('menu', 'assets/menu-space-v2.png'); }
    create() {
        configureSharpCamera(this);
        addSpaceBackground(this);
        const unlockedIds = playerProfile.data.achievements;
        const title = addTitle(this, 'ACHIEVEMENTS', `${unlockedIds.length}/${ACHIEVEMENTS.length} unlocked`);
        ACHIEVEMENTS.forEach((achievement, index) => {
            const col = index % 3;
            const row = Math.floor(index / 3);
            const x = 220 + col * 420;
            const y = 170 + row * 135;
            const unlocked = unlockedIds.includes(achievement.id);
            addPanel(this, x, y, 390, 105, unlocked ? 0.95 : 0.58);
            this.add.text(x - 174, y - 39, unlocked ? '★' : '☆', textStyle(29, unlocked ? '#ffd166' : '#69718d'));
            this.add.text(x - 135, y - 36, achievement.name, textStyle(19, unlocked ? '#ffffff' : '#7b849f'));
            this.add.text(x - 135, y - 7, achievement.description, textStyle(14, unlocked ? COLORS.muted : '#69718d')).setWordWrapWidth(280);
            this.add.text(x + 170, y + 38, `◆ ${achievement.reward}`, textStyle(15, unlocked ? '#ffd166' : '#69718d')).setOrigin(1);
        });
        watchResponsiveLayout(this, layout => {
            title.setY(layout.cameraTop + 38);
            title.subtitle?.setY(layout.cameraTop + 75);
        });
        addBackButton(this);
    }
}
