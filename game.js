/**
 * Bima Saxti: Petualangan Galaksi
 * Core Game Engine - HTML5 Canvas Platformer with 10 Educational Levels & Quizzes.
 */

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

// Responsive canvas sizing
function resizeCanvas() {
    const container = document.getElementById("canvas-container");
    const aspect = 16 / 9;
    let width = container.clientWidth;
    let height = width / aspect;

    if (height > container.clientHeight) {
        height = container.clientHeight;
        width = height * aspect;
    }

    canvas.width = 1136; // Base logical resolution
    canvas.height = 640;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Game State & Settings
let gameState = "MENU"; // MENU, LEVEL_SELECT, PLAYING, QUIZ, VICTORY, GAMEOVER
let currentLevelIndex = 0;
let progress = window.secureStorage.loadProgress();
let gameLoopId = null;
let keys = {};
let score = 0;
let levelCoins = 0;
let showFactBanner = true;
let factBannerTimer = 0;

// On-screen touch buttons state
let touchControls = {
    left: false,
    right: false,
    jump: false
};

// Sound & Music System
const sounds = {
    mercury: new Audio("media/mercury.ogg"),
    venus: new Audio("media/venus.ogg"),
    earth: new Audio("media/earth.ogg"),
    mars: new Audio("media/mars.ogg"),
    theme: new Audio("media/tata surya kita.ogg"),
    fail: new Audio("media/failure-1-89170.ogg")
};

// Loop the theme music
sounds.theme.loop = true;

function playSound(name) {
    if (!progress.soundEnabled) return;
    if (sounds[name]) {
        sounds[name].currentTime = 0;
        sounds[name].play().catch(e => console.log("Audio play blocked by browser:", e));
    }
}

function stopAllSounds() {
    Object.keys(sounds).forEach(key => {
        if (key !== "theme") {
            sounds[key].pause();
            sounds[key].currentTime = 0;
        }
    });
}

function updateMusic() {
    if (progress.musicEnabled && (gameState === "PLAYING" || gameState === "QUIZ" || gameState === "MENU")) {
        sounds.theme.play().catch(e => console.log("Music play blocked:", e));
    } else {
        sounds.theme.pause();
    }
}

// 10 Level Definitions
const levels = [
    {
        name: "1. Matahari (The Sun)",
        bgColor: "radial-gradient(circle, #ff8c00 0%, #1a0800 100%)",
        gravity: 0.7,
        facts: "Matahari adalah bintang di pusat Tata Surya kita dan menyumbang 99,8% massa seluruh Tata Surya!",
        quiz: {
            question: "Berapa persentase total massa Tata Surya yang dimiliki oleh Matahari?",
            options: ["50%", "75.4%", "99.8%", "90%"],
            answer: 2
        },
        playerStart: { x: 80, y: 400 },
        rocket: { x: 1050, y: 150 },
        platforms: [
            { x: 0, y: 550, w: 300, h: 90, type: "ground" },
            { x: 380, y: 480, w: 200, h: 30, type: "ground" },
            { x: 650, y: 400, w: 200, h: 30, type: "ground" },
            { x: 920, y: 300, w: 220, h: 340, type: "ground" },
            { x: 450, y: 250, w: 150, h: 30, type: "floating" }
        ],
        coins: [
            { x: 480, y: 430 },
            { x: 750, y: 350 },
            { x: 520, y: 200 },
            { x: 980, y: 200 }
        ],
        hazards: [
            { x: 300, y: 600, w: 620, h: 40, type: "lava" }
        ]
    },
    {
        name: "2. Merkurius (Mercury)",
        bgColor: "radial-gradient(circle, #7f7f7f 0%, #0d0d0d 100%)",
        gravity: 0.6,
        facts: "Merkurius adalah planet terkecil di Tata Surya dan juga planet yang paling dekat dengan Matahari.",
        quiz: {
            question: "Planet manakah yang paling dekat dengan Matahari?",
            options: ["Venus", "Bumi", "Mars", "Merkurius"],
            answer: 3
        },
        playerStart: { x: 80, y: 450 },
        rocket: { x: 1050, y: 400 },
        platforms: [
            { x: 0, y: 580, w: 200, h: 60, type: "ground" },
            { x: 260, y: 500, w: 140, h: 30, type: "ground" },
            { x: 480, y: 420, w: 140, h: 30, type: "ground" },
            { x: 700, y: 350, w: 140, h: 30, type: "ground" },
            { x: 920, y: 500, w: 220, h: 140, type: "ground" }
        ],
        coins: [
            { x: 330, y: 450 },
            { x: 550, y: 370 },
            { x: 770, y: 300 }
        ],
        hazards: [
            { x: 200, y: 620, w: 720, h: 20, type: "spikes" }
        ]
    },
    {
        name: "3. Venus",
        bgColor: "radial-gradient(circle, #e3974d 0%, #170b00 100%)",
        gravity: 0.65,
        facts: "Venus adalah planet terpanas di Tata Surya kita karena atmosfernya yang sangat tebal menahan panas.",
        quiz: {
            question: "Mengapa Venus menjadi planet terpanas di Tata Surya kita?",
            options: [
                "Karena letaknya paling dekat dengan Matahari",
                "Atmosfernya tebal dan menahan efek rumah kaca",
                "Memiliki banyak gunung berapi aktif",
                "Venus memancarkan apinya sendiri"
            ],
            answer: 1
        },
        playerStart: { x: 80, y: 300 },
        rocket: { x: 1050, y: 380 },
        platforms: [
            { x: 0, y: 450, w: 220, h: 190, type: "ground" },
            { x: 300, y: 380, w: 180, h: 30, type: "ground" },
            { x: 550, y: 480, w: 180, h: 30, type: "ground" },
            { x: 800, y: 400, w: 120, h: 30, type: "ground" },
            { x: 980, y: 480, w: 160, h: 160, type: "ground" }
        ],
        coins: [
            { x: 390, y: 330 },
            { x: 640, y: 430 },
            { x: 860, y: 350 }
        ],
        hazards: [
            { x: 220, y: 610, w: 760, h: 30, type: "lava" }
        ]
    },
    {
        name: "4. Bumi (Earth)",
        bgColor: "radial-gradient(circle, #2a82e6 0%, #031326 100%)",
        gravity: 0.7,
        facts: "Bumi adalah satu-satunya planet yang diketahui memiliki kehidupan dan air cair di permukaannya.",
        quiz: {
            question: "Apa keunikan utama planet Bumi dibandingkan planet lain di Tata Surya?",
            options: [
                "Merupakan planet terbesar",
                "Satu-satunya planet dengan cincin es",
                "Satu-satunya planet yang diketahui memiliki kehidupan & air cair",
                "Memiliki 100 buah bulan"
            ],
            answer: 2
        },
        playerStart: { x: 60, y: 400 },
        rocket: { x: 1050, y: 190 },
        platforms: [
            { x: 0, y: 550, w: 250, h: 90, type: "ground" },
            { x: 200, y: 460, w: 120, h: 30, type: "floating" },
            { x: 400, y: 380, w: 120, h: 30, type: "floating" },
            { x: 600, y: 450, w: 120, h: 30, type: "floating" },
            { x: 800, y: 380, w: 150, h: 30, type: "floating" },
            { x: 1000, y: 300, w: 140, h: 340, type: "ground" }
        ],
        coins: [
            { x: 260, y: 410 },
            { x: 460, y: 330 },
            { x: 660, y: 400 },
            { x: 870, y: 330 }
        ],
        hazards: [
            { x: 250, y: 620, w: 750, h: 20, type: "spikes" }
        ]
    },
    {
        name: "5. Bulan (The Moon)",
        bgColor: "radial-gradient(circle, #4d5766 0%, #080a0f 100%)",
        gravity: 0.3, // Low gravity!
        facts: "Bulan adalah satu-satunya satelit alami Bumi dan memiliki gravitasi hanya seperenam dari gravitasi Bumi.",
        quiz: {
            question: "Berapakah perkiraan gravitasi Bulan dibandingkan dengan Bumi?",
            options: ["Setengahnya", "Seperenamnya", "Sama saja", "Dua kali lipat"],
            answer: 1
        },
        playerStart: { x: 50, y: 400 },
        rocket: { x: 1050, y: 250 },
        platforms: [
            { x: 0, y: 580, w: 200, h: 60, type: "ground" },
            { x: 300, y: 420, w: 150, h: 30, type: "ground" },
            { x: 600, y: 320, w: 150, h: 30, type: "ground" },
            { x: 900, y: 450, w: 240, h: 190, type: "ground" }
        ],
        coins: [
            { x: 375, y: 370 },
            { x: 675, y: 270 },
            { x: 950, y: 400 }
        ],
        hazards: [
            { x: 200, y: 630, w: 700, h: 10, type: "spikes" }
        ]
    },
    {
        name: "6. Mars",
        bgColor: "radial-gradient(circle, #c4573b 0%, #1a0804 100%)",
        gravity: 0.5,
        facts: "Mars disebut Planet Merah karena kandungan besi oksida (karat) di permukaannya.",
        quiz: {
            question: "Mengapa Mars mendapat julukan 'Planet Merah'?",
            options: [
                "Karena suhunya yang sangat membara",
                "Kandungan besi oksida (karat) di permukaannya",
                "Memiliki banyak lautan magma",
                "Atmosfernya terbuat dari neon merah"
            ],
            answer: 1
        },
        playerStart: { x: 80, y: 400 },
        rocket: { x: 1050, y: 300 },
        platforms: [
            { x: 0, y: 550, w: 200, h: 90, type: "ground" },
            { x: 280, y: 460, w: 160, h: 30, type: "ground" },
            { x: 520, y: 380, w: 160, h: 30, type: "ground" },
            { x: 780, y: 450, w: 160, h: 30, type: "ground" },
            { x: 980, y: 400, w: 160, h: 240, type: "ground" }
        ],
        coins: [
            { x: 360, y: 410 },
            { x: 600, y: 330 },
            { x: 860, y: 400 }
        ],
        hazards: [
            { x: 200, y: 620, w: 780, h: 20, type: "spikes" }
        ]
    },
    {
        name: "7. Yupiter (Jupiter)",
        bgColor: "radial-gradient(circle, #d4a373 0%, #1d1208 100%)",
        gravity: 0.9, // High gravity!
        facts: "Yupiter adalah planet terbesar di Tata Surya kita dan memiliki badai raksasa yang berputar selama ratusan tahun.",
        quiz: {
            question: "Planet manakah yang merupakan planet terbesar di Tata Surya kita?",
            options: ["Saturnus", "Bumi", "Uranus", "Yupiter"],
            answer: 3
        },
        playerStart: { x: 80, y: 300 },
        rocket: { x: 1050, y: 450 },
        platforms: [
            { x: 0, y: 450, w: 200, h: 190, type: "ground" },
            { x: 280, y: 400, w: 150, h: 30, type: "ground" },
            { x: 500, y: 350, w: 150, h: 30, type: "ground" },
            { x: 720, y: 420, w: 150, h: 30, type: "ground" },
            { x: 950, y: 550, w: 200, h: 90, type: "ground" }
        ],
        coins: [
            { x: 350, y: 350 },
            { x: 570, y: 300 },
            { x: 790, y: 370 }
        ],
        hazards: [
            { x: 200, y: 610, w: 750, h: 30, type: "lava" }
        ]
    },
    {
        name: "8. Saturnus (Saturn)",
        bgColor: "radial-gradient(circle, #e0c897 0%, #1f1a10 100%)",
        gravity: 0.65,
        facts: "Saturnus terkenal karena memiliki sistem cincin yang sangat indah dan megah, yang terbuat dari es dan batu.",
        quiz: {
            question: "Cincin spektakuler yang dimiliki oleh planet Saturnus terbuat dari apa?",
            options: ["Emas murni", "Es dan debu batu", "Gas helium padat", "Awan asam sulfat"],
            answer: 1
        },
        playerStart: { x: 80, y: 400 },
        rocket: { x: 1050, y: 250 },
        platforms: [
            { x: 0, y: 550, w: 220, h: 90, type: "ground" },
            { x: 280, y: 480, w: 140, h: 30, type: "floating" },
            { x: 480, y: 400, w: 180, h: 30, type: "floating" },
            { x: 720, y: 350, w: 140, h: 30, type: "floating" },
            { x: 920, y: 380, w: 220, h: 260, type: "ground" }
        ],
        coins: [
            { x: 350, y: 430 },
            { x: 570, y: 350 },
            { x: 790, y: 300 }
        ],
        hazards: [
            { x: 220, y: 620, w: 700, h: 20, type: "spikes" }
        ]
    },
    {
        name: "9. Uranus",
        bgColor: "radial-gradient(circle, #a8dadc 0%, #0a2f35 100%)",
        gravity: 0.6,
        facts: "Uranus adalah raksasa es yang berotasi miring hampir 98 derajat, membuatnya seperti menggelinding saat mengitari Matahari.",
        quiz: {
            question: "Apa keunikan rotasi Uranus dibanding planet lain?",
            options: [
                "Berputar sangat cepat dibanding planet lain",
                "Memiliki arah rotasi yang sama persis dengan Bumi",
                "Berotasi sangat miring (hampir 98 derajat)",
                "Uranus tidak berotasi sama sekali"
            ],
            answer: 2
        },
        playerStart: { x: 80, y: 400 },
        rocket: { x: 1050, y: 300 },
        platforms: [
            { x: 0, y: 550, w: 180, h: 90, type: "ground" },
            { x: 240, y: 480, w: 160, h: 30, type: "ground" },
            { x: 460, y: 420, w: 160, h: 30, type: "ground" },
            { x: 680, y: 360, w: 160, h: 30, type: "ground" },
            { x: 900, y: 420, w: 240, h: 220, type: "ground" }
        ],
        coins: [
            { x: 320, y: 430 },
            { x: 540, y: 370 },
            { x: 760, y: 310 }
        ],
        hazards: [
            { x: 180, y: 620, w: 720, h: 20, type: "spikes" }
        ]
    },
    {
        name: "10. Neptunus (Neptune)",
        bgColor: "radial-gradient(circle, #3a86c8 0%, #05162a 100%)",
        gravity: 0.75,
        facts: "Neptunus adalah planet terjauh dari Matahari dan dikenal memiliki kecepatan angin tercepat di Tata Surya kita.",
        quiz: {
            question: "Planet manakah yang terjauh dari Matahari di Tata Surya kita sekarang?",
            options: ["Uranus", "Neptunus", "Saturnus", "Pluto"],
            answer: 1
        },
        playerStart: { x: 80, y: 400 },
        rocket: { x: 1050, y: 150 },
        platforms: [
            { x: 0, y: 550, w: 250, h: 90, type: "ground" },
            { x: 300, y: 460, w: 120, h: 30, type: "floating" },
            { x: 480, y: 380, w: 120, h: 30, type: "floating" },
            { x: 660, y: 300, w: 120, h: 30, type: "floating" },
            { x: 850, y: 240, w: 120, h: 30, type: "floating" },
            { x: 1000, y: 300, w: 140, h: 340, type: "ground" }
        ],
        coins: [
            { x: 360, y: 410 },
            { x: 540, y: 330 },
            { x: 720, y: 250 },
            { x: 910, y: 190 }
        ],
        hazards: [
            { x: 250, y: 620, w: 750, h: 20, type: "spikes" }
        ]
    }
];

// Player Entity
const player = {
    x: 0,
    y: 0,
    w: 32,
    h: 48,
    vx: 0,
    vy: 0,
    isGrounded: false,
    speed: 6,
    jumpForce: 13,
    frame: 0,
    facingRight: true,

    reset(start) {
        this.x = start.x;
        this.y = start.y;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.frame = 0;
        this.facingRight = true;
    },

    update(level) {
        // Physics logic
        const moveLeft = keys["KeyA"] || keys["ArrowLeft"] || touchControls.left;
        const moveRight = keys["KeyD"] || keys["ArrowRight"] || touchControls.right;
        const jumpPressed = keys["KeyW"] || keys["ArrowUp"] || keys["Space"] || touchControls.jump;

        if (moveLeft) {
            this.vx = -this.speed;
            this.facingRight = false;
            this.frame = (this.frame + 0.15) % 4;
        } else if (moveRight) {
            this.vx = this.speed;
            this.facingRight = true;
            this.frame = (this.frame + 0.15) % 4;
        } else {
            this.vx = 0;
            this.frame = 0; // idle frame
        }

        // Apply gravity
        this.vy += level.gravity;

        // Jump trigger
        if (jumpPressed && this.isGrounded) {
            this.vy = -this.jumpForce;
            this.isGrounded = false;
        }

        // Move horizontally and check collisions
        this.x += this.vx;
        this.checkHorizontalCollisions(level.platforms);

        // Move vertically and check collisions
        this.y += this.vy;
        this.checkVerticalCollisions(level.platforms);

        // Check boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;

        // Death condition (falling below level)
        if (this.y > canvas.height + 100) {
            handlePlayerDeath();
        }
    },

    checkHorizontalCollisions(platforms) {
        for (const p of platforms) {
            if (this.collidesWith(p)) {
                if (this.vx > 0) { // Moving right
                    this.x = p.x - this.w;
                } else if (this.vx < 0) { // Moving left
                    this.x = p.x + p.w;
                }
            }
        }
    },

    checkVerticalCollisions(platforms) {
        this.isGrounded = false;
        for (const p of platforms) {
            if (this.collidesWith(p)) {
                if (this.vy > 0) { // Falling down
                    this.y = p.y - this.h;
                    this.vy = 0;
                    this.isGrounded = true;
                } else if (this.vy < 0) { // Going up
                    this.y = p.y + p.h;
                    this.vy = 0;
                }
            }
        }
    },

    collidesWith(rect) {
        return this.x < rect.x + rect.w &&
               this.x + this.w > rect.x &&
               this.y < rect.y + rect.h &&
               this.y + this.h > rect.y;
    },

    draw() {
        // Draw character representation (a cute astronaut space suit)
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        // Suit Body
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(-16, -24, 32, 40, 8);
        ctx.fill();

        // Helmet
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, -14, 14, 0, Math.PI * 2);
        ctx.fill();

        // Glass visor
        ctx.fillStyle = "#33ccff";
        ctx.beginPath();
        ctx.ellipse(4, -14, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Visor shine
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.ellipse(7, -16, 3, 2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Suit Stripe (Bima identity)
        ctx.fillStyle = "#ff3366";
        ctx.fillRect(-16, 2, 32, 4);

        // Backpack (Oxygen tank)
        ctx.fillStyle = "#dddddd";
        ctx.roundRect(-22, -18, 6, 26, 3);
        ctx.fill();

        // Boots/Legs (moving animation)
        ctx.fillStyle = "#444444";
        const walkCycle = Math.sin(this.frame) * 4;
        ctx.fillRect(-12, 16, 8, 8 + (this.vx !== 0 ? walkCycle : 0));
        ctx.fillRect(4, 16, 8, 8 - (this.vx !== 0 ? walkCycle : 0));

        ctx.restore();
    }
};

// Particles (for beauty effects)
let particles = [];
function createParticle(x, y, color) {
    particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2,
        size: Math.random() * 5 + 2,
        life: 1,
        decay: Math.random() * 0.03 + 0.01,
        color
    });
}

function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
}

// Coins & Hazards list state per play
let activeCoins = [];
function initLevelState(level) {
    activeCoins = level.coins.map(c => ({ ...c, collected: false }));
    player.reset(level.playerStart);
    particles = [];
    levelCoins = 0;
    showFactBanner = true;
    factBannerTimer = 300; // Show educational banner for 5 seconds (60fps * 5)
    stopAllSounds();

    // Play corresponding planet guide voice or tune if level 1-4
    if (currentLevelIndex === 0) playSound("mercury");
    else if (currentLevelIndex === 1) playSound("venus");
    else if (currentLevelIndex === 2) playSound("earth");
    else if (currentLevelIndex === 3) playSound("mars");
}

function handlePlayerDeath() {
    playSound("fail");
    initLevelState(levels[currentLevelIndex]);
}

// Input Handlers
window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    // Prevent scrolling for navigation keys
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

// Setup mobile on-screen buttons
function setupMobileButtons() {
    const btnLeft = document.getElementById("btn-left");
    const btnRight = document.getElementById("btn-right");
    const btnJump = document.getElementById("btn-jump");

    if (!btnLeft) return; // Not in gameplay mode or UI elements not yet loaded

    const handleStart = (dir) => (e) => {
        e.preventDefault();
        touchControls[dir] = true;
    };
    const handleEnd = (dir) => (e) => {
        e.preventDefault();
        touchControls[dir] = false;
    };

    btnLeft.addEventListener("touchstart", handleStart("left"));
    btnLeft.addEventListener("touchend", handleEnd("left"));
    btnRight.addEventListener("touchstart", handleStart("right"));
    btnRight.addEventListener("touchend", handleEnd("right"));
    btnJump.addEventListener("touchstart", handleStart("jump"));
    btnJump.addEventListener("touchend", handleEnd("jump"));
}

// Drawing Utilities
function drawLevel(level) {
    // Background gradient
    const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 50,
        canvas.width / 2, canvas.height / 2, canvas.width / 1.5
    );
    // Parse color stops from radial definition or use simple color
    ctx.fillStyle = level.bgColor.includes("gradient") ? "#070e17" : level.bgColor;
    
    // Custom beautiful background color matching
    if (level.bgColor.includes("#ff8c00")) {
        grad.addColorStop(0, "#2c0e00");
        grad.addColorStop(1, "#070200");
        ctx.fillStyle = grad;
    } else if (level.bgColor.includes("#7f7f7f")) {
        grad.addColorStop(0, "#1c1c1c");
        grad.addColorStop(1, "#050505");
        ctx.fillStyle = grad;
    } else if (level.bgColor.includes("#e3974d")) {
        grad.addColorStop(0, "#261502");
        grad.addColorStop(1, "#080400");
        ctx.fillStyle = grad;
    } else if (level.bgColor.includes("#2a82e6")) {
        grad.addColorStop(0, "#08274d");
        grad.addColorStop(1, "#020a14");
        ctx.fillStyle = grad;
    } else if (level.bgColor.includes("#4d5766")) {
        grad.addColorStop(0, "#191c21");
        grad.addColorStop(1, "#050608");
        ctx.fillStyle = grad;
    } else if (level.bgColor.includes("#c4573b")) {
        grad.addColorStop(0, "#2b0f0a");
        grad.addColorStop(1, "#0a0302");
        ctx.fillStyle = grad;
    } else if (level.bgColor.includes("#d4a373")) {
        grad.addColorStop(0, "#24170d");
        grad.addColorStop(1, "#080503");
        ctx.fillStyle = grad;
    } else if (level.bgColor.includes("#e0c897")) {
        grad.addColorStop(0, "#262116");
        grad.addColorStop(1, "#080704");
        ctx.fillStyle = grad;
    } else if (level.bgColor.includes("#a8dadc")) {
        grad.addColorStop(0, "#0f282c");
        grad.addColorStop(1, "#030a0b");
        ctx.fillStyle = grad;
    } else if (level.bgColor.includes("#3a86c8")) {
        grad.addColorStop(0, "#0b2036");
        grad.addColorStop(1, "#02070d");
        ctx.fillStyle = grad;
    }
    
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars in background
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 30; i++) {
        const x = (Math.sin(i * 12345.67) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(i * 98765.43) * 0.5 + 0.5) * canvas.height;
        const size = (Math.sin(i + Date.now() * 0.002) * 0.5 + 0.5) * 2 + 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Platforms
    for (const p of level.platforms) {
        let gradPlatform = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
        if (level.name.includes("Matahari")) {
            gradPlatform.addColorStop(0, "#ff5500");
            gradPlatform.addColorStop(1, "#330000");
        } else if (level.name.includes("Bumi")) {
            gradPlatform.addColorStop(0, "#2ecc71");
            gradPlatform.addColorStop(0.3, "#27ae60");
            gradPlatform.addColorStop(1, "#795548");
        } else if (level.name.includes("Merkurius")) {
            gradPlatform.addColorStop(0, "#95a5a6");
            gradPlatform.addColorStop(1, "#34495e");
        } else if (level.name.includes("Venus")) {
            gradPlatform.addColorStop(0, "#d35400");
            gradPlatform.addColorStop(1, "#2c3e50");
        } else if (level.name.includes("Bulan")) {
            gradPlatform.addColorStop(0, "#bdc3c7");
            gradPlatform.addColorStop(1, "#2c3e50");
        } else if (level.name.includes("Mars")) {
            gradPlatform.addColorStop(0, "#e74c3c");
            gradPlatform.addColorStop(1, "#2c0e00");
        } else if (level.name.includes("Yupiter")) {
            gradPlatform.addColorStop(0, "#e67e22");
            gradPlatform.addColorStop(1, "#7e3d11");
        } else if (level.name.includes("Saturnus")) {
            gradPlatform.addColorStop(0, "#f1c40f");
            gradPlatform.addColorStop(1, "#7f6000");
        } else if (level.name.includes("Uranus")) {
            gradPlatform.addColorStop(0, "#00cfc6");
            gradPlatform.addColorStop(1, "#003d3a");
        } else if (level.name.includes("Neptunus")) {
            gradPlatform.addColorStop(0, "#2980b9");
            gradPlatform.addColorStop(1, "#153d5a");
        } else {
            gradPlatform.addColorStop(0, "#555555");
            gradPlatform.addColorStop(1, "#222222");
        }

        ctx.fillStyle = gradPlatform;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 6);
        ctx.fill();

        // High premium stroke
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Hazards (lava or spikes)
    for (const h of level.hazards) {
        if (h.type === "lava") {
            const timeOffset = Math.sin(Date.now() * 0.005) * 8;
            ctx.fillStyle = "#ff2200";
            ctx.fillRect(h.x, h.y + timeOffset, h.w, h.h);
            
            // Outer glow line
            ctx.strokeStyle = "#ffaa00";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(h.x, h.y + timeOffset);
            ctx.lineTo(h.x + h.w, h.y + timeOffset);
            ctx.stroke();
            
            // Check collision with lava
            if (player.x + player.w > h.x && player.x < h.x + h.w && player.y + player.h > h.y + timeOffset) {
                handlePlayerDeath();
            }
        } else if (h.type === "spikes") {
            ctx.fillStyle = "#7f8c8d";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            
            // Draw spikes triangles
            const spikeWidth = 20;
            const spikeHeight = 15;
            const count = Math.ceil(h.w / spikeWidth);
            
            for (let i = 0; i < count; i++) {
                const sx = h.x + i * spikeWidth;
                const sy = h.y;
                ctx.beginPath();
                ctx.moveTo(sx, sy + h.h);
                ctx.lineTo(sx + spikeWidth / 2, sy);
                ctx.lineTo(sx + spikeWidth, sy + h.h);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            
            // Check collision with spikes
            if (player.x + player.w > h.x && player.x < h.x + h.w && player.y + player.h > h.y) {
                handlePlayerDeath();
            }
        }
    }

    // Finish Rocket
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.ellipse(level.rocket.x + 25, level.rocket.y + 40, 20, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    // Rocket Tip
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(level.rocket.x + 5, level.rocket.y + 15);
    ctx.lineTo(level.rocket.x + 25, level.rocket.y - 15);
    ctx.lineTo(level.rocket.x + 45, level.rocket.y + 15);
    ctx.closePath();
    ctx.fill();
    // Rocket Fins
    ctx.fillStyle = "#34495e";
    ctx.fillRect(level.rocket.x - 5, level.rocket.y + 50, 10, 25);
    ctx.fillRect(level.rocket.x + 45, level.rocket.y + 50, 10, 25);

    // Rocket flame effect
    if (Math.random() > 0.3) {
        createParticle(level.rocket.x + 25, level.rocket.y + 75, "#ff8800");
    }

    // Coins (Collectibles)
    for (const c of activeCoins) {
        if (!c.collected) {
            // Draw coin
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath();
            ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Star symbol on coin
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("*", c.x, c.y + 1);

            // Collect logic
            const dx = player.x + player.w / 2 - c.x;
            const dy = player.y + player.h / 2 - c.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < player.w / 2 + 10) {
                c.collected = true;
                levelCoins++;
                score += 50;
                createExplosion(c.x, c.y, "#f1c40f", 8);
            }
        }
    }
}

function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        createParticle(x, y, color);
    }
}

// HUD Rendering
function drawHUD(level) {
    // Level Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px 'Outfit', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(level.name, 20, 40);

    // Score
    ctx.textAlign = "right";
    ctx.fillText(`Skor: ${score}`, canvas.width - 20, 40);

    // Coin Tracker
    const collectedCount = activeCoins.filter(c => c.collected).length;
    ctx.textAlign = "center";
    ctx.fillText(`Energi: ${collectedCount} / ${activeCoins.length}`, canvas.width / 2, 40);

    // Educational Fact Banner at bottom
    if (showFactBanner && factBannerTimer > 0) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(50, canvas.height - 70, canvas.width - 100, 50, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#00d2ff";
        ctx.font = "14px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Fakta Galaksi: ${level.facts}`, canvas.width / 2, canvas.height - 40);
        
        factBannerTimer--;
    }
}

// Game Loop
function updateGame() {
    if (gameState === "PLAYING") {
        const level = levels[currentLevelIndex];
        player.update(level);

        // Clear and draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawLevel(level);
        updateAndDrawParticles();
        drawHUD(level);

        // Check if finished (collision with rocket)
        const lvl = levels[currentLevelIndex];
        const rx = lvl.rocket.x;
        const ry = lvl.rocket.y;
        if (player.x + player.w > rx && player.x < rx + 50 && player.y + player.h > ry && player.y < ry + 80) {
            // Trigger Educational Quiz!
            triggerQuiz(lvl);
        }
    }

    gameLoopId = requestAnimationFrame(updateGame);
}

// Quiz System Integration
function triggerQuiz(level) {
    gameState = "QUIZ";
    cancelAnimationFrame(gameLoopId);
    stopAllSounds();
    updateMusic();

    // Trigger overlay in DOM
    const quizOverlay = document.getElementById("quiz-overlay");
    const quizQuestion = document.getElementById("quiz-question");
    const quizOptionsContainer = document.getElementById("quiz-options");

    quizQuestion.textContent = level.quiz.question;
    quizOptionsContainer.innerHTML = "";

    level.quiz.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = "quiz-btn";
        btn.textContent = opt;
        btn.onclick = () => handleQuizAnswer(idx, level.quiz.answer);
        quizOptionsContainer.appendChild(btn);
    });

    quizOverlay.classList.remove("hidden");
}

function handleQuizAnswer(selectedIdx, correctIdx) {
    const quizOverlay = document.getElementById("quiz-overlay");
    quizOverlay.classList.add("hidden");

    if (selectedIdx === correctIdx) {
        // Correct! Save progress, unlock next level
        score += 200;
        const nextLvl = currentLevelIndex + 2; // idx is 0-based, levels are 1-based
        if (nextLvl > progress.unlockedLevel && nextLvl <= 10) {
            progress.unlockedLevel = nextLvl;
        }

        // Save star completed for this level
        progress.completedLevels[currentLevelIndex + 1] = {
            completed: true,
            score: score
        };
        progress.totalScore = score;
        window.secureStorage.saveProgress(progress);

        // Render congratulatory screen
        showSuccessModal();
    } else {
        // Wrong answer
        playSound("fail");
        showFailModal();
    }
}

function showSuccessModal() {
    const modal = document.getElementById("level-success-modal");
    const text = document.getElementById("success-info-text");
    text.textContent = `Hebat! Kamu berhasil mengumpulkan energi dan menjawab kuis tentang planet dengan benar. Skor kamu sekarang: ${score}`;
    modal.classList.remove("hidden");
}

function showFailModal() {
    const modal = document.getElementById("level-fail-modal");
    modal.classList.remove("hidden");
}

// Navigation Functions
window.startGameAtLevel = function(levelIdx) {
    currentLevelIndex = levelIdx;
    gameState = "PLAYING";
    
    // Hide menus, show canvas
    document.getElementById("main-menu").classList.add("hidden");
    document.getElementById("level-selector").classList.add("hidden");
    document.getElementById("gameplay-container").classList.remove("hidden");
    
    // Re-init player state
    initLevelState(levels[levelIdx]);
    
    // Setup controls & start loop
    setupMobileButtons();
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    updateGame();
    updateMusic();
};

window.nextLevel = function() {
    document.getElementById("level-success-modal").classList.add("hidden");
    if (currentLevelIndex < 9) {
        window.startGameAtLevel(currentLevelIndex + 1);
    } else {
        // Game Completed! Show Final Victory Screen
        gameState = "VICTORY";
        document.getElementById("gameplay-container").classList.add("hidden");
        document.getElementById("victory-screen").classList.remove("hidden");
    }
};

window.retryLevel = function() {
    document.getElementById("level-fail-modal").classList.add("hidden");
    window.startGameAtLevel(currentLevelIndex);
};

window.goBackToMenu = function() {
    gameState = "MENU";
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    stopAllSounds();

    // Hide active screens, show menu
    document.getElementById("gameplay-container").classList.add("hidden");
    document.getElementById("victory-screen").classList.add("hidden");
    document.getElementById("level-selector").classList.add("hidden");
    document.getElementById("level-success-modal").classList.add("hidden");
    document.getElementById("level-fail-modal").classList.add("hidden");
    document.getElementById("main-menu").classList.remove("hidden");
    
    updateMusic();
};

window.showLevelSelector = function() {
    gameState = "LEVEL_SELECT";
    document.getElementById("main-menu").classList.add("hidden");
    
    const container = document.getElementById("levels-grid");
    container.innerHTML = "";

    progress = window.secureStorage.loadProgress();

    levels.forEach((lvl, idx) => {
        const isUnlocked = (idx + 1) <= progress.unlockedLevel;
        const btn = document.createElement("div");
        btn.className = `level-card ${isUnlocked ? "unlocked" : "locked"}`;
        
        btn.innerHTML = `
            <h3>Level ${idx + 1}</h3>
            <p>${lvl.name.split(". ")[1] || lvl.name}</p>
            ${isUnlocked ? '<span class="status-badge">Terbuka</span>' : '<span class="status-badge locked">Terkunci</span>'}
        `;

        if (isUnlocked) {
            btn.onclick = () => window.startGameAtLevel(idx);
        }
        container.appendChild(btn);
    });

    document.getElementById("level-selector").classList.remove("hidden");
};

// UI Toggles
window.toggleSound = function() {
    progress.soundEnabled = !progress.soundEnabled;
    window.secureStorage.saveProgress(progress);
    document.getElementById("sound-btn").textContent = progress.soundEnabled ? "Suara: ON" : "Suara: OFF";
};

window.toggleMusic = function() {
    progress.musicEnabled = !progress.musicEnabled;
    window.secureStorage.saveProgress(progress);
    document.getElementById("music-btn").textContent = progress.musicEnabled ? "Musik: ON" : "Musik: OFF";
    updateMusic();
};

window.resetProgress = function() {
    if (confirm("Apakah kamu yakin ingin mengulang semua petualangan dari awal?")) {
        progress = window.secureStorage.clearProgress();
        alert("Petualangan kamu telah direset!");
        window.location.reload();
    }
};

// Initialize app UI labels on load
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("sound-btn").textContent = progress.soundEnabled ? "Suara: ON" : "Suara: OFF";
    document.getElementById("music-btn").textContent = progress.musicEnabled ? "Musik: ON" : "Musik: OFF";
    updateMusic();
});
