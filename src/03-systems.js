
/* ================= 背景着色器（旋涡） ================= */
const BG=(function(){
  const cv=$('#bg');let gl=null;
  try{gl=cv.getContext('webgl',{antialias:false});}catch(e){gl=null;}
  const PALS={
    title:[[.78,.22,.2],[.05,.38,.62],[.05,.08,.1]],
    shop:[[.12,.5,.38],[.85,.6,.2],[.03,.1,.09]],
    battle:[[.4,.15,.4],[.12,.32,.58],[.04,.03,.08]],
    boss:[[.78,.12,.14],[.32,.04,.2],[.05,.01,.03]],
    over:[[.3,.3,.36],[.5,.14,.14],[.05,.05,.07]]
  };
  let cur=PALS.title.map(a=>a.slice()),tgt=PALS.title;
  if(!gl){cv.style.background='radial-gradient(circle at 50% 40%,#2a4a4a,#0f1c20)';return{set(){}};}
  const vs='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const fs=`precision mediump float;uniform vec2 R;uniform float T;uniform vec3 A;uniform vec3 B;uniform vec3 C;
  void main(){vec2 uv=(gl_FragCoord.xy-.5*R)/min(R.x,R.y);float r=length(uv);float a=atan(uv.y,uv.x);
  a+=T*.07+(1.7-r)*1.9;vec2 p=vec2(cos(a),sin(a))*r*3.2;
  for(int i=0;i<4;i++){float f=float(i);p+=.6*vec2(sin(p.y*1.2+T*.33+f),cos(p.x*1.1-T*.26-f));}
  float v=.5+.5*sin(p.x*.9+p.y*.7);float w=.5+.5*sin(length(p)*1.4-T*.4);
  vec3 col=mix(C,A,smoothstep(.15,.85,v));col=mix(col,B,smoothstep(.45,1.,w)*.7);
  col*=.72+.3*(1.-r*.7);gl_FragColor=vec4(col,1.);}`;
  function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o;}
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){cv.style.background='#16282c';return{set(){}};}
  gl.useProgram(pr);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const U={R:gl.getUniformLocation(pr,'R'),T:gl.getUniformLocation(pr,'T'),A:gl.getUniformLocation(pr,'A'),B:gl.getUniformLocation(pr,'B'),C:gl.getUniformLocation(pr,'C')};
  function size(){cv.width=Math.max(40,Math.ceil(innerWidth/5));cv.height=Math.max(40,Math.ceil(innerHeight/5));gl.viewport(0,0,cv.width,cv.height);}
  size();addEventListener('resize',size);
  const t0=performance.now();
  function frame(now){
    const t=(now-t0)/1000*(RM?.12:1);
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)cur[i][j]+=(tgt[i][j]-cur[i][j])*.03;
    gl.uniform2f(U.R,cv.width,cv.height);gl.uniform1f(U.T,t);
    gl.uniform3fv(U.A,cur[0]);gl.uniform3fv(U.B,cur[1]);gl.uniform3fv(U.C,cur[2]);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return{set(n){if(PALS[n])tgt=PALS[n];}};
})();

/* ================= 音效 ================= */
const SFX=(function(){
  let ac=null,muted=false;const last={};
  function ensure(){if(!ac){try{ac=new(window.AudioContext||window.webkitAudioContext)();}catch(e){ac=null;}}if(ac&&ac.state==='suspended')ac.resume();}
  function tone(f,d,type,vol,slide,delay){if(!ac||muted)return;const t=ac.currentTime+(delay||0);const o=ac.createOscillator(),g=ac.createGain();
    o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);
    g.gain.setValueAtTime(vol||.04,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}
  function noise(d,vol){if(!ac||muted)return;const n=Math.floor(ac.sampleRate*d);const b=ac.createBuffer(1,n,ac.sampleRate);const a=b.getChannelData(0);
    for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const s=ac.createBufferSource();s.buffer=b;const g=ac.createGain();g.gain.value=vol;s.connect(g);g.connect(ac.destination);s.start();}
  const TP={'刃':520,'火':300,'电':660,'冰':780,'机':220,'毒':440};
  function play(k,p){if(!ac||muted)return;const now=performance.now();const lk=k==='echo'?k+p:k;if(last[lk]&&now-last[lk]<(k==='hit'?60:40))return;last[lk]=now;
    switch(k){
      case'fire':tone(TP[p]||400,.05,'square',.018,1.4);break;
      case'hit':tone(140,.05,'square',.015,.6);break;
      case'crit':tone(990,.09,'square',.035,.5);tone(1480,.06,'triangle',.03,1,.03);break;
      case'kill':tone(260,.09,'triangle',.03,.35);break;
      case'coin':tone(988,.05,'square',.03);tone(1319,.1,'square',.03,1,.05);break;
      case'echo':tone(392*Math.pow(1.122,Math.min(p,12)),.09,'triangle',.045,1.25);break;
      case'pick':tone(500,.04,'square',.025,1.6);break;
      case'place':tone(300,.06,'square',.035,.7);break;
      case'buy':tone(660,.05,'square',.03);tone(990,.08,'square',.03,1,.05);break;
      case'sell':tone(880,.05,'square',.03);tone(587,.09,'square',.03,1,.05);break;
      case'merge':[523,659,784,1047].forEach((f,i)=>tone(f,.1,'square',.035,1,i*.06));break;
      case'hurt':noise(.18,.12);tone(90,.2,'sawtooth',.05,.5);break;
      case'boom':noise(.25,.1);tone(70,.25,'square',.05,.4);break;
      case'bell':tone(523,.6,'triangle',.05);tone(784,.5,'triangle',.03,1,.02);break;
      case'intent':tone(180,.25,'sawtooth',.04,1.8);break;
      case'win':[523,659,784,1047,1319].forEach((f,i)=>tone(f,.14,'square',.035,1,i*.08));break;
      case'lose':[392,330,262,196].forEach((f,i)=>tone(f,.25,'triangle',.05,1,i*.16));break;
      case'ui':tone(700,.03,'square',.02);break;
      case'bad':tone(160,.12,'square',.04,.8);break;
    }}
  return{ensure,play,toggle(){muted=!muted;return muted;}};
})();

/* ================= 状态 ================= */
const G={hero:'ayla',foeSet:'dark',skills:[],drawer:false,phase:'title',round:1,maxRound:8,gold:10,wall:25,wallMax:25,speed:1,cards:[],relics:[],
  prep:{step:0,cur:null,doors:[]},nextWave:null,bestChain:0,firstPrep:true};
let B=null;
let cw=46,ch=90;
let M={};function recalcMods(){M={};const add=m=>{for(const k in m)M[k]=(M[k]||0)+m[k];};for(const r of G.relics)add(RELICS[r].m);
  for(const s of G.skills)if(TALENTS[s])add(TALENTS[s].m);}
const mv=k=>M[k]||0;

function newCard(key,tier,adj){return{id:UID++,key,tier:tier==null?ITEMS[key].t:tier,adj:adj||null,size:ITEMS[key].size,loc:null,idx:-1,hoard:0,grow:0,qp:0,el:null,
  charge:0,mom:0,bDmg:0,bTrig:0,frozen:0,echoLog:[],nb:null,right:null,ox:0,anvil:false,dl:(Math.random()*-3.4).toFixed(2)};}
function zoneN(z){return z==='board'?8:4;}
function occ(z){const a=Array(zoneN(z)).fill(null);for(const c of G.cards)if(c.loc===z)for(let i=0;i<c.size;i++)a[c.idx+i]=c;return a;}
function fits(z,idx,size,ignore){const n=zoneN(z);if(idx<0||idx+size>n)return false;const o=occ(z);for(let i=idx;i<idx+size;i++)if(o[i]&&o[i]!==ignore)return false;return true;}
function firstFit(size){for(const z of['board','stash'])for(let i=0;i+size<=zoneN(z);i++)if(fits(z,i,size))return{z,i};return null;}
function neighbors(c){if(c.loc!=='board')return[];const o=occ('board');const r=[];const L=o[c.idx-1],R=o[c.idx+c.size];if(L)r.push(L);if(R)r.push(R);return r;}
function rightOf(c){if(c.loc!=='board')return null;return occ('board')[c.idx+c.size]||null;}
function boardCards(){return G.cards.filter(c=>c.loc==='board').sort((a,b)=>a.idx-b.idx);}
function countSame(key,tier){return G.cards.filter(c=>c.key===key&&c.tier===tier).length;}
function stepOf(c){return Math.max(0,c.tier-ITEMS[c.key].t);}
function dmgMul(c){return UPS[ITEMS[c.key].up].d[stepOf(c)];}
function chainOf(c){return(ITEMS[c.key].chain||0)+stepOf(c)+mv('chain');}
function chargeAmt(c){return ITEMS[c.key].charge*[1,1.5,2,2.7][stepOf(c)];}

/* ---- 事件触发：卡牌 / 物品在数据里声明 on:{事件:(卡,上下文)=>{}}，引擎在对应时机 emit ---- */
function evOk(log,k,cap){const a=(log[k]=(log[k]||[]).filter(t=>t>B.t-1));if(a.length>=cap)return false;a.push(B.t);return true;}
function emit(ev,x){
  if(!B||B.over||G.phase!=='battle')return;x=x||{};
  for(const c of boardCards()){const h=ITEMS[c.key].on;if(!h||!h[ev]||c.frozen>0)continue;if(!evOk(c.evLog||(c.evLog={}),ev,8))continue;h[ev](c,x);if(B.over)return;}
  for(const r of new Set(G.relics)){const h=RELICS[r].on;if(!h||!h[ev])continue;if(!evOk(B.rlog,r+ev,8))continue;h[ev](G.relics.filter(y=>y===r).length,x);if(B.over)return;}
  for(const s of G.skills){const h=TALENTS[s]&&TALENTS[s].on;if(!h||!h[ev])continue;if(!evOk(B.rlog,'T'+s+ev,8))continue;h[ev](x);if(B.over)return;}
}
const kindOf=c=>ITEMS[c.key].kind||'';
function countKind(k,ex){return boardCards().filter(o=>o!==ex&&kindOf(o)===k).length;}
function countTag(t,ex){return boardCards().filter(o=>o!==ex&&ITEMS[o.key].tag===t).length;}
function maxAmmo(c){const a=ITEMS[c.key].ammo;return a==null?null:a+stepOf(c)+mv('ammo');}
function buffAmt(c){const it=ITEMS[c.key];let a=it.buff*(1+.2*stepOf(c))+(c.rage||0);if(it.buffKind)a+=it.buffKind.amt*countKind(it.buffKind.kind);return a;}
function growCard(c,v){c.grow=(c.grow||0)+v*(1+mv('t_photo'));if(c.el)setNum(c.el,c);}
function questN(c){const q=ITEMS[c.key].quest;return q?Math.ceil(q.n*(mv('t_map')?.5:1)):0;}
function questAdd(c,v){if(ITEMS[c.key].quest)c.qp=(c.qp||0)+(v||1);}
function finishQuests(){for(const c of G.cards){const q=ITEMS[c.key].quest;if(!q||(c.qp||0)<questN(c))continue;
  const from=ITEMS[c.key].n;c.key=q.into;c.qp=0;if(mv('t_map'))c.tier=Math.min(3,c.tier+1);repaint(c);toast('【任务完成】'+from+' 变成了 '+ITEMS[c.key].n);
  if(c.el)setTimeout(()=>{if(!c.el)return;restart(c.el,'merge');const r=c.el.getBoundingClientRect();FX.burst(r.left+r.width/2,r.top+r.height/2,'#ffd166',30);},60);}}
function stats(c,t){
  const it=ITEMS[c.key],a=c.adj,s=stepOf(c),U=UPS[it.up];
  const base=Math.round((it.dmg*U.d[s]+(it.dmg>0?(c.grow||0)+(c.stk||0):0))*10)/10;
  const flat=(a==='sharp'&&it.dmg>0)?4*it.size*(c.tier+1):0;
  const pct=[];
  if(a==='fervor')pct.push(['狂热',.3]);if(a==='heavy')pct.push(['沉重',.5]);
  if(a==='resonance'){const nb=c.nb||neighbors(c);const n=nb.filter(x=>ITEMS[x.key].tag===it.tag).length;if(n)pct.push(['共鸣×'+n,.25*n]);}
  const mp=(k,l)=>{const v=mv(k);if(v)pct.push([l,v]);};
  if(it.per&&c.loc==='board'){const P=it.per;let n=0;
    if(P.elem)n=new Set(boardCards().map(o=>ITEMS[o.key].tag)).size;else if(P.kind)n=countKind(P.kind,c);else if(P.tag)n=countTag(P.tag,c);
    if(n)pct.push([(P.elem?'元素':P.kind||P.tag)+'×'+n,P.pct*n]);}
  if(mv('t_alch')&&c.loc==='board'){const n=countKind('药剂');if(n)pct.push(['炼金手册×'+n,.04*n*mv('t_alch')]);}
  mp('dmg','加成');mp('tag_'+it.tag,'加成·'+it.tag);mp('s'+it.size,'加成·'+SIZEN[it.size]+'型');
  if(c.loc==='board'){const bc=boardCards();if(bc[0]===c)mp('left','最左');if(bc[bc.length-1]===c)mp('right','最右');
    if(mv('lonely')&&!(c.nb||neighbors(c)).length)mp('lonely','孤狼');if(mv('full')&&occ('board').every(Boolean))mp('full','满员');}
  const psum=pct.reduce((s,p)=>s+p[1],0);const mult=a==='deadly'?1.5:1;
  const total=(base+flat)*Math.max(.1,1+psum)*mult;
  let cd=it.cd*U.c[s];if(a==='twin')cd*=1.6;if(a==='heavy')cd*=1.3;
  let spd=1;if(a==='swift')spd+=.25;if(a==='momentum'&&c.mom)spd+=.05*c.mom;if(a==='rush'&&t!=null&&t<5)spd+=1;if(it.kind==='药剂'&&c.loc==='board'){const j=boardCards().filter(o=>ITEMS[o.key].kindHaste).length;if(j)spd+=.06*j*countKind('药剂');}
  if(mv('t_last')&&G.wall<G.wallMax*.35)spd+=.25;
  spd=Math.max(.3,spd+mv('spd'));
  return{base,flat,pct,psum,mult,total,cd:Math.max(.25,cd/spd),cdRaw:it.cd,crit:.05+(a==='precise'?.2:0)+mv('crit')};
}
function basePrice(k,adj,tier){return[3,6,10,16][tier]+(ITEMS[k].size-1)+(adj?[1,2,3][ADJ[adj].r]:0);}
function sellValue(c){return Math.max(1,Math.floor(basePrice(c.key,c.adj,c.tier)/2))+c.hoard;}

/* ================= 卡牌 DOM ================= */
function cardHTML(c){const it=ITEMS[c.key];const ad=c.adj?ADJ[c.adj]:null;
  return `<div class="inner" style="--dl:${c.dl||0}s"><div class="face"><div class="band"></div><div class="nm${cardName(c).length>3?' long':''}">${cardName(c)}</div><img class="spr" src="${SPR[c.key].url}" alt="${it.n}" draggable="false"><div class="num"></div>${it.ammo!=null?'<div class="am"></div>':''}<div class="cdv"></div><div class="holo"></div><div class="flash"></div></div><div class="tb">${TIERS[c.tier].n}</div>${ad?`<div class="adj">${ad.ch}</div>`:''}</div>`;}
function paintCard(el,c,extra){const it=ITEMS[c.key];const ad=c.adj?ADJ[c.adj]:null;const T=TIERS[c.tier];
  el.className='card s'+c.size+' t'+c.tier+(ad&&ad.r===2?' rare':'')+(extra?' '+extra:'');
  el.style.setProperty('--sz',c.size);el.style.setProperty('--tagc',TAGC[it.tag]);el.style.setProperty('--ac',ad?ad.c:'transparent');
  el.style.setProperty('--tc',T.c);el.style.setProperty('--tbg',T.bg);
  el.innerHTML=cardHTML(c);setNum(el,c);if(it.ammo!=null){const a=el.querySelector('.am');if(a)a.textContent='弹'+(c.ammo!=null&&G.phase==='battle'?c.ammo:maxAmmo(c));}}
function numText(c){const it=ITEMS[c.key];if(it.numT)return it.numT(c);if(it.charge)return'+'+Math.round(chargeAmt(c)*100)+'%';if(it.buff)return'+50%';if(it.prism)return'+25%';if(it.chargeSmall)return'+'+Math.round(it.chargeSmall*(1+.25*stepOf(c))*100)+'%';if(it.horn)return'齐鸣';const v=Math.round(stats(c,null).total);return v>=10000?(v/1000).toFixed(1)+'k':String(v);}
function setNum(el,c){const n=el.querySelector('.num');if(n)n.textContent=numText(c);}
function renderOwned(){
  for(const c of G.cards){
    if(!c.el){c.el=document.createElement('div');paintCard(c.el,c);bindCard(c);}
    const parent=c.loc==='board'?$('#board'):$('#stash');
    if(c.el.parentNode!==parent)parent.appendChild(c.el);
    c.el.style.left=(4+c.idx*cw+2)+'px';
  }
  for(const c of G.cards)setNum(c.el,c);
}
function repaint(c){if(c.el)paintCard(c.el,c,c.el.classList.contains('frozen')?'frozen':'');}
function bindCard(c){c.el.addEventListener('pointerdown',e=>onDown(e,{kind:'own',card:c,el:c.el}));}
function removeCard(c){G.cards=G.cards.filter(x=>x!==c);if(c.el)c.el.remove();}
function restart(el,cls){el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);}
function buildCells(){
  for(const z of['board','stash']){const el=$('#'+z);el.querySelectorAll('.cell').forEach(x=>x.remove());
    for(let i=0;i<zoneN(z);i++){const d=document.createElement('div');d.className='cell';d.dataset.i=i;d.style.left=(4+i*cw+2)+'px';el.insertBefore(d,el.firstChild);}}
}
function cells(z){return[...$('#'+z).querySelectorAll('.cell')].sort((a,b)=>a.dataset.i-b.dataset.i);}

/* ================= HUD ================= */
let shownGold=null;
function updateHUD(){
  $('#roundV').textContent=Math.min(G.round,G.maxRound);
  const rc=$('#roundChip');rc.classList.toggle('elite',G.round===4);rc.classList.toggle('boss',G.round===8);
  if(shownGold!==G.gold){if(shownGold!==null)restart($('#goldChip'),'bump');shownGold=G.gold;}
  $('#goldV').textContent=G.gold;
  $('#hpV').textContent=Math.max(0,Math.ceil(G.wall));
  $('#shV').textContent=B&&B.shield>0&&G.phase==='battle'?'+'+Math.ceil(B.shield):'';
  $('#speedBtn').textContent=G.speed+'×';
  const sc=G.cards.filter(c=>c.loc==='stash').length;$('#bagN').textContent=sc?sc:'';$('#bagBtn').classList.toggle('on',G.drawer);
  $('#treeN').textContent=G.skills.length||'';
  const go=$('#goBtn');
  if(G.phase==='prep'){const s=G.prep.step;go.disabled=s<3;go.textContent=s<3?'备战 '+s+'/3':'开战';}
  else if(G.phase==='battle'){go.disabled=true;go.textContent='战斗中';}
  else if(G.phase==='report'){go.disabled=true;go.textContent='结算';}
  else{go.disabled=true;go.textContent='开始战斗';}
  document.querySelectorAll('.offer').forEach(o=>{const p=o.querySelector('.price');if(p&&+p.dataset.p>0)p.classList.toggle('cant',+p.dataset.p>G.gold);});
}
function renderRelics(fresh){
  $('#relicN').textContent=G.relics.length||'';if(fresh)restart($('#relicBtn'),'bump');}
function openBag(){SFX.play('ui');const sh=$('#sheet');const cnt={};G.relics.forEach(r=>cnt[r]=(cnt[r]||0)+1);
  const ids=Object.keys(cnt).sort((a,b)=>RELICS[b].t-RELICS[a].t);
  sh.innerHTML=`<div class="sh" role="dialog" aria-label="遗物"><h3>遗物 <small class="spn">${G.relics.length} 件</small></h3>
    ${ids.length?`<div class="tlist">${ids.map(r=>{const R0=RELICS[r],c=GT[R0.t].c;return `<button class="trow relrow" data-r="${r}" style="--gc:${c}"><img class="ricon" src="${icon(R0.ico).url}" alt=""><div><b>${R0.n}${cnt[r]>1?' ×'+cnt[r]:''}<small class="gt">${GT[R0.t].n}</small></b><span class="mods">${modText(R0.m)}</span></div></button>`;}).join('')}</div>
    <div class="stat"><div><span>加起来</span><span></span></div><div class="mods">${modText(M)}</div></div>`:'<p class="muted2">还两手空空。遗物祭坛、杂货铺、熔炉都能弄到。</p>'}
    <div class="sh-btns"><button class="btn" id="bClose">关闭</button></div></div>`;
  sh.hidden=false;$('#bClose').onclick=closeSheet;sh.onclick=e=>{if(e.target===sh)closeSheet();};
  sh.querySelectorAll('.relrow').forEach(el=>el.onclick=()=>openRelicSheet(el.dataset.r));}
function toast(msg){const t=$('#toast');t.textContent=msg;restart(t,'show');}
function banner(msg,col){const b=$('#banner');b.textContent=msg;b.style.color=col||'#fff';restart(b,'show');}

/* ================= 卡牌生成 ================= */
function rollAdj(key,force,exclude,maxTier){
  if(!force&&Math.random()>.12)return null;
  const r=Math.random();const rare=.06+.025*G.round;const unc=.3;
  let tier=r<rare?2:r<rare+unc?1:0;
  if(maxTier!==undefined)tier=Math.min(tier,maxTier);
  let pool=Object.keys(ADJ).filter(k=>ADJ[k].r===tier);
  if(ITEMS[key].dmg===0)pool=pool.filter(k=>ADJ_NODMG.includes(k));
  if(exclude)pool=pool.filter(k=>k!==exclude);
  if(!pool.length)pool=ADJ_NODMG.filter(k=>k!==exclude);
  return pick(pool);
}
function rollItem(filter){
  const R=G.round;const pool=[];
  for(const k in ITEMS){const it=ITEMS[k];if(it.noPool||(it.hero&&it.hero!==G.hero))continue;if(filter&&!filter(it))continue;if(it.t===2&&R<2)continue;
    const w=(it.size===1?4:it.size===2?3:R>=4?2.5:1.3)*(it.hero?1.4:1);pool.push([k,w]);}
  if(!pool.length)return pick(Object.keys(ITEMS).filter(k=>!ITEMS[k].noPool&&!ITEMS[k].hero));
  let t=Math.random()*pool.reduce((a,b)=>a+b[1],0);for(const[k,w]of pool){t-=w;if(t<=0)return k;}return pool[0][0];
}
function makeOffer(filter,opt){opt=opt||{};
  const key=rollItem(filter);let tier=ITEMS[key].t;
  if(opt.black||Math.random()<(G.round>=5?.18:G.round>=3?.08:0))tier=Math.min(opt.free?2:3,tier+1);
  const adj=rollAdj(key,!!opt.black);
  let price=basePrice(key,adj,tier);if(opt.black)price=Math.round(price*1.5);if(opt.free)price=0;
  return{card:{key,tier,adj,size:ITEMS[key].size,dl:0,hoard:0},price,sold:false};
}

/* ================= 备战：随机事件 ================= */
function toPrep(){if(typeof saveGame==='function')setTimeout(saveGame,0);
  G.phase='prep';B=null;BG.set('shop');$('#report').hidden=true;$('#bossbar').hidden=true;F.cv.style.display='none';
  G.prep={step:0,cur:null,doors:[],talk:G.round%2===1};G.nextWave=makeWave(G.round);
  for(const c of G.cards){if(c.el)c.el.style.setProperty('--s',0);c.nb=null;c.right=null;}
  rollDoors();renderPreview();$('#prep').hidden=false;renderPrep();renderOwned();updateHUD();
  if(G.firstPrep&&!G.prep.talk){G.firstPrep=false;setTimeout(()=>toast('每夜之前能走三个地方，挑着去'),500);}
}
function rollDoors(){
  const R=G.round,P=G.prep;
  const ids=Object.keys(EVENTS).filter(id=>{const e=EVENTS[id];return(!e.minR||R>=e.minR)&&(!e.need||e.need());});
  const isRare=i=>EVENTS[i].cat==='rare';const out=[];
  if(R===1&&P.step===0)out.push('shop','field');
  while(out.length<3){const pool=ids.filter(i=>!out.includes(i)&&!(isRare(i)&&(P.rare||out.some(isRare))));if(!pool.length)break;
    let t=Math.random()*pool.reduce((s,i)=>s+EVENTS[i].w,0);let got=null;for(const i of pool){t-=EVENTS[i].w;if(t<=0){got=i;break;}}out.push(got||pool[pool.length-1]);}
  if(!out.some(i=>EVENTS[i].cat==='shop'||EVENTS[i].cat==='free'))out[out.findIndex(i=>!isRare(i))]='shop';
  if(out.some(isRare))P.rare=1;
  P.doors=out.sort(()=>Math.random()-.5);
}
function renderPreview(){
  const w=G.nextWave;const cnt={};w.forEach(s=>cnt[s.type]=(cnt[s.type]||0)+1);
  const R=G.round;$('#pvTitle').textContent=nightInfo(R).title;
  $('#pvList').innerHTML=Object.keys(cnt).map(k=>{const d=EN[k];return `<span class="pv${d.elite||d.boss?' elite':''}"><img src="${SPR[d.spr].url}" alt="">${d.elite||d.boss?d.n:'×'+cnt[k]}</span>`;}).join('');
  const boss=Object.keys(cnt).map(k=>EN[k]).find(d=>d.intents);
  const tough=Object.keys(cnt).map(k=>EN[k]).filter(d=>d.tip).sort((a,b)=>b.hp*(1+b.armor)-a.hp*(1+a.armor))[0];
  $('#pvNote').innerHTML=boss?boss.intents.map(t=>`【${t.n}】${t.d}`).join('<br>'):tough?`${tough.n}：${tough.tip}`:'';
}
function evHead(e){return `<div class="ev-head cat-${e.cat}"><img src="${icon(e.ico).url}" alt=""><div><b>${e.n}</b><em>${e.f}</em></div></div>`;}
function btnRow(defs){const row=document.createElement('div');row.className='ev-btns';
  defs.forEach(([txt,cls,fn])=>{const b=document.createElement('button');b.className='btn '+cls;b.innerHTML=txt;b.onclick=()=>{SFX.ensure();fn();};row.appendChild(b);});return row;}
function renderPrep(){
  const P=G.prep,body=$('#pbody');
  $('#stepPips').innerHTML=[0,1,2].map(i=>`<i class="${i<P.step?'done':i===P.step?'now':''}"></i>`).join('');
  body.innerHTML='';
  if(P.step>=3){
    body.innerHTML=`<div class="ready"><div class="rd-t">备战完成</div><p>调整好阵型，然后迎战第${G.round}波。</p><p class="muted">相邻协同、词缀和品质都会影响伤害。点任意卡牌可以查看伤害公式。</p></div>`;
    updateHUD();return;
  }
  if(!P.cur&&P.talk&&!P.talkDone)startTalk();
  const cur=P.cur;$('#prep').classList.toggle('talking',!!cur&&(cur.mode==='talk'||cur.mode==='talent'));
  if(!cur){
    body.insertAdjacentHTML('beforeend',`<div class="ptitle">选择一个去处<span>第 ${P.step+1} 站 / 共 3 站</span></div>`);
    const list=document.createElement('div');list.className='doors';
    P.doors.forEach(id=>{const e=EVENTS[id];const b=document.createElement('button');b.className='door cat-'+e.cat;
      b.innerHTML=`<img src="${icon(e.ico).url}" alt=""><div><b>${e.n}</b><span>${e.d}</span><em>${e.f}</em></div>`;
      b.onclick=()=>{SFX.ensure();SFX.play('ui');enterEvent(id);};list.appendChild(b);});
    body.appendChild(list);updateHUD();return;
  }
  if(cur.mode==='talk'||cur.mode==='talent'){renderTalk(cur,body);updateHUD();return;}
  body.insertAdjacentHTML('beforeend',evHead(cur.ev));
  if(cur.mode==='shop'||cur.mode==='pick'||cur.mode==='gift'){
    const hint=cur.mode==='shop'?'拖到棋盘购买，或点卡牌查看详情':cur.mode==='pick'?(cur.taken?'已经选好了':'免费挑选其中一张'):(cur.taken?'收下了':'免费送你');
    body.insertAdjacentHTML('beforeend',`<div class="ev-hint">${hint}</div>`);
    const grid=document.createElement('div');grid.id='offers';grid.style.gridTemplateColumns=`repeat(${cur.offers.length},minmax(0,${cur.offers.length===1?'140px':'1fr'}))`;
    cur.offers.forEach(of=>grid.appendChild(offerEl(of)));body.appendChild(grid);
    if(cur.mode==='shop')body.appendChild(btnRow([...(cur.refresh>0?[['刷新 <small>(剩'+cur.refresh+'次)</small>','blue',()=>{cur.refresh--;cur.offers=cur.offers.map(()=>makeOffer(cur.ev.filter,{black:cur.ev.black}));SFX.play('buy');renderPrep();document.querySelectorAll('#offers .card').forEach(el=>restart(el,'land'));}]]:[]),['离开','',finishStep]]));
    else body.appendChild(btnRow([[cur.taken?'继续':'放弃',cur.taken?'green':'',finishStep]]));
  }else if(cur.mode==='choice'||cur.mode==='relic'){
    body.insertAdjacentHTML('beforeend',`<div class="ev-hint">${cur.hint}</div>`);
    const list=document.createElement('div');list.className='opts';
    cur.opts.forEach((o,i)=>{const b=document.createElement('button');b.className='opt';b.style.animationDelay=(i*.06)+'s';
      if(o.card){const h=document.createElement('div');h.className='oc';const ce=document.createElement('div');paintCard(ce,o.card,'static');h.appendChild(ce);b.appendChild(h);}
      else b.insertAdjacentHTML('beforeend',`<img class="ricon" src="${icon(o.ico).url}" alt="" style="--gc:${GT[o.gt].c}">`);
      b.insertAdjacentHTML('beforeend',`<div><b>${o.label}</b><span>${o.sub}</span>${o.flav?`<em>${o.flav}</em>`:''}</div>`);
      b.onclick=()=>{SFX.ensure();o.act();};list.appendChild(b);});
    body.appendChild(list);body.appendChild(btnRow([['跳过','',finishStep]]));
  }else if(cur.mode==='gshop'){
    body.insertAdjacentHTML('beforeend',`<div class="ev-hint">点击购买，可以买多件</div>`);
    const list=document.createElement('div');list.className='opts';
    cur.goods.forEach((g,i)=>{const R0=RELICS[g.k];const b=document.createElement('button');b.className='opt'+(g.sold?' sold':'');b.style.animationDelay=(i*.06)+'s';
      b.innerHTML=`<img class="ricon" src="${icon(R0.ico).url}" alt="" style="--gc:${GT[R0.t].c}"><div><b>${gearLabel(g.k)}</b><span>${modText(R0.m)}</span><em>${R0.f}</em></div><span class="price${g.sold?'':g.price>G.gold?' cant':''}" data-p="${g.price}">${g.sold?'已购':`<img class="ico" src="${SPR.coin.url}" alt="">${g.price}`}</span>`;
      if(!g.sold)b.onclick=()=>{SFX.ensure();if(G.gold<g.price){toast('金币不足');restart($('#goldChip'),'shake');SFX.play('bad');return;}G.gold-=g.price;g.sold=true;gainRelic(g.k,true);renderPrep();};
      list.appendChild(b);});
    body.appendChild(list);
    body.appendChild(btnRow([...(cur.refresh>0?[['刷新 <small>(剩'+cur.refresh+'次)</small>','blue',()=>{cur.refresh--;cur.goods=rollGear(3,1).map(k=>({k,price:gearPrice(k),sold:false}));SFX.play('buy');renderPrep();}]]:[]),['离开','',finishStep]]));
  }else if(cur.mode==='gamble'){
    body.insertAdjacentHTML('beforeend',`<div class="big-res">${cur.result||'掷一次骰子？'}</div>`);
    body.appendChild(btnRow(cur.result?[['继续','green',finishStep]]:[['下注 <img class="ico" src="'+SPR.coin.url+'" alt=""><b>3</b>','gold',()=>{
      if(G.gold<3){toast('金币不足');return;}G.gold-=3;const win=Math.random()<.5;
      if(win){G.gold+=6;SFX.play('coin');const r=$('#pbody').getBoundingClientRect();FX.coins(r.left+r.width/2,r.top+r.height/2,6);cur.result='赢了！<b>+6</b> 金币';}
      else{SFX.play('bad');cur.result='骰子背叛了你。<br><small>3金币没了</small>';}updateHUD();renderPrep();}],['离开','',finishStep]]));
  }else if(cur.mode==='reward'){
    body.insertAdjacentHTML('beforeend',`<div class="big-res">${cur.text}</div>`);
    body.appendChild(btnRow([['收下','green',()=>{cur.apply();updateHUD();finishStep();}]]));
  }
  updateHUD();
}
function offerEl(of){
  const c=of.card;const ad=c.adj?ADJ[c.adj]:null;const it=ITEMS[c.key];
  const o=document.createElement('div');o.className='offer'+(of.sold?' sold':'');
  const cel=document.createElement('div');paintCard(cel,c,'static');o.appendChild(cel);
  o.insertAdjacentHTML('beforeend',`<div class="oname">${it.n}</div><div class="oadj"><span style="color:${TIERS[c.tier].c}">${TIERS[c.tier].n}</span>${ad?` · <span style="color:${ad.c}">${ad.n}</span>`:''}</div><div class="odesc">${ad?ad.d:it.d}</div><div class="oflav">${it.f}</div><div class="price${of.price===0?' free':of.price>G.gold?' cant':''}" data-p="${of.price}">${of.price===0?'免费':`<img class="ico" src="${SPR.coin.url}" alt="金币">${of.price}`}</div>`);
  if(!of.sold)cel.addEventListener('pointerdown',e=>onDown(e,{kind:'shop',offer:of,el:cel}));
  return o;
}
function enterEvent(id){
  const ev=EVENTS[id];const cur={id,ev};const P=G.prep;
  if(ev.cat==='shop'){cur.mode='shop';cur.refresh=1;cur.offers=[0,1,2].map(()=>makeOffer(ev.filter,{black:ev.black}));}
  else if(id==='chest'){cur.mode='gift';cur.offers=[makeOffer(null,{free:1})];}
  else if(id==='field'){cur.mode='pick';cur.offers=[0,1,2].map(()=>makeOffer(null,{free:1}));}
  else if(id==='altar'){relicChoice(cur,'挑一件，一直生效，同名的能叠',rollGear(3,0,2));}
  else if(id==='parcel'){relicChoice(cur,'包裹里装着……',rollGear(1,1,2));}
  else if(id==='grocer'){cur.mode='gshop';cur.refresh=1;cur.goods=rollGear(3,1).map(k=>({k,price:gearPrice(k),sold:false}));}
  else if(id==='enchant'){cur.mode='choice';cur.hint='选一项附魔（会替换原有词缀）';
    cur.opts=shuffled(G.cards).slice(0,3).map(c=>{const a=rollAdj(c.key,true,c.adj,1);return{card:c,label:ITEMS[c.key].n+' → 【'+ADJ[a].n+'】',sub:ADJ[a].d,
      act:()=>{c.adj=a;repaint(c);renderOwned();SFX.play('merge');const r=c.el.getBoundingClientRect();FX.burst(r.left+r.width/2,r.top+r.height/2,ADJ[a].c,20);restart(c.el,'merge');finishStep();}};});}
  else if(id==='train'){cur.mode='choice';cur.hint='选一张卡提升品质';
    cur.opts=shuffled(G.cards.filter(c=>c.tier<2)).slice(0,3).map(c=>{const nx=Object.assign({},c,{tier:c.tier+1});const a=stats(c,null),b=stats(nx,null);
      return{card:c,label:ITEMS[c.key].n+'：'+TIERS[c.tier].n+' → '+TIERS[c.tier+1].n,sub:ITEMS[c.key].dmg?`伤害 ${Math.round(a.total)}→${Math.round(b.total)}　冷却 ${a.cd.toFixed(2)}→${b.cd.toFixed(2)}s`:UPS[ITEMS[c.key].up].t,
      act:()=>{c.tier++;repaint(c);checkMerges();renderOwned();SFX.play('merge');if(c.el){const r=c.el.getBoundingClientRect();FX.burst(r.left+r.width/2,r.top+r.height/2,TIERS[c.tier].c,24);restart(c.el,'merge');}finishStep();}};});}
  else if(id==='furnace'){cur.mode='choice';cur.hint='选一张卡投入熔炉';
    cur.opts=shuffled(G.cards).slice(0,4).map(c=>({card:c,label:'献祭 '+ITEMS[c.key].n,sub:'失去这张卡（售价 '+sellValue(c)+'），然后挑选一件遗物',
      act:()=>{const r=c.el.getBoundingClientRect();FX.burst(r.left+r.width/2,r.top+r.height/2,'#ef7d57',26);SFX.play('boom');removeCard(c);renderOwned();relicChoice(cur,'熔炉吐出三件遗物，选一件',rollGear(3,3));renderPrep();}}));}
  else if(id==='gamble'){cur.mode='gamble';}
  else if(id==='mentor'||(id==='manual'&&Math.random()<.5)){const m=pick(MEETS);Object.assign(cur,{mode:'talent',who:m.who,intro:[[m.who,m.say]],picks:rollTalents(2),title:m.n});}
  else if(id==='manual'){cur.mode='pick';cur.offers=[0,1].map(()=>makeOffer(it=>it.hero===G.hero&&it.t>=1,{free:1}));}
  else if(id==='spring'){const h=Math.min(8,G.wallMax-G.wall);cur.mode='reward';cur.text=`城墙修复 <b>+${h}</b>`;cur.apply=()=>{G.wall+=h;SFX.play('merge');};}
  else if(id==='job'){cur.mode='reward';cur.text='工钱 <b>+3</b> 金币';cur.apply=()=>gainGold(3);}
  else if(id==='bank'){const g=Math.max(2,Math.round(G.gold*.3));cur.mode='reward';cur.text=`利息 <b>+${g}</b> 金币`;cur.apply=()=>gainGold(g);}
  P.cur=cur;renderPrep();
}
/* ---- 夜谈 / 学天赋 ---- */
function startTalk(){const sc=TALKS[Math.floor((G.round-1)/2)%TALKS.length];
  G.prep.cur={id:'talk',talk:1,mode:'talk',who:sc.who,title:sc.title,sc,li:1,intro:sc.lines};}
function tline(who,t){const v=voiceOf(who);return `<div class="tl${who==='hero'?' me':''}" style="--vc:${v.c}"><img src="${v.img}" alt=""><p><b>${v.n}</b>${pickLine(t)}</p></div>`;}
function renderTalk(cur,body){
  const v=voiceOf(cur.who);
  body.insertAdjacentHTML('beforeend',`<div class="ptitle">${cur.talk?'夜谈 · '+cur.title:cur.title}<span>${cur.talk?'每两夜一次':'难得碰上'}</span></div>`);
  const log=document.createElement('div');log.className='tlog';
  const lines=(cur.intro||[]).slice(0,cur.mode==='talk'?cur.li:99);
  if(!cur.said)cur.said=lines.map(([w,t])=>[w,pickLine(t)]);
  while(cur.said.length<lines.length){const[w,t]=lines[cur.said.length];cur.said.push([w,pickLine(t)]);}
  log.innerHTML=cur.ans?tline('hero',cur.ans)+tline(cur.who,cur.re):cur.said.map(([w,t])=>tline(w,t)).join('');
  body.appendChild(log);
  const list=document.createElement('div');list.className='opts';
  if(cur.mode==='talk'){
    if(cur.li<cur.sc.lines.length){body.appendChild(btnRow([['接着听','blue',()=>{cur.li++;SFX.play('ui');renderPrep();}]]));}
    else{body.insertAdjacentHTML('beforeend',`<div class="ev-hint">${cur.sc.q}</div>`);
      cur.sc.ans.forEach((a,i)=>{const b=document.createElement('button');b.className='opt say';b.style.animationDelay=(i*.06)+'s';
        b.innerHTML=`<div><b>“${pickLine(a.t)}”</b></div>`;
        b.onclick=()=>{SFX.ensure();SFX.play('ui');cur.ans=pickLine(a.t);cur.re=a.re;cur.mode='talent';cur.picks=rollTalents(3,a.cat);renderPrep();};list.appendChild(b);});
      body.appendChild(list);}
  }else{
    body.insertAdjacentHTML('beforeend',`<div class="ev-hint">${cur.picks.length?'挑一个学':'能学的都学会了'}</div>`);
    cur.picks.forEach((id,i)=>{const T=TALENTS[id],C=TCAT[T.cat];const b=document.createElement('button');b.className='opt';b.style.animationDelay=(i*.06)+'s';
      b.innerHTML=`<img class="ricon" src="${icon(C.ico).url}" alt="" style="--gc:${C.c}"><div><b style="color:${C.c}">${T.n}<small class="gt" style="--gc:${C.c}">${C.n}</small>${T.hero?'<small class="gt">专属</small>':''}</b>${talentText(id)}${T.say?`<em>“${T.say}”</em>`:''}</div>`;
      b.onclick=()=>{SFX.ensure();learnTalent(id);endTalk(cur);};list.appendChild(b);});
    body.appendChild(list);
    if(!cur.picks.length)body.appendChild(btnRow([['拿 5 金走人','gold',()=>{gainGold(5);endTalk(cur);}]]));
  }
}
function endTalk(cur){if(cur.talk){G.prep.talkDone=true;G.prep.cur=null;renderPrep();
    if(G.firstPrep){G.firstPrep=false;setTimeout(()=>toast('这局来的是「'+FOESETS[G.foeSet].n+'」，先去三个地方准备'),700);}}else finishStep();}
function gainGold(n){G.gold+=n;SFX.play('coin');const r=$('#pbody').getBoundingClientRect();FX.coins(r.left+r.width/2,r.top+r.height/2,Math.min(n,8));}
function rollGear(n,bonus,maxTier){const R=G.round+(bonus||0);const w=[Math.max(10,62-8*R),24+2*R,R>=2?4+4*R:0,R>=4?2*R-4:0];
  if(maxTier!==undefined)for(let i=maxTier+1;i<4;i++)w[i]=0;
  const out=[];let guard=0;while(out.length<n&&guard++<200){let t=Math.random()*w.reduce((a,b)=>a+b,0);let tier=0;for(let i=0;i<4;i++){t-=w[i];if(t<=0){tier=i;break;}}
    const pool=Object.keys(RELICS).filter(k=>RELICS[k].t===tier&&(!RELICS[k].hero||RELICS[k].hero===G.hero)&&!out.includes(k)&&!(RELICS[k].u&&G.relics.includes(k)));if(pool.length)out.push(pick(pool));}
  return out;}
function gearPrice(k){return[5,9,14,20][RELICS[k].t]+Math.floor(G.round/2);}
function gearLabel(k){const g=RELICS[k];const n=G.relics.filter(x=>x===k).length;return `<span style="color:${GT[g.t].c}">${g.n}</span><small class="gt" style="--gc:${GT[g.t].c}">${GT[g.t].n}</small>${n?'<small class="gt">已有'+n+'</small>':''}`;}
function relicChoice(cur,hint,list){cur.mode='relic';cur.hint=hint;
  cur.opts=list.map(r=>({ico:RELICS[r].ico,gt:RELICS[r].t,label:gearLabel(r),sub:modText(RELICS[r].m),flav:RELICS[r].f,act:()=>gainRelic(r)}));}
function gainRelic(r,stay){G.relics.push(r);const w=RELICS[r].m.wall;if(w){G.wallMax=Math.max(5,G.wallMax+w);G.wall=w>0?G.wall+w:Math.min(G.wall,G.wallMax);}
  recalcMods();SFX.play('merge');renderRelics(r);renderOwned();updateHUD();toast('拿到遗物：'+RELICS[r].n);if(!stay)finishStep();}
function shuffled(a){return a.slice().sort(()=>Math.random()-.5);}
function finishStep(){const P=G.prep;P.step++;P.cur=null;if(P.step<3)rollDoors();renderPrep();SFX.play('ui');
  if(P.step>=3)restart($('#goBtn'),'bump');}

/* ================= 获得/出售/合成 ================= */
function buyCheck(of){if(G.gold<of.price){toast('金币不足');restart($('#goldChip'),'shake');SFX.play('bad');return false;}return true;}
function acquire(of,dest){
  if(of.sold||G.phase!=='prep')return false;
  const canMerge=of.card.tier<3&&countSame(of.card.key,of.card.tier)>=1;
  if(!dest){const fit=firstFit(of.card.size);dest=fit||(canMerge?'merge':null);
    if(!dest){toast('没有空位：先出售，或买同名同品质的卡来合成');SFX.play('bad');return false;}}
  if(!buyCheck(of))return false;
  G.gold-=of.price;of.sold=true;SFX.play('buy');
  const c=newCard(of.card.key,of.card.tier,of.card.adj);G.cards.push(c);
  if(dest==='merge'){c.loc='temp';c.idx=-1;}else{c.loc=dest.z;c.idx=dest.i;}
  const cur=G.prep.cur;if(cur&&(cur.mode==='pick'||cur.mode==='gift')){cur.taken=true;cur.offers.forEach(o=>o.sold=true);}
  afterChange(c);return true;
}
function sellCard(c){const v=sellValue(c);G.gold+=v;SFX.play('sell');const r=c.el.getBoundingClientRect();FX.coins(r.left+r.width/2,r.top+r.height/2,Math.min(v,6));removeCard(c);toast('出售获得 '+v+' 金币');}
function checkMerges(){
  let any=null;
  for(let guard=0;guard<8;guard++){
    const groups={};
    for(const c of G.cards)if(c.tier<3){const k=c.key+'_'+c.tier;(groups[k]=groups[k]||[]).push(c);}
    let did=false;
    for(const k in groups){const g=groups[k];if(g.length<2)continue;
      const rank=c=>c.loc==='board'?0:c.loc==='stash'?1:2;
      g.sort((a,b)=>rank(a)-rank(b)||a.idx-b.idx);const[t,a]=g;
      const adjs=[t,a].map(x=>x.adj).filter(Boolean).sort((x,y)=>ADJ[y].r-ADJ[x].r);if(adjs.length)t.adj=adjs[0];
      t.hoard+=a.hoard;t.grow=(t.grow||0)+(a.grow||0);t.qp=Math.max(t.qp||0,a.qp||0);removeCard(a);t.tier++;
      if(t.loc==='temp'){const f=firstFit(t.size);if(f){t.loc=f.z;t.idx=f.i;}}
      repaint(t);any=t;did=true;break;}
    if(!did)break;
  }
  if(any){SFX.play('merge');setTimeout(()=>{if(!any.el||!G.cards.includes(any))return;restart(any.el,'merge');const r=any.el.getBoundingClientRect();
    FX.burst(r.left+r.width/2,r.top+r.height/2,TIERS[any.tier].c,30);toast(ITEMS[any.key].n+' 合成为【'+TIERS[any.tier].n+'】品质');},30);}
  G.cards.filter(c=>c.loc==='temp').forEach(removeCard);
}
function afterChange(placed){checkMerges();renderOwned();if(G.phase==='prep')renderPrep();updateHUD();
  if(placed&&placed.el&&G.cards.includes(placed))restart(placed.el,'land');}

/* ================= 拖拽 ================= */
/* 同一时间只允许一次拖拽；抬手、取消、切后台、失焦都会收尾，保证幽灵卡一定被清掉 */
let D=null;
function onDown(e,src){if(e.button>0)return;if(D)cancelDrag();SFX.ensure();e.preventDefault();
  D={src,pid:e.pointerId,x0:e.clientX,y0:e.clientY,lx:e.clientX,tilt:0,started:false,tgt:null};
  try{src.el.setPointerCapture(e.pointerId);}catch(_){}}
addEventListener('pointermove',e=>{if(!D||e.pointerId!==D.pid)return;if(!D.started){if(G.phase==='prep'&&Math.hypot(e.clientX-D.x0,e.clientY-D.y0)>7)startDrag();else return;}moveDrag(e);});
addEventListener('pointerup',e=>{if(!D||e.pointerId!==D.pid)return;const d=D;D=null;if(!d.started){openSheet(d.src);return;}endDrag(d);});
addEventListener('pointercancel',e=>{if(D&&e.pointerId===D.pid)cancelDrag();});
addEventListener('blur',()=>cancelDrag());
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelDrag();});
function cancelDrag(){const d=D;D=null;if(d&&d.started){d.tgt=null;endDrag(d);}sweepGhosts();}
function sweepGhosts(keep){document.querySelectorAll('.card.ghost').forEach(g=>{if(g!==keep)g.remove();});
  document.querySelectorAll('.card.lifted').forEach(el=>{if(!D||el!==D.src.el)el.classList.remove('lifted');});}
function startDrag(){
  const src=D.src,el=src.el,own=src.kind==='own';const c=own?src.card:src.offer.card;const r=el.getBoundingClientRect();
  sweepGhosts();
  const g=document.createElement('div');paintCard(g,c,'ghost');g.style.width=(c.size*cw-4)+'px';g.style.height=ch+'px';
  D.ox=(D.x0-r.left)/r.width*(c.size*cw-4);D.oy=(D.y0-r.top)/r.height*ch;
  document.body.appendChild(g);D.g=g;D.c=c;D.own=own;D.started=true;el.classList.add('lifted');
  if(own){$('#sell').classList.add('armed');$('#sellTxt').innerHTML='拖到这里卖掉<br><b>+'+sellValue(c)+'</b>';}
  markSyn(c,own?c:null);SFX.play('pick');
  if(!G.drawer){D.autoDrawer=true;setDrawer(true);}
}
function moveDrag(e){
  const x=e.clientX-D.ox,y=e.clientY-D.oy;const vx=e.clientX-D.lx;D.lx=e.clientX;D.tilt=D.tilt*.8+clamp(vx*1.4,-16,16)*.2;
  D.g.style.transform=`translate(${x}px,${y}px) rotate(${D.tilt.toFixed(1)}deg) scale(1.07)`;
  D.gx=x;D.tgt=hitTest(e.clientX,e.clientY,x);showTgt(D.tgt);
}
function inside(r,x,y,m){m=m||0;return x>=r.left-m&&x<=r.right+m&&y>=r.top-m&&y<=r.bottom+m;}
/* 插入排列：目标位置被占时，把两边的卡往外挤，腾出位置；挤不下才算失败 */
function insertPlan(z,i,size,ignore){
  const n=zoneN(z);const others=G.cards.filter(o=>o.loc===z&&o!==ignore).sort((a,b)=>a.idx-b.idx);
  if(others.reduce((s,o)=>s+o.size,0)+size>n)return null;
  const mid=i+size/2;const items=others.map(o=>({o,p:o.idx,s:o.size}));
  items.splice(items.filter(t=>t.p+t.s/2<mid).length,0,{o:null,p:i,s:size});
  let end=0;for(const t of items){t.p=Math.max(t.p,end);end=t.p+t.s;}
  let st=n;for(let j=items.length-1;j>=0;j--){const t=items[j];t.p=Math.min(t.p,st-t.s);st=t.p;}
  if(items[0].p<0)return null;
  const me=items.find(t=>!t.o);
  return{i:me.p,moves:items.filter(t=>t.o&&t.p!==t.o.idx).map(t=>[t.o,t.p])};
}
function hitTest(px,py,gx){
  const c=D.c,ig=D.own?c:null;
  if(D.own&&inside($('#sell').getBoundingClientRect(),px,py,6))return{z:'sell'};
  if(inside($('#bagBtn').getBoundingClientRect(),px,py,6)){let i=-1;for(let k=0;k+c.size<=4;k++)if(fits('stash',k,c.size,ig)){i=k;break;}return{z:'bag',i,ok:i>=0};}
  for(const z of['board','stash']){const r=$('#'+z).getBoundingClientRect();if(!inside(r,px,py,22))continue;
    if(!D.own&&c.tier<3){const o=occ(z);const under=o[clamp(Math.floor((px-r.left-4)/cw),0,zoneN(z)-1)];
      if(under&&under.key===c.key&&under.tier===c.tier)return{z:'merge',card:under};}
    const i=clamp(Math.round((gx-(r.left+4))/cw),0,zoneN(z)-c.size);
    if(fits(z,i,c.size,ig))return{z,i,ok:true,moves:[]};
    const pl=insertPlan(z,i,c.size,ig);
    return pl?{z,i:pl.i,ok:true,moves:pl.moves}:{z,i,ok:false};}
  return null;
}
function resetSlots(){for(const c of G.cards)if(c.el&&(c.loc==='board'||c.loc==='stash'))c.el.style.left=(4+c.idx*cw+2)+'px';}
function clearTgt(){document.querySelectorAll('.cell.ok,.cell.bad').forEach(x=>x.classList.remove('ok','bad'));document.querySelectorAll('.card.mergeT,.card.nudge').forEach(x=>x.classList.remove('mergeT','nudge'));$('#sell').classList.remove('hot');$('#bagBtn').classList.remove('hot','bad');resetSlots();}
function showTgt(t){clearTgt();if(!t)return;
  if(t.z==='sell'){$('#sell').classList.add('hot');return;}
  if(t.z==='bag'){$('#bagBtn').classList.add(t.ok?'hot':'bad');return;}
  if(t.z==='merge'){t.card.el.classList.add('mergeT');return;}
  if(t.moves)for(const[o,p]of t.moves)if(o.el){o.el.style.left=(4+p*cw+2)+'px';o.el.classList.add('nudge');}
  const cs=cells(t.z);for(let i=t.i;i<t.i+D.c.size;i++)if(cs[i])cs[i].classList.add(t.ok?'ok':'bad');}
function synergyAt(c,i,ignore){
  const o=occ('board').map(x=>x===ignore?null:x);const L=o[i-1],R=o[i+c.size];const tag=ITEMS[c.key].tag;
  const good=n=>n&&(ITEMS[n.key].tag===tag||n.adj==='echo'||ITEMS[n.key].charge||ITEMS[n.key].buff);
  return good(L)||good(R)||(L&&L.adj==='ignite')||((L||R)&&(c.adj==='echo'||ITEMS[c.key].charge||ITEMS[c.key].buff))||(R&&c.adj==='ignite');
}
function markSyn(c,ignore){const cs=cells('board');for(let i=0;i+c.size<=8;i++)if(fits('board',i,c.size,ignore)&&synergyAt(c,i,ignore))cs[i].classList.add('syn');}
function applyMoves(t){if(t&&t.moves)for(const[o,p]of t.moves)o.idx=p;}
function endDrag(d){
  let ok=false;
  try{
    clearTgt();document.querySelectorAll('.cell.syn').forEach(x=>x.classList.remove('syn'));
    $('#sell').classList.remove('armed');$('#sellTxt').innerHTML='背包 · 4格<br>拖进来卖掉';
    const t=d.tgt;
    if(t&&G.phase==='prep'){
      if(t.z==='sell'&&d.own){sellCard(d.src.card);afterChange();ok=true;}
      else if(t.z==='merge'&&!d.own){ok=acquire(d.src.offer,'merge');}
      else if(t.z==='bag'){if(!t.ok){toast('背包满了');SFX.play('bad');}else if(d.own){d.src.card.loc='stash';d.src.card.idx=t.i;SFX.play('place');afterChange(d.src.card);ok=true;}else ok=acquire(d.src.offer,{z:'stash',i:t.i});}
      else if(t.ok){
        if(d.own){applyMoves(t);d.src.card.loc=t.z;d.src.card.idx=t.i;SFX.play('place');afterChange(d.src.card);ok=true;}
        else if(!d.src.offer.sold&&buyCheck(d.src.offer)){const r=d.g.getBoundingClientRect();applyMoves(t);ok=acquire(d.src.offer,{z:t.z,i:t.i});if(ok)FX.burst(r.left+r.width/2,r.top+r.height/2,'#ffd166',14);else renderOwned();}
      }else if(t.z==='board'||t.z==='stash'){SFX.play('bad');toast('放不下了，先腾点位置');}
    }
  }finally{
    if(d.src.el)d.src.el.classList.remove('lifted');
    if(d.autoDrawer)setTimeout(()=>setDrawer(false),ok?350:0);
    const g=d.g;
    if(g){if(ok||!d.src.el||!d.src.el.isConnected)g.remove();
      else{const r=d.src.el.getBoundingClientRect();g.classList.add('back');g.style.transform=`translate(${r.left}px,${r.top}px) rotate(0deg) scale(1)`;setTimeout(()=>g.remove(),230);}}
  }
}

/* ================= 详情弹层 ================= */
function openSheet(src){
  const own=src.kind==='own';const c=own?src.card:src.offer.card;const it=ITEMS[c.key];const ad=c.adj?ADJ[c.adj]:null;const T=TIERS[c.tier];
  const st=stats(c,null);SFX.play('ui');
  let rows='';
  if(it.dmg>0){
    let f='('+st.base+(st.flat?' + 锋利'+st.flat:'')+')';
    if(st.psum)f+=' × (1 + '+st.pct.map(p=>p[0]+' '+Math.round(p[1]*100)+'%').join(' + ')+')';
    if(st.mult>1)f+=' × 致命1.5';
    rows+=`<div><span>单次伤害</span><span>${Math.round(st.total)}</span></div><div><span></span><span class="f">${f}</span></div>`;
    rows+=`<div><span>暴击率</span><span>${Math.round(st.crit*100)}%（伤害×2）</span></div>`;
    if(it.chain)rows+=`<div><span>弹跳次数</span><span>${chainOf(c)}</span></div>`;
    if(it.multi)rows+=`<div><span>多重</span><span>每次触发打出 ${it.multi} 次</span></div>`;
  }else if(it.charge)rows+=`<div><span>充能相邻</span><span>+${Math.round(chargeAmt(c)*100)}%</span></div>`;
  else if(it.buff)rows+=`<div><span>相邻增伤</span><span>下一击 +${Math.round(buffAmt(c)*100)}%</span></div>`;
  if(it.ammo!=null)rows+=`<div><span>弹药</span><span>每场 ${maxAmmo(c)} 发</span></div>`;
  if(c.grow)rows+=`<div><span>成长</span><span>基础伤害 +${Math.round(c.grow*10)/10}</span></div>`;
  if(it.quest)rows+=`<div><span>任务</span><span>${it.quest.t} ${Math.min(c.qp||0,questN(c))} / ${questN(c)}</span></div>`;
  rows+=it.passive?`<div><span>冷却</span><span>无 <small style="color:var(--muted)">（只靠事件充能）</small></span></div>`:`<div><span>冷却</span><span>${st.cd.toFixed(2)}s${Math.abs(st.cd-st.cdRaw)>.01?' <small style="color:var(--muted)">（原'+st.cdRaw.toFixed(1)+'s）</small>':''}</span></div>`;
  if(c.tier<3){const nx=Object.assign({},c,{tier:c.tier+1});const b=stats(nx,null);
    rows+=`<div><span>升到${TIERS[c.tier+1].n}</span><span>${it.dmg?'伤害 '+Math.round(b.total)+' · ':''}冷却 ${b.cd.toFixed(2)}s</span></div>`;}
  if(own&&c.bTrig)rows+=`<div><span>上一场</span><span>${Math.round(c.bDmg)} 伤害 · 触发${c.bTrig}次</span></div>`;
  if(own)rows+=`<div><span>出售价</span><span>${sellValue(c)}</span></div>`;
  const sh=$('#sheet');
  sh.innerHTML=`<div class="sh" role="dialog" aria-label="${it.n}"><div class="sh-top"><div id="shCard"></div><div><h3>${ad?`<span style="color:${ad.c}">${ad.n}的</span>`:''}${c.tier>=3&&it.dn?`<span class="dn">「${it.dn}」</span><small class="bn">${it.n}</small>`:it.n}</h3>
    <div class="tags"><span class="tag" style="background:${T.c}33;color:${T.c}">${T.n}品质</span><span class="tag" style="background:${TAGC[it.tag]}33;color:${TAGC[it.tag]}">${it.tag}</span>${it.kind?`<span class="tag">${it.kind}</span>`:''}<span class="tag">${SIZEN[c.size]}型·占${c.size}格</span></div>
    <p>${it.d}<br><small style="color:var(--muted)">${UPS[it.up].t}；两张同名同品质的卡合成下一品质。</small></p></div></div>
    <p class="flav">“${it.f}”</p>
    ${it.lore?(c.tier>=2?`<div class="lore${c.tier>=3?' dia':''}"><small>传闻</small><p>${it.lore}</p>${c.tier>=3?`<p class="dl">—— ${it.dl}</p>`:''}</div>`:`<div class="lore locked"><small>传闻</small><p>这张卡的故事，只讲给金品质的主人听。</p></div>`):''}
    ${ad?`<div class="adjbox" style="--ac:${ad.c}"><b>${ad.n}</b><span>${ad.d}</span></div>`:''}
    ${kwBox(it.d)}
    <div class="stat">${rows}</div>
    <div class="sh-btns" id="shBtns"></div></div>`;
  const ce=document.createElement('div');paintCard(ce,c,'static');$('#shCard').appendChild(ce);
  const bt=$('#shBtns');
  const mk=(txt,cls,fn)=>{const b=document.createElement('button');b.className='btn '+cls;b.innerHTML=txt;b.onclick=fn;bt.appendChild(b);};
  if(!own&&G.phase==='prep'&&!src.offer.sold)mk(src.offer.price?'购买 <img class="ico" src="'+SPR.coin.url+'" alt=""><b>'+src.offer.price+'</b>':'免费拿走','gold',()=>{if(acquire(src.offer,null))closeSheet();});
  if(own&&G.phase==='prep')mk('出售 <b>+'+sellValue(c)+'</b>','red',()=>{sellCard(c);afterChange();closeSheet();});
  mk('关闭','',closeSheet);
  sh.hidden=false;sh.onclick=e=>{if(e.target===sh)closeSheet();};
}
function kwBox(d){const ks=Object.keys(KW).filter(k=>d.includes('【'+k));return ks.length?`<div class="kwbox">${ks.map(k=>`<div><b>${k}</b><span>${KW[k]}</span></div>`).join('')}</div>`:'';}
function openRelicSheet(r){const R0=RELICS[r];SFX.play('ui');const sh=$('#sheet');const n=G.relics.filter(x=>x===r).length;
  sh.innerHTML=`<div class="sh" role="dialog" aria-label="${R0.n}"><div class="sh-top"><img class="ricon big" src="${icon(R0.ico).url}" alt="" style="--gc:${GT[R0.t].c}"><div><h3 style="color:${GT[R0.t].c}">${R0.n}${n>1?' ×'+n:''}</h3><div class="tags"><span class="tag" style="background:${GT[R0.t].c}33;color:${GT[R0.t].c}">${GT[R0.t].n}遗物</span><span class="tag">${R0.u?'唯一':'可叠加'}</span></div><p class="mods">${modText(R0.m)}</p></div></div><p class="flav">“${R0.f}”</p><div class="sh-btns"><button class="btn" id="rBack">返回</button><button class="btn" id="rClose">关闭</button></div></div>`;
  sh.hidden=false;$('#rClose').onclick=closeSheet;$('#rBack').onclick=openBag;sh.onclick=e=>{if(e.target===sh)closeSheet();};}
function setDrawer(o){G.drawer=o;$('#stashRow').classList.toggle('closed',!o);updateHUD();setTimeout(()=>{if(G.phase==='battle')resizeField();},300);}
function openTree(){const H=HEROES[G.hero];SFX.play('ui');const sh=$('#sheet');
  sh.innerHTML=`<div class="sh" role="dialog" aria-label="天赋"><h3>${H.n}的天赋 <small class="spn">${G.skills.length} 个</small></h3>
   <p class="muted2">每两夜有一次夜谈，聊完能学一个；路上偶尔也能碰到有人教。</p>
   <div class="tlist">${G.skills.length?G.skills.filter(id=>TALENTS[id]).map(id=>{const T=TALENTS[id],C=TCAT[T.cat];
     return `<div class="trow" style="--gc:${C.c}"><img class="ricon" src="${icon(C.ico).url}" alt=""><div><b>${T.n}<small class="gt">${C.n}</small></b>${talentText(id)}${T.say?`<em>“${T.say}”</em>`:''}</div></div>`;}).join(''):'<p class="muted2">还没学会什么。第一次夜谈就在今晚。</p>'}</div>
   <div class="sh-btns"><button class="btn" id="tClose">关闭</button></div></div>`;
  sh.hidden=false;$('#tClose').onclick=closeSheet;sh.onclick=e=>{if(e.target===sh)closeSheet();};}
/* ================= 剧情 ================= */
function playStory(pages,done){
  const ov=$('#story');let i=0,typing=null,full='';
  const who=p=>{if(p.who==='narr')return{n:'旁白',img:SPR.lantern.url,c:'#9fb3ba'};if(p.who==='hero'){const H=HEROES[G.hero];return{n:H.n,img:SPR[H.portrait].url,c:H.col};}
    if(p.who==='knight')return{n:'暗影骑士 · 卡尔',img:SPR.knight.url,c:'#c79bff'};if(p.who==='eye')return{n:'深渊之眼',img:SPR.eye.url,c:'#ff6b5b'};return{n:'',img:'',c:'#fff'};};
  const mode=pages===STORY.win?'dawn':pages===STORY.lose?'fall':'night';
  const show=()=>{const p=pages[i];ov.hidden=false;
    if(p.title){ov.innerHTML=`<canvas class="st-scene" width="120" height="68"></canvas><div class="st-title"><small>${p.act||''}</small><h2>${p.title}</h2></div><div class="st-tap">点击继续</div><button class="btn sm st-skip" id="stSkip">跳过</button>`;drawScene(ov.querySelector('canvas'),mode);typing=null;$('#stSkip').onclick=e=>{e.stopPropagation();end();};SFX.play('bell');return;}
    const w=who(p);let t=p.t;if(t==='@intro')t=HEROES[G.hero].intro;if(typeof t==='object')t=t[G.hero];full=t;
    ov.innerHTML=`<canvas class="st-scene" width="120" height="68"></canvas><div class="st-box" style="--sc:${w.c}"><img class="st-por" src="${w.img}" alt=""><div class="st-body"><b>${w.n}</b><p id="stText"></p></div></div><div class="st-tap">点击继续</div><button class="btn sm st-skip" id="stSkip">跳过</button>`;
    drawScene(ov.querySelector('canvas'),mode);$('#stSkip').onclick=e=>{e.stopPropagation();end();};
    let k=0;const el=$('#stText');clearInterval(typing);typing=setInterval(()=>{k++;el.textContent=full.slice(0,k);if(k%3===0)SFX.play('ui');if(k>=full.length){clearInterval(typing);typing=null;}},28);};
  const end=()=>{clearInterval(typing);ov.hidden=true;ov.onclick=null;done&&done();};
  ov.onclick=()=>{SFX.ensure();if(typing){clearInterval(typing);typing=null;$('#stText').textContent=full;return;}i++;if(i>=pages.length)end();else show();};
  show();
}
function drawScene(cv,mode){const x=cv.getContext('2d');const W=cv.width,H=cv.height;let s=G.round*977+3;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  const sky=x.createLinearGradient(0,0,0,H);if(mode==='dawn'){sky.addColorStop(0,'#2b2a5a');sky.addColorStop(.6,'#e0785a');sky.addColorStop(1,'#ffd08a');}
  else if(mode==='fall'){sky.addColorStop(0,'#1a0508');sky.addColorStop(1,'#6e1b2a');}else{sky.addColorStop(0,'#05060f');sky.addColorStop(1,'#1d1633');}
  x.fillStyle=sky;x.fillRect(0,0,W,H);
  if(mode!=='dawn')for(let i=0;i<50;i++){x.fillStyle=r()<.3?'#c79bff':'#f4f4f4';x.globalAlpha=.3+r()*.7;x.fillRect(Math.floor(r()*W),Math.floor(r()*H*.6),1,1);}x.globalAlpha=1;
  if(mode==='dawn'){x.fillStyle='#fff1b0';for(let a=0;a<14;a++)for(let b=0;b<14;b++)if((a-7)**2+(b-7)**2<40)x.fillRect(53+a,40+b,1,1);}
  else{const R0=3+G.round*1.4;const cx=90,cy=16;for(let a=-R0;a<=R0;a++)for(let b=-R0*.6;b<=R0*.6;b++){const d=(a*a)/(R0*R0)+(b*b)/(R0*R0*.36);if(d>1)continue;
      x.fillStyle=d>.75?'#6e1b2a':d>.35?'#e43b44':Math.abs(a)<R0*.18?'#1a1c2c':'#fee761';x.fillRect(Math.round(cx+a),Math.round(cy+b),1,1);}
    x.globalAlpha=.25;x.fillStyle='#e43b44';for(let k=0;k<30;k++)x.fillRect(Math.round(cx+(r()-.5)*R0*4),Math.round(cy+(r()-.5)*R0*2),1,1);x.globalAlpha=1;}
  x.fillStyle=mode==='dawn'?'#3a2a3a':'#0b0a14';let hx=0;while(hx<W){const w=4+Math.floor(r()*8),h=10+Math.floor(r()*16);x.fillRect(hx,H-16-h,w,h+16);if(r()<.3){x.fillRect(hx+Math.floor(w/2)-1,H-16-h-5,2,5);}
    for(let wy=H-14-h;wy<H-18;wy+=3)for(let wx=hx+1;wx<hx+w-1;wx+=2)if(r()<.25){x.fillStyle=mode==='fall'?'#ff5a2a':'#ffcd75';x.fillRect(wx,wy,1,1);x.fillStyle=mode==='dawn'?'#3a2a3a':'#0b0a14';}hx+=w;}
  x.fillStyle=mode==='dawn'?'#5a4050':'#2a2130';x.fillRect(0,H-12,W,12);for(let bx=0;bx<W;bx+=6){x.fillRect(bx,H-15,4,3);}
  x.fillStyle=mode==='dawn'?'#7a5a60':'#4a3a40';for(let bx=0;bx<W;bx+=8)x.fillRect(bx+1,H-9,6,2);
  for(let t=10;t<W;t+=28){x.fillStyle='#ffcd75';x.fillRect(t,H-18,1,2);x.fillStyle='#ef7d57';x.fillRect(t,H-19,1,1);}
  if(mode==='fall'){for(let i=0;i<40;i++){x.fillStyle=r()<.5?'#ef7d57':'#ffcd75';x.fillRect(Math.floor(r()*W),H-20-Math.floor(r()*30),1,1);}}}
function nightStory(done){done&&done();}
function _oldNightStory(done){const N=STORY.nights[G.round-1];const act=G.round<=3?'第一幕 · 边境':G.round<=6?'第二幕 · 城下':'第三幕 · 深渊';
  const pages=[{title:N.title,act},{who:'narr',t:N.narr},{who:'hero',t:N[G.hero]}];if(N.foe)pages.push(N.foe);playStory(pages,done);}
function closeSheet(){$('#sheet').hidden=true;}
