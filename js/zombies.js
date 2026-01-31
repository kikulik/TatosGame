// Zombie Classes for Zombie Apocalypse Game

// Base Zombie Class
class Zombie {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 15;
        this.hitRadius = 15;
        this.speed = 60;
        this.health = 1;
        this.maxHealth = 1;
        this.damage = 1;
        this.points = 10;
        this.color = Colors.zombies.walker;
        this.alive = true;
        this.type = 'walker';
        this.angle = 0;

        // Movement state
        this.targetX = 0;
        this.targetY = 0;

        // Afterburn state
        this.isOnFire = false;
        this.afterburnTimer = 0;
        this.afterburnDamage = 0;
        this.afterburnTickTimer = 0;
    }

    reset() {
        this.alive = true;
        this.health = this.maxHealth;
        this.vx = 0;
        this.vy = 0;
        this.isOnFire = false;
        this.afterburnTimer = 0;
        this.afterburnDamage = 0;
        this.afterburnTickTimer = 0;
    }

    applyAfterburn(damage, duration) {
        this.isOnFire = true;
        this.afterburnTimer = duration;
        this.afterburnDamage = damage;
        this.afterburnTickTimer = 0;
    }

    updateAfterburn(dt) {
        if (!this.isOnFire || !this.alive) return false;

        this.afterburnTimer -= dt;
        this.afterburnTickTimer += dt;

        // Apply damage every 0.5 seconds
        if (this.afterburnTickTimer >= 0.5) {
            this.afterburnTickTimer = 0;
            // Create fire particle effect
            Particles.trail(this.x, this.y, Utils.randomChoice(['#ff4400', '#ff8800', '#ffcc00']), 8);

            if (this.takeDamage(this.afterburnDamage)) {
                return true; // Zombie died from afterburn
            }
        }

        if (this.afterburnTimer <= 0) {
            this.isOnFire = false;
        }

        return false;
    }

    init(x, y, playerX, playerY) {
        this.x = x;
        this.y = y;
        this.targetX = playerX;
        this.targetY = playerY;
        this.reset();
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    die() {
        this.alive = false;
        Particles.deathBurst(this.x, this.y, this.color, 12);
        Particles.blood(this.x, this.y, Utils.random(0, Math.PI * 2), 8);
        Audio.playZombieDeath();
    }

    moveToward(targetX, targetY, dt) {
        const angle = Utils.angle(this.x, this.y, targetX, targetY);
        this.angle = angle;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    update(dt, playerX, playerY) {
        if (!this.alive) return;
        this.targetX = playerX;
        this.targetY = playerY;
        this.moveToward(playerX, playerY, dt);
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Fire effect if on fire
        if (this.isOnFire) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            const fireGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius + 8);
            fireGradient.addColorStop(0, '#ff8800');
            fireGradient.addColorStop(0.5, '#ff4400');
            fireGradient.addColorStop(1, 'rgba(255, 68, 0, 0)');
            ctx.fillStyle = fireGradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Body
        ctx.fillStyle = this.isOnFire ? '#ff6600' : this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = this.darkenColor(this.color);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(5, -4, 3, 0, Math.PI * 2);
        ctx.arc(5, 4, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Health bar for zombies with more than 1 health
        if (this.maxHealth > 1 && this.health < this.maxHealth) {
            this.drawHealthBar(ctx);
        }
    }

    drawHealthBar(ctx) {
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const x = this.x - barWidth / 2;
        const y = this.y - this.radius - 10;

        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x, y, barWidth * (this.health / this.maxHealth), barHeight);
    }

    darkenColor(color) {
        // Simple color darkening
        return color.replace(/[0-9a-f]{2}/gi, (match) => {
            const value = Math.max(0, parseInt(match, 16) - 40);
            return value.toString(16).padStart(2, '0');
        });
    }

    checkCollision(playerX, playerY, playerRadius) {
        return Utils.circleCollision(
            this.x, this.y, this.hitRadius,
            playerX, playerY, playerRadius
        );
    }
}

// Runner Zombie - Fast and zigzags (green zombie)
class RunnerZombie extends Zombie {
    constructor(x, y) {
        super(x, y);
        this.type = 'runner';
        this.speed = 112; // 20% slower than before (was 140)
        this.radius = 12;
        this.hitRadius = 12;
        this.color = Colors.zombies.runner;
        this.points = 15;
        this.zigzagTimer = 0;
        this.zigzagOffset = 0;
    }

    update(dt, playerX, playerY) {
        if (!this.alive) return;

        this.zigzagTimer += dt;
        if (this.zigzagTimer > 0.3) {
            this.zigzagTimer = 0;
            this.zigzagOffset = Utils.random(-1, 1);
        }

        const baseAngle = Utils.angle(this.x, this.y, playerX, playerY);
        const angle = baseAngle + this.zigzagOffset * 0.5;
        this.angle = baseAngle;

        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }
}

// Flying Zombie - Swooping movement
class FlyingZombie extends Zombie {
    constructor(x, y) {
        super(x, y);
        this.type = 'flying';
        this.speed = 100;
        this.radius = 12;
        this.hitRadius = 12;
        this.color = Colors.zombies.flying;
        this.points = 20;
        this.swoopPhase = Utils.random(0, Math.PI * 2);
        this.swoopAmplitude = 80;
        this.altitude = 0;
    }

    update(dt, playerX, playerY) {
        if (!this.alive) return;

        this.swoopPhase += dt * 3;
        this.altitude = Math.sin(this.swoopPhase) * 30;

        const angle = Utils.angle(this.x, this.y, playerX, playerY);
        this.angle = angle;

        const swoopOffset = Math.sin(this.swoopPhase) * this.swoopAmplitude * dt;
        const perpAngle = angle + Math.PI / 2;

        this.x += Math.cos(angle) * this.speed * dt + Math.cos(perpAngle) * swoopOffset;
        this.y += Math.sin(angle) * this.speed * dt + Math.sin(perpAngle) * swoopOffset;
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y + this.altitude);
        ctx.rotate(this.angle);

        // Wing flap animation
        const wingAngle = Math.sin(this.swoopPhase * 3) * 0.5;

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.save();
        ctx.rotate(wingAngle);
        ctx.fillStyle = this.darkenColor(this.color);
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(-25, -15);
        ctx.lineTo(-15, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.rotate(-wingAngle);
        ctx.fillStyle = this.darkenColor(this.color);
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(-25, 15);
        ctx.lineTo(-15, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(5, -3, 2, 0, Math.PI * 2);
        ctx.arc(5, 3, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Shadow
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 20, this.radius * 0.8, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Berserker Zombie - Charges at player
class BerserkerZombie extends Zombie {
    constructor(x, y) {
        super(x, y);
        this.type = 'berserker';
        this.speed = 50;
        this.chargeSpeed = 350;
        this.radius = 18;
        this.hitRadius = 18;
        this.color = Colors.zombies.berserker;
        this.points = 25;
        this.state = 'approach'; // approach, windup, charge, recover
        this.stateTimer = 0;
        this.chargeAngle = 0;
    }

    update(dt, playerX, playerY) {
        if (!this.alive) return;

        this.stateTimer += dt;

        switch (this.state) {
            case 'approach':
                this.moveToward(playerX, playerY, dt);
                if (Utils.distance(this.x, this.y, playerX, playerY) < 200) {
                    this.state = 'windup';
                    this.stateTimer = 0;
                    this.chargeAngle = Utils.angle(this.x, this.y, playerX, playerY);
                }
                break;

            case 'windup':
                this.angle = Utils.angle(this.x, this.y, playerX, playerY);
                if (this.stateTimer > 0.5) {
                    this.state = 'charge';
                    this.stateTimer = 0;
                }
                break;

            case 'charge':
                this.x += Math.cos(this.chargeAngle) * this.chargeSpeed * dt;
                this.y += Math.sin(this.chargeAngle) * this.chargeSpeed * dt;
                if (this.stateTimer > 0.6) {
                    this.state = 'recover';
                    this.stateTimer = 0;
                }
                break;

            case 'recover':
                if (this.stateTimer > 0.8) {
                    this.state = 'approach';
                    this.stateTimer = 0;
                }
                break;
        }

        // Keep in bounds
        this.x = Utils.clamp(this.x, -50, GAME_WIDTH + 50);
        this.y = Utils.clamp(this.y, -50, GAME_HEIGHT + 50);
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Body - larger and angular
        ctx.fillStyle = this.state === 'charge' ? '#ff0000' : this.color;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius, -this.radius * 0.8);
        ctx.lineTo(-this.radius * 0.5, 0);
        ctx.lineTo(-this.radius, this.radius * 0.8);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = this.darkenColor(this.color);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rage indicator during windup
        if (this.state === 'windup') {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 5 + Math.sin(this.stateTimer * 20) * 3, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Eyes
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(3, -5, 4, 0, Math.PI * 2);
        ctx.arc(3, 5, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Zombie Car
class ZombieCar extends Zombie {
    constructor(x, y) {
        super(x, y);
        this.type = 'car';
        this.speed = 120;
        this.radius = 30;
        this.hitRadius = 25;
        this.health = 3;
        this.maxHealth = 3;
        this.color = Colors.zombies.car;
        this.points = 50;
        this.zombiesInside = 3;
    }

    die() {
        this.alive = false;
        Particles.explosion(this.x, this.y, 30, 2);
        Audio.playExplosion();
        Effects.addShockwave(this.x, this.y, 100, 0.3);
    }

    getZombiesOnDeath() {
        return this.zombiesInside;
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Car body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.radius, -this.radius * 0.6, this.radius * 2, this.radius * 1.2);

        // Windshield
        ctx.fillStyle = '#333';
        ctx.fillRect(this.radius * 0.3, -this.radius * 0.4, this.radius * 0.4, this.radius * 0.8);

        // Headlights
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.radius - 5, -this.radius * 0.4, 4, 0, Math.PI * 2);
        ctx.arc(this.radius - 5, this.radius * 0.4, 4, 0, Math.PI * 2);
        ctx.fill();

        // Wheels
        ctx.fillStyle = '#111';
        ctx.fillRect(-this.radius + 5, -this.radius * 0.7, 10, 6);
        ctx.fillRect(-this.radius + 5, this.radius * 0.7 - 6, 10, 6);
        ctx.fillRect(this.radius - 15, -this.radius * 0.7, 10, 6);
        ctx.fillRect(this.radius - 15, this.radius * 0.7 - 6, 10, 6);

        // Damage smoke
        if (this.health < this.maxHealth / 2) {
            Particles.trail(this.x, this.y, '#555', 5);
        }

        ctx.restore();

        this.drawHealthBar(ctx);
    }
}

// Jumper Zombie - Leaps at player
class JumperZombie extends Zombie {
    constructor(x, y) {
        super(x, y);
        this.type = 'jumper';
        this.speed = 80;
        this.jumpSpeed = 400;
        this.radius = 14;
        this.hitRadius = 14;
        this.color = Colors.zombies.jumper;
        this.points = 25;
        this.state = 'approach';
        this.stateTimer = 0;
        this.jumpHeight = 0;
        this.jumpAngle = 0;
    }

    update(dt, playerX, playerY) {
        if (!this.alive) return;

        this.stateTimer += dt;

        switch (this.state) {
            case 'approach':
                this.moveToward(playerX, playerY, dt);
                if (Utils.distance(this.x, this.y, playerX, playerY) < 250) {
                    this.state = 'crouch';
                    this.stateTimer = 0;
                }
                break;

            case 'crouch':
                this.angle = Utils.angle(this.x, this.y, playerX, playerY);
                if (this.stateTimer > 0.3) {
                    this.state = 'jump';
                    this.stateTimer = 0;
                    this.jumpAngle = this.angle;
                }
                break;

            case 'jump':
                const jumpProgress = this.stateTimer / 0.5;
                this.jumpHeight = Math.sin(jumpProgress * Math.PI) * 80;

                this.x += Math.cos(this.jumpAngle) * this.jumpSpeed * dt;
                this.y += Math.sin(this.jumpAngle) * this.jumpSpeed * dt;

                if (this.stateTimer > 0.5) {
                    this.state = 'land';
                    this.stateTimer = 0;
                    this.jumpHeight = 0;
                }
                break;

            case 'land':
                if (this.stateTimer > 0.5) {
                    this.state = 'approach';
                    this.stateTimer = 0;
                }
                break;
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y - this.jumpHeight);
        ctx.rotate(this.angle);

        // Scale based on jump (appears larger when jumping toward camera)
        const scale = 1 + this.jumpHeight / 200;
        ctx.scale(scale, scale);

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Crouching indicator
        if (this.state === 'crouch') {
            ctx.scale(1, 0.7);
        }

        ctx.strokeStyle = this.darkenColor(this.color);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Legs (extended when jumping)
        if (this.state === 'jump') {
            ctx.fillStyle = this.darkenColor(this.color);
            ctx.fillRect(-this.radius - 5, -3, 8, 6);
            ctx.fillRect(-this.radius - 5, -8, 8, 6);
        }

        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(5, -3, 3, 0, Math.PI * 2);
        ctx.arc(5, 3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Shadow
        if (this.jumpHeight > 0) {
            ctx.save();
            ctx.globalAlpha = 0.3 * (1 - this.jumpHeight / 100);
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + 10, this.radius * 0.8, this.radius * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

// Helicopter Zombie
class HelicopterZombie extends Zombie {
    constructor(x, y) {
        super(x, y);
        this.type = 'helicopter';
        this.speed = 80;
        this.radius = 35;
        this.hitRadius = 30;
        this.health = 6; // 20% easier to kill (was 8)
        this.maxHealth = 6;
        this.color = Colors.zombies.helicopter;
        this.points = 75;
        this.rotorAngle = 0;
        this.dropTimer = 0;
        this.dropInterval = 3;
        this.canDrop = true;
        // Shooting system
        this.shootTimer = 0;
        this.shootInterval = 10; // Shoots every 10 seconds
        this.canShoot = false;
        this.targetPlayerX = 0;
        this.targetPlayerY = 0;
    }

    update(dt, playerX, playerY) {
        if (!this.alive) return;

        // Store player position for shooting
        this.targetPlayerX = playerX;
        this.targetPlayerY = playerY;

        // Strafe movement
        const angle = Utils.angle(this.x, this.y, playerX, playerY);
        const dist = Utils.distance(this.x, this.y, playerX, playerY);

        if (dist > 200) {
            this.x += Math.cos(angle) * this.speed * dt;
            this.y += Math.sin(angle) * this.speed * dt;
        } else if (dist < 150) {
            this.x -= Math.cos(angle) * this.speed * 0.5 * dt;
            this.y -= Math.sin(angle) * this.speed * 0.5 * dt;
        }

        // Circle strafe
        const perpAngle = angle + Math.PI / 2;
        this.x += Math.cos(perpAngle) * this.speed * 0.5 * dt;
        this.y += Math.sin(perpAngle) * this.speed * 0.5 * dt;

        this.angle = angle;
        this.rotorAngle += dt * 20;

        // Drop timer
        this.dropTimer += dt;
        if (this.dropTimer >= this.dropInterval) {
            this.dropTimer = 0;
            this.canDrop = true;
        }

        // Shoot timer
        this.shootTimer += dt;
        if (this.shootTimer >= this.shootInterval) {
            this.shootTimer = 0;
            this.canShoot = true;
        }

        // Keep in bounds
        this.x = Utils.clamp(this.x, 50, GAME_WIDTH - 50);
        this.y = Utils.clamp(this.y, 50, GAME_HEIGHT - 50);
    }

    shouldDropZombie() {
        if (this.canDrop) {
            this.canDrop = false;
            return true;
        }
        return false;
    }

    shouldShoot() {
        if (this.canShoot) {
            this.canShoot = false;
            return true;
        }
        return false;
    }

    getShootData() {
        // Returns data for spawning a slow bullet toward the player
        const angle = Utils.angle(this.x, this.y, this.targetPlayerX, this.targetPlayerY);
        return {
            x: this.x,
            y: this.y,
            angle: angle,
            speed: 150, // Slow bullet
            damage: 0.5, // Half damage
            color: '#ff6600',
            radius: 8
        };
    }

    die() {
        this.alive = false;
        Particles.explosion(this.x, this.y, 40, 2.5);
        Particles.smoke(this.x, this.y, 15);
        Audio.playExplosion();
        Effects.addShockwave(this.x, this.y, 120, 0.4);
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(this.radius * 0.5, 0, this.radius * 0.3, this.radius * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.fillStyle = this.darkenColor(this.color);
        ctx.fillRect(-this.radius - 20, -4, 25, 8);

        // Tail rotor
        ctx.save();
        ctx.translate(-this.radius - 20, 0);
        ctx.rotate(this.rotorAngle * 2);
        ctx.fillStyle = '#444';
        ctx.fillRect(-2, -12, 4, 24);
        ctx.restore();

        // Main rotor
        ctx.save();
        ctx.rotate(this.rotorAngle);
        ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
        ctx.fillRect(-40, -3, 80, 6);
        ctx.rotate(Math.PI / 2);
        ctx.fillRect(-40, -3, 80, 6);
        ctx.restore();

        ctx.restore();

        this.drawHealthBar(ctx);
    }
}

// Dive Bomber - Kamikaze flying zombie
class DiveBomberZombie extends Zombie {
    constructor(x, y) {
        super(x, y);
        this.type = 'diveBomber';
        this.speed = 60;
        this.diveSpeed = 500;
        this.radius = 12;
        this.hitRadius = 12;
        this.color = Colors.zombies.diveBomber;
        this.points = 30;
        this.state = 'circle';
        this.stateTimer = 0;
        this.circleAngle = Utils.random(0, Math.PI * 2);
        this.circleRadius = 200;
        this.altitude = 50;
        this.diveAngle = 0;
    }

    update(dt, playerX, playerY) {
        if (!this.alive) return;

        this.stateTimer += dt;

        switch (this.state) {
            case 'circle':
                this.circleAngle += dt * 1.5;
                this.x = playerX + Math.cos(this.circleAngle) * this.circleRadius;
                this.y = playerY + Math.sin(this.circleAngle) * this.circleRadius;
                this.angle = Utils.angle(this.x, this.y, playerX, playerY);

                if (this.stateTimer > 2) {
                    this.state = 'dive';
                    this.stateTimer = 0;
                    this.diveAngle = this.angle;
                }
                break;

            case 'dive':
                this.altitude = Math.max(0, this.altitude - 200 * dt);
                this.x += Math.cos(this.diveAngle) * this.diveSpeed * dt;
                this.y += Math.sin(this.diveAngle) * this.diveSpeed * dt;

                if (this.stateTimer > 1 || this.altitude <= 0) {
                    // Explode on impact
                    this.die();
                }
                break;
        }
    }

    die() {
        this.alive = false;
        Particles.explosion(this.x, this.y, 20, 1);
        Audio.playExplosion();
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y - this.altitude);
        ctx.rotate(this.angle);

        // Body - pointed like a missile
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius, -this.radius * 0.6);
        ctx.lineTo(-this.radius * 0.5, 0);
        ctx.lineTo(-this.radius, this.radius * 0.6);
        ctx.closePath();
        ctx.fill();

        // Wings
        ctx.fillStyle = this.darkenColor(this.color);
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(-15, -15);
        ctx.lineTo(-10, 0);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(-15, 15);
        ctx.lineTo(-10, 0);
        ctx.closePath();
        ctx.fill();

        // Glow when diving
        if (this.state === 'dive') {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(this.radius - 3, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Shadow
        ctx.save();
        ctx.globalAlpha = 0.3 * (1 - this.altitude / 100);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 10, this.radius * 0.6, this.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Tank Zombie - Slow but heavily armored
class TankZombie extends Zombie {
    constructor(x, y) {
        super(x, y);
        this.type = 'tank';
        this.speed = 35;
        this.radius = 25;
        this.hitRadius = 25;
        this.health = 15;
        this.maxHealth = 15;
        this.color = Colors.zombies.tank;
        this.points = 100;
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Body - large and bulky
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Armor plates
        ctx.fillStyle = '#404040';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.8, -0.5, 0.5);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Eyes (small, angry)
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(10, -6, 4, 0, Math.PI * 2);
        ctx.arc(10, 6, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        this.drawHealthBar(ctx);
    }
}

// Teleporter Zombie - Blinks toward player
class TeleporterZombie extends Zombie {
    constructor(x, y) {
        super(x, y);
        this.type = 'teleporter';
        this.speed = 40;
        this.radius = 13;
        this.hitRadius = 13;
        this.color = Colors.zombies.teleporter;
        this.points = 40;
        this.teleportTimer = 0;
        this.teleportCooldown = 2;
        this.teleportDistance = 100;
        this.isTeleporting = false;
        this.teleportAlpha = 1;
    }

    update(dt, playerX, playerY) {
        if (!this.alive) return;

        this.teleportTimer += dt;

        if (this.isTeleporting) {
            this.teleportAlpha -= dt * 5;
            if (this.teleportAlpha <= 0) {
                // Complete teleport
                const angle = Utils.angle(this.x, this.y, playerX, playerY);
                const dist = Math.min(this.teleportDistance, Utils.distance(this.x, this.y, playerX, playerY) - 50);
                this.x += Math.cos(angle) * dist;
                this.y += Math.sin(angle) * dist;
                this.isTeleporting = false;
                this.teleportAlpha = 1;
                Audio.playTeleport();
                Particles.deathBurst(this.x, this.y, this.color, 8);
            }
        } else {
            this.moveToward(playerX, playerY, dt);

            if (this.teleportTimer >= this.teleportCooldown) {
                this.teleportTimer = 0;
                this.isTeleporting = true;
                Particles.deathBurst(this.x, this.y, this.color, 8);
            }
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.globalAlpha = this.teleportAlpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Body with ethereal glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Inner swirl
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 1.5);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(4, -3, 3, 0, Math.PI * 2);
        ctx.arc(4, 3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Shielded Zombie - Must be shot from behind
class ShieldedZombie extends Zombie {
    constructor(x, y) {
        super(x, y);
        this.type = 'shielded';
        this.speed = 50;
        this.radius = 16;
        this.hitRadius = 16;
        this.health = 3;
        this.maxHealth = 3;
        this.color = Colors.zombies.shielded;
        this.points = 35;
        this.shieldAngle = 0;
        this.shieldArc = Math.PI * 0.8; // Shield covers front 144 degrees
    }

    isShieldBlocking(bulletAngle) {
        // Check if bullet is hitting the shield (front of zombie)
        const angleDiff = Math.abs(this.normalizeAngle(bulletAngle - this.angle - Math.PI));
        return angleDiff < this.shieldArc / 2;
    }

    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.darkenColor(this.color);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Shield
        ctx.fillStyle = '#87CEEB';
        ctx.strokeStyle = '#4169E1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 5, -this.shieldArc / 2, this.shieldArc / 2);
        ctx.stroke();

        // Shield face
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, this.radius + 5, -this.shieldArc / 2, this.shieldArc / 2);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(5, -4, 3, 0, Math.PI * 2);
        ctx.arc(5, 4, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (this.health < this.maxHealth) {
            this.drawHealthBar(ctx);
        }
    }
}

// Zombie Manager
class ZombieManager {
    constructor() {
        this.zombies = [];
        this.zombieTypes = {
            walker: Zombie,
            runner: RunnerZombie,
            flying: FlyingZombie,
            berserker: BerserkerZombie,
            car: ZombieCar,
            jumper: JumperZombie,
            helicopter: HelicopterZombie,
            diveBomber: DiveBomberZombie,
            tank: TankZombie,
            teleporter: TeleporterZombie,
            shielded: ShieldedZombie
        };
    }

    spawn(type, x, y, playerX, playerY) {
        const ZombieClass = this.zombieTypes[type] || Zombie;
        const zombie = new ZombieClass(x, y);
        zombie.init(x, y, playerX, playerY);
        this.zombies.push(zombie);
        return zombie;
    }

    spawnRandom(types, playerX, playerY) {
        const type = Utils.randomChoice(types);
        const pos = Utils.getSpawnPosition();
        return this.spawn(type, pos.x, pos.y, playerX, playerY);
    }

    spawnAtPosition(type, x, y, playerX, playerY) {
        return this.spawn(type, x, y, playerX, playerY);
    }

    update(dt, playerX, playerY, lootBoxManager = null, wallManager = null, bulletManager = null) {
        const toSpawnFromVehicles = [];
        const afterburnKills = [];

        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const zombie = this.zombies[i];
            zombie.update(dt, playerX, playerY);

            // Handle wall collision for zombies
            if (zombie.alive && wallManager) {
                wallManager.resolveCircleCollision(zombie);
            }

            // Update afterburn damage
            if (zombie.alive && zombie.updateAfterburn(dt)) {
                // Zombie died from afterburn
                afterburnKills.push({
                    type: zombie.type,
                    points: zombie.points,
                    x: zombie.x,
                    y: zombie.y
                });
                if (lootBoxManager) {
                    lootBoxManager.trySpawn(zombie.x, zombie.y);
                }
            }

            // Check for helicopter drops
            if (zombie.type === 'helicopter' && zombie.alive && zombie.shouldDropZombie()) {
                toSpawnFromVehicles.push({
                    type: 'walker',
                    x: zombie.x,
                    y: zombie.y
                });
            }

            // Check for helicopter shooting
            if (zombie.type === 'helicopter' && zombie.alive && zombie.shouldShoot() && bulletManager) {
                const shootData = zombie.getShootData();
                bulletManager.spawnEnemyBullet(
                    shootData.x,
                    shootData.y,
                    shootData.angle,
                    shootData.speed,
                    shootData.damage,
                    shootData.color,
                    shootData.radius
                );
                // Visual effect for helicopter shooting
                Particles.muzzleFlash(shootData.x, shootData.y, shootData.angle);
            }

            // Remove dead zombies (but keep track for scoring)
            if (!zombie.alive) {
                // Cars release zombies when destroyed
                if (zombie.type === 'car' && zombie.getZombiesOnDeath) {
                    const count = zombie.getZombiesOnDeath();
                    for (let j = 0; j < count; j++) {
                        toSpawnFromVehicles.push({
                            type: 'walker',
                            x: zombie.x + Utils.random(-30, 30),
                            y: zombie.y + Utils.random(-30, 30)
                        });
                    }
                }
                this.zombies.splice(i, 1);
            }
        }

        // Spawn zombies from vehicles
        for (const spawn of toSpawnFromVehicles) {
            this.spawn(spawn.type, spawn.x, spawn.y, playerX, playerY);
        }

        return afterburnKills;
    }

    draw(ctx) {
        // Sort by Y position for proper layering
        this.zombies.sort((a, b) => a.y - b.y);

        for (const zombie of this.zombies) {
            zombie.draw(ctx);
        }
    }

    checkBulletCollisions(bulletManager, lootBoxManager) {
        let kills = [];
        const processedExplosions = new Set(); // Track which bullets have already exploded

        const active = bulletManager.getActive();

        for (let i = active.length - 1; i >= 0; i--) {
            const bullet = active[i];
            if (!bullet.active) continue;

            let bulletHit = false;

            for (const zombie of this.zombies) {
                if (!zombie.alive) continue;

                if (Utils.circleCollision(
                    bullet.x, bullet.y, bullet.radius,
                    zombie.x, zombie.y, zombie.hitRadius
                )) {
                    // Check shield
                    if (zombie.type === 'shielded' && zombie.isShieldBlocking(bullet.angle)) {
                        // Blocked by shield
                        Particles.sparks(bullet.x, bullet.y, bullet.angle, 8);
                        bullet.active = false;
                        bulletHit = true;
                        break;
                    }

                    // Create impact effect
                    Particles.sparks(bullet.x, bullet.y, bullet.angle, 5);
                    Particles.blood(zombie.x, zombie.y, bullet.angle, 5);

                    // Handle explosive bullets (rockets)
                    if (bullet.isExplosive && !processedExplosions.has(bullet)) {
                        processedExplosions.add(bullet);
                        bullet.explode();

                        // Deal area damage to all zombies in explosion radius
                        for (const targetZombie of this.zombies) {
                            if (!targetZombie.alive) continue;

                            const dist = Utils.distance(bullet.x, bullet.y, targetZombie.x, targetZombie.y);
                            if (dist < bullet.explosionRadius) {
                                // Damage falls off with distance
                                const damageMultiplier = 1 - (dist / bullet.explosionRadius) * 0.5;
                                const explosionDamage = Math.ceil(bullet.damage * damageMultiplier);

                                Particles.blood(targetZombie.x, targetZombie.y, Utils.random(0, Math.PI * 2), 8);

                                if (targetZombie.takeDamage(explosionDamage)) {
                                    const killData = {
                                        type: targetZombie.type,
                                        points: targetZombie.points,
                                        x: targetZombie.x,
                                        y: targetZombie.y
                                    };
                                    kills.push(killData);

                                    // Try to spawn loot box (1% chance)
                                    if (lootBoxManager) {
                                        lootBoxManager.trySpawn(targetZombie.x, targetZombie.y);
                                    }
                                }
                            }
                        }
                        bullet.active = false;
                        bulletHit = true;
                        break;
                    }

                    bullet.active = false;
                    bulletHit = true;

                    // Apply afterburn effect if bullet has it (flamethrower)
                    if (bullet.hasAfterburn && zombie.alive) {
                        zombie.applyAfterburn(bullet.afterburnDamage, bullet.afterburnDuration);
                    }

                    if (zombie.takeDamage(bullet.damage)) {
                        const killData = {
                            type: zombie.type,
                            points: zombie.points,
                            x: zombie.x,
                            y: zombie.y
                        };
                        kills.push(killData);

                        // Try to spawn loot box (1% chance)
                        if (lootBoxManager) {
                            lootBoxManager.trySpawn(zombie.x, zombie.y);
                        }
                    }
                    break;
                }
            }
        }

        return kills;
    }

    checkPlayerCollision(playerX, playerY, playerRadius) {
        for (const zombie of this.zombies) {
            if (!zombie.alive) continue;

            if (zombie.checkCollision(playerX, playerY, playerRadius)) {
                return true;
            }
        }
        return false;
    }

    getCount() {
        return this.zombies.filter(z => z.alive).length;
    }

    clear() {
        this.zombies = [];
    }
}
