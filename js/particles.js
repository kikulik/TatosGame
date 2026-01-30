// Particle System for Zombie Apocalypse Game

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 0;
        this.size = 0;
        this.color = '#fff';
        this.alpha = 1;
        this.gravity = 0;
        this.friction = 1;
        this.shrink = true;
    }

    init(x, y, vx, vy, life, size, color, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.startSize = size;
        this.color = color;
        this.alpha = options.alpha || 1;
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 0.98;
        this.shrink = options.shrink !== false;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) return false;

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity * dt;

        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;

        const lifeRatio = this.life / this.maxLife;
        this.alpha = lifeRatio;

        if (this.shrink) {
            this.size = this.startSize * lifeRatio;
        }

        return true;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor(maxParticles = 500) {
        this.pool = new ObjectPool(
            () => new Particle(),
            (p) => p.reset(),
            maxParticles
        );
    }

    // Create blood splatter
    blood(x, y, direction, count = 10) {
        for (let i = 0; i < count; i++) {
            const particle = this.pool.get();
            const angle = direction + Utils.random(-0.5, 0.5);
            const speed = Utils.random(2, 8);
            const color = Utils.randomChoice(Colors.particles.blood);

            particle.init(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Utils.random(0.3, 0.6),
                Utils.random(2, 5),
                color,
                { gravity: 0.2, friction: 0.95 }
            );
        }
    }

    // Create explosion effect
    explosion(x, y, count = 20, size = 1) {
        for (let i = 0; i < count; i++) {
            const particle = this.pool.get();
            const angle = Utils.random(0, Math.PI * 2);
            const speed = Utils.random(3, 10) * size;
            const color = Utils.randomChoice(Colors.particles.explosion);

            particle.init(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Utils.random(0.3, 0.8),
                Utils.random(3, 8) * size,
                color,
                { gravity: 0.1, friction: 0.94 }
            );
        }
    }

    // Create smoke effect
    smoke(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            const particle = this.pool.get();
            const angle = Utils.random(0, Math.PI * 2);
            const speed = Utils.random(0.5, 2);
            const color = Utils.randomChoice(Colors.particles.smoke);

            particle.init(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 1,
                Utils.random(0.5, 1),
                Utils.random(5, 15),
                color,
                { gravity: -0.1, friction: 0.96, shrink: false }
            );
        }
    }

    // Create spark effect (for bullets hitting)
    sparks(x, y, direction, count = 5) {
        for (let i = 0; i < count; i++) {
            const particle = this.pool.get();
            const angle = direction + Math.PI + Utils.random(-0.8, 0.8);
            const speed = Utils.random(2, 6);
            const color = Utils.randomChoice(Colors.particles.spark);

            particle.init(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Utils.random(0.1, 0.3),
                Utils.random(1, 3),
                color,
                { gravity: 0.15, friction: 0.9 }
            );
        }
    }

    // Create muzzle flash
    muzzleFlash(x, y, direction) {
        for (let i = 0; i < 5; i++) {
            const particle = this.pool.get();
            const angle = direction + Utils.random(-0.3, 0.3);
            const speed = Utils.random(5, 10);

            particle.init(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                0.05,
                Utils.random(3, 6),
                Colors.muzzleFlash,
                { friction: 0.8 }
            );
        }
    }

    // Create death burst (larger explosion for zombie deaths)
    deathBurst(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            const particle = this.pool.get();
            const angle = Utils.random(0, Math.PI * 2);
            const speed = Utils.random(2, 7);

            particle.init(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Utils.random(0.4, 0.8),
                Utils.random(3, 8),
                color,
                { gravity: 0.15, friction: 0.95 }
            );
        }
    }

    // Create trail effect
    trail(x, y, color, size = 3) {
        const particle = this.pool.get();
        particle.init(
            x + Utils.random(-2, 2),
            y + Utils.random(-2, 2),
            Utils.random(-0.5, 0.5),
            Utils.random(-0.5, 0.5),
            Utils.random(0.2, 0.4),
            size,
            color,
            { friction: 0.9 }
        );
    }

    // Create shockwave ring
    shockwave(x, y, radius, color = '#ffffff') {
        // Shockwaves are handled separately in the effects system
    }

    update(dt) {
        const active = this.pool.getActive();
        for (let i = active.length - 1; i >= 0; i--) {
            if (!active[i].update(dt)) {
                this.pool.release(active[i]);
            }
        }
    }

    draw(ctx) {
        const active = this.pool.getActive();
        for (const particle of active) {
            particle.draw(ctx);
        }
    }

    clear() {
        this.pool.releaseAll();
    }
}

// Visual Effects System (for larger effects like shockwaves)
class EffectsSystem {
    constructor() {
        this.effects = [];
    }

    addShockwave(x, y, maxRadius, duration, color = 'rgba(255, 255, 255, 0.5)') {
        this.effects.push({
            type: 'shockwave',
            x, y,
            radius: 0,
            maxRadius,
            duration,
            maxDuration: duration,
            color
        });
    }

    addFlash(duration = 0.1, color = 'rgba(255, 255, 255, 0.3)') {
        this.effects.push({
            type: 'flash',
            duration,
            maxDuration: duration,
            color
        });
    }

    addText(x, y, text, color = '#fff', duration = 1, size = 20) {
        this.effects.push({
            type: 'text',
            x, y,
            startY: y,
            text,
            color,
            duration,
            maxDuration: duration,
            size
        });
    }

    update(dt) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.duration -= dt;

            if (effect.type === 'shockwave') {
                const progress = 1 - effect.duration / effect.maxDuration;
                effect.radius = effect.maxRadius * progress;
            } else if (effect.type === 'text') {
                const progress = 1 - effect.duration / effect.maxDuration;
                effect.y = effect.startY - 30 * progress;
            }

            if (effect.duration <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const effect of this.effects) {
            const alpha = effect.duration / effect.maxDuration;

            if (effect.type === 'shockwave') {
                ctx.save();
                ctx.strokeStyle = effect.color;
                ctx.globalAlpha = alpha * 0.7;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            } else if (effect.type === 'flash') {
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = effect.color;
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                ctx.restore();
            } else if (effect.type === 'text') {
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = effect.color;
                ctx.font = `bold ${effect.size}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(effect.text, effect.x, effect.y);
                ctx.restore();
            }
        }
    }

    clear() {
        this.effects = [];
    }
}

// Global instances
const Particles = new ParticleSystem();
const Effects = new EffectsSystem();
