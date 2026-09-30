
/* ================= 天赋：随机天赋池 / 夜谈 =================
 * 天赋不再是固定的三条分支，而是一个池子：人物专属 + 通用。
 * 每两夜（第1、3、5、7夜之前）有一次固定的「夜谈」：先聊几句，回答决定这次更容易抽到哪一类，再三选一。
 * 平时的备战事件里偶尔会碰到「过路人」「残破的手札」，也能学到天赋或拿到专属卡。
 */
const TCAT={
  atk:{n:'进攻',c:'#ff8a5b',ico:'claw:R'},
  def:{n:'守城',c:'#9fc4e0',ico:'badge:c'},
  tech:{n:'门道',c:'#ffd166',ico:'ring:y'},
  eco:{n:'家底',c:'#7ee8a2',ico:'r_purse'}
};
Object.assign(MODL,{
  t_opener:['开战时，最左和最右的卡各打一次',2],
  t_bloodlust:['每杀12个敌人，所有卡充能15%',2],
  t_revenge:['城墙挨打时，最右边的卡充能40%（每秒最多一次）',2],
  t_last:['城墙不到35%时，攻击速度+25%',2],
  t_echo:['连锁每到5层，城墙回1点（每2秒最多一次）',2]
});
const TALENTS={
  /* ---- 通用 ---- */
  quick:{n:'手快',cat:'atk',r:0,m:{spd:.08},say:'慢一步，就得多挨一下。'},
  sharp:{n:'眼尖',cat:'atk',r:0,m:{crit:.06},say:'盯住那条缝，别眨眼。'},
  heavy:{n:'下死手',cat:'atk',r:1,m:{critDmg:.5},say:'要打就打疼它。'},
  vanguard:{n:'打头阵',cat:'atk',r:0,m:{left:.35},say:'最左边那个位置，归最狠的家伙。'},
  rearguard:{n:'压阵',cat:'atk',r:0,m:{right:.35},say:'最后一个出手的，得最稳。'},
  loner:{n:'独来独往',cat:'atk',r:1,m:{lonely:.35},say:'离远点，别碍我事。'},
  opener:{n:'开门红',cat:'atk',r:1,m:{t_opener:1},say:'铃一响，先给它们来一下。',
    on:{start:()=>later(.3,()=>{const b=boardCards();const L=b[0],R=b[b.length-1];if(L)trigger(L,1,'开门红');if(R&&R!==L)later(.1,()=>{if(!B.over)trigger(R,1,'开门红');});})}},
  bloodlust:{n:'杀红了眼',cat:'atk',r:2,m:{t_bloodlust:1},say:'越打越顺手。',
    on:{kill:()=>{B.flags.kc=(B.flags.kc||0)+1;if(B.flags.kc%12)return;for(const o of boardCards())chargeCard(o,.15,null);}}},
  tough:{n:'墙根结实',cat:'def',r:0,m:{wall:6},say:'砖缝里灌了铁水，一时半会儿倒不了。'},
  bulwark:{n:'早有准备',cat:'def',r:0,m:{shieldStart:7},say:'盾先挂上墙，人再上。'},
  mender:{n:'边打边补',cat:'def',r:1,m:{regen:4},say:'天一亮就补墙，不等人催。'},
  revenge:{n:'以牙还牙',cat:'def',r:1,m:{t_revenge:1},say:'敢碰我的墙？',
    on:{wall:()=>{if(B.flags.revT>B.t-1)return;B.flags.revT=B.t;const b=boardCards();const R=b[b.length-1];if(R)chargeCard(R,.4,null);}}},
  laststand:{n:'背水一战',cat:'def',r:2,m:{t_last:1},say:'退？后面就是城了，往哪退。'},
  early:{n:'提前上弦',cat:'tech',r:0,m:{startCharge:.2},say:'家伙什儿先预热好。'},
  pierce:{n:'找缝',cat:'tech',r:1,m:{pen:2},say:'再硬的壳也有接缝。'},
  crowd:{n:'人多好办事',cat:'tech',r:1,m:{full:.2},say:'墙上站满了，心里才踏实。'},
  echoer:{n:'回声',cat:'tech',r:2,m:{t_echo:1,chain:1},say:'一声接一声，停不下来。',
    on:{chain:()=>{if(B.flags.echoT>B.t-2)return;B.flags.echoT=B.t;G.wall=Math.min(G.wallMax,G.wall+1);updateHUD();}}},
  thrift:{n:'抠门',cat:'eco',r:0,m:{interest:3},say:'一个铜板掰成两半花。'},
  wage:{n:'讨工钱',cat:'eco',r:0,m:{winGold:2},say:'守一夜是一夜的钱，少一个子儿都不行。'},
  loot:{n:'顺手牵羊',cat:'eco',r:1,m:{killGold:.05},say:'它们身上总揣着点什么。'}
};
/* 人物专属：由原来的三条分支改造，数值略加强（天赋变少了） */
const _TCATS={ayla:['def','atk','tech'],mo:['atk','def','tech'],ying:['atk','tech','atk']};
for(const h in TREES)TREES[h].forEach((br,b)=>br.nodes.forEach((nd,i)=>{
  const m={};for(const k in nd.m){const v=nd.m[k];m[k]=Math.abs(v)<1?Math.round(v*1.3*100)/100:v;}
  TALENTS[h+'_'+b+i]={n:nd.n,cat:(_TCATS[h]||[])[b]||'atk',r:i,m,hero:h,say:((TREE_SAY[h]||[])[b]||[])[i]||''};
}));
function talentOk(id){const T=TALENTS[id];return T&&!G.skills.includes(id)&&(!T.hero||T.hero===G.hero);}
function rollTalents(n,bias){
  const out=[];const pool=Object.keys(TALENTS).filter(k=>talentOk(k)&&!TALENTS[k].fit);
  const w=id=>{const T=TALENTS[id];return[6,3,1.3][T.r]*(T.hero?1.5:1)*(bias&&T.cat===bias?3:1)*(T.r===2&&G.round<3?.3:1);};
  while(out.length<n){const p=pool.filter(k=>!out.includes(k));if(!p.length)break;
    let t=Math.random()*p.reduce((s,k)=>s+w(k),0);let got=p[p.length-1];for(const k of p){t-=w(k);if(t<=0){got=k;break;}}out.push(got);}
  if(typeof fitTalent==='function'){const f=fitTalent(out);if(f)out.push(f);}
  return out;
}
function learnTalent(id){if(!talentOk(id))return;G.skills.push(id);const w=TALENTS[id].m.wall;if(w){G.wallMax+=w;G.wall+=w;}
  recalcMods();renderOwned();updateHUD();SFX.play('merge');toast('学会了：'+TALENTS[id].n);}
function talentText(id){const T=TALENTS[id];return T.d||modText(T.m);}

/* ---- 夜谈：每两夜一次，说话的人和问题不同，回答决定倾向 ---- */
const TALKS=[
  {who:'bellman',title:'钟楼下',lines:[
    ['bellman','又轮到你守夜了？来，喝口热汤，暖暖手。'],
    ['bellman',{ayla:'二十年了，你每回上墙前都不说话。今天说两句？',mo:'学院的人都走光了，就你还肯回来。你图啥？',ying:'小萤，你师父要是看见你站上城墙，得骂我没拦着你。'}]],
    q:'老吉：“今晚你打算怎么弄？”',ans:[
      {cat:'atk',t:{ayla:'简单。见一个砍一个。',mo:'炸。能炸的都炸了。',ying:'把灯全点亮，照到哪打到哪！'},re:'行，痛快。那我多敲两下钟，给你助威。'},
      {cat:'def',t:{ayla:'先把墙守住。人在墙在。',mo:'先把墙加固。实验台不能塌。',ying:'先把墙上的灯都护好，一盏都不能灭。'},re:'稳当。墙在，大伙儿就睡得着。'},
      {cat:'eco',t:{ayla:'先攒点家底，仗还长着呢。',mo:'经费。我需要经费。',ying:'先攒灯油钱……还有买齿轮的钱。'},re:'哈，过日子的人。明天我帮你问问商队。'}]},
  {who:'soldier',title:'城头',lines:[
    ['soldier',{ayla:'长官……我手抖得停不下来。',mo:'炼金师大人，您那些瓶子……真能管用吗？',ying:'萤姑娘，你一点都不怕吗？'}],
    ['soldier','昨晚我旁边那个，今天没来点卯。']],
    q:'新兵在等你开口。',ans:[
      {cat:'atk',t:{ayla:'抖就对了。抖着也得扣扳机。',mo:'怕就多扔几瓶。数量能治恐惧。',ying:'怕呀。所以我才要先动手。'},re:'……明白了。我去把弩再擦一遍。'},
      {cat:'def',t:{ayla:'站我旁边。我在，你就在。',mo:'躲在墙垛后面，别探头。数据显示有用。',ying:'你守着这盏灯，灯亮着，你就没事。'},re:'是！我就站这儿，哪也不去。'},
      {cat:'tech',t:{ayla:'教你个窍门：看它们的脚，别看脸。',mo:'记住它们的节奏，每一波都有规律。',ying:'听齿轮声。机关一响，你就蹲下。'},re:'看脚……好，我记住了。'}]},
  {who:'greyrobe',title:'墙缝里的声音',lines:[
    ['greyrobe','守夜人。你守得很辛苦吧？'],
    ['greyrobe',{ayla:'卡尔也是这么守着的。你知道他最后怎么样了。',mo:'墨，学院的门还给你留着。回来吧。',ying:'你师父在我这儿。他过得不错，就是有点想你。'}]],
    q:'那声音在等你回话。',ans:[
      {cat:'atk',t:{ayla:'有本事出来说。',mo:'学院？我回去第一件事就是把它炸了。',ying:'把师父还给我！'},re:'……脾气真大。好，今晚我多送点客人给你。'},
      {cat:'def',t:{ayla:'……（把耳朵从墙上移开）',mo:'不回。我这儿挺好。',ying:'我不听。我还要去点灯。'},re:'不说话？没关系。墙总会塌的。'},
      {cat:'tech',t:{ayla:'你说得越多，我越知道你怕什么。',mo:'继续说。你的咒文有破绽，我在记。',ying:'你说话的时候，墙缝里有风。我找到你在哪儿了。'},re:'……聪明的孩子，通常活不长。'}]},
  {who:'bellman',title:'最后一口钟',lines:[
    ['bellman','钟楼就剩这一口钟了。明晚，要么敲早钟，要么就不用敲了。'],
    ['bellman',{ayla:'艾拉，这些年辛苦你了。',mo:'不管天亮不亮，你都算咱们城里的人了。',ying:'孩子，去吧。你师父的灯，一直在钟楼上亮着。'}]],
    q:'老吉：“还有啥要准备的？”',ans:[
      {cat:'atk',t:{ayla:'把能用的家伙全搬上来。',mo:'剩下的材料，全调成最烈的那种。',ying:'把全城的灯都借给我。'},re:'都给你。今晚不留后手。'},
      {cat:'def',t:{ayla:'让孩子们都去地窖。墙上交给我们。',mo:'把墙再糊一层。我有配方。',ying:'城墙上每一段，都点一盏灯。'},re:'好。我去把孩子们领下去。'},
      {cat:'eco',t:{ayla:'把钱都花了吧，留着也没用了。',mo:'把我的奖学金……算了，全押上。',ying:'把我攒的零钱全拿去买灯油。'},re:'哈，那我也把棺材本拿出来。'}]}
];
/* 偶遇：过路人（学天赋）/ 残破的手札（天赋或专属卡） */
const MEETS=[
  {who:'soldier',n:'过路的老兵',say:'我腿瘸了，上不了墙。教你一手，算我帮你守一晚。'},
  {who:'bellman',n:'老吉的旧账本',say:'这是前几任守夜人留下的门道，你挑一个用吧。'},
  {who:'greyrobe',n:'学院逃兵',say:'别告诉灰袍我来过。我只知道这些，拿去。'}
];
Object.assign(EVENTS,{
  mentor:{n:'过路人',ico:'book:P',cat:'rare',w:.22,d:'很少见：能学到一个天赋',f:'路边坐着个人，像是在等你。',need:()=>Object.keys(TALENTS).some(talentOk)},
  manual:{n:'残破的手札',ico:'scroll:P',cat:'rare',w:.22,minR:2,d:'很少见：里面记着一门手艺',f:'前面好几页被撕掉了，剩下的还能看。'}
});
