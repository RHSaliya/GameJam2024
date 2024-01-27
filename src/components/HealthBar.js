
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
        this.bgGraphics = this.scene.add.graphics();
        this.healthBar = this.scene.add.graphics();

        // Set the health bar to always stay on top
        this.bgGraphics.setDepth(10);
        this.healthBar.setDepth(11);
    }

    updateHealthBar() {
        // Calculate position based on camera viewport
        const camera = this.scene.cameras.main;
        const x = camera.worldView.x + 20; // 20 pixels from the left edge of the viewport
        const y = camera.worldView.y + 20; // 20 pixels from the top edge of the viewport
        const width = 200;
        const height = 20;
        const healthPercentage = this.currentHealth / this.maxHealth;

        const borderOffset = 2;

        this.bgGraphics.clear();
        this.healthBar.clear();

        // Update the health bar's fill
        this.bgGraphics.fillStyle(0xffffff, 0.5);
        this.healthBar.fillStyle(0x00ff00, 0.7);
        this.bgGraphics.fillRect(x - borderOffset, y - borderOffset, width + borderOffset * 2, height + borderOffset * 2);
        this.healthBar.fillRect(x, y, width * healthPercentage, height);
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