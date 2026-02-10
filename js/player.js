// Player Class for Zombie Apocalypse Game

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.speed = 200;
        this.angle = 0;
        this.alive = true;

        // Weapon system
        this.weapon = new Weapon('pistol');
        this.fireCooldown = 0;
        this.shooting = false;

        // Inventory system - weapons the player has collected
        this.inventory = ['pistol']; // Always start with pistol

        // Upgrade system
        this.upgradeLevel = 0; // 0-3

        // Dash system
        this.dashCooldown = 0;
        this.dashMaxCooldown = 10; // 10 seconds cooldown
        this.dashDistance = 300;
        this.isDashing = false;
        this.dashDuration = 0.1;
        this.dashTimer = 0;
        this.dashTargetX = 0;
        this.dashTargetY = 0;

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

    reset(x, y, keepInventory = false) {
        this.x = x;
        this.y = y;
        this.alive = true;
        this.fireCooldown = 0;
        this.vx = 0;
        this.vy = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.angle = 0;
        this.dashCooldown = 0;
        this.isDashing = false;
        this.dashTimer = 0;

        if (!keepInventory) {
            // Full reset - new game
            this.inventory = ['pistol'];
            this.weapon.setType('pistol');
            this.upgradeLevel = 0;
        }
        // If keepInventory is true, keep current weapon, inventory, and upgrades
    }

    // Dash to mouse position
    dash(mouseX, mouseY) {
        if (this.dashCooldown <= 0 && !this.isDashing && this.alive) {
            this.isDashing = true;
            this.dashTimer = 0;
            this.dashCooldown = this.dashMaxCooldown;

            // Calculate dash direction to mouse
            const angle = Utils.angle(this.x, this.y, mouseX, mouseY);
            this.dashTargetX = this.x + Math.cos(angle) * this.dashDistance;
            this.dashTargetY = this.y + Math.sin(angle) * this.dashDistance;

            // Clamp to bounds
            this.dashTargetX = Utils.clamp(this.dashTargetX, this.radius, GAME_WIDTH - this.radius);
            this.dashTargetY = Utils.clamp(this.dashTargetY, this.radius, GAME_HEIGHT - this.radius);

            // Visual effect
            Particles.trail(this.x, this.y, '#00ffff', 10);
            Audio.playDash && Audio.playDash();

            return true;
        }
        return false;
    }

    getDashCooldownPercent() {
        return Math.max(0, 1 - this.dashCooldown / this.dashMaxCooldown);
    }

    // Inventory management
    addToInventory(weaponType) {
        if (!this.inventory.includes(weaponType)) {
            this.inventory.push(weaponType);
            return true; // New weapon added
        }
        return false; // Already have this weapon
    }

    hasWeaponInInventory(weaponType) {
        return this.inventory.includes(weaponType);
    }

    getInventory() {
        return this.inventory;
    }

    equipWeaponFromInventory(weaponType) {
        if (this.inventory.includes(weaponType)) {
            this.setWeapon(weaponType);
            return true;
        }
        return false;
    }

    setWeapon(weaponType) {
        this.weapon.setType(weaponType);
        this.fireCooldown = 0; // Reset cooldown to allow immediate firing
    }

    getWeaponName() {
        return this.weapon.name;
    }

    getWeaponType() {
        return this.weapon.type;
    }

    // Upgrade system
    getUpgradeLevel() {
        return this.upgradeLevel;
    }

    applyUpgrade() {
        if (this.upgradeLevel < 3) {
            this.upgradeLevel++;
            return true;
        }
        return false;
    }

    getFireRateMultiplier() {
        let mult = 1;
        if (this.upgradeLevel >= 1) mult *= 0.8; // Level 1: 20% faster
        if (this.upgradeLevel >= 3) mult *= 0.8; // Level 3: 20% faster again
        return mult;
    }

    getDamageMultiplier() {
        let mult = 1;
        if (this.upgradeLevel >= 2) mult *= 1.25; // Level 2: 25% more damage
        return mult;
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
        // Store target for rocket launcher click-to-explode
        this.targetX = mouseX;
        this.targetY = mouseY;
    }

    setMouseDown(isDown) {
        this.shooting = isDown;
    }

    applyKnockback(angle, force) {
        this.knockbackX += Math.cos(angle) * force;
        this.knockbackY += Math.sin(angle) * force;
    }

    update(dt, bulletManager, wallManager = null) {
        if (!this.alive) return;

        // Update dash cooldown
        if (this.dashCooldown > 0) {
            this.dashCooldown -= dt;
        }

        // Handle dashing
        if (this.isDashing) {
            this.dashTimer += dt;
            const progress = this.dashTimer / this.dashDuration;

            if (progress >= 1) {
                // Dash complete
                this.x = this.dashTargetX;
                this.y = this.dashTargetY;
                this.isDashing = false;
                Particles.deathBurst(this.x, this.y, '#00ffff', 8);
            } else {
                // Interpolate position
                const startX = this.x;
                const startY = this.y;
                const easedProgress = progress; // linear for fast dash
                this.x = Utils.lerp(startX, this.dashTargetX, easedProgress * 10); // Fast movement
                this.y = Utils.lerp(startY, this.dashTargetY, easedProgress * 10);
                Particles.trail(this.x, this.y, '#00ffff', 3);
            }

            // Keep player in bounds during dash
            this.x = Utils.clamp(this.x, this.radius, GAME_WIDTH - this.radius);
            this.y = Utils.clamp(this.y, this.radius, GAME_HEIGHT - this.radius);

            // Handle wall collision during dash
            if (wallManager) {
                wallManager.resolveCircleCollision(this);
            }
            return; // Skip normal movement during dash
        }

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

        // Handle wall collision
        if (wallManager) {
            wallManager.resolveCircleCollision(this);
        }

        // Handle shooting
        if (this.fireCooldown > 0) {
            this.fireCooldown -= dt;
        }

        if (this.shooting && this.fireCooldown <= 0) {
            this.shoot(bulletManager);
            this.fireCooldown = this.weapon.fireRate * this.getFireRateMultiplier();
        }
    }

    shoot(bulletManager) {
        // Calculate gun tip position
        const gunTipX = this.x + Math.cos(this.angle) * this.gunLength;
        const gunTipY = this.y + Math.sin(this.angle) * this.gunLength;

        // Use weapon to shoot - pass target for rockets to explode at click location
        const bullets = this.weapon.shoot(gunTipX, gunTipY, this.angle, bulletManager, this.targetX, this.targetY);

        // Apply upgrade damage multiplier
        const damageMult = this.getDamageMultiplier();
        if (damageMult !== 1 && bullets) {
            for (const bullet of bullets) {
                if (bullet) bullet.damage *= damageMult;
            }
        }

        // Muzzle flash particle
        Particles.muzzleFlash(gunTipX, gunTipY, this.angle);

        // Play weapon sound
        Audio.playWeaponSound(this.weapon.soundType);
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

        // Player glow effect
        ctx.save();
        const glowSize = this.radius * 2.5;
        const glowGrad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, glowSize);
        glowGrad.addColorStop(0, 'rgba(0, 255, 0, 0.12)');
        glowGrad.addColorStop(1, 'rgba(0, 255, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Dash trail afterimage
        if (this.isDashing) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

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

        // Inner body highlight
        ctx.fillStyle = 'rgba(100, 255, 100, 0.25)';
        ctx.beginPath();
        ctx.arc(-3, -3, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw gun based on weapon type
        this.drawWeapon(ctx);

        // Draw direction indicator (eyes)
        ctx.fillStyle = '#003300';
        ctx.beginPath();
        ctx.arc(5, -5, 3, 0, Math.PI * 2);
        ctx.arc(5, 5, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw weapon name indicator above player
        if (this.weapon.type !== 'pistol') {
            ctx.save();
            ctx.fillStyle = this.weapon.color;
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.weapon.name, this.x, this.y - this.radius - 10);
            ctx.restore();
        }
    }

    drawWeapon(ctx) {
        const weaponType = this.weapon.type;

        switch (weaponType) {
            case 'uzi':
                // Compact SMG
                ctx.fillStyle = '#222';
                ctx.fillRect(this.radius - 5, -3, 20, 6);
                ctx.fillStyle = '#444';
                ctx.fillRect(this.radius - 5, -3, 20, 3);
                // Magazine
                ctx.fillStyle = '#333';
                ctx.fillRect(this.radius + 2, 3, 6, 8);
                break;

            case 'bow':
                // Bow weapon
                ctx.strokeStyle = '#5a3a1a';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.radius + 5, 0, 14, -1.2, 1.2);
                ctx.stroke();
                // Bowstring
                ctx.strokeStyle = '#aaa';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(this.radius + 5 + Math.cos(-1.2) * 14, Math.sin(-1.2) * 14);
                ctx.lineTo(this.radius - 2, 0);
                ctx.lineTo(this.radius + 5 + Math.cos(1.2) * 14, Math.sin(1.2) * 14);
                ctx.stroke();
                // Arrow
                ctx.fillStyle = '#88cc44';
                ctx.fillRect(this.radius - 2, -1, 20, 2);
                // Arrowhead
                ctx.beginPath();
                ctx.moveTo(this.radius + 20, 0);
                ctx.lineTo(this.radius + 15, -3);
                ctx.lineTo(this.radius + 15, 3);
                ctx.closePath();
                ctx.fill();
                break;

            case 'shotgun':
                // Double barrel shotgun
                ctx.fillStyle = '#4a3728';
                ctx.fillRect(this.radius - 8, -4, 30, 8);
                ctx.fillStyle = '#333';
                ctx.fillRect(this.radius + 15, -3, 10, 2);
                ctx.fillRect(this.radius + 15, 1, 10, 2);
                break;

            case 'rocketLauncher':
                // Large launcher tube
                ctx.fillStyle = '#3a5a3a';
                ctx.fillRect(this.radius - 10, -6, 35, 12);
                ctx.fillStyle = '#2a4a2a';
                ctx.fillRect(this.radius - 10, -6, 35, 6);
                // Sight
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(this.radius + 5, -10, 3, 4);
                break;

            case 'flamethrower':
                // Flame tank and nozzle
                ctx.fillStyle = '#555';
                ctx.fillRect(this.radius - 5, -5, 25, 10);
                // Fuel tank
                ctx.fillStyle = '#ff6600';
                ctx.beginPath();
                ctx.arc(-5, 0, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#cc4400';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Nozzle
                ctx.fillStyle = '#333';
                ctx.fillRect(this.radius + 15, -3, 8, 6);
                break;

            case 'doubleMinigun':
                // Two gun barrels
                ctx.fillStyle = '#444';
                ctx.fillRect(this.radius - 5, -8, 28, 5);
                ctx.fillRect(this.radius - 5, 3, 28, 5);
                ctx.fillStyle = '#666';
                ctx.fillRect(this.radius - 5, -8, 28, 2);
                ctx.fillRect(this.radius - 5, 3, 28, 2);
                // Center body
                ctx.fillStyle = '#333';
                ctx.fillRect(this.radius - 8, -4, 10, 8);
                break;

            case 'tripleMinigun':
                // Three gun barrels
                ctx.fillStyle = '#00aa66';
                ctx.fillRect(this.radius - 5, -10, 30, 4);
                ctx.fillRect(this.radius - 5, -2, 30, 4);
                ctx.fillRect(this.radius - 5, 6, 30, 4);
                ctx.fillStyle = '#00ff88';
                ctx.fillRect(this.radius - 5, -10, 30, 2);
                ctx.fillRect(this.radius - 5, -2, 30, 2);
                ctx.fillRect(this.radius - 5, 6, 30, 2);
                // Center body
                ctx.fillStyle = '#333';
                ctx.fillRect(this.radius - 10, -6, 12, 12);
                // Power core
                ctx.fillStyle = '#00ff88';
                ctx.beginPath();
                ctx.arc(this.radius - 4, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                break;

            default:
                // Default pistol
                ctx.fillStyle = '#333';
                ctx.fillRect(this.radius - 5, -this.gunWidth / 2, this.gunLength - this.radius + 10, this.gunWidth);
                ctx.fillStyle = '#555';
                ctx.fillRect(this.radius - 5, -this.gunWidth / 2, this.gunLength - this.radius + 10, this.gunWidth / 2);
        }
    }
}
