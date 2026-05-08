'use strict';

const STORAGE_KEY = 'strongLuckFamilyDemoV2_codeTicket';
const MAX_GENERATIONS = 5;
const START_CASH = 100000;
const START_LUCK = 50;
const MAX_TICKETS_PER_GEN = 3;
const GRAND_PRIZE_THRESHOLD = 1000000;

const TICKETS = {
  small: {
    name: '小福票',
    cost: 10000,
    bonus: 0,
    desc: '保底小奖，适合续命',
    weights: { 2: 62, 3: 27, 4: 8, 5: 2.1, 6: 0.65, 7: 0.18, 8: 0.06, 9: 0.01 },
    payouts: { 2: 10000, 3: 30000, 4: 120000, 5: 600000, 6: 1800000, 7: 8000000, 8: 30000000, 9: 100000000 }
  },
  luck: {
    name: '强运票',
    cost: 30000,
    bonus: 12,
    desc: '更容易匹配尾4/尾5',
    weights: { 2: 42, 3: 32, 4: 16, 5: 6, 6: 2.5, 7: 0.9, 8: 0.45, 9: 0.15 },
    payouts: { 2: 20000, 3: 80000, 4: 500000, 5: 2000000, 6: 8000000, 7: 30000000, 8: 100000000, 9: 500000000 }
  },
  rich: {
    name: '暴富票',
    cost: 80000,
    bonus: 24,
    desc: '更容易进入消费模式',
    weights: { 2: 30, 3: 30, 4: 22, 5: 10, 6: 4.5, 7: 2, 8: 1, 9: 0.5 },
    payouts: { 2: 30000, 3: 150000, 4: 1000000, 5: 5000000, 6: 20000000, 7: 80000000, 8: 300000000, 9: 1000000000 }
  }
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
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

let state;
let currentTicket = null;
let scratch = {
  isDown: false,
  canvas: null,
  ctx: null,
  rect: null,
  checked: false,
  locked: false,
  pendingPrize: null,
  lastMeasure: 0
};

function freshState() {
  return {
    generation: 1,
    cash: START_CASH,
    luck: START_LUCK,
    joy: 0,
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
  $('grandWinText').textContent = state.totalGrandWins;
  $('ticketsLeftText').textContent = state.ticketsLeft;
  $('luckBar').style.width = clamp(state.luck, 0, 120) / 120 * 100 + '%';
  $('joyBar').style.width = clamp(state.joy, 0, 140) / 140 * 100 + '%';
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

  const winningCode = randomCode();
  const tailMatch = chooseTailMatch(ticket);
  const playerCode = makePlayerCode(winningCode, tailMatch);
  const prize = ticket.payouts[tailMatch] || 0;

  currentTicket = {
    type,
    name: ticket.name,
    winningCode,
    playerCode,
    tailMatch,
    prize,
    checked: false,
    scratchedPercent: 0
  };

  $('currentTicketName').textContent = ticket.name;
  $('winningCodeText').textContent = formatCode(winningCode);
  $('playerCodeText').textContent = formatCode(playerCode);
  $('playerCodeText').classList.remove('matched');
  $('matchHintText').textContent = '刮开后自动验奖';
  $('matchRuleText').textContent = `${ticket.name}：尾2保底小奖，尾5以上算改命大奖。当前强运 ${Math.round(state.luck)}。`;
  $('ticketChooser').classList.add('hidden');
  $('scratchArea').classList.remove('hidden');
  $('finishTicketBtn').textContent = '放弃本张';
  $('checkTicketBtn').disabled = false;

  addLog(`买下「${ticket.name}」，刮开9位强运码验奖。`);
  renderAll();
  requestAnimationFrame(() => setupScratchCard());
}

function randomCode() {
  let s = '';
  for (let i = 0; i < 9; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function formatCode(code) {
  return code.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
}

function chooseTailMatch(ticket) {
  const luck = clamp(state.luck + ticket.bonus, 0, 120);
  const luckFactor = (luck - 50) / 70;
  const entries = Object.entries(ticket.weights).map(([match, weight]) => {
    const m = Number(match);
    const multiplier = clamp(1 + luckFactor * (m - 2) * 0.42, 0.2, 4.2);
    return [m, weight * multiplier];
  });
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [match, weight] of entries) {
    r -= weight;
    if (r <= 0) return match;
  }
  return 2;
}

function makePlayerCode(winningCode, tailMatch) {
  if (tailMatch >= 9) return winningCode;
  const arr = randomCode().split('');
  const start = 9 - tailMatch;
  for (let i = start; i < 9; i++) arr[i] = winningCode[i];

  // 保证实际匹配位数不会因为随机前一位碰巧相同而变多。
  if (start - 1 >= 0 && arr[start - 1] === winningCode[start - 1]) {
    arr[start - 1] = String((Number(winningCode[start - 1]) + 1 + Math.floor(Math.random() * 9)) % 10);
  }
  return arr.join('');
}

function setupScratchCard() {
  scratch.canvas = $('scratchCanvas');
  scratch.ctx = scratch.canvas.getContext('2d', { willReadFrequently: true });
  scratch.checked = false;
  scratch.locked = false;
  scratch.pendingPrize = null;
  scratch.lastMeasure = 0;
  resizeScratchCanvas();
  paintScratchLayer();
}

function resizeScratchCanvas() {
  const stage = $('scratchStage');
  const rect = stage.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  scratch.rect = rect;
  scratch.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  scratch.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
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
  g.addColorStop(0, '#e9e5dc');
  g.addColorStop(0.35, '#a6a096');
  g.addColorStop(0.7, '#d8d2c6');
  g.addColorStop(1, '#f4eee1');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(255,255,255,.25)';
  for (let i = -w; i < w * 2; i += 24) {
    ctx.save();
    ctx.translate(i, 0);
    ctx.rotate(-0.72);
    ctx.fillRect(0, -h, 8, h * 3);
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(37,25,13,.46)';
  ctx.font = '900 22px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('刮开你的9位强运码', w / 2, h / 2 - 10);
  ctx.font = '800 13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('尾号匹配越多，奖金越大', w / 2, h / 2 + 22);
}

function scratchAt(clientX, clientY) {
  if (!currentTicket || scratch.locked || scratch.checked) return;
  const rect = scratch.canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const radius = Math.max(22, rect.width * 0.065);

  const ctx = scratch.ctx;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  const now = performance.now();
  if (now - scratch.lastMeasure > 180) {
    scratch.lastMeasure = now;
    const percent = measureScratchPercent();
    currentTicket.scratchedPercent = percent;
    if (percent >= 0.48) checkTicket();
  }
}

function measureScratchPercent() {
  const canvas = scratch.canvas;
  const ctx = scratch.ctx;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let clear = 0;
  const step = 16;
  for (let i = 3; i < data.length; i += 4 * step) {
    if (data[i] < 80) clear += 1;
  }
  return clear / Math.ceil((data.length / 4) / step);
}

function clearScratchLayer() {
  scratch.ctx.globalCompositeOperation = 'destination-out';
  scratch.ctx.fillRect(0, 0, scratch.rect.width, scratch.rect.height);
}

function checkTicket() {
  if (!currentTicket || scratch.checked) return;
  scratch.checked = true;
  scratch.locked = true;
  clearScratchLayer();
  $('checkTicketBtn').disabled = true;
  $('finishTicketBtn').textContent = '结束本张';
  $('playerCodeText').classList.add('matched');

  const match = currentTicket.tailMatch;
  const prize = currentTicket.prize;
  const label = match >= 9 ? '9位全中' : `尾${match}位相同`;
  $('matchHintText').textContent = `${label} · ${fmt(prize)}`;

  if (prize > 0) {
    scratch.pendingPrize = { amount: prize, match, type: currentTicket.type };
    setTimeout(() => showPrizeChoice(prize, match), 280);
  } else {
    addLog(`这张没有中奖。`);
    scratch.locked = false;
    renderAll();
  }
}

function showPrizeChoice(amount, match) {
  const isGrand = amount >= GRAND_PRIZE_THRESHOLD;
  $('modalIcon').textContent = isGrand ? '🏆' : '🎉';
  $('modalTitle').textContent = `${match >= 9 ? '9位全中' : '尾' + match + '位中奖'}：${fmt(amount)}`;
  $('modalText').textContent = isGrand
    ? '这笔钱已经足够进入暴富消费模式。兑现会拿到奖金，但会明显消耗强运；不兑现会放弃奖金，继续把家族大运往后压。'
    : '现在兑现可以立刻拿钱，但会消耗强运；不兑现会放弃这笔钱，保留家族大运去搏更大的奖。';
  $('cashOutBtn').textContent = `兑现 ${fmt(amount)}`;
  $('keepLuckBtn').textContent = `不兑现，强运+${keepLuckGain(amount, match)}`;
  $('choiceModal').classList.remove('hidden');
}

function cashOutPrize() {
  const reward = scratch.pendingPrize;
  if (!reward) return;
  state.cash += reward.amount;
  const loss = cashOutLuckLoss(reward.amount, reward.match);
  state.luck = clamp(state.luck - loss, 0, 120);
  addLog(`兑现${fmt(reward.amount)}，强运消耗${loss}点。`);

  if (reward.amount >= GRAND_PRIZE_THRESHOLD) {
    state.grandWonThisGen = true;
    state.totalGrandWins += 1;
    addLog(`第${state.generation}代正式进入暴富消费模式。`);
  }
  closeChoice();
  if (reward.amount >= GRAND_PRIZE_THRESHOLD) {
    setTimeout(() => openShop(), 380);
  }
}

function keepLuckPrize() {
  const reward = scratch.pendingPrize;
  if (!reward) return;
  const gain = keepLuckGain(reward.amount, reward.match);
  state.luck = clamp(state.luck + gain, 0, 120);
  addLog(`放弃${fmt(reward.amount)}，强运+${gain}，把这口气留给后面。`);
  closeChoice();
}

function cashOutLuckLoss(amount, match) {
  return clamp(Math.round(match * 3 + amount / 180000), 6, 55);
}

function keepLuckGain(amount, match) {
  return clamp(Math.round(6 + match * 2 + Math.min(amount / 1000000, 10)), 10, 32);
}

function closeChoice() {
  $('choiceModal').classList.add('hidden');
  scratch.pendingPrize = null;
  scratch.locked = false;
  renderAll();
}

function finishTicket() {
  if (!currentTicket) return;
  if (!scratch.checked && !confirm('这张还没验奖，确定放弃吗？')) return;
  currentTicket = null;
  scratch.checked = false;
  scratch.locked = false;
  scratch.pendingPrize = null;
  $('scratchArea').classList.add('hidden');
  $('ticketChooser').classList.remove('hidden');
  renderAll();
}

function openShop() {
  if (currentTicket && scratch.pendingPrize) return;
  if (currentTicket) finishTicketWithoutConfirm();
  $('scratchMode').classList.add('hidden');
  $('shopMode').classList.remove('hidden');
  renderAll();
}

function finishTicketWithoutConfirm() {
  currentTicket = null;
  scratch.checked = false;
  scratch.locked = false;
  scratch.pendingPrize = null;
  $('scratchArea').classList.add('hidden');
  $('ticketChooser').classList.remove('hidden');
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
  const score = Math.floor(state.cash + assetValue + collected * 180000 + state.totalGrandWins * 500000 + state.joy * 6000);
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
  localStorage.removeItem(STORAGE_KEY);
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
    localStorage.removeItem(STORAGE_KEY);
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
  $('checkTicketBtn').addEventListener('click', checkTicket);
  $('nextGenerationBtn').addEventListener('click', nextGeneration);
  $('openShopBtn').addEventListener('click', openShop);
  $('leaveShopBtn').addEventListener('click', closeShopAndNextGen);
  $('cashOutBtn').addEventListener('click', cashOutPrize);
  $('keepLuckBtn').addEventListener('click', keepLuckPrize);

  const canvas = $('scratchCanvas');
  canvas.addEventListener('pointerdown', (e) => {
    if (!currentTicket) return;
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
