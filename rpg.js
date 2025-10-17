const TILE_SIZE = 32;
const MAP_SIZE = 10;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const SPRITES = {
  player: document.getElementById('playerSprite'),
  slime: document.getElementById('slimeSprite'),
  goblin: document.getElementById('goblinSprite')
};

const playerStatsDiv = document.getElementById('playerStats');
const inventoryDiv = document.getElementById('inventory');
const messageDiv = document.getElementById('message');
const shopDiv = document.getElementById('shop');
const buyPotionBtn = document.getElementById('buyPotion');

let player = {
  x: 0, y: 0,
  hp: 30, maxHp: 30,
  attack: 5,
  gold: 10,
  level: 1,
  exp: 0,
  weapon: null,
  inventory: {
    potion: 2
  }
};

let inBattle = false;
let enemy = null;
let message = "Use arrow keys or WASD to move.\nPress I to open the shop.";

const ENEMY_TYPES = [
  {
    name: "Slime",
    maxHp: 15,
    attack: 3,
    exp: 7,
    gold: 5,
    sprite: "slime"
  },
  {
    name: "Goblin",
    maxHp: 24,
    attack: 6,
    exp: 18,
    gold: 12,
    sprite: "goblin"
  }
];

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Draw map grid
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      ctx.strokeStyle = "#444";
      ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
  // Draw player sprite
  ctx.drawImage(SPRITES.player, player.x * TILE_SIZE + 4, player.y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
  // If in battle, draw enemy on player
  if (inBattle && enemy) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.drawImage(SPRITES[enemy.sprite], player.x * TILE_SIZE + 18, player.y * TILE_SIZE + 4, TILE_SIZE - 16, TILE_SIZE - 16);
    ctx.restore();
  }
}

function healthBar(current, max) {
  let pct = Math.max(0, Math.min(1, current / max));
  return `
    <div class="health-bar"><div class="health-bar-inner" style="width:${pct*80}px"></div></div>
  `;
}

function updateStats() {
  playerStatsDiv.innerHTML =
    healthBar(player.hp, player.maxHp) +
    `HP: ${player.hp}/${player.maxHp}<br>` +
    `Level: ${player.level}<br>` +
    `Attack: ${player.attack + (player.weapon ? player.weapon.attack : 0)}${player.weapon ? " (" + player.weapon.name + ")" : ""}<br>` +
    `Gold: ${player.gold}<br>` +
    `EXP: ${player.exp}`;
  let inv = `Inventory:<br>`;
  inv += `- Potion x${player.inventory.potion || 0} <button onclick="usePotion()">Use</button><br>`;
  if (player.weapon) inv += `- Weapon: ${player.weapon.name} (+${player.weapon.attack} ATK)<br>`;
  inventoryDiv.innerHTML = inv;
  messageDiv.innerText = message;
}

function randomEncounter() {
  // 30% chance per move
  if (Math.random() < 0.3) {
    inBattle = true;
    let type = ENEMY_TYPES[Math.random() < 0.5 ? 0 : 1];
    enemy = {
      type: type.name,
      sprite: type.sprite,
      hp: type.maxHp,
      maxHp: type.maxHp,
      attack: type.attack,
      exp: type.exp,
      gold: type.gold
    };
    message = `A wild ${enemy.type} appeared!\n(A: attack | H: heal | R: run)`;
    updateStats();
  }
}

function tryMove(dx, dy) {
  if (inBattle) return;
  let nx = player.x + dx, ny = player.y + dy;
  if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
    player.x = nx;
    player.y = ny;
    shopDiv.style.display = (player.x === MAP_SIZE - 1 && player.y === MAP_SIZE - 1) ? "block" : "none";
    if (player.x === MAP_SIZE - 1 && player.y === MAP_SIZE - 1) {
      message = "You've entered the shop! Press I to buy potions.";
    } else {
      randomEncounter();
      if (!inBattle) message = "You moved. No enemies here.";
    }
    updateStats();
    drawMap();
  }
}

function playerAttack() {
  if (!inBattle) return;
  let base = player.attack + (player.weapon ? player.weapon.attack : 0);
  let dmg = base + Math.floor(Math.random() * 3);
  enemy.hp -= dmg;
  message = `You attack the ${enemy.type} for ${dmg} damage!`;
  if (enemy.hp <= 0) {
    message += `\nYou defeated the ${enemy.type}! +${enemy.exp} EXP, +${enemy.gold} gold.`;
    player.exp += enemy.exp;
    player.gold += enemy.gold;
    // Rare chance for weapon drop
    if (!player.weapon && Math.random() < 0.18) {
      player.weapon = { name: "Bronze Sword", attack: 4 };
      message += `\nThe ${enemy.type} dropped a Bronze Sword!`;
    }
    inBattle = false;
    enemy = null;
    levelUpCheck();
  } else {
    setTimeout(enemyTurn, 700);
  }
  updateStats();
  drawMap();
}

function usePotion() {
  if ((player.inventory.potion || 0) > 0 && player.hp < player.maxHp) {
    player.hp = Math.min(player.maxHp, player.hp + 15);
    player.inventory.potion--;
    message = "You used a potion and recovered 15 HP!";
    updateStats();
    if (inBattle) setTimeout(enemyTurn, 700);
  }
}

window.usePotion = usePotion; // For inventory button

function playerHeal() {
  usePotion();
}

function playerRun() {
  if (!inBattle) return;
  if (Math.random() < 0.6) {
    message = "You escaped!";
    inBattle = false;
    enemy = null;
  } else {
    message = "You failed to escape!";
    setTimeout(enemyTurn, 700);
  }
  updateStats();
  drawMap();
}

function enemyTurn() {
  if (!inBattle || !enemy) return;
  let dmg = enemy.attack + Math.floor(Math.random() * 2);
  player.hp -= dmg;
  message = `The ${enemy.type} hits you for ${dmg} damage!`;
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
    player.maxHp += 10;
    player.attack += 3;
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
    if (e.key === 'i' || e.key === 'I') {
      // Open/close shop if at shop tile
      if (player.x === MAP_SIZE - 1 && player.y === MAP_SIZE - 1) {
        shopDiv.style.display = "block";
        message = "Welcome to the shop! Click 'Buy Potion' to purchase.";
        updateStats();
      }
    }
  } else {
    if (e.key === 'a' || e.key === 'A') playerAttack();
    if (e.key === 'h' || e.key === 'H') playerHeal();
    if (e.key === 'r' || e.key === 'R') playerRun();
  }
});

buyPotionBtn.onclick = function() {
  if (player.gold >= 10) {
    player.gold -= 10;
    player.inventory.potion = (player.inventory.potion || 0) + 1;
    message = "You bought a potion!";
    updateStats();
  } else {
    message = "Not enough gold!";
    updateStats();
  }
};

drawMap();
updateStats();
