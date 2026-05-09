'use strict';

const STORAGE_KEY = 'strongLuckFamilyDemoV5_infiniteEventsStocks';
const START_CASH = 100000;
const START_LUCK = 50;
const MAX_TICKETS_PER_GEN = 3;
const GRAND_PRIZE_THRESHOLD = 1000000;
const JOY_PER_MEDAL = 100;

const TICKETS = {
  small: { name: '小福票', cost: 10000, bonus: 0, weights: { 2: 64, 3: 27, 4: 7, 5: 1.5, 6: .4, 7: .08, 8: .018, 9: .002 }, payouts: { 2: 10000, 3: 30000, 4: 120000, 5: 600000, 6: 1800000, 7: 8000000, 8: 30000000, 9: 100000000 } },
  luck: { name: '强运票', cost: 30000, bonus: 12, weights: { 2: 46, 3: 32, 4: 15, 5: 5, 6: 1.5, 7: .35, 8: .12, 9: .03 }, payouts: { 2: 20000, 3: 80000, 4: 500000, 5: 2000000, 6: 8000000, 7: 30000000, 8: 100000000, 9: 500000000 } },
  rich: { name: '暴富票', cost: 80000, bonus: 24, weights: { 2: 34, 3: 30, 4: 21, 5: 9, 6: 3.8, 7: 1.5, 8: .55, 9: .15 }, payouts: { 2: 30000, 3: 150000, 4: 1000000, 5: 5000000, 6: 20000000, 7: 80000000, 8: 300000000, 9: 1000000000 } }
};

const SHOP_CATEGORIES = [
  { id: 'car', name: '汽车' }, { id: 'house', name: '房产' }, { id: 'company', name: '公司' }, { id: 'luxury', name: '奢侈品' }, { id: 'other', name: '其他' }
];

const ASSETS = [
  { id:'car10', cat:'car', icon:'🚗', name:'10万代步车', price:100000, joy:8, resale:.55, luck:0, desc:'最基础的中奖后体面。' },
  { id:'car30', cat:'car', icon:'🚙', name:'30万体面车', price:300000, joy:16, resale:.52, luck:0, desc:'家族开始像有钱人。' },
  { id:'car50', cat:'car', icon:'🚘', name:'50万豪华入门', price:500000, joy:24, resale:.5, luck:0, desc:'开出去很有面子。' },
  { id:'car100', cat:'car', icon:'🏎️', name:'100万性能车', price:1000000, joy:40, resale:.45, luck:0, desc:'爽度明显上升。' },
  { id:'car200', cat:'car', icon:'🏎️', name:'200万豪华跑车', price:2000000, joy:62, resale:.42, luck:0, desc:'本代传说开始了。' },
  { id:'car800', cat:'car', icon:'🏁', name:'800万限量超跑', price:8000000, joy:120, resale:.38, luck:1, desc:'街上没人敢不看。' },
  { id:'car2000', cat:'car', icon:'🏆', name:'2000万顶级神车', price:20000000, joy:220, resale:.36, luck:2, desc:'车库变博物馆。' },
  { id:'car10000', cat:'car', icon:'👑', name:'1亿私人车库', price:100000000, joy:900, resale:.32, luck:5, desc:'一整代人的荒唐。' },

  { id:'home50', cat:'house', icon:'🏚️', name:'50万县城小房', price:500000, joy:14, resale:.82, luck:0, desc:'便宜，但是真资产。' },
  { id:'home150', cat:'house', icon:'🏠', name:'150万普通住宅', price:1500000, joy:28, resale:.84, luck:1, desc:'给后代一个落脚点。' },
  { id:'home300', cat:'house', icon:'🏘️', name:'300万市区三居', price:3000000, joy:45, resale:.85, luck:1, desc:'家族进入城市。' },
  { id:'home800', cat:'house', icon:'🏢', name:'800万大平层', price:8000000, joy:80, resale:.86, luck:2, desc:'暴富后的第一套梦想房。' },
  { id:'home2000', cat:'house', icon:'🌉', name:'2000万江景豪宅', price:20000000, joy:150, resale:.86, luck:3, desc:'每天看江景，也看命。' },
  { id:'home5000', cat:'house', icon:'🏡', name:'5000万独栋别墅', price:50000000, joy:310, resale:.84, luck:4, desc:'家族终于有院子。' },
  { id:'home10000', cat:'house', icon:'🏰', name:'1亿家族庄园', price:100000000, joy:650, resale:.82, luck:7, desc:'真正的传家资产。' },
  { id:'home50000', cat:'house', icon:'🏙️', name:'5亿整栋楼', price:500000000, joy:2200, resale:.8, luck:12, desc:'家族站到城市天际线里。' },

  { id:'shop', cat:'company', icon:'🏪', name:'小便利店', price:300000, joy:10, resale:.5, luck:0, desc:'赚得少，但像开始创业。' },
  { id:'restaurant', cat:'company', icon:'🍜', name:'网红餐厅', price:1000000, joy:30, resale:.45, luck:0, desc:'可能很火，也可能亏。' },
  { id:'factory', cat:'company', icon:'🏭', name:'小工厂', price:3000000, joy:42, resale:.55, luck:1, desc:'有实体资产。' },
  { id:'brand', cat:'company', icon:'🧢', name:'潮流品牌', price:8000000, joy:95, resale:.5, luck:2, desc:'很适合炫耀的公司。' },
  { id:'tech', cat:'company', icon:'💻', name:'科技公司', price:30000000, joy:180, resale:.45, luck:4, desc:'烧钱，但有想象力。' },
  { id:'group', cat:'company', icon:'🏦', name:'家族集团', price:150000000, joy:900, resale:.65, luck:8, desc:'从中奖者变成资本家。' },

  { id:'watch', cat:'luxury', icon:'⌚', name:'名表', price:200000, joy:18, resale:.72, luck:1, desc:'小而精的暴富证明。' },
  { id:'bag', cat:'luxury', icon:'👜', name:'限量包', price:300000, joy:24, resale:.62, luck:0, desc:'图鉴收藏感强。' },
  { id:'jewel', cat:'luxury', icon:'💎', name:'传家珠宝', price:1200000, joy:35, resale:.9, luck:5, desc:'保值，还能提高强运。' },
  { id:'art', cat:'luxury', icon:'🖼️', name:'当代艺术品', price:5000000, joy:70, resale:.65, luck:2, desc:'真假和价格都很玄学。' },
  { id:'crown', cat:'luxury', icon:'👑', name:'家族王冠', price:50000000, joy:500, resale:.78, luck:10, desc:'荒诞但伟大。' },

  { id:'temple', cat:'other', icon:'⛩️', name:'强运祠堂', price:1600000, joy:26, resale:.25, luck:12, desc:'不保值，但后代更强运。' },
  { id:'trip', cat:'other', icon:'✈️', name:'环球旅行', price:800000, joy:80, resale:0, luck:0, desc:'不能卖，但很快乐。' },
  { id:'wedding', cat:'other', icon:'💒', name:'世纪婚礼', price:3000000, joy:180, resale:0, luck:1, desc:'快乐勋章发动机。' },
  { id:'yacht', cat:'other', icon:'🛥️', name:'游艇派对', price:5000000, joy:260, resale:.35, luck:-2, desc:'非常爽，也非常败家。' },
  { id:'charity', cat:'other', icon:'🕊️', name:'做慈善', price:2000000, joy:60, resale:0, luck:8, desc:'强运变干净了一点。' }
];

const STOCKS = [
  { id:'stable', icon:'🏦', name:'稳健银行股', price:100000, risk:0.08, drift:0.03, desc:'涨跌小，适合保守传承。' },
  { id:'tech', icon:'🤖', name:'未来科技股', price:200000, risk:0.22, drift:0.07, desc:'波动大，梦想也大。' },
  { id:'meme', icon:'🔥', name:'强运妖股', price:50000, risk:0.55, drift:0.12, desc:'可能翻倍，也可能腰斩。' },
  { id:'family', icon:'🐲', name:'家族概念股', price:300000, risk:0.18, drift:0.05, desc:'受强运影响更明显。' }
];

const NAMES = ['张大发','张金宝','张满仓','张旺财','张来福','张富贵','张锦鲤','张添财','张好运','张万利'];
const TRAITS = [
  { name:'稳健派', desc:'更适合兑现小奖，把现金慢慢滚起来。' }, { name:'野心家', desc:'总觉得下一张就是大的，适合攒强运。' },
  { name:'败家子', desc:'消费爽感更重要，家族传说不能太寒酸。' }, { name:'守财奴', desc:'喜欢留下现金，但容易错过本代爽度。' },
  { name:'幸运儿', desc:'天生相信自己会刮出改命号码。' }, { name:'传承脑', desc:'更看重资产和下一代强运。' }
];

const EVENTS = [
  { type:'bad', title:'亲戚突然借钱', text:'七大姑八大姨听说你中过奖，现金减少。', cash:-80000, luck:-2 },
  { type:'bad', title:'豪车维修', text:'车库里有东西开始吞钱。', cash:-120000, joy:-8 },
  { type:'bad', title:'被骗投资课', text:'听了一场暴富讲座，现金减少，强运也变脏。', cash:-150000, luck:-6 },
  { type:'bad', title:'房产税和物业费', text:'资产越多，烦恼越多。', assetFee:.015 },
  { type:'bad', title:'公司现金流紧张', text:'创业不是许愿，现金减少。', companyFee:.04 },
  { type:'bad', title:'彩票店老板不看好你', text:'下一代开始前强运下降。', luck:-8 },
  { type:'good', title:'旧房升值', text:'家族资产被市场抬了一下。', cash:120000, luck:2 },
  { type:'good', title:'贵人送福', text:'有人说你面相会中，强运上升。', luck:8 },
  { type:'good', title:'珠宝拍卖涨价', text:'传家物件被看上，现金增加。', cash:200000 },
  { type:'good', title:'彩票店送体验券', text:'本代多一张彩票机会。', ticket:1 }
];

const $ = id => document.getElementById(id);
const fmt = n => '¥' + Math.max(0, Math.floor(n)).toLocaleString('zh-CN');
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
let state, currentTicket=null, shopCategory='car';
let scratch={isDown:false,canvas:null,ctx:null,rect:null,checked:false,locked:false,pendingPrize:null,lastMeasure:0};

function makeHeir(){return{name:pick(NAMES),trait:pick(TRAITS),avatar:pick(['🧧','👑','🍀','💰','🎲','🐲','🏮','💎'])};}
function freshState(){const heir=makeHeir();return{generation:1,heir,cash:START_CASH,luck:START_LUCK,joy:0,medals:0,ticketsLeft:MAX_TICKETS_PER_GEN,grandWonThisGen:false,totalGrandWins:0,assets:{},collection:{},stocks:{},stockHistory:[],lastEvent:null,activeTab:'lottery',logs:[`第1代继承人「${heir.name}」拿着10万元走进彩票站。`],gameOver:false};}
function normalizeState(s){if(!s)return freshState();s.heir||=makeHeir();s.medals||=0;s.stocks||={};s.stockHistory||=[];s.activeTab||='lottery';s.logs||=[];s.assets||={};s.collection||={};return s;}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function load(){try{const raw=localStorage.getItem(STORAGE_KEY);return raw?normalizeState(JSON.parse(raw)):null;}catch(e){return null;}}
function addLog(t){state.logs.unshift(t);state.logs=state.logs.slice(0,24);renderLog();}
function showStart(){$('startScreen').classList.remove('hidden');$('gameScreen').classList.add('hidden');$('endScreen').classList.add('hidden');$('continueBtn').classList.toggle('hidden',!load());}
function showGame(){$('startScreen').classList.add('hidden');$('gameScreen').classList.remove('hidden');$('endScreen').classList.add('hidden');renderAll();switchTab(state.activeTab||'lottery',false);}

function renderAll(){
  $('generationText').textContent=state.generation;$('heirNameText').textContent=state.heir.name;$('cashText').textContent=fmt(state.cash);$('luckText').textContent=Math.round(state.luck);$('medalText').textContent=state.medals;$('ticketsLeftText').textContent=state.ticketsLeft;
  $('luckBar').style.width=clamp(state.luck,0,120)/120*100+'%';
  renderTicketButtons();renderShopTabs();renderShop();renderStocks();renderCollection();renderAssetSummary();renderProfile();renderEvent();renderLog();renderWorkPanel();$('openShopBtn').classList.toggle('hidden',!state.grandWonThisGen);save();
}
function switchTab(tab,shouldSave=true){const views={lottery:'lotteryView',shop:'shopView',stocks:'stocksView',assets:'assetsView',info:'infoView'};Object.values(views).forEach(id=>$(id).classList.add('hidden'));$(views[tab]||views.lottery).classList.remove('hidden');document.querySelectorAll('.nav-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===tab));state.activeTab=tab;if(shouldSave)save();}
function renderTicketButtons(){document.querySelectorAll('.ticket-btn').forEach(btn=>{const t=TICKETS[btn.dataset.type];btn.disabled=state.cash<t.cost||state.ticketsLeft<=0||!!currentTicket;});$('nextGenerationBtn').disabled=!!currentTicket;$('shopNextGenBtn').disabled=!!currentTicket;}
function renderWorkPanel(){const broke=state.cash<TICKETS.small.cost&&!canContinueWithAssets();$('workEndPanel').classList.toggle('hidden',!broke);}
function renderLog(){const list=$('logList');if(list)list.innerHTML=state.logs.map(line=>`<div class="log-item">${line}</div>`).join('');}

function renderShopTabs(){const wrap=$('shopTabs');wrap.innerHTML=SHOP_CATEGORIES.map(c=>`<button class="shop-tab ${shopCategory===c.id?'active':''}" data-shop-tab="${c.id}">${c.name}</button>`).join('');wrap.querySelectorAll('[data-shop-tab]').forEach(btn=>btn.addEventListener('click',()=>{shopCategory=btn.dataset.shopTab;renderAll();}));}
function renderShop(){const grid=$('shopGrid');const items=ASSETS.filter(a=>a.cat===shopCategory);grid.innerHTML=items.map(a=>{const owned=state.assets[a.id]||0;return`<div class="asset-card"><div class="asset-icon">${a.icon}</div><div><h3>${a.name}</h3><div class="asset-meta">${fmt(a.price)} · 爽度+${a.joy} · 强运${a.luck>=0?'+':''}${a.luck}<br>${a.desc}</div><button class="buy-btn" data-buy="${a.id}" ${state.cash>=a.price?'':'disabled'}>${owned?'再买一个':'购买'}</button>${owned?`<button class="sell-btn" data-sell="${a.id}">变卖 ${fmt(a.price*a.resale)}</button>`:''}</div></div>`;}).join('');grid.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>buyAsset(b.dataset.buy)));grid.querySelectorAll('[data-sell]').forEach(b=>b.addEventListener('click',()=>sellAsset(b.dataset.sell)));}
function renderStocks(){const total=stockValue();$('stockSummary').innerHTML=`<div class="summary-box"><span>股票市值</span><strong>${fmt(total)}</strong></div><div class="summary-box"><span>持仓种类</span><strong>${Object.keys(state.stocks).length}</strong></div><div class="summary-box"><span>最近涨跌</span><strong>${state.stockHistory[0]||'未结算'}</strong></div>`;$('stockGrid').innerHTML=STOCKS.map(s=>{const pos=state.stocks[s.id]||{shares:0,price:s.price};const value=pos.shares*pos.price;return`<div class="stock-card"><div class="asset-icon">${s.icon}</div><div><h3>${s.name}</h3><div class="asset-meta">当前价 ${fmt(pos.price)} · 持有 ${pos.shares} 手 · 市值 ${fmt(value)}<br>${s.desc}</div><button class="buy-btn" data-stock-buy="${s.id}" ${state.cash>=pos.price?'':'disabled'}>买入1手</button>${pos.shares?`<button class="sell-btn" data-stock-sell="${s.id}">卖出1手</button>`:''}</div></div>`;}).join('');$('stockGrid').querySelectorAll('[data-stock-buy]').forEach(b=>b.addEventListener('click',()=>buyStock(b.dataset.stockBuy)));$('stockGrid').querySelectorAll('[data-stock-sell]').forEach(b=>b.addEventListener('click',()=>sellStock(b.dataset.stockSell)));}
function renderCollection(){const grid=$('collectionGrid');grid.innerHTML=ASSETS.map(a=>{const owned=state.assets[a.id]||0,seen=!!state.collection[a.id],cls=owned?'owned':seen?'past':'';return`<div class="collection-item ${cls}"><i>${a.icon}</i><span>${a.name}${owned>1?'×'+owned:''}</span>${owned?`<button class="collection-sell" data-collection-sell="${a.id}">变卖</button>`:''}</div>`;}).join('');grid.querySelectorAll('[data-collection-sell]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();sellAsset(b.dataset.collectionSell);}));}
function renderAssetSummary(){const owned=Object.values(state.assets).reduce((a,b)=>a+b,0),seen=Object.keys(state.collection).length,value=totalAssetValue();$('assetSummary').innerHTML=`<div class="summary-box"><span>当前拥有</span><strong>${owned} 件</strong></div><div class="summary-box"><span>资产估值</span><strong>${fmt(value)}</strong></div><div class="summary-box"><span>图鉴进度</span><strong>${seen}/${ASSETS.length}</strong></div>`;}
function renderProfile(){const assetValue=totalAssetValue(),score=currentScore(),grade=familyGrade(score);$('profileCard').innerHTML=`<div class="profile-main"><div class="avatar">${state.heir.avatar}</div><div><h3>${state.heir.name}</h3><p>第${state.generation}代继承人 · ${state.heir.trait.name}</p></div></div><p>${state.heir.trait.desc}</p><div class="profile-grid"><div class="profile-stat"><span>现金</span><strong>${fmt(state.cash)}</strong></div><div class="profile-stat"><span>强运</span><strong>${Math.round(state.luck)}</strong></div><div class="profile-stat"><span>本代爽度</span><strong>${Math.round(state.joy)}</strong></div><div class="profile-stat"><span>快乐勋章</span><strong>${state.medals}</strong></div><div class="profile-stat"><span>股票市值</span><strong>${fmt(stockValue())}</strong></div><div class="profile-stat"><span>当前阶层</span><strong>${grade}</strong></div></div>`;}
function renderEvent(){const card=$('eventCard');if(!state.lastEvent){card.classList.add('hidden');return;}card.className=`event-card ${state.lastEvent.type}`;card.innerHTML=`<h3>${state.lastEvent.title}</h3><p>${state.lastEvent.text}</p>`;card.classList.remove('hidden');}

function buyAsset(id){const a=ASSETS.find(x=>x.id===id);if(!a||state.cash<a.price)return;state.cash-=a.price;state.joy+=a.joy;state.luck=clamp(state.luck+a.luck,0,120);state.assets[id]=(state.assets[id]||0)+1;state.collection[id]='owned';addLog(`第${state.generation}代买下「${a.name}」，爽度+${a.joy}。`);renderAll();}
function sellAsset(id){const a=ASSETS.find(x=>x.id===id);if(!a||!state.assets[id])return;state.assets[id]-=1;if(state.assets[id]<=0)delete state.assets[id];state.collection[id]='past';const money=Math.floor(a.price*a.resale);state.cash+=money;state.joy=Math.max(0,state.joy-4);addLog(`家族变卖了「${a.name}」，换回${fmt(money)}。`);renderAll();}
function stockValue(){return Object.entries(state.stocks).reduce((sum,[id,pos])=>sum+pos.shares*pos.price,0);}
function buyStock(id){const s=STOCKS.find(x=>x.id===id);const pos=state.stocks[id]||{shares:0,price:s.price};if(state.cash<pos.price)return;state.cash-=pos.price;pos.shares+=1;state.stocks[id]=pos;addLog(`买入1手「${s.name}」。`);renderAll();}
function sellStock(id){const s=STOCKS.find(x=>x.id===id);const pos=state.stocks[id];if(!pos||pos.shares<=0)return;state.cash+=pos.price;pos.shares-=1;if(pos.shares<=0)delete state.stocks[id];addLog(`卖出1手「${s.name}」，获得${fmt(pos.price)}。`);renderAll();}
function settleStocks(){let lines=[];for(const s of STOCKS){const pos=state.stocks[s.id];if(!pos)continue;let luckBonus=s.id==='family'?(state.luck-50)/500:0;let change=s.drift+luckBonus+(Math.random()*2-1)*s.risk;change=clamp(change,-.72,1.8);pos.price=Math.max(1000,Math.floor(pos.price*(1+change)));lines.push(`${s.name}${change>=0?'+':''}${Math.round(change*100)}%`);}state.stockHistory=lines.concat(state.stockHistory).slice(0,5);if(lines.length)addLog(`股票结算：${lines.join('，')}。`);}

function startTicket(type){const t=TICKETS[type];if(!t||state.cash<t.cost||state.ticketsLeft<=0||currentTicket)return;state.cash-=t.cost;state.ticketsLeft--;const winningCode=randomCode(),tailMatch=chooseTailMatch(t),playerCode=makePlayerCode(winningCode,tailMatch),prize=t.payouts[tailMatch]||0;currentTicket={type,name:t.name,winningCode,playerCode,tailMatch,prize,scratchedPercent:0};$('currentTicketName').textContent=t.name;$('winningCodeText').textContent=formatCode(winningCode);$('playerCodeText').textContent=formatCode(playerCode);$('playerCodeText').classList.remove('matched');$('matchHintText').textContent='刮开后自动验奖';$('ticketChooser').classList.add('hidden');$('scratchArea').classList.remove('hidden');$('finishTicketBtn').textContent='放弃';$('checkTicketBtn').disabled=false;scratch.ctx=null;addLog(`买下「${t.name}」，刮开9位强运码验奖。`);renderAll();switchTab('lottery');requestAnimationFrame(()=>setupScratchCard());}
function randomCode(){let s='';for(let i=0;i<9;i++)s+=Math.floor(Math.random()*10);return s;}
function formatCode(code){return code.replace(/(\d{3})(\d{3})(\d{3})/,'$1 $2 $3');}
function chooseTailMatch(t){const luck=clamp(state.luck+t.bonus,0,120),luckFactor=(luck-50)/70;const entries=Object.entries(t.weights).map(([m,w])=>{m=Number(m);return[m,w*clamp(1+luckFactor*(m-2)*.42,.2,4.2)];});let r=Math.random()*entries.reduce((s,[,w])=>s+w,0);for(const [m,w]of entries){r-=w;if(r<=0)return m;}return 2;}
function makePlayerCode(win,match){if(match>=9)return win;const arr=randomCode().split(''),start=9-match;for(let i=start;i<9;i++)arr[i]=win[i];if(start-1>=0&&arr[start-1]===win[start-1])arr[start-1]=String((Number(win[start-1])+1+Math.floor(Math.random()*9))%10);return arr.join('');}
function setupScratchCard(){scratch.canvas=$('scratchCanvas');scratch.ctx=scratch.canvas.getContext('2d',{willReadFrequently:true});scratch.checked=false;scratch.locked=false;scratch.pendingPrize=null;scratch.lastMeasure=0;const ok=resizeScratchCanvas();if(!ok){setTimeout(setupScratchCard,80);return;}paintScratchLayer();$('matchHintText').textContent='拖动刮开银色涂层';}
function resizeScratchCanvas(){const stage=$('scratchStage'),canvas=scratch.canvas,box=stage.getBoundingClientRect();let cssW=box.width||stage.clientWidth||Math.min(500,window.innerWidth-32),cssH=box.height||stage.clientHeight||Math.round(cssW/1.72);if(!cssW||cssW<40)return false;cssH=Math.max(180,cssH);const dpr=Math.max(1,Math.min(window.devicePixelRatio||1,3));scratch.rect={width:cssW,height:cssH};canvas.width=Math.floor(cssW*dpr);canvas.height=Math.floor(cssH*dpr);canvas.style.width=cssW+'px';canvas.style.height=cssH+'px';scratch.ctx.setTransform(dpr,0,0,dpr,0,0);return true;}
function paintScratchLayer(){const ctx=scratch.ctx,w=scratch.rect.width,h=scratch.rect.height;ctx.save();ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,w,h);const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#f6f4ee');g.addColorStop(.2,'#c9c3b8');g.addColorStop(.45,'#8f897f');g.addColorStop(.7,'#d9d4ca');g.addColorStop(1,'#fbf6ec');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.globalAlpha=.18;for(let i=0;i<700;i++){ctx.fillStyle=Math.random()>.5?'#fff':'#4f4a43';ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,Math.random()*1.6+.3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.fillStyle='rgba(255,255,255,.26)';for(let i=-w;i<w*2;i+=26){ctx.save();ctx.translate(i,0);ctx.rotate(-.72);ctx.fillRect(0,-h,9,h*3);ctx.restore();}ctx.fillStyle='rgba(36,24,12,.62)';ctx.font='900 20px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('刮开你的9位强运码',w/2,h/2-10);ctx.font='800 13px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif';ctx.fillText('尾号越多，奖金越大',w/2,h/2+22);ctx.restore();}
function scratchAt(cx,cy){if(!currentTicket||scratch.locked||scratch.checked||!scratch.canvas||!scratch.ctx)return;const rect=scratch.canvas.getBoundingClientRect(),x=cx-rect.left,y=cy-rect.top;if(x<-30||y<-30||x>rect.width+30||y>rect.height+30)return;const radius=Math.max(24,Math.min(42,rect.width*.075));scratch.ctx.save();scratch.ctx.globalCompositeOperation='destination-out';scratch.ctx.beginPath();scratch.ctx.arc(x,y,radius,0,Math.PI*2);scratch.ctx.fill();scratch.ctx.restore();const now=performance.now();if(now-scratch.lastMeasure>150){scratch.lastMeasure=now;const p=measureScratchPercent();currentTicket.scratchedPercent=p;$('matchHintText').textContent=`已刮开 ${Math.min(99,Math.round(p*100))}%`;if(p>=.62)checkTicket();}}
function measureScratchPercent(){if(!scratch.canvas||!scratch.ctx)return 0;const data=scratch.ctx.getImageData(0,0,scratch.canvas.width,scratch.canvas.height).data;let clear=0,total=0;for(let i=3;i<data.length;i+=80){total++;if(data[i]<90)clear++;}return total?clear/total:0;}
function clearScratchLayer(){if(!scratch.ctx||!scratch.rect)return;scratch.ctx.save();scratch.ctx.globalCompositeOperation='destination-out';scratch.ctx.fillRect(0,0,scratch.rect.width,scratch.rect.height);scratch.ctx.restore();}
function checkTicket(){if(!currentTicket||scratch.checked)return;scratch.checked=true;scratch.locked=true;clearScratchLayer();$('checkTicketBtn').disabled=true;$('playerCodeText').classList.add('matched');const match=currentTicket.tailMatch,prize=currentTicket.prize,label=match>=9?'9位全中':`尾${match}位相同`;$('matchHintText').textContent=`${label} · ${fmt(prize)}`;scratch.pendingPrize={amount:prize,match,type:currentTicket.type};setTimeout(()=>showPrizeChoice(prize,match),240);}
function showPrizeChoice(amount,match){const grand=amount>=GRAND_PRIZE_THRESHOLD;$('modalIcon').textContent=grand?'🏆':'🎉';$('modalTitle').textContent=`${match>=9?'9位全中':'尾'+match+'位中奖'}：${fmt(amount)}`;$('modalText').textContent=grand?'这笔钱足够进入暴富消费模式。兑现拿钱，不兑现保留大运。':'兑现拿小钱，不兑现保留强运搏后面。';$('cashOutBtn').textContent=`兑现 ${fmt(amount)}`;$('keepLuckBtn').textContent=`不兑现，强运+${keepLuckGain(amount,match)}`;$('choiceModal').classList.remove('hidden');}
function cashOutPrize(){const r=scratch.pendingPrize;if(!r)return;state.cash+=r.amount;const loss=cashOutLuckLoss(r.amount,r.match);state.luck=clamp(state.luck-loss,0,120);addLog(`兑现${fmt(r.amount)}，强运消耗${loss}点。`);if(r.amount>=GRAND_PRIZE_THRESHOLD){state.grandWonThisGen=true;state.totalGrandWins++;addLog(`第${state.generation}代正式进入暴富消费模式。`);}closeChoice(true);if(r.amount>=GRAND_PRIZE_THRESHOLD)setTimeout(()=>switchTab('shop'),280);}
function keepLuckPrize(){const r=scratch.pendingPrize;if(!r)return;const gain=keepLuckGain(r.amount,r.match);state.luck=clamp(state.luck+gain,0,120);addLog(`放弃${fmt(r.amount)}，强运+${gain}。`);closeChoice(true);}
function cashOutLuckLoss(amount,match){return clamp(Math.round(match*3+amount/180000),6,55);}function keepLuckGain(amount,match){return clamp(Math.round(6+match*2+Math.min(amount/1000000,10)),10,32);}
function closeChoice(autoFinish){$('choiceModal').classList.add('hidden');scratch.pendingPrize=null;scratch.locked=false;if(autoFinish)finishTicketWithoutConfirm();renderAll();}
function finishTicket(){if(!currentTicket)return;if(!scratch.checked&&!confirm('这张还没验奖，确定放弃吗？'))return;finishTicketWithoutConfirm();renderAll();}
function finishTicketWithoutConfirm(){currentTicket=null;scratch.checked=false;scratch.locked=false;scratch.pendingPrize=null;scratch.ctx=null;$('scratchArea').classList.add('hidden');$('ticketChooser').classList.remove('hidden');}

function nextGeneration(){if(currentTicket){switchTab('lottery');return;}if(state.cash<TICKETS.small.cost&&!canContinueWithAssets()){renderWorkPanel();switchTab('lottery');return;}const medals=Math.floor(state.joy/JOY_PER_MEDAL);if(medals>0){state.medals+=medals;addLog(`本代爽度${state.joy}，兑换${medals}枚快乐勋章。`);}settleStocks();const old=state.generation,oldCash=state.cash;const nextHeir=makeHeir();state.generation++;state.heir=nextHeir;state.ticketsLeft=MAX_TICKETS_PER_GEN;state.grandWonThisGen=false;state.joy=0;state.luck=clamp(Math.round(state.luck*.45+calcInheritedLuck()),8,115);applyEvent();state.activeTab='lottery';addLog(`第${old}代把${fmt(oldCash)}和家族资产传给第${state.generation}代。新继承人「${nextHeir.name}」。`);$('ticketChooser').classList.remove('hidden');$('scratchArea').classList.add('hidden');renderAll();switchTab('lottery');}
function canContinueWithAssets(){return Object.values(state.assets).some(c=>c>0)||stockValue()>0;}
function calcInheritedLuck(){let boost=18;for(const[id,count]of Object.entries(state.assets)){const a=ASSETS.find(x=>x.id===id);if(a)boost+=a.luck*count;}return boost;}
function applyEvent(){const isGood=Math.random()<.25;let pool=EVENTS.filter(e=>e.type===(isGood?'good':'bad'));const ev={...pick(pool)};let assetFee=0,companyFee=0;if(ev.assetFee)assetFee=Math.floor(totalAssetValue()*ev.assetFee);if(ev.companyFee){for(const[id,count]of Object.entries(state.assets)){const a=ASSETS.find(x=>x.id===id);if(a&&a.cat==='company')companyFee+=Math.floor(a.price*ev.companyFee*count);}}const cashDelta=(ev.cash||0)-assetFee-companyFee;state.cash=Math.max(0,state.cash+cashDelta);state.luck=clamp(state.luck+(ev.luck||0),0,120);state.joy=Math.max(0,state.joy+(ev.joy||0));if(ev.ticket)state.ticketsLeft+=ev.ticket;state.lastEvent=ev;let detail=cashDelta?`现金${cashDelta>0?'+':''}${fmt(Math.abs(cashDelta))}`:'';addLog(`突发事件：${ev.title}${detail?'，'+detail:''}。`);}
function totalAssetValue(){let total=0;for(const[id,count]of Object.entries(state.assets)){const a=ASSETS.find(x=>x.id===id);if(a)total+=a.price*a.resale*count;}return Math.floor(total);}function currentScore(){return state.cash+totalAssetValue()+stockValue()+Object.keys(state.collection).length*180000+state.totalGrandWins*500000+state.medals*1000000;}
function familyGrade(score){if(score>500000000)return'强运神话';if(score>100000000)return'传奇强运世家';if(score>50000000)return'豪门家族';if(score>10000000)return'城市新贵';if(score>2000000)return'小富之家';return'普通家庭';}
function endGame(){state.gameOver=true;save();$('gameScreen').classList.add('hidden');$('endScreen').classList.remove('hidden');const score=currentScore(),grade=familyGrade(score);$('endingTitle').textContent='结束强运世代，去上班';$('endingText').textContent=`第${state.generation}代终于买不起彩票了。家族评级：「${grade}」。最大的悲剧不是破产，是恢复正常上班。`;$('endingStats').innerHTML=`<div><span>最终现金</span><strong>${fmt(state.cash)}</strong></div><div><span>资产估值</span><strong>${fmt(totalAssetValue())}</strong></div><div><span>股票市值</span><strong>${fmt(stockValue())}</strong></div><div><span>快乐勋章</span><strong>${state.medals}</strong></div>`;localStorage.removeItem(STORAGE_KEY);}
function getPointFromEvent(e){if(e.touches&&e.touches.length)return{x:e.touches[0].clientX,y:e.touches[0].clientY};if(e.changedTouches&&e.changedTouches.length)return{x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};return{x:e.clientX,y:e.clientY};}
function bindScratchInput(){const canvas=$('scratchCanvas');const start=e=>{if(!currentTicket||scratch.locked||scratch.checked)return;e.preventDefault();scratch.isDown=true;if(e.pointerId!==undefined&&canvas.setPointerCapture){try{canvas.setPointerCapture(e.pointerId)}catch(_){}}const p=getPointFromEvent(e);scratchAt(p.x,p.y);};const move=e=>{if(!scratch.isDown)return;e.preventDefault();const p=getPointFromEvent(e);scratchAt(p.x,p.y);};const end=e=>{if(scratch.isDown&&e)e.preventDefault();scratch.isDown=false;};if('PointerEvent'in window){canvas.addEventListener('pointerdown',start,{passive:false});canvas.addEventListener('pointermove',move,{passive:false});canvas.addEventListener('pointerup',end,{passive:false});canvas.addEventListener('pointercancel',end,{passive:false});canvas.addEventListener('pointerleave',end,{passive:false});}else{canvas.addEventListener('touchstart',start,{passive:false});canvas.addEventListener('touchmove',move,{passive:false});canvas.addEventListener('touchend',end,{passive:false});canvas.addEventListener('mousedown',start,{passive:false});window.addEventListener('mousemove',move,{passive:false});window.addEventListener('mouseup',end,{passive:false});}}
function bindEvents(){$('startBtn').addEventListener('click',()=>{state=freshState();save();showGame();});$('continueBtn').addEventListener('click',()=>{state=load()||freshState();showGame();});$('resetBtn').addEventListener('click',()=>{if(!confirm('确定重开这个家族吗？'))return;localStorage.removeItem(STORAGE_KEY);currentTicket=null;state=freshState();showGame();});$('playAgainBtn').addEventListener('click',()=>{state=freshState();save();showGame();});document.querySelectorAll('.ticket-btn').forEach(btn=>btn.addEventListener('click',()=>startTicket(btn.dataset.type)));document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.tab)));$('finishTicketBtn').addEventListener('click',finishTicket);$('checkTicketBtn').addEventListener('click',checkTicket);$('nextGenerationBtn').addEventListener('click',nextGeneration);$('shopNextGenBtn').addEventListener('click',nextGeneration);$('openShopBtn').addEventListener('click',()=>switchTab('shop'));$('cashOutBtn').addEventListener('click',cashOutPrize);$('keepLuckBtn').addEventListener('click',keepLuckPrize);$('goWorkBtn').addEventListener('click',endGame);bindScratchInput();window.addEventListener('resize',()=>{if(currentTicket&&state.activeTab==='lottery'&&!$('scratchArea').classList.contains('hidden')&&!scratch.checked)setupScratchCard();});}
function boot(){bindEvents();showStart();}
boot();
