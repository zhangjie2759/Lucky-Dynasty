'use strict';

const $ = (id) => document.getElementById(id);
const fmt = (n) => '¥' + Math.floor(n).toLocaleString('zh-CN');
const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const PRIZE_TIERS = [
  { name:'小确幸', min:3000, max:10000, weight:36 },
  { name:'改善生活', min:10000, max:100000, weight:30 },
  { name:'人生推进', min:100000, max:1000000, weight:19 },
  { name:'阶层跃迁', min:1000000, max:10000000, weight:10 },
  { name:'暴富人生', min:10000000, max:100000000, weight:4 },
  { name:'传说强运', min:100000000, max:300000000, weight:1 }
];

const PRODUCTS = [
  { name:'奶茶', icon:'🧋', price:30, color:'#ffd27a' },
  { name:'烧烤', icon:'🍢', price:120, color:'#ff9b6b' },
  { name:'游戏机', icon:'🎮', price:3000, color:'#8fd0ff' },
  { name:'新手机', icon:'📱', price:6000, color:'#a9e7ff' },
  { name:'电驴', icon:'🛵', price:5000, color:'#7fe2a0' },
  { name:'自行车', icon:'🚲', price:1800, color:'#b7ef8a' },
  { name:'家人红包', icon:'🧧', price:10000, color:'#ff6f61' },
  { name:'短途旅行', icon:'🎒', price:12000, color:'#a7c7ff' },
  { name:'二手车', icon:'🚗', price:60000, color:'#8fd0ff' },
  { name:'装修', icon:'🛠️', price:120000, color:'#c6aa86' },
  { name:'电车', icon:'🚙', price:180000, color:'#83e4df' },
  { name:'小店', icon:'🏪', price:250000, color:'#ffd166' },
  { name:'SUV', icon:'🚙', price:300000, color:'#9ad17b' },
  { name:'MPV', icon:'🚐', price:450000, color:'#a3b8ff' },
  { name:'小房首付', icon:'🏠', price:500000, color:'#ffd1a8' },
  { name:'公寓', icon:'🏢', price:1500000, color:'#b7d4ff' },
  { name:'跑车', icon:'🏎️', price:2000000, color:'#ff6b6b' },
  { name:'珠宝', icon:'💎', price:5000000, color:'#98f5ff' },
  { name:'公司', icon:'🏭', price:8000000, color:'#c8c8c8' },
  { name:'别墅', icon:'🏡', price:20000000, color:'#ffe089' },
  { name:'整栋楼', icon:'🏙️', price:80000000, color:'#9ec3ff' },
  { name:'家族庄园', icon:'🏰', price:150000000, color:'#d8b4ff' }
];

let state = {
  round: 1,
  totalAssets: 0,
  budget: 0,
  spent: 0,
  tier: null,
  inventory: {},
  sessionItems: []
};

let scratchCtx, scratchCanvas, scratched = false;
let canvas, ctx, W, H, dpr;
let game;
let last = 0;
let stepTimer = 0;

function show(id) {
  ['startScreen','lotteryScreen','gameScreen','summaryScreen'].forEach(x => $(x).classList.add('hidden'));
  $(id).classList.remove('hidden');
}

function weightedTier() {
  const total = PRIZE_TIERS.reduce((s,t)=>s+t.weight,0);
  let r = Math.random() * total;
  for (const t of PRIZE_TIERS) { r -= t.weight; if (r <= 0) return t; }
  return PRIZE_TIERS[0];
}

function startLottery() {
  scratched = false;
  const tier = weightedTier();
  const amount = Math.round(rand(tier.min, tier.max) / 100) * 100;
  state.budget = amount;
  state.spent = 0;
  state.tier = tier;
  state.sessionItems = [];
  $('roundText').textContent = state.round;
  $('totalAssetsText').textContent = fmt(state.totalAssets);
  $('ticketCode').textContent = randomCode();
  $('prizeText').textContent = fmt(amount);
  $('tierText').textContent = tier.name;
  $('prizeResult').classList.add('hidden');
  $('resultTitle').textContent = `${tier.name}：${fmt(amount)}`;
  $('resultDesc').textContent = '用这笔钱在商场里买到最高价值，然后带回家。';
  show('lotteryScreen');
  requestAnimationFrame(setupScratch);
}

function randomCode(){
  let s='';
  for(let i=0;i<9;i++) s+=Math.floor(Math.random()*10);
  return s.replace(/(\d{3})(\d{3})(\d{3})/,'$1 $2 $3');
}

function setupScratch(){
  scratchCanvas = $('scratchCanvas');
  const rect = scratchCanvas.parentElement.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  scratchCanvas.width = rect.width * dpr;
  scratchCanvas.height = rect.height * dpr;
  scratchCanvas.style.width = rect.width + 'px';
  scratchCanvas.style.height = rect.height + 'px';
  scratchCtx = scratchCanvas.getContext('2d');
  scratchCtx.setTransform(dpr,0,0,dpr,0,0);
  paintScratch(rect.width, rect.height);
}

function paintScratch(w,h){
  const g = scratchCtx.createLinearGradient(0,0,w,h);
  g.addColorStop(0,'#f6f3ea');
  g.addColorStop(.3,'#aaa49a');
  g.addColorStop(.6,'#d7d1c6');
  g.addColorStop(1,'#8d867b');
  scratchCtx.fillStyle = g;
  scratchCtx.fillRect(0,0,w,h);
  scratchCtx.fillStyle = 'rgba(255,255,255,.25)';
  for(let x=-w;x<w*2;x+=25){ scratchCtx.save(); scratchCtx.translate(x,0); scratchCtx.rotate(-.7); scratchCtx.fillRect(0,-h,8,h*3); scratchCtx.restore(); }
  scratchCtx.fillStyle = 'rgba(33,22,9,.58)';
  scratchCtx.textAlign='center'; scratchCtx.textBaseline='middle';
  scratchCtx.font='900 22px sans-serif';
  scratchCtx.fillText('刮开本局预算',w/2,h/2-8);
  scratchCtx.font='800 13px sans-serif';
  scratchCtx.fillText('中大奖就能扫更多货',w/2,h/2+26);
}

function scratchAt(x,y){
  if(scratched) return;
  const r = scratchCanvas.getBoundingClientRect();
  const px = x - r.left, py = y - r.top;
  scratchCtx.save();
  scratchCtx.globalCompositeOperation = 'destination-out';
  scratchCtx.beginPath();
  scratchCtx.arc(px,py,34,0,Math.PI*2);
  scratchCtx.fill();
  scratchCtx.restore();
  if(measureScratch() > .52) revealPrize();
}

function measureScratch(){
  const data = scratchCtx.getImageData(0,0,scratchCanvas.width,scratchCanvas.height).data;
  let clear=0,total=0;
  for(let i=3;i<data.length;i+=80){ total++; if(data[i]<80) clear++; }
  return clear/total;
}

function revealPrize(){
  scratched = true;
  scratchCtx.clearRect(0,0,scratchCanvas.width,scratchCanvas.height);
  $('prizeResult').classList.remove('hidden');
}

function bindScratch(){
  let down=false;
  const start=e=>{ e.preventDefault(); down=true; const p=getPoint(e); scratchAt(p.x,p.y); };
  const move=e=>{ if(!down)return; e.preventDefault(); const p=getPoint(e); scratchAt(p.x,p.y); };
  const end=e=>{ down=false; };
  scratchCanvas.addEventListener('pointerdown',start,{passive:false});
  scratchCanvas.addEventListener('pointermove',move,{passive:false});
  scratchCanvas.addEventListener('pointerup',end);
  scratchCanvas.addEventListener('pointercancel',end);
}
function getPoint(e){ return {x:e.clientX,y:e.clientY}; }

function startMall(){
  show('gameScreen');
  canvas = $('gameCanvas'); ctx = canvas.getContext('2d');
  resizeCanvas();
  initGame();
  last = performance.now(); stepTimer = 0;
  requestAnimationFrame(loop);
}

function resizeCanvas(){
  W = window.innerWidth; H = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W*dpr; canvas.height = H*dpr;
  canvas.style.width=W+'px'; canvas.style.height=H+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

function initGame(){
  const cols=42, rows=42;
  game = {
    cols, rows, cell:34,
    head:{x:Math.floor(cols/2), y:Math.floor(rows/2)},
    dir:1,
    tail:[],
    items:[],
    home:{x:Math.floor(cols/2), y:Math.floor(rows/2)+3},
    running:true,
    warning:false,
    speed:160
  };
  spawnItems();
  updateHud();
  toast('找到绿色的家，把东西带回去');
}

function allowedProducts(){
  const b = state.budget;
  return PRODUCTS.filter(p => p.price <= Math.max(3000, b * 1.15));
}

function spawnItems(){
  const pool = allowedProducts();
  for(let i=0;i<90;i++){
    const p = pick(pool);
    let x,y,tries=0;
    do { x=Math.floor(rand(2,game.cols-2)); y=Math.floor(rand(2,game.rows-2)); tries++; } while((Math.abs(x-game.head.x)<4 && Math.abs(y-game.head.y)<4) || tries<2 && occupied(x,y));
    game.items.push({...p,x,y,id:i});
  }
}
function occupied(x,y){ return game.items.some(it=>it.x===x&&it.y===y) || (game.home.x===x&&game.home.y===y); }

function turnLeft(){ if(!game?.running)return; game.dir = (game.dir+3)%4; }
function turnRight(){ if(!game?.running)return; game.dir = (game.dir+1)%4; }

function step(){
  if(!game.running) return;
  game.tail.unshift({...game.head, icon:'', name:''});
  const dirs = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
  game.head.x += dirs[game.dir].x;
  game.head.y += dirs[game.dir].y;

  if(game.head.x<0) game.head.x=game.cols-1;
  if(game.head.x>=game.cols) game.head.x=0;
  if(game.head.y<0) game.head.y=game.rows-1;
  if(game.head.y>=game.rows) game.head.y=0;

  const maxTail = Math.min(40, 3 + Math.floor(state.spent / Math.max(1000, state.budget/18)));
  while(game.tail.length > maxTail) game.tail.pop();

  const idx = game.items.findIndex(it=>it.x===game.head.x && it.y===game.head.y);
  if(idx >= 0){ buyItem(idx); }

  if(game.head.x===game.home.x && game.head.y===game.home.y && state.spent>0){ finishSuccess(); }

  game.speed = Math.max(90, 170 - Math.min(70, game.tail.length * 2));
}

function buyItem(idx){
  const item = game.items[idx];
  const remain = state.budget - state.spent;
  if(item.price > remain){
    if(game.warning){ failGame(item); return; }
    game.warning = true;
    toast(`买不起「${item.name}」！再超支就去上班`);
    return;
  }
  game.warning = false;
  state.spent += item.price;
  state.totalAssets += item.price;
  state.sessionItems.push(item);
  state.inventory[item.name] = (state.inventory[item.name] || 0) + 1;
  game.items.splice(idx,1);
  game.tail.unshift({...game.head, icon:item.icon, name:item.name});
  toast(`买下 ${item.icon} ${item.name} -${fmt(item.price)}`);
  updateHud();
}

function failGame(item){
  game.running=false;
  state.sessionItems.push({name:'负债', icon:'💸', price:0});
  showSummary(`撞上买不起的「${item.name}」`, true);
}

function finishSuccess(){
  game.running=false;
  showSummary('带着战利品回家了', false);
}

function updateHud(){
  $('budgetText').textContent = fmt(state.budget);
  $('spentText').textContent = fmt(state.spent);
  $('remainText').textContent = fmt(state.budget-state.spent);
}

let toastTimer;
function toast(msg){
  const el=$('toast'); el.textContent=msg; el.classList.remove('hidden');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.add('hidden'),1300);
}

function loop(now){
  const dt = now-last; last=now;
  if(game?.running){ stepTimer += dt; if(stepTimer > game.speed){ stepTimer=0; step(); } draw(); requestAnimationFrame(loop); }
}

function draw(){
  ctx.clearRect(0,0,W,H);
  const cell=game.cell;
  const camX = game.head.x*cell - W/2;
  const camY = game.head.y*cell - H/2;

  ctx.fillStyle='#261a0d'; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.translate(-camX,-camY);

  for(let y=0;y<game.rows;y++){
    for(let x=0;x<game.cols;x++){
      ctx.fillStyle = (x+y)%2 ? '#3a2815' : '#322310';
      ctx.fillRect(x*cell,y*cell,cell,cell);
    }
  }

  // home
  drawTile(game.home.x,game.home.y,'#36b66e','家', '🏠');

  // items
  for(const it of game.items){
    const affordable = it.price <= state.budget-state.spent;
    drawProduct(it, affordable);
  }

  // tail
  for(let i=game.tail.length-1;i>=0;i--){
    const t=game.tail[i];
    const alpha = Math.max(.35,1-i/game.tail.length*.65);
    ctx.globalAlpha=alpha;
    drawCircle(t.x,t.y,'#f5ba42', t.icon || '•');
  }
  ctx.globalAlpha=1;

  // head
  drawCircle(game.head.x,game.head.y,'#ffffff','🛒');
  ctx.restore();

  // dark boundary subtle
  ctx.strokeStyle='rgba(255,255,255,.1)'; ctx.lineWidth=2; ctx.strokeRect(1,1,W-2,H-2);
}

function drawTile(x,y,color,label,icon){
  const c=game.cell; const px=x*c, py=y*c;
  ctx.fillStyle=color; ctx.fillRect(px+3,py+3,c-6,c-6);
  ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='18px sans-serif'; ctx.fillText(icon,px+c/2,py+c/2-4);
  ctx.font='10px sans-serif'; ctx.fillText(label,px+c/2,py+c-8);
}
function drawProduct(it, affordable){
  const c=game.cell; const px=it.x*c, py=it.y*c;
  ctx.fillStyle = affordable ? it.color : '#6e655a';
  roundRect(ctx,px+4,py+4,c-8,c-8,8,true,false);
  ctx.fillStyle='#1f160c'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='18px sans-serif'; ctx.fillText(it.icon,px+c/2,py+c/2-3);
  ctx.font='8px sans-serif'; ctx.fillText(shortMoney(it.price),px+c/2,py+c-8);
}
function drawCircle(x,y,color,icon){
  const c=game.cell; const px=x*c+c/2, py=y*c+c/2;
  ctx.fillStyle=color; ctx.beginPath(); ctx.arc(px,py,c*.42,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1f160c'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='19px sans-serif'; ctx.fillText(icon,px,py+1);
}
function roundRect(ctx,x,y,w,h,r,fill,stroke){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); if(fill)ctx.fill(); if(stroke)ctx.stroke();
}
function shortMoney(n){
  if(n>=100000000) return Math.round(n/100000000)+'亿';
  if(n>=10000) return Math.round(n/10000)+'万';
  return String(n);
}

function showSummary(title, failed){
  $('summaryTitle').textContent = failed ? '去上班了' : title;
  const remain = state.budget - state.spent;
  const count = state.sessionItems.filter(x=>x.price>0).length;
  $('summaryStats').innerHTML = `
    <div class="stat-card"><span>本局预算</span><b>${fmt(state.budget)}</b></div>
    <div class="stat-card"><span>购买价值</span><b>${fmt(state.spent)}</b></div>
    <div class="stat-card"><span>剩余现金</span><b>${fmt(Math.max(0,remain))}</b></div>
    <div class="stat-card"><span>买到数量</span><b>${count} 件</b></div>`;
  const grouped = {};
  for(const it of state.sessionItems){ if(it.price>0) grouped[it.name]=(grouped[it.name]||0)+1; }
  const rows = Object.entries(grouped).map(([name,num])=>`<div class="inv-row"><span>${name}</span><b>×${num}</b></div>`).join('') || '<div class="inv-row"><span>什么都没买到</span><b>0</b></div>';
  $('inventoryList').innerHTML = rows;
  state.round += 1;
  show('summaryScreen');
}

function bind(){
  $('startBtn').onclick = startLottery;
  $('quickScratchBtn').onclick = revealPrize;
  $('enterMallBtn').onclick = startMall;
  $('nextRoundBtn').onclick = startLottery;
  $('leftBtn').onclick = turnLeft;
  $('rightBtn').onclick = turnRight;
  document.addEventListener('keydown',e=>{ if(e.key==='ArrowLeft'||e.key==='a')turnLeft(); if(e.key==='ArrowRight'||e.key==='d')turnRight(); });
  window.addEventListener('resize',()=>{ if(canvas) resizeCanvas(); });
  bindScratch();
}

bind();
