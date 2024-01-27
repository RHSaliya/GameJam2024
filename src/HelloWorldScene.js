import Phaser from 'phaser'
import Bullet from './components/Bullet';

export default class HelloWorldScene extends Phaser.Scene {
	lastFired = 0;

	preload() {
		this.load.image('background', '/assets/space/nebula.jpg');
		this.load.image('stars', '/assets/space/stars.png');
		this.load.atlas('space', '/assets/space/space.png', '/assets/space/space.json');
	}
	create() {
		//  Prepare some spritesheets and animations
		this.textures.addSpriteSheetFromAtlas('mine-sheet', { atlas: 'space', frame: 'mine', frameWidth: 64 });
		this.textures.addSpriteSheetFromAtlas('asteroid1-sheet', { atlas: 'space', frame: 'asteroid1', frameWidth: 96 });
		this.textures.addSpriteSheetFromAtlas('asteroid2-sheet', { atlas: 'space', frame: 'asteroid2', frameWidth: 96 });
		this.textures.addSpriteSheetFromAtlas('asteroid3-sheet', { atlas: 'space', frame: 'asteroid3', frameWidth: 96 });
		this.textures.addSpriteSheetFromAtlas('asteroid4-sheet', { atlas: 'space', frame: 'asteroid4', frameWidth: 64 });

		this.anims.create({ key: 'mine-anim', frames: this.anims.generateFrameNumbers('mine-sheet', { start: 0, end: 15 }), frameRate: 20, repeat: -1 });
		this.anims.create({ key: 'asteroid1-anim', frames: this.anims.generateFrameNumbers('asteroid1-sheet', { start: 0, end: 24 }), frameRate: 20, repeat: -1 });
		this.anims.create({ key: 'asteroid2-anim', frames: this.anims.generateFrameNumbers('asteroid2-sheet', { start: 0, end: 24 }), frameRate: 20, repeat: -1 });
		this.anims.create({ key: 'asteroid3-anim', frames: this.anims.generateFrameNumbers('asteroid3-sheet', { start: 0, end: 24 }), frameRate: 20, repeat: -1 });
		this.anims.create({ key: 'asteroid4-anim', frames: this.anims.generateFrameNumbers('asteroid4-sheet', { start: 0, end: 23 }), frameRate: 20, repeat: -1 });

		this.initHealthBar();

		//  World size is 8000 x 6000
		this.bg = this.add.tileSprite(400, 300, 800, 600, 'background').setScrollFactor(0);

		//  Add our planets, etc
		this.add.image(512, 680, 'space', 'blue-planet').setOrigin(0).setScrollFactor(0.6);
		this.add.image(2833, 1246, 'space', 'brown-planet').setOrigin(0).setScrollFactor(0.6);
		this.add.image(3875, 531, 'space', 'sun').setOrigin(0).setScrollFactor(0.6);
		const galaxy = this.add.image(5345 + 1024, 327 + 1024, 'space', 'galaxy').setBlendMode(1).setScrollFactor(0.6);
		this.add.image(908, 3922, 'space', 'gas-giant').setOrigin(0).setScrollFactor(0.6);
		this.add.image(3140, 2974, 'space', 'brown-planet').setOrigin(0).setScrollFactor(0.6).setScale(0.8).setTint(0x882d2d);
		this.add.image(6052, 4280, 'space', 'purple-planet').setOrigin(0).setScrollFactor(0.6);

		for (let i = 0; i < 8; i++) {
			this.add.image(Phaser.Math.Between(0, 8000), Phaser.Math.Between(0, 6000), 'space', 'eyes').setBlendMode(1).setScrollFactor(0.8);
		}

		this.stars = this.add.tileSprite(400, 300, 800, 600, 'stars').setScrollFactor(0);

		const emitter = this.add.particles(0, 0, 'space', {
			frame: 'blue',
			speed: 100,
			lifespan: {
				onEmit: (particle, key, t, value) => {
					return Phaser.Math.Percent(this.ship.body.speed, 0, 300) * 2000;
				}
			},
			alpha: {
				onEmit: (particle, key, t, value) => {
					return Phaser.Math.Percent(this.ship.body.speed, 0, 300);
				}
			},
			angle: {
				onEmit: (particle, key, t, value) => {
					return (this.ship.angle - 180) + Phaser.Math.Between(-10, 10);
				}
			},
			scale: { start: 0.6, end: 0 },
			blendMode: 'ADD'
		});

		this.bullets = this.physics.add.group({
			classType: Bullet,
			maxSize: 30,
			runChildUpdate: true
		});

		this.ship = this.physics.add.image(4000, 3000, 'space', 'ship').setDepth(2);

		this.ship.setDrag(300);
		this.ship.setAngularDrag(400);
		this.ship.setMaxVelocity(600);

		emitter.startFollow(this.ship);

		this.cameras.main.startFollow(this.ship);

		this.cursors = this.input.keyboard.createCursorKeys();
		this.fire = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

		this.add.sprite(4300, 3000).play('asteroid1-anim');

		this.tweens.add({
			targets: galaxy,
			angle: 360,
			duration: 100000,
			ease: 'Linear',
			loop: -1
		});
	}

	update(time, delta) {
		const { left, right, up } = this.cursors;

		if (left.isDown) {
			this.ship.setAngularVelocity(-150);
		}
		else if (right.isDown) {
			this.ship.setAngularVelocity(150);
		}
		else {
			this.ship.setAngularVelocity(0);
		}

		if (up.isDown) {
			this.physics.velocityFromRotation(this.ship.rotation, 600, this.ship.body.acceleration);
		}
		else {
			this.ship.setAcceleration(0);
		}

		if (this.fire.isDown && time > this.lastFired) {
			const bullet = this.bullets.get();

			if (bullet) {
				bullet.fire(this.ship);

				this.lastFired = time + 100;
			}
		}

		// Handle bullet-player collisions
		this.physics.overlap(this.bullets, this.ship, this.handleBulletPlayerCollision, null, this);
		
		// Decrease player health over time (for testing)
		 this.time.delayedCall(1000, () => {
            this.decreaseHealth(10);
        });

		this.bg.tilePositionX += this.ship.body.deltaX() * 0.5;
		this.bg.tilePositionY += this.ship.body.deltaY() * 0.5;

		this.stars.tilePositionX += this.ship.body.deltaX() * 2;
		this.stars.tilePositionY += this.ship.body.deltaY() * 2;
	}

	healthBar;
	maxHealth = 100;
	currentHealth = 100;

	initHealthBar() {
		// Calculate position based on camera viewport
		const camera = this.cameras.main;
		const x = camera.worldView.x + 20; // 20 pixels from the left edge of the viewport
		const y = camera.worldView.y + 20; // 20 pixels from the top edge of the viewport
		const width = 200;
		const height = 20;
	
		// Draw the background of the health bar
		const borderOffset = 2;
		const borderFillColor = 0x000000;
		const borderAlpha = 0.5;
		const bgGraphics = this.add.graphics();
		bgGraphics.fillStyle(borderFillColor, borderAlpha);
		bgGraphics.fillRect(x - borderOffset, y - borderOffset, width + borderOffset * 2, height + borderOffset * 2);
	
		// Draw the actual health bar
		const barGraphics = this.add.graphics();
		const healthFillColor = 0x00ff00;
		const healthAlpha = 0.8;
		this.healthBar = barGraphics.fillStyle(healthFillColor, healthAlpha);
		this.updateHealthBar();
	
		// Set the health bar to always stay on top
		bgGraphics.setDepth(10);
		barGraphics.setDepth(11);
	}

	updateHealthBar() {
		// Calculate position based on camera viewport
		const camera = this.cameras.main;
		const x = camera.worldView.x + 20; // 20 pixels from the left edge of the viewport
		const y = camera.worldView.y + 20; // 20 pixels from the top edge of the viewport
		const width = 200;
		const height = 20;
		const healthPercentage = this.currentHealth / this.maxHealth;
	
		// Update the health bar's fill
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

	handleBulletPlayerCollision(bullet, player) {
        // Decrease player health when hit by a bullet
        this.decreaseHealth(10);

        // Hide or deactivate the bullet
        bullet.setActive(false).setVisible(false);
    }
}
