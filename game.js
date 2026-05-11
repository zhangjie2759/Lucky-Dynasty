'use strict';

const STORAGE_KEY = 'strongLuckFamilyV6_lifeEvents';
const START_CASH = 100000;
const START_LUCK = 50;
const START_HAPPY = 50;
const MAX_TICKETS_PER_GEN = 3;
const GRAND_THRESHOLD = 1000000;
const MEDAL_HAPPY = 100;

const $ = (id)=>document.getElementById(id);
const fmt = (n)=>'¥'+Math.max(0,Math.floor(n)).toLocaleString('zh-CN');
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const pick = (arr)=>arr[Math.floor(Math.random()*arr.length)];

const NAMES = ['张大发','张金宝','张满仓','张旺财','张来福','张富贵','张锦鲤','张添财','张好运','张万利'];
const TRAITS = [
  {name:'野心家',desc:'总觉得下一张才是真正改命的。'},
  {name:'顾家派',desc:'更容易从家庭型消费中获得幸福。'},
  {name:'消费至上',desc:'中了大奖就该先让自己爽。'},
  {name:'大善人',desc:'帮助别人会获得更多幸福，但容易被索取。'},
  {name:'抠搜圣体',desc:'少花钱也能获得一点幸福。'},
  {name:'赌徒脑',desc:'股票和彩票的诱惑对他特别强。'}
];

const TICKETS = {
  small:{name:'小福票',cost:10000,bonus:0,weights:{2:63,3:28,4:7,5:1.5,6:.4,7:.08,8:.018,9:.002},payouts:{2:8000,3:30000,4:120000,5:600000,6:1800000,7:8000000,8:30000000,9:100000000}},
  luck:{name:'强运票',cost:30000,bonus:12,weights:{2:47,3:32,4:15,5:5,6:1.4,7:.35,8:.12,9:.03},payouts:{2:18000,3:80000,4:500000,5:2000000,6:8000000,7:30000000,8:100000000,9:500000000}},
  rich:{name:'暴富票',cost:80000,bonus:24,weights:{2:36,3:30,4:20,5:8.8,6:3.6,7:1.2,8:.35,9:.05},payouts:{2:30000,3:150000,4:900000,5:5000000,6:20000000,7:80000000,8:300000000,9:1000000000}}
};

const LIFE_CATS = [
  {id:'travel',name:'出行'}, {id:'house',name:'住房'}, {id:'career',name:'创业'}, {id:'kind',name:'善举'}, {id:'simple',name:'简朴'}, {id:'invest',name:'投资'}
];
const LIFE_ITEMS = [
  {id:'bike',cat:'travel',icon:'🚲',name:'自行车',price:1200,happy:6,pressure:-1,keep:.25,tags:['bike','simple'],text:'便宜、健康、没面子，但这一代至少能自由出门。'},
  {id:'ebike',cat:'travel',icon:'🛵',name:'电驴',price:3500,happy:10,pressure:0,keep:.25,tags:['ebike','simple'],text:'小钱买来很大的生活半径，适合没中大奖的一代。'},
  {id:'usedcar',cat:'travel',icon:'🚗',name:'二手车',price:60000,happy:16,pressure:3,keep:.45,tags:['car','usedcar'],text:'车不新，但第一次不用挤公交了。后续可能有维修和借车事件。'},
  {id:'sedan',cat:'travel',icon:'🚘',name:'30万油车轿车',price:300000,happy:30,pressure:7,keep:.52,tags:['car','oilcar'],text:'稳定、体面，油费和保养会跟着来。'},
  {id:'ev',cat:'travel',icon:'🔋',name:'30万电车',price:300000,happy:32,pressure:6,keep:.48,tags:['car','ev'],text:'科技感和低使用成本，但电池衰减会成为未来风险。'},
  {id:'suv',cat:'travel',icon:'🚙',name:'50万SUV',price:500000,happy:42,pressure:9,keep:.5,tags:['car','suv','family'],text:'家庭幸福感很强，也更容易被亲戚朋友借车。'},
  {id:'mpv',cat:'travel',icon:'🚐',name:'80万MPV',price:800000,happy:55,pressure:11,keep:.48,tags:['car','mpv','family'],text:'像真正开始照顾全家，但也会被全家需要。'},
  {id:'pickup',cat:'travel',icon:'🛻',name:'40万皮卡',price:400000,happy:35,pressure:7,keep:.5,tags:['car','pickup','career'],text:'能拉货，能创业，适合务实路线。'},
  {id:'sportscar',cat:'travel',icon:'🏎️',name:'200万跑车',price:2000000,happy:120,pressure:28,keep:.38,tags:['car','sportscar'],text:'消费至上路线的标志。爽，但维修、贬值、剐蹭都会很痛。'},

  {id:'rentupgrade',cat:'house',icon:'🛏️',name:'换个好点的租房',price:30000,happy:16,pressure:1,keep:0,tags:['rent'],text:'没有资产，但这一代睡得舒服很多。'},
  {id:'smallhome',cat:'house',icon:'🏚️',name:'50万县城小房',price:500000,happy:35,pressure:6,keep:.82,tags:['house'],text:'便宜但是真资产，能给后代一个落脚点。'},
  {id:'cityhome',cat:'house',icon:'🏠',name:'150万普通住宅',price:1500000,happy:60,pressure:12,keep:.84,tags:['house'],text:'生活稳定感大幅提高，物业和装修也会找上门。'},
  {id:'bigflat',cat:'house',icon:'🏢',name:'800万大平层',price:8000000,happy:170,pressure:28,keep:.86,tags:['house','luxuryhome'],text:'暴富后的梦想房，但维护成本和房价波动会放大。'},
  {id:'villa',cat:'house',icon:'🏡',name:'5000万独栋别墅',price:50000000,happy:680,pressure:90,keep:.82,tags:['house','villa'],text:'家族传说级住房，所有亲戚都知道你有钱了。'},

  {id:'stall',cat:'career',icon:'🥤',name:'摆摊小生意',price:30000,happy:12,pressure:4,keep:.2,tags:['company','smallbiz'],text:'不用中大奖也能试试创业，赚不赚另说。'},
  {id:'shop',cat:'career',icon:'🏪',name:'小便利店',price:300000,happy:28,pressure:12,keep:.45,tags:['company'],text:'稳定但辛苦，员工、房租和库存都会成为事件。'},
  {id:'restaurant',cat:'career',icon:'🍜',name:'网红餐厅',price:1000000,happy:60,pressure:28,keep:.42,tags:['company','restaurant'],text:'可能火，也可能被房租和差评拖死。'},
  {id:'brand',cat:'career',icon:'🧢',name:'潮流品牌',price:6000000,happy:150,pressure:45,keep:.45,tags:['company','brand'],text:'很适合炫耀，但现金流非常脆弱。'},

  {id:'familymeal',cat:'kind',icon:'🥘',name:'请全家吃顿好的',price:3000,happy:18,pressure:0,keep:0,tags:['kind','family'],text:'不贵，但这一代真的开心过。'},
  {id:'parents',cat:'kind',icon:'🧧',name:'给父母大红包',price:50000,happy:45,pressure:2,keep:0,tags:['kind','family'],text:'幸福和家庭关系大幅提高，也可能让亲友开始期待你更多付出。'},
  {id:'charity',cat:'kind',icon:'❤️',name:'捐助困难家庭',price:100000,happy:70,pressure:3,keep:0,tags:['kind','charity'],text:'大善人路线。名声和幸福提高，但后续可能被更多人求助。'},
  {id:'school',cat:'kind',icon:'🏫',name:'资助乡村小学',price:1000000,happy:260,pressure:10,keep:0,tags:['kind','charity'],text:'花掉很多钱，但这件事会成为家族荣光。'},

  {id:'savecash',cat:'simple',icon:'🥣',name:'继续吃家常饭',price:500,happy:4,pressure:-2,keep:0,tags:['simple'],text:'很抠搜，但压力下降。'},
  {id:'repairhome',cat:'simple',icon:'🔧',name:'修旧家具',price:8000,happy:14,pressure:-1,keep:0,tags:['simple'],text:'没那么体面，却很踏实。'},
  {id:'health',cat:'simple',icon:'🏃',name:'办健身卡',price:5000,happy:18,pressure:-2,keep:0,tags:['simple','health'],text:'幸福不只来自花大钱。'},
  {id:'deposit',cat:'simple',icon:'🏦',name:'存一笔活期备用金',price:50000,happy:8,pressure:-8,keep:.95,tags:['simple','cashsafe'],text:'几乎不爽，但下一代可能感谢你。'},

  {id:'stockconservative',cat:'invest',icon:'📊',name:'股票策略：保守长线',price:30000,happy:6,pressure:3,keep:1,tags:['stock','conservative'],text:'每代波动较小，作为现金放大器。'},
  {id:'stockbalanced',cat:'invest',icon:'📈',name:'股票策略：均衡配置',price:100000,happy:12,pressure:8,keep:1,tags:['stock','balanced'],text:'有机会赚钱，也可能亏。'},
  {id:'stockaggressive',cat:'invest',icon:'🚀',name:'股票策略：激进短线',price:300000,happy:25,pressure:20,keep:1,tags:['stock','aggressive'],text:'前期新手最容易被它教育。'},
  {id:'memeStock',cat:'invest',icon:'🎰',name:'梭哈妖股',price:800000,happy:60,pressure:45,keep:1,tags:['stock','meme'],text:'可能一代翻身，也可能直接把家族送去上班。'}
];

const EVENT_POOL = [
  {type:'bad',tags:['car'],title:'朋友借车',text:'朋友说接亲缺辆车，想借你的车撑场面。',choices:[['借给他',{happy:8,pressure:5,chanceDamage:.45},'关系开心，但可能剐蹭'],['拒绝',{happy:-3,pressure:-2},'保住车，也保住边界']]},
  {type:'bad',tags:['usedcar','car'],title:'变速箱异响',text:'二手车开着开着开始抖，修理厂报价让你沉默。',choices:[['咬牙维修',{cash:-18000,pressure:6},'现金减少'],['先拖着',{happy:-8,pressure:10},'车况继续恶化']]},
  {type:'bad',tags:['ev'],title:'电池衰减',text:'电车续航明显缩水，二手商压价很狠。',choices:[['接受贬值',{assetDrop:.18,pressure:5},'车辆估值下降'],['换新电池',{cash:-45000,happy:6},'现金减少']]},
  {type:'good',tags:['suv','mpv','family'],title:'全家自驾',text:'周末你把一家人塞进车里，去了郊外。车不便宜，但这一刻很值。',choices:[['记住这天',{happy:26,pressure:-3},'幸福提升']]},
  {type:'bad',tags:['house'],title:'装修超支',text:'装修队说水电、柜子、地板都要升级。你发现买房只是开始。',choices:[['继续装好点',{cash:-80000,happy:12,pressure:8},'幸福和压力一起涨'],['能住就行',{happy:-5,pressure:-2},'省钱但遗憾']]},
  {type:'bad',tags:['house'],title:'房价下跌',text:'附近新盘降价，你的房子估值跟着掉。',choices:[['忍住不卖',{assetDrop:.12,pressure:8},'资产估值下降'],['立刻卖掉一套',{forceSell:'house'},'回收现金']]},
  {type:'good',tags:['house'],title:'地段突然火了',text:'新地铁规划公布，家族房产估值上涨。',choices:[['继续持有',{assetRise:.16,happy:10},'资产估值上升']]},
  {type:'bad',tags:['company'],title:'现金流断裂',text:'公司账上钱不够发工资，员工开始慌。',choices:[['注资续命',{cash:-120000,pressure:12},'现金减少'],['裁员止血',{happy:-12,pressure:5},'幸福下降']]},
  {type:'good',tags:['company'],title:'突然爆单',text:'一个短视频把你的生意带火，订单突然暴增。',choices:[['扩张',{cash:160000,pressure:10,happy:12},'赚钱但压力上升'],['稳住',{cash:60000,pressure:-2},'小赚']]},
  {type:'bad',tags:['stock'],title:'高收益群聊',text:'有人拉你进“内部消息群”，群里每天都有人晒收益。',choices:[['跟一把',{stockCrash:.45,pressure:18},'很可能被教育'],['退群',{pressure:-5,luck:2},'少赚也少坑']]},
  {type:'bad',tags:['stock','aggressive','meme'],title:'妖股天地板',text:'早上还在涨停，下午突然跌停，群里没人说话了。',choices:[['认亏',{stockCrash:.55,pressure:24,happy:-20},'股票大跌'],['加仓搏反弹',{stockCrash:.8,luck:8,pressure:35},'极高风险']]},
  {type:'good',tags:['stock'],title:'长线回血',text:'你没乱动，市场自己慢慢修复了一点。',choices:[['继续拿着',{stockRise:.12,happy:8},'股票上涨']]},
  {type:'bad',tags:['kind','charity'],title:'被道德绑架',text:'你做过善事后，越来越多人来找你帮忙。',choices:[['继续帮',{cash:-50000,happy:18,pressure:12},'大善人路线'],['设立边界',{happy:-4,pressure:-8},'压力下降']]},
  {type:'bad',tags:['cashhigh'],title:'家族办公室顾问',text:'一位顾问承诺“低风险年化40%”，办公室很豪华，合同却很模糊。',choices:[['投一笔',{cash:-200000,pressure:18,luck:8},'大概率是教训'],['拒绝',{pressure:-6},'保住现金']]},
  {type:'bad',tags:['cashhigh'],title:'假古董拍卖',text:'有人说你刚好有收藏缘，花几十万就能拿下“潜力传家宝”。',choices:[['买下',{cash:-300000,happy:10,pressure:14},'大概率不值钱'],['不碰',{luck:2},'少一个坑']]},
  {type:'bad',tags:['cashlow'],title:'彩票钱危机',text:'现金快不够买彩票了。你第一次认真思考：资产和现金不是一回事。',choices:[['卖点东西',{pressure:4},'去资产页变卖'],['硬撑',{happy:-8,pressure:10},'压力上升']]},
  {type:'good',tags:['simple'],title:'省钱圣体',text:'你发现低成本生活也有一种安稳幸福。',choices:[['继续朴素',{happy:18,pressure:-8,luck:2},'极致简朴路线']]},
  {type:'good',tags:['any'],title:'平凡的一天',text:'没有暴富，没有暴雷。只是吃了一顿热饭，睡了个好觉。',choices:[['这也不错',{happy:10,pressure:-4},'幸福提升']]}
];

let state, currentTicket=null, currentLifeCat='travel', scratch={isDown:false,ctx:null,canvas:null,rect:null,checked:false,locked:false,pendingPrize:null,lastMeasure:0}, impulseTimer=null;

function makeHeir(){return {name:pick(NAMES),trait:pick(TRAITS),avatar:pick(['🧧','👑','🍀','💰','🎲','🐲','🏮','💎'])};}
function freshState(){const heir=makeHeir();return {generation:1,heir,cash:START_CASH,luck:START_LUCK,happy:START_HAPPY,pressure:10,medals:0,ticketsLeft:MAX_TICKETS_PER_GEN,totalGrandWins:0,assets:[],logs:[`第1代「${heir.name}」拿着10万元走进彩票店。`],lessons:[],activeTab:'lottery',impulseLeft:0};}
function normalize(s){if(!s)return freshState();s.heir=s.heir||makeHeir();s.assets=s.assets||[];s.logs=s.logs||[];s.lessons=s.lessons||[];s.activeTab=s.activeTab||'lottery';return s;}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function load(){try{return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)));}catch(e){return null;}}
function addLog(t){state.logs.unshift(t);state.logs=state.logs.slice(0,28);renderLog();}
function showStart(){$('startScreen').classList.remove('hidden');$('gameScreen').classList.add('hidden');$('endScreen').classList.add('hidden');$('continueBtn').classList.toggle('hidden',!load());}
function showGame(){$('startScreen').classList.add('hidden');$('gameScreen').classList.remove('hidden');$('endScreen').classList.add('hidden');renderAll();switchTab(state.activeTab||'lottery',false);}
function renderAll(){renderStats();renderTickets();renderLifeTabs();renderLifeList();renderAssets();renderProfile();renderLog();renderWorkPanel();save();}
function renderStats(){$('generationText').textContent=state.generation;$('heirNameText').textContent=state.heir.name;$('cashText').textContent=fmt(state.cash);$('luckText').textContent=Math.round(state.luck);$('happyText').textContent=Math.round(state.happy);$('pressureText').textContent=Math.round(state.pressure);$('medalText').textContent=state.medals;$('ticketsLeftText').textContent=state.ticketsLeft;}
function switchTab(tab,doSave=true){const views={lottery:'lotteryView',life:'lifeView',assets:'assetsView',family:'familyView'};if(state.impulseLeft>0&&tab!=='life')tab='life';Object.values(views).forEach(id=>$(id).classList.add('hidden'));$(views[tab]).classList.remove('hidden');document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));state.activeTab=tab;if(doSave)save();if(tab==='lottery'&&currentTicket&&!scratch.checked&&!scratch.ctx)requestAnimationFrame(setupScratchCard);}

function renderTickets(){document.querySelectorAll('.ticket-btn').forEach(btn=>{const t=TICKETS[btn.dataset.type];btn.disabled=state.cash<t.cost||state.ticketsLeft<=0||!!currentTicket||state.impulseLeft>0;});$('nextGenerationBtn').disabled=!!currentTicket||state.impulseLeft>0;$('openLifeBtn').classList.toggle('hidden',state.totalGrandWins<=0&&!state.cash>GRAND_THRESHOLD);}
function randomCode(){let s='';for(let i=0;i<9;i++)s+=Math.floor(Math.random()*10);return s;}function formatCode(c){return c.replace(/(\d{3})(\d{3})(\d{3})/,'$1 $2 $3');}
function chooseTailMatch(ticket){const luck=clamp(state.luck+ticket.bonus-state.pressure*.2,0,120),lf=(luck-50)/70;const entries=Object.entries(ticket.weights).map(([m,w])=>[Number(m),w*clamp(1+lf*(Number(m)-2)*.42,.2,4.2)]);let r=Math.random()*entries.reduce((a,[,w])=>a+w,0);for(const [m,w] of entries){r-=w;if(r<=0)return m;}return 2;}
function makePlayerCode(win,match){if(match>=9)return win;const arr=randomCode().split(''),start=9-match;for(let i=start;i<9;i++)arr[i]=win[i];if(start-1>=0&&arr[start-1]===win[start-1])arr[start-1]=String((Number(win[start-1])+1+Math.floor(Math.random()*9))%10);return arr.join('');}
function startTicket(type){const t=TICKETS[type];if(!t||state.cash<t.cost||state.ticketsLeft<=0||currentTicket)return;state.cash-=t.cost;state.ticketsLeft--;const win=randomCode(),match=chooseTailMatch(t),code=makePlayerCode(win,match),prize=t.payouts[match]||0;currentTicket={type,name:t.name,winningCode:win,playerCode:code,tailMatch:match,prize};$('currentTicketName').textContent=t.name;$('winningCodeText').textContent=formatCode(win);$('playerCodeText').textContent=formatCode(code);$('playerCodeText').classList.remove('matched');$('matchHintText').textContent='刮开后自动验奖';$('ticketChooser').classList.add('hidden');$('scratchArea').classList.remove('hidden');$('checkTicketBtn').disabled=false;scratch.ctx=null;addLog(`买下「${t.name}」，刮开9位强运码。`);renderAll();switchTab('lottery');requestAnimationFrame(setupScratchCard);}
function setupScratchCard(){scratch.canvas=$('scratchCanvas');scratch.ctx=scratch.canvas.getContext('2d',{willReadFrequently:true});scratch.checked=false;scratch.locked=false;scratch.pendingPrize=null;scratch.lastMeasure=0;if(!resizeScratchCanvas()){setTimeout(setupScratchCard,80);return;}paintScratchLayer();}
function resizeScratchCanvas(){const stage=$('scratchStage'),box=stage.getBoundingClientRect();let w=box.width||stage.clientWidth,h=box.height||stage.clientHeight||210;if(!w||w<40)return false;const dpr=Math.max(1,Math.min(devicePixelRatio||1,3));scratch.rect={width:w,height:h};scratch.canvas.width=Math.floor(w*dpr);scratch.canvas.height=Math.floor(h*dpr);scratch.canvas.style.width=w+'px';scratch.canvas.style.height=h+'px';scratch.ctx.setTransform(dpr,0,0,dpr,0,0);return true;}
function paintScratchLayer(){const ctx=scratch.ctx,w=scratch.rect.width,h=scratch.rect.height;ctx.save();ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,w,h);let g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#f6f4ee');g.addColorStop(.25,'#aaa398');g.addColorStop(.55,'#d9d4ca');g.addColorStop(1,'#8f897f');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.globalAlpha=.18;for(let i=0;i<650;i++){ctx.fillStyle=Math.random()>.5?'#fff':'#4f4a43';ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,Math.random()*1.7+.35,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.fillStyle='rgba(36,24,12,.62)';ctx.font='900 20px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('刮开你的9位强运码',w/2,h/2-10);ctx.font='800 13px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif';ctx.fillText('尾号越多，奖金越大',w/2,h/2+22);ctx.restore();}
function scratchAt(cx,cy){if(!currentTicket||scratch.locked||scratch.checked||!scratch.ctx)return;const rect=scratch.canvas.getBoundingClientRect(),x=cx-rect.left,y=cy-rect.top;if(x<-30||y<-30||x>rect.width+30||y>rect.height+30)return;const radius=Math.max(24,Math.min(42,rect.width*.075));scratch.ctx.save();scratch.ctx.globalCompositeOperation='destination-out';scratch.ctx.beginPath();scratch.ctx.arc(x,y,radius,0,Math.PI*2);scratch.ctx.fill();scratch.ctx.restore();const now=performance.now();if(now-scratch.lastMeasure>150){scratch.lastMeasure=now;const p=measureScratchPercent();$('matchHintText').textContent=`已刮开 ${Math.min(99,Math.round(p*100))}%`;if(p>=.62)checkTicket();}}
function measureScratchPercent(){const data=scratch.ctx.getImageData(0,0,scratch.canvas.width,scratch.canvas.height).data;let clear=0,total=0;for(let i=3;i<data.length;i+=80){total++;if(data[i]<90)clear++;}return total?clear/total:0;}function clearScratchLayer(){scratch.ctx.save();scratch.ctx.globalCompositeOperation='destination-out';scratch.ctx.fillRect(0,0,scratch.rect.width,scratch.rect.height);scratch.ctx.restore();}
function checkTicket(){if(!currentTicket||scratch.checked)return;scratch.checked=true;scratch.locked=true;clearScratchLayer();$('checkTicketBtn').disabled=true;$('playerCodeText').classList.add('matched');const m=currentTicket.tailMatch,p=currentTicket.prize,label=m>=9?'9位全中':`尾${m}位相同`;$('matchHintText').textContent=`${label} · ${fmt(p)}`;scratch.pendingPrize={amount:p,match:m};setTimeout(()=>showPrizeChoice(p,m),240);}
function showPrizeChoice(amount,match){const grand=amount>=GRAND_THRESHOLD;$('modalIcon').textContent=grand?'🏆':'🎉';$('modalTitle').textContent=`${match>=9?'9位全中':'尾'+match+'位中奖'}：${fmt(amount)}`;$('modalText').textContent=grand?'这笔钱足够进入暴富冲动时间。兑现拿钱，不兑现保留大运。':'兑现拿小钱，不兑现保留强运搏后面。';$('cashOutBtn').textContent=`兑现 ${fmt(amount)}`;$('keepLuckBtn').textContent=`不兑现，强运+${keepLuckGain(amount,match)}`;$('choiceModal').classList.remove('hidden');}
function cashOutPrize(){const r=scratch.pendingPrize;if(!r)return;state.cash+=r.amount;const loss=clamp(Math.round(r.match*3+r.amount/180000),6,55);state.luck=clamp(state.luck-loss,0,120);addLog(`兑现${fmt(r.amount)}，强运消耗${loss}点。`);const grand=r.amount>=GRAND_THRESHOLD;if(grand){state.totalGrandWins++;startImpulse();}closeChoice();postAction('lottery');if(grand)setTimeout(()=>switchTab('life'),300);}function keepLuckPrize(){const r=scratch.pendingPrize;if(!r)return;const gain=keepLuckGain(r.amount,r.match);state.luck=clamp(state.luck+gain,0,120);addLog(`放弃${fmt(r.amount)}，强运+${gain}。`);closeChoice();postAction('lottery');}function keepLuckGain(a,m){return clamp(Math.round(6+m*2+Math.min(a/1000000,10)),10,32);}function closeChoice(){$('choiceModal').classList.add('hidden');finishTicketWithoutConfirm();renderAll();}
function finishTicket(){if(!currentTicket)return;if(!scratch.checked&&!confirm('这张还没验奖，确定放弃吗？'))return;finishTicketWithoutConfirm();renderAll();}function finishTicketWithoutConfirm(){currentTicket=null;scratch.checked=false;scratch.locked=false;scratch.pendingPrize=null;scratch.ctx=null;$('scratchArea').classList.add('hidden');$('ticketChooser').classList.remove('hidden');}
function startImpulse(){state.impulseLeft=30;addLog('暴富冲动时间开始：30秒内只想消费。');clearInterval(impulseTimer);impulseTimer=setInterval(()=>{state.impulseLeft--;renderImpulse();if(state.impulseLeft<=0){clearInterval(impulseTimer);state.impulseLeft=0;addLog('暴富冲动结束，进入冷静生活。');renderAll();}},1000);renderImpulse();}
function renderImpulse(){$('impulseBar').classList.toggle('hidden',state.impulseLeft<=0);$('impulseText').textContent=state.impulseLeft;document.querySelectorAll('.nav-btn').forEach(b=>{if(state.impulseLeft>0)b.disabled=b.dataset.tab!=='life';else b.disabled=false;});save();}

function renderLifeTabs(){const box=$('lifeTabs');box.innerHTML=LIFE_CATS.map(c=>`<button class="life-tab ${c.id===currentLifeCat?'active':''}" data-life="${c.id}">${c.name}</button>`).join('');box.querySelectorAll('.life-tab').forEach(b=>b.onclick=()=>{currentLifeCat=b.dataset.life;renderLifeTabs();renderLifeList();});renderImpulse();}
function renderLifeList(){const list=$('lifeList');list.innerHTML=LIFE_ITEMS.filter(i=>i.cat===currentLifeCat).map(i=>`<button class="life-item" data-buy="${i.id}" ${state.cash<i.price?'disabled':''}><b>${i.icon} ${i.name}</b><span class="life-price">${fmt(i.price)}</span><div class="life-meta"><i>幸福 +${i.happy}</i><i>压力 ${i.pressure>=0?'+':''}${i.pressure}</i><i>保值 ${Math.round((i.keep||0)*100)}%</i></div><small>${i.text}</small></button>`).join('');list.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buyLife(b.dataset.buy));}
function buyLife(id){const item=LIFE_ITEMS.find(i=>i.id===id);if(!item||state.cash<item.price)return;state.cash-=item.price;state.happy=clamp(state.happy+item.happy,0,9999);state.pressure=clamp(state.pressure+item.pressure,0,9999);if(item.keep>0){state.assets.push({id:Date.now()+Math.random(),baseId:item.id,name:item.name,icon:item.icon,cat:item.cat,tags:item.tags||[],buy:item.price,value:Math.floor(item.price*item.keep),keep:item.keep});}if(item.tags&&item.tags.includes('stock')){state.assets.push({id:Date.now()+Math.random(),baseId:item.id,name:item.name,icon:item.icon,cat:'stock',tags:item.tags,buy:item.price,value:item.price,keep:1});}addLog(`消费：${item.name}，幸福+${item.happy}，压力${item.pressure>=0?'+':''}${item.pressure}。`);renderAll();postAction('buy',item);}

function renderAssets(){const value=assetValue();$('assetSummary').innerHTML=`<div class="summary-box"><span>净资产</span><strong>${fmt(value+state.cash)}</strong></div><div class="summary-box"><span>资产估值</span><strong>${fmt(value)}</strong></div><div class="summary-box"><span>资产数量</span><strong>${state.assets.length}</strong></div>`;$('assetList').innerHTML=state.assets.length?state.assets.map(a=>`<div class="asset-item"><div class="asset-row"><div><b>${a.icon} ${a.name}</b><small>买入 ${fmt(a.buy)} · 当前估值 ${fmt(a.value)} · 标签 ${(a.tags||[]).join('/')}</small></div></div><div class="asset-actions"><button class="sell-btn" data-sell="${a.id}">变卖 ${fmt(a.value*.9)}</button></div></div>`).join(''):'<p>还没有资产。中彩票后先去生活里买点未来。</p>';$('assetList').querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>sellAsset(b.dataset.sell));}
function sellAsset(id){const idx=state.assets.findIndex(a=>String(a.id)===String(id));if(idx<0)return;const a=state.assets[idx];state.cash+=Math.floor(a.value*.9);state.assets.splice(idx,1);state.pressure=clamp(state.pressure+3,0,9999);addLog(`变卖「${a.name}」，换回${fmt(a.value*.9)}。`);renderAll();postAction('sell',a);}
function assetValue(){return state.assets.reduce((s,a)=>s+a.value,0);}function stockValue(){return state.assets.filter(a=>a.cat==='stock').reduce((s,a)=>s+a.value,0);}
function settleAssets(){state.assets.forEach(a=>{let rate=0;if(a.cat==='stock'){if(a.tags.includes('conservative'))rate=rand(-.05,.08);else if(a.tags.includes('balanced'))rate=rand(-.15,.2);else if(a.tags.includes('aggressive'))rate=rand(-.4,.6);else rate=rand(-.9,2);}else if(a.tags.includes('house'))rate=rand(-.1,.16);else if(a.tags.includes('car'))rate=rand(-.18,-.05);else if(a.cat==='career')rate=rand(-.25,.25);else rate=rand(-.08,.08);a.value=Math.max(0,Math.floor(a.value*(1+rate)));});}
function rand(a,b){return Math.random()*(b-a)+a;}

function renderProfile(){const route=state.happy>120?'幸福爆棚':state.pressure>90?'压力爆炸':state.medals>8?'快乐传家':'强运试炼';$('profileCard').innerHTML=`<div class="profile-main"><div class="avatar">${state.heir.avatar}</div><div><h3>${state.heir.name}</h3><p>第${state.generation}代 · ${state.heir.trait.name} · ${route}</p></div></div><p>${state.heir.trait.desc}</p><div class="profile-grid"><div><span>现金</span><strong>${fmt(state.cash)}</strong></div><div><span>资产</span><strong>${fmt(assetValue())}</strong></div><div><span>股票</span><strong>${fmt(stockValue())}</strong></div><div><span>买票机会</span><strong>${state.ticketsLeft}</strong></div></div>`;}
function renderLog(){$('logList').innerHTML=state.logs.map(l=>`<div class="log-item">${l}</div>`).join('');}
function renderWorkPanel(){const broke=state.cash<TICKETS.small.cost&&assetValue()<TICKETS.small.cost;$('workEndPanel').classList.toggle('hidden',!broke);}

function postAction(ctx,item){const risk=eventChance(ctx,item);if(Math.random()>risk)return;const ev=selectEvent(item);showEvent(ev);}
function eventChance(ctx,item){let c=.18;if(state.generation<=3)c+=.28;if(ctx==='buy')c+=.2;if(ctx==='next')c+=.25;if(ctx==='sell')c+=.12;if(item&&item.tags&&item.tags.includes('stock'))c+=.25;if(state.cash>500000)c+=.08;if(state.cash<TICKETS.luck.cost)c+=.18;return clamp(c,0,.82);}
function selectEvent(item){const tags=new Set(['any']);if(item&&item.tags)(item.tags).forEach(t=>tags.add(t));state.assets.forEach(a=>(a.tags||[]).forEach(t=>tags.add(t)));if(state.cash>500000)tags.add('cashhigh');if(state.cash<TICKETS.luck.cost)tags.add('cashlow');let pool=EVENT_POOL.filter(e=>e.tags.some(t=>tags.has(t)));if(!pool.length)pool=EVENT_POOL.filter(e=>e.tags.includes('any'));if(state.generation<=3){const risky=pool.filter(e=>e.type==='bad');if(risky.length&&Math.random()<.72)pool=risky;}return pick(pool);}
function showEvent(ev){$('eventIcon').textContent=ev.type==='bad'?'⚠️':'🍀';$('eventTitle').textContent=ev.title;$('eventText').textContent=ev.text;$('eventChoices').innerHTML=ev.choices.map((c,i)=>`<button class="event-choice" data-event-choice="${i}">${c[0]}<small>${c[2]||''}</small></button>`).join('');$('eventChoices').querySelectorAll('[data-event-choice]').forEach(b=>b.onclick=()=>applyEventChoice(ev,Number(b.dataset.eventChoice)));$('eventModal').classList.remove('hidden');}
function applyEventChoice(ev,i){const [label,effect]=ev.choices[i];applyEffect(effect);$('eventModal').classList.add('hidden');$('eventCard').classList.remove('hidden');$('eventCard').innerHTML=`<h3>${ev.title}</h3><p>选择：${label}</p>`;addLog(`事件「${ev.title}」：${label}。`);renderAll();}
function applyEffect(e={}){if(e.cash)state.cash=Math.max(0,state.cash+e.cash);if(e.happy)state.happy=clamp(state.happy+e.happy,0,9999);if(e.pressure)state.pressure=clamp(state.pressure+e.pressure,0,9999);if(e.luck)state.luck=clamp(state.luck+e.luck,0,120);if(e.assetDrop)state.assets.forEach(a=>{a.value=Math.floor(a.value*(1-e.assetDrop));});if(e.assetRise)state.assets.forEach(a=>{a.value=Math.floor(a.value*(1+e.assetRise));});if(e.stockCrash)state.assets.filter(a=>a.cat==='stock').forEach(a=>a.value=Math.floor(a.value*(1-e.stockCrash)));if(e.stockRise)state.assets.filter(a=>a.cat==='stock').forEach(a=>a.value=Math.floor(a.value*(1+e.stockRise)));if(e.chanceDamage&&Math.random()<e.chanceDamage){const car=state.assets.find(a=>(a.tags||[]).includes('car'));if(car){car.value=Math.floor(car.value*.82);state.pressure+=6;addLog('借车后出现剐蹭，车辆估值下降。');}}if(e.forceSell){const idx=state.assets.findIndex(a=>(a.tags||[]).includes(e.forceSell));if(idx>=0){const a=state.assets[idx];state.cash+=Math.floor(a.value*.85);state.assets.splice(idx,1);}}}

function nextGeneration(){if(currentTicket){switchTab('lottery');return;}if(state.cash<TICKETS.small.cost&&assetValue()<TICKETS.small.cost){renderWorkPanel();switchTab('lottery');return;}const medals=Math.floor(state.happy/MEDAL_HAPPY);if(medals>0){state.medals+=medals;addLog(`本代幸福${Math.round(state.happy)}，兑换${medals}枚快乐勋章。`);}settleAssets();const prev=state.generation,oldCash=state.cash;state.generation++;state.heir=makeHeir();state.ticketsLeft=MAX_TICKETS_PER_GEN;state.happy=clamp(45+state.medals*2-state.pressure*.12,10,120);state.pressure=clamp(state.pressure*.45,0,9999);state.luck=clamp(Math.round(state.luck*.45+18+state.medals*.8),8,115);addLog(`第${prev}代把${fmt(oldCash)}和${state.assets.length}件资产传给第${state.generation}代「${state.heir.name}」。`);renderAll();switchTab('lottery');postAction('next');}
function endGame(){const score=state.medals*1000000+assetValue()+state.cash+state.generation*100000;const grade=score>100000000?'强运神话':score>30000000?'豪门余梦':score>5000000?'小富之家':'普通家庭';$('gameScreen').classList.add('hidden');$('endScreen').classList.remove('hidden');$('endingTitle').textContent='结束强运世代，去上班';$('endingText').textContent=`第${state.generation}代买不起彩票了。家族评级：「${grade}」。最大的悲剧不是破产，是恢复正常上班。`;$('endingStats').innerHTML=`<div><span>延续世代</span><strong>${state.generation}</strong></div><div><span>最终现金</span><strong>${fmt(state.cash)}</strong></div><div><span>资产估值</span><strong>${fmt(assetValue())}</strong></div><div><span>快乐勋章</span><strong>${state.medals}</strong></div>`;localStorage.removeItem(STORAGE_KEY);}

function getPoint(e){if(e.touches&&e.touches.length)return{x:e.touches[0].clientX,y:e.touches[0].clientY};if(e.changedTouches&&e.changedTouches.length)return{x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};return{x:e.clientX,y:e.clientY};}
function bindScratchInput(){const canvas=$('scratchCanvas'),start=e=>{if(!currentTicket||scratch.locked||scratch.checked)return;e.preventDefault();scratch.isDown=true;if(e.pointerId!==undefined&&canvas.setPointerCapture){try{canvas.setPointerCapture(e.pointerId);}catch(_){}}const p=getPoint(e);scratchAt(p.x,p.y);},move=e=>{if(!scratch.isDown)return;e.preventDefault();const p=getPoint(e);scratchAt(p.x,p.y);},end=e=>{if(scratch.isDown&&e)e.preventDefault();scratch.isDown=false;};if('PointerEvent'in window){['pointerdown'].forEach(ev=>canvas.addEventListener(ev,start,{passive:false}));['pointermove'].forEach(ev=>canvas.addEventListener(ev,move,{passive:false}));['pointerup','pointercancel','pointerleave'].forEach(ev=>canvas.addEventListener(ev,end,{passive:false}));}else{canvas.addEventListener('touchstart',start,{passive:false});canvas.addEventListener('touchmove',move,{passive:false});canvas.addEventListener('touchend',end,{passive:false});canvas.addEventListener('mousedown',start,{passive:false});window.addEventListener('mousemove',move,{passive:false});window.addEventListener('mouseup',end,{passive:false});}}
function bindEvents(){$('startBtn').onclick=()=>{state=freshState();save();showGame();};$('continueBtn').onclick=()=>{state=load()||freshState();showGame();};$('resetBtn').onclick=()=>{if(!confirm('确定重开这个家族吗？'))return;localStorage.removeItem(STORAGE_KEY);currentTicket=null;state=freshState();showGame();};$('playAgainBtn').onclick=()=>{state=freshState();save();showGame();};document.querySelectorAll('.ticket-btn').forEach(b=>b.onclick=()=>startTicket(b.dataset.type));document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));$('finishTicketBtn').onclick=finishTicket;$('checkTicketBtn').onclick=checkTicket;$('cashOutBtn').onclick=cashOutPrize;$('keepLuckBtn').onclick=keepLuckPrize;$('nextGenerationBtn').onclick=nextGeneration;$('openLifeBtn').onclick=()=>switchTab('life');$('goWorkBtn').onclick=endGame;bindScratchInput();window.addEventListener('resize',()=>{if(currentTicket&&state.activeTab==='lottery'&&!scratch.checked)setupScratchCard();});}
function boot(){bindEvents();showStart();}
boot();
