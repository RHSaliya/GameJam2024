import Phaser from 'phaser';
import '../../public/font.css';
import { cleanDisplayName, playerProfile } from '../services/PlayerProfile';
import { addButton, addSpaceBackground, formatNumber, showToast, textStyle, COLORS } from '../ui';
import { configureSharpCamera, GAME_CENTER_X, GAME_WIDTH } from '../config/layout';
import { preloadAudio } from '../services/AudioService';
import { leaderboardService } from '../services/LeaderboardService';

export default class MenuScene extends Phaser.Scene {
    constructor() { super('menu'); }

    preload() {
        this.load.image('menu', 'assets/menu.png');
        this.load.image('titleImage', 'assets/spacetitle.png');
        this.load.image('title', 'assets/title.png');
        this.load.image('ship', 'assets/space/Spaceship.png');
        preloadAudio(this, ['titleMusic']);
    }

    create() {
        configureSharpCamera(this);
        addSpaceBackground(this, 'menu', { animated: true });
        const centerX = GAME_CENTER_X;

        // Keep the complete brand and action grid centered as one vertical group.
        this.brandImage = this.add.image(centerX, 138, 'titleImage').setScale(0.38);
        this.gameTitle = this.add.image(centerX, 235, 'title').setScale(0.46);

        if (!playerProfile.data.pilotNameLocked) {
            this.brandImage.setY(65);
            this.gameTitle.setY(155);
            this.showPilotNameOnboarding();
            return;
        }
        this.createMenuActions();
    }

    createMenuActions() {
        const profile = playerProfile.data;
        const centerX = GAME_CENTER_X;
        this.add.text(28, 20, `ENDLESS BEST ${formatNumber(profile.endlessBestScore)}`, textStyle(24, '#ffffff'));
        this.add.text(GAME_WIDTH - 28, 20, `◆ ${formatNumber(profile.credits)}`, textStyle(25, '#ffd166')).setOrigin(1, 0);

        const go = (scene, data) => this.scene.start(scene, data);
        const left = centerX - 200;
        const right = centerX + 200;
        addButton(this, left, 326, 'CAMPAIGN', () => go('levels'), { width: 360, accent: COLORS.green });
        addButton(this, right, 326, 'ENDLESS MODE', () => go('play', { mode: 'endless', levelId: 1 }), { width: 360, accent: COLORS.red });
        addButton(this, left, 388, 'HANGAR', () => go('hangar'), { width: 360, accent: COLORS.yellow });
        addButton(this, right, 388, 'ACHIEVEMENTS', () => go('achievements'), { width: 360 });
        addButton(this, left, 450, 'LEADERBOARD', () => go('leaderboard'), { width: 360 });
        addButton(this, right, 450, 'OPTIONS', () => go('options'), { width: 360 });
        addButton(this, centerX, 512, 'HOW TO PLAY', () => go('instructions'), { width: 360 });

        this.add.text(28, 564, `PILOT • ${profile.displayName}`, textStyle(22, '#ffffff')).setOrigin(0, 1);
        this.add.text(GAME_WIDTH - 20, 585, 'v2.1', textStyle(14, '#7781a4')).setOrigin(1);
    }

    showPilotNameOnboarding() {
        this.destroyPilotNameDialog();

        const shell = document.createElement('div');
        shell.id = 'pilot-name-dialog';
        shell.className = 'pilot-name-dialog-shell';

        const form = document.createElement('form');
        form.className = 'pilot-name-dialog';
        form.autocomplete = 'off';

        const title = document.createElement('h1');
        title.textContent = 'CHOOSE YOUR PILOT NAME';

        const body = document.createElement('p');
        body.textContent = 'Your unique pilot name appears on the leaderboard. Choose carefully — it cannot be edited later.';

        const label = document.createElement('label');
        label.htmlFor = 'pilot-name-input';
        label.textContent = 'PILOT NAME';

        const input = document.createElement('input');
        input.id = 'pilot-name-input';
        input.name = 'pilotName';
        input.type = 'text';
        input.inputMode = 'text';
        input.enterKeyHint = 'done';
        input.maxLength = 18;
        input.minLength = 3;
        input.placeholder = 'Nova Ace';
        input.autocapitalize = 'words';
        input.autocomplete = 'off';
        input.spellcheck = false;

        const status = document.createElement('p');
        status.className = 'pilot-name-status';
        status.textContent = '3–18 letters, numbers, spaces, _ or -';

        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.textContent = 'LOCK PILOT NAME';

        form.append(title, body, label, input, status, submit);
        shell.append(form);
        document.getElementById('app').append(shell);

        this.nameDialog = { shell, form, input, status, submit };
        form.addEventListener('submit', event => {
            event.preventDefault();
            input.blur();
            this.choosePilotName(input.value);
        });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroyPilotNameDialog());
    }

    setPilotNameStatus(message, error = false) {
        if (!this.nameDialog) return;
        this.nameDialog.status.textContent = message;
        this.nameDialog.status.classList.toggle('is-error', error);
    }

    async choosePilotName(nextName) {
        if (this.claimingName) return;
        const cleaned = cleanDisplayName(nextName);
        if (cleaned.length < 3) {
            this.setPilotNameStatus('Name must contain at least 3 valid characters.', true);
            this.nameDialog?.input.focus();
            return;
        }

        this.claimingName = true;
        this.nameDialog.submit.disabled = true;
        this.setPilotNameStatus('Checking availability…');
        const reservation = await leaderboardService.claimPilotName(cleaned);
        this.claimingName = false;
        if (!this.scene.isActive()) return;
        if (!reservation.ok) {
            const message = reservation.reason === 'TAKEN'
                ? 'That pilot name is already taken. Choose another.'
                : 'Could not verify the name. Check your connection and retry.';
            this.nameDialog.submit.disabled = false;
            this.setPilotNameStatus(message, true);
            this.nameDialog.input.focus();
            return;
        }

        const result = playerProfile.lockDisplayName(cleaned);
        if (!result.ok) {
            this.nameDialog.submit.disabled = false;
            this.setPilotNameStatus('Could not lock that name. Please retry.', true);
            return;
        }
        this.destroyPilotNameDialog();
        this.brandImage.setY(138);
        this.gameTitle.setY(235);
        showToast(this, `Welcome aboard, ${result.displayName}!`);
        this.createMenuActions();
    }

    destroyPilotNameDialog() {
        this.nameDialog?.shell.remove();
        this.nameDialog = undefined;
        document.getElementById('pilot-name-dialog')?.remove();
    }
}
