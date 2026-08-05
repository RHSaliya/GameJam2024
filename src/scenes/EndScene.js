import Phaser from 'phaser';
import { LEVELS, getLevel } from '../config/gameData';
import { playerProfile } from '../services/PlayerProfile';
import { leaderboardService } from '../services/LeaderboardService';
import { addButton, addPanel, addSpaceBackground, COLORS, formatNumber, textStyle } from '../ui';
import { configureSharpCamera } from '../config/layout';

export default class EndScene extends Phaser.Scene {
    constructor() { super('end'); }

    preload() {
        this.load.image('menu', 'assets/menu.png');
        this.load.audio('deathTheme', 'assets/Sound/DeathTheme.mp3');
    }

    create(data) {
        configureSharpCamera(this);
        const run = {
            victory: Boolean(data.victory),
            score: Math.max(0, Number(data.score) || 0),
            kills: Math.max(0, Number(data.kills) || 0),
            coins: Math.max(0, Number(data.coins) || 0),
            seconds: Math.max(0, Number(data.seconds) || 0),
            levelId: getLevel(data.levelId).id,
        };
        const rewards = playerProfile.recordRun(run);
        leaderboardService.submitScore({ score: run.score, level: run.levelId }).catch(error => console.warn('Score sync failed.', error));

        addSpaceBackground(this);
        this.music = this.sound.add('deathTheme', { loop: true, volume: 0.45 });
        this.music.play();
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.music?.stop());

        this.add.text(640, 64, run.victory ? 'MISSION COMPLETE' : 'SHIP LOST', textStyle(46, run.victory ? '#7ae582' : '#ff6b6b')).setOrigin(0.5);
        this.add.text(640, 105, `MISSION ${run.levelId} • ${getLevel(run.levelId).name}`, textStyle(21, COLORS.muted)).setOrigin(0.5);
        addPanel(this, 640, 253, 900, 240, 0.94);

        const stats = [
            ['SCORE', formatNumber(run.score)],
            ['ASTEROIDS', run.kills],
            ['COINS COLLECTED', `◆ ${run.coins}`],
            ['FLIGHT TIME', `${run.seconds}s`],
            ['CREDITS EARNED', `◆ ${formatNumber(rewards.creditsEarned)}`],
        ];
        stats.forEach(([label, value], index) => {
            const y = 145 + index * 42;
            this.add.text(260, y, label, textStyle(21, COLORS.muted));
            this.add.text(1020, y, String(value), textStyle(25, index === 3 ? '#ffd166' : '#ffffff')).setOrigin(1, 0);
        });

        if (rewards.unlocked.length) {
            this.add.text(640, 391, `★ ACHIEVEMENT: ${rewards.unlocked.map(item => item.name).join(', ')}`, textStyle(19, '#ffd166')).setOrigin(0.5);
        } else if (rewards.firstCompletion) {
            this.add.text(640, 391, 'NEXT MISSION UNLOCKED', textStyle(19, '#7ae582')).setOrigin(0.5);
        }

        const nextLevel = Math.min(LEVELS.length, run.levelId + 1);
        if (run.victory && run.levelId < LEVELS.length) {
            addButton(this, 450, 458, 'NEXT MISSION', () => this.go('play', { levelId: nextLevel }), { width: 320, accent: COLORS.green });
            addButton(this, 830, 458, 'HANGAR', () => this.go('hangar'), { width: 320, accent: COLORS.yellow });
        } else {
            addButton(this, 450, 458, 'RETRY', () => this.go('play', { levelId: run.levelId }), { width: 320, accent: COLORS.green });
            addButton(this, 830, 458, 'HANGAR', () => this.go('hangar'), { width: 320, accent: COLORS.yellow });
        }
        addButton(this, 640, 528, 'MISSION SELECT', () => this.go('levels'), { width: 320, height: 44, fontSize: 22 });
    }

    go(scene, data) {
        this.music?.stop();
        this.scene.start(scene, data);
    }
}
