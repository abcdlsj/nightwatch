
/* ================= 波次 ================= */
function makeWave(r){
  const S=[];
  const pack=(comp,n,t0,t1)=>{const DN=(1.15+.1*r)*(heat(5)?1.15:1);n=Math.round(n*DN);comp=Object.fromEntries(Object.entries(comp).map(([k,v])=>[k,EN[k].aura||d0(k)?v:Math.round(v*(r>=5?1.45:r>=3?1.3:1.1))]));for(let g=0;g<n;g++){const t=Math.max(0,t0+(t1-t0)*(n<=1?0:g/(n-1))+rnd(-.6,.6));const cx=rnd(.2,.8);
    const mem=[];for(const k in comp)for(let i=0;i<comp[k];i++)mem.push(k);
    const sup=mem.filter(k=>EN[k].aura),rest=mem.filter(k=>!EN[k].aura);const cols=Math.min(5,Math.max(1,rest.length));
    rest.forEach((k,i)=>{const row=Math.floor(i/cols),col=i%cols;S.push({type:k,t:t+row*.35+rnd(0,.1),x:clamp(cx+(col-(cols-1)/2)*.085+rnd(-.015,.015),.05,.95),y:-.04-rnd(0,.02)});});
    sup.forEach((k,i)=>S.push({type:k,t:t+.7+i*.2,x:clamp(cx+(i-(sup.length-1)/2)*.1,.06,.94),y:-.05}));}};
  const boss=(k,t)=>S.push({type:k,t,x:.5,y:-.04});
  const SG={1:[15],2:[17],3:[18],4:[16],5:[17],6:[19],7:[12,26],8:[22]};
  switch(r){
    case 1:pack({slime:5},5,.5,22);pack({slime:3},3,6,20);pack({slime:6},1,15,15);break;
    case 2:pack({slime:5},4,0,22);pack({bat:4},4,4,24);pack({bomber:2},2,10,20);pack({bat:4,slime:3},1,17,17);break;
    case 3:pack({slime:5},2,0,22);pack({bug:2},2,8,20);pack({bat:4},3,3,22);pack({skel:3,shieldb:1},2,6,24);pack({ghost:2},2,6,20);pack({skel:3,bomber:1},1,18,18);break;
    case 4:boss('knight',2);pack({skel:2,shieldb:1},2,4,18);pack({bat:4},3,6,24);pack({slime:5},3,0,22);pack({mimic:1},1,12,12);pack({bomber:3,ghost:2},1,16,16);break;
    case 5:pack({skel:3,necro:1},2,0,20);pack({skel:3,shaman:1},2,4,22);pack({bat:4},3,2,24);pack({berserker:2,drummer:1},2,8,24);pack({bug:3},2,1,20);pack({ghost:3,berserker:1},1,17,17);break;
    case 6:pack({catapult:2},1,2,2);pack({siege:1},1,8,8);pack({golem:1,shaman:1,shieldb:1},2,4,20);pack({skel:3,shieldb:1},3,0,24);pack({bug:3,drummer:1},2,2,24);pack({bat:5,bomber:2},2,4,26);pack({berserker:3,drummer:1},1,19,19);break;
    case 7:pack({siege:1},2,4,20);pack({catapult:2},1,3,3);pack({skel:3,necro:1},2,0,22);pack({golem:1,shaman:1,shieldb:1},2,6,24);pack({berserker:2,drummer:1},3,2,26);
      pack({ghost:3},2,8,24);pack({bat:5,bomber:2},3,4,28);pack({slime:6,mimic:1},2,0,20);pack({skel:4,berserker:2,shieldb:1},1,26,26);break;
    default:boss('eye',1);pack({siege:1},1,10,10);pack({catapult:1},1,6,6);pack({skel:3,necro:1},2,4,30);pack({bat:5,drummer:1},3,8,36);
      pack({ghost:3},2,14,32);pack({slime:6,shaman:1},2,12,30);pack({berserker:3,bomber:2},1,22,22);
  }
  for(const s of S)s.type=foeKey(s.type);
  const out=S.sort((a,b)=>a.t-b.t);out.surges=SG[r]||[];return out;
}
const hpScale=r=>Math.pow(1.32,r-1);
const d0=t=>['eye','knight','golem','siege','catapult','mimic','necro'].includes(t);
const K=()=>F.W/180;

/* ================= 战场画布 ================= */
const F={cv:$('#field'),ctx:null,W:200,H:200,s:2,top:0,shake:0,wallFlash:0,parts:[],nums:[],rings:[],bolts:[]};
function resizeField(){
  const st=$('#stage').getBoundingClientRect();const s=Math.max(2,Math.floor(st.width/120));
  F.s=s;F.W=Math.floor(st.width/s);F.H=Math.floor(st.height/s);F.cv.width=F.W;F.cv.height=F.H;
  F.cv.style.width=F.W*s+'px';F.cv.style.height=F.H*s+'px';F.cv.style.left=Math.floor((st.width-F.W*s)/2)+'px';
  F.ctx=F.cv.getContext('2d');F.ctx.imageSmoothingEnabled=false;buildGround();
  if(B)computeOrigins();
}
const WALLY=()=>F.H-7;
const ey=e=>F.top+e.y*(WALLY()-2-F.top);
const ex=e=>e.x*F.W;
function buildGround(){const c=document.createElement('canvas');c.width=F.W;c.height=F.H;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,F.H);g.addColorStop(0,'#0b0d18');g.addColorStop(1,'#1a1a22');x.fillStyle=g;x.fillRect(0,0,F.W,F.H);
  let s=7;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  for(let i=0;i<F.W*F.H/30;i++){const px=Math.floor(r()*F.W),py=Math.floor(r()*F.H);const a=(.03+py/F.H*.07).toFixed(3);x.fillStyle=r()<.5?`rgba(255,255,255,${a})`:`rgba(120,170,140,${a})`;x.fillRect(px,py,1,1);}
  for(let i=0;i<F.W/5;i++){const px=Math.floor(r()*F.W),py=Math.floor(F.H*.3+r()*F.H*.62);x.fillStyle=`rgba(70,120,90,${(.15+py/F.H*.25).toFixed(3)})`;x.fillRect(px,py,1,2);x.fillRect(px+2,py+1,1,1);x.fillRect(px-1,py+1,1,1);}
  for(let i=0;i<F.W/9;i++){const px=Math.floor(r()*F.W),py=Math.floor(F.H*.2+r()*F.H*.7);x.fillStyle='rgba(148,176,194,.16)';x.fillRect(px,py,2,1);x.fillStyle='rgba(0,0,0,.3)';x.fillRect(px,py+1,2,1);}
  for(let i=0;i<8;i++){x.fillStyle=`rgba(0,0,0,${(.4*(1-i/8)).toFixed(3)})`;x.fillRect(0,i*2,F.W,2);}
  F.ground=c;}
function computeOrigins(){const fr=F.cv.getBoundingClientRect();for(const c of boardCards()){const r=c.el.getBoundingClientRect();c.ox=(r.left+r.width/2-fr.left)/F.s;}}
function toClient(x,y){const fr=F.cv.getBoundingClientRect();return[fr.left+x*F.s,fr.top+y*F.s];}

/* ================= 战斗 ================= */
function startBattle(){
  if(!boardCards().length){toast('棋盘上一张卡都没有');SFX.play('bad');return;}
  cancelDrag();closeSheet();if(G.drawer)setDrawer(false);G.phase='battle';
  let wave=G.nextWave;if(G.prep.wager==='horde')wave=hordeWave(wave);const special=wave.some(s=>EN[s.type].boss)?'boss':'battle';BG.set(special);
  B={t:0,spawns:wave,si:0,en:[],pr:[],epr:[],graves:[],sched:[],shield:0,maxChain:0,wallLost:0,endT:0,over:false,acc:0,boss:null,greed:0,kills:0,flags:{},rlog:{},
    beats:nightInfo(G.round).beats,bi:0,surges:(wave.surges||[]).slice(),lowSaid:false,wager:G.prep.wager||null,maxCombo:0,combo:0,maxHit:0,slowT:0};clearVO();
  for(const c of G.cards){c.charge=0;c.mom=0;c.bDmg=0;c.bTrig=0;c.frozen=0;c.echoLog=[];c.evLog={};c.hasteT=0;c.stk=0;c.lastT=-9;c.rage=0;c.cnt=0;c.ammo=maxAmmo(c);c.el.classList.remove('frozen','empty','haste');setAmmo(c);}
  for(const c of boardCards()){c.nb=neighbors(c);c.right=rightOf(c);c.anvil=0;c.charge=mv('startCharge');}
  recalcMods();noteLineup();
  if(B.wager==='dark')for(const c of boardCards()){c.frozen=2.5;c.el.classList.add('frozen');}
  B.shield=mv('shieldStart');RANGE=clamp(RANGE0+mv('range'),.05,.35);
  F.parts=[];F.nums=[];F.rings=[];F.bolts=[];
  $('#prep').hidden=true;$('#report').hidden=true;F.cv.style.display='block';
  const bd=wave.map(s=>EN[s.type]).find(d=>d.intents);F.top=0;
  if(bd){const bb=$('#bossbar');bb.hidden=false;$('#bossName').textContent=bd.n;$('#bossHp').style.width='100%';$('#bossSh').style.width='0%';$('#bossHpT').textContent='快到了';
    $('#intName').textContent=bd.intents[0].n+'：'+bd.intents[0].d;$('#intT').textContent='';$('#intBar').style.width='0%';F.top=Math.ceil((bb.offsetHeight+14)/F.s);}
  computeOrigins();updateHUD();
  banner(nightInfo(G.round).title,G.round===8?'#ff6b5b':G.round===4?'#ffb37a':'#fff');
  SFX.play(G.round>=8||G.round===4?'intent':'ui');
  if(B.wager)later(.6,()=>banner('加码 · '+WAGERS[B.wager].n,'#ff8a5b'));
  emit('start',{});
}
function later(dt,f){B.sched.push({t:dt,f});}
function spawn(type,x,y){
  const d=EN[type];const sc=d.fixed?1:hpScale(G.round)*(G.round===1?.5:G.round===2?.6:.7)*(heat(1)?1.15:1)*(heat(2)&&(d.boss||d.elite)?1.25:1)*(wg('iron')?1.3:1);
  const e={d,type,x:x!=null?x:rnd(.08,.92),y:y!=null?y:-.04,hp:d.hp*sc,maxHp:d.hp*sc,armor:d.armor,shield:0,slowT:0,slowA:0,burnT:0,burnD:0,burnSrc:null,burnTick:0,poisonT:0,poisonD:0,poisonSrc:null,poisonTick:0,frzT:0,frzN:0,vulnT:0,vulnA:0,
    flash:0,ph:Math.random()*6.28,armorB:0,hasteB:0,healT:rnd(1.5,3),bornT:B.t,raiseT:rnd(3,5),lobT:d.lob?d.lob[0]*.6:0,sprK:null,revealed:false,dashT:0,hardT:0,ii:0,it:d.intents?d.intents[0].t:0,dead:false};
  e.x0=e.x;B.en.push(e);if((d.boss||d.elite||d.big)&&!B.flags['met'+type]){B.flags['met'+type]=1;later(1.2,()=>say('hero',BARKS.elite,2));}if(!d.fixed&&e.y<0)for(let i=0;i<4;i++)part(ex(e)+rnd(-4,4),F.top+rnd(0,3),rnd(-8,8),rnd(5,20),.5,Math.random()<.5?'#a64ca6':'#5d275d',1);if(d.boss||d.elite){B.boss=e;$('#bossbar').hidden=false;$('#bossName').textContent=d.n;if(FOEB[type])say(type,FOEB[type].spawn,3);}
  if(!d.fixed)meetFoe(type);
  return e;
}
const RANGE0=.24;let RANGE=.24;
const phased=e=>e.d.phase&&((B.t+e.ph)%3.2)>2.0;
function front(){let b=null;for(const e of B.en)if(!e.dead&&e.y>=RANGE&&!phased(e)&&(!b||e.y>b.y))b=e;return b;}
function hasTarget(){return!!front();}
function dist(a,b){return Math.hypot((ex(a)-ex(b)),(ey(a)-ey(b)));}

function simStep(dt){
  B.t+=dt;
  while(B.bi<B.beats.length&&B.beats[B.bi][0]<=B.t){const b=B.beats[B.bi++];say(b[1],b[2],3);}
  if(B.surges.length&&B.surges[0]<=B.t){B.surges.shift();surge();}
  while(B.si<B.spawns.length&&B.spawns[B.si].t<=B.t){const s=B.spawns[B.si];spawn(s.type,s.x,s.y);B.si++;}
  for(let i=B.sched.length-1;i>=0;i--){const s=B.sched[i];s.t-=dt;if(s.t<=0){B.sched.splice(i,1);s.f();if(B.over)return;}}
  for(const c of boardCards()){
    if(c.frozen>0){c.frozen-=dt;if(c.frozen<=0)c.el.classList.remove('frozen');continue;}
    const it=ITEMS[c.key];if(c.ammo===0){c.charge=Math.min(c.charge,1);continue;}
    if(c.hasteT>0){c.hasteT-=dt;if(c.hasteT<=0)c.el.classList.remove('haste');}
    if(it.passive&&!it.dmg){c.charge=1;continue;}
    if(!it.passive){const st=stats(c,B.t);c.charge+=dt/st.cd*(c.hasteT>0?2:1);}
    if(c.charge>=1){if(ITEMS[c.key].dmg>0&&!hasTarget())c.charge=1;else{c.charge-=1;if(c.charge>1)c.charge=.99;trigger(c,0);}}
  }
  for(const e of B.en){e.armorB=0;e.hasteB=0;}
  for(const s of B.en){if(s.dead||!s.d.aura||s.y<-.02)continue;const R2=s.d.aura*K();
    for(const o of B.en){if(o===s||o.dead||o.d.aura)continue;if(Math.hypot(ex(o)-ex(s),ey(o)-ey(s))>R2)continue;
      if(s.d.guard)o.armorB=Math.max(o.armorB,s.d.guard);if(s.d.haste)o.hasteB=Math.max(o.hasteB,s.d.haste);}
    if(s.d.heal){s.healT-=dt;if(s.healT<=0){s.healT=3;let any=false;
      for(const o of B.en){if(o.dead||o.hp>=o.maxHp||Math.hypot(ex(o)-ex(s),ey(o)-ey(s))>R2)continue;const h=o.maxHp*s.d.heal;o.hp=Math.min(o.maxHp,o.hp+h);any=true;
        num(ex(o),ey(o)-12,'+'+fmt(h),'#7ee8a2',1);for(let i=0;i<3;i++)part(ex(o)+rnd(-3,3),ey(o)-rnd(2,8),0,-rnd(10,20),.5,'#a7f070',1);}
      if(any)ring(ex(s),ey(s)-5,3,R2,'#7ee8a2',.5);}}}
  for(const e of B.en){
    if(e.dead)continue;
    if(e.flash>0)e.flash-=dt;
    if(e.slowT>0){e.slowT-=dt;if(e.slowT<=0)e.slowA=0;}
    if(e.hardT>0)e.hardT-=dt;
    if(e.vulnT>0){e.vulnT-=dt;if(e.vulnT<=0)e.vulnA=0;}
    if(e.burnT>0){e.burnT-=dt;e.burnTick+=dt;if(e.burnTick>=.5){e.burnTick-=.5;hurt(e,e.burnD*.5,e.burnSrc,false,{burnTick:1});if(e.dead)continue;}
    if(e.poisonT>0){e.poisonT-=dt;e.poisonTick+=dt;if(e.poisonTick>=.5){e.poisonTick-=.5;hurt(e,e.poisonD*.5,e.poisonSrc,false,{poisonTick:1});if(Math.random()<.35)part(ex(e),ey(e)-8,rnd(-12,12),rnd(-24,-4),.45,'#7ddc5f',1);if(e.dead)continue;}}
      if(Math.random()<.25)part(ex(e)+rnd(-4,4),ey(e)-rnd(2,8),rnd(-5,5),-rnd(10,25),.4,Math.random()<.5?'#ef7d57':'#ffcd75',1);}
    if(e.d.intents){e.it-=dt;if(e.it<=0){doIntent(e);if(B.over)return;}}
    let sp=e.d.spd*(1-e.slowA)*(1+mv('enemySpd')+(heat(7)?.1:0)+(wg('rush')?.2:0))*(1+e.hasteB);if(e.dashT>0){e.dashT-=dt;sp*=3;}
    if(e.d.rage)sp*=1+e.d.rage*(1-e.hp/e.maxHp);
    if(e.revealed)sp*=2.4;
    if(e.d.stopAt&&e.y>=e.d.stopAt&&e.dashT<=0)sp=0;
    if(e.frzT>0){e.frzT-=dt;sp=0;}
    if(e.d.lob&&e.y>=e.d.stopAt-.02){e.lobT-=dt;if(e.lobT<=0){e.lobT=e.d.lob[0];lobRock(e);}}
    if(e.d.raise&&e.y>0){e.raiseT-=dt;if(e.raiseT<=0){e.raiseT=5;raiseDead(e);}}
    e.y+=sp*dt;
    if(e.d.zig)e.x=clamp(e.x0+Math.sin(B.t*3+e.ph)*.07,.04,.96);
    if(e.y>=1){wallHit(e);if(B.over)return;}
  }
  B.en=B.en.filter(e=>!e.dead);
  stepERocks(dt);
  for(const p of B.pr)stepProj(p,dt);
  B.pr=B.pr.filter(p=>!p.done);
  if(!B.endT&&B.si>=B.spawns.length&&!B.en.length&&!B.pr.length&&!B.epr.length)B.endT=B.t+.9;
  if(B.endT&&B.t>=B.endT)winBattle();
}
function freeze(e,t,src){if(e.dead)return;let d=t*(e.d.boss||e.d.elite?.5:1);if(e.d.boss)d/=1+e.frzN*.5;e.frzN++;
  if(d>e.frzT){e.frzT=d;ring(ex(e),ey(e)-5,2,10*K(),'#c2f4ff',.3);}emit('freeze',{e,src});}
function vuln(e,t,a){e.vulnT=Math.max(e.vulnT,t);e.vulnA=Math.max(e.vulnA,a);}
function wallHit(e){e.dead=true;damageWall(e.d.wall,ex(e),e.d.bomb?'boom':null);if(!B.over&&e.d.chill)chillCard(e.d.chill);}
function chillCard(t){const bc=boardCards().filter(c=>c.frozen<=0);if(!bc.length)return;const c=pick(bc);c.frozen=t;c.el.classList.add('frozen');if(Math.random()<.5)say('hero',BARKS.freeze,1);}
function damageWall(d,xx,kind){
  const e={x:xx/F.W,y:1};if(wg('brittle'))d*=1.5;const ab=Math.min(B.shield,d);B.shield-=ab;d-=ab;if(G.run)G.run.wallLost+=d;if(kind==='boom'){boom(xx,WALLY()-2,16*K(),'#ef7d57');}
  G.wall-=d;B.wallLost+=d;F.wallFlash=.4;F.shake=Math.max(F.shake,d>0?4:1.5);SFX.play('hurt');
  for(let i=0;i<10;i++)part(ex(e)+rnd(-6,6),WALLY(),rnd(-30,30),-rnd(20,50),.5,'#e43b44',2);
  if(d>0)num(ex(e),WALLY()-6,'-'+Math.ceil(d),'#ff5a5a',2);
  restart($('#hpChip'),'shake');updateHUD();
  emit('wall',{d});if(B.over)return;
  if(d>0){if(!B.lowSaid&&G.wall<G.wallMax*.35&&G.wall>0){B.lowSaid=true;say('hero',BARKS.low,2);}else if(Math.random()<.5)say('hero',BARKS.hurt,1);else say('soldier',BARKS.soldierHurt,1);}
  if(G.wall<=0){G.wall=0;loseBattle();}
}
function doIntent(e){
  const it=e.d.intents[e.ii];SFX.play('intent');F.shake=Math.max(F.shake,3);
  ring(ex(e),ey(e)-8,4,40,'#ff5a5a',.45);
  if(it.a==='shield'){e.shield+=e.maxHp*.15;}
  if(it.a==='dash'){e.dashT=2;}
  if(it.a==='harden'){e.hardT=4;}
  if(it.a==='summon'){for(let i=0;i<6;i++){const b=spawn(foeKey('bat'),clamp(e.x+rnd(-.25,.25),.06,.94),Math.max(-.02,e.y-.02));b.x0=b.x;}}
  if(it.a==='gaze'){const bc=boardCards();for(let i=0;i<2&&bc.length;i++){const c=bc.splice(Math.floor(Math.random()*bc.length),1)[0];c.frozen=3;c.el.classList.add('frozen');}toast('被它盯住了，两张卡动不了');}
  banner(it.n,'#ff8a70');if(FOEB[e.type]&&FOEB[e.type].intent[it.a]&&Math.random()<.7)say(e.type,FOEB[e.type].intent[it.a],2);
  if(it.a==='gaze')say('hero',BARKS.freeze,2);
  e.ii=(e.ii+1)%e.d.intents.length;e.it=e.d.intents[e.ii].t;
}

/* ---- 触发与连锁 ---- */
function trigger(c,depth){
  if(depth>10||B.over||c.ammo===0)return;
  const times=c.adj==='twin'?2:1;
  fire(c,depth);
  if(times>1)later(.08,()=>fire(c,depth));
}
function fire(c,depth){
  if(B.over)return;
  const it=ITEMS[c.key];if(c.ammo===0)return;c.bTrig++;restart(c.el,'pop');SFX.play('fire',it.tag);
  if(c.ammo>0){c.ammo--;setAmmo(c);if(c.ammo===0&&!B.flags.emptySaid){B.flags.emptySaid=1;say('hero',BARKS.empty,1);}}
  const st=stats(c,B.t);
  if(it.dmg>0){attack(c,st);for(let i=1;i<(it.multi||1);i++)later(.09*i,()=>{if(!B.over)attack(c,st);});}
  if(it.stack)c.stk+=it.stack;
  if(it.charge)for(const n of c.nb)if(!it.chargeKind||ITEMS[n.key].kind===it.chargeKind)chargeCard(n,chargeAmt(c),c);
  if(it.reload)for(const n of c.nb)if(!reload(n,it.reload,c)&&it.reloadElse)chargeCard(n,it.reloadElse*(1+.25*stepOf(c)),c);
  if(it.hasteNb)for(const n of c.nb)haste(n,it.hasteNb*(1+.2*stepOf(c)),c);
  if(it.hasteKind)for(const o of boardCards())if(o!==c&&ITEMS[o.key].kind===it.hasteKind.kind)haste(o,it.hasteKind.t*(1+.2*stepOf(c)),c);
  if(it.hasteSmall)for(const o of boardCards())if(o!==c&&o.size===1)haste(o,it.hasteSmall,c);
  if(it.chargeAll)for(const o of boardCards())if(o!==c)chargeCard(o,it.chargeAll+.07*stepOf(c),null);
  if(it.chargeSmall)for(const o of boardCards())if(o!==c&&o.size===1)chargeCard(o,it.chargeSmall*(1+.25*stepOf(c))*(1+mv('support')),c);
  if(it.buff){const a=buffAmt(c);for(const n of c.nb){n.anvil=Math.max(n.anvil||0,a);FX.link(c.el,n.el,'#e3e9f0',.22);}}
  if(it.horn&&depth<10)for(const n of c.nb){if(n.frozen>0)continue;later(.1,()=>{if(B.over)return;FX.link(c.el,n.el,'#ffd166',.25);showChain(depth+2);if(depth+2>B.maxChain)B.maxChain=depth+2;trigger(n,depth+1);});}
  if(it.fuse)for(const o of boardCards())if(o!==c&&ITEMS[o.key].tag===it.fuse.tag)chargeCard(o,it.fuse.amt+.03*stepOf(c),c);
  if(it.detonate){let n=0;for(const e of B.en){if(e.dead||e.burnT<=0)continue;n++;const amt=e.burnD*e.burnT;e.burnT=0;e.burnD=0;ring(ex(e),ey(e)-8,3,34,'#ff7a2a',.45);hurt(e,amt,c,false,{});}if(n){SFX.play('boom');F.shake=Math.max(F.shake,4);}}
  if(it.detonateP){let n=0;for(const e of B.en){if(e.dead||e.poisonT<=0)continue;n++;const amt=e.poisonD*e.poisonT;e.poisonT=0;e.poisonD=0;ring(ex(e),ey(e)-8,3,34,'#7ddc5f',.45);hurt(e,amt,c,false,{});}if(n){SFX.play('boom');F.shake=Math.max(F.shake,4);}}
  if(it.prism)for(const n of c.nb){if(!['火','冰','电'].includes(ITEMS[n.key].tag))continue;chargeCard(n,.25,c);n.anvil=Math.max(n.anvil||0,.5);FX.link(c.el,n.el,'#73eff7',.25);}
  if(c.adj==='ignite'&&c.right)chargeCard(c.right,.1,c);
  if(c.adj==='sturdy'){B.shield+=c.size*(c.tier+1);updateHUD();}
  if(c.adj==='momentum')c.mom=Math.min(10,c.mom+1);
  emit('use',{c,depth});
  for(const n of c.nb){
    if(n.adj!=='echo'||n.frozen>0)continue;
    n.echoLog=n.echoLog.filter(t=>t>B.t-1);if(n.echoLog.length>=6)continue;n.echoLog.push(B.t);
    later(.12,()=>{const d=depth+1;if(B.over||d>10)return;FX.link(c.el,n.el,ADJ.echo.c);
      if(d+1>B.maxChain)B.maxChain=d+1;showChain(d+1);if(mv('shellChain')&&(d+1)%5===0){B.shield+=3;updateHUD();}SFX.play('echo',d);trigger(n,d);});
  }
}
function chargeCard(c,amt,from){if(c.frozen>0)return;c.charge=Math.min(1.5,c.charge+amt);if(from)FX.link(from.el,c.el,'#ffa53b',.16);emit('charge',{c,from});}
function haste(c,t,from){if(c.frozen>0||!c.el)return;c.hasteT=Math.max(c.hasteT||0,t);c.el.classList.add('haste');if(from)FX.link(from.el,c.el,'#8ff0c8',.2);}
function reload(c,n,from){const m=maxAmmo(c);if(m==null)return false;if(c.ammo>=m)return true;c.ammo=Math.min(m,c.ammo+n);c.el.classList.remove('empty');setAmmo(c);if(from)FX.link(from.el,c.el,'#ffd166',.22);return true;}
function setAmmo(c){if(!c.el)return;const a=c.el.querySelector('.am');if(!a)return;const v=B&&G.phase==='battle'?c.ammo:maxAmmo(c);a.textContent='弹'+v;c.el.classList.toggle('empty',v===0);}
let chainT=0;
function showChain(n){if(n<2)return;if(n===5||n===9)say('hero',BARKS.chain,1);if(n>=8)unlock('chain8');if(n>=11)unlock('chain11');const el=$('#chain');const cols=['#c38cff','#c38cff','#ff95dc','#ffd166','#ff8a5b','#ff5a5a'];
  if(n%5===0)emit('chain',{n});el.style.setProperty('--cc',cols[Math.min(cols.length-1,Math.floor(n/2))]);el.innerHTML='连锁 <b>×'+n+'</b>';
  const now=performance.now();if(now-chainT>90){restart(el,'show');chainT=now;}}

/* ---- 攻击 ---- */
function attack(c,st){
  const it=ITEMS[c.key];const t=front();if(!t)return;
  const crit=Math.random()<st.crit;let dmg=st.total*(crit?2+mv('critDmg'):1);if(c.anvil){dmg*=1+c.anvil;c.anvil=0;}
  const mods={slow:c.adj==='chill'?.3:0,kb:c.adj==='heavy'?.035:0,freeze:it.freeze||0,vuln:it.vuln||null,exec:it.exec||0,burnDur:it.burnDur||0,poisonDur:it.poisonDur||0};
  const bm=crit&&it.critBurn?it.critBurn:1;
  const o={x:c.ox,y:F.H+3};const A=(it.aoe||0)*K()*(1+mv('aoe'));
  const H=(e,m,extra)=>hurt(e,dmg*(m||1)*(it.frozenMul&&e.frzT>0?it.frozenMul:1)*(it.burnMul&&e.burnT>0?it.burnMul:1),c,crit,Object.assign({},mods,extra||{}));
  switch(it.fx){
    case'knife':proj(o,t,{spd:320,kind:'knife'},e=>H(e));break;
    case'firefly':{const ts=B.en.filter(e=>!e.dead&&e.y>=RANGE&&!phased(e)).sort((a,b)=>b.y-a.y).slice(0,3);
      ts.forEach((e,i)=>later(i*.06,()=>{if(B.over)return;proj({x:o.x+(i-1)*4,y:o.y},e.dead?front()||e:e,{spd:190,kind:'fly'},x2=>H(x2));}));break;}
    case'sweep':{const y0=ey(t),band=10*K();const swing=B.t%2<1?1:-1;
      bolt([[swing>0?0:F.W,y0-4],[F.W/2,y0+2],[swing>0?F.W:0,y0-4]],'#ffd166',.2,false);ring(ex(t),y0-4,2,18*K(),'#ffcd75',.3);SFX.play('boom');
      for(let i=0;i<14;i++)part(rnd(0,F.W),y0-4+rnd(-2,2),swing*rnd(30,80),rnd(-10,10),.3,'#ffe79a',1);
      for(const en of B.en)if(!en.dead&&en.y>=RANGE-.05&&Math.abs(ey(en)-y0)<=band)H(en);break;}
    case'slash':{const x0=ex(t),y0=ey(t);let n2=null,bd=22*K();for(const e of B.en)if(!e.dead&&e!==t){const d=Math.hypot(ex(e)-x0,ey(e)-y0);if(d<bd){bd=d;n2=e;}}
      bolt([[x0-8,y0-9],[x0+8,y0-1]],'#fff4cf',.14,true);H(t);if(n2){bolt([[ex(n2)-7,ey(n2)-8],[ex(n2)+7,ey(n2)-2]],'#ffe79a',.14,true);H(n2,.8);}
      for(let i=0;i<6;i++)part(x0,y0-5,rnd(-40,40),rnd(-30,10),.25,'#fff4cf',1);break;}
    case'meteor':{const x0=ex(t),y0=ey(t);B.pr.push({x:x0+30,y:F.top-6,sx:x0+30,sy:F.top-6,tgt:t,tx:x0,ty:y0,spd:0,kind:'meteor',arc:1,dur:.55,age:0,done:false,
      onHit:()=>{boom(x0,y0,A,'#ff5a2a');ring(x0,y0,3,A*1.2,'#fee761',.5);F.shake=Math.max(F.shake,5);for(const en of B.en)if(!en.dead&&Math.hypot(ex(en)-x0,ey(en)-y0)<=A)H(en,1,{burn:it.burn*dmgMul(c)*(1+mv('burn'))});}});break;}
    case'rock':proj(o,t,{spd:240,kind:'rock'},e=>H(e,1,{kb:Math.max(mods.kb,it.kb)}));break;
    case'axe':proj(o,t,{spd:230,kind:'axe'},e=>{H(e,1,{pen:it.pen});for(let i=0;i<5;i++)part(ex(e),ey(e)-5,rnd(-30,30),rnd(-40,0),.3,'#dfe6ee',1);});break;
    case'blizzard':{ring(F.W/2,F.H*.55,4,F.W*.7,'#73eff7',.5);for(let i=0;i<40;i++)part(rnd(0,F.W),rnd(F.top,F.H*.9),rnd(-50,-20),rnd(10,40),rnd(.4,.8),Math.random()<.5?'#f4f4f4':'#73eff7',1);
      for(const en of B.en)if(!en.dead&&en.y>=RANGE)H(en,1,{slow:it.slow});break;}
    case'spark':proj(o,t,{spd:230,kind:'spark'},e=>H(e,1,{burn:it.burn*dmgMul(c)*(1+mv('burn'))*bm}));break;
    case'sting':proj(o,t,{spd:300,kind:'knife'},e=>H(e,1,{poison:it.poison*dmgMul(c)*(1+mv('poison'))}));break;
    case'gas':proj(o,t,{spd:0,kind:'shell',arc:1,dur:.42},(e,x,y)=>{boom(x,y,A,'#7ddc5f');ring(x,y,2,A*.7,'#a7f070',.4);for(const en of B.en)if(!en.dead&&Math.hypot(ex(en)-x,ey(en)-y)<=A)H(en,1,it.poison?{poison:it.poison*dmgMul(c)*(1+mv('poison'))}:null);});break;
    case'fslash':{const x0=ex(t),y0=ey(t);let n2=null,bd=22*K();for(const e of B.en)if(!e.dead&&e!==t){const d=Math.hypot(ex(e)-x0,ey(e)-y0);if(d<bd){bd=d;n2=e;}}
      for(let i=0;i<8;i++)part(x0+rnd(-8,8),y0-5,rnd(-40,40),rnd(-30,10),.3,Math.random()<.5?'#ffcd75':'#ef7d57',1);
      bolt([[x0-8,y0-9],[x0+8,y0-1]],'#ffb37a',.14,true);H(t,1,{burn:it.burn*dmgMul(c)*(1+mv('burn'))});if(n2){bolt([[ex(n2)-7,ey(n2)-8],[ex(n2)+7,ey(n2)-2]],'#ffb37a',.14,true);H(n2,.8,{burn:it.burn*dmgMul(c)*(1+mv('burn'))});}break;}
    case'ice':proj(o,t,{spd:260,kind:'ice'},e=>H(e,1,{slow:Math.max(it.slow,mods.slow)}));break;
    case'arrow':proj(o,t,{spd:380,kind:'arrow'},e=>{H(e);
      const beh=B.en.filter(x=>!x.dead&&x!==e&&x.y<e.y&&Math.abs(ex(x)-ex(e))<26*K()).sort((a,b)=>b.y-a.y).slice(0,it.pierce);
      let prev=e;beh.forEach((x,i)=>{const p0=prev;later(.03*(i+1),()=>{if(x.dead)return;bolt([[ex(p0),ey(p0)-5],[ex(x),ey(x)-5]],'#e3e9f0',.12,true);H(x,.7);});prev=x;});});break;
    case'bolt':{const list=[t];while(list.length<1+chainOf(c)){const last=list[list.length-1];let best=null,bd=70*K();
        for(const e of B.en)if(!e.dead&&!list.includes(e)){const d=dist(e,last);if(d<bd){bd=d;best=e;}}if(!best)break;list.push(best);}
      const pts=[[o.x,F.H]];list.forEach(e=>pts.push([ex(e),ey(e)-5]));bolt(pts,it.tag==='电'?'#fee761':'#fff',.16);
      list.forEach((e,i)=>{H(e,i?.6:1);if(i)emit('bounce',{e,src:c});});break;}
    case'shell':proj(o,t,{spd:0,kind:'shell',arc:1,dur:.42},(e,x,y)=>{boom(x,y,A,'#ef7d57');for(const en of B.en)if(!en.dead&&Math.hypot(ex(en)-x,ey(en)-y)<=A)H(en,1,it.burn?{burn:it.burn*dmgMul(c)*(1+mv('burn'))}:null);});break;
    case'quake':{const x=ex(t),y=ey(t);ring(x,y,4,A,'#c28a4d',.4);ring(x,y,2,A*.6,'#ffcd75',.3);F.shake=Math.max(F.shake,3);SFX.play('boom');
      for(let i=0;i<18;i++)part(x+rnd(-A*.7,A*.7),y+rnd(-6,6),rnd(-20,20),-rnd(20,60),.6,Math.random()<.5?'#7a4a2a':'#c28a4d',2);
      for(const en of B.en)if(!en.dead&&Math.hypot(ex(en)-x,ey(en)-y)<=A)H(en);break;}
    case'flame':{const x=ex(t),y=ey(t);for(let i=0;i<22;i++){const k=i/22;part(o.x+(x-o.x)*k+rnd(-3,3),o.y+(y-o.y)*k+rnd(-3,3),rnd(-15,15),rnd(-15,15),.35+k*.2,k<.5?'#ffcd75':'#ef7d57',2);}
      later(.12,()=>{boom(x,y,A,'#ef7d57');for(const en of B.en)if(!en.dead&&Math.hypot(ex(en)-x,ey(en)-y)<=A)H(en,1,{burn:it.burn*dmgMul(c)*(1+mv('burn'))});});break;}
    case'avalanche':{const ts=B.en.filter(e=>!e.dead&&e.y>=RANGE-.05&&(e.slowT>0||e.frzT>0));if(!ts.length)ts.push(t);
      ring(F.W/2,F.H*.5,4,F.W*.6,'#c2f4ff',.45);for(let i=0;i<26;i++)part(rnd(0,F.W),rnd(F.top,F.H*.6),rnd(-10,10),rnd(30,70),rnd(.3,.6),Math.random()<.5?'#f4f4f4':'#73eff7',2);
      F.shake=Math.max(F.shake,3);SFX.play('boom');for(const en of ts)H(en);break;}
    case'discharge':{const ts=B.en.filter(e=>!e.dead&&e.y>=RANGE-.05&&(e.slowT>0||e.frzT>0));if(!ts.length)ts.push(t);
      for(const en of ts){bolt([[o.x,F.H],[ex(en),ey(en)-5]],'#fee761',.14);H(en);}break;}
    case'bell':{SFX.play('bell');ring(F.W/2,F.H,6,F.H*1.2,'#ffcd75',.6);ring(F.W/2,F.H,4,F.H,'#fee761',.5);
      for(const en of B.en)if(!en.dead&&en.y>=RANGE)H(en);break;}
  }
}
function proj(o,t,opt,onHit){B.pr.push({x:o.x,y:o.y,sx:o.x,sy:o.y,tgt:t,tx:ex(t),ty:ey(t)-5,spd:opt.spd*K(),kind:opt.kind,arc:opt.arc,dur:opt.dur,age:0,onHit,done:false});}
function stepProj(p,dt){
  p.age+=dt;
  if(p.arc){const k=Math.min(1,p.age/p.dur);p.x=p.sx+(p.tx-p.sx)*k;p.y=p.sy+(p.ty-p.sy)*k-(p.kind==='meteor'?0:Math.sin(k*Math.PI)*28*K());
    if(p.kind==='meteor')for(let i=0;i<3;i++)part(p.x+rnd(-2,2),p.y+rnd(-2,2),rnd(5,20),-rnd(10,30),.35,Math.random()<.5?'#ff5a2a':'#fee761',2);
    if(Math.random()<.5)part(p.x,p.y,rnd(-5,5),rnd(-5,5),.25,'#94b0c2',1);
    if(k>=1){p.done=true;p.onHit(null,p.tx,p.ty);}return;}
  if(!p.tgt){p.done=true;return;}
  if(p.tgt.dead){const n=front();if(n)p.tgt=n;else{p.done=true;return;}}
  p.tx=ex(p.tgt);p.ty=ey(p.tgt)-5;const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),s=p.spd*dt;
  if(p.kind==='spark'&&Math.random()<.6)part(p.x,p.y,rnd(-6,6),rnd(-6,6),.25,Math.random()<.5?'#ffcd75':'#ef7d57',1);
  if(p.kind==='ice'&&Math.random()<.4)part(p.x,p.y,rnd(-4,4),rnd(-4,4),.3,'#73eff7',1);
  if(d<=s+2){p.done=true;p.onHit(p.tgt);return;}
  p.vx=dx/d;p.vy=dy/d;p.x+=p.vx*s;p.y+=p.vy*s;
}
function hurt(e,amt,src,crit,o){
  if(!e||e.dead)return;o=o||{};
  if(phased(e)){if(!o.burnTick&&!o.poisonTick&&Math.random()<.3)num(ex(e),ey(e)-10,'0','#73eff7',1);return;}
  if(e.d.mimic&&!e.revealed){e.revealed=true;e.sprK=e.d.spr2;SFX.play('intent');ring(ex(e),ey(e)-5,2,14*K(),'#ffcd75',.3);}
  if(e.slowT>0&&mv('slowVuln'))amt*=1+mv('slowVuln');
  if(e.vulnT>0)amt*=1+e.vulnA;
  let a=Math.max(1,amt-Math.max(0,e.armor+e.armorB+(e.hardT>0?10:0)-(o.pen||0)-mv('pen')));
  if(o.burnTick)a=Math.max(1,amt);
  if(o.poisonTick)a=Math.max(1,amt);
  if(e.shield>0){const s=Math.min(e.shield,a);e.shield-=s;a-=s;if(a<=0){num(ex(e),ey(e)-12,'0','#dfe6ee',1);return;}}
  e.hp-=a;e.flash=.08;if(src)src.bDmg+=a;
  if(a>B.maxHit){B.maxHit=a;if(a>=1000)unlock('hit1k');if(a>=10000)unlock('hit10k');}
  const big=crit||a>=150;
  if(crit||o.burnTick||o.poisonTick||F.nums.length<28||((e.d.boss||e.d.elite)?Math.random()<.25:Math.random()<.5))num(ex(e)+rnd(-7,7),ey(e)-10-rnd(0,5),fmt(a)+(crit?'!':''),o.poisonTick?'#7ddc5f':o.burnTick?'#ef7d57':crit?'#fee761':'#ffffff',big?2:1);
  if(!o.burnTick&&!o.poisonTick)SFX.play(crit?'crit':'hit');
  if(crit){F.shake=Math.max(F.shake,1.5);if(a>=e.maxHp*.6&&a>=30)say('hero',BARKS.crit,1);}
  if(e===B.boss&&!e.lowSaid&&e.hp-a<e.maxHp*.3&&FOEB[e.type]){e.lowSaid=true;say(e.type,FOEB[e.type].low,3);say('hero',FOEB[e.type].heroLow,3);}
  if(o.slow){e.slowT=2;e.slowA=Math.min(.85,Math.max(e.slowA,o.slow*(1+mv('slow'))*(e.d.boss?.5:1)));}
  const tick=o.burnTick||o.poisonTick;
  if(o.burn){e.burnT=Math.max(e.burnT,o.burnDur||3);e.burnD=Math.max(e.burnD,o.burn);e.burnSrc=src;emit('burn',{e,src});}
  if(o.poison){e.poisonT=Math.max(e.poisonT,o.poisonDur||3);e.poisonD+=o.poison;e.poisonSrc=src;emit('poison',{e,src});}
  if(o.freeze)freeze(e,o.freeze,src);
  if(o.vuln)vuln(e,o.vuln[0],o.vuln[1]);
  if(!tick){emit('hit',{e,src,crit});if(crit)emit('crit',{e,src});}
  if(o.exec&&!e.dead&&e.hp>0&&!e.d.boss&&e.hp<e.maxHp*o.exec*(e.d.elite?.5:1)){num(ex(e),ey(e)-16,'处决','#ff5a5a',1);ring(ex(e),ey(e)-6,2,12*K(),'#ff5a5a',.3);e.hp=0;}
  if(o.kb&&!e.d.boss)e.y=Math.max(-.03,e.y-o.kb*(e.d.elite?.3:1));
  for(let i=0;i<3;i++)part(ex(e),ey(e)-5,rnd(-30,30),rnd(-40,5),.25,'#ffffff',1);
  if(e.hp<=0)kill(e,src);
}
/* ---- 敌方行为：投石车 / 死灵法师 / 大军压境 ---- */
function lobRock(e){B.epr.push({x0:ex(e),y0:ey(e)-6,x1:ex(e)+rnd(-8,8),y1:WALLY()-1,t:0,dur:1.1});SFX.play('fire','机');}
function stepERocks(dt){for(const r of B.epr){r.t+=dt;if(r.t>=r.dur&&!r.done){r.done=true;
    for(let i=0;i<8;i++)part(r.x1,r.y1,rnd(-30,30),-rnd(10,40),.4,'#566c86',2);damageWall(B.en.length?EN.catapult.lob[1]:1,r.x1);if(B.over)return;}}
  B.epr=B.epr.filter(r=>!r.done);}
function raiseDead(e){
  const R=50*K();const gs=B.graves.filter(g=>Math.hypot(g.x*F.W-ex(e),(F.top+g.y*(WALLY()-2-F.top))-ey(e))<=R).slice(-e.d.raise);
  for(const g of gs){B.graves.splice(B.graves.indexOf(g),1);const s=spawn(e.d.raiseAs||'skel',g.x,g.y);s.raised=true;s.x0=s.x;
    bolt([[ex(e),ey(e)-8],[ex(s),ey(s)-5]],'#b77cff',.25,true);ring(ex(s),ey(s)-4,1,10*K(),'#b77cff',.35);}
  if(gs.length){SFX.play('intent');if(Math.random()<.35)say('soldier',['倒下的又站起来了！','打那个穿袍子的！'],1);}
}
function surge(){banner('大军压境','#ff8a5b');SFX.play('intent');SFX.play('boom');F.shake=Math.max(F.shake,5);
  say('soldier',BARKS.soldierSurge,2);say('hero',BARKS.surge,2);}
function fmt(v){v=Math.round(v);return v>=10000?Math.round(v/1000)+'k':String(v);}
function kill(e,src){
  e.dead=true;B.kills++;SFX.play('kill');comboKill(e);if(e.type==='eye'&&B.t-e.bornT<=25)unlock('quickeye');if(B.kills===1)say('hero',BARKS.first,1);
  B.kt=(B.kt||[]).filter(t=>t>B.t-2);B.kt.push(B.t);if(B.kt.length>=8){B.kt=[];say('hero',BARKS.streak,1);}
  emit('kill',{e,src,burning:e.burnT>0,poisoned:e.poisonT>0,frozen:e.frzT>0,elite:!!(e.d.elite||e.d.boss)});
  const n=e.d.boss?60:e.d.elite?36:12;for(let i=0;i<n;i++)part(ex(e),ey(e)-5,rnd(-50,50),rnd(-60,20),rnd(.3,.7),Math.random()<.6?e.d.col:'#1a1c2c',Math.random()<.5?2:1);
  part(ex(e),ey(e)-6,rnd(-4,4),-35,.8,'#dfe6ee',1);ring(ex(e),ey(e)-5,1,6*K()*e.d.sc,'#ffffff',.18);
  if(!e.d.fixed&&!e.raised&&!e.d.small){B.graves.push({x:e.x,y:e.y,t:B.t});if(B.graves.length>24)B.graves.shift();}
  if(e.d.bomb){const X=ex(e),Y=ey(e)-4,R=22*K();boom(X,Y,R,'#ef7d57');F.shake=Math.max(F.shake,3);
    later(.04,()=>{for(const o of B.en)if(!o.dead&&o!==e&&Math.hypot(ex(o)-X,ey(o)-Y)<=R)hurt(o,o.maxHp*e.d.bomb+4,null,false,{});});}
  if(e.d.cargo){const[k,n]=e.d.cargo;for(let i=0;i<n;i++){const s=spawn(k,clamp(e.x+(i-(n-1)/2)*.06,.05,.95),Math.max(-.02,e.y-.01-rnd(0,.03)));s.x0=s.x;}ring(ex(e),ey(e)-6,3,26*K(),'#c28a4d',.4);SFX.play('boom');}
  if(e.d.mimic){G.gold+=e.d.mimic;const[cx,cy]=toClient(ex(e),ey(e));FX.coins(cx,cy,e.d.mimic);SFX.play('coin');updateHUD();}
  if(e.d.split){for(let i=0;i<e.d.split;i++){const m=spawn(e.d.splitInto||'mini',clamp(e.x+(i?.05:-.05),.04,.96),e.y-.01);m.x0=m.x;}}
  if(src&&src.adj==='greedy'){G.gold++;B.greed++;const[cx,cy]=toClient(ex(e),ey(e));FX.coins(cx,cy,1);SFX.play('coin');updateHUD();}
  if(mv('killGold')&&Math.random()<mv('killGold')){G.gold++;const[cx,cy]=toClient(ex(e),ey(e));FX.coins(cx,cy,1);updateHUD();}
  if(e.d.boss||e.d.elite){F.shake=6;B.slowT=.6;SFX.play('boom');if(FOEB[e.type])say(e.type,FOEB[e.type].die,3);if(!e.d.boss)say('hero',BARKS.killElite,2);ring(ex(e),ey(e),4,60,'#fee761',.6);B.boss=null;$('#bossbar').hidden=true;}
}

/* ---- 场景特效 ---- */
function part(x,y,vx,vy,life,col,sz){if(F.parts.length>600)F.parts.shift();F.parts.push({x,y,vx,vy,life,max:life,col,sz:sz||1});}
function num(x,y,str,col,s){if(F.nums.length>70)F.nums.shift();F.nums.push({x,y,str,col,s,life:.8});}
function ring(x,y,r0,r1,col,life){F.rings.push({x,y,r0,r1,col,life,max:life});}
function bolt(pts,col,life,straight){const segs=[];for(let i=0;i<pts.length-1;i++){const[a,b]=[pts[i],pts[i+1]];const n=straight?1:Math.max(2,Math.floor(Math.hypot(b[0]-a[0],b[1]-a[1])/8));
  for(let k=0;k<n;k++){const t0=k/n,t1=(k+1)/n;segs.push([a[0]+(b[0]-a[0])*t0+(k&&!straight?rnd(-3,3):0),a[1]+(b[1]-a[1])*t0,a[0]+(b[0]-a[0])*t1,a[1]+(b[1]-a[1])*t1]);}}
  for(let i=1;i<segs.length;i++){segs[i][0]=segs[i-1][2];segs[i][1]=segs[i-1][3];}
  F.bolts.push({segs,col,life,max:life});}
function boom(x,y,r,col){ring(x,y,2,r,col,.3);ring(x,y,1,r*.6,'#ffcd75',.25);SFX.play('boom');F.shake=Math.max(F.shake,2);
  for(let i=0;i<16;i++){const a=Math.random()*6.28,s=rnd(20,70);part(x,y,Math.cos(a)*s,Math.sin(a)*s,rnd(.2,.5),Math.random()<.5?col:'#ffcd75',2);}}
function pline(x,x0,y0,x1,y1,col){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))|0;x.fillStyle=col;for(let i=0;i<=n;i++){const t=n?i/n:0;x.fillRect(Math.round(x0+(x1-x0)*t),Math.round(y0+(y1-y0)*t),1,1);}}
function pcircle(x,cx,cy,r,col){x.fillStyle=col;const n=Math.max(12,Math.floor(r*4));for(let i=0;i<n;i++){const a=i/n*6.283;x.fillRect(Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r*.6),1,1);}}
function drawNum(x,str,cx,cy,col,s){
  const w=str.length*5*s-s;const px=Math.round(cx-w/2);const py=Math.round(cy);
  const offs=[[-1,0],[1,0],[0,-1],[0,1],[1,1]];
  for(const pass of[0,1]){x.fillStyle=pass?col:'#1a1c2c';const list=pass?[[0,0]]:offs;
    for(const[ox,oy]of list){let qx=px;for(const chh of str){const g=DIG[chh]||DIG['0'];
      for(let r=0;r<6;r++)for(let q=0;q<4;q++)if(g[r*4+q]==='1')x.fillRect(qx+q*s+ox*s,py+r*s+oy*s,s,s);qx+=5*s;}}}
}
function drawField(dt){
  const x=F.ctx,W=F.W,H=F.H;if(!x)return;
  x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,W,H);
  if(F.shake>0&&!RM){x.translate(Math.round(rnd(-1,1)*F.shake),Math.round(rnd(-1,1)*F.shake));}
  F.shake=Math.max(0,F.shake-dt*18);
  x.fillStyle='#0a0c14';x.fillRect(-4,-4,W+8,H+8);if(F.ground)x.drawImage(F.ground,0,0);
  // 危险区
  let danger=0;if(B)for(const e of B.en)if(e.y>.72)danger=Math.max(danger,(e.y-.72)/.28);
  if(danger>0){for(let i=0;i<12;i++){x.fillStyle=`rgba(228,59,68,${(.18*danger*(1-i/12)).toFixed(3)})`;x.fillRect(0,WALLY()-i*3-3,W,3);}}
  // 城墙
  const wy=WALLY();
  x.fillStyle='#2a2130';x.fillRect(0,wy,W,7);
  for(let r=0;r<2;r++)for(let bx=(r?-4:0);bx<W;bx+=8){x.fillStyle='#7d6a5a';x.fillRect(bx+1,wy+1+r*3,7,2);x.fillStyle='#9c8670';x.fillRect(bx+1,wy+1+r*3,7,1);}
  for(let bx=0;bx<W;bx+=6){x.fillStyle='#7d6a5a';x.fillRect(bx,wy-2,4,2);x.fillStyle='#2a2130';x.fillRect(bx,wy-3,4,1);}
  if(F.wallFlash>0){x.fillStyle=`rgba(255,60,60,${(F.wallFlash*1.4).toFixed(3)})`;x.fillRect(0,wy-3,W,10);F.wallFlash-=dt;}
  {const ry=Math.round(F.top+RANGE*(WALLY()-2-F.top));for(let xx=0;xx<W;xx+=6){x.fillStyle='rgba(255,209,102,.22)';x.fillRect(xx,ry,3,1);}}
  if(B&&B.shield>0){const a=.35+.2*Math.sin(performance.now()/150);x.fillStyle=`rgba(143,227,255,${a.toFixed(3)})`;x.fillRect(0,wy-5,W,1);x.fillRect(0,wy-7,W,1);}
  if(B){for(let xx=0;xx<W;xx+=2){const f=Math.sin(xx*.3+performance.now()/300)+Math.sin(xx*.11-performance.now()/500);if(f>.6){x.fillStyle=f>1.2?'#c38cff':'#5d275d';x.fillRect(xx,F.top+(f>1.2?1:0),2,1);}}}
  if(B){
    const now=B.t;
    {const fy=F.top+2,n=Math.floor(W/7),heat=.35+G.round*.08;let sd=G.round*131+7;const rr=()=>(sd=(sd*16807)%2147483647)/2147483647;
      for(let i=0;i<n;i++){const fx=Math.floor(i*7+rr()*5);if(rr()>heat)continue;const fl=Math.floor(2+rr()*3+Math.sin(now*9+i*1.7)*1.5);
        x.fillStyle='#e43b44';x.fillRect(fx,fy-fl,2,fl);x.fillStyle='#ffcd75';x.fillRect(fx,fy-Math.max(1,fl-1),1,Math.max(1,fl-2));
        if(Math.random()<.02*heat)part(fx,fy-fl,rnd(-3,3),-rnd(6,16),1.2,Math.random()<.5?'#ef7d57':'#566c86',1);}}
    const list=B.en.slice().sort((a,b)=>a.y-b.y);
    for(const s of list){if(!s.d.aura||s.y<-.02)continue;const R2=s.d.aura*K();const col=s.d.guard?'rgba(65,166,246,':s.d.haste?'rgba(228,59,68,':'rgba(126,232,162,';
      const pulse=.12+.08*Math.sin(now*4+s.ph);pcircle(x,ex(s),ey(s)-5,R2*(s.d.haste?.85+.15*Math.sin(now*6):1),col+pulse.toFixed(3)+')');
      if(s.d.guard)for(const o of list)if(o!==s&&o.armorB&&Math.hypot(ex(o)-ex(s),ey(o)-ey(s))<=R2&&Math.random()<.5){x.globalAlpha=.35;pline(x,ex(s),ey(s)-5,ex(o),ey(o)-5,'#41a6f6');x.globalAlpha=1;}}
    for(const e of list){
      const sp=SPR[e.sprK||e.d.spr],sc=e.d.sc,w=sp.w*sc,h=sp.h*sc;
      let bob=Math.round(Math.abs(Math.sin(now*7+e.ph))*-1);if(e.type==='slime'||e.type==='mini')bob=Math.round(Math.abs(Math.sin(now*6+e.ph))*-2);if(e.d.zig)bob=Math.round(Math.sin(now*14+e.ph));
      const age=now-(e.bornT||0);if(age<.4&&!e.d.fixed){x.globalAlpha=Math.max(.15,age/.4);}
      if(phased(e))x.globalAlpha=.22+.08*Math.sin(now*20);
      if(e.d.raise&&e.y>0)pcircle(x,ex(e),ey(e)-5,50*K(),`rgba(183,124,255,${(.1+.06*Math.sin(now*3+e.ph)).toFixed(3)})`);
      if(e.d.rage&&e.hp<e.maxHp*.5&&Math.random()<.3)part(ex(e)+rnd(-4,4),ey(e)-rnd(4,10),0,-rnd(10,25),.3,'#e43b44',1);
      if(e.d.bomb&&Math.random()<.3)part(ex(e)+3,ey(e)-11,rnd(-6,6),-rnd(5,15),.25,Math.random()<.5?'#fee761':'#ef7d57',1);
      const px=Math.round(ex(e)-w/2),py=Math.round(ey(e)-h+bob);
      x.fillStyle='rgba(0,0,0,.35)';x.fillRect(px+2,Math.round(ey(e))-1,w-4,2);
      if(e.d.boss){
        const a=.25+.15*Math.sin(now*5);pcircle(x,px+w/2,py+h/2,w*.7,`rgba(228,59,68,${a.toFixed(3)})`);}
      x.drawImage(sp.cv,px,py,w,h);x.globalAlpha=1;
      if(e.armorB){x.fillStyle='#41a6f6';x.fillRect(px-1,py+2,2,3);}if(e.hasteB&&Math.random()<.2)part(ex(e)+rnd(-3,3),ey(e),0,-rnd(5,15),.3,'#ef7d57',1);
      if(e.slowT>0||e.frzT>0){x.globalAlpha=e.frzT>0?.8:.35;x.drawImage(sp.ice,px,py,w,h);x.globalAlpha=1;}
      if(e.vulnT>0){x.fillStyle='#ff5a8a';x.fillRect(Math.round(px+w/2)-1,Math.round(py)-4,3,3);x.fillStyle='#fff';x.fillRect(Math.round(px+w/2),Math.round(py)-3,1,1);}
      if(e.hardT>0){x.globalAlpha=.3+.2*Math.sin(now*20);x.drawImage(sp.white,px,py,w,h);x.globalAlpha=1;}
      if(e.flash>0){x.globalAlpha=Math.min(e.d.boss||e.d.elite?.35:.8,e.flash*14);x.drawImage(sp.white,px,py,w,h);x.globalAlpha=1;}
      if(e.d.intents&&e.it<1.2&&Math.floor(now*10)%2){x.strokeStyle='#ff5a5a';x.lineWidth=1;x.strokeRect(px-2.5,py-2.5,w+5,h+5);}
      if(!e.d.boss&&(e.hp<e.maxHp||e.shield>0)){const bw=Math.max(8,w-2);x.fillStyle='#1a1c2c';x.fillRect(px+(w-bw)/2-1,py-4,bw+2,3);
        x.fillStyle='#e43b44';x.fillRect(px+(w-bw)/2,py-3,Math.max(0,Math.round(bw*e.hp/e.maxHp)),1);
        if(e.shield>0){x.fillStyle='#dfe6ee';x.fillRect(px+(w-bw)/2,py-4,Math.min(bw,Math.round(bw*e.shield/e.maxHp)),1);}}
      if(e.armor>0&&!e.d.boss&&!e.d.elite){x.fillStyle='#94b0c2';x.fillRect(px+w-2,py+1,2,2);}
    }
    for(const r of B.epr){const k=Math.min(1,r.t/r.dur);const px=Math.round(r.x0+(r.x1-r.x0)*k),py=Math.round(r.y0+(r.y1-r.y0)*k-Math.sin(k*Math.PI)*30*K());
      x.fillStyle='#1a1c2c';x.fillRect(px-2,py-2,4,4);x.fillStyle='#94b0c2';x.fillRect(px-1,py-1,2,2);if(Math.random()<.4)part(px,py,0,0,.3,'#566c86',1);}
    for(const p of B.pr){
      if(p.kind==='knife'){const vx=p.vx||0,vy=p.vy||-1;pline(x,p.x-vx*5,p.y-vy*5,p.x,p.y,'#f4f4f4');x.fillStyle='#94b0c2';x.fillRect(Math.round(p.x-vx*6),Math.round(p.y-vy*6),1,1);}
      else if(p.kind==='arrow'){const vx=p.vx||0,vy=p.vy||-1;pline(x,p.x-vx*7,p.y-vy*7,p.x,p.y,'#c28a4d');x.fillStyle='#f4f4f4';x.fillRect(Math.round(p.x),Math.round(p.y),1,1);}
      else if(p.kind==='spark'){x.fillStyle='#ef7d57';x.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,3,3);x.fillStyle='#fee761';x.fillRect(Math.round(p.x),Math.round(p.y),1,1);}
      else if(p.kind==='ice'){x.fillStyle='#41a6f6';x.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,3,3);x.fillStyle='#f4f4f4';x.fillRect(Math.round(p.x),Math.round(p.y),1,1);}
      else if(p.kind==='fly'){const px=Math.round(p.x),py=Math.round(p.y);x.fillStyle='#a7f070';x.fillRect(px-1,py-1,3,3);x.fillStyle='#fee761';x.fillRect(px,py,1,1);if(Math.random()<.5)part(p.x,p.y,rnd(-5,5),rnd(-5,5),.3,'#a7f070',1);}
      else if(p.kind==='rock'){x.fillStyle='#566c86';x.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,3,3);x.fillStyle='#94b0c2';x.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,1,1);}
      else if(p.kind==='axe'){const f=Math.floor(p.age*24)%4;const px=Math.round(p.x),py=Math.round(p.y);x.fillStyle='#1a1c2c';x.fillRect(px-2,py-2,5,5);x.fillStyle='#dfe6ee';
        if(f%2){x.fillRect(px-2,py,5,1);x.fillRect(px,py-2,1,2);}else{x.fillRect(px,py-2,1,5);x.fillRect(px+1,py,2,1);}x.fillStyle='#c28a4d';x.fillRect(px,py,1,1);}
      else if(p.kind==='meteor'){x.fillStyle='#ff5a2a';x.fillRect(Math.round(p.x)-3,Math.round(p.y)-3,6,6);x.fillStyle='#fee761';x.fillRect(Math.round(p.x)-2,Math.round(p.y)-2,4,4);x.fillStyle='#fff';x.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,2,2);}
      else if(p.kind==='shell'){x.fillStyle='#1a1c2c';x.fillRect(Math.round(p.x)-2,Math.round(p.y)-2,4,4);x.fillStyle='#566c86';x.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,2,2);}
    }
  }
  for(const r of F.rings){r.life-=dt;const k=1-r.life/r.max;x.globalAlpha=Math.max(0,r.life/r.max);pcircle(x,r.x,r.y,r.r0+(r.r1-r.r0)*k,r.col);x.globalAlpha=1;}
  F.rings=F.rings.filter(r=>r.life>0);
  for(const b of F.bolts){b.life-=dt;const col=Math.floor(b.life*40)%2?b.col:'#ffffff';for(const s of b.segs)pline(x,s[0],s[1],s[2],s[3],col);}
  F.bolts=F.bolts.filter(b=>b.life>0);
  x.globalCompositeOperation='lighter';
  for(const p of F.parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=60*dt;x.fillStyle=p.col;x.globalAlpha=Math.min(1,p.life/p.max*1.5);x.fillRect(Math.round(p.x),Math.round(p.y),p.sz,p.sz);}
  x.globalAlpha=1;x.globalCompositeOperation='source-over';F.parts=F.parts.filter(p=>p.life>0);
  for(const n of F.nums){n.life-=dt;n.y-=(n.life>.5?28:6)*dt;if(n.life<.2&&Math.floor(n.life*30)%2)continue;drawNum(x,n.str,n.x,n.y,n.col,n.s);}
  F.nums=F.nums.filter(n=>n.life>0);
}

/* ================= 界面层特效 ================= */
const FX=(function(){
  const cv=$('#fx');const x=cv.getContext('2d');let items=[];let dpr=1;
  function size(){dpr=Math.min(2,devicePixelRatio||1);cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;x.setTransform(dpr,0,0,dpr,0,0);x.imageSmoothingEnabled=false;}
  size();addEventListener('resize',size);
  const ctr=el=>{const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+14];};
  return{
    link(a,b,col,life){if(!a||!b)return;const[x0,y0]=ctr(a),[x1,y1]=ctr(b);const pts=[];const n=8;for(let i=0;i<=n;i++){const t=i/n;pts.push([x0+(x1-x0)*t,y0+(y1-y0)*t-Math.sin(t*Math.PI)*16+(i&&i<n?rnd(-4,4):0)]);}
      items.push({k:'link',pts,col,life:life||.3,max:life||.3});},
    burst(cx,cy,col,n){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=rnd(60,200);items.push({k:'p',x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,col:Math.random()<.3?'#ffffff':col,life:rnd(.35,.7),max:.7});}},
    coins(cx,cy,n){const t=$('#goldChip').getBoundingClientRect();for(let i=0;i<n;i++)items.push({k:'coin',x0:cx+rnd(-10,10),y0:cy+rnd(-10,10),x1:t.left+18,y1:t.top+t.height/2,t:-i*.06,dur:.55});},
    draw(dt){x.clearRect(0,0,innerWidth,innerHeight);
      for(const it of items){
        if(it.k==='p'){it.life-=dt;it.x+=it.vx*dt;it.y+=it.vy*dt;it.vy+=400*dt;x.globalAlpha=Math.max(0,it.life/it.max);x.fillStyle=it.col;x.fillRect(Math.round(it.x),Math.round(it.y),4,4);}
        else if(it.k==='link'){it.life-=dt;x.globalAlpha=Math.max(0,it.life/it.max);x.strokeStyle=it.col;x.lineWidth=3;x.lineJoin='miter';x.beginPath();it.pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke();
          x.strokeStyle='#fff';x.lineWidth=1;x.stroke();}
        else if(it.k==='coin'){it.t+=dt;if(it.t<0)continue;const k=Math.min(1,it.t/it.dur),e=k*k*(3-2*k);const px=it.x0+(it.x1-it.x0)*e,py=it.y0+(it.y1-it.y0)*e-Math.sin(k*Math.PI)*40;
          x.globalAlpha=1;x.drawImage(SPR.coin.cv,Math.round(px-8),Math.round(py-8),16,16);if(k>=1)it.life=-1;else it.life=1;}
      }
      x.globalAlpha=1;items=items.filter(it=>it.life>0||(it.k==='coin'&&it.t<0));}
  };
})();

/* ================= 流程 ================= */
function winBattle(){
  B.over=true;G.phase='report';$('#bossbar').hidden=true;
  G.bestChain=Math.max(G.bestChain,B.maxChain);SFX.play('win');say('hero',BARKS.win,2);
  if(G.run){G.run.kills+=B.kills;G.run.maxHit=Math.max(G.run.maxHit,B.maxHit);G.run.maxCombo=Math.max(G.run.maxCombo,B.maxCombo);}if(B.kills>=150)unlock('kills150');
  for(const c of G.cards)if(c.adj==='hoard')c.hoard++;
  for(const c of boardCards()){const w=ITEMS[c.key].onWin;if(w)w(c);}
  finishQuests();
  for(const c of G.cards){c.charge=0;c.el.style.setProperty('--s',0);c.el.classList.remove('frozen','empty','haste');c.ammo=maxAmmo(c);setAmmo(c);}
  const was=G.round;
  if(was>=G.maxRound){if(B.wager&&G.run)G.run.wagers++;runWon();banner('黎明','#ffe79a');BG.set('shop');setTimeout(()=>playStory(STORY.win,()=>endScreen(true)),1400);return;}
  updateHUD();const winG=3+Math.floor(was/2)-(heat(6)?1:0);const rows=[['守夜工钱',winG]];if(was===4)rows.push(['打倒精英',4]);
  const interest=Math.min(3+mv('interest'),Math.floor(G.gold/6));if(mv('winGold'))rows.push(['遗物/天赋',mv('winGold')]);if(mv('regen'))G.wall=Math.min(G.wallMax,G.wall+mv('regen'));if(interest)rows.push(['利息（每6金+1）',interest]);
  if(B.wallLost===0)rows.push(['墙没掉砖',1]);
  if(B.greed)rows.push(['贪婪（已到账）',0,B.greed]);
  rows.push(...wagerPay());
  const total=rows.reduce((s,r)=>s+r[1],0);
  showReport(was,rows,total);
}
function showReport(was,rows,total){
  const rp=$('#report');const bc=G.cards.filter(c=>c.bTrig>0).sort((a,b)=>b.bDmg-a.bDmg);const mx=Math.max(1,...bc.map(c=>c.bDmg));
  rp.innerHTML=`<div class="rp-title win">第${was}夜 · ${pickLine(RPT.win)}</div>
  <div class="rp-list">${bc.map((c,i)=>`<div class="rp-row" style="animation-delay:${i*.07}s;--tagc:${TAGC[ITEMS[c.key].tag]}"><img src="${SPR[c.key].url}" alt=""><span>${ITEMS[c.key].n}</span><div class="bar"><i data-w="${(c.bDmg/mx*100).toFixed(1)}"></i></div><b>${fmt(c.bDmg)}<small>×${c.bTrig}</small></b></div>`).join('')||'<div class="rp-meta">这一夜没有卡出手</div>'}</div>
  <div class="rp-meta">${(was+1)%2===1?'<b style="color:#ffd166">明晚之前有夜谈</b>　':''}最高连锁 <b>×${B.maxChain||1}</b>　击杀 <b>${B.kills}</b>　连杀 <b>${B.maxCombo}</b>　城墙 <b>-${Math.ceil(B.wallLost)}</b></div>
  <div class="rp-cash" id="cash"></div>
  <button class="btn gold big" id="cashBtn" style="flex:none">收下 <img class="ico" src="${SPR.coin.url}" alt=""><b>${total}</b></button>`;
  rp.hidden=false;
  setTimeout(()=>rp.querySelectorAll('.bar i').forEach(i=>i.style.width=i.dataset.w+'%'),60);
  const cash=$('#cash');let i=0;
  const next=()=>{if(i<rows.length){const r=rows[i];cash.insertAdjacentHTML('beforeend',`<div class="cash-row"><span>${r[0]}</span><b>${r[3]||(r[2]?'+'+r[2]:'+'+r[1])}</b></div>`);SFX.play('coin');i++;setTimeout(next,220);}
    else{cash.insertAdjacentHTML('beforeend',`<div class="cash-row total"><span>合计</span><b>+${total}</b></div>`);}};
  setTimeout(next,400);
  $('#cashBtn').onclick=()=>{SFX.ensure();const r=$('#cashBtn').getBoundingClientRect();FX.coins(r.left+r.width/2,r.top,Math.min(total,10));G.gold+=total;G.round++;$('#report').hidden=true;nightStory(()=>toPrep());};
}
function loseBattle(){B.over=true;if(G.run)G.run.kills+=B.kills;G.phase='over';SFX.play('lose');G.bestChain=Math.max(G.bestChain,B.maxChain);banner(pickLine(RPT.fall),'#ff6b5b');setTimeout(()=>playStory(STORY.lose,()=>endScreen(false)),1400);}
function endScreen(win){
  const sc=$('#screen');BG.set(win?'shop':'over');
  const best=G.cards.slice().sort((a,b)=>b.bDmg-a.bDmg)[0];const R=G.run||freshRun();META.runs++;saveMeta();
  const got=R.got.map(id=>ACHM[id]).filter(Boolean);
  sc.innerHTML=`<div class="scr"><img class="por-big" src="${SPR[HEROES[G.hero].portrait].url}" alt=""><h1 style="color:${win?'#ffe79a':'#ff8a80'}">${win?'黎明到来':'长夜未尽'}</h1><div class="logo-sub">${HEROES[G.hero].n} · ${HEROES[G.hero].title}</div>
  <div class="rules res"><div><span>坚守到</span><i style="margin-left:auto">第 ${Math.min(G.round,8)} 夜 / 8</i></div>
  ${G.heat?`<div><span>难度</span><i style="margin-left:auto">长夜 ${G.heat}</i></div>`:''}
  <div><span>遗物 / 天赋</span><i style="margin-left:auto">${G.relics.length} 件 / ${G.skills.length} 个</i></div>
  <div><span>最高连锁</span><i style="margin-left:auto">×${G.bestChain||1}</i></div>
  <div><span>杀敌 / 最长连杀</span><i style="margin-left:auto">${R.kills} / ${R.maxCombo}</i></div>
  ${best?`<div><span>最后的王牌</span><i style="margin-left:auto">${best.adj?ADJ[best.adj].n+'的':''}${ITEMS[best.key].n} · ${TIERS[best.tier].n}</i></div>`:''}</div>
  ${R.newHeat?`<div class="newheat">解锁了 <b>长夜 ${R.newHeat}</b>：${HEATS[R.newHeat]}</div>`:''}
  ${got.length?`<div class="rules res achgot"><div><span>这局解锁的成就</span></div>${got.map(a=>`<div><i>★</i><span><b>${a.n}</b> ${a.d}</span></div>`).join('')}</div>`:''}
  <button class="btn red big" id="againBtn">再守一次</button></div>`;
  clearSave();sc.hidden=false;$('#againBtn').onclick=()=>{SFX.ensure();SFX.play('ui');sc.hidden=true;heroSelect();};
}
function titleScreen(){
  const sc=$('#screen');BG.set('title');
  sc.innerHTML=`<div class="scr"><div class="logo" aria-label="连锁"><span>连</span><span>锁</span></div><div class="logo-sub">PROJECT CHAIN · 原型</div>
  <p class="tagline">长夜第七百年。守住最后一道城墙，直到黎明。</p>
  <div class="rules"><div><i>1</i><span>每夜之前能走三个地方：逛店、开箱子、捡遗物……</span></div>
  <div><i>2</i><span>卡拖上棋盘就自己打，挨着的卡会互相带动</span></div>
  <div><i>3</i><span>两张同名同品质的卡合成一张更好的：铜→银→金→钻</span></div>
  <div><i>4</i><span>撑过8个夜晚，打倒深渊之眼；每两夜有一次夜谈，能学个新天赋</span></div></div>
  ${loadSave()?`<button class="btn gold big" id="contBtn">继续 · ${HEROES[loadSave().hero].n} 第${loadSave().round}夜</button>`:''}
  <button class="btn ${loadSave()?'alt':'red'} big" id="startBtn">${loadSave()?'新的守夜':'开始游戏'}</button>
  <button class="btn alt" id="achBtn">成就 ${achCount()} / ${ACH.length}${META.heatMax?' · 长夜 '+META.heatMax:''}</button></div>`;
  sc.hidden=false;$('#startBtn').onclick=()=>{SFX.ensure();SFX.play('merge');heroSelect();};
  $('#achBtn').onclick=()=>{SFX.ensure();openAch();};
  if($('#contBtn'))$('#contBtn').onclick=()=>{SFX.ensure();SFX.play('merge');sc.hidden=true;resumeSave();};
}
function heroSelect(){
  const sc=$('#screen');BG.set('title');
  sc.innerHTML=`<div class="scr"><h1 style="font-size:32px">选择守夜人</h1>${heatBar()}<div class="heroes">${Object.keys(HEROES).map(k=>{const H=HEROES[k];
    return `<button class="hero" data-h="${k}" style="--hc:${H.col}"><img class="por" src="${SPR[H.portrait].url}" alt=""><div class="hn"><b>${H.n}</b><small>${H.title}</small></div>
    <div class="htag">${H.tag}</div><div class="hstat"><span>城墙 <b>${H.wall}</b></span><span>金币 <b>${H.gold}</b></span></div><p>${H.desc}</p>
    <div class="hmeta"><div class="hcards">${H.start.map(s=>`<img src="${SPR[s[0]].url}" alt="${ITEMS[s[0]].n}">`).join('')}</div></div>
    <em>“${H.intro}”</em></button>`;}).join('')}</div></div>`;
  sc.hidden=false;bindHeat();
  sc.querySelectorAll('.hero').forEach(b=>b.onclick=()=>{SFX.ensure();SFX.play('merge');sc.hidden=true;newGame(b.dataset.h);});
}
const SAVEK='chain-demo-save-v4';
function saveGame(){try{localStorage.setItem(SAVEK,JSON.stringify({hero:G.hero,round:G.round,gold:G.gold,wall:G.wall,wallMax:G.wallMax,relics:G.relics,skills:G.skills,foeSet:G.foeSet,bestChain:G.bestChain,heat:G.heat||0,run:G.run,
  cards:G.cards.map(c=>({key:c.key,tier:c.tier,adj:c.adj,loc:c.loc,idx:c.idx,hoard:c.hoard,grow:c.grow||0,qp:c.qp||0}))}));}catch(e){}}
function loadSave(){try{const s=localStorage.getItem(SAVEK);return s?JSON.parse(s):null;}catch(e){return null;}}
function clearSave(){try{localStorage.removeItem(SAVEK);}catch(e){}}
function resumeSave(){const s=loadSave();if(!s||!HEROES[s.hero]){heroSelect();return;}
  for(const c of G.cards)if(c.el)c.el.remove();
  Object.assign(G,{hero:s.hero,round:s.round,gold:s.gold,wall:s.wall,wallMax:s.wallMax,foeSet:s.foeSet||'dark',relics:s.relics||[],skills:(s.skills||[]).filter(k=>TALENTS[k]),bestChain:s.bestChain||0,heat:s.heat||0,run:s.run||freshRun(),cards:[]});
  for(const d of s.cards||[]){if(!ITEMS[d.key])continue;const c=newCard(d.key,d.tier,d.adj);c.loc=d.loc;c.idx=d.idx;c.hoard=d.hoard||0;c.grow=d.grow||0;c.qp=d.qp||0;G.cards.push(c);}
  recalcMods();renderRelics();shownGold=null;renderOwned();updateHUD();toPrep();toast('接着上回：第'+G.round+'夜');}
function newGame(hero){
  for(const c of G.cards)if(c.el)c.el.remove();
  G.hero=hero||G.hero;const H=HEROES[G.hero];const hh=Math.min(META.heatSel||0,META.heatMax||0);const w0=Math.round(H.wall*(hh>=4?.85:1));
  Object.assign(G,{heat:hh,run:freshRun(),round:1,gold:H.gold,wall:w0,wallMax:w0,cards:[],relics:[],skills:[],bestChain:0,foeSet:pick(Object.keys(FOESETS))});recalcMods();renderRelics();
  for(const[k,t,i]of H.start){const c=newCard(k,t);c.loc='board';c.idx=i;G.cards.push(c);}
  shownGold=null;renderOwned();updateHUD();
  G.firstPrep=true;playStory(STORY.prologue,()=>nightStory(()=>toPrep()));
}

/* ================= 布局与主循环 ================= */
function layout(){
  const avail=Math.min(440,innerWidth)-16-8;cw=Math.floor(avail/8);
  const vh=innerHeight;ch=Math.round(clamp(Math.min(cw*2,(vh-330)/2.6),70,104));
  document.documentElement.style.setProperty('--cw',cw+'px');document.documentElement.style.setProperty('--ch',ch+'px');
  buildCells();renderOwned();requestAnimationFrame(resizeField);
}
addEventListener('resize',layout);
$('#goBtn').onclick=()=>{SFX.ensure();if(G.phase==='prep'&&G.prep.step>=3)startBattle();};
$('#bagBtn').onclick=()=>{SFX.ensure();SFX.play('ui');if(G.phase!=='battle')setDrawer(!G.drawer);else toast('打着仗呢，没空翻包');};
$('#treeBtn').onclick=()=>{SFX.ensure();openTree();};
$('#relicBtn').onclick=()=>{SFX.ensure();openBag();};
$('#speedBtn').onclick=()=>{SFX.ensure();SFX.play('ui');G.speed=G.speed>=3?1:G.speed+1;updateHUD();};
$('#muteBtn').onclick=()=>{SFX.ensure();const m=SFX.toggle();$('#muteBtn').textContent=m?'♪ 关':'♪ 开';};
let lastT=performance.now();
function loop(now){
  const dtR=Math.min(.05,(now-lastT)/1000);lastT=now;
  if(G.phase==='battle'&&B&&!B.over){
    let sm=1;if(B.slowT>0){B.slowT-=dtR;sm=.3;}
    B.acc+=dtR*G.speed*sm;const step=1/60;let n=0;const cap=G.speed>3?40:12;
    while(B.acc>=step&&n<cap){simStep(step);B.acc-=step;n++;if(B.over)break;}
    if(n>=cap)B.acc=0;
    if(B&&!B.over)for(const c of boardCards())c.el.style.setProperty('--s',(1-Math.min(1,c.charge)).toFixed(3));
    if(B&&B.boss){const e=B.boss;$('#bossHp').style.width=(Math.max(0,e.hp)/e.maxHp*100).toFixed(1)+'%';$('#bossSh').style.width=Math.min(100,e.shield/e.maxHp*100).toFixed(1)+'%';
      $('#bossHpT').textContent=fmt(Math.max(0,e.hp))+' / '+fmt(e.maxHp)+(e.armor+(e.hardT>0?10:0)?'  护甲'+(e.armor+(e.hardT>0?10:0)):'');
      const it=e.d.intents[e.ii];$('#intName').textContent=it.n+'：'+it.d;$('#intT').textContent=Math.max(0,e.it).toFixed(1)+'s';
      $('#intBar').style.width=(100-Math.max(0,e.it)/it.t*100).toFixed(1)+'%';$('#intentBox').classList.toggle('hot',e.it<1.2);}
    if(B&&B.shield>0)updateHUD();
  }
  if(G.phase==='battle'||G.phase==='report'||G.phase==='over')drawField(dtR*(G.phase==='battle'?G.speed:1));
  FX.draw(dtR);
  requestAnimationFrame(loop);
}
layout();titleScreen();requestAnimationFrame(loop);
window.__game={heroSelect,setDrawer,openTree,G,get B(){return B;},startBattle,acquire,toPrep,newGame,boardCards,newCard,afterChange,renderPreview,makeWave,enterEvent,finishStep,renderRelics,gainRelic,rollGear};
})();
</script>
</body>
</html>
