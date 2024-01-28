import Phaser from 'phaser'
import '../../public/font.css';
export default class InstructionsScene extends Phaser.Scene {
    constructor() {
        super('instructions');
        this.instructionsImage = null;

    }
    preload() {
        // Load any assets like images or fonts if required
        this.load.image('background-instructions', '/assets/menu.png');
        this.loremIpsumText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                              Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.
                              Sed nisi.`;

        this.load.image('blue', '/assets/space/blue.png');
    }

    create() {

        // const content = [
        //     'Acceleration:                        UP arrow',
        //     'Rotate:                              LEFT and RIGHT arrows',
        //     'Fire:                                SPACEBAR',
        //     'REMEMBER:',
        //     'Each control is assigned to a different player, ensuring a seamless gaming experience.',
        //     'Your mission is to survive for as long as possible and take down as many asteroids as you can.',
        //     'Score points by hitting asteroids, and your score will also increase the longer you stay alive.',
        //     'Best of luck in your interstellar journey!'
        // ];

        // Add background image
        this.instructionImage = this.add.sprite(0, 0, 'background-instructions');
        this.instructionImage.setOrigin(0, 0);
        this.instructionImage.alpha = 0.6;
        const scaleX = +this.sys.game.config.width / this.instructionImage.width;
        const scaleY = +this.sys.game.config.height / this.instructionImage.height;
        const scale = Math.max(scaleX, scaleY);
        this.instructionImage.setScale(scale).setScrollFactor(0);
        const buttonStyle = {
            color: '#ffffff',
            fontSize: 45,
            fontFamily: 'Caramel',
        }
        const controlsButtonStyle = {
            color: '#ffffff',
            fontSize: 35,
            fontFamily: 'Caramel',
        }
        const rememberTextStyle = {
            color: '#ffffff',
            fontSize: 25,
            fontFamily: 'Caramel',
        }

        const buttonHoverStyle = {
            color: '#ff0',
            fontFamily: 'Caramel',
        }
        // Add a button to skip the credits animation and return to the main menu
        var BackButton = this.add.text(70, +this.sys.game.config.height - 50, 'Back', buttonStyle);
        BackButton.setInteractive(); // Enable button interactivity
        BackButton.on('pointerover', () => BackButton.setStyle(buttonHoverStyle))
        BackButton.on('pointerout', () => BackButton.setStyle(buttonStyle))
        BackButton.on('pointerdown', function () {
            // Transition back to the main menu
            this.scene.start('menu');
        }, this);

        // const graphics = this.make.graphics();

        // // graphics.fillStyle(0xffffff);
        // graphics.fillRect(152, 133, 320, 250);

        // const mask = new Phaser.Display.Masks.GeometryMask(this, graphics);

        // const text = this.add.text(160, 100, content, { fontFamily: 'Arial', color: '#00ff00', wordWrap: { width: 310 } }).setOrigin(0);

        // text.setMask(mask);

        // //  The rectangle they can 'drag' within
        // const zone = this.add.zone(152, 130, 320, 256).setOrigin(0).setInteractive();

        // zone.on('pointermove', pointer => {

        //     if (pointer.isDown) {
        //         text.y += (pointer.velocity.y / 10);

        //         text.y = Phaser.Math.Clamp(text.y, -400, 300);
        //     }

        // });

        const controls_text = this.add.text(+this.sys.game.config.width / 2 - 50, 100, 'CONTROLS', buttonStyle);
        const acceleration_text = this.add.text(+this.sys.game.config.width / 2 - 300, 150, 'Acceleration:', controlsButtonStyle);
        const Rotate_text = this.add.text(+this.sys.game.config.width / 2 - 300, 190, 'Rotate:', controlsButtonStyle);
        const Fire_text = this.add.text(+this.sys.game.config.width / 2 - 300, 230, 'Fire:', controlsButtonStyle);

        const q_key = this.add.image(+this.sys.game.config.width / 2 + 200, 150, 'blue');
        const w_key = this.add.image(+this.sys.game.config.width / 2 + 200 + 50, 150, 'blue');
        const space_key = this.add.image(+this.sys.game.config.width / 2 + 200, 190, 'blue');
        const up_arrow = this.add.image(+this.sys.game.config.width / 2 + 200, 230, 'blue');

        const remember_text = this.add.text(+this.sys.game.config.width / 2 - 50, 280, 'REMEMBER:', buttonStyle);
        const remember_text_line1 = this.add.text(+this.sys.game.config.width / 2 - 300, 340, 'Each control should be assigned to a different player', rememberTextStyle);
        const remember_text_line2 = this.add.text(+this.sys.game.config.width / 2 - 300, 380, 'Your mission is to survive for as long as possible and take down as many asteroids', rememberTextStyle);
        const remember_text_line3 = this.add.text(+this.sys.game.config.width / 2 - 300, 405, 'as you can.', rememberTextStyle);
        const remember_text_line4 = this.add.text(+this.sys.game.config.width / 2 - 300, 445, 'Score points by hitting asteroids, and your score will also increase the longer', rememberTextStyle);
        const remember_text_line5 = this.add.text(+this.sys.game.config.width / 2 - 300, 470, 'you stay alive.', rememberTextStyle);
    }

}

