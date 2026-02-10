// Main Game Controller for Zombie Apocalypse Game

class Game {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = GAME_WIDTH;
        this.canvas.height = GAME_HEIGHT;

        // Game state
        this.state = 'menu'; // menu, playing, paused, gameOver, levelComplete, victory
        this.lastTime = 0;
        this.deltaTime = 0;

        // Game objects
        this.player = null;
        this.bulletManager = null;
        this.zombieManager = null;
        this.bossManager = null;
        this.levelManager = null;
        this.lootBoxManager = null;
        this.wallManager = null;

        // Score tracking
        this.score = 0;
        this.kills = 0;
        this.combo = 1;
        this.bestCombo = 1;
        this.comboTimer = 0;
        this.comboTimeout = 2; // Seconds before combo resets
        this.totalKills = 0;
        this.totalScore = 0;
        this.timeSurvived = 0;

        // Input tracking
        this.mouseX = GAME_WIDTH / 2;
        this.mouseY = GAME_HEIGHT / 2;

        // Player name
        this.playerName = 'Anonymous';

        // Boss kill animation
        this.bossKillAnimationTimer = 0;
        this.bossKillAnimationDuration = 2; // 2 seconds of animation
        this.showingBossKillAnimation = false;

        // Ambient particles for background
        this.ambientParticles = [];
        this.groundDecals = [];
        this.maxDecals = 60;
        this.bossArenaTimer = 0;

        // Inventory state
        this.inventoryOpen = false;

        // Upgrade system
        this.killsSpentOnUpgrades = 0;

        // Initialize
        this.init();
    }

    init() {
        // Create game objects
        this.player = new Player(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.bulletManager = new BulletManager();
        this.zombieManager = new ZombieManager();
        this.bossManager = new BossManager();
        this.levelManager = new LevelManager();
        this.lootBoxManager = new LootBoxManager();
        this.wallManager = new WallManager();

        // Setup input handlers
        this.setupInputHandlers();

        // Setup resize handler for full screen
        this.setupResizeHandler();

        // Setup UI callbacks
        UI.init({
            onStartGame: () => this.startGame(),
            onSelectLevel: (level) => this.startLevel(level),
            onBeginLevel: () => this.beginLevel(),
            onResume: () => this.resume(),
            onRestart: () => this.restartLevel(),
            onQuit: () => this.quitToMenu(),
            onNextLevel: () => this.nextLevel(),
            onCloseInventory: () => this.closeInventory()
        });

        // Initialize audio
        Audio.init();

        // Initialize ambient particles
        this.initAmbientParticles();

        // Start game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    setupResizeHandler() {
        const resize = () => {
            GAME_WIDTH = window.innerWidth;
            GAME_HEIGHT = window.innerHeight;
            this.canvas.width = GAME_WIDTH;
            this.canvas.height = GAME_HEIGHT;
        };

        window.addEventListener('resize', resize);
        resize(); // Initial resize
    }

    setupInputHandlers() {
        // Mouse move
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) * (GAME_WIDTH / rect.width);
            this.mouseY = (e.clientY - rect.top) * (GAME_HEIGHT / rect.height);
        });

        // Mouse down
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                Audio.resume();
                if (this.state === 'playing') {
                    this.player.setMouseDown(true);
                }
            }
        });

        // Mouse up
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.player.setMouseDown(false);
            }
        });

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (this.state === 'playing') {
                // Handle E key: pickup weapon if nearby, otherwise toggle inventory
                if (e.code === 'KeyE') {
                    if (!this.inventoryOpen && this.lootBoxManager.hasPickupAvailable()) {
                        this.tryPickupLoot();
                    } else {
                        this.toggleInventory();
                    }
                    return;
                }

                // Skip other inputs if inventory is open
                if (this.inventoryOpen) {
                    if (e.code === 'Escape') {
                        this.closeInventory();
                    }
                    return;
                }

                this.player.handleKeyDown(e.code);

                // Dash with Q
                if (e.code === 'KeyQ') {
                    this.player.dash(this.mouseX, this.mouseY);
                }

                // Pickup with F
                if (e.code === 'KeyF') {
                    this.tryPickupLoot();
                }

                if (e.code === 'Space') {
                    this.pause();
                }

                if (e.code === 'KeyR') {
                    this.restartLevel();
                }
            } else if (this.state === 'paused') {
                if (e.code === 'Space' || e.code === 'Escape') {
                    this.resume();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.player.handleKeyUp(e.code);
        });

        // Click anywhere to initialize audio
        document.addEventListener('click', () => {
            Audio.init();
            Audio.resume();
        }, { once: true });
    }

    startGame() {
        this.totalKills = 0;
        this.totalScore = 0;
        this.killsSpentOnUpgrades = 0;
        this.playerName = UI.getPlayerName();
        this.levelManager.setLevel(1);
        // Full reset - no inventory preservation
        this.player.reset(GAME_WIDTH / 2, GAME_HEIGHT / 2, false);
        this.showLevelIntro();
    }

    startLevel(level) {
        this.levelManager.setLevel(level);
        this.showLevelIntro();
    }

    showLevelIntro() {
        const config = this.levelManager.getConfig();
        UI.showLevelIntro(
            this.levelManager.currentLevel,
            this.levelManager.getLevelName(),
            this.levelManager.getLevelTheme(),
            this.levelManager.getLevelDescription()
        );
    }

    beginLevel() {
        this.resetLevel(true); // Keep inventory when beginning level
        this.state = 'playing';
        UI.hideAllMenus();
        UI.showHUD();
        UI.updatePlayerNameDisplay(this.playerName);
        Audio.startMusic(this.levelManager.currentLevel);
    }

    resetLevel(keepInventory = false) {
        // Reset player (keep inventory if advancing to next level)
        this.player.reset(GAME_WIDTH / 2, GAME_HEIGHT / 2, keepInventory);

        // Clear game objects
        this.bulletManager.clear();
        this.zombieManager.clear();
        this.bossManager.clear();
        this.lootBoxManager.clear();
        this.wallManager.clear();
        Particles.clear();
        Effects.clear();

        // Generate walls for this level
        this.wallManager.generateForLevel(this.levelManager.currentLevel);

        // Reset level
        this.levelManager.reset();

        // Reset score for level
        this.score = 0;
        this.kills = 0;
        this.combo = 1;
        this.bestCombo = 1;
        this.comboTimer = 0;
        this.timeSurvived = 0;

        // Reset boss kill animation
        this.showingBossKillAnimation = false;
        this.bossKillAnimationTimer = 0;

        // Reset ambient and decals
        this.groundDecals = [];
        this.bossArenaTimer = 0;
        this.initAmbientParticles();
    }

    initAmbientParticles() {
        this.ambientParticles = [];
        const count = 40;
        for (let i = 0; i < count; i++) {
            this.ambientParticles.push({
                x: Utils.random(0, GAME_WIDTH),
                y: Utils.random(0, GAME_HEIGHT),
                size: Utils.random(1, 3),
                speed: Utils.random(5, 20),
                angle: Utils.random(0, Math.PI * 2),
                alpha: Utils.random(0.1, 0.4),
                drift: Utils.random(-0.3, 0.3),
                pulse: Utils.random(0, Math.PI * 2)
            });
        }
    }

    addGroundDecal(x, y, color, size) {
        if (this.groundDecals.length >= this.maxDecals) {
            this.groundDecals.shift();
        }
        this.groundDecals.push({
            x, y, color,
            size: size || Utils.random(8, 20),
            alpha: 0.5,
            age: 0
        });
    }

    // Inventory methods
    toggleInventory() {
        if (this.inventoryOpen) {
            this.closeInventory();
        } else {
            this.openInventory();
        }
    }

    openInventory() {
        this.inventoryOpen = true;
        this.player.shooting = false; // Stop shooting
        const availableKills = this.totalKills + this.kills - this.killsSpentOnUpgrades;
        UI.showInventory(
            this.player.getInventory(),
            this.player.getWeaponType(),
            (weaponType) => this.selectWeaponFromInventory(weaponType),
            this.player.getUpgradeLevel(),
            availableKills,
            () => this.tryUpgrade()
        );
    }

    closeInventory() {
        this.inventoryOpen = false;
        UI.hideInventory();
    }

    selectWeaponFromInventory(weaponType) {
        this.player.equipWeaponFromInventory(weaponType);
        // Refresh inventory display
        const availableKills = this.totalKills + this.kills - this.killsSpentOnUpgrades;
        UI.showInventory(
            this.player.getInventory(),
            this.player.getWeaponType(),
            (wt) => this.selectWeaponFromInventory(wt),
            this.player.getUpgradeLevel(),
            availableKills,
            () => this.tryUpgrade()
        );
    }

    tryUpgrade() {
        const availableKills = this.totalKills + this.kills - this.killsSpentOnUpgrades;
        if (availableKills >= 100 && this.player.getUpgradeLevel() < 3) {
            this.killsSpentOnUpgrades += 100;
            this.player.applyUpgrade();
            const level = this.player.getUpgradeLevel();
            const descriptions = {
                1: 'Fire Rate +20%',
                2: 'Damage +25%',
                3: 'Fire Rate +20%'
            };
            Effects.addText(this.player.x, this.player.y - 40, `UPGRADE: ${descriptions[level]}!`, '#00ffcc', 1.5, 18);
            // Refresh inventory
            this.openInventory();
        }
    }

    // Check if player is hit by enemy bullets
    checkEnemyBulletCollision() {
        if (!this.player.alive) return false;

        const bullets = this.bulletManager.getActive();
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            if (!bullet.active || !bullet.isEnemyBullet) continue;

            if (Utils.circleCollision(
                bullet.x, bullet.y, bullet.radius,
                this.player.x, this.player.y, this.player.radius
            )) {
                // Hit by enemy bullet
                Particles.sparks(bullet.x, bullet.y, bullet.angle + Math.PI, 8);
                bullet.active = false;
                return true; // Player hit
            }
        }
        return false;
    }

    // Try to pick up loot when F is pressed
    tryPickupLoot() {
        if (!this.player.alive || this.inventoryOpen) return;

        const pickedUpWeapon = this.lootBoxManager.tryPickup();
        if (pickedUpWeapon) {
            // Add to inventory
            const isNew = this.player.addToInventory(pickedUpWeapon);
            if (isNew) {
                // New weapon - equip it
                this.player.setWeapon(pickedUpWeapon);
                Effects.addText(this.player.x, this.player.y - 40, 'NEW WEAPON!', '#00ff00', 1, 18);
            } else {
                // Already have it - just show message (weapon disappears)
                Effects.addText(this.player.x, this.player.y - 40, 'Already in inventory', '#888', 0.8, 14);
            }
        }
    }

    pause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            UI.showPause();
            Audio.stopMusic();
        }
    }

    resume() {
        if (this.state === 'paused') {
            this.state = 'playing';
            UI.hideAllMenus();
            Audio.startMusic(this.levelManager.currentLevel);
        }
    }

    restartLevel() {
        this.resetLevel(false); // Full reset on restart
        this.state = 'playing';
        UI.hideAllMenus();
        UI.showHUD();
        UI.updatePlayerNameDisplay(this.playerName);
        Audio.startMusic(this.levelManager.currentLevel);
    }

    quitToMenu() {
        this.state = 'menu';
        UI.hideHUD();
        UI.hideBossHealth();
        UI.updateLevelButtons(this.levelManager.maxUnlockedLevel);
        UI.showScreen('mainMenu');
        Audio.stopMusic();
    }

    nextLevel() {
        this.totalKills += this.kills;
        this.totalScore += this.score;

        if (this.levelManager.isLastLevel()) {
            // Victory!
            this.state = 'victory';
            UI.hideHUD();
            UI.showVictory(this.totalKills, this.totalScore);
            // Save high score on victory
            UI.saveHighScore(this.playerName, this.totalScore, this.levelManager.currentLevel);
            Audio.playLevelComplete();
        } else {
            this.levelManager.nextLevel();
            // Inventory is preserved through beginLevel
            this.showLevelIntro();
        }
    }

    gameOver() {
        this.state = 'gameOver';
        UI.hideHUD();
        UI.hideBossHealth();
        // Save high score on game over
        const finalScore = this.totalScore + this.score;
        UI.saveHighScore(this.playerName, finalScore, this.levelManager.currentLevel);
        UI.showGameOver(
            this.levelManager.currentLevel,
            this.kills,
            this.score,
            LEVEL_DURATION - this.levelManager.getTimeRemaining()
        );
        Audio.stopMusic();
    }

    levelComplete() {
        this.state = 'levelComplete';
        UI.hideHUD();
        UI.hideBossHealth();
        UI.showLevelComplete(this.kills, this.score, this.bestCombo);
        Audio.stopMusic();
        Audio.playLevelComplete();
    }

    addScore(points, x, y) {
        const comboPoints = Math.floor(points * this.combo);
        this.score += comboPoints;

        // Show floating score
        Effects.addText(x, y - 20, `+${comboPoints}`, '#ffcc00', 0.8, 16);
    }

    addKill(zombieData) {
        this.kills++;
        this.addScore(zombieData.points, zombieData.x, zombieData.y);

        // Add blood decal on ground
        this.addGroundDecal(zombieData.x, zombieData.y, Utils.randomChoice(Colors.particles.blood));

        // Update combo
        this.combo++;
        this.comboTimer = 0;

        if (this.combo > this.bestCombo) {
            this.bestCombo = this.combo;
        }

        // Combo milestones
        if (this.combo === 5 || this.combo === 10 || this.combo === 20 || this.combo === 50) {
            Effects.addText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, `${this.combo}x COMBO!`, '#ff4444', 1.5, 32);
            Audio.playCombo(this.combo);
        }
    }

    update(dt) {
        if (this.state !== 'playing') return;

        // Skip game updates if inventory is open (but still update visuals)
        if (this.inventoryOpen) {
            Particles.update(dt);
            Effects.update(dt);
            return;
        }

        // Handle boss kill animation
        if (this.showingBossKillAnimation) {
            this.bossKillAnimationTimer += dt;

            // Continue showing particles during animation
            Particles.update(dt);
            Effects.update(dt);
            Utils.screenShake.update(dt);

            // When animation completes, show level complete
            if (this.bossKillAnimationTimer >= this.bossKillAnimationDuration) {
                this.showingBossKillAnimation = false;
                this.levelComplete();
            }
            return;
        }

        this.timeSurvived += dt;

        // Update combo timer
        this.comboTimer += dt;
        if (this.comboTimer >= this.comboTimeout) {
            this.combo = 1;
        }

        // Update player
        this.player.updateAim(this.mouseX, this.mouseY);
        this.player.update(dt, this.bulletManager, this.wallManager);

        // Update dash cooldown UI
        UI.updateDashCooldown(this.player.getDashCooldownPercent());

        // Update bullets (pass wallManager for collision)
        this.bulletManager.update(dt, this.wallManager);

        // Update level spawning
        const levelResult = this.levelManager.update(dt, this.zombieManager, this.bossManager, this.player);

        if (levelResult === 'complete') {
            this.levelComplete();
            return;
        }

        // Update zombies (pass lootBoxManager for afterburn kills, wallManager for collision, bulletManager for helicopter shooting)
        const afterburnKills = this.zombieManager.update(dt, this.player.x, this.player.y, this.lootBoxManager, this.wallManager, this.bulletManager);
        for (const kill of afterburnKills) {
            this.addKill(kill);
        }

        // Update boss
        this.bossManager.update(dt, this.player.x, this.player.y);

        // Check bullet-zombie collisions (with explosive support)
        const zombieKills = this.zombieManager.checkBulletCollisions(this.bulletManager, this.lootBoxManager);
        for (const kill of zombieKills) {
            this.addKill(kill);
        }

        // Check bullet-boss collisions
        const bossResult = this.bossManager.checkBulletCollisions(this.bulletManager);
        if (bossResult) {
            this.addScore(bossResult.points, this.player.x, this.player.y - 50);
            Effects.addText(GAME_WIDTH / 2, GAME_HEIGHT / 2, `${bossResult.name} DEFEATED!`, '#FFD700', 2, 36);
            UI.hideBossHealth();

            // Start boss kill animation
            this.startBossKillAnimation(bossResult);
        }

        // Update loot boxes
        this.lootBoxManager.update(dt);

        // Update loot box proximity for pickup indication
        if (this.player.alive) {
            this.lootBoxManager.updateProximity(
                this.player.x, this.player.y, this.player.radius
            );
        }

        // Player collision check - skip during dash (invulnerable while dashing)
        if (this.player.alive && !this.player.isDashing) {
            if (this.zombieManager.checkPlayerCollision(this.player.x, this.player.y, this.player.radius)) {
                this.player.die();
                setTimeout(() => this.gameOver(), 1000);
            }

            if (this.bossManager.checkPlayerCollision(this.player.x, this.player.y, this.player.radius)) {
                this.player.die();
                setTimeout(() => this.gameOver(), 1000);
            }

            // Check enemy bullet collision with player
            if (this.checkEnemyBulletCollision()) {
                this.player.die();
                setTimeout(() => this.gameOver(), 1000);
            }
        }

        // Check for boss knockback (shockwaves)
        const knockback = this.bossManager.getShockwaveKnockback(this.player.x, this.player.y);
        if (knockback) {
            this.player.applyKnockback(knockback.angle, knockback.force * dt);
        }

        // Update ambient particles
        this.updateAmbient(dt);

        // Fade ground decals
        for (let i = this.groundDecals.length - 1; i >= 0; i--) {
            this.groundDecals[i].age += dt;
            this.groundDecals[i].alpha = Math.max(0.05, 0.5 - this.groundDecals[i].age * 0.02);
        }

        // Track boss arena timer
        if (this.levelManager.bossSpawned && this.bossManager.isAlive()) {
            this.bossArenaTimer += dt;
        }

        // Update particles and effects
        Particles.update(dt);
        Effects.update(dt);
        Utils.screenShake.update(dt);

        // Update UI
        UI.updateHUD(
            this.levelManager.currentLevel,
            this.levelManager.getTimeRemaining(),
            this.kills,
            this.score,
            this.combo
        );

        // Update boss health bar
        const boss = this.bossManager.getBoss();
        if (boss && boss.alive) {
            UI.showBossHealth(boss.name, boss.health / boss.maxHealth, boss.phase, boss.health, boss.maxHealth);
        }
    }

    startBossKillAnimation(bossResult) {
        this.showingBossKillAnimation = true;
        this.bossKillAnimationTimer = 0;

        // Epic boss kill effects
        Utils.screenShake.shake(30, 1.5);
        Effects.addFlash(0.5, 'rgba(255, 215, 0, 0.4)');

        // Multiple explosion waves
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const offsetX = Utils.random(-100, 100);
                const offsetY = Utils.random(-100, 100);
                Particles.explosion(GAME_WIDTH / 2 + offsetX, GAME_HEIGHT / 2 + offsetY, 40, 2);
                Effects.addShockwave(GAME_WIDTH / 2 + offsetX, GAME_HEIGHT / 2 + offsetY, 150, 0.4, 'rgba(255, 68, 68, 0.5)');
            }, i * 300);
        }

        Audio.playBossDeath && Audio.playBossDeath();
    }

    draw() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Apply screen shake
        ctx.save();
        ctx.translate(Utils.screenShake.offsetX, Utils.screenShake.offsetY);

        // Draw game background
        this.drawBackground(ctx);

        if (this.state === 'playing' || this.state === 'paused') {
            // Draw walls first (behind entities)
            this.wallManager.draw(ctx);

            // Draw game objects
            this.lootBoxManager.draw(ctx);
            this.zombieManager.draw(ctx);
            this.bossManager.draw(ctx);
            this.player.draw(ctx);
            this.bulletManager.draw(ctx);

            // Draw particles on top
            Particles.draw(ctx);
            Effects.draw(ctx);
        }

        ctx.restore();
    }

    updateAmbient(dt) {
        for (const p of this.ambientParticles) {
            p.x += Math.cos(p.angle) * p.speed * dt + p.drift;
            p.y += Math.sin(p.angle) * p.speed * dt;
            p.pulse += dt * 2;

            // Wrap around screen
            if (p.x < -10) p.x = GAME_WIDTH + 10;
            if (p.x > GAME_WIDTH + 10) p.x = -10;
            if (p.y < -10) p.y = GAME_HEIGHT + 10;
            if (p.y > GAME_HEIGHT + 10) p.y = -10;
        }
    }

    drawBackground(ctx) {
        const level = this.levelManager ? this.levelManager.currentLevel : 1;
        const theme = Colors.levelThemes[level] || Colors.levelThemes[1];
        const isBossActive = this.levelManager && this.levelManager.bossSpawned && this.bossManager && this.bossManager.isAlive();

        // Level-themed background fill
        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Ground texture - scattered debris dots
        if (!this._groundDots || this._groundDotsLevel !== level) {
            this._groundDots = [];
            this._groundDotsLevel = level;
            for (let i = 0; i < 120; i++) {
                this._groundDots.push({
                    x: Utils.random(0, GAME_WIDTH),
                    y: Utils.random(0, GAME_HEIGHT),
                    size: Utils.random(1, 3),
                    alpha: Utils.random(0.05, 0.15)
                });
            }
        }
        for (const dot of this._groundDots) {
            ctx.fillStyle = `rgba(255, 255, 255, ${dot.alpha})`;
            ctx.fillRect(dot.x, dot.y, dot.size, dot.size);
        }

        // Grid pattern with themed color
        ctx.strokeStyle = theme.grid;
        ctx.lineWidth = 1;
        const gridSize = 50;

        for (let x = 0; x <= GAME_WIDTH; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, GAME_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y <= GAME_HEIGHT; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(GAME_WIDTH, y);
            ctx.stroke();
        }

        // Ground blood decals (behind entities)
        for (const decal of this.groundDecals) {
            ctx.save();
            ctx.globalAlpha = decal.alpha;
            ctx.fillStyle = decal.color;
            ctx.beginPath();
            ctx.arc(decal.x, decal.y, decal.size, 0, Math.PI * 2);
            ctx.fill();
            // Splatter detail
            for (let s = 0; s < 3; s++) {
                const sx = decal.x + Math.cos(s * 2.1) * decal.size * 0.8;
                const sy = decal.y + Math.sin(s * 2.1) * decal.size * 0.7;
                ctx.beginPath();
                ctx.arc(sx, sy, decal.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Ambient floating particles
        for (const p of this.ambientParticles) {
            const pulseAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
            ctx.save();
            ctx.globalAlpha = pulseAlpha;
            ctx.fillStyle = isBossActive ? theme.ambientAlt : theme.ambient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Boss arena effects
        if (isBossActive) {
            this.drawBossArena(ctx, theme);
        }

        // Vignette effect - themed
        const vigRadius = isBossActive ? GAME_HEIGHT / 4 : GAME_HEIGHT / 3;
        const gradient = ctx.createRadialGradient(
            GAME_WIDTH / 2, GAME_HEIGHT / 2, vigRadius,
            GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, isBossActive ? 'rgba(0, 0, 0, 0.75)' : theme.vignette);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Edge glow during boss fight
        if (isBossActive) {
            const pulse = 0.3 + 0.15 * Math.sin(this.bossArenaTimer * 3);
            const boss = this.bossManager.getBoss();
            const phaseColor = boss && boss.phase === 3 ? `rgba(255, 0, 0, ${pulse})`
                             : boss && boss.phase === 2 ? `rgba(255, 100, 0, ${pulse})`
                             : `rgba(255, 50, 50, ${pulse * 0.6})`;

            // Top edge
            const edgeGrad = ctx.createLinearGradient(0, 0, 0, 40);
            edgeGrad.addColorStop(0, phaseColor);
            edgeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = edgeGrad;
            ctx.fillRect(0, 0, GAME_WIDTH, 40);

            // Bottom edge
            const botGrad = ctx.createLinearGradient(0, GAME_HEIGHT, 0, GAME_HEIGHT - 40);
            botGrad.addColorStop(0, phaseColor);
            botGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = botGrad;
            ctx.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);

            // Left edge
            const leftGrad = ctx.createLinearGradient(0, 0, 40, 0);
            leftGrad.addColorStop(0, phaseColor);
            leftGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = leftGrad;
            ctx.fillRect(0, 0, 40, GAME_HEIGHT);

            // Right edge
            const rightGrad = ctx.createLinearGradient(GAME_WIDTH, 0, GAME_WIDTH - 40, 0);
            rightGrad.addColorStop(0, phaseColor);
            rightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = rightGrad;
            ctx.fillRect(GAME_WIDTH - 40, 0, 40, GAME_HEIGHT);
        }
    }

    drawBossArena(ctx, theme) {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        const boss = this.bossManager.getBoss();
        const t = this.bossArenaTimer;

        // Rotating danger ring
        const ringRadius = Math.min(GAME_WIDTH, GAME_HEIGHT) * 0.42;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.2);

        const segments = 24;
        for (let i = 0; i < segments; i++) {
            const a1 = (i / segments) * Math.PI * 2;
            const a2 = ((i + 0.5) / segments) * Math.PI * 2;
            const pulse = 0.15 + 0.1 * Math.sin(t * 4 + i);

            ctx.strokeStyle = i % 2 === 0
                ? `rgba(255, 50, 50, ${pulse})`
                : `rgba(255, 150, 0, ${pulse * 0.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, ringRadius, a1, a2);
            ctx.stroke();
        }
        ctx.restore();

        // Inner glow circle around boss
        if (boss && boss.alive) {
            const bx = boss.x;
            const by = boss.y;
            const glowSize = boss.radius * 3 + Math.sin(t * 5) * 10;
            const phaseGlow = boss.phase === 3 ? 'rgba(255, 0, 0, 0.08)'
                            : boss.phase === 2 ? 'rgba(255, 100, 0, 0.06)'
                            : 'rgba(255, 200, 50, 0.04)';
            const bossGlow = ctx.createRadialGradient(bx, by, 0, bx, by, glowSize);
            bossGlow.addColorStop(0, phaseGlow);
            bossGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = bossGlow;
            ctx.beginPath();
            ctx.arc(bx, by, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Corner danger markers
        const cornerSize = 50;
        const cornerPulse = 0.2 + 0.15 * Math.sin(t * 3);
        ctx.strokeStyle = `rgba(255, 0, 0, ${cornerPulse})`;
        ctx.lineWidth = 2;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(5, cornerSize + 5);
        ctx.lineTo(5, 5);
        ctx.lineTo(cornerSize + 5, 5);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(GAME_WIDTH - cornerSize - 5, 5);
        ctx.lineTo(GAME_WIDTH - 5, 5);
        ctx.lineTo(GAME_WIDTH - 5, cornerSize + 5);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(5, GAME_HEIGHT - cornerSize - 5);
        ctx.lineTo(5, GAME_HEIGHT - 5);
        ctx.lineTo(cornerSize + 5, GAME_HEIGHT - 5);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(GAME_WIDTH - cornerSize - 5, GAME_HEIGHT - 5);
        ctx.lineTo(GAME_WIDTH - 5, GAME_HEIGHT - 5);
        ctx.lineTo(GAME_WIDTH - 5, GAME_HEIGHT - cornerSize - 5);
        ctx.stroke();
    }

    gameLoop(currentTime) {
        // Calculate delta time
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Cap delta time to prevent huge jumps
        this.deltaTime = Math.min(this.deltaTime, 0.1);

        // Update and draw
        this.update(this.deltaTime);
        this.draw();

        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
