export default class Astronaut extends Phaser.Physics.Arcade.Image {
    constructor(scene) {
        super(scene, 0, 0, 'astronaut1');
        this.setDepth(20);
        this.minSpeed = 5;
    }

    show(ship) {
        this.showTime = Date.now()
        this.scale = 0.4 + Math.random() * 0.2;
        const textureIndex = Math.floor(Math.random() * 4) + 1;
        this.setTexture(`astronaut${textureIndex}`);
        this.speed = this.minSpeed + Math.random() * 5;
        this.setAlpha(Math.random() * 0.5 + 0.4);

        const shipX = ship.x;
        const shipY = ship.y;

        const startCoordiantes = {
            x: this.scene.cameras.main.worldView.x,
            y: this.scene.cameras.main.worldView.y
        }
        const endCoordinates = {
            x: startCoordiantes.x + +this.scene.sys.game.config.width,
            y: startCoordiantes.y + +this.scene.sys.game.config.height
        }

        this.showTime = Date.now();

        var actualStartX = Phaser.Math.Between(startCoordiantes.x - 100, endCoordinates.x + 100);
        var actualStartY = Phaser.Math.Between(startCoordiantes.y - 100, endCoordinates.y + 100);
        this.actualEndX = Phaser.Math.Between(startCoordiantes.x - 100, endCoordinates.x + 100);
        this.actualEndY = Phaser.Math.Between(startCoordiantes.y - 100, endCoordinates.y + 100);

        if (Math.random() < 0.25) {
            if (actualStartX > startCoordiantes.x - 50) {
                actualStartX = startCoordiantes.x - 150;
            }
        } else if (Math.random() < 0.5) {
            if (actualStartY > startCoordiantes.y - 50) {
                actualStartY = startCoordiantes.y - 150;
            }
        } else if (Math.random() < 0.75) {
            if (actualStartX < endCoordinates.x + 50) {
                actualStartX = endCoordinates.x + 150;
            }
        } else {
            if (actualStartY < endCoordinates.y + 50) {
                actualStartY = endCoordinates.y + 150;
            }
        }

        // calculate angle such that the asterpoid is always moving towards the ship
        var radius = Math.atan2(shipY - actualStartY, shipX - actualStartX) * 180 / Math.PI;


        this.setAngle(radius);
        this.setPosition(actualStartX, actualStartY);
        this.body.reset(actualStartX, actualStartY);

        const angle = Phaser.Math.DegToRad(radius);

        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);


        // set slow rotation
        this.setAngularVelocity(Phaser.Math.Between(-100, 100));
        this.setVelocity(100)
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