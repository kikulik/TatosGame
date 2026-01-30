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
            onNextLevel: () => this.nextLevel()
        });

        // Initialize audio
        Audio.init();

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
                this.player.handleKeyDown(e.code);

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
        this.levelManager.setLevel(1);
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
        this.resetLevel();
        this.state = 'playing';
        UI.hideAllMenus();
        UI.showHUD();
        Audio.startMusic(this.levelManager.currentLevel);
    }

    resetLevel() {
        // Reset player
        this.player.reset(GAME_WIDTH / 2, GAME_HEIGHT / 2);

        // Clear game objects
        this.bulletManager.clear();
        this.zombieManager.clear();
        this.bossManager.clear();
        Particles.clear();
        Effects.clear();

        // Reset level
        this.levelManager.reset();

        // Reset score for level
        this.score = 0;
        this.kills = 0;
        this.combo = 1;
        this.bestCombo = 1;
        this.comboTimer = 0;
        this.timeSurvived = 0;
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
        this.resetLevel();
        this.state = 'playing';
        UI.hideAllMenus();
        UI.showHUD();
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
            Audio.playLevelComplete();
        } else {
            this.levelManager.nextLevel();
            this.showLevelIntro();
        }
    }

    gameOver() {
        this.state = 'gameOver';
        UI.hideHUD();
        UI.hideBossHealth();
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

        this.timeSurvived += dt;

        // Update combo timer
        this.comboTimer += dt;
        if (this.comboTimer >= this.comboTimeout) {
            this.combo = 1;
        }

        // Update player
        this.player.updateAim(this.mouseX, this.mouseY);
        this.player.update(dt, this.bulletManager);

        // Update bullets
        this.bulletManager.update(dt);

        // Update level spawning
        const levelResult = this.levelManager.update(dt, this.zombieManager, this.bossManager, this.player);

        if (levelResult === 'complete') {
            this.levelComplete();
            return;
        }

        // Update zombies
        this.zombieManager.update(dt, this.player.x, this.player.y);

        // Update boss
        this.bossManager.update(dt, this.player.x, this.player.y);

        // Check bullet-zombie collisions
        const zombieKills = this.zombieManager.checkBulletCollisions(this.bulletManager);
        for (const kill of zombieKills) {
            this.addKill(kill);
        }

        // Check bullet-boss collisions
        const bossResult = this.bossManager.checkBulletCollisions(this.bulletManager);
        if (bossResult) {
            this.addScore(bossResult.points, this.player.x, this.player.y - 50);
            Effects.addText(GAME_WIDTH / 2, GAME_HEIGHT / 2, `${bossResult.name} DEFEATED!`, '#FFD700', 2, 36);
            UI.hideBossHealth();
        }

        // Check player-zombie collisions
        if (this.player.alive) {
            if (this.zombieManager.checkPlayerCollision(this.player.x, this.player.y, this.player.radius)) {
                this.player.die();
                setTimeout(() => this.gameOver(), 1000);
            }

            if (this.bossManager.checkPlayerCollision(this.player.x, this.player.y, this.player.radius)) {
                this.player.die();
                setTimeout(() => this.gameOver(), 1000);
            }
        }

        // Check for boss knockback (shockwaves)
        const knockback = this.bossManager.getShockwaveKnockback(this.player.x, this.player.y);
        if (knockback) {
            this.player.applyKnockback(knockback.angle, knockback.force * dt);
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
            UI.showBossHealth(boss.name, boss.health / boss.maxHealth);
        }
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
            // Draw game objects
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

    drawBackground(ctx) {
        // Grid pattern
        ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
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

        // Vignette effect
        const gradient = ctx.createRadialGradient(
            GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT / 3,
            GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
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
