
/* ================= 触发框架：关键词 / 功能标签 / 事件卡 / 触发型物品 =================
 * 卡牌与物品可以声明 on:{事件:(卡或物品层数, 上下文)=>{}}，事件由 emit() 在战斗中发出：
 *   start 开战 · use 任意卡触发 · hit 命中 · crit 暴击 · burn/poison/freeze 施加状态 · bounce 闪电弹跳
 *   kill 击杀 · wall 城墙受击 · charge 某卡被充能 · chain 连锁到5的倍数
 * 每张卡每种事件每秒最多响应8次，防止互相触发成死循环。
 */
Object.assign(KW,{
  '冻结':'敌人停止移动；精英和首领减半，首领被冻得越多越难冻住。',
  '加速':'卡牌冷却走得快一倍，持续数秒。',
  '弹药':'每场战斗只能触发有限次数，打完就熄火；升品质多1发。',
  '装填':'为弹药卡补回弹药。',
  '多重':'每次触发连续打出多次。',
  '易伤':'被标记的敌人受到所有伤害提高。',
  '处决':'命中后生命低于一定比例的敌人直接死亡（首领免疫，精英门槛减半）。',
  '成长':'永久提升基础伤害，跨夜保留，合成时一并继承。',
  '任务':'完成条件后，在夜晚结束时变成更强的卡。'
});

/* 功能标签：和元素标签交叉，用于「每有一张某类卡」 */
const KINDS={
  '兵器':['dagger','xbow','axe','oathsword','ballista','emberblade','cleaver','arrowrain','greatsword','executioner','sling','gear','clockwork'],
  '火器':['cannon','firecracker','flamethrower','oilbarrel','oilpit'],
  '药剂':['vial','acidvial','plague','putrefy','needle','snakekiss','acidrain','plagueburst','arcbottle','stormflask','frostvial','icebomb','concentrate','miasma','resonate','quicklime','venom','gasbomb','oilflask'],
  '机关':['clock','anvil','colossus','whetstone','musicbox','pendulum','windup','mainspring','toolbox','warhorn','tesla'],
  '灯具':['firefly','paperlamp','dragonlantern','lamplight','beacon','skylantern','oilspill','oilpot','fuse','moth','paperkite'],
  '天象':['thunder','blizzard','starfall','wildfire','sunflare','phoenix','bolt']
};
for(const k in KINDS)for(const key of KINDS[k])if(ITEMS[key])ITEMS[key].kind=k;

const pct=v=>'+'+Math.round(v*100)+'%';
const lr=()=>{const b=boardCards();return[b[0],b[b.length-1]];};

/* ---------------- 新卡：通用 ---------------- */
Object.assign(ITEMS,{
  sparkwick:{n:'引火芯',size:1,tag:'火',t:0,up:'dmg',cd:0,passive:1,dmg:6,fx:'spark',burn:2,
    on:{burn:(c,x)=>{if(x.src!==c)chargeCard(c,.25);}},
    d:'没有冷却。每当其他卡施加灼烧，本卡充能25%；触发时点燃目标。',f:'一截灯芯，蘸过七百年的油。见火就着。'},
  frostseal:{n:'冰封符',size:1,tag:'冰',t:0,up:'cd',cd:2.0,dmg:3,fx:'ice',slow:0,freeze:1,
    d:'命中后【冻结】目标1秒。',f:'贴在门上，门就打不开了。贴在别的东西上，也一样。'},
  rime:{n:'霜裂',size:2,tag:'冰',t:1,up:'dmg',cd:2.4,dmg:12,fx:'ice',slow:.2,frozenMul:3,
    d:'对被【冻结】的敌人造成3倍伤害。',f:'冻透的东西，敲一下就碎。'},
  avalanche:{n:'雪崩',size:3,tag:'冰',t:2,up:'mix',cd:4.4,dmg:20,fx:'avalanche',per:{tag:'冰',pct:.2},kind:'天象',
    d:'砸向所有被减速或【冻结】的敌人（没有就砸最前面的）。每有一张其他【冰】卡，伤害+20%。',f:'北塔的人说，山上的雪是听得懂号令的。'},
  netcoil:{n:'导电网',size:2,tag:'电',t:1,up:'cd',cd:0,passive:1,dmg:10,fx:'discharge',kind:'机关',
    on:{bounce:(c,x)=>{if(x.src!==c)chargeCard(c,.12);}},
    d:'没有冷却。每当闪电弹跳，本卡充能12%；触发时电击所有被减速或冻结的敌人。',f:'铜丝织的网，挂在城垛之间。下雨天别碰。'},
  appwand:{n:'学徒雷杖',size:1,tag:'电',t:0,up:'mix',cd:1.6,dmg:5,fx:'bolt',chain:1,quest:{n:100,into:'thunderking',t:'累计闪电弹跳'},
    on:{bounce:c=>questAdd(c)},
    d:'闪电额外弹跳1个敌人。【任务】你的闪电累计弹跳100次后，变成「雷王杖」。',f:'学院的练习杖。据说有人用它劈开过院长的桌子。'},
  thunderking:{n:'雷王杖',size:1,tag:'电',t:0,up:'mix',cd:1.4,dmg:10,fx:'bolt',chain:6,noPool:1,
    d:'闪电额外弹跳6个敌人（60%伤害）。',f:'桌子是院长自己劈的。杖是后来才配上的名字。'},
  headxbow:{n:'猎头弩',size:2,tag:'刃',t:1,up:'dmg',cd:2.6,dmg:60,fx:'arrow',pierce:3,ammo:3,kind:'兵器',
    d:'【弹药3】巨型弩箭，穿透目标身后3个敌人。',f:'一支箭值一头牛。赏金猎人从不乱射。'},
  armorer:{n:'弹药匠',size:1,tag:'机',t:1,up:'cd',cd:4.5,dmg:0,fx:'none',reload:1,reloadElse:.1,kind:'机关',numT:()=>'装填',
    d:'为左右相邻的弹药卡【装填】1发；相邻不是弹药卡则充能10%。',f:'他数得清城里每一支箭。包括射出去没回来的。'},
  volley:{n:'连珠火铳',size:2,tag:'火',t:1,up:'dmg',cd:3.2,dmg:7,fx:'knife',multi:3,kind:'火器',
    d:'【多重3】一次扣扳机，连打三发。',f:'三根枪管，一根引信。点着之后就别想停。'},
  smokebomb:{n:'标记烟',size:1,tag:'毒',t:0,up:'cd',cd:1.8,dmg:3,fx:'sting',poison:1,vuln:[4,.25],kind:'药剂',
    d:'命中后使目标【易伤】4秒：受到的所有伤害+25%。',f:'红色的烟。沾上了，全城的弓手都看得见你。'},
  guillotine:{n:'断头台',size:3,tag:'刃',t:2,up:'dmg',cd:5.0,dmg:40,fx:'axe',exec:.2,kind:'机关',
    d:'沉重的一击，【处决】生命低于20%的敌人。',f:'城门口那台是装饰。城墙上这台不是。'},
  honeblade:{n:'磨砺之刃',size:1,tag:'刃',t:0,up:'dmg',cd:1.4,dmg:5,fx:'knife',kind:'兵器',
    on:{kill:(c,x)=>{if(x.src===c)growCard(c,x.elite?3:.1);}},
    d:'【成长】本卡每击杀1个敌人，基础伤害永久+0.1；击杀精英或首领+3。',f:'每砍一次，刃口就更薄一点，也更利一点。'},
  alarmbell:{n:'警钟',size:1,tag:'机',t:1,up:'cd',cd:0,passive:1,dmg:0,fx:'none',kind:'机关',numT:()=>'+5%',
    on:{wall:c=>{if(c.lastT>B.t-1)return;c.lastT=B.t;restart(c.el,'pop');for(const o of boardCards())if(o!==c)chargeCard(o,.05*(1+.4*stepOf(c)),c);}},
    d:'没有冷却。每当城墙受击，所有卡充能5%（每秒最多一次）。',f:'敲钟的人换了七代，钟还是那口钟。'}
});

/* ---------------- 新卡：艾拉 ---------------- */
Object.assign(ITEMS,{
  wardrum:{n:'战鼓',size:2,tag:'机',t:1,up:'cd',cd:4.0,dmg:0,fx:'none',hasteKind:{kind:'兵器',t:1.5},hero:'ayla',numT:()=>'加速',
    d:'触发时，棋盘上所有【兵器】卡【加速】1.5秒。',f:'咚，咚，咚。刀剑跟着鼓点落下。'},
  vetblade:{n:'老兵之刃',size:2,tag:'刃',t:1,up:'dmg',cd:2.2,dmg:14,fx:'slash',stack:1,kind:'兵器',hero:'ayla',
    on:{kill:(c,x)=>{if(x.src===c&&x.elite)growCard(c,10);}},
    d:'本场每触发一次，伤害+1。【成长】本卡击杀精英或首领时，基础伤害永久+10。',f:'刀鞘比刀旧。她说刀换过三次，鞘没换过。'},
  javelin:{n:'标枪手',size:1,tag:'刃',t:1,up:'dmg',cd:1.6,dmg:35,fx:'knife',ammo:2,kind:'兵器',hero:'ayla',
    on:{crit:(c,x)=>{if(x.src&&x.src!==c&&c.nb&&c.nb.includes(x.src))reload(c,1,x.src);}},
    d:'【弹药2】重标枪。相邻的卡暴击时，为本卡【装填】1发。',f:'他只背两支。第三支，从敌人身上拔。'},
  oiltrap:{n:'火油陷阱',size:2,tag:'火',t:1,up:'dmg',cd:0,passive:1,dmg:0,fx:'none',hero:'ayla',numT:()=>'引爆',
    on:{kill:(c,x)=>{if(!x.burning)return;const e=x.e,X=ex(e),Y=ey(e)-4,R=18*K();const amt=Math.max(4,e.burnD*Math.max(1,e.burnT)*2)*dmgMul(c)*(1+mv('burn'));
      boom(X,Y,R,'#ef7d57');restart(c.el,'pop');later(.04,()=>{for(const o of B.en)if(!o.dead&&Math.hypot(ex(o)-X,ey(o)-Y)<=R)hurt(o,amt,c,false,{burn:2});});}},
    d:'没有冷却。带着灼烧的敌人死亡时爆炸，对周围造成剩余灼烧×2的伤害并点燃它们。',f:'坑是艾拉挖的，油是墨给的。两人都说是对方的主意。'},
  flagpole:{n:'号令旗',size:1,tag:'机',t:1,up:'cd',cd:0,passive:1,dmg:0,fx:'none',hero:'ayla',numT:c=>pct(.15+.05*stepOf(c)),
    on:{use:(c,x)=>{const[L,R]=lr();if(x.c!==L||L===c||!R||R===c)return;chargeCard(R,.15+.05*stepOf(c),c);}},
    d:'没有冷却。最左边的卡每次触发，最右边的卡充能15%。',f:'旗在左边升起，右边的人就知道该动了。'},
  nightsword:{n:'守夜人之剑',size:2,tag:'刃',t:1,up:'mix',cd:2.0,dmg:24,fx:'slash',exec:.15,kind:'兵器',hero:'ayla',noPool:1,
    d:'斩击目标并波及身旁的敌人，【处决】生命低于15%的敌人。',f:'第八个名字刻上去了。是她自己的。'}
});

/* ---------------- 新卡：墨 ---------------- */
Object.assign(ITEMS,{
  crucible:{n:'元素熔炉',size:3,tag:'火',t:2,up:'mix',cd:4.0,dmg:26,fx:'flame',aoe:30,burn:3,per:{elem:1,pct:.2},kind:'药剂',hero:'mo',
    d:'喷出混杂的元素火焰。棋盘上每有一种不同的元素，伤害+20%。',f:'学院说四种元素不能放进同一口锅。她放了。锅还在。'},
  condenser:{n:'冷凝瓶',size:1,tag:'冰',t:0,up:'cd',cd:1.8,dmg:3,fx:'ice',slow:0,freeze:.8,kind:'药剂',hero:'mo',
    on:{freeze:(c,x)=>{if(x.src!==c)return;for(const n of c.nb||[])if(ITEMS[n.key].tag==='火'){n.anvil=Math.max(n.anvil||0,.5);FX.link(c.el,n.el,'#73eff7',.2);}}},
    d:'【冻结】目标0.8秒；每冻住一个敌人，相邻的【火】卡下一击+50%。',f:'冷热交替，玻璃会炸。她管这叫“反应”。'},
  shockvenom:{n:'感电毒',size:2,tag:'电',t:1,up:'mix',cd:2.6,dmg:8,fx:'bolt',chain:3,kind:'药剂',hero:'mo',
    on:{bounce:(c,x)=>{if(x.src===c&&x.e.poisonT>0&&!x.e.dead)hurt(x.e,x.e.poisonD,c,false,{poisonTick:1});}},
    d:'闪电弹跳3次；弹跳命中中毒的敌人时，立即结算它1秒的中毒伤害。',f:'电流让毒走得更快。她在自己身上试过一次。只试过一次。'},
  midas:{n:'点金药',size:1,tag:'毒',t:1,up:'dmg',cd:1.8,dmg:4,fx:'sting',poison:2,kind:'药剂',hero:'mo',
    on:{kill:(c,x)=>{if(!x.poisoned||c.cnt>=5)return;c.cnt++;G.gold++;B.greed++;const[cx,cy]=toClient(ex(x.e),ey(x.e));FX.coins(cx,cy,1);SFX.play('coin');updateHUD();}},
    d:'施加中毒。中毒的敌人死亡时获得1金币（每场最多5枚）。',f:'把铅变成金子太难了。把怪物变成金子，容易一点。'},
  jars:{n:'瓶瓶罐罐',size:2,tag:'机',t:1,up:'cd',cd:0,passive:1,dmg:0,fx:'none',kindHaste:1,kind:'药剂',hero:'mo',numT:()=>'-6%',
    d:'没有伤害。每有一张【药剂】卡，所有药剂卡冷却缩短6%。',f:'摆得越乱，找得越快。她坚持这是一种秩序。'},
  supersat:{n:'过饱和溶液',size:1,tag:'毒',t:0,up:'dmg',cd:1.5,dmg:4,fx:'sting',poison:2,kind:'药剂',hero:'mo',quest:{n:300,into:'sagedrop',t:'累计施加中毒'},
    on:{poison:c=>questAdd(c)},
    d:'施加中毒。【任务】你累计施加中毒300次后，变成「贤者之滴」。',f:'再多溶一粒，就要析出来了。'},
  sagedrop:{n:'贤者之滴',size:1,tag:'毒',t:0,up:'dmg',cd:1.3,dmg:6,fx:'sting',poison:4,poisonDur:6,kind:'药剂',hero:'mo',noPool:1,
    d:'施加强力中毒，持续时间翻倍（6秒）。',f:'一滴，就够一整条街安静下来。'}
});

/* ---------------- 新卡：萤 ---------------- */
Object.assign(ITEMS,{
  marquee:{n:'走马灯',size:2,tag:'机',t:1,up:'cd',cd:2.4,dmg:11,fx:'firefly',kind:'灯具',hero:'ying',
    on:{charge:(c,x)=>{if(x.c!==c&&x.c.size===1)c.charge=Math.min(1.5,c.charge+.04);}},
    d:'放出萤火飞向最前方3个敌人。每当一张小型卡被充能，本卡充能4%。',f:'灯罩转一圈，墙上的影子就跑一圈。'},
  crackers:{n:'连环爆竹',size:1,tag:'火',t:0,up:'dmg',cd:2.2,dmg:3,fx:'shell',aoe:10,multi:4,kind:'火器',hero:'ying',
    d:'【多重4】噼里啪啦连炸四下。',f:'一挂一百响。她每次只点四响，剩下的留着过年。'},
  wickcut:{n:'灯芯剪',size:1,tag:'机',t:1,up:'cd',cd:3.0,dmg:0,fx:'none',hasteNb:2,kind:'机关',hero:'ying',numT:()=>'加速',
    d:'触发时，左右相邻的卡【加速】2秒。',f:'剪掉焦黑的一截，火就重新亮起来。'},
  lamps:{n:'百盏灯',size:1,tag:'火',t:0,up:'dmg',cd:1.4,dmg:3,fx:'spark',burn:2,kind:'灯具',hero:'ying',
    onWin:c=>growCard(c,countKind('灯具')),
    d:'点燃目标。【成长】每守住一夜，棋盘上每有一张【灯具】卡，基础伤害永久+1。',f:'第一百盏点亮的时候，整条街都会抬头。'},
  ffjar:{n:'萤火罐',size:1,tag:'机',t:1,up:'cd',cd:.6,dmg:3,fx:'firefly',ammo:6,kind:'灯具',hero:'ying',
    on:{use:(c,x)=>{if(x.c.key==='musicbox')reload(c,2,x.c);}},
    d:'【弹药6】飞快地放出萤火。八音盒触发时，为本卡【装填】2发。',f:'夏天抓的。每一只她都起了名字。'},
  pocketwatch:{n:'师父的怀表',size:2,tag:'机',t:2,up:'cd',cd:10,dmg:0,fx:'none',hasteSmall:3,kind:'机关',hero:'ying',numT:()=>'加速',
    on:{start:c=>{for(const o of boardCards())if(o!==c&&o.size===1)haste(o,3,c);}},
    d:'开战时和每次触发时，所有小型卡【加速】3秒。',f:'表停在师父出城的那一刻。她每天给它上弦，它每天都不走。'}
});

/* ---------------- 旧卡改造：去掉只换数值的重复 ---------------- */
Object.assign(ITEMS.oathsword,{quest:{n:40,into:'nightsword',t:'用它击杀敌人'},on:{kill:(c,x)=>{if(x.src===c)questAdd(c);}},
  d:'斩击目标，并波及它身旁的一个敌人。【任务】用它击杀40个敌人后，变成「守夜人之剑」。'});
Object.assign(ITEMS.rally,{charge:.3,chargeKind:'兵器',d:'触发时为左右相邻的【兵器】卡充能30%，品质越高充得越多。'});
Object.assign(ITEMS.windup,{charge:0,hasteNb:1.5,numT:()=>'加速',d:'触发时，左右相邻的卡【加速】1.5秒。'});
Object.assign(ITEMS.oilpot,{charge:0,reload:1,reloadElse:.1,numT:()=>'装填',d:'为灯添油：为左右相邻的弹药卡【装填】1发，相邻不是弹药卡则充能10%。'});
Object.assign(ITEMS.bloodrage,{on:{wall:c=>{c.rage=Math.min(1,(c.rage||0)+.1);}},numT:c=>pct(buffAmt(c)),
  d:'触发时，左右相邻卡的下一次攻击伤害+40%。城墙每受击一次，本场效果再+10%。'});
Object.assign(ITEMS.toolbox,{buffKind:{kind:'机关',amt:.1},numT:c=>pct(buffAmt(c)),d:'触发时，左右相邻卡的下一次攻击伤害+35%；每有一张【机关】卡，再+10%。'});
Object.assign(ITEMS.anvil,{numT:c=>pct(buffAmt(c))});
Object.assign(ITEMS.emberblade,{critBurn:2,kind:'兵器',d:'刀锋上沾着未熄的火星，命中后点燃目标；暴击时灼烧翻倍。'});
Object.assign(ITEMS.paperlamp,{per:{kind:'灯具',pct:.15},d:'放飞一盏小纸灯，点燃目标。每有一张其他【灯具】卡，伤害+15%。'});
Object.assign(ITEMS.oilspill,{burnMul:1.5,d:'泼出一勺灯油，点燃目标；对已经在燃烧的敌人伤害+50%。'});
Object.assign(ITEMS.brand,{burnDur:6,d:'烧红的烙铁，留下难以熄灭的灼伤：灼烧持续6秒。'});
Object.assign(ITEMS.acidvial,{vuln:[2,.15],d:'泼出腐蚀性的毒液并施加中毒，使目标【易伤】2秒：受到的伤害+15%。'});
ITEMS.whetstone.n='磨刀轮';

/* ---------------- 触发型物品 ---------------- */
Object.assign(MODL,{ammo:['弹药卡每场弹药',0],
  t_kindling:['每场第一次施加灼烧时，所有【火】卡充能30%',2],t_icechain:['被冻结的敌人死亡时，碎冰对周围造成8点伤害',2],
  t_chain:['连锁每达到5层，最左边的卡触发一次（每0.5秒最多一次）',2],t_loot:['每击杀一名精英或首领，获得3金币',2],t_alch:['每有一张【药剂】卡，全部伤害+4%',2],
  t_photo:['【成长】卡的成长速度翻倍',2],t_drum:['城墙受击时，随机一张卡立即触发（每2秒最多一次）',2],
  t_nail:['暴击时使目标【易伤】2秒（+20%）',2],t_map:['【任务】条件减半，完成时额外升一个品质',2]});
Object.assign(RELICS,{
  kindling:{n:'火种',t:0,ico:'orb:o',m:{t_kindling:1},on:{burn:n=>{if(B.flags.kindling)return;B.flags.kindling=1;for(const o of boardCards())if(ITEMS[o.key].tag==='火')chargeCard(o,.3*n,null);}},f:'用手捂着走了三里路，一次都没灭。'},
  icechain:{n:'冰锥项链',t:0,ico:'ring:C',m:{t_icechain:1},on:{kill:(n,x)=>{if(!x.frozen)return;const X=ex(x.e),Y=ey(x.e)-4,R=16*K();ring(X,Y,2,R,'#c2f4ff',.3);
    later(.03,()=>{for(const o of B.en)if(!o.dead&&Math.hypot(ex(o)-X,ey(o)-Y)<=R)hurt(o,8*n,null,false,{});});}},f:'每一颗冰锥里，都冻着一小声尖叫。'},
  magazine:{n:'弹匣',t:0,ico:'book:g',m:{ammo:1},f:'多一发，往往就是多一条命。'},
  chaingear:{n:'连珠机括',t:1,ico:'ring:y',m:{t_chain:1},on:{chain:()=>{if(B.flags.cgT>B.t-.5)return;B.flags.cgT=B.t;const[L]=lr();if(L)later(.1,()=>{if(!B.over)trigger(L,1,'连珠机括');});}},f:'咔、咔、咔——第五声之后，总会多出一声。'},
  lootbag:{n:'战利品袋',t:1,ico:'book:N',m:{t_loot:1},on:{kill:(n,x)=>{if(!x.elite)return;G.gold+=3*n;const[cx,cy]=toClient(ex(x.e),ey(x.e));FX.coins(cx,cy,6);SFX.play('coin');updateHUD();}},f:'袋子底下有个洞。但大件的东西掉不出去。'},
  alchbook:{n:'炼金手册',t:1,ico:'book:P',m:{t_alch:1},f:'扉页写着：本书内容请勿在室内尝试。'},
  photo:{n:'师徒合照',t:1,ico:'scroll:y',m:{t_photo:1},u:1,f:'照片上的两个人都没在笑，但都站得很近。'},
  thunderdrum:{n:'雷鸣鼓',t:2,ico:'orb:Y',m:{t_drum:1},on:{wall:()=>{if(B.flags.drumT>B.t-2)return;B.flags.drumT=B.t;const b=boardCards().filter(o=>o.ammo!==0&&o.frozen<=0);if(b.length)trigger(pick(b),1,'雷鸣鼓');}},f:'城墙挨一下，鼓就响一下。敌人很快就学会了害怕这声音。'},
  tyrantnail:{n:'暴君的钉子',t:2,ico:'claw:R',m:{t_nail:1},on:{crit:(n,x)=>{if(x.e&&!x.e.dead)vuln(x.e,2,.2);}},f:'从旧王座上拔下来的。王座上的人，是后来才拔下来的。'},
  treasuremap:{n:'寻宝图',t:3,ico:'scroll:N',m:{t_map:1},u:1,f:'X 标在城墙上。所以宝藏一直在你脚下。'}
});

/* ---------------- 备战事件：按功能标签进货 ---------------- */
Object.assign(EVENTS,{
  armory:{n:'军械库',ico:'xbow',cat:'shop',w:1,d:'只卖【兵器】【火器】',f:'库管说每件都登记过。登记簿上的墨还没干。',filter:it=>it.kind==='兵器'||it.kind==='火器'},
  apothecary:{n:'药剂铺',ico:'potion:P',cat:'shop',w:.9,d:'只卖【药剂】【灯具】',f:'架子上的瓶子会自己换位置。',filter:it=>it.kind==='药剂'||it.kind==='灯具'}
});
