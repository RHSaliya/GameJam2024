import Phaser from 'phaser';
import { addBackButton, addPanel, addSpaceBackground, addTitle, COLORS, textStyle } from '../ui';
import { configureSharpCamera } from '../config/layout';

export default class InstructionsScene extends Phaser.Scene {
    constructor() { super('instructions'); }
    preload() { this.load.image('menu', 'assets/menu.png'); }
    create() {
        configureSharpCamera(this);
        addSpaceBackground(this);
        addTitle(this, 'HOW TO PLAY', 'Survive, destroy the target, and bring your credits home');
        addPanel(this, 640, 305, 1000, 390);
        const sections = [
            ['↺  ↻', 'ROTATE', 'Touch the left controls. Keyboard: A/D or arrow keys.'],
            ['▲', 'THRUST', 'Hold thrust to accelerate. Keyboard: W or Up.'],
            ['FIRE', 'BLASTER', 'Hold Fire to shoot. Every hit returns some ammo. Keyboard: Space.'],
            ['◆', 'PROGRESS', 'Complete the asteroid target to unlock the next mission and earn credits.'],
        ];
        sections.forEach(([icon, title, body], index) => {
            const y = 155 + index * 83;
            this.add.circle(230, y, 30, COLORS.panel, 1).setStrokeStyle(2, COLORS.cyan, 0.7);
            this.add.text(230, y, icon, textStyle(icon === 'FIRE' ? 15 : 25, '#ffffff')).setOrigin(0.5);
            this.add.text(290, y - 27, title, textStyle(23, '#ffd166'));
            this.add.text(290, y + 3, body, textStyle(18, COLORS.muted)).setWordWrapWidth(760);
        });
        this.add.text(640, 493, 'Tip: Upgrade your hull and shields before the later sectors.', textStyle(19, '#7ae582')).setOrigin(0.5);
        addBackButton(this);
    }
}
