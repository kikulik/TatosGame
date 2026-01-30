// Bullet System for Zombie Apocalypse Game

class Bullet {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.speed = 800;
        this.radius = 4;
        this.damage = 1;
        this.active = false;
        this.angle = 0;
        this.color = '#ffff00';
        this.trailColor = 'rgba(255, 255, 0, 0.8)';
        this.isExplosive = false;
        this.explosionRadius = 0;
        this.isFlame = false;
        this.range = Infinity;
        this.distanceTraveled = 0;
        this.startX = 0;
        this.startY = 0;
        this.weaponType = 'pistol';
        this.targetX = null; // For click-to-detonate rockets
        this.targetY = null;
    }

    init(x, y, angle) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.angle = angle;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.active = true;
        this.distanceTraveled = 0;
    }

    initFromWeapon(x, y, angle, weapon, targetX = null, targetY = null) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.angle = angle;
        this.speed = weapon.speed;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.active = true;
        this.damage = weapon.damage;
        this.radius = weapon.bulletSize;
        this.color = weapon.color;
        this.trailColor = weapon.trailColor;
        this.isExplosive = weapon.isExplosive;
        this.explosionRadius = weapon.explosionRadius || 0;
        this.isFlame = weapon.isFlame;
        this.range = weapon.range;
        this.distanceTraveled = 0;
        this.weaponType = weapon.type;
        // For rockets - they explode where you clicked
        this.targetX = targetX;
        this.targetY = targetY;
    }

    update(dt) {
        if (!this.active) return;

        const prevX = this.x;
        const prevY = this.y;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Track distance traveled
        this.distanceTraveled += Utils.distance(prevX, prevY, this.x, this.y);

        // For rockets with target - explode when reaching target area
        if (this.isExplosive && this.targetX !== null && this.targetY !== null) {
            const distToTarget = Utils.distance(this.x, this.y, this.targetX, this.targetY);
            if (distToTarget < 20) {
                // Reached target - explode!
                this.explode();
                this.active = false;
                return;
            }
        }

        // Deactivate if past range (for shotgun, flamethrower)
        if (this.distanceTraveled > this.range) {
            this.active = false;
            // Flame particles fade out
            if (this.isFlame) {
                Particles.smoke(this.x, this.y, 3);
            }
            return;
        }

        // Deactivate if off screen
        if (this.x < -50 || this.x > GAME_WIDTH + 50 ||
            this.y < -50 || this.y > GAME_HEIGHT + 50) {
            this.active = false;
        }

        // Flame particles trail
        if (this.isFlame && Math.random() < 0.5) {
            Particles.trail(this.x, this.y, Utils.randomChoice(['#ff4400', '#ff8800', '#ffcc00']), this.radius * 0.7);
        }

        // Rocket smoke trail
        if (this.isExplosive && Math.random() < 0.3) {
            Particles.smoke(this.x - this.vx * dt * 2, this.y - this.vy * dt * 2, 2);
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.isFlame) {
            // Flame bullet - flickering orange/yellow
            const flameColors = ['#ff4400', '#ff8800', '#ffcc00', '#ff6600'];
            const flickerSize = this.radius * (0.8 + Math.random() * 0.4);

            ctx.fillStyle = Utils.randomChoice(flameColors);
            ctx.beginPath();
            ctx.arc(0, 0, flickerSize, 0, Math.PI * 2);
            ctx.fill();

            // Inner bright core
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(0, 0, flickerSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.isExplosive) {
            // Rocket - larger with fins
            // Rocket body
            ctx.fillStyle = '#666';
            ctx.fillRect(-this.radius * 1.5, -this.radius * 0.5, this.radius * 2, this.radius);

            // Warhead
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(this.radius * 0.5, 0);
            ctx.lineTo(-this.radius * 0.5, -this.radius * 0.5);
            ctx.lineTo(-this.radius * 0.5, this.radius * 0.5);
            ctx.closePath();
            ctx.fill();

            // Fins
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.moveTo(-this.radius * 1.5, 0);
            ctx.lineTo(-this.radius * 2, -this.radius * 0.8);
            ctx.lineTo(-this.radius * 1.2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-this.radius * 1.5, 0);
            ctx.lineTo(-this.radius * 2, this.radius * 0.8);
            ctx.lineTo(-this.radius * 1.2, 0);
            ctx.closePath();
            ctx.fill();

            // Engine glow
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(-this.radius * 1.5, 0, this.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Regular bullet with trail
            const gradient = ctx.createLinearGradient(-15, 0, 5, 0);
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0)');
            gradient.addColorStop(1, this.trailColor);

            ctx.fillStyle = gradient;
            ctx.fillRect(-15, -2, 20, 4);

            // Bullet body
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Bullet core
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius - 1, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Create explosion when rocket hits
    explode() {
        if (!this.isExplosive) return;

        Particles.explosion(this.x, this.y, 30, 2);
        Effects.addShockwave(this.x, this.y, this.explosionRadius, 0.3, 'rgba(255, 100, 0, 0.6)');
        Utils.screenShake.shake(10, 0.3);
        Audio.playExplosion();
    }
}

class BulletManager {
    constructor() {
        this.pool = new ObjectPool(
            () => new Bullet(),
            (b) => b.reset(),
            200
        );
    }

    spawn(x, y, angle) {
        const bullet = this.pool.get();
        bullet.init(x, y, angle);
        return bullet;
    }

    spawnWeaponBullet(x, y, angle, weapon, targetX = null, targetY = null) {
        const bullet = this.pool.get();
        bullet.initFromWeapon(x, y, angle, weapon, targetX, targetY);
        return bullet;
    }

    update(dt) {
        const active = this.pool.getActive();
        for (let i = active.length - 1; i >= 0; i--) {
            active[i].update(dt);
            if (!active[i].active) {
                this.pool.release(active[i]);
            }
        }
    }

    draw(ctx) {
        const active = this.pool.getActive();
        for (const bullet of active) {
            bullet.draw(ctx);
        }
    }

    getActive() {
        return this.pool.getActive();
    }

    // Check collision with an entity
    checkHit(entity) {
        const active = this.pool.getActive();
        for (let i = active.length - 1; i >= 0; i--) {
            const bullet = active[i];
            if (!bullet.active) continue;

            if (Utils.circleCollision(
                bullet.x, bullet.y, bullet.radius,
                entity.x, entity.y, entity.hitRadius || entity.radius
            )) {
                // Create spark effect
                Particles.sparks(bullet.x, bullet.y, bullet.angle, 5);

                // Deactivate bullet
                bullet.active = false;
                this.pool.release(bullet);

                return bullet.damage;
            }
        }
        return 0;
    }

    clear() {
        this.pool.releaseAll();
    }
}
