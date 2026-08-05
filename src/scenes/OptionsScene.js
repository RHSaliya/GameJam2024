import Phaser from 'phaser';
import { playerProfile } from '../services/PlayerProfile';
import { addBackButton, addButton, addPanel, addSpaceBackground, addTitle, COLORS, showToast, textStyle } from '../ui';
import { configureSharpCamera } from '../config/layout';
import { preloadAudio, updateMusicVolume } from '../services/AudioService';

export default class OptionsScene extends Phaser.Scene {
    constructor() { super('options'); }
    preload() {
        this.load.image('menu', 'assets/menu.png');
        preloadAudio(this, ['titleMusic']);
    }
    create() {
        configureSharpCamera(this);
        addSpaceBackground(this);
        addTitle(this, 'OPTIONS', 'Audio and accessibility settings');
        addPanel(this, 640, 310, 900, 430);
        this.createVolumeSlider('MASTER VOLUME', 'masterVolume', 155, () => {
            updateMusicVolume();
        });
        this.createVolumeSlider('MUSIC', 'musicVolume', 230, updateMusicVolume);
        this.createVolumeSlider('SOUND EFFECTS', 'sfxVolume', 305);

        this.input.on('drag', (_pointer, target, dragX) => {
            if (!target.audioSlider) return;
            this.setSliderVolume(target.audioSlider, dragX);
        });

        this.vibrationButton = addButton(this, 640, 385, '', () => {
            playerProfile.data.settings.vibration = !playerProfile.data.settings.vibration;
            playerProfile.save();
            this.refreshVibration();
            if (playerProfile.data.settings.vibration) navigator.vibrate?.(35);
        }, { width: 500, accent: COLORS.yellow });
        this.refreshVibration();

        addButton(this, 640, 460, 'RESET PROGRESS', () => {
            if (window.confirm('Reset all missions, credits, upgrades, skins, and achievements?')) {
                playerProfile.reset();
                updateMusicVolume();
                showToast(this, 'Progress reset', COLORS.red);
            }
        }, { width: 300, accent: COLORS.red, fontSize: 22 });
        addBackButton(this);
    }

    createVolumeSlider(label, setting, y, onChange) {
        const volume = playerProfile.data.settings[setting];
        this.add.text(250, y - 48, label, textStyle(23));
        const valueText = this.add.text(1030, y - 47, `${Math.round(volume * 100)}%`, textStyle(20, COLORS.muted)).setOrigin(1, 0);
        const track = this.add.rectangle(640, y, 650, 30, COLORS.panel, 0.01).setInteractive({ useHandCursor: true });
        this.add.rectangle(640, y, 650, 14, COLORS.panel, 1).setStrokeStyle(2, COLORS.cyan, 0.7);
        const fill = this.add.rectangle(315, y, 650 * volume, 12, COLORS.cyan, 0.9).setOrigin(0, 0.5);
        const handle = this.add.circle(315 + 650 * volume, y, 18, COLORS.white, 1).setInteractive({ draggable: true, useHandCursor: true });
        const slider = { fill, handle, valueText, setting, onChange };
        handle.audioSlider = slider;
        track.on('pointerdown', pointer => this.setSliderVolume(slider, pointer.x));
        this.input.setDraggable(handle);
    }

    setSliderVolume(slider, pointerX) {
        const x = Phaser.Math.Clamp(pointerX, 315, 965);
        const volume = (x - 315) / 650;
        slider.handle.x = x;
        slider.fill.width = 650 * volume;
        slider.valueText.setText(`${Math.round(volume * 100)}%`);
        playerProfile.data.settings[slider.setting] = volume;
        playerProfile.save();
        slider.onChange?.();
    }

    refreshVibration() {
        this.vibrationButton.label.setText(`HAPTICS: ${playerProfile.data.settings.vibration ? 'ON' : 'OFF'}`);
    }
}
