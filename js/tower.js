// Tower System for Zombie Apocalypse Game
// Auto-shooting defensive tower that targets zombies

class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 18;
        this.alive = true;
        this.lifetime = 30; // 30 seconds duration
        this.timeAlive = 0;

        // Combat stats
        this.fireRate = 2; // shots per second -> 0.5s between shots
        this.fireCooldown = 0;
        this.damage = 0.5;
        this.range = 400; // targeting range

        // Visual
        this.angle = 0;
        this.barrelFlash = 0;
    }

    update(dt, zombies, boss, bulletManager) {
        if (!this.alive) return;

        this.timeAlive += dt;
        if (this.timeAlive >= this.lifetime) {
            this.destroy();
            return;
        }

        this.barrelFlash = Math.max(0, this.barrelFlash - dt * 5);

        if (this.fireCooldown > 0) {
            this.fireCooldown -= dt;
        }

        if (this.fireCooldown <= 0) {
            // Find closest target
            const target = this.findTarget(zombies, boss);
            if (target) {
                this.shootAt(target, bulletManager);
                this.fireCooldown = 1 / this.fireRate;
            }
        }
    }

    findTarget(zombies, boss) {
        let closest = null;
        let closestDist = this.range;

        // Check zombies
        for (const zombie of zombies) {
            if (!zombie.alive) continue;
            const dist = Utils.distance(this.x, this.y, zombie.x, zombie.y);
            if (dist < closestDist) {
                closestDist = dist;
                closest = { x: zombie.x, y: zombie.y, entity: zombie };
            }
        }

        // Check boss
        if (boss && boss.alive) {
            const dist = Utils.distance(this.x, this.y, boss.x, boss.y);
            if (dist < closestDist) {
                closestDist = dist;
                closest = { x: boss.x, y: boss.y, entity: boss };
            }
        }

        return closest;
    }

    shootAt(target, bulletManager) {
        const angle = Utils.angle(this.x, this.y, target.x, target.y);
        this.angle = angle;
        this.barrelFlash = 1;

        // Spawn a tower bullet that never misses - aim directly at the target
        const bullet = bulletManager.spawnWeaponBullet(
            this.x + Math.cos(angle) * (this.radius + 5),
            this.y + Math.sin(angle) * (this.radius + 5),
            angle,
            {
                speed: 1200,
                damage: this.damage,
                bulletSize: 3,
                color: '#00ccff',
                trailColor: 'rgba(0, 204, 255, 0.6)',
                isExplosive: false,
                explosionRadius: 0,
                isFlame: false,
                range: this.range + 50,
                type: 'tower',
                hasAfterburn: false,
                afterburnDamage: 0,
                afterburnDuration: 0
            }
        );

        // Muzzle flash
        Particles.muzzleFlash(
            this.x + Math.cos(angle) * (this.radius + 5),
            this.y + Math.sin(angle) * (this.radius + 5),
            angle
        );
    }

    destroy() {
        this.alive = false;
        Particles.explosion(this.x, this.y, 15, 1);
        Effects.addText(this.x, this.y - 30, 'TOWER DESTROYED', '#ff4444', 1, 14);
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Tower range indicator (faint)
        ctx.strokeStyle = 'rgba(0, 204, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, this.range, 0, Math.PI * 2);
        ctx.stroke();

        // Base
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner ring
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Barrel
        ctx.rotate(this.angle);
        ctx.fillStyle = this.barrelFlash > 0 ? '#00ffff' : '#666';
        ctx.fillRect(0, -2, this.radius + 10, 4);

        // Barrel tip
        ctx.fillStyle = '#00ccff';
        ctx.beginPath();
        ctx.arc(this.radius + 10, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Timer bar above tower
        const timeLeft = Math.max(0, this.lifetime - this.timeAlive);
        const timePercent = timeLeft / this.lifetime;
        const barWidth = 30;
        const barHeight = 3;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 8;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = timePercent > 0.3 ? '#00ccff' : '#ff4444';
        ctx.fillRect(barX, barY, barWidth * timePercent, barHeight);
    }
}

class TowerManager {
    constructor() {
        this.towers = [];
    }

    placeTower(x, y) {
        const tower = new Tower(x, y);
        this.towers.push(tower);
        Effects.addText(x, y - 40, 'TOWER PLACED!', '#00ccff', 1.5, 18);
        Particles.deathBurst(x, y, '#00ccff', 10);
        return tower;
    }

    update(dt, zombieManager, bossManager, bulletManager) {
        const zombies = zombieManager ? zombieManager.zombies || [] : [];
        const boss = bossManager ? bossManager.getBoss() : null;

        for (let i = this.towers.length - 1; i >= 0; i--) {
            this.towers[i].update(dt, zombies, boss, bulletManager);
            if (!this.towers[i].alive) {
                this.towers.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const tower of this.towers) {
            tower.draw(ctx);
        }
    }

    clear() {
        this.towers = [];
    }

    getCount() {
        return this.towers.length;
    }
}
