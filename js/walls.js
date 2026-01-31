// Wall System for Zombie Apocalypse Game

// Wall class - indestructible obstacles
class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = '#555555';
        this.borderColor = '#333333';
    }

    // Check collision with a circle (player, zombie)
    checkCircleCollision(cx, cy, radius) {
        // Find the closest point on the rectangle to the circle
        const closestX = Utils.clamp(cx, this.x, this.x + this.width);
        const closestY = Utils.clamp(cy, this.y, this.y + this.height);

        // Calculate distance from closest point to circle center
        const distX = cx - closestX;
        const distY = cy - closestY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        return distance < radius;
    }

    // Get push-back vector for circle collision
    getPushBack(cx, cy, radius) {
        const closestX = Utils.clamp(cx, this.x, this.x + this.width);
        const closestY = Utils.clamp(cy, this.y, this.y + this.height);

        const distX = cx - closestX;
        const distY = cy - closestY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance === 0) {
            // Circle center is inside the wall, push in a default direction
            return { x: 1, y: 0, overlap: radius };
        }

        const overlap = radius - distance;
        if (overlap > 0) {
            return {
                x: (distX / distance) * overlap,
                y: (distY / distance) * overlap,
                overlap: overlap
            };
        }

        return null;
    }

    // Check if a point is inside the wall
    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    // Check collision with a bullet (line segment)
    checkBulletCollision(x, y, radius) {
        return this.checkCircleCollision(x, y, radius);
    }

    draw(ctx) {
        // Wall shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + 4, this.y + 4, this.width, this.height);

        // Wall body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Wall border
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Brick pattern
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;

        const brickHeight = 20;
        const brickWidth = 40;

        for (let row = 0; row < this.height / brickHeight; row++) {
            const y = this.y + row * brickHeight;
            if (y >= this.y + this.height) break;

            // Horizontal line
            ctx.beginPath();
            ctx.moveTo(this.x, y);
            ctx.lineTo(this.x + this.width, y);
            ctx.stroke();

            // Vertical lines (offset every other row)
            const offset = (row % 2) * (brickWidth / 2);
            for (let col = 0; col <= this.width / brickWidth + 1; col++) {
                const x = this.x + col * brickWidth - offset;
                if (x > this.x && x < this.x + this.width) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, Math.min(y + brickHeight, this.y + this.height));
                    ctx.stroke();
                }
            }
        }

        // Top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(this.x, this.y, this.width, 4);
    }
}

// Wall Manager - handles all walls in a level
class WallManager {
    constructor() {
        this.walls = [];
    }

    // Generate walls for a specific level
    generateForLevel(level) {
        this.walls = [];

        // Wall parameters based on level
        // More walls as level increases
        const baseWallCount = Math.min(level, 5); // 1-5 walls based on level
        const wallCount = baseWallCount + Math.floor(level / 2); // Extra walls at higher levels

        // Minimum wall dimensions
        const minWallWidth = 60;
        const maxWallWidth = 150;
        const minWallHeight = 40;
        const maxWallHeight = 120;

        // Safe zone in center (where player spawns)
        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;
        const safeRadius = 150;

        // Screen margins
        const margin = 100;

        for (let i = 0; i < wallCount; i++) {
            let attempts = 0;
            let validPosition = false;
            let wall;

            while (!validPosition && attempts < 50) {
                attempts++;

                // Random wall size
                const width = Utils.randomInt(minWallWidth, maxWallWidth);
                const height = Utils.randomInt(minWallHeight, maxWallHeight);

                // Random position
                const x = Utils.randomInt(margin, GAME_WIDTH - margin - width);
                const y = Utils.randomInt(margin, GAME_HEIGHT - margin - height);

                wall = new Wall(x, y, width, height);

                // Check if wall is in safe zone (center of screen)
                const wallCenterX = x + width / 2;
                const wallCenterY = y + height / 2;
                const distToCenter = Utils.distance(wallCenterX, wallCenterY, centerX, centerY);

                if (distToCenter < safeRadius + Math.max(width, height) / 2) {
                    continue; // Too close to spawn point
                }

                // Check if wall overlaps with existing walls
                let overlaps = false;
                for (const existingWall of this.walls) {
                    if (this.wallsOverlap(wall, existingWall, 30)) {
                        overlaps = true;
                        break;
                    }
                }

                if (!overlaps) {
                    validPosition = true;
                }
            }

            if (validPosition && wall) {
                this.walls.push(wall);
            }
        }
    }

    // Check if two walls overlap (with padding)
    wallsOverlap(wall1, wall2, padding = 0) {
        return !(wall1.x + wall1.width + padding < wall2.x ||
                 wall2.x + wall2.width + padding < wall1.x ||
                 wall1.y + wall1.height + padding < wall2.y ||
                 wall2.y + wall2.height + padding < wall1.y);
    }

    // Check and resolve collision for a circle entity (player/zombie)
    resolveCircleCollision(entity) {
        for (const wall of this.walls) {
            const pushBack = wall.getPushBack(entity.x, entity.y, entity.radius);
            if (pushBack) {
                entity.x += pushBack.x;
                entity.y += pushBack.y;
            }
        }
    }

    // Check if a position would collide with walls
    checkCircleCollision(x, y, radius) {
        for (const wall of this.walls) {
            if (wall.checkCircleCollision(x, y, radius)) {
                return true;
            }
        }
        return false;
    }

    // Check bullet collision and return the wall if hit
    checkBulletCollision(x, y, radius) {
        for (const wall of this.walls) {
            if (wall.checkBulletCollision(x, y, radius)) {
                return wall;
            }
        }
        return null;
    }

    // Get a safe spawn position (not inside a wall)
    getSafeSpawnPosition(x, y, radius) {
        let safeX = x;
        let safeY = y;
        let attempts = 0;

        while (this.checkCircleCollision(safeX, safeY, radius) && attempts < 10) {
            safeX = x + Utils.random(-50, 50);
            safeY = y + Utils.random(-50, 50);
            attempts++;
        }

        return { x: safeX, y: safeY };
    }

    draw(ctx) {
        for (const wall of this.walls) {
            wall.draw(ctx);
        }
    }

    clear() {
        this.walls = [];
    }

    getWalls() {
        return this.walls;
    }
}
