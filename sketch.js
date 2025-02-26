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
// Paramètres pour l'animation
const INITIAL_SIZE = 30; // Taille initiale carrée
const MIN_SQUASH = 0.5;
const MAX_STRETCH = 1.5;
const STILL_TIME_THRESHOLD = 60; // Frames avant retour à la forme carrée (1 seconde à 60fps)

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
        scrollPlatforms(SCROLL_SPEED * 0.8);
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
    player.currentH = INITIAL_SIZE * squashFactor;
    player.currentW = INITIAL_SIZE / squashFactor;
    if (jumpCharge > SHAKE_THRESHOLD) {
      player.shakeOffset = random(-map(jumpCharge, SHAKE_THRESHOLD, 15, 1, 5), 
                                 map(jumpCharge, SHAKE_THRESHOLD, 15, 1, 5));
    } else {
      player.shakeOffset = 0;
    }
    player.stillTime = 0; // Réinitialise le compteur
  } 
  // Animation du stretch pendant le saut
  else if (!player.onPlatform) {
    if (player.velocity < 0) { // Phase ascendante
      let stretchFactor = map(abs(player.velocity), 0, 15, 1, MAX_STRETCH);
      player.currentH = INITIAL_SIZE * stretchFactor;
      player.currentW = INITIAL_SIZE / stretchFactor;
    } else { // Phase descendante
      let recoveryFactor = map(player.velocity, 0, 15, 1, MAX_STRETCH);
      player.currentH = INITIAL_SIZE * recoveryFactor;
      player.currentW = INITIAL_SIZE / recoveryFactor;
    }
    player.stillTime = 0;
  } 
  // Retour progressif à la forme carrée quand immobile
  else if (!isCharging) {
    player.stillTime++;
    if (player.stillTime > STILL_TIME_THRESHOLD) {
      player.currentH += (INITIAL_SIZE - player.currentH) * 0.1;
      player.currentW += (INITIAL_SIZE - player.currentW) * 0.1;
    }
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
    y: height - 50, // Ajusté pour la nouvelle taille carrée
    w: INITIAL_SIZE,
    h: INITIAL_SIZE,
    currentW: INITIAL_SIZE,
    currentH: INITIAL_SIZE,
    velocity: 0,
    rotation: 0,
    shakeOffset: 0,
    lastJumpForce: 0,
    highestPlatform: height,
    onPlatform: true,
    stillTime: 0 // Compteur pour le temps immobile
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