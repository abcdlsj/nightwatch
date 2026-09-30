
/* ================= 第二套敌人：霜潮 =================
 * 每局开始随机选一套敌人：「亡者与深渊」（原来那套）或「霜潮」。
 * 霜潮按角色一一对应原来的敌人（数值相同，外形和台词不同），另外多了一个「冻手」：
 * 雪人、冰山雪橇、霜狼撞到城墙时，会把你一张卡冻住一会儿。首领（暗影骑士、深渊之眼）两套共用。
 */
FACTIONS.frost='霜潮';
const FOESETS={
  dark:{n:'亡者与深渊',map:{}},
  frost:{n:'霜潮',map:{slime:'f_mite',bat:'f_owl',skel:'f_husk',bug:'f_egg',mini:'f_chip',golem:'f_yeti',shieldb:'f_warden',shaman:'f_witch',
    drummer:'f_horn',bomber:'f_beetle',ghost:'f_wisp',necro:'f_priest',siege:'f_sled',berserker:'f_wolf',catapult:'f_ballista'}}
};
const foeKey=k=>(FOESETS[G.foeSet]||FOESETS.dark).map[k]||k;
const _FROST={
  f_mite:{n:'冰螨',col:'#73eff7',spd:.06},
  f_owl:{n:'雪鸮',col:'#f4f4f4',tip:'飞得快，还左右乱晃。'},
  f_husk:{n:'冻尸',col:'#41a6f6',tip:'身上结了层冰壳，能减免每次命中的伤害。'},
  f_egg:{n:'冰卵',col:'#73eff7',splitInto:'f_chip',tip:'打碎了会蹦出两只冰碴。',intro:['soldier','那颗蛋……在动！']},
  f_chip:{n:'冰碴',col:'#73eff7',small:1},
  f_yeti:{n:'雪人',col:'#f4f4f4',chill:2,tip:'皮糙肉厚，撞墙时会冻住你一张卡2秒。',intro:['soldier','雪……雪堆站起来了！']},
  f_warden:{n:'冰墙卫',col:'#73eff7',tip:'举着冰盾，给身边的怪加护甲。',intro:['soldier','冰墙！它们躲在冰后面！']},
  f_witch:{n:'霜巫',col:'#41a6f6',tip:'每3秒给身边的怪回血。',intro:['soldier','后面那个在哼歌——冰在往伤口上长！']},
  f_horn:{n:'号角手',col:'#c28a4d',tip:'号角一响，身边的怪走得更快。',intro:['soldier','听那号角！它们越走越快了！']},
  f_beetle:{n:'冰雷甲虫',col:'#41a6f6',tip:'撞墙伤害3点；打死时冰雷会炸，连身边的怪一起炸。',intro:['soldier','甲虫背着冰疙瘩！打爆它，别让它靠墙！']},
  f_wisp:{n:'雪雾',col:'#f4f4f4',tip:'一阵一阵地散开：散开时打不着，也伤不到。',intro:['soldier','箭从雪里穿过去了！那到底是什么？']},
  f_priest:{n:'冰棺祭司',col:'#73eff7',raiseAs:'f_husk',tip:'每5秒让附近倒下的怪变成冻尸站起来。先打它！',intro:['f_priest','起来吧。北边的冷，还没结束。']},
  f_sled:{n:'冰山雪橇',col:'#73eff7',cargo:['f_husk',5],chill:2,tip:'又慢又硬，撞墙8点，还会冻住一张卡；打碎了放出一队冻尸。',intro:['soldier','一整座冰山……在往这边拖！']},
  f_wolf:{n:'霜狼',col:'#94b0c2',chill:1,tip:'血越少跑得越快；撞墙时会冻住一张卡1秒。',intro:['soldier','狼！那头狼越打越疯！']},
  f_ballista:{n:'冰弩车',col:'#73eff7',tip:'停在远处，每4.5秒往墙上射一根冰锥（1点）。',intro:['soldier','冰弩车！冰锥要来了——趴下！']}
};
for(const k in FOESETS.frost.map){const v=FOESETS.frost.map[k];
  EN[v]=Object.assign({},EN[k],{spr:v,faction:FACTIONS.frost,intro:null},_FROST[v]);
  if(!_FROST[v].tip&&EN[k].tip)EN[v].tip=EN[k].tip;}
EN.mini.small=1;
/* 夜晚剧情里跟敌人有关的句子，换成霜潮版本 */
const NIGHTS_FROST={
  0:{title:'第一夜 · 白毛风',beats:{0:[1,'narr','黄昏刚过，北边刮来一阵白毛风。风里有东西在爬。']}},
  1:{title:'第二夜 · 雪里的眼睛',beats:{0:[1,'narr','雪鸮在城头打转。雪地底下，有东西背着冰雷往墙根拱。'],1:[8,'soldier','甲虫背着冰疙瘩！是谁教它们做冰雷的？'],
    2:[12,'hero',{ayla:'打爆它们，离墙越远越好。',mo:'冰雷……这是学院冷库里的做法。',ying:'它们背上的东西在滴答响，跟钟一个节奏。'}],3:[26,'bellman','墙根结冰了！快拿火把来烤！']}},
  2:{title:'第三夜 · 冰里的熟人',beats:{0:[1,'narr','冻住的人从雪里站起来。有的还举着当年的盾。'],1:[7,'soldier','那是……老汉斯？他冻在冰里三年了！']}},
  4:{title:'第五夜 · 冰棺祭司',beats:{1:[8,'f_priest','我是灰袍的学徒。老师让我把北边的冷，带给你们。'],3:[24,'soldier','冻尸又站起来了！先打那个戴冰冠的！']}},
  5:{title:'第六夜 · 冰山压城',beats:{0:[1,'narr','地面在震。深渊拖来整块的冰山，里面冻着一整队兵。'],1:[6,'soldier','冰锥！趴下！'],
    2:[10,'hero',{ayla:'把最重的家伙留给最重的武器。',mo:'弹道很标准。有人在教它们几何。',ying:'那些弩车……是照着我们的图纸做的！'}],3:[26,'bellman','东墙冻裂了！能动的都去东墙！']}}
};
function nightInfo(r){const N=NIGHTS[r-1]||{title:'第'+r+'夜',beats:[]};if(G.foeSet!=='frost'||!NIGHTS_FROST[r-1])return N;
  const O=NIGHTS_FROST[r-1];return{title:O.title||N.title,beats:N.beats.map((b,i)=>O.beats[i]||b)};}
