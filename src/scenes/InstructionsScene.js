import Phaser from 'phaser';
import { addBackButton, addPanel, addSpaceBackground, addTitle, COLORS, textStyle } from '../ui';
import { configureSharpCamera } from '../config/layout';

export default class InstructionsScene extends Phaser.Scene {
    constructor() { super('instructions'); }
    preload() { this.load.image('menu', 'assets/menu.png'); }
    create() {
        configureSharpCamera(this);
        addSpaceBackground(this);
        addTitle(this, 'HOW TO PLAY', 'Finish campaign targets quickly or survive as long as you can in Endless Mode');
        addPanel(this, 640, 305, 1000, 430);
        const sections = [
            ['↺  ↻', 'ROTATE', 'Touch the left controls. Keyboard: A/D or arrow keys.'],
            ['▲', 'THRUST', 'Hold thrust to accelerate. Keyboard: W or Up.'],
            ['FIRE', 'BLASTER', 'Hold Fire to shoot. Every hit returns some ammo. Keyboard: Space.'],
            ['✦', 'ENEMIES', 'Red strikers are fast, blue hunters steer, and purple juggernauts take several hits.'],
            ['◆', 'COINS', 'Destroyed enemies drop coins. Fly close to collect and bank them for upgrades and skins.'],
        ];
        sections.forEach(([icon, title, body], index) => {
            const y = 125 + index * 78;
            this.add.circle(230, y, 30, COLORS.panel, 1).setStrokeStyle(2, COLORS.cyan, 0.7);
            this.add.text(230, y, icon, textStyle(icon === 'FIRE' ? 15 : 25, '#ffffff')).setOrigin(0.5);
            this.add.text(290, y - 27, title, textStyle(23, '#ffd166'));
            this.add.text(290, y + 3, body, textStyle(18, COLORS.muted)).setWordWrapWidth(760);
        });
        this.add.text(640, 515, 'Campaign has no passive score — finish faster for a bigger bonus. Endless threat rises every 10 asteroids.', textStyle(17, '#7ae582')).setOrigin(0.5);
        addBackButton(this);
    }
}
