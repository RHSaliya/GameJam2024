
export default class HealthBar {
    getHealth() {
        return this.currentHealth;
    }
    constructor(scene) {
        this.scene = scene;
        this.initHealthBar();
    }

    maxHealth = 100;
    currentHealth = 100;

    initHealthBar() {
        // Draw the background of the health bar
        this.bgGraphics = this.scene.add.graphics().setScrollFactor(0);
        this.healthBar = this.scene.add.graphics().setScrollFactor(0);

        // Set the health bar to always stay on top
        this.bgGraphics.setDepth(1000);
        this.healthBar.setDepth(1001);
    }

    updateHealthBar() {
        // Calculate position based on camera viewport
        const width = 200;
        const height = 20;
        const healthPercentage = this.currentHealth / this.maxHealth;

        const borderOffset = 2;
        const margin = 20;

        this.bgGraphics.clear();
        this.healthBar.clear();

        // Update the health bar's fill
        this.bgGraphics.fillStyle(0xffffff, 0.5);
        this.healthBar.fillStyle(0x00ff00, 0.7);
        this.bgGraphics.fillRect(margin - borderOffset, margin - borderOffset, width + borderOffset * 2, height + borderOffset * 2);
        this.healthBar.fillRect(margin, margin, width * healthPercentage, height);
    }

    // Function to decrease health
    decreaseHealth(amount) {
        this.currentHealth -= amount;
        if (this.currentHealth < 0) {
            this.currentHealth = 0;
        }
        this.updateHealthBar();
    }

    // Function to increase health
    increaseHealth(amount) {
        this.currentHealth += amount;
        if (this.currentHealth > this.maxHealth) {
            this.currentHealth = this.maxHealth;
        }
        this.updateHealthBar();
    }
}