import { playerProfile } from './PlayerProfile.js';

export const AUDIO_ASSETS = {
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

function isSoundUsable(sound) {
    return Boolean(sound?.manager);
}

function setSoundVolume(sound, volume) {
    if (!isSoundUsable(sound)) return false;
    try {
        sound.setVolume(volume);
        return true;
    } catch (_) {
        return false;
    }
}

function disposeSound(sound) {
    if (!isSoundUsable(sound)) return;
    try { sound.stop(); } catch (_) {}
    try { sound.destroy(); } catch (_) {}
}

function fadeSound(scene, sound, targetVolume, duration, onComplete) {
    if (!isSoundUsable(sound)) {
        onComplete?.();
        return undefined;
    }
    let currentVolume = 0;
    try { currentVolume = Number(sound.volume) || 0; } catch (_) {}
    const state = { volume: currentVolume };
    return scene.tweens.add({
        targets: state,
        volume: targetVolume,
        duration,
        ease: targetVolume > state.volume ? 'Sine.easeOut' : 'Sine.easeIn',
        onUpdate: () => setSoundVolume(sound, state.volume),
        onComplete,
    });
}

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

    if (activeMusic && !isSoundUsable(activeMusic.sound)) activeMusic = undefined;
    if (activeMusic?.key === key && !options.restart) {
        activeMusic.baseVolume = baseVolume;
        setSoundVolume(activeMusic.sound, targetVolume);
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
        fadeSound(scene, sound, targetVolume, fade);
        if (previous) {
            fadeSound(scene, previous, 0, Math.min(fade, 300), () => disposeSound(previous));
        }
    } else if (previous) {
        disposeSound(previous);
    }
    return sound;
}

export function stopMusic(scene, fade = 0) {
    if (!activeMusic) return;
    const music = activeMusic.sound;
    activeMusic = undefined;
    if (fade > 0 && scene.sys?.isActive()) {
        fadeSound(scene, music, 0, fade, () => disposeSound(music));
    } else {
        disposeSound(music);
    }
}

export function updateMusicVolume() {
    if (!activeMusic) return;
    setSoundVolume(
        activeMusic.sound,
        activeMusic.baseVolume * playerProfile.data.settings.masterVolume * playerProfile.data.settings.musicVolume,
    );
}

export function getActiveMusic() {
    return activeMusic?.sound;
}
