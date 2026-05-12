'use strict';

const $ = (id) => document.getElementById(id);
const fmt = (n) => '¥' + Math.max(0, Math.floor(n)).toLocaleString('zh-CN');
const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const PRIZE_TIERS = [
  { name: '小确幸', min: 2000, max: 10000, match: 2, weight: 45, color: '#74c69d' },
  { name: '改善生活', min: 10000, max: 100000, match: 3, weight: 30, color: '#4dabf7' },
  { name: '人生推进', min: 100000, max: 1000000, match: 4, weight: 15, color: '#ffd43b' },
  { name: '阶层跃迁', min: 1000000, max: 10000000, match: 5, weight: 7, color: '#ff922b' },
  { name: '暴富人生', min: 10000000, max: 100000000, match: 6, weight: 2.7, color: '#f03e3e' },
  { name: '传说强运', min: 100000000, max: 200000000, match: 7, weight: 0.3, color: '#be4bdb' }
];

const PRODUCTS = [
  // 生活区
  { id:'phone', name:'新手机', icon:'📱', price:5999, x:-7, y:2, color:'#8ce99a' },
  { id:'ebike', name:'电驴', icon:'🛵', price:4999, x:-6, y:5, color:'#69db7c' },
  { id:'bike', name:'自行车', icon:'🚲', price:1999, x:-3, y:6, color:'#b2f2bb' },
  { id:'dinner', name:'全家大餐', icon:'🍲', price:2888, x:-9, y:6, color:'#ffd8a8' },
  { id:'gamepc', name:'游戏电脑', icon:'🖥️', price:8999, x:-5, y:9, color:'#91a7ff' },
  { id:'momred', name:'爸妈红包', icon:'🧧', price:10000, x:-10, y:10, color:'#ff8787' },
  // 汽车区
  { id:'usedcar', name:'二手车', icon:'🚗', price:60000, x:2, y:3, color:'#a5d8ff' },
  { id:'sedan', name:'油车轿车', icon:'🚘', price:150000, x:5, y:3, color:'#74c0fc' },
  { id:'ev', name:'电车', icon:'🔋', price:220000, x:8, y:4, color:'#66d9e8' },
  { id:'suv', name:'SUV', icon:'🚙', price:300000, x:4, y:7, color:'#4dabf7' },
  { id:'mpv', name:'MPV', icon:'🚐', price:450000, x:8, y:8, color:'#339af0' },
  { id:'pickup', name:'皮卡', icon:'🛻', price:350000, x:11, y:6, color:'#228be6' },
  { id:'sport', name:'跑车', icon:'🏎️', price:2000000, x:12, y:11, color:'#ff6b6b' },
  // 房产区
  { id:'rent', name:'一年房租', icon:'🛏️', price:30000, x:-2, y:-5, color:'#ffe066' },
  { id:'renovate', name:'装修', icon:'🛋️', price:150000, x:1, y:-6, color:'#ffd43b' },
  { id:'downpay', name:'小房首付', icon:'🏠', price:300000, x:4, y:-7, color:'#fcc419' },
  { id:'apt', name:'市区公寓', icon:'🏢', price:1800000, x:8, y:-8, color:'#fab005' },
  { id:'villa', name:'别墅', icon:'🏡', price:8000000, x:13, y:-7, color:'#f59f00' },
  { id:'building', name:'整栋楼', icon:'🏙️', price:80000000, x:18, y:-6, color:'#e67700' },
  // 奢侈/公司区
  { id:'watch', name:'名表', icon:'⌚', price:120000, x:-12, y:-4, color:'#eebefa' },
  { id:'bag', name:'限量包', icon:'👜', price:80000, x:-14, y:-1, color:'#da77f2' },
  { id:'gold', name:'金条', icon:'🪙', price:300000, x:-15, y:3, color:'#ffd43b' },
  { id:'jewel', name:'珠宝', icon:'💎', price:1200000, x:-17, y:7, color:'#cc5de8' },
  { id:'shop', name:'小店', icon:'🏪', price:200000, x:2, y:14, color:'#ffa94d' },
  { id:'company', name:'公司', icon:'🏭', price:3000000, x:7, y:15, color:'#ff922b' },
  { id:'office', name:'写字楼', icon:'🏦', price:30000000, x:13, y:17, color:'#fd7e14' },
  { id:'mall', name:'商业综合体', icon:'🏬', price:150000000, x:20, y:18, color:'#f76707' }
];

let state = {
  round: 1,
  totalAssetValue: 0,
  lifetimeAssets: {},
  currentPrize: null,
  winCode: '',
  myCode: ''
};

let game = null;
let scratch = { isDown:false, canvas:null, ctx:null, rect:null, checked:false, lastMeasure:0 };
let joy = { active:false, dx:0, dy:0 };

function show(screen) {
  ['startScreen','lotteryScreen','gameScreen','resultScreen'].forEach(id => $(id).classList.add('hidden'));
  $(screen).classList.remove('hidden');
}

function weightedTier() {
  const total = PRIZE_TIERS.reduce((s,t)=>s+t.weight,0);
  let r = Math.random()*total;
  for (const tier of PRIZE_TIERS) {
    r -= tier.weight;
    if (r <= 0) return tier;
  }
  return PRIZE_TIERS[0];
}

function randomPrize(tier) {
  const raw = rand(tier.min, tier.max);
  const step = tier.max >= 10000000 ? 1000000 : tier.max >= 1000000 ? 100000 : tier.max >= 100000 ? 10000 : 1000;
  return Math.round(raw / step) * step;
}

function randomCode() {
  return Array.from({length:9}, () => Math.floor(Math.random()*10)).join('');
}
function formatCode(s) { return s.replace(/(\d{3})(\d{3})(\d{3})/,'$1 $2 $3'); }
function makeMatchedCode(win, match) {
  const arr = randomCode().split('');
  const start = 9 - match;
  for (let i=start;i<9;i++) arr[i] = win[i];
  if (start>0 && arr[start-1] === win[start-1]) arr[start-1] = String((Number(win[start-1])+1)%10);
  return arr.join('');
}

function setupLottery() {
  state.winCode = randomCode();
  const tier = weightedTier();
  const prize = randomPrize(tier);
  state.currentPrize = { tier, amount: prize };
  state.myCode = makeMatchedCode(state.winCode, tier.match);
  $('roundText').textContent = state.round;
  $('winCodeText').textContent = formatCode(state.winCode);
  $('myCodeText').textContent = formatCode(state.myCode);
  $('scratchHint').textContent = '拖动刮开涂层';
  show('lotteryScreen');
  requestAnimationFrame(setupScratch);
}

function setupScratch() {
  const canvas = $('scratchCanvas');
  scratch.canvas = canvas;
  scratch.ctx = canvas.getContext('2d', { willReadFrequently:true });
  const box = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.max(1, Math.min(devicePixelRatio || 1, 3));
  canvas.width = Math.floor(box.width*dpr);
  canvas.height = Math.floor(box.height*dpr);
  canvas.style.width = box.width+'px';
  canvas.style.height = box.height+'px';
  scratch.ctx.setTransform(dpr,0,0,dpr,0,0);
  scratch.rect = { width:box.width, height:box.height };
  scratch.checked = false;
  paintScratch();
}
function paintScratch() {
  const ctx = scratch.ctx, w = scratch.rect.width, h = scratch.rect.height;
  ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0,0,w,h);
  const g = ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0,'#f7f4ee'); g.addColorStop(.28,'#99938b'); g.addColorStop(.58,'#d6d0c6'); g.addColorStop(1,'#8f897f');
  ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
  ctx.globalAlpha=.18;
  for(let i=0;i<700;i++){ctx.fillStyle=Math.random()>.5?'#fff':'#403a32';ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,Math.random()*1.6+.3,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1; ctx.fillStyle='rgba(255,255,255,.28)';
  for(let x=-w;x<w*2;x+=28){ctx.save();ctx.translate(x,0);ctx.rotate(-.7);ctx.fillRect(0,-h,10,h*3);ctx.restore();}
  ctx.fillStyle='rgba(36,23,11,.65)'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='900 22px sans-serif'; ctx.fillText('刮开你的强运码', w/2, h/2-10);
  ctx.font='800 13px sans-serif'; ctx.fillText('刮完进入购物地图', w/2, h/2+24);
}
function scratchAt(x,y) {
  if (scratch.checked || !scratch.ctx) return;
  const r = 32;
  const ctx = scratch.ctx;
  ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.restore();
  const now = performance.now();
  if (now - scratch.lastMeasure > 150) {
    scratch.lastMeasure = now;
    const p = measureScratch();
    $('scratchHint').textContent = `已刮开 ${Math.round(p*100)}%`;
    if (p > .58) revealLottery();
  }
}
function measureScratch() {
  const c=scratch.canvas, d=scratch.ctx.getImageData(0,0,c.width,c.height).data;
  let clear=0,total=0;
  for(let i=3;i<d.length;i+=80){total++; if(d[i]<90) clear++;}
  return clear/total;
}
function revealLottery() {
  if (scratch.checked) return;
  scratch.checked = true;
  scratch.ctx.globalCompositeOperation='destination-out';
  scratch.ctx.fillRect(0,0,scratch.rect.width,scratch.rect.height);
  const p = state.currentPrize;
  $('scratchHint').textContent = `${p.tier.name}：${fmt(p.amount)}`;
  setTimeout(startShoppingGame, 750);
}

function initGame() {
  const canvas = $('gameCanvas');
  game = {
    canvas, ctx: canvas.getContext('2d'),
    w:0,h:0, last:0, camera:{x:0,y:0},
    player:{x:0,y:0,r:15,speed:145,path:[],tail:[]},
    cash: state.currentPrize.amount,
    budget: state.currentPrize.amount,
    spent:0, warning:false, ended:false,
    bought: {},
    items: PRODUCTS.map(p => ({...p, bought:false})),
    home:{x:0,y:0,r:38},
  };
  resizeGame();
  updateHud();
  showToast(`${state.currentPrize.tier.name}！预算 ${fmt(game.budget)}，开始扫货！`);
  requestAnimationFrame(loop);
}
function resizeGame(){
  const dpr=Math.max(1,Math.min(devicePixelRatio||1,2));
  game.w=innerWidth; game.h=innerHeight;
  game.canvas.width=Math.floor(game.w*dpr); game.canvas.height=Math.floor(game.h*dpr);
  game.canvas.style.width=game.w+'px'; game.canvas.style.height=game.h+'px';
  game.ctx.setTransform(dpr,0,0,dpr,0,0);
}
function worldToIso(x,y){
  const tileW=64, tileH=32;
  return {x:(x-y)*tileW/2, y:(x+y)*tileH/2};
}
function screenPos(wx,wy){
  const p=worldToIso(wx,wy);
  return {x:p.x - game.camera.x + game.w/2, y:p.y - game.camera.y + game.h/2};
}
function updateCamera(){
  const p=worldToIso(game.player.x, game.player.y);
  game.camera.x += (p.x - game.camera.x)*0.10;
  game.camera.y += (p.y - game.camera.y)*0.10;
}
function loop(t){
  if (!game || game.ended) return;
  const dt=Math.min(.033,(t-(game.last||t))/1000); game.last=t;
  update(dt); draw(); requestAnimationFrame(loop);
}
function update(dt){
  const mag=Math.hypot(joy.dx,joy.dy);
  if(mag>.08){
    const nx=joy.dx/mag, ny=joy.dy/mag;
    game.player.x += nx*game.player.speed*dt/32;
    game.player.y += ny*game.player.speed*dt/32;
    game.player.path.unshift({x:game.player.x,y:game.player.y});
    game.player.path = game.player.path.slice(0, 1200);
  }
  // tail follows path
  game.player.tail.forEach((seg,i)=>{
    const idx=(i+1)*13;
    const pos=game.player.path[idx];
    if(pos){seg.x += (pos.x-seg.x)*0.35; seg.y += (pos.y-seg.y)*0.35;}
  });
  game.player.x=clamp(game.player.x,-22,22); game.player.y=clamp(game.player.y,-12,22);
  checkCollisions(); updateCamera();
}
function checkCollisions(){
  for(const item of game.items){
    if(item.bought) continue;
    const d=Math.hypot(game.player.x-item.x, game.player.y-item.y);
    if(d<0.58){ buyItem(item); break; }
  }
  if (game.spent>0 && Math.hypot(game.player.x-game.home.x, game.player.y-game.home.y)<0.9) finishShopping(true);
}
function buyItem(item){
  if (game.cash >= item.price){
    game.cash -= item.price; game.spent += item.price; item.bought = true;
    game.bought[item.id] = (game.bought[item.id]||0)+1;
    state.lifetimeAssets[item.id] = (state.lifetimeAssets[item.id]||0)+1;
    state.totalAssetValue += item.price;
    const last = game.player.tail[game.player.tail.length-1] || game.player;
    game.player.tail.push({x:last.x,y:last.y, icon:item.icon, name:item.name, price:item.price, color:item.color});
    showToast(`买下 ${item.icon} ${item.name} -${fmt(item.price)}`);
    updateHud(); renderAssets();
  } else {
    if (!game.warning){
      game.warning = true;
      showToast(`钱不够买「${item.name}」！再撞贵东西就去上班！`);
      setTimeout(()=>{ if(game) game.warning=false; }, 2600);
    } else {
      finishShopping(false, `你现金不足，却撞上了「${item.name}」。`);
    }
  }
}
function draw(){
  const ctx=game.ctx; ctx.clearRect(0,0,game.w,game.h);
  drawMap(ctx); drawItems(ctx); drawTail(ctx); drawPlayer(ctx); drawHome(ctx);
}
function drawMap(ctx){
  ctx.fillStyle='#e8d2a1'; ctx.fillRect(0,0,game.w,game.h);
  const ranges=[[-24,24],[-14,24]];
  for(let y=ranges[1][0]; y<=ranges[1][1]; y++){
    for(let x=ranges[0][0]; x<=ranges[0][1]; x++){
      const s=screenPos(x,y); if(s.x<-80||s.x>game.w+80||s.y<-80||s.y>game.h+80) continue;
      ctx.beginPath(); ctx.moveTo(s.x,s.y-16); ctx.lineTo(s.x+32,s.y); ctx.lineTo(s.x,s.y+16); ctx.lineTo(s.x-32,s.y); ctx.closePath();
      const zone = x>10||y>13 ? '#e8b169' : x>1&&y>1 ? '#c6e1f7' : x< -10 ? '#e6c8ff' : y< -4 ? '#ffe082' : '#d7edbf';
      ctx.fillStyle=zone; ctx.fill(); ctx.strokeStyle='rgba(70,45,10,.12)'; ctx.stroke();
    }
  }
  drawZoneLabel(ctx,'生活区',-8,8); drawZoneLabel(ctx,'汽车区',7,7); drawZoneLabel(ctx,'房产区',8,-7); drawZoneLabel(ctx,'奢侈区',-15,3); drawZoneLabel(ctx,'公司区',8,15);
}
function drawZoneLabel(ctx,text,x,y){ const s=screenPos(x,y); ctx.fillStyle='rgba(23,17,10,.55)'; ctx.font='900 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(text,s.x,s.y-26); }
function drawHome(ctx){
  const s=screenPos(game.home.x,game.home.y);
  ctx.save(); ctx.fillStyle='#fff'; ctx.strokeStyle='#2f9f6a'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(s.x,s.y,34,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.font='30px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🏠',s.x,s.y); ctx.restore();
}
function drawItems(ctx){
  const sorted=[...game.items].sort((a,b)=>a.x+a.y-b.x-b.y);
  for(const item of sorted){
    if(item.bought) continue;
    const s=screenPos(item.x,item.y);
    if(s.x<-80||s.x>game.w+80||s.y<-80||s.y>game.h+80) continue;
    ctx.save(); ctx.fillStyle=item.price>game.cash?'rgba(217,64,49,.88)':item.color; ctx.beginPath(); ctx.roundRect(s.x-24,s.y-38,48,48,14); ctx.fill();
    ctx.font='25px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(item.icon,s.x,s.y-14);
    ctx.fillStyle='#24170b'; ctx.font='900 10px sans-serif'; ctx.fillText(shortMoney(item.price),s.x,s.y+20);
    ctx.restore();
  }
}
function drawTail(ctx){
  for(let i=game.player.tail.length-1;i>=0;i--){
    const seg=game.player.tail[i], s=screenPos(seg.x,seg.y);
    ctx.save(); ctx.globalAlpha=.95; ctx.fillStyle=seg.color || '#ffd43b'; ctx.beginPath(); ctx.roundRect(s.x-18,s.y-25,36,36,11); ctx.fill();
    ctx.font='21px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(seg.icon,s.x,s.y-7); ctx.restore();
  }
}
function drawPlayer(ctx){
  const s=screenPos(game.player.x,game.player.y);
  ctx.save(); ctx.fillStyle='#17110a'; ctx.beginPath(); ctx.arc(s.x,s.y-10,18,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.font='22px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🛒',s.x,s.y-10); ctx.restore();
}
function shortMoney(n){ if(n>=100000000) return (n/100000000).toFixed(n%100000000?1:0)+'亿'; if(n>=10000) return (n/10000).toFixed(n%10000?1:0)+'万'; return n; }

function startShoppingGame(){ show('gameScreen'); initGame(); renderAssets(); }
function updateHud(){
  $('budgetText').textContent=fmt(game.budget); $('cashText').textContent=fmt(game.cash); $('spentText').textContent=fmt(game.spent); $('countText').textContent=game.player.tail.length;
}
function showToast(text){ const el=$('toast'); el.textContent=text; el.classList.remove('hidden'); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>el.classList.add('hidden'),1800); }
function renderAssets(){
  const list=$('assetList'); const entries=Object.entries(state.lifetimeAssets);
  $('assetTotalMini').textContent=entries.reduce((s,[,c])=>s+c,0); $('assetValueText').textContent=fmt(state.totalAssetValue);
  if(!entries.length){list.innerHTML='<div class="asset-row"><b>还没有资产</b><span>先去刮奖</span></div>';return;}
  list.innerHTML=entries.map(([id,count])=>{const p=PRODUCTS.find(x=>x.id===id);return `<div class="asset-row"><b>${p.icon} ${p.name}</b><span>×${count}</span></div>`}).join('');
}
function finishShopping(success, reason=''){
  if(game.ended) return; game.ended=true;
  const title = success ? '成功把战利品带回家' : '负债爆炸，去上班';
  const desc = success ? `你用 ${fmt(game.budget)} 的预算，买回了 ${game.player.tail.length} 件东西。` : reason;
  $('resultTitle').textContent=title; $('resultDesc').textContent=desc;
  $('resultStats').innerHTML=`<div><span>本局预算</span><strong>${fmt(game.budget)}</strong></div><div><span>买到价值</span><strong>${fmt(game.spent)}</strong></div><div><span>剩余现金</span><strong>${fmt(game.cash)}</strong></div><div><span>本局资产数</span><strong>${game.player.tail.length}</strong></div>`;
  state.round += 1; game=null; show('resultScreen');
}

function bindScratch(){
  const c=$('scratchCanvas');
  const point=e=>{const r=c.getBoundingClientRect(); const t=e.touches&&e.touches[0]?e.touches[0]:e; return {x:t.clientX-r.left,y:t.clientY-r.top}};
  const start=e=>{e.preventDefault(); scratch.isDown=true; const p=point(e); scratchAt(p.x,p.y)};
  const move=e=>{if(!scratch.isDown)return; e.preventDefault(); const p=point(e); scratchAt(p.x,p.y)};
  const end=e=>{scratch.isDown=false};
  c.addEventListener('pointerdown',start,{passive:false}); c.addEventListener('pointermove',move,{passive:false}); c.addEventListener('pointerup',end); c.addEventListener('pointercancel',end);
  c.addEventListener('touchstart',start,{passive:false}); c.addEventListener('touchmove',move,{passive:false}); c.addEventListener('touchend',end);
}
function bindJoystick(){
  const joyEl=$('joystick'), stick=$('stick'); let active=false;
  const calc=e=>{const r=joyEl.getBoundingClientRect(); const t=e.touches&&e.touches[0]?e.touches[0]:e; const cx=r.left+r.width/2, cy=r.top+r.height/2; let dx=t.clientX-cx, dy=t.clientY-cy; const m=Math.hypot(dx,dy), max=34; if(m>max){dx=dx/m*max; dy=dy/m*max;} stick.style.transform=`translate(${dx}px,${dy}px)`; joy.dx=dx/max; joy.dy=dy/max;};
  const start=e=>{e.preventDefault(); active=true; calc(e)}; const move=e=>{if(!active)return; e.preventDefault(); calc(e)}; const end=()=>{active=false; joy.dx=0; joy.dy=0; stick.style.transform='translate(0,0)'};
  joyEl.addEventListener('pointerdown',start,{passive:false}); window.addEventListener('pointermove',move,{passive:false}); window.addEventListener('pointerup',end);
  joyEl.addEventListener('touchstart',start,{passive:false}); window.addEventListener('touchmove',move,{passive:false}); window.addEventListener('touchend',end);
}

$('startBtn').addEventListener('click', setupLottery);
$('resetBtn').addEventListener('click', ()=>{ location.reload(); });
$('revealBtn').addEventListener('click', revealLottery);
$('nextRoundBtn').addEventListener('click', setupLottery);
$('assetToggle').addEventListener('click', ()=>$('assetPanel').classList.toggle('hidden'));
window.addEventListener('resize',()=>{ if(game) resizeGame(); if(!scratch.checked && !document.getElementById('lotteryScreen').classList.contains('hidden')) setupScratch(); });

if(!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){this.beginPath();this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath();return this;}
}

bindScratch(); bindJoystick(); show('startScreen');
