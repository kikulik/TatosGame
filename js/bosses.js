// Boss Classes for Zombie Apocalypse Game - Enhanced Boss Fights

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
        this.spawnTimer = 0;
        this.spawnCooldown = 5;
        this.minionsToSpawn = [];
        this.phaseSpeedMult = 1;
        this.phaseDamageMult = 1;
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
        if (this.health <= this.maxHealth * 0.66 && this.phase === 1) {
            this.phase = 2;
            this.phaseSpeedMult = 1.2;
            this.onPhaseChange(2);
        } else if (this.health <= this.maxHealth * 0.33 && this.phase === 2) {
            this.phase = 3;
            this.phaseSpeedMult = 1.5;
            this.onPhaseChange(3);
        }
        if (this.health <= 0) {
            this.die();
            return true;
        }
        Effects.addFlash(0.05, 'rgba(255, 255, 255, 0.2)');
        Utils.screenShake.shake(5, 0.1);
        return false;
    }

    onPhaseChange(phase) {
        const phaseText = phase === 2 ? 'PHASE 2 - ENRAGED!' : 'PHASE 3 - BERSERK!';
        const color = phase === 2 ? '#ff8800' : '#ff0000';
        Effects.addText(this.x, this.y - 60, phaseText, color, 2, 28);
        Effects.addShockwave(this.x, this.y, 250, 0.5, `rgba(255, ${phase === 2 ? '136' : '0'}, 0, 0.6)`);
        Effects.addFlash(0.3, `rgba(255, ${phase === 2 ? '136' : '0'}, 0, 0.4)`);
        Utils.screenShake.shake(15, 0.5);
        Particles.explosion(this.x, this.y, 30, 2);
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
    }

    drawHealthBar(ctx) {}

    checkCollision(playerX, playerY, playerRadius) {
        return Utils.circleCollision(this.x, this.y, this.hitRadius, playerX, playerY, playerRadius);
    }

    clampToBounds() {
        this.x = Utils.clamp(this.x, this.radius, GAME_WIDTH - this.radius);
        this.y = Utils.clamp(this.y, this.radius, GAME_HEIGHT - this.radius);
    }

    moveToward(px, py, dt, spd) {
        const a = Utils.angle(this.x, this.y, px, py);
        this.angle = a;
        const s = (spd || this.speed) * this.phaseSpeedMult;
        this.x += Math.cos(a) * s * dt;
        this.y += Math.sin(a) * s * dt;
    }
}

// ==================== LEVEL 1: BIG BERNIE ====================
class BigBernie extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'BIG BERNIE';
        this.health = 113;
        this.maxHealth = 113;
        this.radius = 50;
        this.hitRadius = 50;
        this.speed = 40;
        this.color = Colors.bosses.bigBernie;
        this.points = 500;
        this.spawnCooldown = 6;
        this.lastHealth = this.health;
        // Ground Pound
        this.groundPoundCooldown = 0;
        this.isGroundPounding = false;
        this.groundPoundTimer = 0;
        // Belly Flop charge
        this.bellyFlopCooldown = 0;
        this.isBellyFlopping = false;
        this.bellyFlopTimer = 0;
        this.bellyFlopAngle = 0;
        // Stomp Wave
        this.stompWaveCooldown = 0;
        // Enrage
        this.isEnraged = false;
        this.enrageTimer = 0;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);
        this.groundPoundCooldown -= dt;
        this.bellyFlopCooldown -= dt;
        this.stompWaveCooldown -= dt;

        // Enrage in phase 3
        if (this.phase >= 3 && !this.isEnraged && this.enrageTimer <= 0) {
            if (Math.random() < 0.008) {
                this.isEnraged = true;
                this.enrageTimer = 4;
                Effects.addText(this.x, this.y - 60, 'ENRAGED!', '#ff0000', 1.5, 22);
            }
        }
        if (this.isEnraged) {
            this.enrageTimer -= dt;
            if (this.enrageTimer <= 0) { this.isEnraged = false; this.enrageTimer = 8; }
        }

        // Belly Flop - short charge + AOE (phase 1+)
        if (!this.isBellyFlopping && !this.isGroundPounding && this.bellyFlopCooldown <= 0) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 300 && dist > 80) {
                this.isBellyFlopping = true;
                this.bellyFlopTimer = 0;
                this.bellyFlopAngle = Utils.angle(this.x, this.y, playerX, playerY);
                this.bellyFlopCooldown = 6 - this.phase;
                Effects.addText(this.x, this.y - 40, 'BELLY FLOP!', '#8B4513', 0.8, 16);
            }
        }
        if (this.isBellyFlopping) {
            this.bellyFlopTimer += dt;
            if (this.bellyFlopTimer < 0.4) {
                const spd = 350 * this.phaseSpeedMult;
                this.x += Math.cos(this.bellyFlopAngle) * spd * dt;
                this.y += Math.sin(this.bellyFlopAngle) * spd * dt;
                Particles.trail(this.x, this.y, this.color, 6);
            } else if (this.bellyFlopTimer < 0.5) {
                if (this.bellyFlopTimer - dt < 0.4) {
                    Effects.addShockwave(this.x, this.y, 120, 0.3, 'rgba(139, 69, 19, 0.5)');
                    Utils.screenShake.shake(8, 0.2);
                }
            } else {
                this.isBellyFlopping = false;
            }
            this.clampToBounds();
            return;
        }

        // Ground Pound - AOE slam (phase 2+)
        if (this.phase >= 2 && !this.isGroundPounding && this.groundPoundCooldown <= 0) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 180) {
                this.isGroundPounding = true;
                this.groundPoundTimer = 0;
                this.groundPoundCooldown = 5 - this.phase;
            }
        }
        if (this.isGroundPounding) {
            this.groundPoundTimer += dt;
            if (this.groundPoundTimer > 0.5) {
                Effects.addShockwave(this.x, this.y, 220, 0.4, 'rgba(139, 69, 19, 0.6)');
                Utils.screenShake.shake(12, 0.3);
                for (let i = 0; i < this.phase; i++) this.spawnMinion('walker');
                this.isGroundPounding = false;
            }
            return;
        }

        // Stomp Wave - directional shockwave (phase 2+)
        if (this.phase >= 2 && this.stompWaveCooldown <= 0) {
            if (Math.random() < 0.01) {
                this.stompWaveCooldown = 4;
                for (let i = 0; i < 3; i++) {
                    const delay = i * 150;
                    setTimeout(() => {
                        if (!this.alive) return;
                        const dist = 80 + i * 60;
                        const wx = this.x + Math.cos(this.angle) * dist;
                        const wy = this.y + Math.sin(this.angle) * dist;
                        Effects.addShockwave(wx, wy, 60, 0.3, 'rgba(139, 69, 19, 0.4)');
                    }, delay);
                }
                Utils.screenShake.shake(6, 0.4);
            }
        }

        // Normal movement
        const spd = this.isEnraged ? this.speed * 2.5 : this.speed;
        const angle = Utils.angle(this.x, this.y, playerX, playerY);
        this.x += Math.cos(angle) * spd * this.phaseSpeedMult * dt;
        this.y += Math.sin(angle) * spd * this.phaseSpeedMult * dt;

        // Spawn on damage
        if (this.health < this.lastHealth && Math.random() < 0.3) {
            this.spawnMinion('walker');
        }
        this.lastHealth = this.health;

        // Periodic spawns
        if (this.spawnTimer >= this.spawnCooldown) {
            this.spawnTimer = 0;
            this.spawnMinion('walker');
            if (this.phase >= 2) this.spawnMinion('walker');
        }
        this.clampToBounds();
    }

    getShockwaveKnockback(playerX, playerY) {
        if (this.isGroundPounding && this.groundPoundTimer > 0.4) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 220) return { angle: Utils.angle(this.x, this.y, playerX, playerY), force: (1 - dist / 220) * 350 };
        }
        if (this.isBellyFlopping && this.bellyFlopTimer >= 0.4 && this.bellyFlopTimer < 0.5) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 120) return { angle: Utils.angle(this.x, this.y, playerX, playerY), force: (1 - dist / 120) * 250 };
        }
        return null;
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Enrage aura
        if (this.isEnraged) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 15 + Math.sin(this.stateTimer * 10) * 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = this.isEnraged ? '#8B0000' : this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3d2817';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#5a3d2b';
        ctx.beginPath();
        ctx.ellipse(0, this.radius * 0.3, this.radius * 0.8, this.radius * 0.3, 0, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = this.isEnraged ? '#ffff00' : '#ff0000';
        ctx.beginPath();
        ctx.arc(20, -15, 8, 0, Math.PI * 2);
        ctx.arc(20, 15, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#2d1810';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(25, 0, 15, -0.5, 0.5);
        ctx.stroke();

        ctx.restore();
    }
}

// ==================== LEVEL 2: SPRINT SALLY ====================
class SprintSally extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'SPRINT SALLY';
        this.health = 75;
        this.maxHealth = 75;
        this.radius = 25;
        this.hitRadius = 25;
        this.speed = 170;
        this.color = Colors.bosses.sprintSally;
        this.points = 600;
        this.circleAngle = 0;
        this.circleRadius = 200;
        this.circleSpeed = 2.0;
        // Speed Dash
        this.dashCooldown = 0;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashAngle = 0;
        this.afterImages = [];
        // Tornado Spin
        this.tornadoCooldown = 0;
        this.isSpinning = false;
        this.spinTimer = 0;
        // Multi-Dash
        this.multiDashCount = 0;
        this.multiDashCooldown = 0;
        // Clone Trail
        this.trailDamageCooldown = 0;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);
        this.dashCooldown -= dt;
        this.tornadoCooldown -= dt;
        this.multiDashCooldown -= dt;
        this.trailDamageCooldown -= dt;

        this.afterImages = this.afterImages.filter(img => { img.alpha -= dt * 3; return img.alpha > 0; });

        // Tornado Spin (phase 1+) - spins in place creating ring
        if (!this.isDashing && !this.isSpinning && this.tornadoCooldown <= 0 && Math.random() < 0.008) {
            this.isSpinning = true;
            this.spinTimer = 0;
            this.tornadoCooldown = 7 - this.phase;
            Effects.addText(this.x, this.y - 30, 'TORNADO!', '#32CD32', 1, 18);
        }
        if (this.isSpinning) {
            this.spinTimer += dt;
            this.angle += dt * 20;
            const ringRadius = this.spinTimer * 150;
            if (Math.random() < 0.3) Particles.trail(this.x + Math.cos(this.angle) * ringRadius * 0.3, this.y + Math.sin(this.angle) * ringRadius * 0.3, '#00ff00', 4);
            Effects.addShockwave(this.x, this.y, ringRadius, 0.15, 'rgba(50, 205, 50, 0.3)');
            if (this.spinTimer > 1.5) this.isSpinning = false;
            this.clampToBounds();
            return;
        }

        // Speed Dash (phase 2+)
        if (this.phase >= 2 && !this.isDashing && this.dashCooldown <= 0 && Math.random() < 0.015) {
            this.isDashing = true;
            this.dashTimer = 0;
            this.dashAngle = Utils.angle(this.x, this.y, playerX, playerY);
            this.dashCooldown = 3 - this.phase * 0.3;
            this.multiDashCount = this.phase >= 3 ? 3 : 1;
        }
        if (this.isDashing) {
            this.dashTimer += dt;
            if (Math.random() < 0.5) this.afterImages.push({ x: this.x, y: this.y, angle: this.angle, alpha: 0.7 });
            this.x += Math.cos(this.dashAngle) * 500 * dt;
            this.y += Math.sin(this.dashAngle) * 500 * dt;
            this.angle = this.dashAngle;
            Particles.trail(this.x, this.y, '#32CD32', 4);
            if (this.dashTimer > 0.35) {
                this.multiDashCount--;
                if (this.multiDashCount > 0) {
                    this.dashTimer = 0;
                    this.dashAngle = Utils.angle(this.x, this.y, playerX, playerY);
                } else {
                    this.isDashing = false;
                }
            }
            this.clampToBounds();
            return;
        }

        // Circle around player
        this.circleSpeed = (2.0 + this.phase * 0.6) * this.phaseSpeedMult;
        this.circleAngle += this.circleSpeed * dt;
        if (this.phase >= 2) this.circleRadius = 150 + Math.sin(this.stateTimer * 2) * 50;

        const targetX = playerX + Math.cos(this.circleAngle) * this.circleRadius;
        const targetY = playerY + Math.sin(this.circleAngle) * this.circleRadius;
        const dx = targetX - this.x, dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
            this.x += (dx / dist) * this.speed * this.phaseSpeedMult * dt;
            this.y += (dy / dist) * this.speed * this.phaseSpeedMult * dt;
        }
        this.angle = this.circleAngle + Math.PI / 2;
        this.clampToBounds();
    }

    getShockwaveKnockback(playerX, playerY) {
        if (this.isSpinning) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            const ringR = this.spinTimer * 150;
            if (Math.abs(dist - ringR) < 40) return { angle: Utils.angle(this.x, this.y, playerX, playerY), force: 200 };
        }
        return null;
    }

    draw(ctx) {
        if (!this.alive) return;
        for (const img of this.afterImages) {
            ctx.save();
            ctx.globalAlpha = img.alpha * 0.5;
            ctx.translate(img.x, img.y);
            ctx.rotate(img.angle);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.isSpinning) {
            ctx.strokeStyle = 'rgba(50, 255, 50, 0.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 20, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.strokeStyle = this.isDashing ? 'rgba(50, 255, 50, 0.8)' : 'rgba(50, 205, 50, 0.5)';
        ctx.lineWidth = this.isDashing ? 4 : 2;
        const lineCount = this.isDashing ? 6 : 3;
        for (let i = 0; i < lineCount; i++) {
            ctx.beginPath();
            ctx.moveTo(-this.radius - 10 - i * 10, Utils.random(-5, 5));
            ctx.lineTo(-this.radius - 30 - i * 10, Utils.random(-5, 5));
            ctx.stroke();
        }
        ctx.fillStyle = this.isDashing ? '#00ff00' : this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(-10, -this.radius * 0.5 + i * 5);
            ctx.quadraticCurveTo(-25, -this.radius * 0.5 + i * 5, -35, -this.radius * 0.3 + i * 5);
            ctx.lineTo(-30, -this.radius * 0.4 + i * 5);
            ctx.closePath();
            ctx.fill();
        }
        ctx.fillStyle = this.isDashing ? '#00ff00' : '#ffff00';
        if (this.isDashing) { ctx.shadowColor = '#00ff00'; ctx.shadowBlur = 10; }
        ctx.beginPath();
        ctx.arc(10, -5, 4, 0, Math.PI * 2);
        ctx.arc(10, 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// ==================== LEVEL 3: SKY REAPER ====================
class SkyReaper extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'SKY REAPER';
        this.health = 150;
        this.maxHealth = 150;
        this.radius = 40;
        this.hitRadius = 35;
        this.speed = 120;
        this.color = Colors.bosses.skyReaper;
        this.points = 750;
        this.altitude = 60;
        this.wingPhase = 0;
        this.spawnCooldown = 4;
        // Dive Bomb
        this.diveBombCooldown = 0;
        this.isDiving = false;
        this.diveTimer = 0;
        this.diveTargetX = 0; this.diveTargetY = 0;
        this.diveStartX = 0; this.diveStartY = 0;
        // Wing Gust - knockback wind
        this.gustCooldown = 0;
        this.isGusting = false;
        this.gustTimer = 0;
        // Feather Barrage - spawn flying in a pattern
        this.barrageCooldown = 0;
        // Shadow Dive - instant teleport + dive
        this.shadowDiveCooldown = 0;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);
        this.wingPhase += dt * 5;
        this.diveBombCooldown -= dt;
        this.gustCooldown -= dt;
        this.barrageCooldown -= dt;
        this.shadowDiveCooldown -= dt;

        // Wing Gust (phase 1+) - knockback wind blast
        if (!this.isDiving && !this.isGusting && this.gustCooldown <= 0 && Math.random() < 0.01) {
            this.isGusting = true;
            this.gustTimer = 0;
            this.gustCooldown = 5;
            Effects.addText(this.x, this.y - this.altitude - 20, 'WING GUST!', '#4444ff', 0.8, 16);
        }
        if (this.isGusting) {
            this.gustTimer += dt;
            if (this.gustTimer < 0.3) {
                Particles.smoke(this.x, this.y - this.altitude, 4);
            } else if (this.gustTimer < 0.5) {
                if (this.gustTimer - dt < 0.3) {
                    Effects.addShockwave(this.x, this.y, 250, 0.5, 'rgba(100, 100, 255, 0.4)');
                    Utils.screenShake.shake(8, 0.2);
                }
            } else {
                this.isGusting = false;
            }
        }

        // Feather Barrage (phase 2+) - spawn ring of flying zombies
        if (this.phase >= 2 && this.barrageCooldown <= 0 && Math.random() < 0.006) {
            this.barrageCooldown = 8 - this.phase;
            const count = 2 + this.phase;
            Effects.addText(this.x, this.y - this.altitude - 20, 'FEATHER BARRAGE!', '#ff4444', 1, 16);
            for (let i = 0; i < count; i++) {
                const a = (i / count) * Math.PI * 2;
                this.minionsToSpawn.push({ type: 'flying', x: this.x + Math.cos(a) * 80, y: this.y + Math.sin(a) * 80 });
            }
        }

        // Shadow Dive (phase 3) - teleport near player then instant dive
        if (this.phase >= 3 && !this.isDiving && this.shadowDiveCooldown <= 0 && Math.random() < 0.008) {
            this.shadowDiveCooldown = 6;
            const a = Utils.random(0, Math.PI * 2);
            this.x = playerX + Math.cos(a) * 200;
            this.y = playerY + Math.sin(a) * 200;
            this.clampToBounds();
            Particles.deathBurst(this.x, this.y, '#191970', 15);
            Effects.addText(this.x, this.y - this.altitude - 20, 'SHADOW DIVE!', '#ff0000', 1, 18);
            this.isDiving = true;
            this.diveTimer = 0;
            this.diveTargetX = playerX;
            this.diveTargetY = playerY;
            this.diveStartX = this.x;
            this.diveStartY = this.y;
        }

        // Dive bomb (phase 2+)
        if (this.phase >= 2 && !this.isDiving && this.diveBombCooldown <= 0 && Math.random() < 0.015) {
            this.isDiving = true;
            this.diveTimer = 0;
            this.diveTargetX = playerX;
            this.diveTargetY = playerY;
            this.diveStartX = this.x;
            this.diveStartY = this.y;
            this.diveBombCooldown = 5 - this.phase;
        }
        if (this.isDiving) {
            this.diveTimer += dt;
            const diveDuration = 0.7;
            if (this.diveTimer < diveDuration) {
                const p = this.diveTimer / diveDuration;
                this.x = Utils.lerp(this.diveStartX, this.diveTargetX, p);
                this.y = Utils.lerp(this.diveStartY, this.diveTargetY, p);
                this.altitude = Utils.lerp(60, 10, p);
                Particles.trail(this.x, this.y - this.altitude, '#ff0000', 5);
            } else if (this.diveTimer < diveDuration + 0.3) {
                if (this.diveTimer - dt < diveDuration) {
                    Effects.addShockwave(this.x, this.y, 150, 0.3, 'rgba(255, 0, 0, 0.5)');
                    Utils.screenShake.shake(10, 0.3);
                    this.spawnMinion('flying');
                    if (this.phase >= 3) this.spawnMinion('diveBomber');
                }
                this.altitude = 10;
            } else if (this.diveTimer < diveDuration + 1.2) {
                this.altitude = Utils.lerp(10, 60, (this.diveTimer - diveDuration - 0.3) / 0.9);
            } else {
                this.isDiving = false;
                this.altitude = 60;
            }
            this.clampToBounds();
            return;
        }

        // Swoop pattern
        const targetDist = 250 - this.phase * 30;
        const currentDist = Utils.distance(this.x, this.y, playerX, playerY);
        if (currentDist > targetDist + 50) {
            const a = Utils.angle(this.x, this.y, playerX, playerY);
            this.x += Math.cos(a) * this.speed * this.phaseSpeedMult * dt;
            this.y += Math.sin(a) * this.speed * this.phaseSpeedMult * dt;
        } else if (currentDist < targetDist - 50) {
            const a = Utils.angle(this.x, this.y, playerX, playerY);
            this.x -= Math.cos(a) * this.speed * 0.5 * dt;
            this.y -= Math.sin(a) * this.speed * 0.5 * dt;
        }
        const perpAngle = this.angle + Math.PI / 2;
        this.x += Math.cos(perpAngle) * this.speed * 0.7 * dt;
        this.y += Math.sin(perpAngle) * this.speed * 0.7 * dt;

        if (this.spawnTimer >= this.spawnCooldown) {
            this.spawnTimer = 0;
            this.spawnMinion('flying');
        }
        this.clampToBounds();
    }

    getShockwaveKnockback(playerX, playerY) {
        if (this.isDiving && this.diveTimer > 0.7 && this.diveTimer < 0.9) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 150) return { angle: Utils.angle(this.x, this.y, playerX, playerY), force: (1 - dist / 150) * 400 };
        }
        if (this.isGusting && this.gustTimer >= 0.3 && this.gustTimer < 0.5) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 250) return { angle: Utils.angle(this.x, this.y, playerX, playerY), force: (1 - dist / 250) * 500 };
        }
        return null;
    }

    draw(ctx) {
        if (!this.alive) return;
        const wingAngle = Math.sin(this.wingPhase) * 0.4;
        ctx.save();
        ctx.translate(this.x, this.y - this.altitude);
        ctx.rotate(this.angle);
        ctx.save(); ctx.rotate(wingAngle);
        ctx.fillStyle = '#0f0f3d';
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-60, -40); ctx.lineTo(-50, -10); ctx.lineTo(-30, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.rotate(-wingAngle);
        ctx.fillStyle = '#0f0f3d';
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-60, 40); ctx.lineTo(-50, 10); ctx.lineTo(-30, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.ellipse(0, 0, this.radius, this.radius * 0.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1a4d';
        ctx.beginPath(); ctx.arc(15, 0, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff0000'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(20, -6, 4, 0, Math.PI * 2); ctx.arc(20, 6, 4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
        ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(this.x, this.y + 20, this.radius * 0.8, this.radius * 0.3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    checkCollision(playerX, playerY, playerRadius) {
        return Utils.circleCollision(this.x, this.y - this.altitude * 0.5, this.hitRadius, playerX, playerY, playerRadius);
    }
}

// ==================== LEVEL 4: RAGE KING ====================
class RageKing extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'RAGE KING';
        this.health = 225;
        this.maxHealth = 225;
        this.radius = 55;
        this.hitRadius = 50;
        this.speed = 48;
        this.chargeSpeed = 500;
        this.color = Colors.bosses.rageKing;
        this.points = 900;
        this.state = 'approach';
        this.chargeAngle = 0;
        this.shockwaveCooldown = 0;
        // Fist Slam - targeted AOE
        this.fistSlamCooldown = 0;
        this.isFistSlamming = false;
        this.fistSlamTimer = 0;
        this.fistSlamX = 0; this.fistSlamY = 0;
        // War Cry
        this.warCryCooldown = 0;
        // Triple Charge (phase 3)
        this.chargeCount = 0;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);
        this.shockwaveCooldown -= dt;
        this.fistSlamCooldown -= dt;
        this.warCryCooldown -= dt;

        // War Cry (phase 2+) - expanding shockwave
        if (this.phase >= 2 && this.warCryCooldown <= 0 && this.state === 'approach' && Math.random() < 0.008) {
            this.warCryCooldown = 8 - this.phase;
            Effects.addText(this.x, this.y - 70, 'WAR CRY!', '#ffff00', 1.5, 24);
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (!this.alive) return;
                    Effects.addShockwave(this.x, this.y, 200 + i * 80, 0.4, 'rgba(255, 255, 0, 0.3)');
                }, i * 200);
            }
            Utils.screenShake.shake(12, 0.6);
        }

        // Fist Slam (phase 1+) - targets player position with AOE
        if (this.state === 'approach' && !this.isFistSlamming && this.fistSlamCooldown <= 0) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 200) {
                this.isFistSlamming = true;
                this.fistSlamTimer = 0;
                this.fistSlamX = playerX;
                this.fistSlamY = playerY;
                this.fistSlamCooldown = 4 - this.phase * 0.5;
            }
        }
        if (this.isFistSlamming) {
            this.fistSlamTimer += dt;
            if (this.fistSlamTimer < 0.5) {
                // Telegraphing
            } else if (this.fistSlamTimer < 0.6) {
                if (this.fistSlamTimer - dt < 0.5) {
                    Effects.addShockwave(this.fistSlamX, this.fistSlamY, 100, 0.3, 'rgba(255, 0, 0, 0.6)');
                    Utils.screenShake.shake(10, 0.2);
                }
            } else {
                this.isFistSlamming = false;
            }
            return;
        }

        switch (this.state) {
            case 'approach':
                this.moveToward(playerX, playerY, dt);
                if (Utils.distance(this.x, this.y, playerX, playerY) < 300) {
                    this.state = 'windup';
                    this.stateTimer = 0;
                    this.chargeAngle = Utils.angle(this.x, this.y, playerX, playerY);
                    this.chargeCount = this.phase >= 3 ? 3 : 1;
                }
                break;
            case 'windup':
                this.angle = Utils.angle(this.x, this.y, playerX, playerY);
                if (this.stateTimer > 0.7 - this.phase * 0.1) {
                    this.state = 'charge';
                    this.stateTimer = 0;
                    this.chargeAngle = Utils.angle(this.x, this.y, playerX, playerY);
                }
                break;
            case 'charge':
                this.x += Math.cos(this.chargeAngle) * this.chargeSpeed * this.phaseSpeedMult * dt;
                this.y += Math.sin(this.chargeAngle) * this.chargeSpeed * this.phaseSpeedMult * dt;
                Particles.trail(this.x, this.y, this.color, 8);
                if (this.stateTimer > 0.7) {
                    this.chargeCount--;
                    if (this.chargeCount > 0) {
                        this.state = 'windup';
                        this.stateTimer = 0;
                    } else {
                        this.state = 'slam';
                        this.stateTimer = 0;
                        this.createShockwave();
                    }
                }
                break;
            case 'slam':
                if (this.stateTimer > 0.8) { this.state = 'approach'; this.stateTimer = 0; }
                break;
        }
        this.clampToBounds();
    }

    createShockwave() {
        Effects.addShockwave(this.x, this.y, 300, 0.5, 'rgba(255, 0, 0, 0.5)');
        Audio.playShockwave();
        Utils.screenShake.shake(15, 0.3);
    }

    getShockwaveKnockback(playerX, playerY) {
        if (this.state === 'slam' && this.stateTimer < 0.3) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 300) return { angle: Utils.angle(this.x, this.y, playerX, playerY), force: (1 - dist / 300) * 500 };
        }
        if (this.isFistSlamming && this.fistSlamTimer >= 0.5 && this.fistSlamTimer < 0.6) {
            const dist = Utils.distance(this.fistSlamX, this.fistSlamY, playerX, playerY);
            if (dist < 100) return { angle: Utils.angle(this.fistSlamX, this.fistSlamY, playerX, playerY), force: (1 - dist / 100) * 400 };
        }
        return null;
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Fist slam telegraph
        if (this.isFistSlamming && this.fistSlamTimer < 0.5) {
            ctx.save();
            ctx.rotate(-this.angle);
            ctx.translate(this.fistSlamX - this.x, this.fistSlamY - this.y);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, 100, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        if (this.state === 'windup') {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 5;
            const pulseSize = 1 + Math.sin(this.stateTimer * 15) * 0.1;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * pulseSize + 10, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.fillStyle = this.state === 'charge' ? '#ff0000' : this.color;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(this.radius * 0.3, -this.radius);
        ctx.lineTo(-this.radius, -this.radius * 0.5);
        ctx.lineTo(-this.radius, this.radius * 0.5);
        ctx.lineTo(this.radius * 0.3, this.radius);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#8B0000'; ctx.lineWidth = 4; ctx.stroke();

        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.3, -this.radius * 0.8);
        ctx.lineTo(-this.radius * 0.1, -this.radius * 1.1);
        ctx.lineTo(0, -this.radius * 0.9);
        ctx.lineTo(this.radius * 0.1, -this.radius * 1.1);
        ctx.lineTo(this.radius * 0.3, -this.radius * 0.8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffff00'; ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(15, -15, 8, 0, Math.PI * 2);
        ctx.arc(15, 15, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// ==================== LEVEL 5: MONSTER TRUCK MIKE ====================
class MonsterTruckMike extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'MONSTER TRUCK MIKE';
        this.health = 300;
        this.maxHealth = 300;
        this.radius = 60;
        this.hitRadius = 55;
        this.speed = 72;
        this.chargeSpeed = 450;
        this.color = Colors.bosses.monsterTruck;
        this.points = 1000;
        this.state = 'patrol';
        this.wheelRotation = 0;
        this.chargeAngle = 0;
        // Drift attack
        this.driftCooldown = 0;
        this.isDrifting = false;
        this.driftTimer = 0;
        this.driftAngle = 0;
        // Ram bounce
        this.bounceCount = 0;
        // Turbo rush (phase 3)
        this.turboActive = false;
        this.turboCooldown = 0;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);
        this.wheelRotation += dt * 10;
        this.driftCooldown -= dt;
        this.turboCooldown -= dt;

        // Drift attack (phase 1+) - arc-shaped charge
        if (this.state === 'patrol' && !this.isDrifting && this.driftCooldown <= 0) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 400 && dist > 150 && Math.random() < 0.01) {
                this.isDrifting = true;
                this.driftTimer = 0;
                this.driftAngle = Utils.angle(this.x, this.y, playerX, playerY);
                this.driftCooldown = 5 - this.phase * 0.5;
                Effects.addText(this.x, this.y - 40, 'DRIFT!', '#ff8800', 0.8, 18);
            }
        }
        if (this.isDrifting) {
            this.driftTimer += dt;
            this.driftAngle += dt * 2;
            this.x += Math.cos(this.driftAngle) * this.chargeSpeed * 0.8 * dt;
            this.y += Math.sin(this.driftAngle) * this.chargeSpeed * 0.8 * dt;
            this.angle = this.driftAngle;
            Particles.trail(this.x, this.y, '#ff8800', 6);
            Particles.smoke(this.x - Math.cos(this.angle) * this.radius, this.y - Math.sin(this.angle) * this.radius, 2);
            if (this.driftTimer > 1.2) { this.isDrifting = false; this.state = 'recover'; this.stateTimer = 0; }
            this.clampToBounds();
            return;
        }

        switch (this.state) {
            case 'patrol':
                this.moveToward(playerX, playerY, dt);
                if (Utils.distance(this.x, this.y, playerX, playerY) < 350) {
                    this.state = 'rev';
                    this.stateTimer = 0;
                    this.chargeAngle = Utils.angle(this.x, this.y, playerX, playerY);
                    this.bounceCount = this.phase >= 3 ? 2 : 0;
                }
                break;
            case 'rev':
                this.angle = Utils.angle(this.x, this.y, playerX, playerY);
                Particles.smoke(this.x - Math.cos(this.angle) * this.radius, this.y - Math.sin(this.angle) * this.radius, 3);
                if (this.stateTimer > 0.8 - this.phase * 0.15) {
                    this.state = 'charge';
                    this.stateTimer = 0;
                    this.chargeAngle = Utils.angle(this.x, this.y, playerX, playerY);
                }
                break;
            case 'charge':
                const cspd = (this.turboActive ? this.chargeSpeed * 1.5 : this.chargeSpeed) * this.phaseSpeedMult;
                this.x += Math.cos(this.chargeAngle) * cspd * dt;
                this.y += Math.sin(this.chargeAngle) * cspd * dt;
                Particles.trail(this.x, this.y, '#333', 6);
                if (this.stateTimer > 1.0 ||
                    this.x < this.radius || this.x > GAME_WIDTH - this.radius ||
                    this.y < this.radius || this.y > GAME_HEIGHT - this.radius) {
                    if (this.bounceCount > 0) {
                        this.bounceCount--;
                        this.chargeAngle = Utils.angle(this.x, this.y, playerX, playerY);
                        this.stateTimer = 0;
                        Utils.screenShake.shake(8, 0.2);
                        Effects.addShockwave(this.x, this.y, 80, 0.2, 'rgba(100, 100, 100, 0.5)');
                    } else {
                        this.state = 'recover';
                        this.stateTimer = 0;
                        Utils.screenShake.shake(8, 0.2);
                    }
                }
                break;
            case 'recover':
                if (this.stateTimer > 1.2 - this.phase * 0.2) {
                    this.state = 'patrol';
                    this.stateTimer = 0;
                }
                break;
        }
        this.clampToBounds();

        // Turbo mode (phase 3)
        if (this.phase >= 3 && this.turboCooldown <= 0 && Math.random() < 0.005) {
            this.turboActive = true;
            this.turboCooldown = 10;
            Effects.addText(this.x, this.y - 50, 'TURBO!', '#ff0000', 1.5, 22);
            setTimeout(() => { this.turboActive = false; }, 4000);
        }

        if (this.spawnTimer >= 6 - this.phase) {
            this.spawnTimer = 0;
            this.spawnMinion('walker');
        }
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.turboActive) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = this.turboActive ? '#4a2020' : this.color;
        ctx.fillRect(-this.radius, -this.radius * 0.5, this.radius * 2, this.radius);
        ctx.fillStyle = '#1f3d3d';
        ctx.fillRect(this.radius * 0.2, -this.radius * 0.4, this.radius * 0.6, this.radius * 0.8);
        ctx.fillStyle = '#333';
        ctx.fillRect(this.radius * 0.5, -this.radius * 0.3, this.radius * 0.2, this.radius * 0.6);

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
            ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.stroke();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15); ctx.stroke();
            }
            ctx.restore();
        }
        ctx.fillStyle = this.state === 'rev' ? '#ffff00' : '#666';
        ctx.beginPath();
        ctx.arc(this.radius - 5, -this.radius * 0.3, 6, 0, Math.PI * 2);
        ctx.arc(this.radius - 5, this.radius * 0.3, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ==================== LEVEL 6: CHOPPER COMMANDER ====================
class ChopperCommander extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'CHOPPER COMMANDER';
        this.health = 375;
        this.maxHealth = 375;
        this.radius = 50;
        this.hitRadius = 45;
        this.speed = 144;
        this.color = Colors.bosses.chopperCommander;
        this.points = 1200;
        this.rotorAngle = 0;
        this.circleAngle = 0;
        this.circleRadius = 250;
        this.spawnCooldown = 3;
        // Missile Run - dive toward player
        this.missileRunCooldown = 0;
        this.isMissileRunning = false;
        this.missileRunTimer = 0;
        this.missileRunAngle = 0;
        // Rotor Slam - descend for AOE
        this.rotorSlamCooldown = 0;
        this.isRotorSlamming = false;
        this.rotorSlamTimer = 0;
        // Carpet Bomb - line of shockwaves
        this.carpetBombCooldown = 0;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);
        this.rotorAngle += dt * 25;
        this.missileRunCooldown -= dt;
        this.rotorSlamCooldown -= dt;
        this.carpetBombCooldown -= dt;

        // Missile Run (phase 1+) - fast dive toward player
        if (!this.isMissileRunning && !this.isRotorSlamming && this.missileRunCooldown <= 0 && Math.random() < 0.008) {
            this.isMissileRunning = true;
            this.missileRunTimer = 0;
            this.missileRunAngle = Utils.angle(this.x, this.y, playerX, playerY);
            this.missileRunCooldown = 5 - this.phase * 0.5;
            Effects.addText(this.x, this.y - 40, 'MISSILE RUN!', '#ff4444', 1, 18);
        }
        if (this.isMissileRunning) {
            this.missileRunTimer += dt;
            this.x += Math.cos(this.missileRunAngle) * 500 * this.phaseSpeedMult * dt;
            this.y += Math.sin(this.missileRunAngle) * 500 * this.phaseSpeedMult * dt;
            Particles.trail(this.x, this.y, '#ff4444', 5);
            if (this.missileRunTimer > 0.6) { this.isMissileRunning = false; }
            this.clampToBounds();
            return;
        }

        // Rotor Slam (phase 2+) - descend for close range AOE
        if (this.phase >= 2 && !this.isRotorSlamming && this.rotorSlamCooldown <= 0 && Math.random() < 0.006) {
            this.isRotorSlamming = true;
            this.rotorSlamTimer = 0;
            this.rotorSlamCooldown = 7 - this.phase;
            Effects.addText(this.x, this.y - 40, 'ROTOR SLAM!', '#ff8800', 1, 18);
        }
        if (this.isRotorSlamming) {
            this.rotorSlamTimer += dt;
            this.moveToward(playerX, playerY, dt, 200);
            if (this.rotorSlamTimer > 1.0) {
                Effects.addShockwave(this.x, this.y, 200, 0.4, 'rgba(100, 100, 150, 0.5)');
                Utils.screenShake.shake(10, 0.3);
                this.spawnMinion('diveBomber');
                this.isRotorSlamming = false;
            }
            this.clampToBounds();
            return;
        }

        // Carpet Bomb (phase 3) - line of shockwaves toward player
        if (this.phase >= 3 && this.carpetBombCooldown <= 0 && Math.random() < 0.005) {
            this.carpetBombCooldown = 8;
            const a = Utils.angle(this.x, this.y, playerX, playerY);
            Effects.addText(this.x, this.y - 40, 'CARPET BOMB!', '#ff0000', 1.5, 20);
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    if (!this.alive) return;
                    const bx = this.x + Math.cos(a) * (80 + i * 70);
                    const by = this.y + Math.sin(a) * (80 + i * 70);
                    Effects.addShockwave(bx, by, 80, 0.3, 'rgba(255, 100, 0, 0.5)');
                    Particles.explosion(bx, by, 10, 1);
                }, i * 200);
            }
            Utils.screenShake.shake(8, 1);
        }

        // Normal circle movement
        this.circleAngle += (1 + this.phase * 0.5) * this.phaseSpeedMult * dt;
        this.circleRadius = 200 - this.phase * 20;
        const targetX = playerX + Math.cos(this.circleAngle) * this.circleRadius;
        const targetY = playerY + Math.sin(this.circleAngle) * this.circleRadius;
        const dx = targetX - this.x, dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
            this.x += (dx / dist) * this.speed * this.phaseSpeedMult * dt;
            this.y += (dy / dist) * this.speed * this.phaseSpeedMult * dt;
        }
        this.angle = Utils.angle(this.x, this.y, playerX, playerY);

        if (this.spawnTimer >= this.spawnCooldown) {
            this.spawnTimer = 0;
            this.spawnMinion('flying');
            if (this.phase >= 2) this.spawnMinion('diveBomber');
        }
        this.clampToBounds();
    }

    getShockwaveKnockback(playerX, playerY) {
        if (this.isRotorSlamming && this.rotorSlamTimer > 0.9) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 200) return { angle: Utils.angle(this.x, this.y, playerX, playerY), force: (1 - dist / 200) * 400 };
        }
        return null;
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.ellipse(0, 0, this.radius, this.radius * 0.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.ellipse(this.radius * 0.4, 0, this.radius * 0.3, this.radius * 0.25, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a6a7a';
        ctx.fillRect(-this.radius - 30, -5, 35, 10);
        ctx.save(); ctx.translate(-this.radius - 30, 0); ctx.rotate(this.rotorAngle * 2);
        ctx.fillStyle = '#444'; ctx.fillRect(-2, -15, 4, 30); ctx.restore();
        ctx.save(); ctx.rotate(this.rotorAngle);
        ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
        ctx.fillRect(-55, -4, 110, 8);
        ctx.rotate(Math.PI / 2);
        ctx.fillRect(-55, -4, 110, 8);
        ctx.restore();
        ctx.fillStyle = '#333';
        ctx.fillRect(-this.radius * 0.3, this.radius * 0.4, 20, 8);
        ctx.fillRect(-this.radius * 0.3, -this.radius * 0.4 - 8, 20, 8);
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(0, -this.radius * 0.2, 8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

// ==================== LEVEL 7: HORDE MASTER ====================
class HordeMaster extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'HORDE MASTER';
        this.health = 263;
        this.maxHealth = 263;
        this.radius = 45;
        this.hitRadius = 45;
        this.speed = 72;
        this.color = Colors.bosses.hordeMaster;
        this.points = 1500;
        this.splitCount = 0;
        this.maxSplits = 8;
        this.pulsePhase = 0;
        // Toxic Nova
        this.toxicNovaCooldown = 0;
        this.isToxicNova = false;
        this.toxicNovaTimer = 0;
        // Consume - heals from nearby zombie count
        this.consumeCooldown = 0;
        // Mass Split (phase 3) - temporary copies
        this.massSplitCooldown = 0;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);
        this.pulsePhase += dt * 3;
        this.toxicNovaCooldown -= dt;
        this.consumeCooldown -= dt;
        this.massSplitCooldown -= dt;

        // Toxic Nova (phase 2+) - expanding poison ring
        if (this.phase >= 2 && !this.isToxicNova && this.toxicNovaCooldown <= 0 && Math.random() < 0.008) {
            this.isToxicNova = true;
            this.toxicNovaTimer = 0;
            this.toxicNovaCooldown = 6 - this.phase;
            Effects.addText(this.x, this.y - 50, 'TOXIC NOVA!', '#00ff00', 1, 20);
        }
        if (this.isToxicNova) {
            this.toxicNovaTimer += dt;
            const ringR = this.toxicNovaTimer * 200;
            Effects.addShockwave(this.x, this.y, ringR, 0.15, 'rgba(0, 255, 0, 0.4)');
            if (this.toxicNovaTimer > 1.5) this.isToxicNova = false;
        }

        // Consume (phase 1+) - heal periodically
        if (this.consumeCooldown <= 0 && this.health < this.maxHealth * 0.9) {
            this.consumeCooldown = 8;
            const healAmount = Math.floor(this.maxHealth * 0.03);
            this.health = Math.min(this.health + healAmount, this.maxHealth);
            Effects.addText(this.x, this.y - 40, `+${healAmount} HP`, '#00ff88', 0.8, 16);
            Particles.deathBurst(this.x, this.y, '#00ff88', 8);
        }

        // Mass Split (phase 3) - spawn ring of minions
        if (this.phase >= 3 && this.massSplitCooldown <= 0 && Math.random() < 0.005) {
            this.massSplitCooldown = 10;
            Effects.addText(this.x, this.y - 50, 'MASS SPLIT!', '#ff00ff', 1.5, 22);
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                this.minionsToSpawn.push({
                    type: Utils.randomChoice(['walker', 'runner']),
                    x: this.x + Math.cos(a) * 60,
                    y: this.y + Math.sin(a) * 60
                });
            }
            Effects.addShockwave(this.x, this.y, 100, 0.3, 'rgba(255, 0, 255, 0.4)');
        }

        // Move toward player
        this.moveToward(playerX, playerY, dt);

        // Periodic spawns
        if (this.spawnTimer >= 5 - this.phase) {
            this.spawnTimer = 0;
            for (let i = 0; i < 2 + this.phase; i++) this.spawnMinion('walker');
        }
        this.clampToBounds();
    }

    takeDamage(amount) {
        const result = super.takeDamage(amount);
        if (!result && this.splitCount < this.maxSplits) {
            const splitChance = 0.25 + this.phase * 0.1;
            if (Math.random() < splitChance) {
                this.splitCount++;
                for (let i = 0; i < 2; i++) {
                    const a = Utils.random(0, Math.PI * 2);
                    this.minionsToSpawn.push({
                        type: Utils.randomChoice(['walker', 'runner']),
                        x: this.x + Math.cos(a) * 50,
                        y: this.y + Math.sin(a) * 50
                    });
                }
                Effects.addText(this.x, this.y - 30, 'SPLIT!', '#ff00ff', 0.8, 18);
            }
        }
        return result;
    }

    getShockwaveKnockback(playerX, playerY) {
        if (this.isToxicNova) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            const ringR = this.toxicNovaTimer * 200;
            if (Math.abs(dist - ringR) < 50) return { angle: Utils.angle(this.x, this.y, playerX, playerY), force: 200 };
        }
        return null;
    }

    draw(ctx) {
        if (!this.alive) return;
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.isToxicNova) {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 25, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(139, 0, 139, 0.2)';
        ctx.beginPath(); ctx.arc(0, 0, this.radius * pulse + 20, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const r = this.radius * pulse + Math.sin(this.pulsePhase + i) * 5;
            const px = Math.cos(a) * r, py = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#5B005B'; ctx.lineWidth = 3; ctx.stroke();

        ctx.fillStyle = '#ff00ff';
        const eyePositions = [{ x: 10, y: -10 }, { x: 15, y: 5 }, { x: 5, y: 15 }, { x: -5, y: -5 }, { x: -10, y: 10 }];
        for (const eye of eyePositions) {
            ctx.beginPath(); ctx.arc(eye.x, eye.y, 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}

// ==================== LEVEL 8: TACTICAL NIGHTMARE ====================
class TacticalNightmare extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'TACTICAL NIGHTMARE';
        this.health = 450;
        this.maxHealth = 450;
        this.radius = 50;
        this.hitRadius = 45;
        this.speed = 60;
        this.color = Colors.bosses.tacticalNightmare;
        this.points = 2000;
        this.teleportCooldown = 0;
        this.teleportInterval = 4;
        this.isTeleporting = false;
        this.teleportAlpha = 1;
        // Stealth mode
        this.stealthCooldown = 0;
        this.isStealthed = false;
        this.stealthTimer = 0;
        this.stealthAlpha = 1;
        // EMP Blast
        this.empCooldown = 0;
        // Tactical Strike - teleport + charge
        this.isStriking = false;
        this.strikeTimer = 0;
        this.strikeAngle = 0;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);
        this.teleportCooldown -= dt;
        this.stealthCooldown -= dt;
        this.empCooldown -= dt;

        // Stealth (phase 1+) - become translucent
        if (!this.isStealthed && !this.isStriking && this.stealthCooldown <= 0 && Math.random() < 0.006) {
            this.isStealthed = true;
            this.stealthTimer = 0;
            this.stealthCooldown = 8 - this.phase;
            this.stealthAlpha = 1;
        }
        if (this.isStealthed) {
            this.stealthTimer += dt;
            this.stealthAlpha = 0.15 + Math.sin(this.stealthTimer * 3) * 0.1;
            this.speed = 120;
            if (this.stealthTimer > 3 + this.phase) {
                this.isStealthed = false;
                this.stealthAlpha = 1;
                this.speed = 60;
            }
        }

        // EMP Blast (phase 2+) - big shockwave
        if (this.phase >= 2 && this.empCooldown <= 0 && Math.random() < 0.006) {
            this.empCooldown = 7 - this.phase;
            Effects.addText(this.x, this.y - 60, 'EMP BLAST!', '#00ffff', 1.5, 22);
            Effects.addShockwave(this.x, this.y, 300, 0.5, 'rgba(0, 255, 255, 0.5)');
            Effects.addFlash(0.15, 'rgba(0, 255, 255, 0.3)');
            Utils.screenShake.shake(12, 0.4);
        }

        // Tactical Strike (phase 3) - teleport behind player then charge
        if (this.phase >= 3 && !this.isStriking && !this.isTeleporting && Math.random() < 0.005) {
            this.isStriking = true;
            this.strikeTimer = 0;
            const behindAngle = Utils.angle(playerX, playerY, this.x, this.y);
            this.x = playerX + Math.cos(behindAngle) * 150;
            this.y = playerY + Math.sin(behindAngle) * 150;
            this.clampToBounds();
            this.strikeAngle = Utils.angle(this.x, this.y, playerX, playerY);
            Particles.deathBurst(this.x, this.y, '#9400D3', 15);
            Effects.addText(this.x, this.y - 40, 'STRIKE!', '#ff0000', 0.8, 18);
        }
        if (this.isStriking) {
            this.strikeTimer += dt;
            if (this.strikeTimer < 0.3) {
                // Brief pause
            } else if (this.strikeTimer < 0.8) {
                this.x += Math.cos(this.strikeAngle) * 600 * dt;
                this.y += Math.sin(this.strikeAngle) * 600 * dt;
                Particles.trail(this.x, this.y, '#9400D3', 5);
            } else {
                this.isStriking = false;
            }
            this.clampToBounds();
            return;
        }

        if (this.isTeleporting) {
            this.teleportAlpha -= dt * 3;
            if (this.teleportAlpha <= 0) {
                const a = Utils.random(0, Math.PI * 2);
                const dist = Utils.random(150, 300);
                this.x = playerX + Math.cos(a) * dist;
                this.y = playerY + Math.sin(a) * dist;
                this.clampToBounds();
                this.isTeleporting = false;
                this.teleportAlpha = this.isStealthed ? this.stealthAlpha : 1;
                Audio.playTeleport();
                Particles.deathBurst(this.x, this.y, this.color, 15);
            }
        } else {
            this.moveToward(playerX, playerY, dt);
            if (this.teleportCooldown <= 0) {
                this.teleportCooldown = this.teleportInterval - this.phase * 0.5;
                this.isTeleporting = true;
                Particles.deathBurst(this.x, this.y, this.color, 15);
            }
        }

        if (this.spawnTimer >= 6 - this.phase) {
            this.spawnTimer = 0;
            this.spawnMinion('shielded');
            if (this.phase >= 2) this.spawnMinion('teleporter');
        }
        this.clampToBounds();
    }

    getShockwaveKnockback(playerX, playerY) {
        if (this.empCooldown > 6 - this.phase - 0.5) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 300) return { angle: Utils.angle(this.x, this.y, playerX, playerY), force: (1 - dist / 300) * 400 };
        }
        return null;
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.globalAlpha = this.isStealthed ? this.stealthAlpha : this.teleportAlpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = '#2a2a4a';
        ctx.beginPath(); ctx.arc(0, 0, this.radius + 5, -1, 1); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();

        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#2a0a4a'; ctx.lineWidth = 4; ctx.stroke();

        ctx.strokeStyle = '#9400D3'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.4, Math.PI, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = '#00ff00'; ctx.shadowColor = '#00ff00'; ctx.shadowBlur = 10;
        ctx.fillRect(10, -15, 25, 8);
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// ==================== LEVEL 9: CHAOS INCARNATE ====================
class ChaosIncarnate extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'CHAOS INCARNATE';
        this.health = 600;
        this.maxHealth = 600;
        this.radius = 45;
        this.hitRadius = 40;
        this.speed = 96;
        this.color = Colors.bosses.chaosIncarnate;
        this.points = 2500;
        this.currentForm = 0;
        this.forms = ['berserker', 'flyer', 'teleporter', 'tank'];
        this.formTimer = 0;
        this.formDuration = 8;
        this.morphing = false;
        this.morphProgress = 0;
        // Reality Warp - chaos teleport
        this.warpCooldown = 0;
        // Chaos Bolt - spawn at player position
        this.chaosBoltCooldown = 0;
        // Dimensional Rift - danger zones
        this.riftCooldown = 0;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);
        this.formTimer += dt;
        this.warpCooldown -= dt;
        this.chaosBoltCooldown -= dt;
        this.riftCooldown -= dt;

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

        // Reality Warp (phase 1+) - teleport to random position
        if (this.warpCooldown <= 0 && Math.random() < 0.008) {
            this.warpCooldown = 6 - this.phase;
            const a = Utils.random(0, Math.PI * 2);
            const d = Utils.random(100, 300);
            Particles.deathBurst(this.x, this.y, '#ff1493', 15);
            this.x = playerX + Math.cos(a) * d;
            this.y = playerY + Math.sin(a) * d;
            this.clampToBounds();
            Particles.deathBurst(this.x, this.y, '#ff1493', 15);
            Effects.addFlash(0.1, 'rgba(255, 20, 147, 0.3)');
        }

        // Chaos Bolt (phase 2+) - spawn zombies near player
        if (this.phase >= 2 && this.chaosBoltCooldown <= 0 && Math.random() < 0.008) {
            this.chaosBoltCooldown = 5 - this.phase * 0.5;
            Effects.addText(playerX, playerY - 30, 'CHAOS BOLT!', '#ff1493', 0.8, 16);
            for (let i = 0; i < this.phase; i++) {
                const a = Utils.random(0, Math.PI * 2);
                this.minionsToSpawn.push({
                    type: Utils.randomChoice(['runner', 'berserker']),
                    x: playerX + Math.cos(a) * 80,
                    y: playerY + Math.sin(a) * 80
                });
            }
            Effects.addShockwave(playerX, playerY, 100, 0.3, 'rgba(255, 20, 147, 0.4)');
        }

        // Dimensional Rift (phase 3) - create shockwave patterns
        if (this.phase >= 3 && this.riftCooldown <= 0 && Math.random() < 0.005) {
            this.riftCooldown = 8;
            Effects.addText(this.x, this.y - 60, 'DIMENSIONAL RIFT!', '#ff00ff', 1.5, 22);
            for (let i = 0; i < 4; i++) {
                setTimeout(() => {
                    if (!this.alive) return;
                    const rx = Utils.random(100, GAME_WIDTH - 100);
                    const ry = Utils.random(100, GAME_HEIGHT - 100);
                    Effects.addShockwave(rx, ry, 120, 0.5, 'rgba(255, 0, 255, 0.4)');
                    Particles.explosion(rx, ry, 10, 1);
                }, i * 300);
            }
        }

        // Form behaviors
        const form = this.forms[this.currentForm];
        switch (form) {
            case 'berserker':
                this.speed = 150;
                this.moveToward(playerX, playerY, dt);
                break;
            case 'flyer':
                this.speed = 100;
                const swoopX = Math.sin(this.stateTimer * 2) * 100;
                const a = Utils.angle(this.x, this.y, playerX, playerY);
                this.x += Math.cos(a) * this.speed * this.phaseSpeedMult * dt + swoopX * dt;
                this.y += Math.sin(a) * this.speed * this.phaseSpeedMult * dt;
                this.angle = a;
                break;
            case 'teleporter':
                this.speed = 40;
                this.moveToward(playerX, playerY, dt);
                if (Math.random() < 0.01) {
                    const ta = Utils.random(0, Math.PI * 2);
                    this.x = playerX + Math.cos(ta) * 200;
                    this.y = playerY + Math.sin(ta) * 200;
                    Audio.playTeleport();
                    Particles.deathBurst(this.x, this.y, this.color, 10);
                }
                break;
            case 'tank':
                this.speed = 30;
                this.moveToward(playerX, playerY, dt);
                break;
        }

        if (this.spawnTimer >= 4) {
            this.spawnTimer = 0;
            const types = ['walker', 'runner', 'flying', 'berserker', 'jumper'];
            for (let i = 0; i < 1 + this.phase; i++) this.spawnMinion(Utils.randomChoice(types));
        }
        this.clampToBounds();
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.morphing) {
            ctx.rotate(this.morphProgress * Math.PI * 2);
            const scale = 1 + Math.sin(this.morphProgress * Math.PI) * 0.3;
            ctx.scale(scale, scale);
        } else {
            ctx.rotate(this.angle);
        }

        const hue = (Date.now() / 20) % 360;
        const formColor = `hsl(${hue}, 100%, 50%)`;
        ctx.strokeStyle = formColor; ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
            ctx.globalAlpha = 0.3 - i * 0.05;
            ctx.beginPath(); ctx.arc(0, 0, this.radius + 10 + i * 5, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;

        ctx.fillStyle = this.color;
        const form = this.forms[this.currentForm];
        switch (form) {
            case 'berserker':
                ctx.beginPath();
                ctx.moveTo(this.radius, 0);
                ctx.lineTo(-this.radius, -this.radius * 0.8);
                ctx.lineTo(-this.radius * 0.5, 0);
                ctx.lineTo(-this.radius, this.radius * 0.8);
                ctx.closePath(); ctx.fill();
                break;
            case 'flyer':
                ctx.beginPath(); ctx.ellipse(0, 0, this.radius, this.radius * 0.6, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#8B0050';
                ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-40, -30); ctx.lineTo(-20, 0); ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-40, 30); ctx.lineTo(-20, 0); ctx.closePath(); ctx.fill();
                break;
            case 'teleporter':
                ctx.shadowColor = this.color; ctx.shadowBlur = 20;
                ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
                break;
            case 'tank':
                ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#333'; ctx.lineWidth = 8; ctx.stroke();
                break;
        }
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(15, -8, 6, 0, Math.PI * 2); ctx.arc(15, 8, 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

// ==================== LEVEL 10: THE OMEGA ZOMBIE ====================
class OmegaZombie extends Boss {
    constructor(x, y) {
        super(x, y);
        this.name = 'THE OMEGA ZOMBIE';
        this.health = 900;
        this.maxHealth = 900;
        this.radius = 70;
        this.hitRadius = 65;
        this.speed = 72;
        this.color = Colors.bosses.omega;
        this.points = 5000;

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

        // Death Beam - sweeping visual + shockwaves
        this.deathBeamCooldown = 0;
        this.isDeathBeaming = false;
        this.deathBeamTimer = 0;
        this.deathBeamAngle = 0;
        // Gravity Pull
        this.gravityPullCooldown = 0;
        this.isGravityPulling = false;
        this.gravityPullTimer = 0;
        // Omega Burst
        this.omegaBurstCooldown = 0;
    }

    update(dt, playerX, playerY) {
        super.update(dt, playerX, playerY);
        this.pulsePhase += dt * 2;
        this.abilityTimer += dt;
        this.deathBeamCooldown -= dt;
        this.gravityPullCooldown -= dt;
        this.omegaBurstCooldown -= dt;

        // Death Beam (phase 2+) - sweeping shockwave line
        if (this.phase >= 2 && !this.isDeathBeaming && this.deathBeamCooldown <= 0 && Math.random() < 0.005) {
            this.isDeathBeaming = true;
            this.deathBeamTimer = 0;
            this.deathBeamAngle = Utils.angle(this.x, this.y, playerX, playerY) - Math.PI / 4;
            this.deathBeamCooldown = 10 - this.phase;
            Effects.addText(this.x, this.y - 90, 'DEATH BEAM!', '#ff0000', 1.5, 24);
        }
        if (this.isDeathBeaming) {
            this.deathBeamTimer += dt;
            this.deathBeamAngle += dt * 1.5;
            for (let i = 1; i <= 3; i++) {
                const bx = this.x + Math.cos(this.deathBeamAngle) * i * 100;
                const by = this.y + Math.sin(this.deathBeamAngle) * i * 100;
                Particles.trail(bx, by, '#ff0000', 6);
            }
            if (this.deathBeamTimer > 2) this.isDeathBeaming = false;
        }

        // Gravity Pull (phase 2+) - pull player toward boss
        if (this.phase >= 2 && !this.isGravityPulling && this.gravityPullCooldown <= 0 && Math.random() < 0.004) {
            this.isGravityPulling = true;
            this.gravityPullTimer = 0;
            this.gravityPullCooldown = 12 - this.phase * 2;
            Effects.addText(this.x, this.y - 90, 'GRAVITY PULL!', '#9900ff', 1.5, 22);
        }
        if (this.isGravityPulling) {
            this.gravityPullTimer += dt;
            if (this.gravityPullTimer > 2) this.isGravityPulling = false;
        }

        // Omega Burst (phase 3) - massive AOE
        if (this.phase >= 3 && this.omegaBurstCooldown <= 0 && Math.random() < 0.003) {
            this.omegaBurstCooldown = 12;
            Effects.addText(this.x, this.y - 90, 'OMEGA BURST!', '#FFD700', 2, 28);
            for (let i = 0; i < 4; i++) {
                setTimeout(() => {
                    if (!this.alive) return;
                    Effects.addShockwave(this.x, this.y, 200 + i * 100, 0.4, 'rgba(255, 215, 0, 0.4)');
                    Utils.screenShake.shake(10 + i * 3, 0.3);
                }, i * 300);
            }
            for (let i = 0; i < 3; i++) this.spawnMinion(Utils.randomChoice(['runner', 'berserker', 'teleporter']));
        }

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

        switch (this.currentAbility) {
            case 'charge': this.doCharge(dt, playerX, playerY); break;
            case 'fly': this.doFly(dt, playerX, playerY); break;
            case 'teleport': this.doTeleport(dt, playerX, playerY); break;
            case 'shockwave': this.doShockwave(dt, playerX, playerY); break;
            case 'swarm': this.doSwarm(dt, playerX, playerY); break;
        }
        this.clampToBounds();
    }

    doCharge(dt, playerX, playerY) {
        this.chargeTimer += dt;
        switch (this.chargeState) {
            case 'idle':
                this.moveToward(playerX, playerY, dt, 50);
                if (Utils.distance(this.x, this.y, playerX, playerY) < 400) {
                    this.chargeState = 'windup'; this.chargeTimer = 0;
                    this.chargeAngle = Utils.angle(this.x, this.y, playerX, playerY);
                }
                break;
            case 'windup':
                this.angle = Utils.angle(this.x, this.y, playerX, playerY);
                if (this.chargeTimer > 0.5) { this.chargeState = 'charging'; this.chargeTimer = 0; }
                break;
            case 'charging':
                this.x += Math.cos(this.chargeAngle) * 500 * this.phaseSpeedMult * dt;
                this.y += Math.sin(this.chargeAngle) * 500 * this.phaseSpeedMult * dt;
                Particles.trail(this.x, this.y, this.color, 10);
                if (this.chargeTimer > 0.6) {
                    this.chargeState = 'idle';
                    Utils.screenShake.shake(10, 0.2);
                    Effects.addShockwave(this.x, this.y, 150, 0.3, 'rgba(255, 215, 0, 0.4)');
                }
                break;
        }
    }

    doFly(dt, playerX, playerY) {
        this.isFlying = true;
        this.altitude = 80;
        const a = Utils.angle(this.x, this.y, playerX, playerY);
        this.angle = a;
        const swoopX = Math.sin(this.stateTimer * 3) * 150 * dt;
        this.x += Math.cos(a) * 120 * this.phaseSpeedMult * dt + swoopX;
        this.y += Math.sin(a) * 120 * this.phaseSpeedMult * dt;
    }

    doTeleport(dt, playerX, playerY) {
        this.teleportCooldown -= dt;
        this.moveToward(playerX, playerY, dt, 40);
        if (this.teleportCooldown <= 0) {
            this.teleportCooldown = 2;
            const a = Utils.random(0, Math.PI * 2);
            const d = Utils.random(100, 250);
            this.x = playerX + Math.cos(a) * d;
            this.y = playerY + Math.sin(a) * d;
            this.clampToBounds();
            Audio.playTeleport();
            Particles.deathBurst(this.x, this.y, this.color, 20);
        }
    }

    doShockwave(dt, playerX, playerY) {
        this.shockwaveCooldown -= dt;
        this.moveToward(playerX, playerY, dt, 70);
        if (this.shockwaveCooldown <= 0) {
            this.shockwaveCooldown = 2;
            Effects.addShockwave(this.x, this.y, 350, 0.6, 'rgba(255, 215, 0, 0.5)');
            Audio.playShockwave();
            Utils.screenShake.shake(15, 0.4);
        }
    }

    doSwarm(dt, playerX, playerY) {
        this.moveToward(playerX, playerY, dt, 50);
        if (this.spawnTimer >= 1.5) {
            this.spawnTimer = 0;
            const types = ['walker', 'runner', 'flying', 'berserker', 'jumper', 'teleporter'];
            for (let i = 0; i < 2 + this.phase; i++) this.spawnMinion(Utils.randomChoice(types));
        }
    }

    getShockwaveKnockback(playerX, playerY) {
        if (this.currentAbility === 'shockwave' && this.shockwaveCooldown > 1) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 350) return { angle: Utils.angle(this.x, this.y, playerX, playerY), force: (1 - dist / 350) * 600 };
        }
        // Gravity pull reverses - pulls player IN
        if (this.isGravityPulling) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 400 && dist > 50) {
                return { angle: Utils.angle(playerX, playerY, this.x, this.y), force: 250 };
            }
        }
        // Death beam knockback
        if (this.isDeathBeaming) {
            for (let i = 1; i <= 3; i++) {
                const bx = this.x + Math.cos(this.deathBeamAngle) * i * 100;
                const by = this.y + Math.sin(this.deathBeamAngle) * i * 100;
                const dist = Utils.distance(bx, by, playerX, playerY);
                if (dist < 60) return { angle: Utils.angle(bx, by, playerX, playerY), force: 400 };
            }
        }
        // Omega burst
        if (this.omegaBurstCooldown > 10) {
            const dist = Utils.distance(this.x, this.y, playerX, playerY);
            if (dist < 400) return { angle: Utils.angle(this.x, this.y, playerX, playerY), force: (1 - dist / 400) * 800 };
        }
        return null;
    }

    takeDamage(amount) {
        const result = super.takeDamage(amount);
        if (!result && this.splitCount < 15 && Math.random() < 0.1) {
            this.splitCount++;
            this.spawnMinion(Utils.randomChoice(['walker', 'runner', 'flying']));
        }
        return result;
    }

    draw(ctx) {
        if (!this.alive) return;
        const yOffset = this.isFlying ? -this.altitude : 0;
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.05;

        // Death beam visual
        if (this.isDeathBeaming) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + yOffset);
            ctx.lineTo(this.x + Math.cos(this.deathBeamAngle) * 400, this.y + yOffset + Math.sin(this.deathBeamAngle) * 400);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
            ctx.lineWidth = 16;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + yOffset);
            ctx.lineTo(this.x + Math.cos(this.deathBeamAngle) * 400, this.y + yOffset + Math.sin(this.deathBeamAngle) * 400);
            ctx.stroke();
            ctx.restore();
        }

        // Gravity pull visual
        if (this.isGravityPulling) {
            ctx.save();
            ctx.strokeStyle = 'rgba(153, 0, 255, 0.3)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const r = 400 - (this.gravityPullTimer * 100 + i * 100) % 400;
                ctx.beginPath(); ctx.arc(this.x, this.y + yOffset, r, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore();
        }

        ctx.save();
        ctx.translate(this.x, this.y + yOffset);
        ctx.rotate(this.angle);
        ctx.scale(pulse, pulse);

        const gradient = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, this.radius * 1.5);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#B8860B'; ctx.lineWidth = 5; ctx.stroke();

        ctx.fillStyle = '#B8860B';
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 15 - 5, -this.radius);
            ctx.lineTo(i * 15, -this.radius - 25 - Math.abs(i) * 5);
            ctx.lineTo(i * 15 + 5, -this.radius);
            ctx.closePath(); ctx.fill();
        }

        ctx.fillStyle = '#ff0000'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 15;
        const eyePositions = [{ x: 30, y: -20 }, { x: 35, y: 0 }, { x: 30, y: 20 }, { x: 20, y: -10 }, { x: 20, y: 10 }];
        for (const eye of eyePositions) {
            ctx.beginPath(); ctx.arc(eye.x, eye.y, 6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
        ctx.rotate(-this.angle);
        ctx.fillText(this.currentAbility.toUpperCase(), 0, 5);
        ctx.restore();

        if (this.isFlying) {
            ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(this.x, this.y + 30, this.radius * 0.7, this.radius * 0.3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

    checkCollision(playerX, playerY, playerRadius) {
        const yOffset = this.isFlying ? -this.altitude * 0.5 : 0;
        return Utils.circleCollision(this.x, this.y + yOffset, this.hitRadius, playerX, playerY, playerRadius);
    }
}

// ==================== BOSS MANAGER ====================
class BossManager {
    constructor() {
        this.boss = null;
        this.bossTypes = {
            1: BigBernie, 2: SprintSally, 3: SkyReaper, 4: RageKing,
            5: MonsterTruckMike, 6: ChopperCommander, 7: HordeMaster,
            8: TacticalNightmare, 9: ChaosIncarnate, 10: OmegaZombie
        };
    }

    spawn(level, playerX, playerY) {
        const BossClass = this.bossTypes[level];
        if (!BossClass) return null;
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
            if (Utils.circleCollision(bullet.x, bullet.y, bullet.radius, this.boss.x, this.boss.y, this.boss.hitRadius)) {
                Particles.sparks(bullet.x, bullet.y, bullet.angle, 8);
                // Bow arrows pierce through enemies
                if (bullet.weaponType !== 'bow') {
                    bullet.active = false;
                }
                if (this.boss.takeDamage(bullet.damage)) {
                    const result = { points: this.boss.points, name: this.boss.name };
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
        if (typeof this.boss.getShockwaveKnockback === 'function') return this.boss.getShockwaveKnockback(playerX, playerY);
        return null;
    }

    isAlive() { return this.boss && this.boss.alive; }
    getBoss() { return this.boss; }
    clear() { this.boss = null; }
}
