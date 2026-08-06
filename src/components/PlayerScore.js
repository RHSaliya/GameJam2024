import { textStyle } from '../ui';
import { getViewportLayout, watchResponsiveLayout } from '../config/layout';

export default class PlayerScore {
    score = 0;

    constructor(scene) {
        this.scene = scene;
        this.initScore();
    }
    initScore() {
        this.scoreText = this.scene.add.text(0, 0, `Score: ${this.score}`, textStyle(34)).setOrigin(1, 0);
        watchResponsiveLayout(this.scene, layout => this.scoreText.setPosition(layout.safeRight, layout.safeTop));
    }

    addScore(amount) {
        this.score += +amount;
    }

    getScore() {
        return Math.ceil(this.score);
    }

    drawScore(label = "") {
        if (label) {
            this.scoreText.setText(`${label}: ${this.getScore()}`);
        } else {
            this.scoreText.setText(`Score: ${this.getScore()}`);
        }
        const layout = getViewportLayout();
        this.scoreText.setPosition(layout.safeRight, layout.safeTop);
    }
}
