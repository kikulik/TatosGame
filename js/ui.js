// UI System for Zombie Apocalypse Game

class UIManager {
    constructor() {
        // Cache DOM elements
        this.elements = {
            // Menus
            mainMenu: document.getElementById('main-menu'),
            levelSelectMenu: document.getElementById('level-select-menu'),
            controlsMenu: document.getElementById('controls-menu'),
            levelIntro: document.getElementById('level-intro'),
            pauseMenu: document.getElementById('pause-menu'),
            gameOver: document.getElementById('game-over'),
            levelComplete: document.getElementById('level-complete'),
            victoryScreen: document.getElementById('victory-screen'),

            // HUD
            hud: document.getElementById('hud'),
            hudLevel: document.getElementById('hud-level'),
            hudTime: document.getElementById('hud-time'),
            hudKills: document.getElementById('hud-kills'),
            hudScore: document.getElementById('hud-score'),
            hudCombo: document.getElementById('hud-combo'),

            // Boss health
            bossHealthContainer: document.getElementById('boss-health-container'),
            bossName: document.getElementById('boss-name'),
            bossHealthFill: document.getElementById('boss-health-fill'),

            // Level intro
            levelTitle: document.getElementById('level-title'),
            levelTheme: document.getElementById('level-theme'),
            levelEnemies: document.getElementById('level-enemies'),

            // Level select buttons container
            levelButtons: document.getElementById('level-buttons'),

            // Game over stats
            goLevel: document.getElementById('go-level'),
            goKills: document.getElementById('go-kills'),
            goScore: document.getElementById('go-score'),
            goTime: document.getElementById('go-time'),

            // Level complete stats
            lcKills: document.getElementById('lc-kills'),
            lcScore: document.getElementById('lc-score'),
            lcCombo: document.getElementById('lc-combo'),

            // Victory stats
            vKills: document.getElementById('v-kills'),
            vScore: document.getElementById('v-score')
        };

        // Buttons
        this.buttons = {
            start: document.getElementById('start-btn'),
            levelSelect: document.getElementById('level-select-btn'),
            controls: document.getElementById('controls-btn'),
            backToMenu: document.getElementById('back-to-menu-btn'),
            controlsBack: document.getElementById('controls-back-btn'),
            startLevel: document.getElementById('start-level-btn'),
            resume: document.getElementById('resume-btn'),
            restart: document.getElementById('restart-btn'),
            quit: document.getElementById('quit-btn'),
            retry: document.getElementById('retry-btn'),
            goMenu: document.getElementById('go-menu-btn'),
            nextLevel: document.getElementById('next-level-btn'),
            playAgain: document.getElementById('play-again-btn'),
            vMenu: document.getElementById('v-menu-btn')
        };

        this.currentScreen = 'mainMenu';
        this.callbacks = {};
    }

    init(callbacks) {
        this.callbacks = callbacks;
        this.setupEventListeners();
        this.createLevelButtons();
    }

    setupEventListeners() {
        // Main menu
        this.buttons.start.addEventListener('click', () => {
            this.callbacks.onStartGame && this.callbacks.onStartGame();
        });

        this.buttons.levelSelect.addEventListener('click', () => {
            this.showScreen('levelSelectMenu');
        });

        this.buttons.controls.addEventListener('click', () => {
            this.showScreen('controlsMenu');
        });

        // Level select
        this.buttons.backToMenu.addEventListener('click', () => {
            this.showScreen('mainMenu');
        });

        // Controls
        this.buttons.controlsBack.addEventListener('click', () => {
            this.showScreen('mainMenu');
        });

        // Level intro
        this.buttons.startLevel.addEventListener('click', () => {
            this.callbacks.onBeginLevel && this.callbacks.onBeginLevel();
        });

        // Pause menu
        this.buttons.resume.addEventListener('click', () => {
            this.callbacks.onResume && this.callbacks.onResume();
        });

        this.buttons.restart.addEventListener('click', () => {
            this.callbacks.onRestart && this.callbacks.onRestart();
        });

        this.buttons.quit.addEventListener('click', () => {
            this.callbacks.onQuit && this.callbacks.onQuit();
        });

        // Game over
        this.buttons.retry.addEventListener('click', () => {
            this.callbacks.onRestart && this.callbacks.onRestart();
        });

        this.buttons.goMenu.addEventListener('click', () => {
            this.callbacks.onQuit && this.callbacks.onQuit();
        });

        // Level complete
        this.buttons.nextLevel.addEventListener('click', () => {
            this.callbacks.onNextLevel && this.callbacks.onNextLevel();
        });

        // Victory
        this.buttons.playAgain.addEventListener('click', () => {
            this.callbacks.onStartGame && this.callbacks.onStartGame();
        });

        this.buttons.vMenu.addEventListener('click', () => {
            this.callbacks.onQuit && this.callbacks.onQuit();
        });
    }

    createLevelButtons() {
        this.elements.levelButtons.innerHTML = '';

        for (let i = 1; i <= 10; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = i;
            btn.dataset.level = i;

            btn.addEventListener('click', () => {
                if (btn.classList.contains('unlocked')) {
                    this.callbacks.onSelectLevel && this.callbacks.onSelectLevel(parseInt(btn.dataset.level));
                }
            });

            this.elements.levelButtons.appendChild(btn);
        }
    }

    updateLevelButtons(maxUnlocked) {
        const buttons = this.elements.levelButtons.querySelectorAll('.level-btn');
        buttons.forEach((btn, index) => {
            if (index + 1 <= maxUnlocked) {
                btn.classList.add('unlocked');
            } else {
                btn.classList.remove('unlocked');
            }
        });
    }

    showScreen(screen) {
        // Hide all menus
        Object.keys(this.elements).forEach(key => {
            if (key.includes('Menu') || key.includes('menu') ||
                key === 'levelIntro' || key === 'gameOver' ||
                key === 'levelComplete' || key === 'victoryScreen') {
                if (this.elements[key]) {
                    this.elements[key].classList.add('hidden');
                }
            }
        });

        // Show requested screen
        if (this.elements[screen]) {
            this.elements[screen].classList.remove('hidden');
        }

        this.currentScreen = screen;
    }

    hideAllMenus() {
        this.showScreen('none');
    }

    showHUD() {
        this.elements.hud.classList.remove('hidden');
    }

    hideHUD() {
        this.elements.hud.classList.add('hidden');
    }

    updateHUD(level, time, kills, score, combo) {
        this.elements.hudLevel.textContent = level;
        this.elements.hudTime.textContent = Utils.formatTime(time);
        this.elements.hudKills.textContent = kills;
        this.elements.hudScore.textContent = score;

        // Update combo with color
        if (combo > 1) {
            this.elements.hudCombo.textContent = `x${combo}`;
            this.elements.hudCombo.style.color = combo >= 10 ? '#ff4444' :
                combo >= 5 ? '#ff8844' : '#ffcc00';
        } else {
            this.elements.hudCombo.textContent = 'x1';
            this.elements.hudCombo.style.color = '#ffcc00';
        }
    }

    showBossHealth(name, healthPercent) {
        this.elements.bossHealthContainer.classList.remove('hidden');
        this.elements.bossName.textContent = name;
        this.elements.bossHealthFill.style.width = `${healthPercent * 100}%`;
    }

    updateBossHealth(healthPercent) {
        this.elements.bossHealthFill.style.width = `${healthPercent * 100}%`;
    }

    hideBossHealth() {
        this.elements.bossHealthContainer.classList.add('hidden');
    }

    showLevelIntro(level, name, theme, enemies) {
        this.elements.levelTitle.textContent = `Level ${level}: ${name}`;
        this.elements.levelTheme.textContent = theme;

        this.elements.levelEnemies.innerHTML = '';
        enemies.forEach(enemy => {
            const p = document.createElement('p');
            p.textContent = '> ' + enemy;
            this.elements.levelEnemies.appendChild(p);
        });

        this.showScreen('levelIntro');
    }

    showGameOver(level, kills, score, time) {
        this.elements.goLevel.textContent = level;
        this.elements.goKills.textContent = kills;
        this.elements.goScore.textContent = score;
        this.elements.goTime.textContent = Utils.formatTime(time);

        this.showScreen('gameOver');
    }

    showLevelComplete(kills, score, bestCombo) {
        this.elements.lcKills.textContent = kills;
        this.elements.lcScore.textContent = score;
        this.elements.lcCombo.textContent = `x${bestCombo}`;

        this.showScreen('levelComplete');
    }

    showVictory(totalKills, finalScore) {
        this.elements.vKills.textContent = totalKills;
        this.elements.vScore.textContent = finalScore;

        this.showScreen('victoryScreen');
    }

    showPause() {
        this.showScreen('pauseMenu');
    }
}

// Global UI instance
const UI = new UIManager();
