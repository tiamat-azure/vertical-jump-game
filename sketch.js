let player;
let platforms = [];
let gravity = 0.5;
let jumpCharge = 0;
let isCharging = false;
let score = 0;
let gameOver = false;
let lives = 3;

// Paramètres configurables
const SCROLL_SPEED = 8;
const INITIAL_PLATFORMS = 6;
const SHAKE_THRESHOLD = 12;
const TARGET_HEIGHT = 450;
const MIN_PLATFORM_SPACING = 150;
const SCROLL_SMOOTHNESS = 0.1;
const HEADER_HEIGHT = 50;
// Paramètres pour l'animation
const INITIAL_SIZE = 30;
const MIN_SQUASH = 0.5;
const MAX_SQUASH_WIDTH = 1.8;
const MAX_STRETCH = 1.5;
const STILL_TIME_THRESHOLD = 60;
// Paramètres pour la rotation
const MIN_ROTATIONS = 1;
const ROTATION_SPEED = 0.3;

const BOTTOM_MARGIN = 10; // Marge en bas de l'écran pour la plateforme la plus basse

const CANVA_W = 400;
const CANVA_H = 700;
const CANVA_BGCOLOR = 220;

function setup() {
  createCanvas(CANVA_W, CANVA_H);
  resetGame();
}

function draw() {
  background(CANVA_BGCOLOR);
  
  if (!gameOver) {
    updatePlayer();
    checkCollisions();
    
    if (player.velocity < 0) {
      scrollPlatforms(SCROLL_SPEED);
      player.rotation += ROTATION_SPEED;
    } else if (player.onPlatform) {
      player.rotation = 0;
    }
    
    displayGame();
    
    if (player.y > height) {
      lives--;
      if (lives > 0) {
        repositionPlayer();
      } else {
        gameOver = true;
      }
    }
  } else {
    displayGameOver();
  }

  fill(50, 50, 50);
  rect(0, 0, width, HEADER_HEIGHT);
  fill(255);
  textSize(20);
  textAlign(LEFT);
  text(`Score: ${score}`, 10, 30);
  displayLives();
}

function updatePlayer() {
  if (keyIsDown(LEFT_ARROW)) player.x -= 5;
  if (keyIsDown(RIGHT_ARROW)) player.x += 5;
  player.x = constrain(player.x, 0, width - player.currentW);
  
  if (!player.onPlatform || isCharging) {
    player.velocity += gravity;
    player.y += player.velocity;
  }
  
  if (isCharging) {
    jumpCharge = constrain(jumpCharge + 0.2, 10, 15);
    let squashFactor = map(jumpCharge, 0, 15, 1, MIN_SQUASH);
    player.currentH = INITIAL_SIZE * squashFactor;
    player.currentW = INITIAL_SIZE * map(squashFactor, 1, MIN_SQUASH, 1, MAX_SQUASH_WIDTH);
    if (jumpCharge > SHAKE_THRESHOLD) {
      player.shakeOffset = random(-map(jumpCharge, SHAKE_THRESHOLD, 15, 1, 5), 
                                 map(jumpCharge, SHAKE_THRESHOLD, 15, 1, 5));
    } else {
      player.shakeOffset = 0;
    }
    player.stillTime = 0;
  } 
  else if (!player.onPlatform) {
    if (player.velocity < 0) {
      let stretchFactor = map(abs(player.velocity), 0, 15, 1, MAX_STRETCH);
      player.currentH = INITIAL_SIZE * stretchFactor;
      player.currentW = INITIAL_SIZE / stretchFactor;
    } else {
      let recoveryFactor = map(player.velocity, 0, 15, 1, MAX_STRETCH);
      player.currentH = INITIAL_SIZE * recoveryFactor;
      player.currentW = INITIAL_SIZE / recoveryFactor;
    }
    player.stillTime = 0;
  } 
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
    if (p.y + p.h > HEADER_HEIGHT) {
      fill(0, 255, 0);
      noStroke();
      rect(p.x, p.y, p.w, p.h);
    }
  }
  
  push();
  translate(player.x + player.currentW/2 + player.shakeOffset, 
           player.y + player.currentH/2 + player.shakeOffset);
  rotate(player.rotation);
  fill(255, 165, 0);
  noStroke();
  rect(-player.currentW/2, -player.currentH/2, player.currentW, player.currentH);
  pop();
}

function keyPressed() {
  if (key === ' ' && player.canJump) { // Vérifie si le joueur peut sauter
    isCharging = true;
    player.canJump = false; // Désactive le saut jusqu'à l'atterrissage
  }
  if (key === 'r' || key === 'R') {
    resetGame();
  }
}

// Modifier keyReleased pour supprimer la condition sur canJump
function keyReleased() {
  if (key === ' ') {
    isCharging = false;
    player.velocity = -jumpCharge;
    player.lastJumpForce = jumpCharge;
    let rotationCount = MIN_ROTATIONS + floor(map(jumpCharge, 10, 15, 0, 2));
    player.targetRotation = rotationCount * TWO_PI;
    jumpCharge = 0;
    player.shakeOffset = 0;
  }
}

function checkCollisions() {
  for (let p of platforms) {
    if (player.y + player.currentH >= p.y && 
        player.y + player.currentH <= p.y + p.h + 2 &&
        player.x + player.currentW > p.x && 
        player.x < p.x + p.w &&
        player.velocity > 0) {
      player.y = p.y - player.currentH;
      player.velocity = 0;
      player.onPlatform = true;
      player.canJump = true; // Réactive la possibilité de sauter
      
      if (p.y < player.highestPlatform) {
        score += 1000;
        player.highestPlatform = p.y;
      }
    }
  }
}

function scrollPlatforms(targetSpeed) {
  let platformsBelow = platforms.filter(p => 
    p.y + p.h > HEADER_HEIGHT && p.y >= (player.onPlatform ? player.y : player.y + player.currentH)
  ).length;
  
  if (player.velocity < 0 && platformsBelow > 2) {
    for (let p of platforms) {
      if (!p.currentSpeed) p.currentSpeed = 0;
      
      p.currentSpeed += (targetSpeed - p.currentSpeed) * SCROLL_SMOOTHNESS;
      p.y += p.currentSpeed;
      
      if (player.onPlatform && 
          player.y + player.currentH === p.y && 
          player.x + player.currentW > p.x && 
          player.x < p.x + p.w) {
        player.y += p.currentSpeed;
      }
    }
  }
  
  platforms = platforms.filter(p => p.y < height);
  
  if (platforms.length < INITIAL_PLATFORMS) {
    let lastY = platforms.length > 0 ? platforms[platforms.length-1].y : height;
    let newY = lastY - random(100, 150);
    platforms.push({
      x: random(0, width-100),
      y: newY,
      w: 100,
      h: 20,
      currentSpeed: targetSpeed
    });
  }
}

function resetGame() {
  player = {
    x: width/2,
    y: height - 50,
    w: INITIAL_SIZE,
    h: INITIAL_SIZE,
    currentW: INITIAL_SIZE,
    currentH: INITIAL_SIZE,
    velocity: 0,
    rotation: 0,
    targetRotation: 0,
    shakeOffset: 0,
    lastJumpForce: 0,
    highestPlatform: height,
    onPlatform: true,
    stillTime: 0,
    canJump: true // Initialisé à true pour permettre le premier saut
  };
  
  platforms = [];
  platforms.push({
    x: width/2 - 50,
    y: height - 20,
    w: 100,
    h: 20,
    currentSpeed: 0
  });
  
  for (let i = 1; i < INITIAL_PLATFORMS; i++) {
    let lastY = platforms[i-1].y;
    platforms.push({
      x: random(0, width-100),
      y: lastY - random(MIN_PLATFORM_SPACING, 100),
      w: 100,
      h: 20,
      currentSpeed: 0
    });
  }
  
  score = 0;
  gameOver = false;
  lives = 3;
}

function displayGameOver() {
  fill(0);
  noStroke();
  textSize(40);
  textAlign(CENTER);
  text("Game Over", width/2, height/2);
  textSize(20);
  text("Press R to restart", width/2, height/2 + 40);
}

function displayLives() {
  const heartSize = 20;
  const heartSpacing = 10;
  const totalWidth = 3 * heartSize + 2 * heartSpacing;
  const startX = (width - totalWidth) / 2;
  
  for (let i = 0; i < 3; i++) {
    let x = startX + i * (heartSize + heartSpacing);
    let y = 15;
    
    noFill();
    stroke(255, 0, 0);
    strokeWeight(2);
    if (i < lives) {
      fill(255, 0, 0);
    }
    beginShape();
    vertex(x, y);
    bezierVertex(x - heartSize / 2, y - heartSize / 2, 
                 x - heartSize, y + heartSize / 3, 
                 x, y + heartSize);
    bezierVertex(x + heartSize, y + heartSize / 3, 
                 x + heartSize / 2, y - heartSize / 2, 
                 x, y);
    endShape(CLOSE);
    noStroke();
  }
}

function repositionPlayer() {
  let lowestPlatform = platforms.reduce((lowest, p) => 
    (p.y + p.h > HEADER_HEIGHT && p.y > lowest.y) ? p : lowest, 
    platforms.filter(p => p.y + p.h > HEADER_HEIGHT)[0] || platforms[0]);
  player.y = lowestPlatform.y - player.currentH;
  player.x = lowestPlatform.x + (lowestPlatform.w - player.currentW) / 2;
  player.velocity = 0;
  player.onPlatform = true;
  player.canJump = true; // Réactive le saut après repositionnement
}