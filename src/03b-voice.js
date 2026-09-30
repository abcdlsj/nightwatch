
/* ================= 战斗内叙事：台词气泡 / 战报字幕 / 新敌人卡片 =================
 * 全部是纯表现层：不读写战斗数值，不暂停模拟，不接收点击（pointer-events:none）。
 */
const VO={q:[],until:0,last:0,timer:null};
function voiceOf(who){
  if(who==='hero'){const H=HEROES[G.hero];return{n:H.n,img:SPR[H.portrait].url,c:H.col};}
  if(VOICES[who]){const v=VOICES[who];return{n:v.n,img:(SPR[v.img]||SPR.lantern).url,c:v.c};}
  if(EN[who]){const d=EN[who];return{n:d.n,img:SPR[d.spr].url,c:d.col||'#ff8a80'};}
  return{n:'',img:SPR.lantern.url,c:'#fff'};
}
function pickLine(t){if(t==null)return'';if(Array.isArray(t))return pick(t);if(typeof t==='object')return pickLine(t[G.hero]);return t;}
/* pri: 3=剧情/首领（必播，可插队） 2=新敌人/重要事件 1=随机反应（空闲时才播） */
function say(who,text,pri){
  const t=pickLine(text);if(!t)return;pri=pri||1;const now=performance.now();
  if(pri===1&&(now-VO.last<5500||VO.q.length||now<VO.until))return;
  VO.q.push({who,t,pri});VO.q.sort((a,b)=>b.pri-a.pri);if(VO.q.length>5)VO.q.length=5;
  pumpVO();
}
function pumpVO(){
  const now=performance.now();if(now<VO.until){clearTimeout(VO.timer);VO.timer=setTimeout(pumpVO,VO.until-now+40);return;}
  const it=VO.q.shift();if(!it)return;
  const dur=Math.min(5200,Math.max(2000,900+it.t.length*85));
  const el=$('#bark');
  if(it.who==='narr'){el.className='bark sub';el.innerHTML=`<p>${it.t}</p>`;}
  else{const w=voiceOf(it.who);el.className='bark';el.style.setProperty('--vc',w.c);
    el.innerHTML=`<img src="${w.img}" alt=""><div><b>${w.n}</b><p>${it.t}</p></div>`;
    if(it.who!=='hero'&&EN[it.who])el.classList.add('foe');}
  el.style.setProperty('--dur',dur+'ms');restart(el,'show');
  VO.until=now+dur+250;VO.last=now;clearTimeout(VO.timer);VO.timer=setTimeout(pumpVO,dur+290);
}
function clearVO(){VO.q.length=0;VO.until=0;clearTimeout(VO.timer);const el=$('#bark');el.className='bark';}

/* 图鉴：记录见过的敌人（跨局保存，为以后的图鉴/地图系统预留） */
function bestiary(){try{return JSON.parse(localStorage.getItem('chain-bestiary')||'{}');}catch(e){return{};}}
function markSeen(type){try{const b=bestiary();b[type]=(b[type]||0)+1;localStorage.setItem('chain-bestiary',JSON.stringify(b));}catch(e){}}
/* 本局第一次遇到某种敌人：右上角弹出介绍卡 + 守军喊话 */
function meetFoe(type){
  const d=EN[type];if(!d||!d.tip)return;G.seenFoes=G.seenFoes||{};if(G.seenFoes[type])return;G.seenFoes[type]=1;
  const firstEver=!bestiary()[type];markSeen(type);
  const el=$('#foeCard');el.style.setProperty('--fc',d.col||'#ff8a80');
  const bb=$('#bossbar');el.style.top=(bb&&!bb.hidden?bb.offsetHeight+16:8)+'px';
  el.innerHTML=`<img src="${SPR[d.spr].url}" alt=""><div><small>${firstEver?'头回见':'又来了'}${d.faction?' · '+d.faction:''}</small><b>${d.n}</b><p>${d.tip}</p></div>`;
  restart(el,'show');
  if(d.intro)say(d.intro[0],d.intro[1],2);
}
