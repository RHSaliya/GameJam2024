export default class Astronaut extends Phaser.Physics.Arcade.Image {
    constructor(scene) {
        super(scene, 0, 0, 'astronaut1');
        this.setDepth(100);
        this.minSpeed = 30;
    }

    show(ship) {
        this.scale = 0.7 + Math.random() * 0.2;
        this.showTime = Date.now()
        this.scale = 0.3 + Math.random() * 0.2;
        const textureIndex = Math.floor(Math.random() * 2) + 1;
        this.setTexture(`astronaut${textureIndex}`);
        this.speed = this.minSpeed;
    
        const shipX = ship.x;
        const shipY = ship.y;
    
        const startX = this.scene.cameras.main.worldView.x;
        const startY = this.scene.cameras.main.worldView.y;
        const endX = startX + +this.scene.sys.game.config.width;
        const endY = startY + +this.scene.sys.game.config.height;
    
        var actualStartX = Phaser.Math.Between(startX - 100, endX + 100);
        var actualStartY = Phaser.Math.Between(startY - 100, endY + 100);
    
        // Calculate angle towards the ship
        var angle = Math.atan2(shipY - actualStartY, shipX - actualStartX);
        angle = Phaser.Math.RadToDeg(angle);
    
        this.setActive(true);
        this.setVisible(true);
        this.setAngle(angle);
        this.setPosition(actualStartX, actualStartY);
        this.body.reset(actualStartX, actualStartY);
    
        // Calculate velocity towards the ship
        const angleRadians = Phaser.Math.DegToRad(angle);
        this.scene.physics.velocityFromRotation(angleRadians, this.speed, this.body.velocity);
    }
    update(time, delta) {
        if (Date.now() - this.showTime > 3000) {
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