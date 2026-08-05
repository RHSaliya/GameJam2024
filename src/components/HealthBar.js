export default class HealthBar {
    constructor(scene, maxHealth = 100) {
        this.scene = scene;
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.bgGraphics = scene.add.graphics().setScrollFactor(0).setDepth(2000);
        this.healthBar = scene.add.graphics().setScrollFactor(0).setDepth(2001);
        this.updateHealthBar();
    }

    getHealth() { return this.currentHealth; }

    updateHealthBar() {
        const width = 190;
        const height = 17;
        const healthPercentage = Math.max(0, this.currentHealth / this.maxHealth);
        const color = healthPercentage > 0.65 ? 0x7ae582 : healthPercentage > 0.3 ? 0xffd166 : 0xff6b6b;
        this.bgGraphics.clear().fillStyle(0x11162d, 0.86).fillRoundedRect(84, 18, width + 4, height + 4, 6);
        this.healthBar.clear().fillStyle(color, 0.95).fillRoundedRect(86, 20, width * healthPercentage, height, 5);
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
