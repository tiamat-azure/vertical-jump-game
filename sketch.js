let player;
let platforms = [];
let gravity = 0.5;
let jumpCharge = 0;
let isCharging = false;
let score = 0;
let gameOver = false;

// Paramètres configurables
const SCROLL_SPEED = 4; // Vitesse de défilement initiale
const INITIAL_PLATFORMS = 6;
const SHAKE_THRESHOLD = 12; // 10 (min) + 20%
const TARGET_HEIGHT = 450; // Hauteur cible pour le joueur au repos
const MIN_PLATFORM_SPACING = 150; // Espacement minimal pour empêcher 3 sauts consécutifs

function setup() {
  createCanvas(400, 600);
  resetGame();
}

function draw() {
  // Fond gris clair
  background(220);
  
  if (!gameOver) {
    // Mise à jour du joueur
    updatePlayer();
    
    // Gestion des collisions
    checkCollisions();
    
    // Défilement pendant la phase ascendante
    if (player.velocity < 0) {
      scrollPlatforms(SCROLL_SPEED); // Défilement normal en saut
      player.rotation += map(abs(player.lastJumpForce), 10, 15, 0.2, 0.5);
    } else {
      player.rotation = 0; // Réinitialisation hors ascension
      
      // Défilement si sur plateforme et pas en charge
      if (player.onPlatform && !isCharging && player.y < TARGET_HEIGHT) {
        scrollPlatforms(SCROLL_SPEED * 0.5); // Défilement plus lent au repos
      }
    }
    
    // Affichage
    displayGame();
    
    // Vérification game over (tombe dans le vide)
    if (player.y > height) {
      gameOver = true;
    }
  } else {
    displayGameOver();
  }
  
  // Affichage du score (en haut à gauche)
  fill(0);
  textSize(20);
  textAlign(LEFT);
  text(`Score: ${score}`, 10, 30);
}

function updatePlayer() {
  // Mouvement horizontal
  if (keyIsDown(LEFT_ARROW)) player.x -= 5;
  if (keyIsDown(RIGHT_ARROW)) player.x += 5;
  
  // Limites horizontales
  player.x = constrain(player.x, 0, width - player.w);
  
  // Gravité
  player.velocity += gravity;
  player.y += player.velocity;
  
  // Charge du saut
  if (isCharging) {
    jumpCharge = constrain(jumpCharge + 0.2, 10, 15);
    if (jumpCharge > SHAKE_THRESHOLD) {
      player.shakeOffset = random(-map(jumpCharge, SHAKE_THRESHOLD, 15, 1, 5), 
                                 map(jumpCharge, SHAKE_THRESHOLD, 15, 1, 5));
    } else {
      player.shakeOffset = 0;
    }
  }
  
  // Réinitialisation état plateforme
  player.onPlatform = false;
}

function displayGame() {
  // Affichage des plateformes
  for (let p of platforms) {
    fill(0, 255, 0);
    rect(p.x, p.y, p.w, p.h);
  }
  
  // Affichage du joueur avec rotation et tremblement
  push();
  translate(player.x + player.w/2 + player.shakeOffset, 
           player.y + player.h/2 + player.shakeOffset);
  rotate(player.rotation);
  fill(255, 165, 0);
  rect(-player.w/2, -player.h/2, player.w, player.h);
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
    player.lastJumpForce = jumpCharge; // Sauvegarde pour rotation
    jumpCharge = 0;
    player.shakeOffset = 0; // Réinitialisation tremblement
  }
}

function checkCollisions() {
  for (let p of platforms) {
    if (player.y + player.h >= p.y && 
        player.y + player.h <= p.y + p.h &&
        player.x + player.w > p.x && 
        player.x < p.x + p.w &&
        player.velocity > 0) {
      player.y = p.y - player.h;
      player.velocity = 0;
      player.onPlatform = true;
      
      // Score si nouvelle plateforme plus haute
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
  
  // Supprimer les plateformes hors écran
  platforms = platforms.filter(p => p.y < height);
  
  // Ajouter nouvelle plateforme si nécessaire
  if (platforms.length < INITIAL_PLATFORMS) {
    let lastY = platforms.length > 0 ? platforms[platforms.length-1].y : height;
    let newY = lastY - random(MIN_PLATFORM_SPACING, 100); // Espacement pour saut max
    platforms.push({
      x: random(0, width-100),
      y: newY,
      w: 100,
      h: 20
    });
  }
}

function resetGame() {
  // Joueur sur plateforme en bas
  player = {
    x: width/2,
    y: height - 60, // Hauteur plateforme + joueur
    w: 30,
    h: 40,
    velocity: 0,
    rotation: 0,
    shakeOffset: 0,
    lastJumpForce: 0,
    highestPlatform: height,
    onPlatform: true
  };
  
  platforms = [];
  // Première plateforme en bas
  platforms.push({
    x: width/2 - 50,
    y: height - 20,
    w: 100,
    h: 20
  });
  
  // Autres plateformes avec espacement
  for (let i = 1; i < INITIAL_PLATFORMS; i++) {
    let lastY = platforms[i-1].y;
    platforms.push({
      x: random(0, width-100),
      y: lastY - random(MIN_PLATFORM_SPACING, 100), // Espacement minimal
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