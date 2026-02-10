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
            highScoresMenu: document.getElementById('high-scores-menu'),
            inventoryPanel: document.getElementById('inventory-panel'),

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
            bossPhase: document.getElementById('boss-phase'),
            bossHealthFill: document.getElementById('boss-health-fill'),
            bossHealthText: document.getElementById('boss-health-text'),

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
            vScore: document.getElementById('v-score'),

            // New elements
            playerNameInput: document.getElementById('player-name'),
            highScoresList: document.getElementById('high-scores-list'),
            inventoryWeapons: document.getElementById('inventory-weapons'),
            dashCooldownFill: document.getElementById('dash-cooldown-fill'),
            dashLabel: document.getElementById('dash-label'),
            playerNameDisplay: document.getElementById('player-name-display')
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
            vMenu: document.getElementById('v-menu-btn'),
            highScores: document.getElementById('high-scores-btn'),
            highScoresBack: document.getElementById('high-scores-back-btn'),
            closeInventory: document.getElementById('close-inventory-btn')
        };

        this.currentScreen = 'mainMenu';
        this.callbacks = {};
        this.inventoryOpen = false;
    }

    init(callbacks) {
        this.callbacks = callbacks;
        this.setupEventListeners();
        this.createLevelButtons();
        this.loadPlayerName();
    }

    // Player name management
    loadPlayerName() {
        const savedName = localStorage.getItem('zombieApocalypse_playerName');
        if (savedName && this.elements.playerNameInput) {
            this.elements.playerNameInput.value = savedName;
        }
    }

    savePlayerName() {
        const name = this.getPlayerName();
        if (name) {
            localStorage.setItem('zombieApocalypse_playerName', name);
        }
    }

    getPlayerName() {
        return this.elements.playerNameInput?.value?.trim() || 'Anonymous';
    }

    updatePlayerNameDisplay(name) {
        if (this.elements.playerNameDisplay) {
            this.elements.playerNameDisplay.textContent = name;
        }
    }

    // High scores management
    getHighScores() {
        const scores = localStorage.getItem('zombieApocalypse_highScores');
        return scores ? JSON.parse(scores) : [];
    }

    saveHighScore(name, score, level) {
        const scores = this.getHighScores();
        scores.push({ name, score, level, date: Date.now() });
        scores.sort((a, b) => b.score - a.score);
        const topScores = scores.slice(0, 20); // Keep top 20
        localStorage.setItem('zombieApocalypse_highScores', JSON.stringify(topScores));
    }

    displayHighScores() {
        const scores = this.getHighScores();
        const container = this.elements.highScoresList;
        if (!container) return;

        if (scores.length === 0) {
            container.innerHTML = '<p style="color: #888; text-align: center;">No high scores yet!</p>';
            return;
        }

        container.innerHTML = scores.map((score, index) => `
            <div class="high-score-entry ${index < 3 ? 'top-3' : ''}">
                <span class="high-score-rank">#${index + 1}</span>
                <span class="high-score-name">${this.escapeHtml(score.name)}</span>
                <span class="high-score-score">${score.score.toLocaleString()}</span>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Dash cooldown display
    updateDashCooldown(percent) {
        if (this.elements.dashCooldownFill) {
            this.elements.dashCooldownFill.style.width = `${percent * 100}%`;
        }
        if (this.elements.dashLabel) {
            if (percent >= 1) {
                this.elements.dashLabel.style.color = '#00ffff';
                this.elements.dashLabel.textContent = 'DASH [Q] READY';
            } else {
                this.elements.dashLabel.style.color = '#888';
                this.elements.dashLabel.textContent = 'DASH [Q]';
            }
        }
    }

    // Inventory panel
    showInventory(inventory, currentWeapon, onSelectWeapon, upgradeLevel = 0, availableKills = 0, onUpgrade = null, onPlaceTower = null) {
        this.inventoryOpen = true;
        const container = this.elements.inventoryWeapons;
        if (!container) return;

        container.innerHTML = inventory.map(weaponType => {
            const weapon = WeaponTypes[weaponType];
            const isEquipped = weaponType === currentWeapon;
            return `
                <div class="inventory-weapon ${isEquipped ? 'equipped' : ''}"
                     data-weapon="${weaponType}"
                     style="border-left: 4px solid ${weapon.color}">
                    <div>
                        <span class="weapon-name" style="color: ${weapon.color}">${weapon.name}</span>
                        <div class="weapon-stats">DMG: ${weapon.damage} | Rate: ${(1/weapon.fireRate).toFixed(1)}/s</div>
                    </div>
                    ${isEquipped ? '<span class="weapon-equipped-badge">EQUIPPED</span>' : ''}
                </div>
            `;
        }).join('');

        // Add click handlers
        container.querySelectorAll('.inventory-weapon').forEach(el => {
            el.addEventListener('click', () => {
                const weaponType = el.dataset.weapon;
                if (onSelectWeapon) onSelectWeapon(weaponType);
            });
        });

        // Upgrade section
        const upgradeContainer = document.getElementById('upgrade-section');
        if (upgradeContainer) {
            const upgradeDescriptions = {
                1: 'Fire Rate +20%',
                2: 'Damage +25%',
                3: 'Bow: Double Arrow'
            };
            const nextLevel = upgradeLevel + 1;
            const upgradeCosts = { 1: 80, 2: 120, 3: 150 };
            const nextCost = upgradeCosts[nextLevel] || 100;
            const canUpgrade = upgradeLevel < 3 && availableKills >= nextCost;
            const maxed = upgradeLevel >= 3;

            let activeUpgrades = '';
            if (upgradeLevel >= 1) activeUpgrades += '<span class="upgrade-active">Lv1: Fire Rate +20%</span>';
            if (upgradeLevel >= 2) activeUpgrades += '<span class="upgrade-active">Lv2: Damage +25%</span>';
            if (upgradeLevel >= 3) activeUpgrades += '<span class="upgrade-active">Lv3: Bow: Double Arrow</span>';

            const canPlaceTower = availableKills >= 300;

            upgradeContainer.innerHTML = `
                <div class="upgrade-header">UPGRADES (Level ${upgradeLevel}/3)</div>
                <div class="upgrade-info">${activeUpgrades || '<span class="upgrade-none">No upgrades yet</span>'}</div>
                <div class="upgrade-kills">Available Kills: ${availableKills}</div>
                ${maxed ? '<button class="upgrade-btn maxed" disabled>MAX LEVEL</button>' :
                    `<button class="upgrade-btn ${canUpgrade ? '' : 'locked'}" ${canUpgrade ? '' : 'disabled'}>
                        UPGRADE Lv${nextLevel} (${nextCost} kills) - ${upgradeDescriptions[nextLevel]}
                    </button>`
                }
                <div class="upgrade-header" style="margin-top: 10px;">TOWER (Press T)</div>
                <div class="upgrade-info"><span class="upgrade-none">Auto-shoots zombies for 30s. Never misses.</span></div>
                <button class="upgrade-btn tower-btn ${canPlaceTower ? '' : 'locked'}" ${canPlaceTower ? '' : 'disabled'}>
                    PLACE TOWER (300 kills)
                </button>
            `;

            if (canUpgrade && onUpgrade) {
                upgradeContainer.querySelector('.upgrade-btn:not(.tower-btn)').addEventListener('click', onUpgrade);
            }

            if (canPlaceTower && onPlaceTower) {
                upgradeContainer.querySelector('.tower-btn').addEventListener('click', onPlaceTower);
            }
        }

        this.elements.inventoryPanel?.classList.remove('hidden');
    }

    hideInventory() {
        this.inventoryOpen = false;
        this.elements.inventoryPanel?.classList.add('hidden');
    }

    isInventoryOpen() {
        return this.inventoryOpen;
    }

    setupEventListeners() {
        // Main menu
        this.buttons.start.addEventListener('click', () => {
            this.savePlayerName();
            this.callbacks.onStartGame && this.callbacks.onStartGame();
        });

        this.buttons.levelSelect.addEventListener('click', () => {
            this.savePlayerName();
            this.showScreen('levelSelectMenu');
        });

        this.buttons.controls.addEventListener('click', () => {
            this.showScreen('controlsMenu');
        });

        // High scores
        this.buttons.highScores?.addEventListener('click', () => {
            this.displayHighScores();
            this.showScreen('highScoresMenu');
        });

        this.buttons.highScoresBack?.addEventListener('click', () => {
            this.showScreen('mainMenu');
        });

        // Inventory
        this.buttons.closeInventory?.addEventListener('click', () => {
            this.hideInventory();
            this.callbacks.onCloseInventory && this.callbacks.onCloseInventory();
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

    showBossHealth(name, healthPercent, phase = 1, currentHP = 0, maxHP = 0) {
        this.elements.bossHealthContainer.classList.remove('hidden');
        this.elements.bossName.textContent = name;
        this.elements.bossHealthFill.style.width = `${healthPercent * 100}%`;

        // Update phase display
        if (this.elements.bossPhase) {
            const phaseNames = { 1: 'PHASE 1', 2: 'PHASE 2 - ENRAGED', 3: 'PHASE 3 - BERSERK' };
            this.elements.bossPhase.textContent = phaseNames[phase] || `PHASE ${phase}`;
            this.elements.bossPhase.className = '';
            if (phase >= 2) this.elements.bossPhase.classList.add('phase-2');
            if (phase >= 3) this.elements.bossPhase.classList.add('phase-3');
        }

        // Update health fill color per phase
        if (this.elements.bossHealthFill) {
            this.elements.bossHealthFill.className = '';
            if (phase === 2) this.elements.bossHealthFill.classList.add('phase-2');
            if (phase >= 3) this.elements.bossHealthFill.classList.add('phase-3');
        }

        // Show HP numbers
        if (this.elements.bossHealthText) {
            this.elements.bossHealthText.textContent = `${Math.ceil(currentHP)} / ${maxHP}`;
        }
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
