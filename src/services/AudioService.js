import { playerProfile } from './PlayerProfile.js';

export const AUDIO_ASSETS = {
    uiClick: 'assets/Sound/UiClick.wav',
    coinPickup: 'assets/Sound/CoinPickup.wav',
    emptyAmmo: 'assets/Sound/EmptyAmmo.wav',
    victorySting: 'assets/Sound/VictorySting.wav',
    titleMusic: 'assets/Sound/TitleTheme.mp3',
    gameTheme: 'assets/Sound/GameTheme.mp3',
    deathTheme: 'assets/Sound/DeathTheme.mp3',
    deathSound: 'assets/Sound/DeathSound.mp3',
    explosion: 'assets/Sound/Explosion.mp3',
    impact: 'assets/Sound/Impact.wav',
    accelerationSound: 'assets/Sound/ShipAccelerate.mp3',
    lowHealthAccelerationSound: 'assets/Sound/ShipAccelerateLowHealth.mp3',
    pew1: 'assets/Sound/Pew1.mp3',
    pew2: 'assets/Sound/Pew2.mp3',
    pew3: 'assets/Sound/Pew3.mp3',
};

let activeMusic;

export function preloadAudio(scene, keys = Object.keys(AUDIO_ASSETS)) {
    keys.forEach(key => {
        if (!scene.cache.audio.exists(key)) scene.load.audio(key, AUDIO_ASSETS[key]);
    });
}

export function playSfx(scene, key, options = {}) {
    if (!scene.cache.audio.exists(key)) return undefined;
    const setting = playerProfile.data.settings.masterVolume * playerProfile.data.settings.sfxVolume;
    if (setting <= 0) return undefined;
    const volume = Math.min(1, Math.max(0, (options.volume ?? 1) * setting));
    return scene.sound.play(key, { ...options, volume });
}

export function playMusic(scene, key, options = {}) {
    if (!scene.cache.audio.exists(key)) return undefined;
    const baseVolume = options.volume ?? 1;
    const targetVolume = baseVolume * playerProfile.data.settings.masterVolume * playerProfile.data.settings.musicVolume;

    if (activeMusic?.key === key && !options.restart) {
        activeMusic.baseVolume = baseVolume;
        activeMusic.sound.setVolume(targetVolume);
        if (!activeMusic.sound.isPlaying) activeMusic.sound.play();
        return activeMusic.sound;
    }

    const previous = activeMusic?.sound;
    const sound = scene.sound.add(key, {
        loop: options.loop ?? true,
        volume: options.fade === 0 ? targetVolume : 0,
    });
    activeMusic = { key, sound, baseVolume };
    sound.play();

    const fade = options.fade ?? 450;
    if (fade > 0) {
        scene.tweens.add({ targets: sound, volume: targetVolume, duration: fade, ease: 'Sine.easeOut' });
        if (previous) {
            scene.tweens.add({
                targets: previous,
                volume: 0,
                duration: Math.min(fade, 300),
                ease: 'Sine.easeIn',
                onComplete: () => {
                    previous.stop();
                    previous.destroy();
                },
            });
        }
    } else if (previous) {
        previous.stop();
        previous.destroy();
    }
    return sound;
}

export function stopMusic(scene, fade = 0) {
    if (!activeMusic) return;
    const music = activeMusic.sound;
    activeMusic = undefined;
    if (fade > 0 && scene.sys?.isActive()) {
        scene.tweens.add({
            targets: music,
            volume: 0,
            duration: fade,
            onComplete: () => {
                music.stop();
                music.destroy();
            },
        });
    } else {
        music.stop();
        music.destroy();
    }
}

export function updateMusicVolume() {
    if (!activeMusic) return;
    activeMusic.sound.setVolume(
        activeMusic.baseVolume * playerProfile.data.settings.masterVolume * playerProfile.data.settings.musicVolume,
    );
}

export function getActiveMusic() {
    return activeMusic?.sound;
}
