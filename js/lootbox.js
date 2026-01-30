// Loot Box System for Zombie Apocalypse Game

const LOOT_DROP_CHANCE = 0.03; // 3% chance to drop
const LOOT_BOX_LIFETIME = 7; // 7 seconds before explosion
const LOOT_BOX_RADIUS = 20;
const LOOT_BOX_PICKUP_RADIUS = 40;

class LootBox {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.active = false;
        this.weaponType = null;
        this.lifetime = LOOT_BOX_LIFETIME;
        this.radius = LOOT_BOX_RADIUS;
        this.pickupRadius = LOOT_BOX_PICKUP_RADIUS;
        this.pulsePhase = 0;
        this.warningFlash = false;
        this.collected = false;
    }

    init(x, y) {
        this.x = x;
        this.y = y;
        this.active = true;
        this.weaponType = getRandomWeaponDrop();
        this.lifetime = LOOT_BOX_LIFETIME;
        this.pulsePhase = 0;
        this.warningFlash = false;
        this.collected = false;
    }

    update(dt) {
        if (!this.active) return false;

        this.lifetime -= dt;
        this.pulsePhase += dt * 5;

        // Warning flash in last 3 seconds
        if (this.lifetime <= 3) {
            this.warningFlash = Math.sin(this.lifetime * 15) > 0;
        }

        // Explode when time runs out
        if (this.lifetime <= 0) {
            this.explode();
            return false;
        }

        return true;
    }

    explode() {
        this.active = false;
        // Create explosion effects
        Particles.explosion(this.x, this.y, 25, 1.5);
        Effects.addShockwave(this.x, this.y, 80, 0.3, 'rgba(255, 100, 0, 0.6)');
        Utils.screenShake.shake(8, 0.3);
        Audio.playExplosion();
    }

    checkPickup(playerX, playerY, playerRadius) {
        if (!this.active || this.collected) return null;

        const dist = Utils.distance(this.x, this.y, playerX, playerY);
        if (dist < this.pickupRadius + playerRadius) {
            this.collected = true;
            this.active = false;

            // Pickup effects
            Particles.deathBurst(this.x, this.y, '#FFD700', 20);
            Effects.addText(this.x, this.y - 30, WeaponTypes[this.weaponType].name + '!', '#FFD700', 1.5, 24);
            Audio.playWeaponPickup();

            return this.weaponType;
        }

        return null;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Pulsing glow effect
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.1;
        const glowSize = this.radius * 1.5 * pulseScale;

        // Warning color in last 3 seconds
        const boxColor = this.warningFlash ? '#ff0000' : '#FFD700';
        const glowColor = this.warningFlash ? 'rgba(255, 0, 0, 0.4)' : 'rgba(255, 215, 0, 0.4)';

        // Outer glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Box body (treasure chest style)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-this.radius, -this.radius * 0.6, this.radius * 2, this.radius * 1.2);

        // Box lid
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.ellipse(0, -this.radius * 0.6, this.radius, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gold trim
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(-this.radius, -this.radius * 0.6, this.radius * 2, this.radius * 1.2);

        // Lock/clasp
        ctx.fillStyle = boxColor;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Timer indicator (circular progress)
        const timerProgress = this.lifetime / LOOT_BOX_LIFETIME;
        ctx.strokeStyle = this.lifetime <= 3 ? '#ff0000' : '#00ff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -this.radius - 10, 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timerProgress);
        ctx.stroke();

        // Timer background
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -this.radius - 10, 8, 0, Math.PI * 2);
        ctx.stroke();

        // Time text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.ceil(this.lifetime).toString(), 0, -this.radius - 10);

        ctx.restore();
    }
}

class LootBoxManager {
    constructor() {
        this.pool = new ObjectPool(
            () => new LootBox(),
            (box) => box.reset(),
            20
        );
    }

    // Try to spawn a loot box (1% chance)
    trySpawn(x, y) {
        if (Math.random() < LOOT_DROP_CHANCE) {
            return this.spawn(x, y);
        }
        return null;
    }

    spawn(x, y) {
        const box = this.pool.get();
        box.init(x, y);
        return box;
    }

    update(dt) {
        const active = this.pool.getActive();
        for (let i = active.length - 1; i >= 0; i--) {
            if (!active[i].update(dt)) {
                this.pool.release(active[i]);
            }
        }
    }

    checkPickups(playerX, playerY, playerRadius) {
        const active = this.pool.getActive();
        for (const box of active) {
            const weapon = box.checkPickup(playerX, playerY, playerRadius);
            if (weapon) {
                return weapon;
            }
        }
        return null;
    }

    draw(ctx) {
        const active = this.pool.getActive();
        for (const box of active) {
            box.draw(ctx);
        }
    }

    getActive() {
        return this.pool.getActive();
    }

    clear() {
        this.pool.releaseAll();
    }
}
