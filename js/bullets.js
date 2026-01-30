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
    }

    init(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Deactivate if off screen
        if (this.x < -50 || this.x > GAME_WIDTH + 50 ||
            this.y < -50 || this.y > GAME_HEIGHT + 50) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Bullet trail glow
        const gradient = ctx.createLinearGradient(-15, 0, 5, 0);
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0)');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0.8)');

        ctx.fillStyle = gradient;
        ctx.fillRect(-15, -2, 20, 4);

        // Bullet body
        ctx.fillStyle = Colors.bullet;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Bullet core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
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
