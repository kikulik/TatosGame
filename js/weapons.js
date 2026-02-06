// Weapons System for Zombie Apocalypse Game

// Weapon Types and their configurations
const WeaponTypes = {
    pistol: {
        name: 'Pistol',
        fireRate: 0.15,
        damage: 1,
        speed: 800,
        bulletSize: 4,
        spread: 0,
        bulletsPerShot: 1,
        color: '#ffff00',
        trailColor: 'rgba(255, 255, 0, 0.8)',
        isExplosive: false,
        isFlame: false,
        range: Infinity,
        soundType: 'pistol'
    },
    uzi: {
        name: 'Uzi',
        fireRate: 0.05,
        damage: 0.5, // Half damage of normal gun
        speed: 900,
        bulletSize: 3,
        spread: 0.15,
        bulletsPerShot: 1,
        color: '#00ffff',
        trailColor: 'rgba(0, 255, 255, 0.8)',
        isExplosive: false,
        isFlame: false,
        range: Infinity,
        soundType: 'uzi'
    },
    shotgun: {
        name: 'Shotgun',
        fireRate: 0.6,
        damage: 2,
        speed: 700,
        bulletSize: 5,
        spread: 0.3,
        bulletsPerShot: 8,
        color: '#ff8800',
        trailColor: 'rgba(255, 136, 0, 0.8)',
        isExplosive: false,
        isFlame: false,
        range: 400,
        soundType: 'shotgun'
    },
    bow: {
        name: 'Bow',
        fireRate: 0.5,
        damage: 1.5,
        speed: 650,
        bulletSize: 5,
        spread: 0,
        bulletsPerShot: 1,
        color: '#88cc44',
        trailColor: 'rgba(136, 204, 68, 0.8)',
        isExplosive: false,
        isFlame: false,
        range: 550,
        soundType: 'bow'
    },
    rocketLauncher: {
        name: 'Rocket Launcher',
        fireRate: 1.2,
        damage: 3,
        speed: 400,
        bulletSize: 10,
        spread: 0,
        bulletsPerShot: 1,
        color: '#ff0000',
        trailColor: 'rgba(255, 100, 0, 0.9)',
        isExplosive: true,
        explosionRadius: 150,
        isFlame: false,
        range: Infinity,
        soundType: 'rocket'
    },
    flamethrower: {
        name: 'Flamethrower',
        fireRate: 0.03,
        damage: 0.65, // -35% damage than normal gun
        speed: 500,
        bulletSize: 8,
        spread: 0.4,
        bulletsPerShot: 1,
        color: '#ff4400',
        trailColor: 'rgba(255, 100, 0, 0.6)',
        isExplosive: false,
        isFlame: true,
        hasAfterburn: true, // Causes afterburn damage over time
        afterburnDamage: 0.2, // Damage per tick
        afterburnDuration: 3, // Duration in seconds
        range: 312, // 25% more range
        soundType: 'flame'
    },
    doubleMinigun: {
        name: 'Double Minigun',
        fireRate: 0.04,
        damage: 0.5, // Half damage of normal gun
        speed: 1000,
        bulletSize: 4,
        spread: 0.1,
        bulletsPerShot: 2,
        color: '#ff00ff',
        trailColor: 'rgba(255, 0, 255, 0.8)',
        isExplosive: false,
        isFlame: false,
        range: Infinity,
        soundType: 'minigun',
        dualOffset: 8
    },
    tripleMinigun: {
        name: 'Triple Minigun',
        fireRate: 0.035,
        damage: 0.5, // Half damage of normal gun
        speed: 1100,
        bulletSize: 4,
        spread: 0.12,
        bulletsPerShot: 3,
        color: '#00ff88',
        trailColor: 'rgba(0, 255, 136, 0.8)',
        isExplosive: false,
        isFlame: false,
        range: Infinity,
        soundType: 'minigun',
        tripleOffset: 10
    }
};

// Weapon class to manage player's current weapon
class Weapon {
    constructor(type = 'pistol') {
        this.setType(type);
        this.ammo = Infinity; // Unlimited ammo for all weapons
    }

    setType(type) {
        this.type = type;
        const config = WeaponTypes[type];
        this.name = config.name;
        this.fireRate = config.fireRate;
        this.damage = config.damage;
        this.speed = config.speed;
        this.bulletSize = config.bulletSize;
        this.spread = config.spread;
        this.bulletsPerShot = config.bulletsPerShot;
        this.color = config.color;
        this.trailColor = config.trailColor;
        this.isExplosive = config.isExplosive;
        this.explosionRadius = config.explosionRadius || 0;
        this.isFlame = config.isFlame;
        this.range = config.range;
        this.soundType = config.soundType;
        this.dualOffset = config.dualOffset || 0;
        this.tripleOffset = config.tripleOffset || 0;
        this.hasAfterburn = config.hasAfterburn || false;
        this.afterburnDamage = config.afterburnDamage || 0;
        this.afterburnDuration = config.afterburnDuration || 0;
    }

    shoot(x, y, angle, bulletManager, targetX = null, targetY = null) {
        const bullets = [];

        if (this.type === 'tripleMinigun') {
            // Triple guns - shoot from three positions
            const perpAngle = angle + Math.PI / 2;
            const offset1X = Math.cos(perpAngle) * this.tripleOffset;
            const offset1Y = Math.sin(perpAngle) * this.tripleOffset;
            const offset2X = Math.cos(perpAngle) * -this.tripleOffset;
            const offset2Y = Math.sin(perpAngle) * -this.tripleOffset;

            const spreadAngle1 = angle + Utils.random(-this.spread, this.spread);
            const spreadAngle2 = angle + Utils.random(-this.spread, this.spread);
            const spreadAngle3 = angle + Utils.random(-this.spread, this.spread);

            bullets.push(bulletManager.spawnWeaponBullet(
                x + offset1X, y + offset1Y, spreadAngle1, this
            ));
            bullets.push(bulletManager.spawnWeaponBullet(
                x, y, spreadAngle2, this
            ));
            bullets.push(bulletManager.spawnWeaponBullet(
                x + offset2X, y + offset2Y, spreadAngle3, this
            ));
        } else if (this.type === 'doubleMinigun') {
            // Dual guns - shoot from two positions
            const perpAngle = angle + Math.PI / 2;
            const offset1X = Math.cos(perpAngle) * this.dualOffset;
            const offset1Y = Math.sin(perpAngle) * this.dualOffset;
            const offset2X = Math.cos(perpAngle) * -this.dualOffset;
            const offset2Y = Math.sin(perpAngle) * -this.dualOffset;

            const spreadAngle1 = angle + Utils.random(-this.spread, this.spread);
            const spreadAngle2 = angle + Utils.random(-this.spread, this.spread);

            bullets.push(bulletManager.spawnWeaponBullet(
                x + offset1X, y + offset1Y, spreadAngle1, this
            ));
            bullets.push(bulletManager.spawnWeaponBullet(
                x + offset2X, y + offset2Y, spreadAngle2, this
            ));
        } else if (this.bulletsPerShot > 1) {
            // Shotgun-style spread
            const spreadStep = (this.spread * 2) / (this.bulletsPerShot - 1);
            const startAngle = angle - this.spread;

            for (let i = 0; i < this.bulletsPerShot; i++) {
                const bulletAngle = startAngle + spreadStep * i + Utils.random(-0.05, 0.05);
                bullets.push(bulletManager.spawnWeaponBullet(x, y, bulletAngle, this));
            }
        } else {
            // Single bullet with optional spread
            const spreadAngle = angle + Utils.random(-this.spread, this.spread);
            // For rockets, pass target coordinates so they explode at click location
            if (this.isExplosive && targetX !== null && targetY !== null) {
                bullets.push(bulletManager.spawnWeaponBullet(x, y, spreadAngle, this, targetX, targetY));
            } else {
                bullets.push(bulletManager.spawnWeaponBullet(x, y, spreadAngle, this));
            }
        }

        return bullets;
    }

    getData() {
        return {
            type: this.type,
            name: this.name,
            fireRate: this.fireRate,
            damage: this.damage,
            speed: this.speed,
            bulletSize: this.bulletSize,
            spread: this.spread,
            bulletsPerShot: this.bulletsPerShot,
            color: this.color,
            trailColor: this.trailColor,
            isExplosive: this.isExplosive,
            explosionRadius: this.explosionRadius,
            isFlame: this.isFlame,
            range: this.range,
            soundType: this.soundType,
            dualOffset: this.dualOffset,
            tripleOffset: this.tripleOffset,
            hasAfterburn: this.hasAfterburn,
            afterburnDamage: this.afterburnDamage,
            afterburnDuration: this.afterburnDuration
        };
    }
}

// Loot drop probabilities (relative weights)
const WeaponDropRates = {
    shotgun: 25,
    bow: 20,
    rocketLauncher: 15,
    uzi: 15,
    flamethrower: 8,
    doubleMinigun: 5,
    tripleMinigun: 2
};

// Function to get random weapon from loot box
function getRandomWeaponDrop() {
    const entries = Object.entries(WeaponDropRates);
    const total = entries.reduce((sum, [, rate]) => sum + rate, 0);
    const roll = Utils.random(0, total);
    let cumulative = 0;

    for (const [weapon, rate] of entries) {
        cumulative += rate;
        if (roll < cumulative) {
            return weapon;
        }
    }

    return entries[0][0]; // Fallback
}
