// Utility Functions for Zombie Apocalypse Game

// Constants - dynamic based on window size
let GAME_WIDTH = window.innerWidth;
let GAME_HEIGHT = window.innerHeight;
const LEVEL_DURATION = 60; // 1 minute in seconds

// Math Utilities
const Utils = {
    // Get distance between two points
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    // Get angle between two points
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    // Normalize a vector
    normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    },

    // Random number between min and max
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    // Random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Random element from array
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    // Lerp between two values
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    // Check if two circles collide
    circleCollision(x1, y1, r1, x2, y2, r2) {
        return this.distance(x1, y1, x2, y2) < r1 + r2;
    },

    // Get spawn position outside screen
    getSpawnPosition(margin = 50) {
        const side = this.randomInt(0, 3);
        let x, y;

        switch (side) {
            case 0: // Top
                x = this.random(0, GAME_WIDTH);
                y = -margin;
                break;
            case 1: // Right
                x = GAME_WIDTH + margin;
                y = this.random(0, GAME_HEIGHT);
                break;
            case 2: // Bottom
                x = this.random(0, GAME_WIDTH);
                y = GAME_HEIGHT + margin;
                break;
            case 3: // Left
                x = -margin;
                y = this.random(0, GAME_HEIGHT);
                break;
        }

        return { x, y };
    },

    // Get random position around player (for close spawns)
    getCloseSpawnPosition(playerX, playerY, minDist = 250, maxDist = 400) {
        const angle = this.random(0, Math.PI * 2);
        const dist = this.random(minDist, maxDist);
        return {
            x: playerX + Math.cos(angle) * dist,
            y: playerY + Math.sin(angle) * dist
        };
    },

    // Format time as M:SS
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // Ease in-out function
    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },

    // Screen shake helper
    screenShake: {
        intensity: 0,
        duration: 0,
        offsetX: 0,
        offsetY: 0,

        shake(intensity, duration) {
            this.intensity = intensity;
            this.duration = duration;
        },

        update(dt) {
            if (this.duration > 0) {
                this.duration -= dt;
                this.offsetX = Utils.random(-this.intensity, this.intensity);
                this.offsetY = Utils.random(-this.intensity, this.intensity);
            } else {
                this.offsetX = 0;
                this.offsetY = 0;
            }
        }
    }
};

// Object Pool for performance
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 100) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];

        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    get() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        this.active.push(obj);
        return obj;
    }

    release(obj) {
        const index = this.active.indexOf(obj);
        if (index > -1) {
            this.active.splice(index, 1);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }

    releaseAll() {
        while (this.active.length > 0) {
            const obj = this.active.pop();
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }

    getActive() {
        return this.active;
    }
}

// Color utilities
const Colors = {
    player: '#00ff00',
    bullet: '#ffff00',
    muzzleFlash: '#ff8800',

    weapons: {
        pistol: '#ffff00',
        uzi: '#00ffff',
        shotgun: '#ff8800',
        rocketLauncher: '#ff0000',
        flamethrower: '#ff4400',
        doubleMinigun: '#ff00ff',
        tripleMinigun: '#00ff88'
    },

    lootBox: {
        normal: '#FFD700',
        warning: '#ff0000',
        glow: 'rgba(255, 215, 0, 0.4)'
    },

    zombies: {
        walker: '#8B4513',
        runner: '#556B2F',
        flying: '#4B0082',
        berserker: '#8B0000',
        car: '#696969',
        jumper: '#2F4F4F',
        helicopter: '#708090',
        diveBomber: '#800080',
        tank: '#505050',
        teleporter: '#9400D3',
        shielded: '#4682B4'
    },

    bosses: {
        bigBernie: '#654321',
        sprintSally: '#32CD32',
        skyReaper: '#191970',
        rageKing: '#B22222',
        monsterTruck: '#2F4F4F',
        chopperCommander: '#778899',
        hordeMaster: '#8B008B',
        tacticalNightmare: '#4B0082',
        chaosIncarnate: '#FF1493',
        omega: '#FFD700'
    },

    particles: {
        blood: ['#8B0000', '#B22222', '#DC143C'],
        explosion: ['#FF4500', '#FF6347', '#FFA500', '#FFD700'],
        smoke: ['#696969', '#808080', '#A9A9A9'],
        spark: ['#FFD700', '#FFA500', '#FF4500']
    },

    // Level-themed environment colors
    levelThemes: {
        1:  { bg: '#111a11', grid: 'rgba(30, 70, 30, 0.3)', vignette: 'rgba(0, 20, 0, 0.6)', ambient: '#2a5a2a', ambientAlt: '#1a3a1a', name: 'forest' },
        2:  { bg: '#1a1a11', grid: 'rgba(70, 70, 30, 0.3)', vignette: 'rgba(20, 20, 0, 0.6)', ambient: '#5a5a2a', ambientAlt: '#3a3a1a', name: 'dusk' },
        3:  { bg: '#111118', grid: 'rgba(30, 30, 80, 0.3)', vignette: 'rgba(0, 0, 30, 0.6)', ambient: '#3a3a7a', ambientAlt: '#2a2a5a', name: 'night' },
        4:  { bg: '#1a1111', grid: 'rgba(80, 30, 30, 0.3)', vignette: 'rgba(30, 0, 0, 0.6)', ambient: '#7a2a2a', ambientAlt: '#5a1a1a', name: 'rage' },
        5:  { bg: '#151515', grid: 'rgba(60, 60, 60, 0.3)', vignette: 'rgba(10, 10, 10, 0.6)', ambient: '#555555', ambientAlt: '#333333', name: 'urban' },
        6:  { bg: '#0f1520', grid: 'rgba(30, 50, 80, 0.3)', vignette: 'rgba(0, 10, 30, 0.7)', ambient: '#2a4a7a', ambientAlt: '#1a3060', name: 'sky' },
        7:  { bg: '#1a0f0f', grid: 'rgba(70, 25, 25, 0.3)', vignette: 'rgba(25, 0, 0, 0.7)', ambient: '#6a2020', ambientAlt: '#4a1010', name: 'horde' },
        8:  { bg: '#0f0f1a', grid: 'rgba(40, 30, 80, 0.3)', vignette: 'rgba(10, 0, 30, 0.7)', ambient: '#4a2a8a', ambientAlt: '#2a1a5a', name: 'tactical' },
        9:  { bg: '#1a0a1a', grid: 'rgba(80, 20, 80, 0.3)', vignette: 'rgba(30, 0, 30, 0.7)', ambient: '#8a2a8a', ambientAlt: '#5a1a5a', name: 'chaos' },
        10: { bg: '#0a0a0a', grid: 'rgba(80, 60, 10, 0.25)', vignette: 'rgba(0, 0, 0, 0.8)', ambient: '#aa7700', ambientAlt: '#773300', name: 'apocalypse' }
    }
};
