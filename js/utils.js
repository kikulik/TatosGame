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
    getCloseSpawnPosition(playerX, playerY, minDist = 150, maxDist = 250) {
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
    }
};
