import Phaser from 'phaser';
import { playerProfile } from '../services/PlayerProfile';
import { addBackButton, addButton, addPanel, addSpaceBackground, addTitle, COLORS, showToast, textStyle } from '../ui';
import { configureSharpCamera } from '../config/layout';
import { preloadAudio, updateMusicVolume } from '../services/AudioService';

export default class OptionsScene extends Phaser.Scene {
    constructor() { super('options'); }
    preload() {
        this.load.image('menu', 'assets/menu-space-v2.png');
        preloadAudio(this, ['titleMusic']);
    }
    create() {
        configureSharpCamera(this);
        addSpaceBackground(this);
        addTitle(this, 'OPTIONS', 'Audio and accessibility settings');
        addPanel(this, 640, 310, 900, 470);
        this.createVolumeSlider('MASTER VOLUME', 'masterVolume', 140, () => {
            updateMusicVolume();
        });
        this.createVolumeSlider('MUSIC', 'musicVolume', 205, updateMusicVolume);
        this.createVolumeSlider('SOUND EFFECTS', 'sfxVolume', 270);

        this.input.on('drag', (pointer, target) => {
            if (!target.audioSlider) return;
            const worldPoint = pointer.positionToCamera(this.cameras.main);
            this.setSliderVolume(target.audioSlider, worldPoint.x);
        });

        const toggleY1 = 330;
        const toggleY2 = 385;

        this.vibrationButton = addButton(this, 440, toggleY1, '', () => {
            playerProfile.data.settings.vibration = !playerProfile.data.settings.vibration;
            playerProfile.save();
            this.refreshButtons();
            if (playerProfile.data.settings.vibration) navigator.vibrate?.(35);
        }, { width: 380, accent: COLORS.yellow, fontSize: 19 });

        this.autoFireButton = addButton(this, 840, toggleY1, '', () => {
            playerProfile.data.settings.autoFire = !playerProfile.data.settings.autoFire;
            playerProfile.save();
            this.refreshButtons();
        }, { width: 380, accent: COLORS.cyan, fontSize: 19 });

        this.aimAssistButton = addButton(this, 440, toggleY2, '', () => {
            playerProfile.data.settings.aimAssist = !playerProfile.data.settings.aimAssist;
            playerProfile.save();
            this.refreshButtons();
        }, { width: 380, accent: COLORS.cyan, fontSize: 19 });

        this.touchModeButton = addButton(this, 840, toggleY2, '', () => {
            playerProfile.data.settings.touchMode = playerProfile.data.settings.touchMode === 'joystick' ? 'buttons' : 'joystick';
            playerProfile.save();
            this.refreshButtons();
        }, { width: 380, accent: COLORS.yellow, fontSize: 19 });

        this.refreshButtons();

        addButton(this, 640, 460, 'RESET PROGRESS', () => {
            if (window.confirm('Reset all missions, credits, upgrades, skins, and achievements?')) {
                playerProfile.reset();
                updateMusicVolume();
                this.refreshButtons();
                showToast(this, 'Progress reset', COLORS.red);
            }
        }, { width: 280, accent: COLORS.red, fontSize: 20 });
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
        track.on('pointerdown', pointer => {
            const worldPoint = pointer.positionToCamera(this.cameras.main);
            this.setSliderVolume(slider, worldPoint.x);
        });
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

    refreshButtons() {
        const s = playerProfile.data.settings;
        this.vibrationButton?.label.setText(`HAPTICS: ${s.vibration ? 'ON' : 'OFF'}`);
        this.autoFireButton?.label.setText(`AUTO-FIRE: ${s.autoFire ? 'ON' : 'OFF'}`);
        this.aimAssistButton?.label.setText(`AIM ASSIST: ${s.aimAssist ? 'ON' : 'OFF'}`);
        this.touchModeButton?.label.setText(`CONTROLS: ${s.touchMode === 'joystick' ? 'JOYSTICK' : 'BUTTONS'}`);
    }
}
