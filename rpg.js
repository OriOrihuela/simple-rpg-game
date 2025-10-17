const TILE_SIZE = 32;
const MAP_SIZE = 10;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const playerStatsDiv = document.getElementById('playerStats');
const messageDiv = document.getElementById('message');

let player = {
  x: 0,
  y: 0,
  hp: 30,
  maxHp: 30,
  attack: 5,
  level: 1,
  exp: 0
};

let inBattle = false;
let enemy = null;
let message = "Use arrow keys or WASD to move.";

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Draw map grid
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      ctx.strokeStyle = "#444";
      ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
  // Draw player
  ctx.fillStyle = "#6af";
  ctx.fillRect(player.x * TILE_SIZE + 4, player.y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
  // If in battle, draw enemy on player
  if (inBattle && enemy) {
    ctx.fillStyle = "#f55";
    ctx.fillRect(player.x * TILE_SIZE + 12, player.y * TILE_SIZE + 12, TILE_SIZE - 24, TILE_SIZE - 24);
  }
}

function updateStats() {
  playerStatsDiv.innerHTML =
    `HP: ${player.hp}/${player.maxHp}<br>` +
    `Level: ${player.level}<br>` +
    `Attack: ${player.attack}<br>` +
    `EXP: ${player.exp}`;
  messageDiv.innerText = message;
}

function randomEncounter() {
  // 25% chance per move
  if (Math.random() < 0.25) {
    inBattle = true;
    enemy = {
      name: "Slime",
      hp: 12 + Math.floor(player.level * 2 * Math.random()),
      attack: 2 + Math.floor(player.level * Math.random()),
      exp: 5 + player.level * 2
    };
    message = `A wild ${enemy.name} appeared!\n(Press A to attack, H to heal)`;
    updateStats();
  }
}

function tryMove(dx, dy) {
  if (inBattle) return;
  let nx = player.x + dx, ny = player.y + dy;
  if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
    player.x = nx;
    player.y = ny;
    randomEncounter();
    if (!inBattle) {
      message = "You moved. No enemies here.";
    }
    updateStats();
    drawMap();
  }
}

function playerAttack() {
  if (!inBattle) return;
  let dmg = player.attack + Math.floor(Math.random() * 3);
  enemy.hp -= dmg;
  message = `You attack the ${enemy.name} for ${dmg} damage!`;
  if (enemy.hp <= 0) {
    message += `\nYou defeated the ${enemy.name}!\n+${enemy.exp} EXP`;
    player.exp += enemy.exp;
    inBattle = false;
    enemy = null;
    levelUpCheck();
  } else {
    setTimeout(enemyTurn, 700);
  }
  updateStats();
  drawMap();
}

function playerHeal() {
  if (!inBattle) return;
  let heal = 6 + Math.floor(Math.random() * 6);
  player.hp = Math.min(player.maxHp, player.hp + heal);
  message = `You heal yourself for ${heal} HP.`;
  setTimeout(enemyTurn, 700);
  updateStats();
  drawMap();
}

function enemyTurn() {
  if (!inBattle || !enemy) return;
  let dmg = enemy.attack + Math.floor(Math.random() * 2);
  player.hp -= dmg;
  message = `The ${enemy.name} hits you for ${dmg} damage!`;
  if (player.hp <= 0) {
    player.hp = 0;
    message += `\nYou were defeated! Refresh to restart.`;
    inBattle = false;
  }
  updateStats();
}

function levelUpCheck() {
  let levelUpExp = 15 + player.level * 10;
  while (player.exp >= levelUpExp) {
    player.level++;
    player.exp -= levelUpExp;
    player.maxHp += 8;
    player.attack += 2;
    player.hp = player.maxHp;
    message += `\n*** You leveled up! Now level ${player.level} ***`;
    levelUpExp = 15 + player.level * 10;
  }
}

document.addEventListener('keydown', (e) => {
  if (!inBattle) {
    if (e.key === 'ArrowUp' || e.key === 'w') tryMove(0, -1);
    if (e.key === 'ArrowDown' || e.key === 's') tryMove(0, 1);
    if (e.key === 'ArrowLeft' || e.key === 'a') tryMove(-1, 0);
    if (e.key === 'ArrowRight' || e.key === 'd') tryMove(1, 0);
  } else {
    if (e.key === 'a' || e.key === 'A') playerAttack();
    if (e.key === 'h' || e.key === 'H') playerHeal();
  }
});

drawMap();
updateStats();
