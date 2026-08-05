import Phaser from 'phaser';
import { LEVELS, getLevel } from '../config/gameData';
import { playerProfile } from '../services/PlayerProfile';
import { leaderboardService } from '../services/LeaderboardService';
import { addButton, addPanel, addSpaceBackground, COLORS, formatNumber, textStyle } from '../ui';
import { configureSharpCamera } from '../config/layout';
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

        const resultTitle = run.mode === 'endless' ? 'ENDLESS RUN OVER' : run.victory ? 'MISSION COMPLETE' : 'SHIP LOST';
        const runLabel = run.mode === 'endless' ? 'ENDLESS MODE' : `MISSION ${run.levelId} • ${getLevel(run.levelId).name}`;
        this.add.text(640, 64, resultTitle, textStyle(46, run.victory ? '#7ae582' : '#ff6b6b')).setOrigin(0.5);
        this.add.text(640, 105, runLabel, textStyle(21, COLORS.muted)).setOrigin(0.5);
        addPanel(this, 640, 253, 900, run.speedBonus > 0 ? 270 : 240, 0.94);

        const stats = [
            ['SCORE', formatNumber(run.score)],
            ...(run.speedBonus > 0 ? [['SPEED BONUS', `+${formatNumber(run.speedBonus)}`]] : []),
            ['ASTEROIDS', run.kills],
            ['COINS COLLECTED', `◆ ${run.coins}`],
            ['FLIGHT TIME', `${run.seconds}s`],
            ['CREDITS EARNED', `◆ ${formatNumber(rewards.creditsEarned)}`],
        ];
        stats.forEach(([label, value], index) => {
            const y = 140 + index * (run.speedBonus > 0 ? 37 : 42);
            this.add.text(260, y, label, textStyle(21, COLORS.muted));
            const valueColor = label === 'FLIGHT TIME' || label === 'SPEED BONUS' ? '#ffd166' : '#ffffff';
            this.add.text(1020, y, String(value), textStyle(25, valueColor)).setOrigin(1, 0);
        });

        if (rewards.unlocked.length) {
            this.add.text(640, 391, `★ ACHIEVEMENT: ${rewards.unlocked.map(item => item.name).join(', ')}`, textStyle(19, '#ffd166')).setOrigin(0.5);
        } else if (rewards.firstCompletion) {
            this.add.text(640, 391, 'NEXT MISSION UNLOCKED', textStyle(19, '#7ae582')).setOrigin(0.5);
        }

        const nextLevel = Math.min(LEVELS.length, run.levelId + 1);
        if (run.mode === 'endless') {
            addButton(this, 450, 458, 'RETRY ENDLESS', () => this.go('play', { mode: 'endless', levelId: 1 }), { width: 320, accent: COLORS.green });
            addButton(this, 830, 458, 'HANGAR', () => this.go('hangar'), { width: 320, accent: COLORS.yellow });
        } else if (run.victory && run.levelId < LEVELS.length) {
            addButton(this, 450, 458, 'NEXT MISSION', () => this.go('play', { levelId: nextLevel }), { width: 320, accent: COLORS.green });
            addButton(this, 830, 458, 'HANGAR', () => this.go('hangar'), { width: 320, accent: COLORS.yellow });
        } else {
            addButton(this, 450, 458, 'RETRY', () => this.go('play', { levelId: run.levelId }), { width: 320, accent: COLORS.green });
            addButton(this, 830, 458, 'HANGAR', () => this.go('hangar'), { width: 320, accent: COLORS.yellow });
        }
        addButton(this, 640, 528, run.mode === 'endless' ? 'MAIN MENU' : 'MISSION SELECT', () => this.go(run.mode === 'endless' ? 'menu' : 'levels'), { width: 320, height: 44, fontSize: 22 });
    }

    go(scene, data) {
        this.scene.start(scene, data);
    }
}
