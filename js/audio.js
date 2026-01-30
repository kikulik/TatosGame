// Audio System for Zombie Apocalypse Game
// Uses Web Audio API for procedural sound generation

class AudioSystem {
    constructor() {
        this.enabled = true;
        this.masterVolume = 0.5;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.4;

        // Initialize Web Audio API
        this.audioContext = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.masterVolume;
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Generate simple shoot sound
    playShoot() {
        if (!this.enabled || !this.initialized) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.05);

        gain.gain.setValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.05);
    }

    // Generate zombie death sound
    playZombieDeath() {
        if (!this.enabled || !this.initialized) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const noise = this.createNoise(0.1);

        osc.connect(gain);
        noise.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.15);

        gain.gain.setValueAtTime(this.sfxVolume * 0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.15);
    }

    // Generate player death sound
    playPlayerDeath() {
        if (!this.enabled || !this.initialized) return;

        // Low rumble
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();

        osc1.connect(gain1);
        gain1.connect(this.masterGain);

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(100, this.audioContext.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.5);

        gain1.gain.setValueAtTime(this.sfxVolume * 0.4, this.audioContext.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        osc1.start(this.audioContext.currentTime);
        osc1.stop(this.audioContext.currentTime + 0.5);

        // High screech
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();

        osc2.connect(gain2);
        gain2.connect(this.masterGain);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);

        gain2.gain.setValueAtTime(this.sfxVolume * 0.2, this.audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc2.start(this.audioContext.currentTime);
        osc2.stop(this.audioContext.currentTime + 0.3);
    }

    // Generate boss spawn sound
    playBossSpawn() {
        if (!this.enabled || !this.initialized) return;

        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            const startTime = this.audioContext.currentTime + i * 0.1;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(100 + i * 50, startTime);
            osc.frequency.exponentialRampToValueAtTime(50, startTime + 0.3);

            gain.gain.setValueAtTime(this.sfxVolume * 0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        }
    }

    // Generate boss death sound
    playBossDeath() {
        if (!this.enabled || !this.initialized) return;

        // Explosion sequence
        for (let i = 0; i < 5; i++) {
            const startTime = this.audioContext.currentTime + i * 0.15;

            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const noise = this.createNoise(0.3, startTime);

            osc.connect(gain);
            noise.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80 - i * 10, startTime);
            osc.frequency.exponentialRampToValueAtTime(20, startTime + 0.2);

            gain.gain.setValueAtTime(this.sfxVolume * 0.4, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        }
    }

    // Generate explosion sound
    playExplosion() {
        if (!this.enabled || !this.initialized) return;

        const noise = this.createNoise(0.2);
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        noise.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.2);

        gain.gain.setValueAtTime(this.sfxVolume * 0.4, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.2);
    }

    // Generate level complete sound
    playLevelComplete() {
        if (!this.enabled || !this.initialized) return;

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const startTime = this.audioContext.currentTime + i * 0.15;

            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(this.sfxVolume * 0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    // Generate combo sound
    playCombo(multiplier) {
        if (!this.enabled || !this.initialized) return;

        const baseFreq = 300 + Math.min(multiplier, 10) * 50;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.audioContext.currentTime + 0.05);

        gain.gain.setValueAtTime(this.sfxVolume * 0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    // Generate teleport sound
    playTeleport() {
        if (!this.enabled || !this.initialized) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2000, this.audioContext.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.2);

        gain.gain.setValueAtTime(this.sfxVolume * 0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.2);
    }

    // Generate helicopter sound
    playHelicopter() {
        if (!this.enabled || !this.initialized) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, this.audioContext.currentTime);

        gain.gain.setValueAtTime(this.sfxVolume * 0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    // Generate shockwave sound
    playShockwave() {
        if (!this.enabled || !this.initialized) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.3);

        gain.gain.setValueAtTime(this.sfxVolume * 0.4, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    // Create noise generator
    createNoise(duration, startTime = null) {
        const start = startTime || this.audioContext.currentTime;
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);

        noise.connect(gain);
        noise.start(start);
        noise.stop(start + duration);

        return gain;
    }

    // Background music (simple ambient drone)
    startMusic(level = 1) {
        if (!this.enabled || !this.initialized) return;

        this.stopMusic();

        this.musicOsc1 = this.audioContext.createOscillator();
        this.musicOsc2 = this.audioContext.createOscillator();
        this.musicGain = this.audioContext.createGain();

        this.musicOsc1.connect(this.musicGain);
        this.musicOsc2.connect(this.musicGain);
        this.musicGain.connect(this.masterGain);

        // Base frequency increases with level for tension
        const baseFreq = 40 + level * 5;

        this.musicOsc1.type = 'sine';
        this.musicOsc1.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);

        this.musicOsc2.type = 'triangle';
        this.musicOsc2.frequency.setValueAtTime(baseFreq * 1.5, this.audioContext.currentTime);

        this.musicGain.gain.setValueAtTime(this.musicVolume * 0.1, this.audioContext.currentTime);

        this.musicOsc1.start();
        this.musicOsc2.start();
    }

    stopMusic() {
        if (this.musicOsc1) {
            this.musicOsc1.stop();
            this.musicOsc1 = null;
        }
        if (this.musicOsc2) {
            this.musicOsc2.stop();
            this.musicOsc2 = null;
        }
    }

    // Toggle sound on/off
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopMusic();
        }
        return this.enabled;
    }

    setVolume(volume) {
        this.masterVolume = Utils.clamp(volume, 0, 1);
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }
}

// Global audio instance
const Audio = new AudioSystem();
