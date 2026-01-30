// Player Class for Zombie Apocalypse Game

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.speed = 200;
        this.angle = 0;
        this.alive = true;

        // Shooting
        this.fireRate = 0.15; // Seconds between shots
        this.fireCooldown = 0;
        this.shooting = false;

        // Visual
        this.color = Colors.player;
        this.gunLength = 25;
        this.gunWidth = 4;

        // Movement
        this.vx = 0;
        this.vy = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.knockbackDecay = 0.9;

        // Input tracking
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.alive = true;
        this.fireCooldown = 0;
        this.vx = 0;
        this.vy = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.angle = 0;
    }

    handleKeyDown(key) {
        switch (key) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.up = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.down = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
        }
    }

    handleKeyUp(key) {
        switch (key) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.up = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.down = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
        }
    }

    updateAim(mouseX, mouseY) {
        this.angle = Utils.angle(this.x, this.y, mouseX, mouseY);
    }

    setMouseDown(isDown) {
        this.shooting = isDown;
    }

    applyKnockback(angle, force) {
        this.knockbackX += Math.cos(angle) * force;
        this.knockbackY += Math.sin(angle) * force;
    }

    update(dt, bulletManager) {
        if (!this.alive) return;

        // Calculate movement direction
        let moveX = 0;
        let moveY = 0;

        if (this.keys.up) moveY -= 1;
        if (this.keys.down) moveY += 1;
        if (this.keys.left) moveX -= 1;
        if (this.keys.right) moveX += 1;

        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }

        // Apply movement
        this.vx = moveX * this.speed;
        this.vy = moveY * this.speed;

        // Apply knockback
        this.x += (this.vx + this.knockbackX) * dt;
        this.y += (this.vy + this.knockbackY) * dt;

        // Decay knockback
        this.knockbackX *= this.knockbackDecay;
        this.knockbackY *= this.knockbackDecay;

        // Keep player in bounds
        this.x = Utils.clamp(this.x, this.radius, GAME_WIDTH - this.radius);
        this.y = Utils.clamp(this.y, this.radius, GAME_HEIGHT - this.radius);

        // Handle shooting
        if (this.fireCooldown > 0) {
            this.fireCooldown -= dt;
        }

        if (this.shooting && this.fireCooldown <= 0) {
            this.shoot(bulletManager);
            this.fireCooldown = this.fireRate;
        }
    }

    shoot(bulletManager) {
        // Calculate gun tip position
        const gunTipX = this.x + Math.cos(this.angle) * this.gunLength;
        const gunTipY = this.y + Math.sin(this.angle) * this.gunLength;

        // Create bullet
        bulletManager.spawn(gunTipX, gunTipY, this.angle);

        // Muzzle flash particle
        Particles.muzzleFlash(gunTipX, gunTipY, this.angle);

        // Play sound
        Audio.playShoot();
    }

    die() {
        if (!this.alive) return;

        this.alive = false;

        // Death effects
        Particles.explosion(this.x, this.y, 30, 1.5);
        Effects.addFlash(0.2, 'rgba(255, 0, 0, 0.3)');
        Utils.screenShake.shake(15, 0.5);

        Audio.playPlayerDeath();
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw body (circle)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw body outline
        ctx.strokeStyle = '#006600';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw gun
        ctx.fillStyle = '#333';
        ctx.fillRect(this.radius - 5, -this.gunWidth / 2, this.gunLength - this.radius + 10, this.gunWidth);

        // Gun barrel highlight
        ctx.fillStyle = '#555';
        ctx.fillRect(this.radius - 5, -this.gunWidth / 2, this.gunLength - this.radius + 10, this.gunWidth / 2);

        // Draw direction indicator (eyes)
        ctx.fillStyle = '#003300';
        ctx.beginPath();
        ctx.arc(5, -5, 3, 0, Math.PI * 2);
        ctx.arc(5, 5, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
