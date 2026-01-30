# Zombie Apocalypse - 10 Levels of Survival

A browser-based 2D zombie shooter game with 10 progressively harder levels. Built with HTML5 Canvas and vanilla JavaScript.

## Game Features

- **10 Unique Levels** - Each level introduces new zombie types and challenges
- **11 Zombie Types** - From basic walkers to teleporting nightmares
- **10 Epic Bosses** - Each level culminates in a unique boss battle
- **360-Degree Shooting** - Mouse aim with precise controls
- **Combo System** - Chain kills for score multipliers
- **Particle Effects** - Blood, explosions, and visual feedback
- **Procedural Audio** - Generated sound effects using Web Audio API

## Controls

| Input | Action |
|-------|--------|
| WASD / Arrow Keys | Move |
| Mouse | Aim |
| Left Click | Shoot |
| Space | Pause |
| R | Restart Level |

## Level Progression

### Level 1: The Awakening
- Basic Walkers - slow, predictable movement
- **Boss: Big Bernie** - Large zombie that spawns smaller ones when damaged

### Level 2: Speed Demons
- Runners (40%) - Fast zombies with zigzag movement
- **Boss: Sprint Sally** - Ultra-fast circling zombie

### Level 3: From Above
- Flying Zombies (30%) - Swooping bat-like movement
- **Boss: Sky Reaper** - Drops flying zombies from above

### Level 4: Mad Rush
- Berserkers (30%) - Charge attacks with brief wind-up
- **Boss: Rage King** - Creates shockwaves that push players

### Level 5: Vehicle Mayhem
- Zombie Cars (25%) - Release zombies when destroyed
- Jumpers (25%) - Leap toward player in arcs
- **Boss: Monster Truck Mike** - Armored vehicle with charge attacks

### Level 6: Helicopter Hell
- Helicopters (20%) - Hover and drop zombies
- Dive Bombers (20%) - Kamikaze flying zombies
- **Boss: Chopper Commander** - Attack helicopter circling the arena

### Level 7: The Horde
- All previous types in swarms of 3-5
- Increased spawn rate
- **Boss: Horde Master** - Splits into multiple zombies when hit

### Level 8: Elite Squad
- Tank Zombies (20%) - Heavy armor, multiple hits required
- Teleporters (15%) - Blink toward player unpredictably
- Shielded Zombies (15%) - Must be shot from behind
- **Boss: Tactical Nightmare** - Teleports and spawns shielded minions

### Level 9: Chaos Theory
- All zombie types randomly mixed
- Some spawn close to player
- Erratic movement patterns
- **Boss: Chaos Incarnate** - Shape-shifts between boss forms

### Level 10: Apocalypse
- Every zombie type simultaneously
- Final 30 seconds: spawn rate doubles
- **Boss: The Omega Zombie** - All abilities combined (fly, charge, teleport, shockwave, swarm)

## Installation & Running

### Option 1: Direct Browser (No Server)
Simply open `index.html` in a modern web browser.

### Option 2: Local Development Server
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Docker Deployment

#### Build and Run
```bash
# Build the Docker image
docker build -t zombie-apocalypse-game .

# Run the container
docker run -d -p 80:80 --name zombie-game zombie-apocalypse-game
```

#### Using Docker Compose
```bash
# Production build
docker-compose up -d

# Development mode with live reload
docker-compose --profile dev up zombie-game-dev
```

The game will be available at:
- Production: `http://localhost`
- Development: `http://localhost:8080`

#### Stop the Container
```bash
docker-compose down
# or
docker stop zombie-game && docker rm zombie-game
```

## Project Structure

```
zombie-apocalypse/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Game styling
├── js/
│   ├── utils.js        # Utility functions and constants
│   ├── audio.js        # Web Audio API sound system
│   ├── particles.js    # Particle effects system
│   ├── player.js       # Player class
│   ├── bullets.js      # Bullet management
│   ├── zombies.js      # All zombie type classes
│   ├── bosses.js       # All boss classes
│   ├── levels.js       # Level configuration
│   ├── ui.js           # UI management
│   └── game.js         # Main game controller
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose config
├── README.md           # This file
├── credits.txt         # Asset credits
└── .gitignore          # Git ignore rules
```

## Technical Features

- **Object Pooling** - Efficient memory management for bullets and particles
- **Collision Detection** - Circle-based collision for all entities
- **State Machine** - Zombie AI uses state machines for complex behaviors
- **Screen Shake** - Dynamic camera effects for impact
- **Combo System** - Score multipliers for consecutive kills
- **Web Audio API** - Procedurally generated sound effects

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Performance Tips

- The game is optimized for 60 FPS
- Object pooling handles up to 500 particles
- Collision detection is optimized for 100+ entities
- Close other browser tabs for best performance

## Development

### Making Changes
1. Edit the JavaScript files in the `js/` directory
2. Refresh the browser to see changes
3. Use browser DevTools for debugging

### Adding New Zombie Types
1. Create a new class extending `Zombie` in `zombies.js`
2. Add the type to `ZombieManager.zombieTypes`
3. Configure spawn rates in `levels.js`

### Adding New Bosses
1. Create a new class extending `Boss` in `bosses.js`
2. Add the boss to `BossManager.bossTypes`

## License

This game is provided for educational purposes. Feel free to modify and distribute.

## Credits

See `credits.txt` for full credits and attributions.

---

**Good luck, and may you survive the Zombie Apocalypse!**
