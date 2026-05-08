'use strict';

const STORAGE_KEY = 'strongLuckFamilyDemoV4_bottomNav';
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
    desc: '小奖稳定，适合续命',
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
    desc: '贵，但更容易进入消费模式',
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

const NAMES = ['张大发', '张金宝', '张满仓', '张旺财', '张来福', '张富贵', '张锦鲤', '张添财', '张好运', '张万利'];
const TRAITS = [
  { name: '稳健派', desc: '更适合兑现小奖，把现金慢慢滚起来。' },
  { name: '野心家', desc: '总觉得下一张就是大的，适合攒强运。' },
  { name: '败家子', desc: '消费爽感更重要，家族传说不能太寒酸。' },
  { name: '守财奴', desc: '喜欢留下现金，但容易错过本代爽度。' },
  { name: '幸运儿', desc: '天生相信自己会刮出改命号码。' },
  { name: '传承脑', desc: '更看重资产和下一代强运。' }
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

function makeHeir() {
  return {
    name: pick(NAMES),
    trait: pick(TRAITS),
    avatar: pick(['🧧', '👑', '🍀', '💰', '🎲', '🐲', '🏮', '💎'])
  };
}

function freshState() {
  const heir = makeHeir();
  return {
    generation: 1,
    heir,
    cash: START_CASH,
    luck: START_LUCK,
    joy: 0,
    ticketsLeft: MAX_TICKETS_PER_GEN,
    grandWonThisGen: false,
    totalGrandWins: 0,
    assets: {},
    collection: {},
    logs: [`第1代继承人「${heir.name}」拿着10万元走进彩票站。`],
    activeTab: 'lottery',
    gameOver: false
  };
}

function normalizeState(s) {
  if (!s) return freshState();
  if (!s.heir) s.heir = makeHeir();
  if (!s.activeTab) s.activeTab = 'lottery';
  if (!s.logs) s.logs = [];
  if (!s.assets) s.assets = {};
  if (!s.collection) s.collection = {};
  return s;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : null;
  } catch (e) {
    return null;
  }
}

function addLog(text) {
  state.logs.unshift(text);
  state.logs = state.logs.slice(0, 20);
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
  switchTab(state.activeTab || 'lottery', false);
}

function renderAll() {
  $('generationText').textContent = state.generation;
  $('heirNameText').textContent = state.heir.name;
  $('cashText').textContent = fmt(state.cash);
  $('luckText').textContent = Math.round(state.luck);
  $('joyText').textContent = Math.round(state.joy);
  $('ticketsLeftText').textContent = state.ticketsLeft;
  $('luckBar').style.width = clamp(state.luck, 0, 120) / 120 * 100 + '%';
  $('joyBar').style.width = clamp(state.joy, 0, 140) / 140 * 100 + '%';
  renderTicketButtons();
  renderShop();
  renderCollection();
  renderAssetSummary();
  renderProfile();
  renderLog();
  $('openShopBtn').classList.toggle('hidden', !state.grandWonThisGen);
  save();
}

function switchTab(tab, shouldSave = true) {
  const views = {
    lottery: 'lotteryView',
    shop: 'shopView',
    assets: 'assetsView',
    info: 'infoView'
  };
  Object.values(views).forEach((id) => $(id).classList.add('hidden'));
  $(views[tab] || views.lottery).classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  state.activeTab = tab;
  if (shouldSave) save();

  if (tab === 'lottery' && currentTicket && !scratch.checked && !scratch.ctx) {
    requestAnimationFrame(() => setupScratchCard());
  }
}

function renderTicketButtons() {
  document.querySelectorAll('.ticket-btn').forEach((btn) => {
    const type = btn.dataset.type;
    const ticket = TICKETS[type];
    const disabled = state.cash < ticket.cost || state.ticketsLeft <= 0 || !!currentTicket;
    btn.disabled = disabled;
  });
  $('nextGenerationBtn').disabled = !!currentTicket;
  $('shopNextGenBtn').disabled = !!currentTicket;
}

function renderLog() {
  const list = $('logList');
  if (!list) return;
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

function renderAssetSummary() {
  const ownedCount = Object.values(state.assets).reduce((a, b) => a + b, 0);
  const seenCount = Object.keys(state.collection).length;
  const value = totalAssetValue();
  $('assetSummary').innerHTML = `
    <div class="summary-box"><span>当前拥有</span><strong>${ownedCount} 件</strong></div>
    <div class="summary-box"><span>资产变卖估值</span><strong>${fmt(value)}</strong></div>
    <div class="summary-box"><span>图鉴进度</span><strong>${seenCount}/${ASSETS.length}</strong></div>
  `;
}

function renderProfile() {
  const assetValue = totalAssetValue();
  const grade = familyGrade(state.cash + assetValue + state.joy * 6000 + state.totalGrandWins * 500000);
  $('profileCard').innerHTML = `
    <div class="profile-main">
      <div class="avatar">${state.heir.avatar}</div>
      <div>
        <h3>${state.heir.name}</h3>
        <p>第${state.generation}代继承人 · ${state.heir.trait.name}</p>
      </div>
    </div>
    <p>${state.heir.trait.desc}</p>
    <div class="profile-grid">
      <div class="profile-stat"><span>现金</span><strong>${fmt(state.cash)}</strong></div>
      <div class="profile-stat"><span>强运</span><strong>${Math.round(state.luck)}</strong></div>
      <div class="profile-stat"><span>本代爽度</span><strong>${Math.round(state.joy)}</strong></div>
      <div class="profile-stat"><span>大奖次数</span><strong>${state.totalGrandWins}</strong></div>
      <div class="profile-stat"><span>剩余彩票</span><strong>${state.ticketsLeft} 张</strong></div>
      <div class="profile-stat"><span>当前阶层</span><strong>${grade}</strong></div>
    </div>
  `;
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

  scratch.ctx = null;
  addLog(`买下「${ticket.name}」，刮开9位强运码验奖。`);
  renderAll();
  switchTab('lottery');
  requestAnimationFrame(() => setupScratchCard());
}

function randomCode() {
  let s = '';
  for (let i = 0; i < 9; i += 1) s += Math.floor(Math.random() * 10);
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
  for (let i = start; i < 9; i += 1) arr[i] = winningCode[i];

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

  const ok = resizeScratchCanvas();
  if (!ok) {
    setTimeout(setupScratchCard, 80);
    return;
  }
  paintScratchLayer();
  $('matchHintText').textContent = '拖动刮开银色涂层';
}

function resizeScratchCanvas() {
  const stage = $('scratchStage');
  const canvas = scratch.canvas;
  const box = stage.getBoundingClientRect();
  let cssW = box.width || stage.clientWidth || Math.min(500, window.innerWidth - 32);
  let cssH = box.height || stage.clientHeight || Math.round(cssW / 1.72);

  if (!cssW || cssW < 40) return false;
  cssH = Math.max(205, cssH || Math.round(cssW / 1.72));

  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
  scratch.rect = { width: cssW, height: cssH };
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';

  const ctx = scratch.ctx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return true;
}

function paintScratchLayer() {
  const ctx = scratch.ctx;
  const w = scratch.rect.width;
  const h = scratch.rect.height;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, w, h);

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#f6f4ee');
  g.addColorStop(0.18, '#c9c3b8');
  g.addColorStop(0.42, '#8f897f');
  g.addColorStop(0.62, '#d9d4ca');
  g.addColorStop(0.82, '#aaa398');
  g.addColorStop(1, '#fbf6ec');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 900; i += 1) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 1.7 + 0.35;
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#4f4a43';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = 'rgba(255,255,255,.26)';
  for (let i = -w; i < w * 2; i += 26) {
    ctx.save();
    ctx.translate(i, 0);
    ctx.rotate(-0.72);
    ctx.fillRect(0, -h, 9, h * 3);
    ctx.restore();
  }

  const edge = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7);
  edge.addColorStop(0, 'rgba(255,255,255,0)');
  edge.addColorStop(1, 'rgba(36,24,12,.18)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(36,24,12,.62)';
  ctx.font = '900 22px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('刮开你的9位强运码', w / 2, h / 2 - 12);
  ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  ctx.fillText('尾号匹配越多，奖金越大', w / 2, h / 2 + 22);
  ctx.restore();
}

function scratchAt(clientX, clientY) {
  if (!currentTicket || scratch.locked || scratch.checked || !scratch.canvas || !scratch.ctx) return;
  const rect = scratch.canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  if (x < -30 || y < -30 || x > rect.width + 30 || y > rect.height + 30) return;

  const radius = Math.max(24, Math.min(42, rect.width * 0.075));
  const ctx = scratch.ctx;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const now = performance.now();
  if (now - scratch.lastMeasure > 160) {
    scratch.lastMeasure = now;
    const percent = measureScratchPercent();
    currentTicket.scratchedPercent = percent;
    const showPercent = Math.min(99, Math.round(percent * 100));
    $('matchHintText').textContent = `已刮开 ${showPercent}%`;
    if (percent >= 0.62) checkTicket();
  }
}

function measureScratchPercent() {
  if (!scratch.canvas || !scratch.ctx) return 0;
  const canvas = scratch.canvas;
  const ctx = scratch.ctx;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let clear = 0;
  let total = 0;
  const step = 20;
  for (let i = 3; i < data.length; i += 4 * step) {
    total += 1;
    if (data[i] < 90) clear += 1;
  }
  return total ? clear / total : 0;
}

function clearScratchLayer() {
  if (!scratch.ctx || !scratch.rect) return;
  scratch.ctx.save();
  scratch.ctx.globalCompositeOperation = 'destination-out';
  scratch.ctx.fillRect(0, 0, scratch.rect.width, scratch.rect.height);
  scratch.ctx.restore();
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
    addLog('这张没有中奖。');
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
    setTimeout(() => switchTab('shop'), 350);
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
  finishTicketWithoutConfirm();
  renderAll();
}

function finishTicketWithoutConfirm() {
  currentTicket = null;
  scratch.checked = false;
  scratch.locked = false;
  scratch.pendingPrize = null;
  scratch.ctx = null;
  $('scratchArea').classList.add('hidden');
  $('ticketChooser').classList.remove('hidden');
}

function nextGeneration() {
  if (currentTicket) {
    switchTab('lottery');
    return;
  }

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
  const oldCash = state.cash;
  const nextHeir = makeHeir();
  state.generation += 1;
  state.heir = nextHeir;
  state.ticketsLeft = MAX_TICKETS_PER_GEN;
  state.grandWonThisGen = false;
  state.joy = 0;
  state.luck = clamp(Math.round(state.luck * 0.45 + inheritedLuck), 8, 115);
  state.activeTab = 'lottery';
  addLog(`第${oldGen}代把${fmt(oldCash)}和家族资产传给第${state.generation}代。新继承人「${nextHeir.name}」，强运${Math.round(state.luck)}。`);
  $('ticketChooser').classList.remove('hidden');
  $('scratchArea').classList.add('hidden');
  renderAll();
  switchTab('lottery');
}

function canContinueWithAssets() {
  return Object.values(state.assets).some((count) => count > 0);
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

function familyGrade(score) {
  if (score > 50000000) return '传奇强运世家';
  if (score > 20000000) return '豪门家族';
  if (score > 8000000) return '城市新贵';
  if (score > 2000000) return '小富之家';
  return '普通家庭';
}

function endGame(bankrupt) {
  state.gameOver = true;
  save();
  $('gameScreen').classList.add('hidden');
  $('endScreen').classList.remove('hidden');
  const assetValue = totalAssetValue();
  const collected = Object.keys(state.collection).length;
  const score = Math.floor(state.cash + assetValue + collected * 180000 + state.totalGrandWins * 500000 + state.joy * 6000);
  const grade = familyGrade(score);
  $('endingTitle').textContent = bankrupt ? '家族破产' : '五代结算';
  $('endingText').textContent = bankrupt
    ? '家族把现金和资产都刮到了最后。结局评价：《最后一张彩票》。'
    : `这个家族最终成为「${grade}」。真正留下来的，不只有钱，还有买过的传说。`;
  $('endingStats').innerHTML = `
    <div><span>最终现金</span><strong>${fmt(state.cash)}</strong></div>
    <div><span>资产估值</span><strong>${fmt(assetValue)}</strong></div>
    <div><span>图鉴数量</span><strong>${collected}/${ASSETS.length}</strong></div>
    <div><span>家族评级</span><strong>${grade}</strong></div>
  `;
  localStorage.removeItem(STORAGE_KEY);
}

function getPointFromEvent(e) {
  if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  if (e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

function bindScratchInput() {
  const canvas = $('scratchCanvas');
  const start = (e) => {
    if (!currentTicket || scratch.locked || scratch.checked) return;
    e.preventDefault();
    scratch.isDown = true;
    if (e.pointerId !== undefined && canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    }
    const p = getPointFromEvent(e);
    scratchAt(p.x, p.y);
  };
  const move = (e) => {
    if (!scratch.isDown) return;
    e.preventDefault();
    const p = getPointFromEvent(e);
    scratchAt(p.x, p.y);
  };
  const end = (e) => {
    if (scratch.isDown && e) e.preventDefault();
    scratch.isDown = false;
  };

  if ('PointerEvent' in window) {
    canvas.addEventListener('pointerdown', start, { passive: false });
    canvas.addEventListener('pointermove', move, { passive: false });
    canvas.addEventListener('pointerup', end, { passive: false });
    canvas.addEventListener('pointercancel', end, { passive: false });
    canvas.addEventListener('pointerleave', end, { passive: false });
  } else {
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end, { passive: false });
    canvas.addEventListener('mousedown', start, { passive: false });
    window.addEventListener('mousemove', move, { passive: false });
    window.addEventListener('mouseup', end, { passive: false });
  }
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
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  $('finishTicketBtn').addEventListener('click', finishTicket);
  $('checkTicketBtn').addEventListener('click', checkTicket);
  $('nextGenerationBtn').addEventListener('click', nextGeneration);
  $('shopNextGenBtn').addEventListener('click', nextGeneration);
  $('openShopBtn').addEventListener('click', () => switchTab('shop'));
  $('cashOutBtn').addEventListener('click', cashOutPrize);
  $('keepLuckBtn').addEventListener('click', keepLuckPrize);

  bindScratchInput();

  window.addEventListener('resize', () => {
    if (currentTicket && state.activeTab === 'lottery' && !$('scratchArea').classList.contains('hidden') && !scratch.checked) {
      setupScratchCard();
    }
  });
}

function boot() {
  bindEvents();
  showStart();
}

boot();
