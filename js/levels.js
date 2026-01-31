// Level Configuration for Zombie Apocalypse Game

const LevelConfig = {
    // Level 1: The Awakening
    1: {
        name: 'The Awakening',
        theme: 'Basic shambling zombies, slow tutorial-like pace',
        zombieTypes: [
            { type: 'walker', weight: 100 }
        ],
        spawnInterval: 3.0,
        bossSpawnTime: 50, // Boss spawns at 30 seconds remaining
        description: [
            'Basic Walkers - Slow, predictable movement',
            'Boss: Big Bernie - Large zombie that spawns smaller ones'
        ]
    },

    // Level 2: Speed Demons
    2: {
        name: 'Speed Demons',
        theme: 'Introduction to faster threats',
        zombieTypes: [
            { type: 'walker', weight: 60 },
            { type: 'runner', weight: 40 }
        ],
        spawnInterval: 2.5,
        bossSpawnTime: 50,
        description: [
            'Basic Walkers (60%)',
            'Runners (40%) - Fast zigzag movement',
            'Boss: Sprint Sally - Ultra-fast circling zombie'
        ]
    },

    // Level 3: From Above
    3: {
        name: 'From Above',
        theme: 'Aerial assault begins',
        zombieTypes: [
            { type: 'walker', weight: 40 },
            { type: 'runner', weight: 30 },
            { type: 'flying', weight: 30 }
        ],
        spawnInterval: 2.0,
        bossSpawnTime: 50,
        description: [
            'Basic Walkers (40%)',
            'Runners (30%)',
            'Flying Zombies (30%) - Swooping movement',
            'Boss: Sky Reaper - Drops flying zombies'
        ]
    },

    // Level 4: Mad Rush
    4: {
        name: 'Mad Rush',
        theme: 'Aggressive berserker zombies',
        zombieTypes: [
            { type: 'walker', weight: 30 },
            { type: 'runner', weight: 20 },
            { type: 'flying', weight: 20 },
            { type: 'berserker', weight: 30 }
        ],
        spawnInterval: 1.8,
        bossSpawnTime: 50,
        description: [
            'Basic Walkers (30%)',
            'Runners (20%)',
            'Flying Zombies (20%)',
            'Berserkers (30%) - Charge attacks',
            'Boss: Rage King - Shockwave attacks'
        ]
    },

    // Level 5: Vehicle Mayhem
    5: {
        name: 'Vehicle Mayhem',
        theme: 'Zombies in vehicles',
        zombieTypes: [
            { type: 'walker', weight: 30 },
            { type: 'runner', weight: 25 },
            { type: 'flying', weight: 15 },
            { type: 'car', weight: 8 }, // Reduced from 25 - cars are now rare
            { type: 'jumper', weight: 22 }
        ],
        spawnInterval: 1.5,
        bossSpawnTime: 50,
        description: [
            'Mixed ground zombies (50%)',
            'Zombie Cars (25%) - Release zombies on death',
            'Jumpers (25%) - Leap attacks',
            'Boss: Monster Truck Mike - Armored vehicle'
        ]
    },

    // Level 6: Helicopter Hell
    6: {
        name: 'Helicopter Hell',
        theme: 'Air superiority',
        zombieTypes: [
            { type: 'walker', weight: 20 },
            { type: 'runner', weight: 10 },
            { type: 'berserker', weight: 10 },
            { type: 'flying', weight: 20 },
            { type: 'helicopter', weight: 20 },
            { type: 'diveBomber', weight: 20 }
        ],
        spawnInterval: 1.3,
        bossSpawnTime: 50,
        description: [
            'Mixed ground zombies (40%)',
            'Flying Zombies (20%)',
            'Helicopters (20%) - Drop zombies',
            'Dive Bombers (20%) - Kamikaze attacks',
            'Boss: Chopper Commander - Attack helicopter'
        ]
    },

    // Level 7: The Horde
    7: {
        name: 'The Horde',
        theme: 'Overwhelming numbers',
        zombieTypes: [
            { type: 'walker', weight: 20 },
            { type: 'runner', weight: 20 },
            { type: 'flying', weight: 15 },
            { type: 'berserker', weight: 15 },
            { type: 'jumper', weight: 15 },
            { type: 'diveBomber', weight: 15 }
        ],
        spawnInterval: 0.6, // Spawns 2 every 1.2 seconds
        spawnCount: 2,
        bossSpawnTime: 50,
        enableSwarms: true,
        description: [
            'All zombie types in random combinations',
            'Mini-swarms: groups of 3-5 spawn together',
            'Boss: Horde Master - Splits when damaged'
        ]
    },

    // Level 8: Elite Squad
    8: {
        name: 'Elite Squad',
        theme: 'Tactical zombie variants',
        zombieTypes: [
            { type: 'walker', weight: 15 },
            { type: 'runner', weight: 15 },
            { type: 'flying', weight: 10 },
            { type: 'berserker', weight: 10 },
            { type: 'tank', weight: 20 },
            { type: 'teleporter', weight: 15 },
            { type: 'shielded', weight: 15 }
        ],
        spawnInterval: 1.0,
        bossSpawnTime: 50,
        description: [
            'Tank Zombies (20%) - Heavy armor',
            'Teleporters (15%) - Blink movement',
            'Shielded Zombies (15%) - Front shield',
            'Boss: Tactical Nightmare - Teleports, spawns shields'
        ]
    },

    // Level 9: Chaos Theory
    9: {
        name: 'Chaos Theory',
        theme: 'Pure randomness and unpredictability',
        zombieTypes: [
            { type: 'walker', weight: 10 },
            { type: 'runner', weight: 12 },
            { type: 'flying', weight: 12 },
            { type: 'berserker', weight: 12 },
            { type: 'jumper', weight: 10 },
            { type: 'diveBomber', weight: 10 },
            { type: 'tank', weight: 10 },
            { type: 'teleporter', weight: 12 },
            { type: 'shielded', weight: 12 }
        ],
        spawnInterval: 0.4, // 2-3 every 0.8-1.2 seconds
        spawnCount: 2,
        enableCloseSpawns: true,
        bossSpawnTime: 50,
        description: [
            'ALL zombie types randomly mixed',
            'Random spawn points around arena',
            'Some spawn close to player',
            'Boss: Chaos Incarnate - Shape-shifting boss'
        ]
    },

    // Level 10: Apocalypse
    10: {
        name: 'Apocalypse',
        theme: 'The ultimate survival test',
        zombieTypes: [
            { type: 'walker', weight: 10 },
            { type: 'runner', weight: 12 },
            { type: 'flying', weight: 12 },
            { type: 'berserker', weight: 14 },
            { type: 'car', weight: 3 }, // Reduced - cars are rare
            { type: 'jumper', weight: 12 },
            { type: 'helicopter', weight: 8 },
            { type: 'diveBomber', weight: 10 },
            { type: 'tank', weight: 7 },
            { type: 'teleporter', weight: 6 },
            { type: 'shielded', weight: 6 }
        ],
        spawnInterval: 0.15, // 3-4 every 0.5 seconds
        spawnCount: 3,
        enableCloseSpawns: true,
        enableSwarms: true,
        finalRush: true, // Double spawn rate in final 30 seconds
        bossSpawnTime: 50,
        description: [
            'EVERY zombie type simultaneously',
            'Multiple vehicles and helicopters',
            'Final 30 seconds: spawn rate DOUBLES',
            'Boss: The Omega Zombie - ALL abilities combined'
        ]
    }
};

// Level Manager
class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.maxUnlockedLevel = 1;
        this.timeRemaining = LEVEL_DURATION;
        this.spawnTimer = 0;
        this.bossSpawned = false;
        this.levelComplete = false;
        this.swarmTimer = 0;
    }

    reset() {
        this.timeRemaining = LEVEL_DURATION;
        this.spawnTimer = 0;
        this.bossSpawned = false;
        this.levelComplete = false;
        this.swarmTimer = 0;
    }

    setLevel(level) {
        this.currentLevel = Utils.clamp(level, 1, 10);
        this.reset();
    }

    unlockNextLevel() {
        if (this.currentLevel >= this.maxUnlockedLevel) {
            this.maxUnlockedLevel = Math.min(this.currentLevel + 1, 10);
        }
    }

    getConfig() {
        return LevelConfig[this.currentLevel];
    }

    update(dt, zombieManager, bossManager, player) {
        if (this.levelComplete) return;

        this.timeRemaining -= dt;
        this.spawnTimer += dt;

        const config = this.getConfig();

        // Check for level complete
        if (this.timeRemaining <= 0) {
            if (!bossManager.isAlive()) {
                this.levelComplete = true;
                this.unlockNextLevel();
                return 'complete';
            }
        }

        // Spawn boss
        if (!this.bossSpawned && this.timeRemaining <= LEVEL_DURATION - config.bossSpawnTime) {
            bossManager.spawn(this.currentLevel, player.x, player.y);
            this.bossSpawned = true;
        }

        // Regular zombie spawning
        let spawnInterval = config.spawnInterval;

        // Reduce spawn rate by 10% per zombie type
        // (e.g., 5 types = 50% fewer spawns)
        const zombieTypeCount = config.zombieTypes.length;
        const typeReduction = zombieTypeCount * 0.1; // 10% per type
        if (typeReduction > 0 && typeReduction < 1) {
            spawnInterval *= 1 / (1 - typeReduction);
        }

        // Final rush for level 10
        if (config.finalRush && this.timeRemaining <= 30) {
            spawnInterval /= 2;
        }

        if (this.spawnTimer >= spawnInterval && this.timeRemaining > 0) {
            this.spawnTimer = 0;

            // 3x spawn rate before boss, 1x after boss spawns
            const baseSpawnCount = config.spawnCount || 1;
            const spawnMultiplier = this.bossSpawned ? 1 : 3;
            const spawnCount = baseSpawnCount * spawnMultiplier;

            for (let i = 0; i < spawnCount; i++) {
                const zombieType = this.selectZombieType(config.zombieTypes);

                let spawnPos;
                if (config.enableCloseSpawns && Math.random() < 0.2) {
                    spawnPos = Utils.getCloseSpawnPosition(player.x, player.y);
                } else {
                    spawnPos = Utils.getSpawnPosition();
                }

                zombieManager.spawn(zombieType, spawnPos.x, spawnPos.y, player.x, player.y);
            }

            // Swarm spawning
            if (config.enableSwarms) {
                this.swarmTimer += spawnInterval;
                if (this.swarmTimer >= 8) {
                    this.swarmTimer = 0;
                    this.spawnSwarm(zombieManager, player, config);
                }
            }
        }

        // Spawn minions from boss
        const minions = bossManager.getMinionsToSpawn();
        for (const minion of minions) {
            zombieManager.spawn(minion.type, minion.x, minion.y, player.x, player.y);
        }

        return null;
    }

    selectZombieType(zombieTypes) {
        const totalWeight = zombieTypes.reduce((sum, z) => sum + z.weight, 0);
        let random = Math.random() * totalWeight;

        for (const zombie of zombieTypes) {
            random -= zombie.weight;
            if (random <= 0) {
                return zombie.type;
            }
        }

        return zombieTypes[0].type;
    }

    spawnSwarm(zombieManager, player, config) {
        const swarmSize = Utils.randomInt(3, 5);
        const swarmType = this.selectZombieType(config.zombieTypes);
        const basePos = Utils.getSpawnPosition();

        for (let i = 0; i < swarmSize; i++) {
            const offset = {
                x: Utils.random(-30, 30),
                y: Utils.random(-30, 30)
            };
            zombieManager.spawn(
                swarmType,
                basePos.x + offset.x,
                basePos.y + offset.y,
                player.x,
                player.y
            );
        }
    }

    getTimeRemaining() {
        return Math.max(0, this.timeRemaining);
    }

    getLevelName() {
        return LevelConfig[this.currentLevel].name;
    }

    getLevelTheme() {
        return LevelConfig[this.currentLevel].theme;
    }

    getLevelDescription() {
        return LevelConfig[this.currentLevel].description;
    }

    isLastLevel() {
        return this.currentLevel === 10;
    }

    nextLevel() {
        if (this.currentLevel < 10) {
            this.currentLevel++;
            this.reset();
            return true;
        }
        return false;
    }
}
