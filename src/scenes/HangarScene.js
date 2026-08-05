import Phaser from 'phaser';
import { SKINS, UPGRADES } from '../config/gameData';
import { playerProfile } from '../services/PlayerProfile';
import { addBackButton, addButton, addPanel, addSpaceBackground, addTitle, COLORS, formatNumber, showToast, textStyle } from '../ui';
import { configureSharpCamera } from '../config/layout';

export default class HangarScene extends Phaser.Scene {
    constructor() { super('hangar'); }
    preload() {
        this.load.image('menu', 'assets/menu.png');
        this.load.image('ship', 'assets/space/Spaceship.png');
    }

    create() {
        configureSharpCamera(this);
        addSpaceBackground(this);
        addTitle(this, 'THE HANGAR', 'Spend mission credits on permanent upgrades and ship finishes');
        this.creditText = this.add.text(1190, 30, '', textStyle(25, '#ffd166')).setOrigin(1, 0);
        addButton(this, 520, 105, 'UPGRADES', () => this.render('upgrades'), { width: 230, height: 42 });
        addButton(this, 760, 105, 'SKINS', () => this.render('skins'), { width: 230, height: 42, accent: COLORS.yellow });
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
        if (tab === 'upgrades') this.renderUpgrades(); else this.renderSkins();
    }

    renderUpgrades() {
        Object.entries(UPGRADES).forEach(([key, upgrade], index) => {
            const y = 178 + index * 89;
            this.keep(addPanel(this, 640, y, 1000, 74));
            const rank = playerProfile.data.upgrades[key];
            this.keep(this.add.text(170, y - 27, upgrade.name, textStyle(25)));
            this.keep(this.add.text(170, y + 5, upgrade.description, textStyle(17, COLORS.muted)));
            this.keep(this.add.text(790, y - 12, `LV ${rank}/4`, textStyle(22, rank === 4 ? '#7ae582' : '#ffffff')));
            const cost = upgrade.costs[rank];
            this.keep(addButton(this, 1040, y, rank === 4 ? 'MAXED' : `◆ ${cost}`, () => {
                const result = playerProfile.buyUpgrade(key);
                if (!result.ok) showToast(this, 'Not enough credits', COLORS.red);
                else {
                    showToast(this, `${upgrade.name} upgraded!`);
                    this.render('upgrades');
                }
            }, { width: 150, height: 42, fontSize: 20, disabled: rank === 4, accent: COLORS.green }));
        });
    }

    renderSkins() {
        SKINS.forEach((skin, index) => {
            const y = 158 + index * 76;
            this.keep(addPanel(this, 640, y, 1000, 62));
            const preview = this.keep(this.add.image(190, y, 'ship').setScale(0.16).setAngle(90));
            if (skin.tint !== 0xffffff) preview.setTint(skin.tint);
            const owned = playerProfile.data.unlockedSkins.includes(skin.id);
            const selected = playerProfile.data.selectedSkin === skin.id;
            this.keep(this.add.text(240, y - 24, skin.name, textStyle(23)));
            this.keep(this.add.text(240, y + 5, skin.description, textStyle(16, COLORS.muted)));
            this.keep(addButton(this, 1030, y, selected ? 'EQUIPPED' : owned ? 'EQUIP' : `◆ ${skin.price}`, () => {
                const result = playerProfile.buyOrSelectSkin(skin.id);
                if (!result.ok) showToast(this, 'Not enough credits', COLORS.red);
                else {
                    showToast(this, `${skin.name} equipped!`);
                    this.render('skins');
                }
            }, { width: 160, height: 38, fontSize: 19, disabled: selected, accent: COLORS.yellow }));
        });
    }
}
