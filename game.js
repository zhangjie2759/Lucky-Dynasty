'use strict';

const MAX_GENERATIONS = 5;
const START_CASH = 100000;
const START_LUCK = 50;
const MAX_TICKETS_PER_GEN = 3;

const TICKETS = {
  small: { name: '小福票', cost: 10000, prizeBias: 1.25, shardBias: 0.65, luckBias: 0.9 },
  luck: { name: '强运票', cost: 30000, prizeBias: 1.0, shardBias: 1.1, luckBias: 1.35 },
  rich: { name: '暴富票', cost: 80000, prizeBias: 0.8, shardBias: 1.65, luckBias: 1.0 }
};

const ASSETS = [
  { id: 'house', icon: '🏠', name: '小房子', price: 300000, joy: 18, resale: 0.8, luck: 0, desc: '普通但安心，保值率高' },
  { id: 'apartment', icon: '🏢', name: '市区公寓', price: 900000, joy: 25, resale: 0.82, luck: 1, desc: '体面资产，可传给下一代' },
  { id: 'villa', icon: '🏡', name: '豪华别墅', price: 3000000, joy: 45, resale: 0.78, luck: 3, desc: '家族面子大幅提升' },
  { id: 'office', icon: '🏙️', name: '写字楼', price: 8000000, joy: 35, resale: 0.85, luck: 2, desc: '贵，但像真正的家族资产' },
  { id: 'sportscar', icon: '🏎️', name: '红色超跑', price: 1800000, joy: 55, resale: 0.45, luck: 0, desc: '爽度爆炸，贬值也爆炸' },
  { id: 'luxcar', icon: '🚘', name: '豪华座驾', price: 900000, joy: 36, resale: 0.52, luck: 0, desc: '体面，适合暴富第一单' },
  { id: 'jewel', icon: '💎', name: '传家珠宝', price: 1200000, joy: 22, resale: 0.9, luck: 5, desc: '保值，还能提高家族强运' },
  { id: 'company', icon: '🏭', name: '开一家公司', price: 2500000, joy: 30, resale: 0.55, luck: 2, desc: '有机会翻身，也容易亏' },
  { id: 'temple', icon: '⛩️', name: '强运祠堂', price: 1600000, joy: 20, resale: 0.25, luck: 12, desc: '不保值，但后代更强运' },
  { id: 'yacht', icon: '🛥️', name: '游艇派对', price: 5000000, joy: 70, resale: 0.35, luck: -2, desc: '非常爽，也非常败家' }
];

const $ = (id) => document.getElementById(id);
const fmt = (n) => '¥' + Math.max(0, Math.floor(n)).toLocaleString('zh-CN');
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

let state;
let currentTicket = null;
let scratch = {
  isDown: false,
  rect: null,
  canvas: null,
  ctx: null,
  progress: Array(9).fill(0),
  revealed: Array(9).fill(false),
  pendingPrize: null,
  locked: false
};

function freshState() {
  return {
    generation: 1,
    cash: START_CASH,
    luck: START_LUCK,
    joy: 0,
    shards: 0,
    ticketsLeft: MAX_TICKETS_PER_GEN,
    grandWonThisGen: false,
    totalGrandWins: 0,
    assets: {},
    collection: {},
    logs: ['第1代拿着10万元走进彩票站。'],
    gameOver: false
  };
}

function save() {
  localStorage.setItem('strongLuckFamilyDemo', JSON.stringify(state));
}

function load() {
  try {
    const raw = localStorage.getItem('strongLuckFamilyDemo');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function addLog(text) {
  state.logs.unshift(text);
  state.logs = state.logs.slice(0, 16);
  renderLog();
}

function showStart() {
  $('startScreen').classList.remove('hidden');
  $('gameScreen').classList.add('hidden');
  $('endScreen').classList.add('hidden');
  $('continueBtn').classList.toggle('hidden', !load());
}

function showGame() {
  $('startScreen').classList.add('hidden');
  $('gameScreen').classList.remove('hidden');
  $('endScreen').classList.add('hidden');
  renderAll();
}

function renderAll() {
  $('generationText').textContent = state.generation;
  $('cashText').textContent = fmt(state.cash);
  $('luckText').textContent = Math.round(state.luck);
  $('joyText').textContent = Math.round(state.joy);
  $('shardText').textContent = state.shards;
  $('ticketsLeftText').textContent = state.ticketsLeft;
  $('luckBar').style.width = clamp(state.luck, 0, 100) + '%';
  $('joyBar').style.width = clamp(state.joy, 0, 120) / 120 * 100 + '%';
  renderTicketButtons();
  renderShop();
  renderCollection();
  renderLog();
  $('openShopBtn').classList.toggle('hidden', !state.grandWonThisGen);
  save();
}

function renderTicketButtons() {
  document.querySelectorAll('.ticket-btn').forEach((btn) => {
    const type = btn.dataset.type;
    const ticket = TICKETS[type];
    const disabled = state.cash < ticket.cost || state.ticketsLeft <= 0 || !!currentTicket;
    btn.disabled = disabled;
  });
  $('nextGenerationBtn').disabled = !!currentTicket;
}

function renderLog() {
  const list = $('logList');
  list.innerHTML = state.logs.map((line) => `<div class="log-item">${line}</div>`).join('');
}

function renderShop() {
  const grid = $('shopGrid');
  grid.innerHTML = ASSETS.map((a) => {
    const ownedCount = state.assets[a.id] || 0;
    const canBuy = state.cash >= a.price;
    return `
      <div class="asset-card">
        <div class="asset-icon">${a.icon}</div>
        <div>
          <h3>${a.name}</h3>
          <div class="asset-meta">${fmt(a.price)} · 爽度+${a.joy} · 强运${a.luck >= 0 ? '+' : ''}${a.luck}<br>${a.desc}</div>
          <button class="buy-btn" data-buy="${a.id}" ${canBuy ? '' : 'disabled'}>${ownedCount ? '再买一个' : '购买'}</button>
          ${ownedCount ? `<button class="sell-btn" data-sell="${a.id}">变卖约 ${fmt(a.price * a.resale)}</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('[data-buy]').forEach((btn) => btn.addEventListener('click', () => buyAsset(btn.dataset.buy)));
  grid.querySelectorAll('[data-sell]').forEach((btn) => btn.addEventListener('click', () => sellAsset(btn.dataset.sell)));
}

function renderCollection() {
  const grid = $('collectionGrid');
  grid.innerHTML = ASSETS.map((a) => {
    const ownedCount = state.assets[a.id] || 0;
    const owned = ownedCount > 0;
    const seen = !!state.collection[a.id];
    const cls = owned ? 'owned' : seen ? 'past' : '';
    return `
      <div class="collection-item ${cls}">
        <i>${a.icon}</i>
        <span>${a.name}${ownedCount > 1 ? '×' + ownedCount : ''}</span>
        ${owned ? `<button class="collection-sell" data-collection-sell="${a.id}">变卖</button>` : ''}
      </div>
    `;
  }).join('');
  grid.querySelectorAll('[data-collection-sell]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      sellAsset(btn.dataset.collectionSell);
    });
  });
}

function buyAsset(id) {
  const a = ASSETS.find((x) => x.id === id);
  if (!a || state.cash < a.price) return;
  state.cash -= a.price;
  state.joy += a.joy;
  state.luck = clamp(state.luck + a.luck, 0, 120);
  state.assets[id] = (state.assets[id] || 0) + 1;
  state.collection[id] = 'owned';
  addLog(`第${state.generation}代买下「${a.name}」，爽度+${a.joy}。`);
  renderAll();
}

function sellAsset(id) {
  const a = ASSETS.find((x) => x.id === id);
  if (!a || !state.assets[id]) return;
  state.assets[id] -= 1;
  if (state.assets[id] <= 0) delete state.assets[id];
  state.collection[id] = 'past';
  const money = Math.floor(a.price * a.resale);
  state.cash += money;
  state.joy = Math.max(0, state.joy - 4);
  addLog(`家族变卖了「${a.name}」，换回${fmt(money)}。`);
  renderAll();
}

function startTicket(type) {
  const ticket = TICKETS[type];
  if (!ticket || state.cash < ticket.cost || state.ticketsLeft <= 0 || currentTicket) return;
  state.cash -= ticket.cost;
  state.ticketsLeft -= 1;
  currentTicket = {
    type,
    name: ticket.name,
    rewards: generateRewards(ticket),
    finished: false
  };
  $('currentTicketName').textContent = ticket.name;
  $('ticketChooser').classList.add('hidden');
  $('scratchArea').classList.remove('hidden');
  addLog(`买下「${ticket.name}」，这一张可能改命。`);
  renderAll();
  requestAnimationFrame(() => setupScratchCard());
}

function generateRewards(ticket) {
  const rewards = [];
  const luck = clamp(state.luck, 0, 120);
  const shardChance = (0.09 + luck / 520) * ticket.shardBias;
  const luckChance = 0.15 * ticket.luckBias;
  const riskChance = 0.09 + (ticket.name === '暴富票' ? 0.04 : 0);
  const prizeChance = 0.38 * ticket.prizeBias;

  for (let i = 0; i < 9; i++) {
    const r = Math.random();
    if (r < shardChance) {
      rewards.push({ type: 'shard', icon: '✨', text: '大奖碎片' });
    } else if (r < shardChance + luckChance) {
      const amount = Math.round(rand(6, 15));
      rewards.push({ type: 'luck', icon: '🍀', text: `强运+${amount}`, amount });
    } else if (r < shardChance + luckChance + riskChance) {
      const amount = Math.round(rand(6, 13));
      rewards.push({ type: 'bad', icon: '☁️', text: `霉运-${amount}`, amount });
    } else if (r < shardChance + luckChance + riskChance + prizeChance) {
      const base = ticket.name === '小福票'
        ? pick([10000, 20000, 30000, 50000])
        : ticket.name === '强运票'
          ? pick([30000, 50000, 80000, 100000, 150000])
          : pick([50000, 100000, 200000, 300000, 500000]);
      rewards.push({ type: 'prize', icon: '💰', text: fmt(base), amount: base });
    } else {
      rewards.push({ type: 'empty', icon: '➖', text: '空' });
    }
  }

  if (!rewards.some((x) => x.type === 'prize')) {
    const idx = Math.floor(Math.random() * 9);
    rewards[idx] = { type: 'prize', icon: '💰', text: fmt(30000), amount: 30000 };
  }
  if (state.luck >= 75 && !rewards.some((x) => x.type === 'shard') && Math.random() < 0.75) {
    const idx = Math.floor(Math.random() * 9);
    rewards[idx] = { type: 'shard', icon: '✨', text: '大奖碎片' };
  }
  return rewards.sort(() => Math.random() - 0.5);
}

function setupScratchCard() {
  const grid = $('scratchGrid');
  grid.innerHTML = currentTicket.rewards.map((r, idx) => `
    <div class="scratch-cell" data-cell="${idx}">
      <span class="icon">${r.icon}</span>
      <span class="txt">${r.text}</span>
    </div>
  `).join('');

  scratch.canvas = $('scratchCanvas');
  scratch.ctx = scratch.canvas.getContext('2d', { willReadFrequently: true });
  scratch.progress = Array(9).fill(0);
  scratch.revealed = Array(9).fill(false);
  scratch.pendingPrize = null;
  scratch.locked = false;

  resizeScratchCanvas();
  paintScratchLayer();
}

function resizeScratchCanvas() {
  const stage = $('scratchStage');
  const rect = stage.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  scratch.rect = rect;
  scratch.canvas.width = Math.floor(rect.width * dpr);
  scratch.canvas.height = Math.floor(rect.height * dpr);
  scratch.canvas.style.width = rect.width + 'px';
  scratch.canvas.style.height = rect.height + 'px';
  scratch.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function paintScratchLayer() {
  const ctx = scratch.ctx;
  const w = scratch.rect.width;
  const h = scratch.rect.height;
  ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#d8d5cc');
  g.addColorStop(0.45, '#a9a49a');
  g.addColorStop(1, '#ece7dc');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.24)';
  for (let i = -w; i < w * 2; i += 26) {
    ctx.save();
    ctx.translate(i, 0);
    ctx.rotate(-0.7);
    ctx.fillRect(0, -h, 9, h * 3);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(37,25,13,.45)';
  ctx.font = '900 18px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('刮开强运', w / 2, h / 2);
}

function scratchAt(clientX, clientY) {
  if (!currentTicket || scratch.locked) return;
  const rect = scratch.canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const ctx = scratch.ctx;
  const radius = Math.max(18, rect.width * 0.055);

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  const cellSize = rect.width / 3;
  const col = clamp(Math.floor(x / cellSize), 0, 2);
  const row = clamp(Math.floor(y / cellSize), 0, 2);
  const idx = row * 3 + col;
  scratch.progress[idx] += 12;

  if (!scratch.revealed[idx] && scratch.progress[idx] >= 36) {
    revealCell(idx);
  }
}

function clearCellOverlay(idx) {
  const rect = scratch.canvas.getBoundingClientRect();
  const cellSize = rect.width / 3;
  const col = idx % 3;
  const row = Math.floor(idx / 3);
  scratch.ctx.globalCompositeOperation = 'destination-out';
  scratch.ctx.fillRect(col * cellSize + 8, row * cellSize + 8, cellSize - 16, cellSize - 16);
}

function revealCell(idx) {
  scratch.revealed[idx] = true;
  clearCellOverlay(idx);
  const cell = document.querySelector(`[data-cell="${idx}"]`);
  if (cell) cell.classList.add('revealed');
  const reward = currentTicket.rewards[idx];
  processReward(reward);
}

function processReward(reward) {
  if (reward.type === 'prize') {
    scratch.locked = true;
    scratch.pendingPrize = reward;
    showPrizeChoice(reward.amount);
  } else if (reward.type === 'luck') {
    state.luck = clamp(state.luck + reward.amount, 0, 120);
    addLog(`刮出强运符号，强运+${reward.amount}。`);
    renderAll();
  } else if (reward.type === 'bad') {
    state.luck = clamp(state.luck - reward.amount, 0, 120);
    addLog(`刮出一团霉运，强运-${reward.amount}。`);
    renderAll();
  } else if (reward.type === 'shard') {
    state.shards += 1;
    addLog(`获得大奖碎片 ${state.shards}/3。`);
    if (state.shards >= 3) {
      triggerGrandPrize();
    } else {
      renderAll();
    }
  }
}

function showPrizeChoice(amount) {
  $('modalTitle').textContent = `刮中了 ${fmt(amount)}`;
  $('modalText').textContent = '现在兑现可以立刻拿钱，但会消耗强运；不兑现会放弃这笔钱，保留家族大运去搏更大的奖。';
  $('cashOutBtn').textContent = `兑现 ${fmt(amount)}`;
  $('keepLuckBtn').textContent = '不兑现，强运+12';
  $('choiceModal').classList.remove('hidden');
}

function cashOutPrize() {
  const reward = scratch.pendingPrize;
  if (!reward) return;
  state.cash += reward.amount;
  const loss = Math.max(6, Math.round(reward.amount / 18000));
  state.luck = clamp(state.luck - loss, 0, 120);
  addLog(`兑现${fmt(reward.amount)}，强运消耗${loss}点。`);
  closeChoice();
}

function keepLuckPrize() {
  const reward = scratch.pendingPrize;
  if (!reward) return;
  state.luck = clamp(state.luck + 12, 0, 120);
  addLog(`放弃${fmt(reward.amount)}，把这口气留给大奖。`);
  closeChoice();
}

function closeChoice() {
  $('choiceModal').classList.add('hidden');
  scratch.pendingPrize = null;
  scratch.locked = false;
  renderAll();
}

function triggerGrandPrize() {
  const luckMultiplier = 1 + clamp(state.luck, 0, 120) / 80;
  const generationMultiplier = 1 + state.generation * 0.12;
  const base = pick([1000000, 2000000, 3000000, 5000000, 8000000, 12000000]);
  const jackpot = Math.floor(base * luckMultiplier * generationMultiplier);
  state.cash += jackpot;
  state.shards = 0;
  state.grandWonThisGen = true;
  state.totalGrandWins += 1;
  state.luck = clamp(state.luck - 30, 0, 120);
  addLog(`中大奖！第${state.generation}代拿到${fmt(jackpot)}，正式进入暴富消费。`);
  renderAll();
  $('openShopBtn').classList.remove('hidden');
  setTimeout(() => openShop(), 450);
}

function finishTicket() {
  if (!currentTicket) return;
  currentTicket = null;
  $('scratchArea').classList.add('hidden');
  $('ticketChooser').classList.remove('hidden');
  renderAll();
}

function openShop() {
  finishTicket();
  $('scratchMode').classList.add('hidden');
  $('shopMode').classList.remove('hidden');
  renderAll();
}

function closeShopAndNextGen() {
  $('shopMode').classList.add('hidden');
  $('scratchMode').classList.remove('hidden');
  nextGeneration();
}

function canContinueWithAssets() {
  return Object.values(state.assets).some((count) => count > 0);
}

function nextGeneration() {
  if (currentTicket) return;

  if (state.generation >= MAX_GENERATIONS) {
    endGame(false);
    return;
  }

  if (state.cash < TICKETS.small.cost && !canContinueWithAssets()) {
    endGame(true);
    return;
  }

  const inheritedLuck = calcInheritedLuck();
  const oldGen = state.generation;
  state.generation += 1;
  state.ticketsLeft = MAX_TICKETS_PER_GEN;
  state.shards = 0;
  state.grandWonThisGen = false;
  state.joy = 0;
  state.luck = clamp(Math.round(state.luck * 0.45 + inheritedLuck), 8, 115);
  addLog(`第${oldGen}代把${fmt(state.cash)}和家族资产传给第${state.generation}代。新一代强运：${Math.round(state.luck)}。`);
  $('ticketChooser').classList.remove('hidden');
  $('scratchArea').classList.add('hidden');
  $('scratchMode').classList.remove('hidden');
  $('shopMode').classList.add('hidden');
  renderAll();
}

function calcInheritedLuck() {
  let boost = 18;
  for (const [id, count] of Object.entries(state.assets)) {
    const a = ASSETS.find((x) => x.id === id);
    if (a) boost += a.luck * count;
  }
  return boost;
}

function totalAssetValue() {
  let total = 0;
  for (const [id, count] of Object.entries(state.assets)) {
    const a = ASSETS.find((x) => x.id === id);
    if (a) total += a.price * a.resale * count;
  }
  return Math.floor(total);
}

function endGame(bankrupt) {
  state.gameOver = true;
  save();
  $('gameScreen').classList.add('hidden');
  $('endScreen').classList.remove('hidden');
  const assetValue = totalAssetValue();
  const collected = Object.keys(state.collection).length;
  const score = Math.floor(state.cash + assetValue + collected * 180000 + state.totalGrandWins * 500000);
  let title = bankrupt ? '家族破产' : '五代结算';
  let grade = '普通家庭';
  if (score > 50000000) grade = '传奇强运世家';
  else if (score > 20000000) grade = '豪门家族';
  else if (score > 8000000) grade = '城市新贵';
  else if (score > 2000000) grade = '小富之家';
  $('endingTitle').textContent = title;
  $('endingText').textContent = bankrupt
    ? `家族把现金和资产都刮到了最后。结局评价：《最后一张彩票》。`
    : `这个家族最终成为「${grade}」。真正留下来的，不只有钱，还有买过的传说。`;
  $('endingStats').innerHTML = `
    <div><span>最终现金</span><strong>${fmt(state.cash)}</strong></div>
    <div><span>资产估值</span><strong>${fmt(assetValue)}</strong></div>
    <div><span>图鉴数量</span><strong>${collected}/${ASSETS.length}</strong></div>
    <div><span>家族评级</span><strong>${grade}</strong></div>
  `;
  localStorage.removeItem('strongLuckFamilyDemo');
}

function bindEvents() {
  $('startBtn').addEventListener('click', () => {
    state = freshState();
    save();
    showGame();
  });
  $('continueBtn').addEventListener('click', () => {
    state = load() || freshState();
    showGame();
  });
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('确定重开这个家族吗？')) return;
    localStorage.removeItem('strongLuckFamilyDemo');
    currentTicket = null;
    state = freshState();
    showGame();
  });
  $('playAgainBtn').addEventListener('click', () => {
    state = freshState();
    save();
    showGame();
  });
  document.querySelectorAll('.ticket-btn').forEach((btn) => {
    btn.addEventListener('click', () => startTicket(btn.dataset.type));
  });
  $('finishTicketBtn').addEventListener('click', finishTicket);
  $('nextGenerationBtn').addEventListener('click', nextGeneration);
  $('openShopBtn').addEventListener('click', openShop);
  $('leaveShopBtn').addEventListener('click', closeShopAndNextGen);
  $('cashOutBtn').addEventListener('click', cashOutPrize);
  $('keepLuckBtn').addEventListener('click', keepLuckPrize);

  const canvas = $('scratchCanvas');
  canvas.addEventListener('pointerdown', (e) => {
    scratch.isDown = true;
    canvas.setPointerCapture(e.pointerId);
    scratchAt(e.clientX, e.clientY);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!scratch.isDown) return;
    scratchAt(e.clientX, e.clientY);
  });
  canvas.addEventListener('pointerup', () => { scratch.isDown = false; });
  canvas.addEventListener('pointercancel', () => { scratch.isDown = false; });

  window.addEventListener('resize', () => {
    if (currentTicket && !$('scratchArea').classList.contains('hidden')) {
      setupScratchCard();
    }
  });
}

function boot() {
  bindEvents();
  showStart();
}

boot();
