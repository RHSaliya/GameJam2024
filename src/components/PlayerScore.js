export default class PlayerScore {
    score = 0;

    constructor(scene) {
        this.scene = scene;
        this.initScore();
    }
    initScore() {
        const gameWidth = +this.scene.sys.game.config.width;
        const fontSize = gameWidth * 45 / 800;

        const buttonStyle = {
            fontFamily: 'Caramel',
            fill: '#ffffff',
            fontWeight: 800,
            fontSize: `${fontSize}px`,
        }

        this.scoreText = this.scene.add.text(0, 0, `Score: ${this.score}`, buttonStyle);
    }

    addScore(amount) {
        this.score += +amount;
    }

    getScore() {
        return this.score;
    }

    drawScore(label = "") {
        const startX = this.scene.cameras.main.worldView.x;
        const startY = this.scene.cameras.main.worldView.y;
        const endX = startX + +this.scene.sys.game.config.width - 20;

        if (label) {
            this.scoreText.setText(`${label}: ${this.score}`);
        } else {
            this.scoreText.setText(`Score: ${this.score}`);
        }
        this.scoreText.setPosition(endX - this.scoreText.width, startY + 20);
    }
}