import Phaser from 'phaser';
import { leaderboardService } from '../services/LeaderboardService';
import { playerProfile } from '../services/PlayerProfile';
import { addBackButton, addPanel, addSpaceBackground, addTitle, COLORS, formatNumber, textStyle } from '../ui';
import { configureSharpCamera } from '../config/layout';

export default class LeaderboardScene extends Phaser.Scene {
    constructor() { super('leaderboard'); }
    preload() { this.load.image('menu', 'assets/menu-space-v2.png'); }

    create() {
        configureSharpCamera(this);
        addSpaceBackground(this);
        addTitle(this, 'LEADERBOARD', 'Top endless high scores ranked across all pilots');
        addPanel(this, 640, 335, 1000, 420);

        this.status = this.add.text(640, 110, 'Connecting…', textStyle(17, COLORS.muted)).setOrigin(0.5);

        // Table headers
        this.add.text(180, 135, 'RANK', textStyle(16, COLORS.cyan));
        this.add.text(260, 135, 'PILOT NAME', textStyle(16, COLORS.cyan));
        this.add.text(970, 135, 'SCORE', textStyle(16, COLORS.cyan)).setOrigin(1, 0);
        this.add.text(1080, 135, 'THREAT', textStyle(16, COLORS.cyan)).setOrigin(1, 0);

        this.rows = [];
        addBackButton(this);
        this.loadScores();
    }

    async loadScores() {
        const result = await leaderboardService.getTopScores(10);
        if (!this.scene.isActive()) return;

        this.status.setText(result.mode === 'firebase' ? 'GLOBAL NETWORK SCORES' : 'LOCAL NETWORK SCORES');
        const currentPilot = playerProfile.data.displayName;

        const medalIcons = ['🥇', '🥈', '🥉'];
        result.scores.forEach((score, index) => {
            const y = 168 + index * 37;
            const isTop3 = index < 3;
            const isSelf = score.name && score.name.toLowerCase() === currentPilot.toLowerCase();

            if (isSelf) {
                const rowBg = this.add.graphics();
                rowBg.fillStyle(COLORS.panel, 0.6);
                rowBg.fillRoundedRect(165, y - 4, 950, 32, 6);
                rowBg.lineStyle(1.5, COLORS.yellow, 0.7);
                rowBg.strokeRoundedRect(165, y - 4, 950, 32, 6);
                this.rows.push(rowBg);
            }

            const rankStr = isTop3 ? `${index + 1} ${medalIcons[index]}` : `#${index + 1}`;
            const color = isSelf ? '#ffd166' : isTop3 ? '#5ce1e6' : '#ffffff';

            this.rows.push(this.add.text(180, y, rankStr, textStyle(19, color)));
            this.rows.push(this.add.text(260, y, String(score.name || 'Anonymous Pilot').slice(0, 18), textStyle(19, color)));
            this.rows.push(this.add.text(970, y, formatNumber(score.score), textStyle(19, color)).setOrigin(1, 0));
            this.rows.push(this.add.text(1080, y, `T${score.threat || 1}`, textStyle(17, COLORS.muted)).setOrigin(1, 0));
        });

        if (!result.scores.length) {
            this.rows.push(this.add.text(640, 310, 'No endless scores recorded yet. Launch an endless mission!', textStyle(22, COLORS.muted)).setOrigin(0.5));
        }
    }
}
