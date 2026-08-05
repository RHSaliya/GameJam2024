import Phaser from 'phaser';
import { leaderboardService } from '../services/LeaderboardService';
import { addBackButton, addPanel, addSpaceBackground, addTitle, COLORS, formatNumber, textStyle } from '../ui';
import { configureSharpCamera } from '../config/layout';

export default class LeaderboardScene extends Phaser.Scene {
    constructor() { super('leaderboard'); }
    preload() { this.load.image('menu', 'assets/menu.png'); }
    create() {
        configureSharpCamera(this);
        addSpaceBackground(this);
        addTitle(this, 'LEADERBOARD', 'Best score per pilot');
        addPanel(this, 640, 325, 1000, 430);
        this.status = this.add.text(640, 113, 'Connecting…', textStyle(18, COLORS.muted)).setOrigin(0.5);
        this.rows = [];
        addBackButton(this);
        this.loadScores();
    }

    async loadScores() {
        const result = await leaderboardService.getTopScores(10);
        if (!this.scene.isActive()) return;
        this.status.setText(result.mode === 'firebase' ? 'GLOBAL • FIREBASE' : 'LOCAL SCORES • ADD FIREBASE CONFIG FOR GLOBAL RANKS');
        result.scores.forEach((score, index) => {
            const y = 150 + index * 36;
            const color = index < 3 ? '#ffd166' : '#ffffff';
            this.rows.push(this.add.text(180, y, `${index + 1}`, textStyle(20, color)));
            this.rows.push(this.add.text(245, y, String(score.name || 'Anonymous Pilot').slice(0, 18), textStyle(20, color)));
            this.rows.push(this.add.text(1000, y, formatNumber(score.score), textStyle(20, color)).setOrigin(1, 0));
            this.rows.push(this.add.text(1100, y, `L${score.level || 1}`, textStyle(18, COLORS.muted)).setOrigin(1, 0));
        });
        if (!result.scores.length) this.rows.push(this.add.text(640, 300, 'No scores yet. Launch a mission!', textStyle(24, COLORS.muted)).setOrigin(0.5));
    }
}
