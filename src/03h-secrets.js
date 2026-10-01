/* ================= 隐藏事件：知道了才碰得到 =================
 * 条件写死，第一局就能触发，不靠局外解锁；提示藏在卡牌文案和台词里。
 * 只加独立的小事件和剧情分支，不改战斗规则。G.secret 跟单局存档走，META.secrets 只用来在成就页记个数。
 *  - 师父的信：萤，手里有八音盒，第 3 夜起备战时出现
 *  - 卡尔的剑：艾拉用誓约长剑打倒暗影骑士，下一夜备战时出现
 *  - 借来的星：墨，守到黎明时星陨在棋盘上
 *  - 账房先生抬头：兜里正好 7 金时进钱庄
 *  - 第七百零一下：守到黎明时晨钟在棋盘上
 */
const SECRET_N=5;
G.secret={};
if(!META.secrets)META.secrets={};
function foundSecret(id){G.secret[id]=1;if(!META.secrets[id]){META.secrets[id]=Date.now();saveMeta();}}
const onBoard=k=>boardCards().some(c=>c.key===k);

/* ---- 提示：放进普通卡面文案（传闻要金卡才看得到，这里不能锁在升级后面） ---- */
ITEMS.bell.f='钟声一响，全城的武器都醒了。等太阳升起那天，它会多敲一下。';
ITEMS.oathsword.f='剑身刻着七个名字，第八个位置还空着。卡尔那把，是同一块铁打的。';
ITEMS.starfall.f='她说她只是“借用”了一颗星星。天亮就还。';
EVENTS.bank.f='账房先生从来不抬头，嘴里一直数着：“七……七……”';

/* ---- 遗物：师父的信（不进任何随机池） ---- */
RELICS.mletter={n:'师父的信',t:2,u:1,ico:'scroll:y',hero:'ying',fit:()=>false,m:{s1:.12,startCharge:.15},f:'信纸背面画着一张图：齿轮怎么咬合，灯芯怎么剪。'};

/* ---- 隐藏的备战事件：need 恒为假，不进随机池，只由下面的 rollDoors 塞进来 ---- */
Object.assign(EVENTS,{
  s_letter:{n:'写给萤的包裹',ico:'book:y',cat:'rare',w:0,need:()=>false,d:'收件人一栏写着你的名字',f:'包裹上缠着一圈八音盒的发条。'},
  s_karl:{n:'插在墙根的剑',ico:'oathsword',cat:'rare',w:0,need:()=>false,d:'昨晚骑士倒下的地方',f:'剑柄上刻着七个名字，和你那把一模一样。'}
});
const SECRET_DOORS=[
  ['s_letter',()=>G.hero==='ying'&&G.round>=3&&!G.secret.letter&&G.cards.some(c=>c.key==='musicbox')],
  ['s_karl',()=>G.hero==='ayla'&&G.secret.karlKill&&!G.secret.karl]
];
const _rollDoors=rollDoors;
rollDoors=function(){_rollDoors();const P=G.prep;if(P.step!==0||G.endless)return;
  const hit=SECRET_DOORS.find(([id,ok])=>ok()&&!P.doors.includes(id));if(!hit)return;
  /* 换掉一扇门，但保证至少还剩一家店或一份白给 */
  const keep=i=>EVENTS[i].cat==='shop'||EVENTS[i].cat==='free';
  let at=P.doors.findIndex(i=>!keep(i));if(at<0)at=P.doors.findIndex((i,k)=>P.doors.some((j,m)=>m!==k&&keep(j)));if(at<0)at=0;
  P.doors[at]=hit[0];
};
const _enterEvent=enterEvent;
enterEvent=function(id){
  if(id==='s_letter'){const cur={id,ev:EVENTS[id],mode:'reward'};
    cur.text=`<div class="sletter">萤：<br>灯匠的规矩你记得——灯不能灭，人不能停。<br>我在一个很暗的地方，可我听得见钟声，所以知道你还在点灯。<br>八音盒最后一小节，我替你上好弦了。等天亮，你自己放给我听。<br><span>—— 师父</span></div><small>得到遗物「师父的信」</small>`;
    cur.apply=()=>{foundSecret('letter');gainRelic('mletter',true);};G.prep.cur=cur;renderPrep();return;}
  if(id==='s_karl'){const cur={id,ev:EVENTS[id],mode:'gift'};const mine=G.cards.filter(c=>c.key==='oathsword').map(c=>c.tier);
    const tier=Math.min(2,mine.length?Math.max(...mine):1);
    cur.offers=[{card:{key:'oathsword',tier,adj:null,size:ITEMS.oathsword.size,dl:0,hoard:0},price:0,sold:false}];
    foundSecret('karl');G.prep.cur=cur;renderPrep();
    tipOnce('s_karl','两把剑是同一块铁打的。',300);return;}
  _enterEvent(id);
  if(id==='bank'&&G.gold===7){const cur=G.prep.cur;foundSecret('bank');
    cur.text=`<div class="sletter">账房先生抬起了头。<br>“七。七百年了，总算有人揣着正好七个子儿进来。”<br>“灰袍年轻时在这儿存过一笔钱，说天一亮就来取。他一次都没来过。”<br>“那笔钱的利息，早够买下整座学院了。你说，他是不是从来就没打算让天亮？”</div>`+cur.text;renderPrep();}
};

/* ---- 卡尔：艾拉用誓约长剑打出最后一下 ---- */
const _kill=kill;
kill=function(e,src){
  if(e.type==='knight'&&!e.dead&&G.hero==='ayla'&&src&&src.key==='oathsword'&&!B.ambush){
    G.secret.karlKill=1;const d=FOEB.knight.die;FOEB.knight.die='……这把剑。艾拉，我的那把，插在墙根下了。';
    _kill(e,src);FOEB.knight.die=d;say('hero','卡尔，你的剑，我替你收着。',3);return;}
  return _kill(e,src);
};

/* ---- 黎明：借来的星 / 第七百零一下 ---- */
const S_STAR=[
  {who:'hero',t:{mo:'说好的，天亮就还。'}},
  {who:'narr',t:'星陨从城墙上升起来，越飞越高，停在北天那个空了七百年的位置上。'},
  {who:'narr',t:'守星人第二天在记录里写：北天的星星，数目对上了。'}];
const S_BELL=[
  {who:'narr',t:'钟楼上没有人。可是那口钟，自己响了。'},
  {who:'narr',t:'第七百零一下。'},
  {who:'hero',t:{ayla:'七百年，它一天都没敲错。今天这一下，是替所有没等到天亮的人敲的。',mo:'没有人拉绳子。我算不出来……这次就不算了。',ying:'师父说过，钟自己响的那天，就是他回来的那天。'}},
  {who:'narr',t:'后来晨钟城的人都说，那天早上的钟声，比七百年里任何一次都响。'}];
ACH.push({id:'bell701',n:'第七百零一下',d:'据说太阳升起那天，钟会多敲一下'});ACHM.bell701=ACH[ACH.length-1];
const _playStory=playStory;
playStory=function(pages,done){
  if(pages!==STORY.win)return _playStory(pages,done);
  const extra=[];
  if(G.hero==='mo'&&onBoard('starfall')){foundSecret('star');extra.push(...S_STAR);}
  if(onBoard('bell')){foundSecret('bell');extra.push(...S_BELL);unlock('bell701');}
  if(!extra.length)return _playStory(pages,done);
  const n=pages.length;pages.push(...extra);
  return _playStory(pages,()=>{pages.length=n;done&&done();});
};

/* ---- 存档：G.secret 跟单局走 ---- */
const _saveGame=saveGame;
saveGame=function(){_saveGame();try{const s=JSON.parse(localStorage.getItem(SAVEK));s.secret=G.secret;localStorage.setItem(SAVEK,JSON.stringify(s));}catch(e){}};
const _resumeSave=resumeSave;
resumeSave=function(){const s=loadSave();G.secret=(s&&s.secret)||{};_resumeSave();};
const _newGame=newGame;
newGame=function(hero){G.secret={};_newGame(hero);};

/* ---- 表现：成就页记个数，还回去的星挂在标题页 ---- */
const _openAch=openAch;
openAch=function(){_openAch();const p=document.querySelector('#sheet .muted2');
  if(p)p.insertAdjacentHTML('afterend',`<p class="muted2">隐藏事件 ${Object.keys(META.secrets).length} / ${SECRET_N}</p>`);};
const _titleScreen=titleScreen;
titleScreen=function(){_titleScreen();if(META.secrets.star)$('#screen').insertAdjacentHTML('beforeend','<i class="nstar" title="借来的星，还回去了"></i>');};
document.head.insertAdjacentHTML('beforeend',`<style>
.sletter{font-size:13px;line-height:1.7;text-align:left;color:#e8dcc0;margin-bottom:10px}
.sletter span{display:block;text-align:right}
.nstar{position:fixed;top:7%;right:16%;width:4px;height:4px;background:#fff7d0;box-shadow:0 0 6px 2px #ffe79a;pointer-events:none;animation:nstar 3s ease-in-out infinite}
@keyframes nstar{50%{opacity:.5}}
</style>`);
