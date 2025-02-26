let player;
let platforms = [];
let gravity = 0.5;
let jumpCharge = 0;
let isCharging = false;
let score = 0;
let gameOver = false;

// Paramètres configurables
const SCROLL_SPEED = 4;
const INITIAL_PLATFORMS = 6;
const SHAKE_THRESHOLD = 12;
const TARGET_HEIGHT = 450;
const MIN_PLATFORM_SPACING = 150;
// Nouveaux paramètres pour l'animation
const INITIAL_HEIGHT = 40;
const INITIAL_WIDTH = 30;
const MIN_SQUASH = 0.5; // 50% de la hauteur initiale
const MAX_STRETCH = 1.5; // 150% de la hauteur initiale

function setup() {
  createCanvas(400, 600);
  resetGame();
}

function draw() {
  background(220);
  
  if (!gameOver) {
    updatePlayer();
    checkCollisions();
    
    if (player.velocity < 0) {
      scrollPlatforms(SCROLL_SPEED);
      player.rotation += map(abs(player.lastJumpForce), 10, 15, 0.2, 0.5);
    } else {
      player.rotation = 0;
      if (player.onPlatform && !isCharging && player.y < TARGET_HEIGHT) {
        scrollPlatforms(SCROLL_SPEED * 0.5);
      }
    }
    
    displayGame();
    
    if (player.y > height) {
      gameOver = true;
    }
  } else {
    displayGameOver();
  }
  
  fill(0);
  textSize(20);
  textAlign(LEFT);
  text(`Score: ${score}`, 10, 30);
}

function updatePlayer() {
  if (keyIsDown(LEFT_ARROW)) player.x -= 5;
  if (keyIsDown(RIGHT_ARROW)) player.x += 5;
  player.x = constrain(player.x, 0, width - player.currentW);
  
  player.velocity += gravity;
  player.y += player.velocity;
  
  // Animation du squash pendant la charge
  if (isCharging) {
    jumpCharge = constrain(jumpCharge + 0.2, 10, 15);
    let squashFactor = map(jumpCharge, 0, 15, 1, MIN_SQUASH);
    player.currentH = INITIAL_HEIGHT * squashFactor;
    player.currentW = INITIAL_WIDTH / squashFactor; // Conservation du volume
    if (jumpCharge > SHAKE_THRESHOLD) {
      player.shakeOffset = random(-map(jumpCharge, SHAKE_THRESHOLD, 15, 1, 5), 
                                 map(jumpCharge, SHAKE_THRESHOLD, 15, 1, 5));
    } else {
      player.shakeOffset = 0;
    }
  } 
  // Animation du stretch pendant le saut
  else if (!player.onPlatform) {
    if (player.velocity < 0) { // Phase ascendante
      let stretchFactor = map(abs(player.velocity), 0, 15, 1, MAX_STRETCH);
      player.currentH = INITIAL_HEIGHT * stretchFactor;
      player.currentW = INITIAL_WIDTH / stretchFactor;
    } else { // Phase descendante
      let recoveryFactor = map(player.velocity, 0, 15, 1, MAX_STRETCH);
      player.currentH = INITIAL_HEIGHT * recoveryFactor;
      player.currentW = INITIAL_WIDTH / recoveryFactor;
    }
  }
  // Retour à la normale sur une plateforme
  else if (!isCharging) {
    player.currentH += (INITIAL_HEIGHT - player.currentH) * 0.1; // Interpolation douce
    player.currentW += (INITIAL_WIDTH - player.currentW) * 0.1;
  }
  
  player.onPlatform = false;
}

function displayGame() {
  for (let p of platforms) {
    fill(0, 255, 0);
    rect(p.x, p.y, p.w, p.h);
  }
  
  push();
  translate(player.x + player.currentW/2 + player.shakeOffset, 
           player.y + player.currentH/2 + player.shakeOffset);
  rotate(player.rotation);
  fill(255, 165, 0);
  rect(-player.currentW/2, -player.currentH/2, player.currentW, player.currentH);
  pop();
}

function keyPressed() {
  if (key === ' ') {
    isCharging = true;
  }
  if (key === 'r' || key === 'R') {
    resetGame();
  }
}

function keyReleased() {
  if (key === ' ') {
    isCharging = false;
    player.velocity = -jumpCharge;
    player.lastJumpForce = jumpCharge;
    jumpCharge = 0;
    player.shakeOffset = 0;
  }
}

function checkCollisions() {
  for (let p of platforms) {
    if (player.y + player.currentH >= p.y && 
        player.y + player.currentH <= p.y + p.h &&
        player.x + player.currentW > p.x && 
        player.x < p.x + p.w &&
        player.velocity > 0) {
      player.y = p.y - player.currentH;
      player.velocity = 0;
      player.onPlatform = true;
      
      if (p.y < player.highestPlatform) {
        score += 1000;
        player.highestPlatform = p.y;
      }
    }
  }
}

function scrollPlatforms(speed) {
  for (let p of platforms) {
    p.y += speed;
  }
  
  platforms = platforms.filter(p => p.y < height);
  
  if (platforms.length < INITIAL_PLATFORMS) {
    let lastY = platforms.length > 0 ? platforms[platforms.length-1].y : height;
    let newY = lastY - random(MIN_PLATFORM_SPACING, 100);
    platforms.push({
      x: random(0, width-100),
      y: newY,
      w: 100,
      h: 20
    });
  }
}

function resetGame() {
  player = {
    x: width/2,
    y: height - 60,
    w: INITIAL_WIDTH,          // Stocke la taille initiale
    h: INITIAL_HEIGHT,
    currentW: INITIAL_WIDTH,   // Taille actuelle pour l'animation
    currentH: INITIAL_HEIGHT,
    velocity: 0,
    rotation: 0,
    shakeOffset: 0,
    lastJumpForce: 0,
    highestPlatform: height,
    onPlatform: true
  };
  
  platforms = [];
  platforms.push({
    x: width/2 - 50,
    y: height - 20,
    w: 100,
    h: 20
  });
  
  for (let i = 1; i < INITIAL_PLATFORMS; i++) {
    let lastY = platforms[i-1].y;
    platforms.push({
      x: random(0, width-100),
      y: lastY - random(MIN_PLATFORM_SPACING, 100),
      w: 100,
      h: 20
    });
  }
  
  score = 0;
  gameOver = false;
}

function displayGameOver() {
  fill(0);
  textSize(40);
  textAlign(CENTER);
  text("Game Over", width/2, height/2);
  textSize(20);
  text("Press R to restart", width/2, height/2 + 40);
}