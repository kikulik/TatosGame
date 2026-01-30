// Boss Classes for Zombie Apocalypse Game

// Base Boss Class
class Boss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 40;
        this.hitRadius = 40;
        this.speed = 50;
        this.health = 50;
        this.maxHealth = 50;
        this.damage = 1;
        this.points = 500;
        this.alive = true;
        this.angle = 0;
        this.name = 'Boss';
        this.color = '#ff0000';
        this.phase = 1;
        this.stateTimer = 0;
        this.state = 'idle';

        // Spawning abilities
        this.spawnTimer = 0;
        this.spawnCooldown = 5;
        this.minionsToSpawn = [];
    }

    reset() {
        this.alive = true;
        this.health = this.maxHealth;
        this.phase = 1;
        this.stateTimer = 0;
        this.state = 'idle';
        this.minionsToSpawn = [];
    }

    takeDamage(amount) {
        this.health -= amount;

        // Phase transitions
        if (this.health <= this.maxHealth * 0.66 && this.phase === 1) {
            this.phase = 2;
            this.onPhaseChange(2);
        } else if (this.health <= this.maxHealth * 0.33 && this.phase === 2) {
            this.phase = 3;
            this.onPhaseChange(3);
        }

        if (this.health <= 0) {
            this.die();
            return true;
        }

        // Flash effect
        Effects.addFlash(0.05, 'rgba(255, 255, 255, 0.2)');
        Utils.screenShake.shake(5, 0.1);

        return false;
    }

    onPhaseChange(phase) {
        // Override in subclasses
        Effects.addText(this.x, this.y - 50, `Phase ${phase}!`, '#ff4444', 1.5, 24);
        Utils.screenShake.shake(10, 0.3);
    }

    die() {
        this.alive = false;
        Audio.playBossDeath();
        Particles.explosion(this.x, this.y, 50, 3);
        Effects.addShockwave(this.x, this.y, 200, 0.5, 'rgba(255, 68, 68, 0.5)');
        Effects.addFlash(0.3, 'rgba(255, 255, 255, 0.5)');
        Utils.screenShake.shake(20, 1);
    }

    getMinionsToSpawn() {
        const minions = [...this.minionsToSpawn];
        this.minionsToSpawn = [];
        return minions;
    }

    spawnMinion(type) {
        const angle = Utils.random(0, Math.PI * 2);
        const dist = this.radius + 30;
        this.minionsToSpawn.push({
            type,
            x: this.x + Math.cos(angle) * dist,
            y: this.y + Math.sin(angle) * dist
        });
    }

    update(dt, playerX, playerY) {
        if (!this.alive) return;
        this.stateTimer += dt;
        this.spawnTimer += dt;
        this.angle = Utils.angle(this.x, this.y, playerX, playerY);
    }

    draw(ctx) {
        if (!this.alive) return;
        // Override in subclasses
    }

    drawHealthBar(ctx) {
        // Boss health bar is in the HUD
    }

    checkCollision(playerX, playerY, playerRadius) {
        return Utils.circleCollision(
            this.x, this.y, this.hitRadius,
            playerX, playerY, playerRadius
        );
    }
}

// Level 1 Boss: Big Bernie - Large slow zombie that spawns smaller zombies
class BigBernie extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'BIG BERNIE';
        this.health = 30;
        this.maxHealth = 30;
        this.radius = 50;
        this.hitRadius = 50;
        this.speed = 30;
        this.color = Colors.bosses.bigBernie;
        this.points = 500;
        this.spawnCooldown = 4;
        this.lastHealth = this.health;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);

        // Move toward player slowly
        const angle = Utils.angle(this.x, this.y, playerX, playerY);
        this.x += Math.cos(angle) * this.speed * dt;
        this.y += Math.sin(angle) * this.speed * dt;

        // Spawn minions when damaged
        if (this.health < this.lastHealth) {
            this.spawnMinion('walker');
            this.lastHealth = this.health;
        }

        // Periodic spawns
        if (this.spawnTimer >= this.spawnCooldown) {
            this.spawnTimer = 0;
            this.spawnMinion('walker');
            if (this.phase >= 2) this.spawnMinion('walker');
            if (this.phase >= 3) this.spawnMinion('walker');
        }

        // Keep in bounds
        this.x = Utils.clamp(this.x, this.radius, GAME_WIDTH - this.radius);
        this.y = Utils.clamp(this.y, this.radius, GAME_HEIGHT - this.radius);
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Large body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#3d2817';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Fat rolls
        ctx.fillStyle = '#5a3d2b';
        ctx.beginPath();
        ctx.ellipse(0, this.radius * 0.3, this.radius * 0.8, this.radius * 0.3, 0, 0, Math.PI);
        ctx.fill();

        // Eyes (angry)
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(20, -15, 8, 0, Math.PI * 2);
        ctx.arc(20, 15, 8, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = '#2d1810';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(25, 0, 15, -0.5, 0.5);
        ctx.stroke();

        ctx.restore();
    }
}

// Level 2 Boss: Sprint Sally - Ultra-fast circling boss
class SprintSally extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'SPRINT SALLY';
        this.health = 35;
        this.maxHealth = 35;
        this.radius = 25;
        this.hitRadius = 25;
        this.speed = 300;
        this.color = Colors.bosses.sprintSally;
        this.points = 600;
        this.circleAngle = 0;
        this.circleRadius = 200;
        this.circleSpeed = 3;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);

        // Circle around player
        this.circleSpeed = 3 + this.phase;
        this.circleAngle += this.circleSpeed * dt;

        // Spiral in occasionally
        if (this.phase >= 2) {
            this.circleRadius = 150 + Math.sin(this.stateTimer * 2) * 50;
        }

        const targetX = playerX + Math.cos(this.circleAngle) * this.circleRadius;
        const targetY = playerY + Math.sin(this.circleAngle) * this.circleRadius;

        // Move toward target position
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        this.angle = this.circleAngle + Math.PI / 2;

        // Keep in bounds
        this.x = Utils.clamp(this.x, this.radius, GAME_WIDTH - this.radius);
        this.y = Utils.clamp(this.y, this.radius, GAME_HEIGHT - this.radius);
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Speed lines
        ctx.strokeStyle = 'rgba(50, 205, 50, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-this.radius - 10 - i * 10, Utils.random(-5, 5));
            ctx.lineTo(-this.radius - 30 - i * 10, Utils.random(-5, 5));
            ctx.stroke();
        }

        // Streamlined body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Hair streaming back
        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(-10, -this.radius * 0.5 + i * 5);
            ctx.quadraticCurveTo(-25, -this.radius * 0.5 + i * 5, -35, -this.radius * 0.3 + i * 5);
            ctx.lineTo(-30, -this.radius * 0.4 + i * 5);
            ctx.closePath();
            ctx.fill();
        }

        // Eyes
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(10, -5, 4, 0, Math.PI * 2);
        ctx.arc(10, 5, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Level 3 Boss: Sky Reaper - Flying boss that drops flying zombies
class SkyReaper extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'SKY REAPER';
        this.health = 45;
        this.maxHealth = 45;
        this.radius = 40;
        this.hitRadius = 35;
        this.speed = 100;
        this.color = Colors.bosses.skyReaper;
        this.points = 750;
        this.altitude = 60;
        this.wingPhase = 0;
        this.spawnCooldown = 3;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);

        this.wingPhase += dt * 5;

        // Swoop pattern
        const targetDist = 250 - this.phase * 30;
        const currentDist = Utils.distance(this.x, this.y, playerX, playerY);

        if (currentDist > targetDist + 50) {
            const angle = Utils.angle(this.x, this.y, playerX, playerY);
            this.x += Math.cos(angle) * this.speed * dt;
            this.y += Math.sin(angle) * this.speed * dt;
        } else if (currentDist < targetDist - 50) {
            const angle = Utils.angle(this.x, this.y, playerX, playerY);
            this.x -= Math.cos(angle) * this.speed * 0.5 * dt;
            this.y -= Math.sin(angle) * this.speed * 0.5 * dt;
        }

        // Circle strafe
        const perpAngle = this.angle + Math.PI / 2;
        this.x += Math.cos(perpAngle) * this.speed * 0.7 * dt;
        this.y += Math.sin(perpAngle) * this.speed * 0.7 * dt;

        // Spawn flying zombies
        if (this.spawnTimer >= this.spawnCooldown) {
            this.spawnTimer = 0;
            this.spawnMinion('flying');
            if (this.phase >= 2) this.spawnMinion('flying');
        }

        this.x = Utils.clamp(this.x, this.radius, GAME_WIDTH - this.radius);
        this.y = Utils.clamp(this.y, this.radius, GAME_HEIGHT - this.radius);
    }

    draw(ctx) {
        if (!this.alive) return;

        const wingAngle = Math.sin(this.wingPhase) * 0.4;

        ctx.save();
        ctx.translate(this.x, this.y - this.altitude);
        ctx.rotate(this.angle);

        // Wings
        ctx.save();
        ctx.rotate(wingAngle);
        ctx.fillStyle = '#0f0f3d';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-60, -40);
        ctx.lineTo(-50, -10);
        ctx.lineTo(-30, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.rotate(-wingAngle);
        ctx.fillStyle = '#0f0f3d';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-60, 40);
        ctx.lineTo(-50, 10);
        ctx.lineTo(-30, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Skull face
        ctx.fillStyle = '#1a1a4d';
        ctx.beginPath();
        ctx.arc(15, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // Glowing eyes
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(20, -6, 4, 0, Math.PI * 2);
        ctx.arc(20, 6, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();

        // Shadow
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 20, this.radius * 0.8, this.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    checkCollision(playerX, playerY, playerRadius) {
        // Adjust for altitude
        return Utils.circleCollision(
            this.x, this.y - this.altitude * 0.5, this.hitRadius,
            playerX, playerY, playerRadius
        );
    }
}

// Level 4 Boss: Rage King - Massive berserker with shockwaves
class RageKing extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'RAGE KING';
        this.health = 60;
        this.maxHealth = 60;
        this.radius = 55;
        this.hitRadius = 50;
        this.speed = 40;
        this.chargeSpeed = 400;
        this.color = Colors.bosses.rageKing;
        this.points = 900;
        this.state = 'approach';
        this.chargeAngle = 0;
        this.shockwaveCooldown = 0;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);

        this.shockwaveCooldown -= dt;

        switch (this.state) {
            case 'approach':
                const dist = Utils.distance(this.x, this.y, playerX, playerY);
                this.moveToward(playerX, playerY, dt);

                if (dist < 300) {
                    this.state = 'windup';
                    this.stateTimer = 0;
                    this.chargeAngle = Utils.angle(this.x, this.y, playerX, playerY);
                }
                break;

            case 'windup':
                this.angle = Utils.angle(this.x, this.y, playerX, playerY);
                if (this.stateTimer > 0.8 - this.phase * 0.1) {
                    this.state = 'charge';
                    this.stateTimer = 0;
                }
                break;

            case 'charge':
                this.x += Math.cos(this.chargeAngle) * this.chargeSpeed * dt;
                this.y += Math.sin(this.chargeAngle) * this.chargeSpeed * dt;

                // Trail particles
                Particles.trail(this.x, this.y, this.color, 8);

                if (this.stateTimer > 0.8) {
                    this.state = 'slam';
                    this.stateTimer = 0;
                    this.createShockwave();
                }
                break;

            case 'slam':
                if (this.stateTimer > 1) {
                    this.state = 'approach';
                    this.stateTimer = 0;
                }
                break;
        }

        this.x = Utils.clamp(this.x, this.radius, GAME_WIDTH - this.radius);
        this.y = Utils.clamp(this.y, this.radius, GAME_HEIGHT - this.radius);
    }

    moveToward(playerX, playerY, dt) {
        const angle = Utils.angle(this.x, this.y, playerX, playerY);
        this.angle = angle;
        this.x += Math.cos(angle) * this.speed * dt;
        this.y += Math.sin(angle) * this.speed * dt;
    }

    createShockwave() {
        Effects.addShockwave(this.x, this.y, 300, 0.5, 'rgba(255, 0, 0, 0.5)');
        Audio.playShockwave();
        Utils.screenShake.shake(15, 0.3);
    }

    getShockwaveKnockback(playerX, playerY) {
        if (this.state === 'slam' && this.stateTimer < 0.3) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 300) {
                const angle = Utils.angle(this.x, this.y, playerX, playerY);
                const force = (1 - dist / 300) * 500;
                return { angle, force };
            }
        }
        return null;
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Rage aura during windup
        if (this.state === 'windup') {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 5;
            const pulseSize = 1 + Math.sin(this.stateTimer * 15) * 0.1;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * pulseSize + 10, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Body - massive and angular
        ctx.fillStyle = this.state === 'charge' ? '#ff0000' : this.color;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(this.radius * 0.3, -this.radius);
        ctx.lineTo(-this.radius, -this.radius * 0.5);
        ctx.lineTo(-this.radius, this.radius * 0.5);
        ctx.lineTo(this.radius * 0.3, this.radius);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Crown
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.3, -this.radius * 0.8);
        ctx.lineTo(-this.radius * 0.1, -this.radius * 1.1);
        ctx.lineTo(0, -this.radius * 0.9);
        ctx.lineTo(this.radius * 0.1, -this.radius * 1.1);
        ctx.lineTo(this.radius * 0.3, -this.radius * 0.8);
        ctx.closePath();
        ctx.fill();

        // Glowing eyes
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(15, -15, 8, 0, Math.PI * 2);
        ctx.arc(15, 15, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

// Level 5 Boss: Monster Truck Mike - Armored vehicle boss
class MonsterTruckMike extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'MONSTER TRUCK MIKE';
        this.health = 75;
        this.maxHealth = 75;
        this.radius = 60;
        this.hitRadius = 55;
        this.speed = 60;
        this.chargeSpeed = 350;
        this.color = Colors.bosses.monsterTruck;
        this.points = 1000;
        this.state = 'patrol';
        this.wheelRotation = 0;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);

        this.wheelRotation += dt * 10;

        switch (this.state) {
            case 'patrol':
                this.moveToward(playerX, playerY, dt);
                if (Utils.distance(this.x, this.y, playerX, playerY) < 350) {
                    this.state = 'rev';
                    this.stateTimer = 0;
                    this.chargeAngle = Utils.angle(this.x, this.y, playerX, playerY);
                }
                break;

            case 'rev':
                this.angle = Utils.angle(this.x, this.y, playerX, playerY);
                // Rev particles
                Particles.smoke(this.x - Math.cos(this.angle) * this.radius, this.y - Math.sin(this.angle) * this.radius, 3);

                if (this.stateTimer > 1 - this.phase * 0.15) {
                    this.state = 'charge';
                    this.stateTimer = 0;
                }
                break;

            case 'charge':
                this.x += Math.cos(this.chargeAngle) * this.chargeSpeed * dt;
                this.y += Math.sin(this.chargeAngle) * this.chargeSpeed * dt;
                Particles.trail(this.x, this.y, '#333', 6);

                if (this.stateTimer > 1.2 ||
                    this.x < this.radius || this.x > GAME_WIDTH - this.radius ||
                    this.y < this.radius || this.y > GAME_HEIGHT - this.radius) {
                    this.state = 'recover';
                    this.stateTimer = 0;
                    Utils.screenShake.shake(8, 0.2);
                }
                break;

            case 'recover':
                if (this.stateTimer > 1.5 - this.phase * 0.2) {
                    this.state = 'patrol';
                    this.stateTimer = 0;
                }
                break;
        }

        this.x = Utils.clamp(this.x, this.radius, GAME_WIDTH - this.radius);
        this.y = Utils.clamp(this.y, this.radius, GAME_HEIGHT - this.radius);

        // Spawn zombies periodically
        if (this.spawnTimer >= 5 - this.phase) {
            this.spawnTimer = 0;
            this.spawnMinion('walker');
            this.spawnMinion('walker');
        }
    }

    moveToward(playerX, playerY, dt) {
        const angle = Utils.angle(this.x, this.y, playerX, playerY);
        this.angle = angle;
        this.x += Math.cos(angle) * this.speed * dt;
        this.y += Math.sin(angle) * this.speed * dt;
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.radius, -this.radius * 0.5, this.radius * 2, this.radius);

        // Cab
        ctx.fillStyle = '#1f3d3d';
        ctx.fillRect(this.radius * 0.2, -this.radius * 0.4, this.radius * 0.6, this.radius * 0.8);

        // Windshield
        ctx.fillStyle = '#333';
        ctx.fillRect(this.radius * 0.5, -this.radius * 0.3, this.radius * 0.2, this.radius * 0.6);

        // Monster wheels
        const wheelPositions = [
            { x: -this.radius * 0.6, y: -this.radius * 0.6 },
            { x: -this.radius * 0.6, y: this.radius * 0.6 },
            { x: this.radius * 0.4, y: -this.radius * 0.6 },
            { x: this.radius * 0.4, y: this.radius * 0.6 }
        ];

        for (const pos of wheelPositions) {
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(this.wheelRotation);

            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#333';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Wheel spokes
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
                ctx.stroke();
            }

            ctx.restore();
        }

        // Headlights
        ctx.fillStyle = this.state === 'rev' ? '#ffff00' : '#666';
        ctx.beginPath();
        ctx.arc(this.radius - 5, -this.radius * 0.3, 6, 0, Math.PI * 2);
        ctx.arc(this.radius - 5, this.radius * 0.3, 6, 0, Math.PI * 2);
        ctx.fill();

        // Armor plates
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(-this.radius + 5, -this.radius * 0.5 - 5, 20, 10);
        ctx.fillRect(-this.radius + 5, this.radius * 0.5 - 5, 20, 10);

        ctx.restore();
    }
}

// Level 6 Boss: Chopper Commander - Attack helicopter
class ChopperCommander extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'CHOPPER COMMANDER';
        this.health = 80;
        this.maxHealth = 80;
        this.radius = 50;
        this.hitRadius = 45;
        this.speed = 120;
        this.color = Colors.bosses.chopperCommander;
        this.points = 1200;
        this.rotorAngle = 0;
        this.circleAngle = 0;
        this.circleRadius = 250;
        this.spawnCooldown = 2;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);

        this.rotorAngle += dt * 25;

        // Circle around player
        this.circleAngle += (1 + this.phase * 0.5) * dt;
        this.circleRadius = 200 - this.phase * 20;

        const targetX = playerX + Math.cos(this.circleAngle) * this.circleRadius;
        const targetY = playerY + Math.sin(this.circleAngle) * this.circleRadius;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        this.angle = Utils.angle(this.x, this.y, playerX, playerY);

        // Spawn flying zombies
        if (this.spawnTimer >= this.spawnCooldown) {
            this.spawnTimer = 0;
            this.spawnMinion('flying');
            if (this.phase >= 2) this.spawnMinion('diveBomber');
            if (this.phase >= 3) this.spawnMinion('flying');
        }

        this.x = Utils.clamp(this.x, this.radius + 20, GAME_WIDTH - this.radius - 20);
        this.y = Utils.clamp(this.y, this.radius + 20, GAME_HEIGHT - this.radius - 20);
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.ellipse(this.radius * 0.4, 0, this.radius * 0.3, this.radius * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.fillStyle = '#5a6a7a';
        ctx.fillRect(-this.radius - 30, -5, 35, 10);

        // Tail rotor
        ctx.save();
        ctx.translate(-this.radius - 30, 0);
        ctx.rotate(this.rotorAngle * 2);
        ctx.fillStyle = '#444';
        ctx.fillRect(-2, -15, 4, 30);
        ctx.restore();

        // Main rotor
        ctx.save();
        ctx.rotate(this.rotorAngle);
        ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
        ctx.fillRect(-55, -4, 110, 8);
        ctx.rotate(Math.PI / 2);
        ctx.fillRect(-55, -4, 110, 8);
        ctx.restore();

        // Weapons
        ctx.fillStyle = '#333';
        ctx.fillRect(-this.radius * 0.3, this.radius * 0.4, 20, 8);
        ctx.fillRect(-this.radius * 0.3, -this.radius * 0.4 - 8, 20, 8);

        // Commander badge
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, -this.radius * 0.2, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Level 7 Boss: Horde Master - Splits when hit
class HordeMaster extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'HORDE MASTER';
        this.health = 50;
        this.maxHealth = 50;
        this.radius = 45;
        this.hitRadius = 45;
        this.speed = 60;
        this.color = Colors.bosses.hordeMaster;
        this.points = 1500;
        this.splitCount = 0;
        this.maxSplits = 3;
        this.pulsePhase = 0;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);

        this.pulsePhase += dt * 3;

        // Move toward player
        const angle = Utils.angle(this.x, this.y, playerX, playerY);
        this.angle = angle;
        this.x += Math.cos(angle) * this.speed * dt;
        this.y += Math.sin(angle) * this.speed * dt;

        // Periodic spawns
        if (this.spawnTimer >= 4 - this.phase) {
            this.spawnTimer = 0;
            for (let i = 0; i < 3 + this.phase; i++) {
                this.spawnMinion('walker');
            }
        }

        this.x = Utils.clamp(this.x, this.radius, GAME_WIDTH - this.radius);
        this.y = Utils.clamp(this.y, this.radius, GAME_HEIGHT - this.radius);
    }

    takeDamage(amount) {
        const result = super.takeDamage(amount);

        // Split on damage
        if (!result && this.splitCount < this.maxSplits) {
            const splitChance = 0.3 + this.phase * 0.1;
            if (Math.random() < splitChance) {
                this.splitCount++;
                for (let i = 0; i < 2; i++) {
                    const angle = Utils.random(0, Math.PI * 2);
                    this.minionsToSpawn.push({
                        type: Utils.randomChoice(['walker', 'runner']),
                        x: this.x + Math.cos(angle) * 50,
                        y: this.y + Math.sin(angle) * 50
                    });
                }
                Effects.addText(this.x, this.y - 30, 'SPLIT!', '#ff00ff', 0.8, 18);
            }
        }

        return result;
    }

    draw(ctx) {
        if (!this.alive) return;

        const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Aura
        ctx.fillStyle = 'rgba(139, 0, 139, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * pulse + 20, 0, Math.PI * 2);
        ctx.fill();

        // Main body - blob-like
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r = this.radius * pulse + Math.sin(this.pulsePhase + i) * 5;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#5B005B';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Multiple eyes
        ctx.fillStyle = '#ff00ff';
        const eyePositions = [
            { x: 10, y: -10 }, { x: 15, y: 5 }, { x: 5, y: 15 },
            { x: -5, y: -5 }, { x: -10, y: 10 }
        ];
        for (const eye of eyePositions) {
            ctx.beginPath();
            ctx.arc(eye.x, eye.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Split indicator
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.maxSplits - this.splitCount}`, 0, 5);

        ctx.restore();
    }
}

// Level 8 Boss: Tactical Nightmare - Armored, teleporting, spawns shields
class TacticalNightmare extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'TACTICAL NIGHTMARE';
        this.health = 100;
        this.maxHealth = 100;
        this.radius = 50;
        this.hitRadius = 45;
        this.speed = 50;
        this.color = Colors.bosses.tacticalNightmare;
        this.points = 2000;
        this.teleportCooldown = 0;
        this.teleportInterval = 4;
        this.isTeleporting = false;
        this.teleportAlpha = 1;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);

        this.teleportCooldown -= dt;

        if (this.isTeleporting) {
            this.teleportAlpha -= dt * 3;
            if (this.teleportAlpha <= 0) {
                // Complete teleport
                const angle = Utils.random(0, Math.PI * 2);
                const dist = Utils.random(150, 300);
                this.x = playerX + Math.cos(angle) * dist;
                this.y = playerY + Math.sin(angle) * dist;
                this.x = Utils.clamp(this.x, this.radius, GAME_WIDTH - this.radius);
                this.y = Utils.clamp(this.y, this.radius, GAME_HEIGHT - this.radius);
                this.isTeleporting = false;
                this.teleportAlpha = 1;
                Audio.playTeleport();
                Particles.deathBurst(this.x, this.y, this.color, 15);
            }
        } else {
            // Move toward player
            const angle = Utils.angle(this.x, this.y, playerX, playerY);
            this.angle = angle;
            this.x += Math.cos(angle) * this.speed * dt;
            this.y += Math.sin(angle) * this.speed * dt;

            // Teleport
            if (this.teleportCooldown <= 0) {
                this.teleportCooldown = this.teleportInterval - this.phase * 0.5;
                this.isTeleporting = true;
                Particles.deathBurst(this.x, this.y, this.color, 15);
            }
        }

        // Spawn shielded and teleporter zombies
        if (this.spawnTimer >= 5 - this.phase) {
            this.spawnTimer = 0;
            this.spawnMinion('shielded');
            if (this.phase >= 2) this.spawnMinion('teleporter');
            if (this.phase >= 3) this.spawnMinion('tank');
        }

        this.x = Utils.clamp(this.x, this.radius, GAME_WIDTH - this.radius);
        this.y = Utils.clamp(this.y, this.radius, GAME_HEIGHT - this.radius);
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.globalAlpha = this.teleportAlpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Shield/armor plating
        ctx.fillStyle = '#2a2a4a';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 5, -1, 1);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#2a0a4a';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Tech patterns
        ctx.strokeStyle = '#9400D3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.4, Math.PI, Math.PI * 2);
        ctx.stroke();

        // Visor
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 10;
        ctx.fillRect(10, -15, 25, 8);
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

// Level 9 Boss: Chaos Incarnate - Shape-shifting boss
class ChaosIncarnate extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'CHAOS INCARNATE';
        this.health = 120;
        this.maxHealth = 120;
        this.radius = 45;
        this.hitRadius = 40;
        this.speed = 80;
        this.color = Colors.bosses.chaosIncarnate;
        this.points = 2500;
        this.currentForm = 0;
        this.forms = ['berserker', 'flyer', 'teleporter', 'tank'];
        this.formTimer = 0;
        this.formDuration = 8;
        this.morphing = false;
        this.morphProgress = 0;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);

        this.formTimer += dt;

        if (this.morphing) {
            this.morphProgress += dt * 2;
            if (this.morphProgress >= 1) {
                this.morphing = false;
                this.morphProgress = 0;
                this.currentForm = (this.currentForm + 1) % this.forms.length;
                Effects.addText(this.x, this.y - 50, this.forms[this.currentForm].toUpperCase(), '#ff1493', 1, 20);
            }
            return;
        }

        if (this.formTimer >= this.formDuration - this.phase) {
            this.formTimer = 0;
            this.morphing = true;
            this.morphProgress = 0;
            Particles.explosion(this.x, this.y, 20, 1);
        }

        // Behavior based on current form
        const form = this.forms[this.currentForm];
        switch (form) {
            case 'berserker':
                this.speed = 150;
                this.moveToward(playerX, playerY, dt);
                break;

            case 'flyer':
                this.speed = 100;
                const swoopX = Math.sin(this.stateTimer * 2) * 100;
                const angle = Utils.angle(this.x, this.y, playerX, playerY);
                this.x += Math.cos(angle) * this.speed * dt + swoopX * dt;
                this.y += Math.sin(angle) * this.speed * dt;
                this.angle = angle;
                break;

            case 'teleporter':
                this.speed = 40;
                this.moveToward(playerX, playerY, dt);
                if (Math.random() < 0.01) {
                    const teleAngle = Utils.random(0, Math.PI * 2);
                    this.x = playerX + Math.cos(teleAngle) * 200;
                    this.y = playerY + Math.sin(teleAngle) * 200;
                    Audio.playTeleport();
                    Particles.deathBurst(this.x, this.y, this.color, 10);
                }
                break;

            case 'tank':
                this.speed = 30;
                this.moveToward(playerX, playerY, dt);
                break;
        }

        // Spawn random zombies
        if (this.spawnTimer >= 3) {
            this.spawnTimer = 0;
            const types = ['walker', 'runner', 'flying', 'berserker', 'jumper'];
            for (let i = 0; i < 2 + this.phase; i++) {
                this.spawnMinion(Utils.randomChoice(types));
            }
        }

        this.x = Utils.clamp(this.x, this.radius, GAME_WIDTH - this.radius);
        this.y = Utils.clamp(this.y, this.radius, GAME_HEIGHT - this.radius);
    }

    moveToward(playerX, playerY, dt) {
        const angle = Utils.angle(this.x, this.y, playerX, playerY);
        this.angle = angle;
        this.x += Math.cos(angle) * this.speed * dt;
        this.y += Math.sin(angle) * this.speed * dt;
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.morphing) {
            // Morphing effect
            ctx.rotate(this.morphProgress * Math.PI * 2);
            const scale = 1 + Math.sin(this.morphProgress * Math.PI) * 0.3;
            ctx.scale(scale, scale);
        } else {
            ctx.rotate(this.angle);
        }

        // Rainbow shifting color
        const hue = (Date.now() / 20) % 360;
        const formColor = `hsl(${hue}, 100%, 50%)`;

        // Chaotic aura
        ctx.strokeStyle = formColor;
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
            const r = this.radius + 10 + i * 5;
            ctx.globalAlpha = 0.3 - i * 0.05;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Body changes based on form
        ctx.fillStyle = this.color;

        const form = this.forms[this.currentForm];
        switch (form) {
            case 'berserker':
                ctx.beginPath();
                ctx.moveTo(this.radius, 0);
                ctx.lineTo(-this.radius, -this.radius * 0.8);
                ctx.lineTo(-this.radius * 0.5, 0);
                ctx.lineTo(-this.radius, this.radius * 0.8);
                ctx.closePath();
                ctx.fill();
                break;

            case 'flyer':
                ctx.beginPath();
                ctx.ellipse(0, 0, this.radius, this.radius * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                // Wings
                ctx.fillStyle = this.darkenColor(this.color);
                ctx.beginPath();
                ctx.moveTo(-10, 0);
                ctx.lineTo(-40, -30);
                ctx.lineTo(-20, 0);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-10, 0);
                ctx.lineTo(-40, 30);
                ctx.lineTo(-20, 0);
                ctx.closePath();
                ctx.fill();
                break;

            case 'teleporter':
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                break;

            case 'tank':
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 8;
                ctx.stroke();
                break;
        }

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(15, -8, 6, 0, Math.PI * 2);
        ctx.arc(15, 8, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    darkenColor(color) {
        return '#8B0050';
    }
}

// Level 10 Boss: The Omega Zombie - Ultimate boss with all abilities
class OmegaZombie extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'THE OMEGA ZOMBIE';
        this.health = 200;
        this.maxHealth = 200;
        this.radius = 70;
        this.hitRadius = 65;
        this.speed = 60;
        this.color = Colors.bosses.omega;
        this.points = 5000;

        // Multiple abilities
        this.chargeState = 'idle';
        this.chargeTimer = 0;
        this.chargeAngle = 0;

        this.teleportCooldown = 0;
        this.altitude = 0;
        this.isFlying = false;

        this.shockwaveCooldown = 0;
        this.splitCount = 0;

        this.abilityRotation = 0;
        this.currentAbility = 'charge';
        this.abilities = ['charge', 'fly', 'teleport', 'shockwave', 'swarm'];
        this.abilityTimer = 0;
        this.abilityDuration = 6;

        this.pulsePhase = 0;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);

        this.pulsePhase += dt * 2;
        this.abilityTimer += dt;

        // Rotate abilities
        if (this.abilityTimer >= this.abilityDuration - this.phase) {
            this.abilityTimer = 0;
            this.abilityRotation = (this.abilityRotation + 1) % this.abilities.length;
            this.currentAbility = this.abilities[this.abilityRotation];
            this.chargeState = 'idle';
            this.isFlying = false;
            this.altitude = 0;
            Effects.addText(this.x, this.y - 80, this.currentAbility.toUpperCase() + '!', '#FFD700', 1.5, 24);
        }

        // Execute current ability
        switch (this.currentAbility) {
            case 'charge':
                this.doCharge(dt, playerX, playerY);
                break;
            case 'fly':
                this.doFly(dt, playerX, playerY);
                break;
            case 'teleport':
                this.doTeleport(dt, playerX, playerY);
                break;
            case 'shockwave':
                this.doShockwave(dt, playerX, playerY);
                break;
            case 'swarm':
                this.doSwarm(dt, playerX, playerY);
                break;
        }

        this.x = Utils.clamp(this.x, this.radius, GAME_WIDTH - this.radius);
        this.y = Utils.clamp(this.y, this.radius, GAME_HEIGHT - this.radius);
    }

    doCharge(dt, playerX, playerY) {
        this.chargeTimer += dt;

        switch (this.chargeState) {
            case 'idle':
                this.moveToward(playerX, playerY, dt, 50);
                if (Utils.distance(this.x, this.y, playerX, playerY) < 400) {
                    this.chargeState = 'windup';
                    this.chargeTimer = 0;
                    this.chargeAngle = Utils.angle(this.x, this.y, playerX, playerY);
                }
                break;

            case 'windup':
                this.angle = Utils.angle(this.x, this.y, playerX, playerY);
                if (this.chargeTimer > 0.6) {
                    this.chargeState = 'charging';
                    this.chargeTimer = 0;
                }
                break;

            case 'charging':
                this.x += Math.cos(this.chargeAngle) * 450 * dt;
                this.y += Math.sin(this.chargeAngle) * 450 * dt;
                Particles.trail(this.x, this.y, this.color, 10);

                if (this.chargeTimer > 0.7) {
                    this.chargeState = 'idle';
                    Utils.screenShake.shake(10, 0.2);
                }
                break;
        }
    }

    doFly(dt, playerX, playerY) {
        this.isFlying = true;
        this.altitude = 80;

        const angle = Utils.angle(this.x, this.y, playerX, playerY);
        this.angle = angle;

        // Swoop pattern
        const swoopX = Math.sin(this.stateTimer * 3) * 150 * dt;
        this.x += Math.cos(angle) * 120 * dt + swoopX;
        this.y += Math.sin(angle) * 120 * dt;
    }

    doTeleport(dt, playerX, playerY) {
        this.teleportCooldown -= dt;

        this.moveToward(playerX, playerY, dt, 40);

        if (this.teleportCooldown <= 0) {
            this.teleportCooldown = 2;
            const angle = Utils.random(0, Math.PI * 2);
            const dist = Utils.random(100, 250);
            this.x = playerX + Math.cos(angle) * dist;
            this.y = playerY + Math.sin(angle) * dist;
            this.x = Utils.clamp(this.x, this.radius, GAME_WIDTH - this.radius);
            this.y = Utils.clamp(this.y, this.radius, GAME_HEIGHT - this.radius);
            Audio.playTeleport();
            Particles.deathBurst(this.x, this.y, this.color, 20);
        }
    }

    doShockwave(dt, playerX, playerY) {
        this.shockwaveCooldown -= dt;
        this.moveToward(playerX, playerY, dt, 70);

        if (this.shockwaveCooldown <= 0) {
            this.shockwaveCooldown = 2.5;
            Effects.addShockwave(this.x, this.y, 350, 0.6, 'rgba(255, 215, 0, 0.5)');
            Audio.playShockwave();
            Utils.screenShake.shake(15, 0.4);
        }
    }

    doSwarm(dt, playerX, playerY) {
        this.moveToward(playerX, playerY, dt, 50);

        if (this.spawnTimer >= 1) {
            this.spawnTimer = 0;
            const types = ['walker', 'runner', 'flying', 'berserker', 'jumper', 'teleporter'];
            for (let i = 0; i < 3 + this.phase; i++) {
                this.spawnMinion(Utils.randomChoice(types));
            }
        }
    }

    moveToward(playerX, playerY, dt, speed) {
        const angle = Utils.angle(this.x, this.y, playerX, playerY);
        this.angle = angle;
        this.x += Math.cos(angle) * speed * dt;
        this.y += Math.sin(angle) * speed * dt;
    }

    getShockwaveKnockback(playerX, playerY) {
        if (this.currentAbility === 'shockwave' && this.shockwaveCooldown > 1.5) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 350) {
                const angle = Utils.angle(this.x, this.y, playerX, playerY);
                const force = (1 - dist / 350) * 600;
                return { angle, force };
            }
        }
        return null;
    }

    takeDamage(amount) {
        const result = super.takeDamage(amount);

        // Split minions occasionally when damaged
        if (!result && this.splitCount < 10 && Math.random() < 0.15) {
            this.splitCount++;
            this.spawnMinion(Utils.randomChoice(['walker', 'runner', 'flying']));
        }

        return result;
    }

    draw(ctx) {
        if (!this.alive) return;

        const yOffset = this.isFlying ? -this.altitude : 0;
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.05;

        ctx.save();
        ctx.translate(this.x, this.y + yOffset);
        ctx.rotate(this.angle);
        ctx.scale(pulse, pulse);

        // Glowing aura
        const gradient = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, this.radius * 1.5);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Main body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 5;
        ctx.stroke();

        // Crown/horns
        ctx.fillStyle = '#B8860B';
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 15 - 5, -this.radius);
            ctx.lineTo(i * 15, -this.radius - 25 - Math.abs(i) * 5);
            ctx.lineTo(i * 15 + 5, -this.radius);
            ctx.closePath();
            ctx.fill();
        }

        // Multiple glowing eyes
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;

        const eyePositions = [
            { x: 30, y: -20 }, { x: 35, y: 0 }, { x: 30, y: 20 },
            { x: 20, y: -10 }, { x: 20, y: 10 }
        ];
        for (const eye of eyePositions) {
            ctx.beginPath();
            ctx.arc(eye.x, eye.y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Ability indicator
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.rotate(-this.angle); // Unrotate for text
        ctx.fillText(this.currentAbility.toUpperCase(), 0, 5);

        ctx.restore();

        // Shadow when flying
        if (this.isFlying) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + 30, this.radius * 0.7, this.radius * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    checkCollision(playerX, playerY, playerRadius) {
        const yOffset = this.isFlying ? -this.altitude * 0.5 : 0;
        return Utils.circleCollision(
            this.x, this.y + yOffset, this.hitRadius,
            playerX, playerY, playerRadius
        );
    }
}

// Boss Manager
class BossManager {
    constructor() {
        this.boss = null;
        this.bossTypes = {
            1: BigBernie,
            2: SprintSally,
            3: SkyReaper,
            4: RageKing,
            5: MonsterTruckMike,
            6: ChopperCommander,
            7: HordeMaster,
            8: TacticalNightmare,
            9: ChaosIncarnate,
            10: OmegaZombie
        };
    }

    spawn(level, playerX, playerY) {
        const BossClass = this.bossTypes[level];
        if (!BossClass) return null;

        // Spawn boss at edge of screen
        const pos = Utils.getSpawnPosition(100);
        this.boss = new BossClass(pos.x, pos.y);

        Audio.playBossSpawn();
        Effects.addText(GAME_WIDTH / 2, 100, this.boss.name, '#ff4444', 2, 36);
        Utils.screenShake.shake(10, 0.5);

        return this.boss;
    }

    update(dt, playerX, playerY) {
        if (!this.boss || !this.boss.alive) return;

        this.boss.update(dt, playerX, playerY);
    }

    draw(ctx) {
        if (!this.boss || !this.boss.alive) return;

        this.boss.draw(ctx);
    }

    checkBulletCollisions(bulletManager) {
        if (!this.boss || !this.boss.alive) return null;

        const active = bulletManager.getActive();
        for (let i = active.length - 1; i >= 0; i--) {
            const bullet = active[i];
            if (!bullet.active) continue;

            if (Utils.circleCollision(
                bullet.x, bullet.y, bullet.radius,
                this.boss.x, this.boss.y, this.boss.hitRadius
            )) {
                Particles.sparks(bullet.x, bullet.y, bullet.angle, 8);
                bullet.active = false;

                if (this.boss.takeDamage(bullet.damage)) {
                    const result = {
                        points: this.boss.points,
                        name: this.boss.name
                    };
                    this.boss = null;
                    return result;
                }
            }
        }
        return null;
    }

    checkPlayerCollision(playerX, playerY, playerRadius) {
        if (!this.boss || !this.boss.alive) return false;
        return this.boss.checkCollision(playerX, playerY, playerRadius);
    }

    getMinionsToSpawn() {
        if (!this.boss || !this.boss.alive) return [];
        return this.boss.getMinionsToSpawn();
    }

    getShockwaveKnockback(playerX, playerY) {
        if (!this.boss || !this.boss.alive) return null;
        if (typeof this.boss.getShockwaveKnockback === 'function') {
            return this.boss.getShockwaveKnockback(playerX, playerY);
        }
        return null;
    }

    isAlive() {
        return this.boss && this.boss.alive;
    }

    getBoss() {
        return this.boss;
    }

    clear() {
        this.boss = null;
    }
}
