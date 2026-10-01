
/* ================= 图鉴 / 过往守夜 =================
 * 图鉴四页：卡牌、遗物、天赋、敌人。拿到过的卡记最高品质，遗物和天赋拿到过才亮，敌人见过才亮、另记打倒多少个。
 * 卡牌全都能翻（选人页要靠它看专属卡），没拿到过的灰着；遗物、天赋、敌人没碰到过的显示成问号。
 * 过往守夜：每局结束记一条（最多留 40 条），守到黎明后接着守的，算同一局，结束时更新那一条。
 * 都存在 chain-meta-v1 的 cx / hist 里，删单局存档不丢。
 */
if(!META.cx)META.cx={c:{},r:{},t:{},k:{}};
if(!META.hist)META.hist=[];
const HIST_MAX=40;
/* 敌人击杀先攒在内存里，结算时一起存，免得每杀一个都写一次 */
let cxKills={};
function codexKill(type){cxKills[type]=(cxKills[type]||0)+1;}
function codexSweep(){const X=META.cx;
  for(const c of G.cards)if(ITEMS[c.key])X.c[c.key]=Math.max(X.c[c.key]==null?-1:X.c[c.key],c.tier);
  for(const r of G.relics)X.r[r]=1;
  for(const t of G.skills)X.t[t]=1;
  for(const k in cxKills)X.k[k]=(X.k[k]||0)+cxKills[k];cxKills={};
  saveMeta();}
function foeSeen(k){return !!(bestiary()[k]||META.cx.k[k]);}

/* ---------- 过往守夜：记一局 ---------- */
function recordRun(win){codexSweep();const R=G.run||freshRun();const endl=!!G.endless;
  const by=B&&B.wallBy?Object.keys(B.wallBy).sort((a,b)=>B.wallBy[b]-B.wallBy[a])[0]:null;
  const board=G.cards.filter(c=>c.loc==='board').sort((a,b)=>a.idx-b.idx).map(c=>[c.key,c.tier,c.adj||0]);
  const best=G.cards.slice().sort((a,b)=>(b.bDmg||0)-(a.bDmg||0))[0];
  const old=endl&&R.hid?META.hist.find(h=>h.id===R.hid):null;
  const e={id:old?old.id:Date.now(),t:Date.now(),h:G.hero,w:win||endl?1:0,r:endl?8:Math.min(G.round,8),en:endl?Math.max(0,G.round-9):0,
    heat:G.heat||0,set:G.foeSet||'dark',boss:G.boss8||'eye',k:R.kills||0,cb:R.maxCombo||0,ch:G.bestChain||1,
    bd:board,best:best&&best.bDmg?[best.key,best.tier,best.adj||0]:null,rl:G.relics.slice(),sk:G.skills.slice(),
    ach:(old?old.ach:[]).concat(R.got||[]),by:win||endl?null:by,gold:G.gold};
  if(old)Object.assign(old,e);else{META.hist.unshift(e);if(META.hist.length>HIST_MAX)META.hist.length=HIST_MAX;}
  if(win&&G.run)G.run.hid=e.id;
  saveMeta();}

function hDate(t){const d=new Date(t),p=n=>String(n).padStart(2,'0');return `${d.getMonth()+1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;}
function hResult(h){return h.en?`黎明后又守 ${h.en} 夜`:h.w?'守到黎明':`倒在第 ${h.r} 夜`;}
function sheetOpen(html){const sh=$('#sheet');sh.classList.add('top');sh.innerHTML=html;sh.hidden=false;sh.onclick=e=>{if(e.target===sh)closeSheet();};return sh;}
function miniCard(el,k,tier,adj){const ce=document.createElement('div');paintCard(ce,{key:k,tier:tier,adj:adj||null,size:ITEMS[k].size,dl:0,hoard:0},'static');el.appendChild(ce);return ce;}

function openHistory(){SFX.play('ui');const H=META.hist;
  const per=Object.keys(HEROES).map(k=>{const hs=H.filter(h=>h.h===k);if(!hs.length)return '';
    const w=hs.filter(h=>h.w).length,top=hs.reduce((a,h)=>h.en>a.en||(h.en===a.en&&h.r>a.r)?h:a,hs[0]);
    return `<div><span>${HEROES[k].n}</span><i style="margin-left:auto">${hs.length} 局 · 守住 ${w} · 最好 ${top.en?'黎明+'+top.en:top.w?'黎明':'第'+top.r+'夜'}</i></div>`;}).join('');
  const sh=sheetOpen(`<div class="sh cdx-sh" role="dialog" aria-label="过往守夜"><h3>过往守夜 <small class="spn">${H.length} 局</small></h3>
    <p class="muted2">一共守过 ${META.runs||0} 次，守到黎明 ${META.wins||0} 次${META.endBest?'，黎明后最多又撑了 '+META.endBest+' 夜':''}。</p>
    ${per?`<div class="rules res hs-sum">${per}</div>`:''}
    <div class="tlist hs-list">${H.length?H.map((h,i)=>{const He=HEROES[h.h]||{n:'?',col:'#888'};
      return `<button class="trow relrow hs-row${h.w?' win':''}" data-i="${i}" style="--gc:${h.w?'#ffd166':'#ff8a80'}">
        <img class="ricon" src="${HEROES[h.h]?SPR[He.portrait].url:''}" alt=""><div><b>${hResult(h)}<small class="gt">${He.n}</small></b>
        <span class="hs-sub">${hDate(h.t)} · ${(FOESETS[h.set]||FOESETS.dark).n}${h.heat?' · 长夜 '+h.heat:''} · 杀 ${h.k}</span>
        <span class="hs-cards">${h.bd.map(c=>ITEMS[c[0]]?`<img src="${SPR[c[0]].url}" alt="" style="--tc:${TIERS[c[1]].c}">`:'').join('')}</span></div></button>`;}).join('')
      :'<p class="muted2">还没有记录。</p>'}</div>
    <div class="sh-btns"><button class="btn" id="hsClose">关闭</button></div></div>`);
  $('#hsClose').onclick=closeSheet;
  sh.querySelectorAll('.hs-row').forEach(b=>b.onclick=()=>openRunDetail(+b.dataset.i));}

function openRunDetail(i){SFX.play('ui');const h=META.hist[i];if(!h)return openHistory();const He=HEROES[h.h];
  const rows=[['日子',hDate(h.t)],['结果',hResult(h)],['敌人',(FOESETS[h.set]||FOESETS.dark).n+(h.w&&EN[h.boss]?' · 首领 '+EN[h.boss].n:'')]];
  if(h.heat)rows.push(['难度','长夜 '+h.heat]);
  rows.push(['最高连锁','×'+h.ch],['杀敌 / 最长连杀',h.k+' / '+h.cb]);
  if(h.by&&EN[h.by])rows.push(['漏过去最多的',EN[h.by].n]);
  if(h.best&&ITEMS[h.best[0]])rows.push(['王牌',(h.best[2]&&ADJ[h.best[2]]?ADJ[h.best[2]].n+'的':'')+ITEMS[h.best[0]].n+' · '+TIERS[h.best[1]].n]);
  const rl={};h.rl.forEach(r=>{if(RELICS[r])rl[r]=(rl[r]||0)+1;});
  const sh=sheetOpen(`<div class="sh cdx-sh" role="dialog" aria-label="这一局"><div class="sh-top">${He?`<img class="ricon big" src="${SPR[He.portrait].url}" alt="" style="--gc:${He.col}">`:''}
    <div><h3 style="color:${h.w?'#ffe79a':'#ff8a80'}">${hResult(h)}</h3><div class="tags"><span class="tag">${He?He.n+' · '+He.title:'?'}</span></div></div></div>
    <div class="rules res">${rows.map(r=>`<div><span>${r[0]}</span><i style="margin-left:auto">${r[1]}</i></div>`).join('')}</div>
    <div class="hs-h">最后的棋盘</div><div class="cdx hs-board"></div>
    <div class="hs-h">遗物 ${h.rl.length} 件</div>${h.rl.length?`<div class="hs-rel">${Object.keys(rl).map(r=>`<span style="--gc:${GT[RELICS[r].t].c}"><img src="${icon(RELICS[r].ico).url}" alt="">${RELICS[r].n}${rl[r]>1?' ×'+rl[r]:''}</span>`).join('')}</div>`:'<p class="muted2">一件没拿。</p>'}
    <div class="hs-h">天赋 ${h.sk.length} 个</div>${h.sk.length?`<div class="hs-rel">${h.sk.filter(t=>TALENTS[t]).map(t=>`<span style="--gc:${TCAT[TALENTS[t].cat].c}">${TALENTS[t].n}</span>`).join('')}</div>`:'<p class="muted2">一个没学。</p>'}
    ${h.ach.length?`<div class="hs-h">这局解锁的成就</div><div class="hs-rel">${h.ach.filter(a=>ACHM[a]).map(a=>`<span style="--gc:#ffd166">★ ${ACHM[a].n}</span>`).join('')}</div>`:''}
    <div class="sh-btns"><button class="btn" id="hsBack">返回</button><button class="btn" id="hsClose">关闭</button></div></div>`);
  const bd=sh.querySelector('.hs-board');
  for(const c of h.bd)if(ITEMS[c[0]]){const b=document.createElement('div');b.className='cdx-i';miniCard(b,c[0],c[1],c[2]);b.insertAdjacentHTML('beforeend',`<span>${ITEMS[c[0]].n}</span>`);bd.appendChild(b);}
  if(!h.bd.length)bd.outerHTML='<p class="muted2">棋盘是空的。</p>';
  $('#hsBack').onclick=openHistory;$('#hsClose').onclick=closeSheet;}

/* ---------- 图鉴 ---------- */
const CX_TABS=[['card','卡牌'],['relic','遗物'],['talent','天赋'],['foe','敌人']];
function cxHead(tab,got,all){return `<h3>图鉴 <small class="spn">${got} / ${all}</small></h3>
  <div class="cdx-tabs cx-main">${CX_TABS.map(([k,n])=>`<button class="btn sm${k===tab?' on':''}" data-m="${k}">${n}</button>`).join('')}</div>`;}
function cxBind(sh){sh.querySelectorAll('.cx-main .btn').forEach(b=>b.onclick=()=>openCodex(b.dataset.m));
  $('#cdxClose').onclick=closeSheet;}
const cxLock='<b class="cx-q">？？？</b>';
/* 以前的调用：openCodex() 卡牌通用页，openCodex(人物key) 卡牌专属页 */
function openCodex(tab,sub){if(HEROES[tab]||tab==='all'){sub=tab;tab='card';}tab=tab||'card';
  ({card:cxCards,relic:cxRelics,talent:cxTalents,foe:cxFoes})[tab](sub);}

function cxCards(sub){SFX.play('ui');sub=sub||'all';const X=META.cx.c;
  const tabs=[['all','通用'],...Object.keys(HEROES).map(k=>[k,HEROES[k].n+'专属'])];
  const pool=Object.keys(ITEMS).filter(k=>!ITEMS[k].noPool);
  const keys=pool.filter(k=>sub==='all'?!ITEMS[k].hero:ITEMS[k].hero===sub).sort((a,b)=>ITEMS[a].t-ITEMS[b].t||ITEMS[a].size-ITEMS[b].size);
  const got=keys.filter(k=>X[k]!=null).length;
  const sh=sheetOpen(`<div class="sh cdx-sh" role="dialog" aria-label="卡牌图鉴">${cxHead('card',pool.filter(k=>X[k]!=null).length,pool.length)}
    <div class="cdx-tabs">${tabs.map(([k,n])=>`<button class="btn sm${k===sub?' on':''}" data-t="${k}">${n}</button>`).join('')}</div>
    <p class="muted2">${sub==='all'?'':'只有选'+HEROES[sub].n+'才会出现在店里。'}拿到过 ${got} / ${keys.length}。卡面是拿到过的最高品质。</p>
    <div class="cdx"></div><div class="sh-btns"><button class="btn" id="cdxClose">关闭</button></div></div>`);
  const grid=sh.querySelector('.cdx');
  for(const k of keys){const b=document.createElement('button');b.className='cdx-i'+(X[k]==null?' lock':'');const tier=X[k]==null?ITEMS[k].t:X[k];
    miniCard(b,k,tier);b.insertAdjacentHTML('beforeend',`<span>${ITEMS[k].n}</span>`);
    b.onclick=()=>{openSheet({kind:'codex',offer:{card:{key:k,tier:tier,adj:null,size:ITEMS[k].size,dl:0,hoard:0},sold:true,price:0}});
      const bt=$('#shBtns');if(bt){const r=document.createElement('button');r.className='btn';r.textContent='返回图鉴';r.onclick=()=>cxCards(sub);bt.prepend(r);}};
    grid.appendChild(b);}
  sh.querySelectorAll('.cdx-tabs:not(.cx-main) .btn').forEach(b=>b.onclick=()=>cxCards(b.dataset.t));cxBind(sh);}

function cxGroups(obj,keys){const g=[['',keys.filter(k=>!obj[k].hero)]];for(const h in HEROES)g.push([HEROES[h].n+'专属',keys.filter(k=>obj[k].hero===h)]);return g.filter(x=>x[1].length);}
function cxRelics(){SFX.play('ui');const X=META.cx.r;
  const keys=Object.keys(RELICS).filter(k=>RELICS[k].m&&GT[RELICS[k].t]).sort((a,b)=>RELICS[a].t-RELICS[b].t);
  const sh=sheetOpen(`<div class="sh cdx-sh" role="dialog" aria-label="遗物图鉴">${cxHead('relic',keys.filter(k=>X[k]).length,keys.length)}
    <div class="tlist">${cxGroups(RELICS,keys).map(([n,ks])=>(n?`<div class="hs-h">${n}</div>`:'')+ks.map(r=>{const R0=RELICS[r],c=GT[R0.t].c,ok=X[r];
      return `<div class="trow${ok?'':' cx-lock'}" style="--gc:${c}"><img class="ricon" src="${icon(R0.ico).url}" alt=""><div>${ok?`<b>${R0.n}<small class="gt">${GT[R0.t].n}</small></b><div class="mods">${modText(R0.m)}</div>${R0.f?`<em>${R0.f}</em>`:''}`:`${cxLock}<small class="gt">${GT[R0.t].n}</small>`}</div></div>`;}).join('')).join('')}</div>
    <div class="sh-btns"><button class="btn" id="cdxClose">关闭</button></div></div>`);cxBind(sh);}

function cxTalents(){SFX.play('ui');const X=META.cx.t;
  const keys=Object.keys(TALENTS).sort((a,b)=>TALENTS[a].r-TALENTS[b].r);
  const sh=sheetOpen(`<div class="sh cdx-sh" role="dialog" aria-label="天赋图鉴">${cxHead('talent',keys.filter(k=>X[k]).length,keys.length)}
    <p class="muted2">夜谈、过路人、残破的手札都能学。</p>
    <div class="tlist">${cxGroups(TALENTS,keys).map(([n,ks])=>(n?`<div class="hs-h">${n}</div>`:'')+ks.map(id=>{const T=TALENTS[id],C=TCAT[T.cat]||TCAT.atk,ok=X[id];
      return `<div class="trow${ok?'':' cx-lock'}" style="--gc:${C.c}"><img class="ricon" src="${icon(C.ico).url}" alt=""><div>${ok?`<b>${T.n}<small class="gt">${C.n}</small></b><div class="mods">${talentText(id)}</div>${T.say?`<em>“${T.say}”</em>`:''}`:`${cxLock}<small class="gt">${C.n}</small>`}</div></div>`;}).join('')).join('')}</div>
    <div class="sh-btns"><button class="btn" id="cdxClose">关闭</button></div></div>`);cxBind(sh);}

function foeGroup(k){const d=EN[k];return d.boss?3:d.elite?2:d.faction===FACTIONS.frost?1:0;}
const FOE_G=['亡者与深渊','霜潮','精英','首领'];
function cxFoes(){SFX.play('ui');
  const keys=Object.keys(EN).filter(k=>SPR[EN[k].spr]);const got=keys.filter(foeSeen).length;
  const sh=sheetOpen(`<div class="sh cdx-sh" role="dialog" aria-label="敌人图鉴">${cxHead('foe',got,keys.length)}
    <div class="cx-foes">${FOE_G.map((n,g)=>{const ks=keys.filter(k=>foeGroup(k)===g);return ks.length?`<div class="hs-h">${n} <small>${ks.filter(foeSeen).length} / ${ks.length}</small></div><div class="cdx">${ks.map(k=>{const ok=foeSeen(k);
      return `<button class="cdx-i cx-foe${ok?'':' lock'}" data-k="${k}"${ok?'':' disabled'}><img src="${SPR[EN[k].spr].url}" alt=""><span>${ok?EN[k].n:'？？？'}</span></button>`;}).join('')}</div>`:'';}).join('')}</div>
    <div class="sh-btns"><button class="btn" id="cdxClose">关闭</button></div></div>`);
  sh.querySelectorAll('.cx-foe:not(.lock)').forEach(b=>b.onclick=()=>cxFoe(b.dataset.k));cxBind(sh);}

function cxFoe(k){SFX.play('ui');const d=EN[k];const seen=bestiary()[k]||0,kl=META.cx.k[k]||0;
  const rows=[['血量',d.hp],['撞墙',d.wall>=99?'直接破城':d.wall]];if(d.armor)rows.push(['护甲',d.armor]);
  rows.push(['见过 / 打倒',`${seen?seen+' 局':'—'} / ${kl} 个`]);
  const sh=sheetOpen(`<div class="sh" role="dialog" aria-label="${d.n}"><div class="sh-top"><img class="ricon big cx-big" src="${SPR[d.spr].url}" alt="" style="--gc:${d.col||'#888'}">
    <div><h3 style="color:${d.col||'#fff'}">${d.n}</h3><div class="tags"><span class="tag">${FOE_G[foeGroup(k)]}</span>${d.faction&&foeGroup(k)>1?`<span class="tag">${d.faction}</span>`:''}</div></div></div>
    ${d.tip?`<p>${d.tip}</p>`:`<p class="muted2">${d.small?'别的东西碎开蹦出来的小家伙。':'普通小怪，靠数量压上来。'}</p>`}
    <div class="rules res">${rows.map(r=>`<div><span>${r[0]}</span><i style="margin-left:auto">${r[1]}</i></div>`).join('')}</div>
    ${d.intents?`<div class="hs-h">招式</div><div class="tlist">${d.intents.map(it=>`<div class="trow" style="--gc:${d.col||'#888'}"><div><b>${it.n}</b><span>${it.d}</span></div></div>`).join('')}</div>`:''}
    ${d.intro&&typeof d.intro[1]==='string'?`<p class="flav"><em>“${d.intro[1]}”</em></p>`:''}
    <div class="sh-btns"><button class="btn" id="cxBack">返回图鉴</button><button class="btn" id="cdxClose">关闭</button></div></div>`);
  $('#cxBack').onclick=()=>cxFoes();$('#cdxClose').onclick=closeSheet;}
