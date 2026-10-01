
/* ================= 体验：背景音乐 / 提示 / 今晚情报 =================
 * 背景音乐全用 WebAudio 现场合成，不带音频文件。跟着 BG.set 的场景自动换曲。
 * 声音开关三档存在 localStorage（chain-audio）：0 全开 / 1 只留音效 / 2 全静音。
 */
const MUSIC=(function(){
  const mid=n=>440*Math.pow(2,(n-69)/12);
  // prog：每小节一个和弦 [根音, m小/M大]；每小节 16 步
  // bass/arp 每字符一步：x 根音 5 五度 o 高八度，数字=和弦第几个音；lead 空格分隔：数字起音 - 延长 . 休止
  const SONGS={
    title:{bpm:64,prog:[[45,'m'],[41,'M'],[48,'M'],[43,'M']],bass:'x.......5.......',bv:.035,bt:'triangle',
      arp:'0...1...2...1...',av:.016,at:'triangle',ao:24,
      lead:['76 - - - - - - - 72 - - - - - - -','. . . . 69 - - - 72 - - - . . . .','. . . . 67 - - - 72 - - - 76 - - -','74 - - - - - - - . . . . . . . .'],lv:.02,lt:'sine'},
    // 备战：八音盒里那首「师父的曲子」
    shop:{bpm:96,prog:[[48,'M'],[45,'m'],[41,'M'],[43,'M']],bass:'x...5...x...5...',bv:.03,bt:'triangle',
      arp:'0.2.1.2.0.2.1.2.',av:.009,at:'sine',ao:12,
      lead:['76 . 79 . 84 . 79 . 77 . 76 . 74 - . .','72 . 74 . 76 . 79 . 76 - . . 72 - . .','77 . 76 . 74 . 72 . 69 . 72 . 77 - . .','79 . 77 . 76 . 74 . 71 - . . 74 - . .'],lv:.03,lt:'sine',box:1},
    battle:{bpm:132,prog:[[45,'m'],[41,'M'],[43,'M'],[40,'m']],bass:'x.x.o.x.x.x.o.x.',bv:.02,bt:'square',
      arp:'0.1.2.1.0.1.2.1.',av:.006,at:'square',ao:24,
      lead:['76 - . 76 . 72 - . 74 - . 72 . 69 - .','77 - . 77 . 72 - . 76 - . 72 . 69 - .','79 - . 79 . 74 - . 77 - . 74 . 71 - .','76 - . 79 . 83 - . 81 - . 79 . 76 - .'],lv:.018,lt:'triangle',
      k:'x.......x.x.....',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.'},
    boss:{bpm:144,prog:[[38,'m'],[46,'M'],[43,'m'],[45,'M']],bass:'xxo.xxo.xxo.xxo.',bv:.017,bt:'sawtooth',
      arp:'0.1.2.1.0.1.2.1.',av:.006,at:'square',ao:24,
      lead:['74 - - - 77 - - - 81 - - - 80 - 81 -','82 - - - 81 - - - 77 - - - 74 - - -','79 - - - 82 - - - 86 - - - 84 - 82 -','81 - - - 85 - - - 88 - - - 85 - 81 -'],lv:.018,lt:'triangle',
      k:'x...x...x...x...',s:'....x.......x.x.',h:'..x...x...x...x.'},
    over:{bpm:58,prog:[[45,'m'],[50,'m'],[45,'m'],[40,'M']],bass:'x...............',bv:.03,bt:'triangle',
      arp:'0...1...2...1...',av:.014,at:'sine',ao:24}
  };
  for(const k in SONGS){const S=SONGS[k];if(S.lead)S.lead=S.lead.map(b=>b.split(' '));}
  let on=true,mood=null,cur=null,pend=null,swAt=0,step=0,nextT=0,gain=null,nbuf=null,hp=null;
  function ac(){return SFX.ctx();}
  function setup(a){if(gain)return;gain=a.createGain();gain.gain.value=0;gain.connect(SFX.out()||a.destination);
    const n=a.sampleRate*.3|0;nbuf=a.createBuffer(1,n,a.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    hp=a.createBiquadFilter();hp.type='highpass';hp.frequency.value=6000;hp.connect(gain);}
  function note(a,f,t,d,type,vol,box){const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(gain);o.start(t);o.stop(t+d+.05);
    if(box){const o2=a.createOscillator(),g2=a.createGain();o2.type='triangle';o2.frequency.setValueAtTime(f*2,t);g2.gain.setValueAtTime(vol*.25,t);g2.gain.exponentialRampToValueAtTime(.0001,t+.2);o2.connect(g2);g2.connect(gain);o2.start(t);o2.stop(t+.25);}}
  function nz(a,t,d,vol,dest){const s=a.createBufferSource(),g=a.createGain();s.buffer=nbuf;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(g);g.connect(dest||gain);s.start(t);s.stop(t+d+.02);}
  function kick(a,t){const o=a.createOscillator(),g=a.createGain();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);
    g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.0001,t+.16);o.connect(g);g.connect(gain);o.start(t);o.stop(t+.2);}
  function play(a,S,i,t){const sd=15/S.bpm,bar=(i>>4)%S.prog.length,s=i&15;const[r,q]=S.prog[bar];const tn=[r,r+(q==='m'?3:4),r+7];
    const b=S.bass[s];if(b&&b!=='.')note(a,mid(r+(b==='5'?7:b==='o'?12:0)),t,sd*1.7,S.bt,S.bv);
    const c=S.arp&&S.arp[s];if(c&&c!=='.')note(a,mid(tn[+c]+S.ao),t,sd*2.2,S.at,S.av);
    if(S.lead){const L=S.lead[bar],v=L[s];if(v!=='.'&&v!=='-'){let n=1;while(s+n<16&&L[s+n]==='-')n++;note(a,mid(+v),t,sd*(S.box?Math.max(n,3):n)*1.1,S.lt,S.lv,S.box);}}
    if(S.k&&S.k[s]==='x')kick(a,t);
    if(S.s&&S.s[s]==='x'){nz(a,t,.09,.035);note(a,190,t,.06,'triangle',.02);}
    if(S.h&&S.h[s]==='x')nz(a,t,.025,.02,hp);}
  function tick(){const a=ac();if(!a||a.state!=='running'||document.hidden)return;setup(a);const now=a.currentTime;
    if(pend!==null&&now>=swAt){cur=SONGS[pend]||null;pend=null;step=0;nextT=now+.05;if(cur&&on){gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.9,now+.8);}}
    if(!cur||!on)return;
    if(nextT<now-.2)nextT=now+.05;
    while(nextT<now+.15){play(a,cur,step,nextT);nextT+=15/cur.bpm;step++;}}
  setInterval(tick,40);
  document.addEventListener('visibilitychange',()=>{const a=ac();if(!a||!gain)return;if(!document.hidden)nextT=a.currentTime+.1;});
  function set(m){if(m===mood)return;mood=m;const a=ac();pend=m;
    if(a&&gain&&cur){const now=a.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(Math.max(.0001,gain.gain.value),now);gain.gain.exponentialRampToValueAtTime(.0001,now+.4);swAt=now+.42;}else swAt=0;}
  function enable(v){on=v;const a=ac();if(!a||!gain)return;const now=a.currentTime;gain.gain.cancelScheduledValues(now);
    if(v){gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.9,now+.5);nextT=now+.05;}else gain.gain.setValueAtTime(0,now);}
  return{set,enable,state:()=>({mood,on,playing:!!cur,step})};
})();
{const f=BG.set;BG.set=n=>{f(n);MUSIC.set(n);};}

let audioMode=0;try{audioMode=+localStorage.getItem('chain-audio')||0;}catch(e){}
const AUDIO_L=[['♪ 开','音乐和音效都开着'],['♪ 效','音乐关了，只留音效'],['♪ 关','全静音']];
function applyAudio(say){SFX.setMuted(audioMode===2);MUSIC.enable(audioMode===0);$('#muteBtn').textContent=AUDIO_L[audioMode][0];if(say)toast(AUDIO_L[audioMode][1]);}
function cycleAudio(){audioMode=(audioMode+1)%3;try{localStorage.setItem('chain-audio',audioMode);}catch(e){}applyAudio(true);if(audioMode<2)SFX.play('ui');}
applyAudio(false);
function buzz(p){if(audioMode<2&&navigator.vibrate)try{navigator.vibrate(p);}catch(e){}}

/* ---------- 提示气泡：一次性的新手提示 + 点顶栏看说明 ---------- */
const TIPQ=[];let tipEl=null,tipT=null;
let tipSeen={};try{tipSeen=JSON.parse(localStorage.getItem('chain-tips')||'{}');}catch(e){}
function showTip(label,html,ms,now){
  if(!tipEl){tipEl=document.createElement('div');tipEl.id='tipBub';tipEl.onclick=()=>nextTip();document.body.appendChild(tipEl);}
  if(now){TIPQ.length=0;clearTimeout(tipT);tipT=null;}
  TIPQ.push([label,html,ms||5200]);if(!tipT)nextTip(true);}
function nextTip(first){clearTimeout(tipT);tipT=null;if(!first)TIPQ.shift();
  if(!TIPQ.length){tipEl.className='';return;}
  const[l,h,ms]=TIPQ[0];tipEl.innerHTML=`<small>${l}</small><p>${h}</p>`;tipEl.className='';void tipEl.offsetWidth;tipEl.className='show';
  tipT=setTimeout(()=>nextTip(),ms);}
function tipOnce(key,html,delay){if(tipSeen[key])return;tipSeen[key]=1;try{localStorage.setItem('chain-tips',JSON.stringify(tipSeen));}catch(e){}
  setTimeout(()=>{showTip('小提示',html);SFX.play('hint');},delay||0);}

$('#roundChip').onclick=()=>{SFX.ensure();SFX.play('ui');const R=Math.min(G.round,G.maxRound);
  showTip('夜晚',`第 <b>${R}</b> 夜 / 共 ${G.maxRound} 夜：${nightInfo(R).title}。<br>第 4 夜有精英，最后一夜是首领。${G.heat?'<br>当前难度：长夜 '+G.heat:''}`,4200,true);};
$('#goldChip').onclick=()=>{SFX.ensure();SFX.play('coin');
  showTip('金币',`每夜打完发工钱，手上每存 6 金多给 1 金利息（最多 ${3+mv('interest')}）。`,4800,true);};
$('#hpChip').onclick=()=>{SFX.ensure();SFX.play('ui');
  showTip('城墙',`怪摸到墙就掉砖，掉光这局就结束。${B&&B.shield>0?'<br>蓝色数字是护盾，先扣护盾再扣墙。':''}${mv('regen')?'<br>每夜打完会补 '+mv('regen')+' 砖。':''}`,4800,true);};

/* ---------- 准备好了：今晚情报 ---------- */
const PTIPS=['输出卡放中间，两边摆能充能、能加伤的卡，一次带俩。','同名同品质两张自动合成，背包里的也算。','卡上的小数字是单次伤害。',
  '钱别一次花光，每存 6 金下一夜多给 1 金。','有【装填】【充能】字样的卡，要挨着别的卡才有用。',
  '冰能减速、冻住怪，墙前面多一秒就多打一轮。','打不过的时候，回头看看战报里哪张卡没出力。','合成时，词缀留下更好的那个。',
  '背包里的卡不上场，但合成和出售都算它。','同元素凑够张数有羁绊，全队都吃加成。','毒和火是持续伤害，适合打血厚的大家伙。'];
function readyHtml(){
  const P=G.prep;const cnt={};G.nextWave.forEach(s=>cnt[s.type]=(cnt[s.type]||0)+1);
  const ks=Object.keys(cnt).sort((a,b)=>((EN[b].boss||EN[b].elite)?1:0)-((EN[a].boss||EN[a].elite)?1:0)||cnt[b]-cnt[a]);
  const bc=boardCards();const used=bc.reduce((s,c)=>s+c.size,0);const bag=G.cards.filter(c=>c.loc==='stash');
  const canUp=bag.filter(c=>{for(let i=0;i+c.size<=8;i++)if(fits('board',i,c.size))return true;return false;}).length;
  const warn=[];
  if(canUp)warn.push(`背包里还有 ${canUp} 张卡放得上棋盘，不拿出来就不打`);
  else if(used<8)warn.push(`棋盘还空着 ${8-used} 格`);
  if(G.wall<G.wallMax*.4)warn.push(`城墙只剩 ${Math.ceil(G.wall)}，今晚别让怪漏过去`);
  if(P.tipI==null)P.tipI=Math.floor(Math.random()*PTIPS.length);
  return `<div class="ready"><div class="rd-t">准备好了</div><p>${nightInfo(G.round).title}</p>
    <div class="intel"><div class="il-h">今晚会来</div>${ks.map(k=>{const d=EN[k];return `<div class="ifoe${d.boss||d.elite?' elite':''}"><img src="${SPR[d.spr].url}" alt=""><b>${d.n}</b><small>${d.boss?'首领':d.elite?'精英':'×'+cnt[k]}</small><span>${d.tip||'普通小怪，靠数量压上来。'}</span></div>`;}).join('')}</div>
    ${warn.length?`<div class="iwarn">${warn.map(w=>`<span>${w}</span>`).join('')}</div>`:''}
    <p class="muted">小贴士：${PTIPS[P.tipI]}</p></div>`;
}

/* ---------- 输了：看看是谁漏过去的 ---------- */
function loseNote(){if(!B||!B.wallBy)return '';const ks=Object.keys(B.wallBy).sort((a,b)=>B.wallBy[b]-B.wallBy[a]);if(!ks.length)return '';
  const d=EN[ks[0]];return `<div class="rules res lose-why"><div><span>这夜漏过去最多的</span><i style="margin-left:auto">${d.n} · 撞墙 ${Math.ceil(B.wallBy[ks[0]])}</i></div>${d.tip?`<div><span class="lw">${d.tip}</span></div>`:''}</div>`;}

/* 卡牌图鉴搬到了 03g-codex.js，跟遗物、天赋、敌人图鉴放在一起 */

/* 有自己声音的卡：八音盒放那首曲子的下一个音，战鼓咚一下 */
ITEMS.musicbox.snd='mbox';ITEMS.wardrum.snd='drum';

/* ---------- 战报：每张卡是被谁触发的、帮队友干了什么 ---------- */
const EVL={burn:'有卡点燃',bounce:'闪电弹跳',wall:'城墙受击',kill:'敌人倒下',use:'有卡触发',crit:'暴击',freeze:'冻住敌人',poison:'施毒',charge:'被充能',chain:'连锁',start:'开战'};
function passiveSrc(it){const k=it.on&&Object.keys(it.on).find(k=>EVL[k]);return k?EVL[k]+'时':'被动';}
function supOf(c){const s=[];if(c.bCh>=1)s.push('给队友攒了约 '+Math.round(c.bCh)+' 次出手');else if(c.bCh>.001)s.push('给队友充能 '+Math.round(c.bCh*100)+'%');if(c.bHs>.05)s.push('加速 '+c.bHs.toFixed(1)+' 秒');
  if(c.bRl)s.push('装填 '+c.bRl+' 发');if(c.bBf)s.push('增伤 '+c.bBf+' 次');if(c.bTr)s.push('带动触发 '+c.bTr+' 次');return s.join(' · ');}
function srcLine(c){const it=ITEMS[c.key];const ks=Object.keys(c.bSrc||{}).sort((a,b)=>c.bSrc[b]-c.bSrc[a]);const out=[];
  if(ks.length&&!(ks.length===1&&ks[0]==='冷却'))out.push('触发：'+ks.map(k=>k+' '+c.bSrc[k]).join('，'));
  else if(it.passive&&!ks.length)out.push(it.on?'被动：'+passiveSrc(it)+'生效':'被动：常驻加成');
  const s=supOf(c);if(s)out.push(s);
  return out.length?`<small class="rp-src">${out.join('　')}</small>`:'';}
