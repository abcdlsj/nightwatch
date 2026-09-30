
/* ================= 第二轮玩法：起手三选一 / 商店锁卡 / 拦路精英 / 霜潮专属敌人 / 深渊母巢 / 无尽长夜 =================
 * 起手：选完人以后从三套起手里挑一套（每人四套，随机给三套）。
 * 锁卡：商店里点卡下面的锁，这张卡会跟着你到下一家店，直到买下或者解锁。一次只能锁一张。
 * 拦路：备战时偶尔碰到的一站，打一小场精英战，赢了挑一件好遗物外加金币；漏过去的怪照样砸墙。
 * 霜潮专属：冰鸦（过半场俯冲）、冰壳蟹（前几下打在壳上）、冰晶法师（远处冻卡）。只在霜潮出现。
 * 首领：第八夜随机是深渊之眼或深渊母巢，开局就定好，存档里记着。
 * 无尽：守到黎明后可以接着打，怪物血量继续涨，每隔几夜来一个精英，每四夜一个首领。
 */
(function injectCss(){const st=document.createElement('style');st.textContent=`
.cat-fight{--cc:#ff7a5c}.door.cat-fight{box-shadow:0 4px 0 rgba(0,0,0,.5),inset 5px 0 0 var(--cc),0 0 12px rgba(255,122,92,.35)}
.offer .lockb{position:absolute;top:4px;right:4px;width:26px;height:26px;border:0;border-radius:8px;background:rgba(0,0,0,.35);color:#9fb3ba;font-size:14px;line-height:26px;padding:0;cursor:pointer}
.offer .lockb.on{background:#ffd166;color:#1a1c2c}
.offer.locked{box-shadow:inset 0 0 0 2px #ffd166}
.kits{display:flex;flex-direction:column;gap:10px;width:100%;max-width:380px}
.kit{display:flex;align-items:center;gap:12px;text-align:left;color:#fff;border:0;border-radius:13px;padding:10px 12px;background:var(--panel2);box-shadow:0 4px 0 rgba(0,0,0,.5),inset 5px 0 0 var(--hc);cursor:pointer}
.kit .kc{display:flex;gap:4px;flex:none}.kit .kc img{width:40px;height:40px;image-rendering:pixelated;background:rgba(0,0,0,.28);border-radius:8px;padding:3px}
.kit b{display:block;font-size:17px}.kit span{display:block;font-size:12px;color:#c5d2d6;line-height:1.4}
.amb{display:flex;gap:12px;align-items:center;background:var(--panel2);border-radius:12px;padding:10px 12px}
.amb img{width:64px;height:64px;image-rendering:pixelated;flex:none;background:rgba(0,0,0,.3);border-radius:10px;padding:4px}
.amb b{font-size:18px;color:#ff9e7a}.amb p{margin:4px 0 0;font-size:12px;line-height:1.45;color:#c5d2d6}
`;document.head.appendChild(st);})();

/* ---------- 起手三选一 ---------- */
const KITS={
  ayla:[
    {n:'誓约',d:'一把飞刀，一把立过誓的长剑。老规矩。',cards:[['dagger',0],['oathsword',1]]},
    {n:'火油',d:'烬刃、火油瓶、烙铁，三张小卡一起烧。',cards:[['emberblade',1],['oilflask',0],['brand',0]]},
    {n:'重标枪',d:'标枪手配弹药匠，旁边一把飞刀补刀。',cards:[['javelin',1],['armorer',1],['dagger',1]]},
    {n:'老兵',d:'老兵之刃越砍越狠，集结令给它充能。',cards:[['dagger',0],['vetblade',1],['rally',1]],gold:-3}
  ],
  mo:[
    {n:'冷热',d:'炼金瓶加冰锥。钱多，先去逛店。',cards:[['vial',0],['icicle',0]]},
    {n:'毒',d:'毒针叠层，强酸瓶让它们多挨一点。',cards:[['needle',1],['acidvial',0]]},
    {n:'雷',d:'电弧瓶加学徒雷杖，雷杖弹够一百次会换新的。',cards:[['arcbottle',0],['appwand',0]],gold:-4},
    {n:'冰封',d:'冷凝瓶冻住一个，旁边的炼金瓶下一下就更疼。',cards:[['frostvial',0],['condenser',0],['vial',0]]}
  ],
  ying:[
    {n:'萤火',d:'萤灯加发条，师父教的第一课。',cards:[['firefly',0],['clock',1]]},
    {n:'纸鸢',d:'纸鸢带着火星往前飞，泼灯油的专挑烧着的打。',cards:[['oilspill',0],['paperkite',1]]},
    {n:'纸灯',d:'纸灯越多越亮，百盏灯每守一夜长一点。',cards:[['paperlamp',1],['lamps',0]]},
    {n:'齿轮',d:'飞齿轮配上弦钥匙，转得飞快。',cards:[['gear',1],['windup',1]],gold:-3}
  ]
};
function pickKit(done){
  const H=HEROES[G.hero];const all=KITS[G.hero]||[{n:'默认',d:'',cards:H.start.map(s=>[s[0],s[1]])}];
  const list=[all[0],...shuffled(all.slice(1))].slice(0,3);
  const sc=$('#screen');BG.set('title');
  sc.innerHTML=`<div class="scr"><img class="por-big" src="${SPR[H.portrait].url}" alt=""><h1 style="font-size:28px">带什么上墙</h1><div class="logo-sub">${H.n} · ${H.title}</div>
  <div class="kits">${list.map((k,i)=>`<button class="kit" data-i="${i}" style="--hc:${H.col}"><div class="kc">${k.cards.map(c=>`<img src="${SPR[c[0]].url}" alt="${ITEMS[c[0]].n}">`).join('')}</div>
  <div><b>${k.n}</b><span>${k.cards.map(c=>ITEMS[c[0]].n+(c[1]>ITEMS[c[0]].t?'（'+TIERS[c[1]].n+'）':'')).join(' · ')}${k.gold?`　开局金币 ${k.gold>0?'+':''}${k.gold}`:''}</span><span>${k.d}</span></div></button>`).join('')}</div></div>`;
  sc.hidden=false;
  sc.querySelectorAll('.kit').forEach(b=>b.onclick=()=>{SFX.ensure();SFX.play('merge');const k=list[+b.dataset.i];
    let i=3;for(const[key,t]of k.cards){const c=newCard(key,t);c.loc='board';c.idx=i;i+=c.size;G.cards.push(c);}
    if(k.gold)G.gold=Math.max(0,G.gold+k.gold);sc.hidden=true;done();});
}

/* ---------- 商店锁卡 ---------- */
function lockBtn(o,of,cur){
  if(!cur||cur.mode!=='shop'||of.sold)return;
  const b=document.createElement('button');b.className='lockb'+(of.locked?' on':'');b.textContent=of.locked?'锁':'留';b.title='锁住：下一家店还卖它';
  b.onclick=e=>{e.stopPropagation();SFX.ensure();SFX.play('ui');
    if(of.locked){of.locked=false;G.lock=null;}
    else{for(const x of cur.offers)x.locked=false;of.locked=true;G.lock={card:Object.assign({},of.card),price:of.price};tipOnce('lock','锁住的卡会出现在下一家店里，价钱不变，直到你买下或者解锁。一次只能锁一张。',200);}
    renderPrep();};
  o.appendChild(b);if(of.locked)o.classList.add('locked');
}
function lockedOffers(offers){if(!G.lock)return offers;const L=G.lock;offers[0]={card:Object.assign({},L.card),price:L.price,sold:false,locked:true};return offers;}

/* 新敌人的像素图（冰鸦、冰壳蟹、冰晶法师 16×16，深渊母巢 32×32） */
addSprites({
f_crow:[
"................",
"Ck............kC",
"kCCk........kCCk",
"kcCCk......kCCck",
".kccCk....kCcck.",
".kbccCkkkkCccbk.",
"..kbccbbbbccbk..",
"..kdbcbbbbcbdk..",
"...kdbbbbbbdk...",
"....kbwbbwbk....",
"....kdbbbbdk....",
".....kkYYkk.....",
"......kYYk......",
".......kk.......",
"................",
"................"],
f_shell:[
"................",
"................",
".......kk.......",
".....kkwwkk.....",
"....kCwCCwCk....",
"...kCwCCCCwCk...",
"kk.kcCCccCCck.kk",
"kCkkcCcCCcCckkCk",
"kckdbccbbccbdkck",
".kkkdbbddbbdkkk.",
"..kbkkkkkkkkbk..",
"..kbwkbbbbkwbk..",
"...kbbbbbbbbk...",
"..kbkdbkkbdkbk..",
"..kk.kk..kk.kk..",
"................"],
f_mage:[
"............kk..",
"......kk...kCCk.",
".....kCCk..kCwk.",
"....kCwCck..kCk.",
"...kCCcccbk.knk.",
"..kCcbkkkbbkknk.",
"..kcbkCkCkbkknk.",
"..kcbkkkkkbkgnk.",
".kcbbbkkkbbcggk.",
".kcbbcbbbbcbknk.",
".kbbcbbbbbcbknk.",
"kbbcbbbbbbbcbknk",
"kdbcbbbbbbbcdknk",
"kddbbbbbbbbddknk",
".kkkkkkkkkkkk.k.",
"................"],
brood:[
"................................",
"................................",
"............kkkkkkkk............",
".........kkkppppppppkkk.........",
".......kkPPPPPPPPPPppppkk.......",
"......kPPPPPPPPPPPPPPppppk......",
".....kPPPPPPPPPPPPPPPPppppk.....",
"....kPPPPPPPPPPPPPPPPPPppppk....",
"...kpPPPPPPPPPPPPYYPPPPpppppk...",
"...kGwGGPPPPPYYPPoRPPPPPppppk...",
"..kpGGGGPPPPPoRPPPPPYYllGppppk..",
"..kpPPPPPPPPPPPPPPPPoRllGGpppk..",
"..kpPPPPPPPPPPPPPPPPGllGGGpppk..",
"..kppPwlGGPPPeeeeeePPGGGGppppk..",
"..kppGlllGGPewkwkwkwPPPppppppk..",
"..kppGGlGGGekkkkkkkkePpppppppk..",
"..kpppGGGGPPekkkkkkePppppppaak..",
"..kppppppPPPPewewewpppppGGaaak..",
"...kpppppppppppppGlGGpplwGGak...",
"...kpppppplGppppplwlGppGGGGak...",
"....kpppplwGGppppGlGGpaaGGak....",
".....kpppGGGGppppGGGGaaaaak.....",
".....kspppGGpppaaaaaaaaaadsk....",
"...kkksddppppaaaaaaaaaadddskkk..",
"..ksdsdddkkkaaaaaaaakkkkdddsdsk.",
"..ksdddddk..kkkkkkkk...kdddddsk.",
".ksdddkkk...............kkkdddsk",
".kddddk...................kddddk",
"kddkkk.....................kkkdd",
"kddk.........................kdd",
".kk...........................kk",
"................................"]
});
/* ---------- 精英（拦路和无尽夜用） ---------- */
Object.assign(EN,{
  a_brute:{n:'屠夫',hp:420,spd:.03,armor:2,wall:8,spr:'berserker',sc:2,elite:1,col:'#e43b44',rage:1.2,faction:FACTIONS.war,tip:'血越少冲得越快，还会吼着让身边的怪一起跑。',
    intents:[{n:'狂吼',d:'身边的怪一起冲 3 秒',t:6,a:'roar'},{n:'冲锋',d:'2秒内移动速度×3',t:9,a:'dash'}]},
  a_golem:{n:'山岩巨像',hp:520,spd:.022,armor:6,wall:10,spr:'golem',sc:1.4,elite:1,col:'#c28a4d',faction:FACTIONS.war,tip:'护甲很厚，时不时跺脚把你一张卡震住。',
    intents:[{n:'硬化',d:'4秒内护甲 +10',t:7,a:'harden'},{n:'震地',d:'震住你随机1张卡，持续2秒',t:9,a:'quake'}]},
  a_lich:{n:'白骨主教',hp:320,spd:.025,armor:0,wall:8,spr:'necro',sc:2,elite:1,col:'#b77cff',raise:3,faction:FACTIONS.cult,tip:'身边倒下的怪会被它拉起来，自己还会召骷髅。',
    intents:[{n:'召亡',d:'召唤4个骷髅兵',t:7,a:'skels'},{n:'骨盾',d:'获得相当于15%最大生命的护盾',t:8,a:'shield'}]}
});
Object.assign(EN,{
  fa_brute:Object.assign({},EN.a_brute,{n:'霜狼王',spr:'f_wolf',col:'#94b0c2',faction:FACTIONS.frost,chill:2}),
  fa_golem:Object.assign({},EN.a_golem,{n:'老雪人',spr:'f_yeti',col:'#f4f4f4',faction:FACTIONS.frost}),
  fa_lich:Object.assign({},EN.a_lich,{n:'冰棺主祭',spr:'f_priest',col:'#73eff7',raiseAs:'f_husk',faction:FACTIONS.frost})
});
Object.assign(FOESETS.frost.map,{a_brute:'fa_brute',a_golem:'fa_golem',a_lich:'fa_lich'});
const ELITES=['a_brute','a_golem','a_lich'];
Object.assign(FOEB,{
  a_brute:{spawn:'墙后面有肉。我闻得到。',intent:{roar:'跑起来！都给我跑起来！',dash:'让开！'},die:'……还没吃饱……'},
  a_golem:{spawn:'（石头磨着石头的声音）',intent:{harden:'（它身上的裂缝合上了）',quake:'（地面猛地一跳）'},die:'（碎成一地的石块）'},
  a_lich:{spawn:'墙外躺着的人，比墙里站着的多。',intent:{skels:'起来，替我走完这段路。',shield:'骨头也能挡刀。'},die:'我会……再站起来的……'},
  fa_brute:{spawn:'（狼王仰头长嚎，雪地里到处是回声）',intent:{roar:'（嚎叫声一声比一声近）',dash:'（它压低身子扑了过来）'},die:'（嚎叫声断了）'},
  fa_golem:{spawn:'（一个比城门还高的雪人，脸上插着两根冰柱）',intent:{harden:'（新的一层冰裹上来）',quake:'（它一跺脚，墙头的雪全掉了）'},die:'（化成一滩雪水）'},
  fa_lich:{spawn:'北边的冷，是老师给你们的礼物。',intent:{skels:'冻住的人，也还能走。',shield:'冰棺比盾结实。'},die:'老师……冷……'}
});

/* ---------- 霜潮专属敌人 ---------- */
Object.assign(EN,{
  f_crow:{n:'冰鸦',hp:8,spd:.045,armor:0,wall:2,spr:'f_crow',sc:1,col:'#c2f4ff',dive:3.6,faction:FACTIONS.frost,tip:'先在高处慢慢盘旋，过了半场就一头扎下来。别让它们过半场。',intro:['soldier','乌鸦……冰做的乌鸦！它们要扑下来了！']},
  f_shell:{n:'冰壳蟹',hp:36,spd:.034,armor:0,wall:2,spr:'f_shell',sc:1,col:'#73eff7',shell:3,faction:FACTIONS.frost,tip:'背着冰壳，前 3 下打在壳上不掉血。出手快的卡专治它，灼烧和中毒不吃壳。',intro:['soldier','砍不动！那层壳砍不动！']},
  f_mage:{n:'冰晶法师',hp:30,spd:.035,armor:0,wall:2,spr:'f_mage',sc:1,col:'#41a6f6',stopAt:.28,fbolt:5,faction:FACTIONS.frost,tip:'停在远处，每 5 秒冻住你一张卡 1.5 秒。射程够的卡先打它。',intro:['soldier','远处那个在念咒——我的手冻住了！']}
});
function frostExtra(r,pack){if(G.foeSet!=='frost')return;
  if(r>=3)pack({f_crow:2},1,6,18);
  if(r>=5)pack({f_shell:1},1,8,20);
  if(r>=6)pack({f_mage:1},1,6,20);}
function frostBolt(e){const bc=boardCards().filter(c=>c.frozen<=0);if(!bc.length)return;const c=pick(bc);
  const fr=F.cv.getBoundingClientRect();const r=c.el.getBoundingClientRect();
  bolt([[ex(e),ey(e)-6],[(r.left+r.width/2-fr.left)/F.s,F.H]],'#c2f4ff',.25,true);SFX.play('intent');
  c.frozen=1.5;c.el.classList.add('frozen');tipOnce('frozen','「'+ITEMS[c.key].n+'」被冻住了，过一会儿自己会化开。');}

/* ---------- 第二个首领：深渊母巢 ---------- */
EN.brood={n:'深渊母巢',hp:11000,spd:.011,armor:2,wall:99,spr:'brood',sc:1,boss:1,fixed:1,col:'#7ddc5f',faction:FACTIONS.abyss,
  intents:[{n:'产卵',d:'生出4只裂殖虫',t:6,a:'brood'},{n:'酸雾',d:'你所有卡的充能清掉一半',t:9,a:'drain'},{n:'蜕壳',d:'获得相当于12%最大生命的护盾',t:8,a:'molt'}]};
FOEB.brood={spawn:'墙？我见过很多墙。墙里面，总是软的。',
  intent:{brood:'孩子们，饿了吧。',drain:'你们的火，太吵了。',molt:'旧壳给你们，新壳留给我。'},
  low:{ayla:'骑士、萨满、石头……都是我生的。你杀掉的，全是我的孩子。',mo:'学院的冷库里，有一颗卵。是谁把它带出来的，你猜？',ying:'灯匠。你师父来过我这里，他身上的灯油，很好吃。'},
  heroLow:{ayla:'那就把你连窝端了。',mo:'原来那颗卵还活着。这次我亲手做完实验。',ying:'把他的灯还给我！'},
  die:'（整座母巢缩成一团，不再动了）'};
const NIGHT8_BROOD={title:'第八夜 · 深渊母巢',beats:[
  [1,'narr','北方的裂缝里爬出一座会动的山。它每走一步，身上就掉下几只虫。'],
  [4,'hero',{ayla:'原来这些年的东西，都是从这里爬出来的。',mo:'一个巢。深渊不是眼睛，是一个巢。',ying:'好大……可它也怕光，对吧？'}],
  [20,'bellman','虫子上墙了！拿火把，拿开水，什么都行！'],
  [40,'soldier','它的壳裂了！里面是软的！']]};
function bossNight(r){return r===8&&G.boss8==='brood';}

/* ---------- 敌人行为（精英招式和霜潮） ---------- */
function extraIntent(e,a){
  if(a==='roar'){const R=40*K();for(const o of B.en)if(!o.dead&&o!==e&&Math.hypot(ex(o)-ex(e),ey(o)-ey(e))<=R){o.dashT=Math.max(o.dashT||0,3);}ring(ex(e),ey(e)-6,4,R,'#e43b44',.5);}
  if(a==='quake'){const bc=boardCards().filter(c=>c.frozen<=0);if(bc.length){const c=pick(bc);c.frozen=2;c.el.classList.add('frozen');}F.shake=Math.max(F.shake,6);}
  if(a==='skels'){for(let i=0;i<4;i++){const s=spawn(foeKey('skel'),clamp(e.x+(i-1.5)*.08,.05,.95),Math.max(-.02,e.y-.03));s.x0=s.x;}}
  if(a==='brood'){for(let i=0;i<4;i++){const s=spawn(foeKey('bug'),clamp(e.x+rnd(-.22,.22),.05,.95),Math.max(-.02,e.y+.02));s.x0=s.x;}}
  if(a==='drain'){for(const c of boardCards()){c.charge*=.5;if(c.el)restart(c.el,'shake');}toast('酸雾漫上墙头，卡的充能掉了一半');}
  if(a==='molt'){e.shield+=e.maxHp*.12;}
}

/* ---------- 拦路 ---------- */
EVENTS.ambush={n:'拦路',ico:'berserker',cat:'fight',w:.75,minR:2,d:'一个大家伙堵在路上。打赢挑一件好遗物；漏过去的怪砸墙减半，让它撞上墙就算输',f:'绕路要多走半夜。',
  need:()=>G.round!==4&&(G.round<8||G.endless)&&!(G.prep&&G.prep.fought)};
function enterAmbush(cur){const k=foeKey(pick(ELITES));Object.assign(cur,{mode:'ambush',foe:k});}
function ambushHtml(cur){const d=EN[cur.foe];
  return `<div class="amb"><img src="${SPR[d.spr].url}" alt=""><div><b>${d.n}</b><p>${d.tip}</p><p>${d.intents.map(t=>'【'+t.n+'】'+t.d).join('<br>')}</p></div></div>
  <div class="ev-hint">带着几只小怪。守住了拿 ${ambushGold()} 金，再从三件好遗物里挑一件</div>`;}
function ambushGold(){return 3+Math.floor(G.round/2);}
function ambushWave(k){const S=[{type:k,t:1.2,x:.5,y:-.04}];
  for(const s of G.nextWave){if(s.t>9)break;const d=EN[s.type];if(d.boss||d.elite||d.cargo)continue;S.push({type:s.type,t:s.t+2.5,x:s.x,y:s.y});}
  S.sort((a,b)=>a.t-b.t);S.surges=[];return S;}
function startAmbush(cur){if(!boardCards().length){toast('棋盘上一张卡都没有');SFX.play('bad');return;}G.prep.fought=true;G.fightWave=ambushWave(cur.foe);startBattle();}
function ambushEnd(){
  G.phase='prep';if(G.run){G.run.kills+=B.kills;G.run.maxHit=Math.max(G.run.maxHit,B.maxHit);G.run.maxCombo=Math.max(G.run.maxCombo,B.maxCombo);}
  G.bestChain=Math.max(G.bestChain,B.maxChain);SFX.play('win');
  for(const c of G.cards){c.charge=0;c.el.style.setProperty('--s',0);c.el.classList.remove('frozen','empty','haste');c.ammo=maxAmmo(c);setAmmo(c);}
  G.fightWave=null;B.over=true;clearVO();BG.set('shop');$('#bossbar').hidden=true;F.cv.style.display='none';$('#prep').hidden=false;
}
function ambushWin(){ambushEnd();
  const cur=G.prep.cur;G.gold+=ambushGold();
  relicChoice(cur,'赢了，拿 '+ambushGold()+' 金。战利品里挑一件',withFit(rollGear(3,3)));
  renderOwned();renderPrep();updateHUD();banner('守住了','#ffe79a');
}

/* 拦路打输了不算输掉整局：精英撞上墙或者墙快塌了就算输，墙最少留 1，这一站白走。拦路时墙只吃一半伤害 */
function ambushLose(){B.over=true;G.wall=Math.max(1,G.wall);ambushEnd();SFX.play('lose');const cur=G.prep.cur;
  Object.assign(cur,{mode:'reward',text:'被它冲过去了。<br><small>'+(G.wall<=1?'墙只剩一口气，':'')+'这一站白走了</small>',apply:()=>{}});
  renderPrep();updateHUD();banner('没拦住','#ff8a80');}

/* ---------- 无尽长夜 ---------- */
function endlessWave(r,pack,boss){
  const k=r-8;
  pack({skel:3,necro:1},2,0,22);pack({golem:1,shaman:1,shieldb:1},2,6,24);pack({berserker:2,drummer:1},3,2,26);
  pack({ghost:3},2,8,24);pack({bat:5,bomber:2},3,4,28);pack({slime:6,mimic:1},2,0,20);pack({siege:1},1+Math.floor(k/2),6,20);pack({catapult:2},1,3,3);
  if(k%4===0)boss(pick(['eye','brood']),1);else if(k%2===1)boss(pick(ELITES),10);
  pack({skel:4,berserker:2,shieldb:1},1,26,26);
}
function continueEndless(){
  G.endless=true;G.maxRound=999;G.round=9;if(G.run){G.run.got=[];G.run.newHeat=0;}
  const sc=$('#screen');sc.hidden=true;G.gold+=5;G.wall=Math.max(G.wall,Math.ceil(G.wallMax*.5));
  toPrep();toast('天亮了，可北边还在往外爬。接着守');
}
function endlessNote(){if(!G.endless)return '';const n=Math.max(0,G.round-9);
  return `<div class="newheat">黎明之后又守了 <b>${n}</b> 夜${META.endBest?`　最多一次 ${META.endBest} 夜`:''}</div>`;}
function endlessLost(){const n=Math.max(0,G.round-9);if(n>(META.endBest||0)){META.endBest=n;saveMeta();}if(n>=2)unlock('end2');if(n>=5)unlock('end5');}
ACH.push({id:'end2',n:'天亮了还不走',d:'黎明之后接着守，又撑过 2 夜'},{id:'end5',n:'守夜没有尽头',d:'黎明之后接着守，又撑过 5 夜'},{id:'brood',n:'捣毁巢穴',d:'打倒深渊母巢',w:1,ok:()=>G.boss8==='brood'});
for(const a of ACH)ACHM[a.id]=a;
