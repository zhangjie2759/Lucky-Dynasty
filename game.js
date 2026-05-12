(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const fmt = (n) => '¥' + Math.max(0, Math.floor(n)).toLocaleString('zh-CN');
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const PRIZE_TIERS = [
    { name: '小确幸', min: 3000, max: 10000, weight: 42 },
    { name: '改善生活', min: 10000, max: 100000, weight: 30 },
    { name: '人生推进', min: 100000, max: 1000000, weight: 16 },
    { name: '阶层跃迁', min: 1000000, max: 10000000, weight: 8 },
    { name: '暴富人生', min: 10000000, max: 100000000, weight: 3 },
    { name: '传说强运', min: 100000000, max: 300000000, weight: 1 }
  ];

  const PRODUCTS = [
    // 低价生活区
    { id:'snack', name:'全家大餐', icon:'🍜', price:800, zone:'life' },
    { id:'phone', name:'新手机', icon:'📱', price:5000, zone:'life' },
    { id:'ebike', name:'电驴', icon:'🛵', price:3500, zone:'life' },
    { id:'bike', name:'自行车', icon:'🚲', price:1200, zone:'life' },
    { id:'fridge', name:'大冰箱', icon:'🧊', price:6000, zone:'life' },
    { id:'redpack', name:'爸妈红包', icon:'🧧', price:10000, zone:'life' },
    { id:'gamepc', name:'游戏电脑', icon:'🖥️', price:15000, zone:'life' },

    // 汽车区
    { id:'usedcar', name:'二手车', icon:'🚗', price:60000, zone:'car' },
    { id:'sedan', name:'油车轿车', icon:'🚘', price:150000, zone:'car' },
    { id:'ev', name:'电车', icon:'🔋', price:220000, zone:'car' },
    { id:'suv', name:'SUV', icon:'🚙', price:300000, zone:'car' },
    { id:'mpv', name:'MPV', icon:'🚐', price:450000, zone:'car' },
    { id:'pickup', name:'皮卡', icon:'🛻', price:280000, zone:'car' },
    { id:'sport', name:'跑车', icon:'🏎️', price:2000000, zone:'car' },
    { id:'supercar', name:'限量超跑', icon:'🔥', price:12000000, zone:'car' },

    // 房产区
    { id:'rent', name:'一年房租', icon:'🔑', price:50000, zone:'house' },
    { id:'decorate', name:'装修', icon:'🛋️', price:150000, zone:'house' },
    { id:'downpay', name:'房子首付', icon:'🏠', price:500000, zone:'house' },
    { id:'apartment', name:'市区公寓', icon:'🏢', price:1800000, zone:'house' },
    { id:'villa', name:'别墅', icon:'🏡', price:12000000, zone:'house' },
    { id:'building', name:'整栋楼', icon:'🏙️', price:80000000, zone:'house' },

    // 奢侈/公司/顶级区
    { id:'bag', name:'名牌包', icon:'👜', price:40000, zone:'luxury' },
    { id:'watch', name:'名表', icon:'⌚', price:150000, zone:'luxury' },
    { id:'gold', name:'金条', icon:'🟨', price:500000, zone:'luxury' },
    { id:'jewel', name:'珠宝', icon:'💎', price:1200000, zone:'luxury' },
    { id:'stall', name:'小摊创业', icon:'🥞', price:80000, zone:'company' },
    { id:'shop', name:'开门店', icon:'🏪', price:600000, zone:'company' },
    { id:'factory', name:'小工厂', icon:'🏭', price:5000000, zone:'company' },
    { id:'company', name:'公司总部', icon:'🏦', price:50000000, zone:'company' }
  ];

  const state = {
    gen: 1,
    totalAsset: 0,
    budget: 0,
    spent: 0,
    warning: 0,
    prizeTier: null,
    inventory: {},
    roundItems: [],
    running: false,
    gameOver: false,
    win: false
  };

  let scratch = { canvas:null, ctx:null, rect:null, revealed:false, down:false, last:0 };

  let game = {
    canvas:null, ctx:null, w:0, h:0, tileW:64, tileH:32,
    gridW:32, gridH:32,
    player:{ x:3, y:28, dir:1 }, // 0上 1右 2下 3左
    snake:[],
    products:[],
    home:{ x:3, y:28 },
    stepMs:185,
    acc:0,
    lastTime:0,
    camera:{ x:0, y:0 }
  };

  function show(id){
    ['startScreen','lotteryScreen','gameScreen','resultScreen'].forEach(s => $(s).classList.add('hidden'));
    $(id).classList.remove('hidden');
  }

  function startGame(){
    show('lotteryScreen');
    prepareLottery();
  }

  function prepareLottery(){
    $('genText').textContent = state.gen;
    $('totalAssetText').textContent = fmt(state.totalAsset);
    state.prizeTier = drawTier();
    state.budget = randomBudget(state.prizeTier);
    state.spent = 0;
    state.warning = 0;
    state.roundItems = [];
    state.gameOver = false;
    state.win = false;
    $('prizeText').textContent = '???';
    $('tierText').textContent = '刮开揭晓';
    $('enterMallBtn').classList.add('hidden');
    setupScratch();
  }

  function drawTier(){
    const total = PRIZE_TIERS.reduce((s,t)=>s+t.weight,0);
    let r = Math.random()*total;
    for(const t of PRIZE_TIERS){ r -= t.weight; if(r<=0) return t; }
    return PRIZE_TIERS[0];
  }

  function randomBudget(t){
    const a = Math.log10(t.min), b = Math.log10(t.max);
    const value = Math.pow(10, a + Math.random()*(b-a));
    return Math.round(value / 100) * 100;
  }

  function setupScratch(){
    scratch.canvas = $('scratchCanvas');
    scratch.ctx = scratch.canvas.getContext('2d', { willReadFrequently:true });
    scratch.revealed = false;
    resizeScratch();
    paintScratch();
  }

  function resizeScratch(){
    const box = scratch.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    scratch.rect = { width:box.width, height:box.height };
    scratch.canvas.width = Math.max(1, Math.floor(box.width*dpr));
    scratch.canvas.height = Math.max(1, Math.floor(box.height*dpr));
    scratch.ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function paintScratch(){
    const ctx = scratch.ctx, w = scratch.rect.width, h = scratch.rect.height;
    ctx.clearRect(0,0,w,h);
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,'#f8f6ef'); g.addColorStop(.25,'#aaa39a'); g.addColorStop(.55,'#d9d3c8'); g.addColorStop(1,'#8f887f');
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    ctx.globalAlpha = .18;
    for(let i=0;i<750;i++){
      ctx.fillStyle = Math.random()>.5 ? '#fff' : '#3d3832';
      ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, Math.random()*1.8+.3, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(36,23,11,.55)';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font = '900 24px -apple-system,BlinkMacSystemFont,sans-serif';
    ctx.fillText('刮开强运预算', w/2, h/2-10);
    ctx.font = '800 14px -apple-system,BlinkMacSystemFont,sans-serif';
    ctx.fillText('决定你能扫多少货', w/2, h/2+24);
  }

  function scratchAt(e){
    if(scratch.revealed) return;
    e.preventDefault();
    const p = getPoint(e);
    const box = scratch.canvas.getBoundingClientRect();
    const x = p.x - box.left, y = p.y - box.top;
    const ctx = scratch.ctx;
    ctx.save(); ctx.globalCompositeOperation='destination-out';
    ctx.beginPath(); ctx.arc(x,y,34,0,Math.PI*2); ctx.fill(); ctx.restore();
    const now = performance.now();
    if(now - scratch.last > 160){
      scratch.last = now;
      if(measureScratch() > .55) revealPrize();
    }
  }

  function measureScratch(){
    const data = scratch.ctx.getImageData(0,0,scratch.canvas.width,scratch.canvas.height).data;
    let total=0, clear=0;
    for(let i=3;i<data.length;i+=80){ total++; if(data[i]<90) clear++; }
    return clear/total;
  }

  function revealPrize(){
    scratch.revealed = true;
    scratch.ctx.clearRect(0,0,scratch.rect.width,scratch.rect.height);
    $('prizeText').textContent = fmt(state.budget);
    $('tierText').textContent = `${state.prizeTier.name} · 本局预算`;
    $('enterMallBtn').classList.remove('hidden');
  }

  function enterMall(){
    if(!scratch.revealed) revealPrize();
    show('gameScreen');
    initRound();
  }

  function initRound(){
    state.spent = 0; state.warning = 0; state.roundItems = []; state.running = true; state.gameOver = false; state.win = false;
    game.player = { x:3, y:28, dir:1 };
    game.snake = [{ x:3, y:28, icon:'🧍', name:'你' }];
    game.home = { x:3, y:28 };
    game.stepMs = 185;
    resizeGame();
    generateProducts();
    updateHud();
    $('gameMessage').classList.add('hidden');
    game.lastTime = performance.now(); game.acc = 0;
    requestAnimationFrame(loop);
  }

  function resizeGame(){
    game.canvas = $('gameCanvas'); game.ctx = game.canvas.getContext('2d');
    const box = game.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    game.w = box.width; game.h = box.height;
    game.canvas.width = Math.floor(box.width*dpr); game.canvas.height = Math.floor(box.height*dpr);
    game.ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function generateProducts(){
    game.products = [];
    const affordableMax = state.budget * 1.25;
    const candidates = PRODUCTS.filter(p => p.price <= affordableMax || Math.random() < .35);
    // 分区坐标，让高价物在更深处，大奖优势明显。
    const zones = {
      life:    { x1:5,  y1:23, x2:15, y2:30, count:18 },
      car:     { x1:12, y1:14, x2:24, y2:23, count:16 },
      house:   { x1:18, y1:5,  x2:30, y2:15, count:14 },
      luxury:  { x1:4,  y1:5,  x2:14, y2:15, count:12 },
      company: { x1:20, y1:20, x2:30, y2:30, count:12 }
    };
    for(const [zone, z] of Object.entries(zones)){
      const list = candidates.filter(p => p.zone === zone);
      for(let i=0;i<z.count;i++){
        const prod = pick(list.length?list:PRODUCTS);
        game.products.push({ ...prod, x:randInt(z.x1,z.x2), y:randInt(z.y1,z.y2), bought:false });
      }
    }
    // 出口/家固定在起点，但要绕回来。
  }

  function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

  function turnLeft(){ if(!state.running) return; game.player.dir = (game.player.dir + 3) % 4; }
  function turnRight(){ if(!state.running) return; game.player.dir = (game.player.dir + 1) % 4; }

  function loop(t){
    if(!state.running) return;
    const dt = t - game.lastTime; game.lastTime = t; game.acc += dt;
    while(game.acc >= game.stepMs){ step(); game.acc -= game.stepMs; }
    draw();
    requestAnimationFrame(loop);
  }

  function step(){
    const dirs = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
    const d = dirs[game.player.dir];
    const nx = game.player.x + d.x;
    const ny = game.player.y + d.y;

    if(nx < 0 || ny < 0 || nx >= game.gridW || ny >= game.gridH){
      // 撞墙自动回弹转向，降低挫败。
      game.player.dir = (game.player.dir + 1) % 4;
      return;
    }

    const oldHead = { x:game.player.x, y:game.player.y, icon:'🧍', name:'你' };
    game.player.x = nx; game.player.y = ny;
    game.snake.unshift(oldHead);
    game.snake = game.snake.slice(0, Math.max(1, state.roundItems.length + 1));
    game.snake[0] = { x:nx, y:ny, icon:'🧍', name:'你' };

    const prod = game.products.find(p => !p.bought && p.x === nx && p.y === ny);
    if(prod) buyProduct(prod);

    if(nx === game.home.x && ny === game.home.y && state.roundItems.length > 0){
      winRound();
    }
  }

  function buyProduct(prod){
    const left = state.budget - state.spent;
    if(prod.price > left){
      if(state.warning === 0){
        state.warning = 1;
        showMsg(`钱不够买「${prod.name}」！再撞贵东西就负债去上班。`);
        // 弹开商品，不购买。
        prod.x = clamp(prod.x + randInt(-2,2), 0, game.gridW-1);
        prod.y = clamp(prod.y + randInt(-2,2), 0, game.gridH-1);
      } else {
        loseRound(`你撞上了买不起的「${prod.name}」，负债爆炸。`);
      }
      updateHud();
      return;
    }
    prod.bought = true;
    state.spent += prod.price;
    state.roundItems.push(prod);
    state.inventory[prod.id] = (state.inventory[prod.id] || 0) + 1;
    game.snake.push({ x:game.snake[game.snake.length-1].x, y:game.snake[game.snake.length-1].y, icon:prod.icon, name:prod.name });
    game.stepMs = Math.max(105, 185 - state.roundItems.length * 3);
    showMsg(`买下 ${prod.icon} ${prod.name} -${fmt(prod.price)}`);
    updateHud();
  }

  function showMsg(text){
    const el = $('gameMessage');
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(showMsg.timer);
    showMsg.timer = setTimeout(()=>el.classList.add('hidden'), 1100);
  }

  function updateHud(){
    $('budgetText').textContent = fmt(state.budget);
    $('spentText').textContent = fmt(state.spent);
    $('cashLeftText').textContent = fmt(state.budget - state.spent);
    $('warningText').textContent = `${state.warning}/1`;
  }

  function winRound(){
    state.running = false; state.win = true;
    state.totalAsset += state.spent;
    showResult(true, '成功回家！', `你拖着${state.roundItems.length}件战利品回家，本局购买价值${fmt(state.spent)}。`);
  }

  function loseRound(reason){
    state.running = false; state.gameOver = true;
    showResult(false, '去上班结局', `${reason} 强运世代暂时结束，你只能去上班。`);
  }

  function showResult(success,title,desc){
    $('resultTitle').textContent = title;
    $('resultDesc').textContent = desc;
    $('resultBudget').textContent = fmt(state.budget);
    $('resultSpent').textContent = fmt(state.spent);
    $('resultLeft').textContent = fmt(state.budget - state.spent);
    $('resultCount').textContent = `${state.roundItems.length} 件`;
    renderInventory();
    show('resultScreen');
  }

  function renderInventory(){
    const grid = $('inventoryGrid');
    const entries = Object.entries(state.inventory);
    if(!entries.length){ grid.innerHTML = '<p>还没有资产。</p>'; return; }
    grid.innerHTML = entries.map(([id,count])=>{
      const p = PRODUCTS.find(x=>x.id===id) || {icon:'🎁',name:id};
      return `<div class="inv-item"><i>${p.icon}</i><span>${p.name} ×${count}</span></div>`;
    }).join('');
  }

  function nextRound(){
    state.gen += 1;
    show('lotteryScreen');
    prepareLottery();
  }

  function isoToScreen(x,y){
    const tw=game.tileW, th=game.tileH;
    return { sx:(x-y)*tw/2, sy:(x+y)*th/2 };
  }

  function draw(){
    const ctx = game.ctx;
    ctx.clearRect(0,0,game.w,game.h);
    const playerIso = isoToScreen(game.player.x, game.player.y);
    game.camera.x = game.w/2 - playerIso.sx;
    game.camera.y = game.h/2 - playerIso.sy;

    ctx.save();
    ctx.translate(game.camera.x, game.camera.y);

    drawMap(ctx);
    drawProducts(ctx);
    drawHome(ctx);
    drawSnake(ctx);
    ctx.restore();
  }

  function drawMap(ctx){
    for(let y=0;y<game.gridH;y++){
      for(let x=0;x<game.gridW;x++){
        const {sx,sy}=isoToScreen(x,y);
        const even=(x+y)%2===0;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx+game.tileW/2, sy+game.tileH/2);
        ctx.lineTo(sx, sy+game.tileH);
        ctx.lineTo(sx-game.tileW/2, sy+game.tileH/2);
        ctx.closePath();
        ctx.fillStyle = even ? '#e8c98d' : '#dfbd7d';
        ctx.fill();
        ctx.strokeStyle='rgba(70,38,0,.12)'; ctx.stroke();
      }
    }
  }

  function drawHome(ctx){
    const {sx,sy}=isoToScreen(game.home.x,game.home.y);
    drawBubble(ctx,sx,sy-10,'🏠','家 / 出口','#249a66');
  }

  function drawProducts(ctx){
    for(const p of game.products){
      if(p.bought) continue;
      const {sx,sy}=isoToScreen(p.x,p.y);
      const affordable = p.price <= state.budget - state.spent;
      drawBubble(ctx,sx,sy-8,p.icon,shortPrice(p.price), affordable ? '#fffdf7' : '#ffd2c9');
    }
  }

  function drawSnake(ctx){
    // 从尾到头画，头在最上层
    for(let i=game.snake.length-1;i>=0;i--){
      const seg = game.snake[i];
      const {sx,sy}=isoToScreen(seg.x,seg.y);
      if(i===0){
        drawBubble(ctx,sx,sy-16,'🛒','你','#17100a',true);
      }else{
        drawBubble(ctx,sx,sy-10,seg.icon,'','#f5b73f');
      }
    }
  }

  function drawBubble(ctx,x,y,icon,label,bg,dark=false){
    ctx.save();
    ctx.translate(x,y);
    ctx.beginPath();
    ctx.ellipse(0,24,24,10,0,0,Math.PI*2);
    ctx.fillStyle='rgba(36,23,11,.18)'; ctx.fill();
    roundRect(ctx,-24,-36,48,48,14);
    ctx.fillStyle=bg; ctx.fill();
    ctx.strokeStyle='rgba(36,23,11,.18)'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.font='26px Apple Color Emoji,Segoe UI Emoji,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(icon,0,-12);
    if(label){
      ctx.font='800 10px -apple-system,BlinkMacSystemFont,sans-serif';
      ctx.fillStyle= dark ? '#fff' : '#24170b';
      ctx.fillText(label,0,25);
    }
    ctx.restore();
  }

  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  }

  function shortPrice(n){
    if(n>=100000000) return (n/100000000).toFixed(n%100000000?1:0)+'亿';
    if(n>=10000) return (n/10000).toFixed(n%10000?1:0)+'万';
    return String(n);
  }

  function getPoint(e){
    if(e.touches && e.touches.length) return {x:e.touches[0].clientX,y:e.touches[0].clientY};
    if(e.changedTouches && e.changedTouches.length) return {x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};
    return {x:e.clientX,y:e.clientY};
  }

  function bind(){
    $('startBtn').addEventListener('click', startGame);
    $('enterMallBtn').addEventListener('click', enterMall);
    $('nextRoundBtn').addEventListener('click', nextRound);
    $('leftBtn').addEventListener('click', turnLeft);
    $('rightBtn').addEventListener('click', turnRight);

    // 左右半屏也能控制，手机更舒服。
    $('gameCanvas').addEventListener('pointerdown', e => {
      const x = e.clientX;
      if(x < window.innerWidth/2) turnLeft(); else turnRight();
    });

    window.addEventListener('keydown', e => {
      if(e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') turnLeft();
      if(e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') turnRight();
    });

    scratch.canvas = $('scratchCanvas');
    const down = e => { scratch.down=true; scratchAt(e); };
    const move = e => { if(scratch.down) scratchAt(e); };
    const up = () => { scratch.down=false; };
    scratch.canvas.addEventListener('pointerdown', down, {passive:false});
    scratch.canvas.addEventListener('pointermove', move, {passive:false});
    scratch.canvas.addEventListener('pointerup', up, {passive:false});
    scratch.canvas.addEventListener('pointercancel', up, {passive:false});

    window.addEventListener('resize', () => {
      if(!$('lotteryScreen').classList.contains('hidden')) setupScratch();
      if(!$('gameScreen').classList.contains('hidden')) resizeGame();
    });
  }

  bind();
})();
