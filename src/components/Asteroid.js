export default class Asteroid extends Phaser.Physics.Arcade.Image {
    constructor(scene) {
        super(scene, 0, 0, 'asteroid1');
        this.setDepth(100);
        this.minSpeed = 100;
    }

    show(ship) {
        // random scale between 0.3 to 0.5
        this.scale = 0.3 + Math.random() * 0.2;
        this.speed = this.minSpeed + Math.random() * 100;

        const shipX = ship.x;
        const shipY = ship.y;

        const startX = this.scene.cameras.main.worldView.x;
        const startY = this.scene.cameras.main.worldView.y;
        const endX = startX + +this.scene.sys.game.config.width;
        const endY = startY + +this.scene.sys.game.config.height;

        this.showTime = Date.now();

        var actualStartX = Phaser.Math.Between(startX - 100, endX + 100);
        var actualStartY = Phaser.Math.Between(startY - 100, endY + 100);

        this.actualEndX = Phaser.Math.Between(startX - 100, endX + 100);
        this.actualEndY = Phaser.Math.Between(startY - 100, endY + 100);

        if (Math.random() > 0.5) {
            if (actualStartX > startX - 50) {
                actualStartX = startX - 150;
            }
        } else {
            if (actualStartY > startY - 50) {
                actualStartY = startY - 150;
            }
        }

        // calculate angle such that the asterpoid is always moving towards the ship
        var radius = Math.atan2(shipY - actualStartY, shipX - actualStartX) * 180 / Math.PI;

        this.setActive(true);
        this.setVisible(true);
        this.setAngle(radius);
        this.setPosition(actualStartX, actualStartY);
        this.body.reset(actualStartX, actualStartY);

        const angle = Phaser.Math.DegToRad(radius);

        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
        // this.setVelocity(100)
    }

    update(time, delta) {
        if (Date.now() - this.showTime > 5000) {
            const startX = this.scene.cameras.main.worldView.x;
            const startY = this.scene.cameras.main.worldView.y;
            const endX = startX + +this.scene.sys.game.config.width;
            const endY = startY + +this.scene.sys.game.config.height;

            if (this.x < startX - 100 || this.x > endX + 100 || this.y < startY - 100 || this.y > endY + 100) {
                this.setActive(false);
                this.setVisible(false);
                this.body.stop();
            }
        }
    }
}