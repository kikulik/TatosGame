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
        damage: 1,
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
    rocketLauncher: {
        name: 'Rocket Launcher',
        fireRate: 1.2,
        damage: 10,
        speed: 400,
        bulletSize: 10,
        spread: 0,
        bulletsPerShot: 1,
        color: '#ff0000',
        trailColor: 'rgba(255, 100, 0, 0.9)',
        isExplosive: true,
        explosionRadius: 100,
        isFlame: false,
        range: Infinity,
        soundType: 'rocket'
    },
    flamethrower: {
        name: 'Flamethrower',
        fireRate: 0.03,
        damage: 0.5,
        speed: 500,
        bulletSize: 8,
        spread: 0.4,
        bulletsPerShot: 1,
        color: '#ff4400',
        trailColor: 'rgba(255, 100, 0, 0.6)',
        isExplosive: false,
        isFlame: true,
        range: 250,
        soundType: 'flame'
    },
    doubleMinigun: {
        name: 'Double Minigun',
        fireRate: 0.04,
        damage: 1,
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
    }

    shoot(x, y, angle, bulletManager) {
        const bullets = [];

        if (this.type === 'doubleMinigun') {
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
            bullets.push(bulletManager.spawnWeaponBullet(x, y, spreadAngle, this));
        }

        return bullets;
    }
}

// Loot drop probabilities (must sum to 100)
const WeaponDropRates = {
    shotgun: 40,
    uzi: 30,
    rocketLauncher: 15,
    flamethrower: 10,
    doubleMinigun: 5
};

// Function to get random weapon from loot box
function getRandomWeaponDrop() {
    const roll = Utils.random(0, 100);
    let cumulative = 0;

    for (const [weapon, rate] of Object.entries(WeaponDropRates)) {
        cumulative += rate;
        if (roll < cumulative) {
            return weapon;
        }
    }

    return 'shotgun'; // Fallback
}
