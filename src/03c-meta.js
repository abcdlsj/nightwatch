
/* ================= 局外与构筑深度：成就 / 长夜难度 / 加码 / 羁绊 / 连杀 =================
 * 成就和长夜进度存在 chain-meta-v1，跟单局存档分开，删档不丢。
 * 长夜：每在当前最高难度守到黎明一次，解锁下一档，效果逐档叠加（共 8 档）。
 * 加码：备战走完三站后，可以给今晚加一条难度换奖励（最后一夜没有）。
 * 羁绊：棋盘上同元素的卡凑到 2 / 4 / 6 张，全队拿到额外加成。
 */
const METAK='chain-meta-v1';
function loadMeta(){const d={ach:{},heatMax:0,heatSel:0,wins:0,runs:0,sets:{}};try{return Object.assign(d,JSON.parse(localStorage.getItem(METAK)||'{}'));}catch(e){return d;}}
const META=loadMeta();
function saveMeta(){try{localStorage.setItem(METAK,JSON.stringify(META));}catch(e){}}
function freshRun(){return{maxBoard:0,wallLost:0,maxHit:0,kills:0,wagers:0,maxCombo:0,got:[]};}

/* ---- 成就 ---- */
const ACH=[
  {id:'dawn',n:'第一缕光',d:'第一次守到黎明',w:1},
  {id:'solo',n:'孤灯',d:'每一夜棋盘上都只放一张卡，守到黎明',w:1,ok:R=>R.maxBoard<=1},
  {id:'fullwall',n:'完璧',d:'守到黎明时城墙是满的',w:1,ok:()=>G.wall>=G.wallMax},
  {id:'norelic',n:'两手空空',d:'一件遗物都不拿，守到黎明',w:1,ok:()=>!G.relics.length},
  {id:'notalent',n:'无师自通',d:'一个天赋都不学，守到黎明（夜谈可以选“不学”）',w:1,ok:()=>!G.skills.length},
  {id:'nobrick',n:'一砖未掉',d:'整整八夜，城墙一点都没掉',w:1,ok:R=>R.wallLost<=0},
  {id:'h_ayla',n:'老兵不死',d:'用艾拉守到黎明',w:1,ok:()=>G.hero==='ayla'},
  {id:'h_mo',n:'点亮太阳',d:'用墨守到黎明',w:1,ok:()=>G.hero==='mo'},
  {id:'h_ying',n:'灯火不熄',d:'用萤守到黎明',w:1,ok:()=>G.hero==='ying'},
  {id:'frost',n:'破冰',d:'在「霜潮」里守到黎明',w:1,ok:()=>G.foeSet==='frost'},
  {id:'bothsets',n:'见多识广',d:'两套敌人都打穿过',w:1,ok:()=>META.sets.dark&&META.sets.frost},
  {id:'pure',n:'一条道走到黑',d:'最后一夜棋盘上至少4张卡、全是同一个元素，守到黎明',w:1,ok:R=>R.lastPure},
  {id:'smalls',n:'蚂蚁搬家',d:'最后一夜棋盘上全是小型卡（至少5张），守到黎明',w:1,ok:R=>R.lastSmall},
  {id:'giants',n:'大块头',d:'最后一夜棋盘上全是大型卡，守到黎明',w:1,ok:R=>R.lastBig},
  {id:'gambler',n:'赌徒',d:'一局里加码至少4次，还守到了黎明',w:1,ok:R=>R.wagers>=4},
  {id:'heat1',n:'更长的夜',d:'在长夜1或更高守到黎明',w:1,ok:()=>G.heat>=1},
  {id:'heat4',n:'不见天日',d:'在长夜4或更高守到黎明',w:1,ok:()=>G.heat>=4},
  {id:'heat8',n:'长夜尽头',d:'在长夜8守到黎明',w:1,ok:()=>G.heat>=8},
  {id:'chain8',n:'一环扣一环',d:'连锁打到 ×8'},
  {id:'chain11',n:'到顶了',d:'连锁打到 ×11'},
  {id:'hit1k',n:'一锤定音',d:'单次伤害打到 1000'},
  {id:'hit10k',n:'数字爆炸',d:'单次伤害打到 10000'},
  {id:'combo50',n:'割草',d:'一口气连杀 50 个'},
  {id:'combo120',n:'杀穿',d:'一口气连杀 120 个'},
  {id:'kills150',n:'尸山',d:'一夜杀够 150 个'},
  {id:'dia',n:'钻石恒久远',d:'合出一张钻品质的卡'},
  {id:'dia3',n:'满目璀璨',d:'棋盘上同时摆着3张钻卡开战'},
  {id:'syn4',n:'成了气候',d:'任意羁绊凑到 4 层'},
  {id:'syn6',n:'清一色',d:'任意羁绊凑到 6 层'},
  {id:'rich',n:'守财奴',d:'手里同时攒着 50 金'},
  {id:'quickeye',n:'速战速决',d:'深渊之眼出场 25 秒内打倒它'}
];
const ACHM=Object.fromEntries(ACH.map(a=>[a.id,a]));
function unlock(id){if(META.ach[id]||!ACHM[id])return;META.ach[id]=Date.now();saveMeta();if(G.run)G.run.got.push(id);achPop(ACHM[id]);}
function achPop(a){const n=document.querySelectorAll('.achpop').length;const el=document.createElement('div');el.className='achpop';el.style.top=(10+n*54)+'px';
  el.innerHTML=`<small>成就解锁</small><b>${a.n}</b><span>${a.d}</span>`;document.body.appendChild(el);SFX.play('merge');setTimeout(()=>el.remove(),3200);}
function achCount(){return ACH.filter(a=>META.ach[a.id]).length;}
/* 守到黎明时结算：记录进度、解锁下一档长夜、检查需要通关的成就 */
function runWon(){const R=G.run||freshRun();META.wins++;META.sets[G.foeSet]=1;
  if(G.heat>=META.heatMax&&META.heatMax<8){META.heatMax=G.heat+1;META.heatSel=META.heatMax;R.newHeat=META.heatMax;}
  saveMeta();for(const a of ACH)if(a.w&&(!a.ok||a.ok(R)))unlock(a.id);}
function openAch(){SFX.play('ui');const sh=$('#sheet');sh.classList.add('top');
  sh.innerHTML=`<div class="sh" role="dialog" aria-label="成就"><h3>成就 <small class="spn">${achCount()} / ${ACH.length}</small></h3>
    <p class="muted2">守到黎明 ${META.wins} 次 · 长夜最高解锁到 ${META.heatMax}</p>
    <div class="tlist">${ACH.map(a=>{const got=META.ach[a.id];return `<div class="trow ach${got?' got':''}" style="--gc:${got?'#ffd166':'#56656b'}"><div><b>${got?'★ ':'☆ '}${a.n}</b><span>${a.d}</span></div></div>`;}).join('')}</div>
    <div class="sh-btns"><button class="btn" id="aClose">关闭</button></div></div>`;
  sh.hidden=false;$('#aClose').onclick=closeSheet;sh.onclick=e=>{if(e.target===sh)closeSheet();};}

/* ---- 长夜（难度进阶），逐档叠加 ---- */
const HEATS=['正常难度','敌人血量 +15%','精英和首领血量再 +25%','商店里的卡都贵 1 金','城墙上限 -15%','每一波敌人多 15%','每夜工钱少 1 金','敌人移速 +10%','夜谈只给两个选项'];
const heat=n=>(G.heat||0)>=n;
function heatHtml(){const h=META.heatSel;return h?HEATS.slice(1,h+1).map((t,i)=>`<i>${i+1}</i> ${t}`).join('<br>'):HEATS[0];}
function heatBar(){if(!META.heatMax)return '';
  return `<div class="heatsel"><button class="btn sm" id="hMinus" aria-label="降低难度">‹</button><div><b>长夜 ${META.heatSel}</b><small id="heatD">${heatHtml()}</small></div><button class="btn sm" id="hPlus" aria-label="提高难度">›</button></div>`;}
function bindHeat(){const f=d=>{META.heatSel=clamp(META.heatSel+d,0,META.heatMax);saveMeta();SFX.play('ui');const b=document.querySelector('.heatsel b');b.textContent='长夜 '+META.heatSel;$('#heatD').innerHTML=heatHtml();};
  if($('#hMinus')){$('#hMinus').onclick=e=>{e.stopPropagation();f(-1);};$('#hPlus').onclick=e=>{e.stopPropagation();f(1);};}}

/* ---- 加码：给今晚加难度，换奖励 ---- */
const WAGERS={
  horde:{n:'蜂拥',d:'敌人多三成',r:'守住 +6 金',gold:6},
  iron:{n:'铁皮',d:'敌人血量 +30%',r:'守住白拿一件遗物',relic:1},
  rush:{n:'急行军',d:'敌人移速 +20%',r:'守住随机一张卡升一档',up:1},
  brittle:{n:'危墙',d:'城墙挨打多掉一半',r:'守住 +5 金，墙补 5',gold:5,heal:5},
  dark:{n:'熄灯',d:'开战后所有卡愣 2.5 秒',r:'守住 +4 金',gold:4}
};
const wg=k=>B&&B.wager===k;
function rollWagers(){return shuffled(Object.keys(WAGERS)).slice(0,2);}
function wagerHtml(){const P=G.prep;if(G.round>=G.maxRound)return '';if(!P.wagers)P.wagers=rollWagers();
  return `<div class="wagers"><div class="wg-t">加码？</div>${P.wagers.map(k=>{const W=WAGERS[k];
    return `<button class="wg${P.wager===k?' on':''}" data-w="${k}"><b>${W.n}</b><span>${W.d}</span><em>${W.r}</em></button>`;}).join('')}</div>`;}
function bindWagers(){document.querySelectorAll('.wg').forEach(b=>b.onclick=()=>{SFX.ensure();const k=b.dataset.w;G.prep.wager=G.prep.wager===k?null:k;SFX.play(G.prep.wager?'intent':'ui');
  document.querySelectorAll('.wg').forEach(x=>x.classList.toggle('on',x.dataset.w===G.prep.wager));});}
/* 胜利结算：返回战报里要加的行 */
function wagerPay(){const W=WAGERS[B.wager];if(!W)return[];G.run.wagers++;const rows=[];const lb='加码·'+W.n;
  if(W.gold)rows.push([lb,W.gold]);
  if(W.heal){G.wall=Math.min(G.wallMax,G.wall+W.heal);rows.push(['加码·补墙',0,0,'墙 +'+W.heal]);}
  if(W.relic){const r=rollGear(1,1)[0];if(r){gainRelic(r,true);rows.push([lb,0,0,RELICS[r].n]);}}
  if(W.up){const c=pick(G.cards.filter(c=>c.loc==='board'&&c.tier<2));if(c){c.tier++;repaint(c);rows.push([lb,0,0,ITEMS[c.key].n+' → '+TIERS[c.tier].n]);}else rows.push([lb,3]);}
  return rows;}
function hordeWave(w){const add=w.filter(s=>!EN[s.type].boss&&!EN[s.type].elite&&!d0(s.type)&&Math.random()<.3).map(s=>Object.assign({},s,{t:s.t+rnd(.3,1.2),x:clamp(s.x+rnd(-.08,.08),.05,.95)}));
  const out=w.concat(add).sort((a,b)=>a.t-b.t);out.surges=w.surges;return out;}

/* ---- 羁绊：同元素凑张数 ---- */
Object.assign(MODL,{'tag_毒':['【毒】卡伤害',1]});
const SYN={
  '刃':[[2,{crit:.08}],[4,{crit:.12,critDmg:.5}],[6,{'tag_刃':.4}]],
  '火':[[2,{burn:.3}],[4,{burn:.5,aoe:.25}],[6,{'tag_火':.4}]],
  '冰':[[2,{slow:.15}],[4,{slowVuln:.3}],[6,{'tag_冰':.4}]],
  '电':[[2,{chain:1}],[4,{chain:1,'tag_电':.2}],[6,{'tag_电':.4}]],
  '机':[[2,{'tag_机':.15}],[4,{startCharge:.2}],[6,{spd:.15}]],
  '毒':[[2,{poison:.3}],[4,{poison:.6}],[6,{'tag_毒':.5}]]
};
function synCount(){const n={};for(const c of G.cards)if(c.loc==='board'){const t=ITEMS[c.key].tag;if(SYN[t])n[t]=(n[t]||0)+1;}return n;}
function synLevel(t,n){return SYN[t].filter(s=>n>=s[0]).length;}
function synMods(){const n=synCount(),out={};for(const t in n)for(const[need,m]of SYN[t])if(n[t]>=need)for(const k in m)out[k]=(out[k]||0)+m[k];return out;}
function plainMods(m){return Object.keys(m).map(k=>{const[l,p]=MODL[k];return l+' +'+(p?Math.round(m[k]*100)+'%':m[k]);}).join('，');}
let synPrev=null;
function renderSyn(){const el=$('#pvSyn');const n=synCount();
  if(G.phase==='prep'&&synPrev){for(const t in n){const a=synLevel(t,n[t]),b=synLevel(t,synPrev[t]||0);if(a>b){const s=SYN[t][a-1];toast('【'+t+'】羁绊 '+s[0]+' 层：'+plainMods(s[1]));SFX.play('merge');break;}}}
  synPrev=n;if(!el)return;
  const ts=Object.keys(n).sort((a,b)=>n[b]-n[a]);
  el.innerHTML=ts.length?'<span class="sy-l">羁绊</span>'+ts.map(t=>{const lv=synLevel(t,n[t]);const nx=SYN[t][lv];
    return `<span class="sy${lv?' on':''}" style="--tagc:${TAGC[t]}">${t}<b>${n[t]}</b>${nx?'<small>/'+nx[0]+'</small>':''}</span>`;}).join(''):'';}
function openSyn(){SFX.play('ui');const sh=$('#sheet');const n=synCount();
  sh.innerHTML=`<div class="sh" role="dialog" aria-label="羁绊"><h3>羁绊</h3><p class="muted2">棋盘上同元素的卡凑够张数，全队都吃加成，层数叠加。</p>
    <div class="tlist">${Object.keys(SYN).map(t=>`<div class="trow" style="--gc:${TAGC[t]}"><div><b>【${t}】 现在 ${n[t]||0} 张</b>${SYN[t].map(([k,m])=>`<span style="opacity:${(n[t]||0)>=k?1:.45}">${k} 张：${plainMods(m)}</span>`).join('')}</div></div>`).join('')}</div>
    <div class="sh-btns"><button class="btn" id="yClose">关闭</button></div></div>`;
  sh.hidden=false;$('#yClose').onclick=closeSheet;sh.onclick=e=>{if(e.target===sh)closeSheet();};}

/* ---- 开战时记下这一夜的阵容（成就用） ---- */
function noteLineup(){const R=G.run;if(!R)return;const bc=boardCards();R.maxBoard=Math.max(R.maxBoard,bc.length);
  const tags=new Set(bc.map(c=>ITEMS[c.key].tag));R.lastPure=bc.length>=4&&tags.size===1;
  R.lastSmall=bc.length>=5&&bc.every(c=>c.size===1);R.lastBig=bc.length>=1&&bc.every(c=>c.size===3);
  if(bc.filter(c=>c.tier>=3).length>=3)unlock('dia3');
  const n=synCount();for(const t in n){if(n[t]>=4)unlock('syn4');if(n[t]>=6)unlock('syn6');}}

/* ---- 连杀：1 秒内接着杀就续上，每 25 连杀掉 1 金 ---- */
function comboKill(e){const c=B.combo=(B.t-(B.lastKill==null?-9:B.lastKill)<1)?(B.combo||0)+1:1;B.lastKill=B.t;
  if(c>B.maxCombo)B.maxCombo=c;if(c>=50)unlock('combo50');if(c>=120)unlock('combo120');
  if(c>=5){const el=$('#combo');const cols=['#ffffff','#ffe79a','#ffb37a','#ff7a5a','#ff5a8a'];el.style.setProperty('--kc',cols[Math.min(4,Math.floor(c/15))]);
    el.innerHTML='连杀 <b>'+c+'</b>';restart(el,'show');}
  if(c%25===0){G.gold++;const[cx,cy]=toClient(ex(e),ey(e));FX.coins(cx,cy,1);SFX.play('coin');updateHUD();banner(c>=75?'杀疯了':c>=50?'屠戮':'割草','#ffb37a');}}
$('#pvSyn').onclick=()=>{SFX.ensure();openSyn();};
