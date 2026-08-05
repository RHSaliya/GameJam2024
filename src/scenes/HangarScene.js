import Phaser from 'phaser';
import { SKINS, UPGRADES } from '../config/gameData';
import { playerProfile } from '../services/PlayerProfile';
import { addBackButton, addButton, addPanel, addSpaceBackground, addTitle, COLORS, formatNumber, showToast, textStyle } from '../ui';
import { configureSharpCamera } from '../config/layout';

export default class HangarScene extends Phaser.Scene {
    constructor() { super('hangar'); }

    preload() {
        this.load.image('menu', 'assets/menu-space-v2.png');
        SKINS.forEach(ship => this.load.image(`ship-${ship.id}`, ship.texture));
    }

    create() {
        configureSharpCamera(this);
        addSpaceBackground(this);
        addTitle(this, 'THE HANGAR', 'Upgrade equipment and customize your flight deck');
        this.creditText = this.add.text(1200, 30, '', textStyle(24, '#ffd166')).setOrigin(1, 0);

        this.tabUpgrades = addButton(this, 520, 105, 'UPGRADES', () => this.render('upgrades'), { width: 220, height: 42, accent: COLORS.cyan });
        this.tabShips = addButton(this, 760, 105, 'SHIPS', () => this.render('skins'), { width: 220, height: 42, accent: COLORS.yellow });
        addBackButton(this);

        this.dynamic = [];
        this.render('upgrades');
    }

    clearDynamic() { this.dynamic.forEach(item => item.destroy()); this.dynamic = []; }
    keep(item) { this.dynamic.push(item); return item; }
    refreshCredits() { this.creditText.setText(`◆ ${formatNumber(playerProfile.data.credits)}`); }

    render(tab) {
        this.clearDynamic();
        this.refreshCredits();
        this.activeTab = tab;
        this.tabUpgrades.setSelected(tab === 'upgrades');
        this.tabShips.setSelected(tab === 'skins');

        if (tab === 'upgrades') this.renderUpgrades(); else this.renderSkins();
    }

    renderUpgrades() {
        Object.entries(UPGRADES).forEach(([key, upgrade], index) => {
            const y = 178 + index * 89;
            this.keep(addPanel(this, 640, y, 1000, 76));
            const rank = playerProfile.data.upgrades[key];

            this.keep(this.add.text(170, y - 27, upgrade.name, textStyle(24)));
            this.keep(this.add.text(170, y + 6, upgrade.description, textStyle(16, COLORS.muted)));

            // Visual upgrade pips (e.g. ◆ ◆ ◆ ◇)
            const pips = Array.from({ length: 4 }, (_, i) => (i < rank ? '◆' : '◇')).join(' ');
            this.keep(this.add.text(780, y - 10, pips, textStyle(22, rank === 4 ? '#7ae582' : '#5ce1e6')));
            this.keep(this.add.text(780, y + 14, `LV ${rank}/4`, textStyle(14, COLORS.muted)));

            const cost = upgrade.costs[rank];
            this.keep(addButton(this, 1040, y, rank === 4 ? 'MAXED' : `◆ ${cost}`, () => {
                const result = playerProfile.buyUpgrade(key);
                if (!result.ok) showToast(this, 'Not enough credits', COLORS.red);
                else {
                    showToast(this, `${upgrade.name} upgraded!`);
                    this.render('upgrades');
                }
            }, { width: 150, height: 42, fontSize: 19, disabled: rank === 4, accent: COLORS.green }));
        });
    }

    renderSkins() {
        SKINS.forEach((skin, index) => {
            const y = 158 + index * 76;
            this.keep(addPanel(this, 640, y, 1000, 64));

            const shipImg = this.keep(this.add.image(190, y, `ship-${skin.id}`).setScale(0.16).setAngle(90));
            const owned = playerProfile.data.unlockedSkins.includes(skin.id);
            const selected = playerProfile.data.selectedSkin === skin.id;

            if (selected) {
                this.tweens.add({
                    targets: shipImg,
                    scale: 0.175,
                    duration: 900,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1,
                });
            }

            this.keep(this.add.text(240, y - 24, skin.name, textStyle(23, selected ? '#ffd166' : '#ffffff')));
            this.keep(this.add.text(240, y + 5, skin.description, textStyle(15, COLORS.muted)));

            this.keep(addButton(this, 1030, y, selected ? 'EQUIPPED' : owned ? 'EQUIP' : `◆ ${skin.price}`, () => {
                const result = playerProfile.buyOrSelectSkin(skin.id);
                if (!result.ok) showToast(this, 'Not enough credits', COLORS.red);
                else {
                    showToast(this, `${skin.name} equipped!`);
                    this.render('skins');
                }
            }, { width: 160, height: 38, fontSize: 19, disabled: selected, accent: selected ? COLORS.green : COLORS.yellow }));
        });
    }
}
