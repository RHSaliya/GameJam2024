import { textStyle } from '../ui';

export default class HealthBar {
    constructor(scene, maxHealth = 100) {
        this.scene = scene;
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.bgGraphics = scene.add.graphics().setDepth(2000);
        this.healthBar = scene.add.graphics().setDepth(2001);
        this.hpText = scene.add.text(184, 27, '', textStyle(14, '#ffffff')).setOrigin(0.5).setDepth(2002);
        this.updateHealthBar();
    }

    getHealth() { return this.currentHealth; }

    updateHealthBar() {
        const width = 200;
        const height = 18;
        const x = 84;
        const y = 18;
        const healthPercentage = Math.max(0, this.currentHealth / this.maxHealth);
        const color = healthPercentage > 0.6 ? 0x7ae582 : healthPercentage > 0.3 ? 0xffd166 : 0xff6b6b;

        this.bgGraphics.clear();
        // Dark glass background with border
        this.bgGraphics.fillStyle(0x0e1226, 0.88);
        this.bgGraphics.fillRoundedRect(x, y, width + 4, height + 4, 6);
        this.bgGraphics.lineStyle(1.5, 0x5ce1e6, 0.5);
        this.bgGraphics.strokeRoundedRect(x, y, width + 4, height + 4, 6);

        this.healthBar.clear();
        if (healthPercentage > 0) {
            const barWidth = Math.max(4, width * healthPercentage);
            this.healthBar.fillStyle(color, 0.95);
            this.healthBar.fillRoundedRect(x + 2, y + 2, barWidth, height, 4);

            // Subtle top highlight line on health bar
            this.healthBar.fillStyle(0xffffff, 0.35);
            this.healthBar.fillRect(x + 3, y + 3, barWidth - 2, 2);
        }

        this.hpText.setText(`HP ${Math.ceil(this.currentHealth)}/${this.maxHealth}`);
    }

    decreaseHealth(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.updateHealthBar();
    }

    increaseHealth(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
        this.updateHealthBar();
    }
}
