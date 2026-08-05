import Phaser from 'phaser';
import { playerProfile } from '../services/PlayerProfile';
import { addBackButton, addButton, addPanel, addSpaceBackground, addTitle, COLORS, showToast, textStyle } from '../ui';
import { configureSharpCamera } from '../config/layout';

export default class OptionsScene extends Phaser.Scene {
    constructor() { super('options'); }
    preload() { this.load.image('menu', 'assets/menu.png'); }
    create() {
        configureSharpCamera(this);
        addSpaceBackground(this);
        addTitle(this, 'OPTIONS', 'Audio and accessibility settings');
        addPanel(this, 640, 292, 900, 330);
        this.add.text(250, 160, 'MASTER VOLUME', textStyle(25));
        this.add.rectangle(640, 222, 650, 14, COLORS.panel, 1).setStrokeStyle(2, COLORS.cyan, 0.7);
        this.volumeFill = this.add.rectangle(315, 222, 650 * playerProfile.data.settings.volume, 12, COLORS.cyan, 0.9).setOrigin(0, 0.5);
        this.volumeHandle = this.add.circle(315 + 650 * playerProfile.data.settings.volume, 222, 18, COLORS.white, 1).setInteractive({ draggable: true, useHandCursor: true });
        this.input.setDraggable(this.volumeHandle);
        this.input.on('drag', (_pointer, target, dragX) => {
            if (target !== this.volumeHandle) return;
            const x = Phaser.Math.Clamp(dragX, 315, 965);
            target.x = x;
            const volume = (x - 315) / 650;
            this.volumeFill.width = 650 * volume;
            playerProfile.data.settings.volume = volume;
            this.sound.volume = volume;
            playerProfile.save();
        });

        this.vibrationButton = addButton(this, 640, 310, '', () => {
            playerProfile.data.settings.vibration = !playerProfile.data.settings.vibration;
            playerProfile.save();
            this.refreshVibration();
            if (playerProfile.data.settings.vibration) navigator.vibrate?.(35);
        }, { width: 500, accent: COLORS.yellow });
        this.refreshVibration();

        addButton(this, 640, 390, 'RESET PROGRESS', () => {
            if (window.confirm('Reset all missions, credits, upgrades, skins, and achievements?')) {
                playerProfile.reset();
                showToast(this, 'Progress reset', COLORS.red);
            }
        }, { width: 300, accent: COLORS.red, fontSize: 22 });
        addBackButton(this);
    }

    refreshVibration() {
        this.vibrationButton.label.setText(`HAPTICS: ${playerProfile.data.settings.vibration ? 'ON' : 'OFF'}`);
    }
}
