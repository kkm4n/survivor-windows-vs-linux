const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerImg = new Image();
playerImg.src = "assets/player.png";

const enemyImg = new Image();
enemyImg.src = "assets/enemy.png";

const appleImg = new Image();
appleImg.src = "assets/apple.png";

const goldenAppleImg = new Image();
goldenAppleImg.src = "assets/golden_apple.png"; // Ajoute une image dans ton dossier !

let player = {
    x: 400,
    y: 300,
    width: 40,
    height: 40,
    speed: 3,
    hp: 100,
    invincible: false,
    invincibilityTimer: 0
};

const enemies = [];
const apples = [];
const goldenApples = [];
const bullets = [];

let score = 0;
let gameOver = false;
let gameWin = false;

// JOYSTICK SETUP
let joystickContainer = document.getElementById('joystickContainer');
let joystick = document.getElementById('joystick');
let dragging = false;
let startX = 0, startY = 0;
let joystickDx = 0, joystickDy = 0;

joystickContainer.addEventListener('touchstart', function (e) {
    dragging = true;
    const touch = e.targetTouches[0];
    const rect = joystickContainer.getBoundingClientRect();
    startX = rect.left + rect.width / 2;
    startY = rect.top + rect.height / 2;
}, false);

joystickContainer.addEventListener('touchmove', function (e) {
    if (!dragging) return;
    e.preventDefault();

    const touch = e.targetTouches[0];
    let dx = touch.clientX - startX;
    let dy = touch.clientY - startY;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 60);

    const angle = Math.atan2(dy, dx);
    joystickDx = Math.cos(angle) * distance / 60;
    joystickDy = Math.sin(angle) * distance / 60;

    joystick.style.transform = `translate(${joystickDx * 60}px, ${joystickDy * 60}px)`;
}, false);

joystickContainer.addEventListener('touchend', function () {
    dragging = false;
    joystickDx = 0;
    joystickDy = 0;
    joystick.style.transform = `translate(0, 0)`;
}, false);

// Spawn Functions
function spawnEnemy() {
    let x, y;
    const side = Math.floor(Math.random() * 4);
    if (side === 0) { x = Math.random() * canvas.width; y = -40; }
    else if (side === 1) { x = canvas.width + 40; y = Math.random() * canvas.height; }
    else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 40; }
    else { x = -40; y = Math.random() * canvas.height; }

    enemies.push({ x, y, width: 40, height: 40, speed: 1.5, hp: 3 });
}

function spawnApple() {
    apples.push({
        x: Math.random() * (canvas.width - 50) + 25,
        y: Math.random() * (canvas.height - 50) + 25,
        width: 30,
        height: 30
    });
}

function spawnGoldenApple() {
    goldenApples.push({
        x: Math.random() * (canvas.width - 50) + 25,
        y: Math.random() * (canvas.height - 50) + 25,
        width: 30,
        height: 30
    });
}

function shootBullet(direction) {
    let velocity = { x: 0, y: 0 };
    const speed = 5;

    switch (direction) {
        case "ArrowUp": velocity.y = -speed; break;
        case "ArrowLeft": velocity.x = -speed; break;
        case "ArrowDown": velocity.y = speed; break;
        case "ArrowRight": velocity.x = speed; break;
    }

    if (velocity.x !== 0 || velocity.y !== 0) {
        bullets.push({
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            width: 8,
            height: 8,
            speed: speed,
            velocity: velocity
        });
    }
}

// Control clavier
let keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;

    if (["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"].includes(e.key)) {
        shootBullet(e.key);
    }
});

window.addEventListener("keyup", (e) => keys[e.key] = false);

function update() {
    if (gameOver || gameWin) return;

    let dx = 0, dy = 0;

    // Mouvement clavier
    if (keys["z"]) dy -= 1;
    if (keys["s"]) dy += 1;
    if (keys["q"]) dx -= 1;
    if (keys["d"]) dx += 1;

    // Mouvement joystick
    dx += joystickDx;
    dy += joystickDy;

    const length = Math.hypot(dx, dy);
    if (length > 0) {
        dx /= length;
        dy /= length;
    }

    player.x += dx * player.speed;
    player.y += dy * player.speed;

    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    enemies.forEach((enemy, index) => {
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        enemy.x += dx / dist * enemy.speed;
        enemy.y += dy / dist * enemy.speed;

        if (!player.invincible &&
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {

            player.hp -= 10;
            player.invincible = true;
            player.invincibilityTimer = 60;
            enemies.splice(index, 1);
            if (player.hp <= 0) {
                gameOver = true;
            }
        }
    });

    bullets.forEach((bullet, bIndex) => {
        bullet.x += bullet.velocity.x;
        bullet.y += bullet.velocity.y;

        enemies.forEach((enemy, eIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {

                enemy.hp -= 1;

                if (enemy.hp <= 0) {
                    enemies.splice(eIndex, 1);
                    score += 10;
                }

                bullets.splice(bIndex, 1);
            }
        });

        if (
            bullet.x < 0 || bullet.x > canvas.width ||
            bullet.y < 0 || bullet.y > canvas.height
        ) {
            bullets.splice(bIndex, 1);
        }
    });

    apples.forEach((apple, index) => {
        if (player.x < apple.x + apple.width &&
            player.x + player.width > apple.x &&
            player.y < apple.y + apple.height &&
            player.y + player.height > apple.y) {
            apples.splice(index, 1);
            player.invincible = true;
            player.invincibilityTimer = 300;
        }
    });

    goldenApples.forEach((gApple, index) => {
        if (player.x < gApple.x + gApple.width &&
            player.x + player.width > gApple.x &&
            player.y < gApple.y + gApple.height) {

            goldenApples.splice(index, 1);
            player.hp += 10;
            if (player.hp > 100) player.hp = 100;
        }
    });

    if (player.invincible) {
        player.invincibilityTimer--;
        if (player.invincibilityTimer <= 0) {
            player.invincible = false;
        }
    }

    if (score >= 1000) {
        gameWin = true;
    }
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#0f2027");
    gradient.addColorStop(0.5, "#203a43");
    gradient.addColorStop(1, "#2c5364");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function draw() {
    drawBackground();

    ctx.globalAlpha = player.invincible ? 0.5 : 1;
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    ctx.globalAlpha = 1;

    enemies.forEach(enemy => {
        ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.fillStyle = "red";
        ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
        ctx.fillStyle = "green";
        ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * (enemy.hp / 3), 5);
    });

    ctx.fillStyle = "yellow";
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    apples.forEach(apple => {
        ctx.drawImage(appleImg, apple.x, apple.y, apple.width, apple.height);
    });

    goldenApples.forEach(gApple => {
        ctx.drawImage(goldenAppleImg, gApple.x, gApple.y, gApple.width, gApple.height);
    });

    ctx.fillStyle = "red";
    ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = "green";
    ctx.fillRect(20, 20, 2 * player.hp, 20);
    ctx.strokeStyle = "white";
    ctx.strokeRect(20, 20, 200, 20);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 650, 40);

    if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "50px Arial";
        ctx.fillText("Game Over", 280, 300);
        ctx.font = "30px Arial";
        ctx.fillText("Final Score: " + score, 310, 350);
    }

    if (gameWin) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "gold";
        ctx.font = "50px Arial";
        ctx.fillText("✨ VICTOIRE ! ✨", 250, 300);
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.fillText("Tu es le maître de la survie avec " + score + " points !", 150, 350);
    }
}

function gameLoop() {
    update();
    draw();
    if (!gameOver && !gameWin) requestAnimationFrame(gameLoop);
}

setInterval(spawnEnemy, 1000);
setInterval(spawnApple, 10000);
setInterval(spawnGoldenApple, 15000);

gameLoop();
