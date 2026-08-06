import Phaser from 'phaser';
import { LEVELS, getLevel } from '../config/gameData';
import { playerProfile } from '../services/PlayerProfile';
import { leaderboardService } from '../services/LeaderboardService';
import { addButton, addPanel, addSpaceBackground, COLORS, drawIcon, fadeToScene, formatNumber, textStyle } from '../ui';
import { configureSharpCamera, GAME_CENTER_X, watchResponsiveLayout } from '../config/layout';
import { playMusic, preloadAudio } from '../services/AudioService';

export default class EndScene extends Phaser.Scene {
    constructor() { super('end'); }

    preload() {
        this.load.image('menu', 'assets/menu-space-v2.png');
        preloadAudio(this, ['deathTheme', 'titleMusic']);
    }

    create(data) {
        configureSharpCamera(this);
        const run = {
            mode: data.mode === 'endless' ? 'endless' : 'campaign',
            victory: Boolean(data.victory),
            score: Math.max(0, Number(data.score) || 0),
            speedBonus: Math.max(0, Number(data.speedBonus) || 0),
            threat: Math.min(6, Math.max(1, Number(data.threat) || 1)),
            kills: Math.max(0, Number(data.kills) || 0),
            coins: Math.max(0, Number(data.coins) || 0),
            rescues: Math.max(0, Number(data.rescues) || 0),
            seconds: Math.max(0, Number(data.seconds) || 0),
            levelId: getLevel(data.levelId).id,
        };

        const rewards = playerProfile.recordRun(run);
        if (run.mode === 'endless') {
            leaderboardService.submitScore({ score: run.score, threat: run.threat })
                .catch(error => console.warn('Score sync failed.', error));
        }

        addSpaceBackground(this);
        if (!run.victory) playMusic(this, 'deathTheme', { volume: 0.4, fade: 500 });

        // Outcome Header
        const titleText = run.mode === 'endless'
            ? 'ENDLESS RUN OVER'
            : run.victory
            ? '★ MISSION COMPLETE ★'
            : '⚠ SHIP DESTROYED ⚠';
        const titleColor = run.victory ? '#7ae582' : run.mode === 'endless' ? '#5ce1e6' : '#ff6b6b';
        const runLabel = run.mode === 'endless'
            ? `ENDLESS MODE • THREAT LEVEL ${run.threat}`
            : `SECTOR 0${run.levelId} • ${getLevel(run.levelId).name.toUpperCase()}`;

        const headerTitle = this.add.text(640, 52, titleText, textStyle(44, titleColor)).setOrigin(0.5);
        headerTitle.setShadow(0, 4, titleColor, 10, true, true);
        const runLabelText = this.add.text(640, 92, runLabel, textStyle(18, COLORS.muted)).setOrigin(0.5);

        // Main Score Card Frame
        addPanel(this, 640, 272, 960, 310, 0.94);

        // --- Hero Score Banner (Top Center of Score Card) ---
        this.add.text(640, 140, 'FINAL DEBRIEF SCORE', textStyle(16, COLORS.cyan)).setOrigin(0.5);

        const heroScoreText = this.add.text(640, 175, '0', textStyle(44, '#ffffff'))
            .setOrigin(0.5)
            .setShadow(0, 3, 'rgba(92, 225, 230, 0.7)', 10, true, true);

        // Animated Score Counter
        let displayScore = 0;
        const targetScore = run.score;
        this.tweens.addCounter({
            from: 0,
            to: targetScore,
            duration: 900,
            ease: 'Cubic.out',
            onUpdate: tween => {
                displayScore = Math.floor(tween.getValue());
                heroScoreText.setText(formatNumber(displayScore));
            },
        });

        // New High Score Badge
        if (rewards.isNewBest) {
            const newRecordBadge = this.add.text(640, 212, '★ NEW HIGH SCORE! ★', textStyle(17, '#ffd166')).setOrigin(0.5);
            this.tweens.add({
                targets: newRecordBadge,
                scale: 1.08,
                duration: 650,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
            });
        }

        // --- Grid Metric Cards (4 Stat Boxes) ---
        const boxY = 300;
        const boxWidth = 210;
        const boxHeight = 72;
        const boxes = [
            { x: 260, label: 'ELIMINATED', value: `${run.kills} Targets`, icon: 'target', color: '#ffffff', iconColor: COLORS.white },
            { x: 510, label: 'COINS COLLECTED', value: `◆ ${run.coins}`, icon: 'coin', color: '#ffd166', iconColor: COLORS.yellow },
            { x: 760, label: 'FLIGHT TIME', value: `${run.seconds}s ${run.speedBonus > 0 ? `(+${run.speedBonus} bonus)` : ''}`, icon: 'clock', color: '#5ce1e6', iconColor: COLORS.cyan },
            { x: 1010, label: 'CREDITS REWARD', value: `+◆ ${formatNumber(rewards.creditsEarned)}`, icon: 'gem', color: '#7ae582', iconColor: COLORS.green },
        ];

        boxes.forEach(box => {
            const cardGraphics = this.add.graphics();
            cardGraphics.fillStyle(COLORS.panel, 0.75);
            cardGraphics.fillRoundedRect(box.x - boxWidth / 2, boxY - boxHeight / 2, boxWidth, boxHeight, 8);
            cardGraphics.lineStyle(1.5, COLORS.cyan, 0.35);
            cardGraphics.strokeRoundedRect(box.x - boxWidth / 2, boxY - boxHeight / 2, boxWidth, boxHeight, 8);

            drawIcon(this, box.icon, box.x - boxWidth / 2 + 22, boxY - 18, 15, box.iconColor);
            this.add.text(box.x + 8, boxY - 18, box.label, textStyle('label', COLORS.muted)).setOrigin(0.5);
            this.add.text(box.x, boxY + 10, box.value, textStyle(19, box.color)).setOrigin(0.5);
        });

        // --- Achievement / Sector Unlock Alert ---
        if (rewards.unlocked.length) {
            const bannerText = `★ ACHIEVEMENT UNLOCKED: ${rewards.unlocked.map(item => item.name).join(', ')} ★`;
            this.add.text(640, 396, bannerText, textStyle(18, '#ffd166')).setOrigin(0.5);
        } else if (rewards.firstCompletion) {
            this.add.text(640, 396, '★ NEXT SECTOR UNLOCKED ★', textStyle(18, '#7ae582')).setOrigin(0.5);
        }

        // --- Action Buttons ---
        const nextLevel = Math.min(LEVELS.length, run.levelId + 1);
        if (run.mode === 'endless') {
            addButton(this, 450, 460, 'RETRY ENDLESS', () => this.go('play', { mode: 'endless', levelId: 1 }), { width: 320, accent: COLORS.green });
            addButton(this, 830, 460, 'HANGAR', () => this.go('hangar'), { width: 320, accent: COLORS.yellow });
        } else if (run.victory && run.levelId < LEVELS.length) {
            addButton(this, 450, 460, 'NEXT MISSION', () => this.go('play', { levelId: nextLevel }), { width: 320, accent: COLORS.green });
            addButton(this, 830, 460, 'HANGAR', () => this.go('hangar'), { width: 320, accent: COLORS.yellow });
        } else {
            addButton(this, 450, 460, 'RETRY MISSION', () => this.go('play', { levelId: run.levelId }), { width: 320, accent: COLORS.green });
            addButton(this, 830, 460, 'HANGAR', () => this.go('hangar'), { width: 320, accent: COLORS.yellow });
        }
        addButton(this, 640, 528, run.mode === 'endless' ? 'MAIN MENU' : 'MISSION SELECT', () => this.go(run.mode === 'endless' ? 'menu' : 'levels'), { width: 320, height: 44, fontSize: 22 });

        watchResponsiveLayout(this, layout => {
            headerTitle.setPosition(GAME_CENTER_X, layout.cameraTop + 52);
            runLabelText.setPosition(GAME_CENTER_X, layout.cameraTop + 92);
        });
    }

    go(scene, data) {
        fadeToScene(this, scene, data);
    }
}
