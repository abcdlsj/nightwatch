
/* ================= 第三名守夜人：萤 · 灯匠学徒 =================
 * 定位：小型卡 + 【机】，靠数量与充能打节奏。晨钟城老钟表匠的学徒，
 * 师父出城前把怀表的齿轮分给了城墙（见“发条”的传闻），她留下来守着全城的灯。
 */
Object.assign(ITEMS,{
  firefly:{n:'萤灯',size:1,tag:'机',t:0,up:'cd',cd:1.3,dmg:3,fx:'firefly',hero:'ying',d:'放出3只萤火，分别飞向最前方的3个敌人。',f:'一盏灯能照亮一段墙。三只萤火能照亮三个坏消息。'},
  musicbox:{n:'八音盒',size:2,tag:'机',t:1,up:'cd',cd:2.6,dmg:0,fx:'none',chargeSmall:.2,hero:'ying',d:'触发时，为棋盘上所有其他小型卡充能20%，品质越高充得越多。',f:'只会放一首曲子。师父说，一首就够了。'},
  pendulum:{n:'大钟摆',size:3,tag:'机',t:2,up:'mix',cd:3.4,dmg:26,fx:'sweep',hero:'ying',d:'钟摆横扫：伤害与目标同一水平线上的所有敌人。',f:'钟楼停摆的那天，她把钟摆拆了下来。'}
});
Object.assign(RELICS,{
  pocketwatch:{n:'师父的怀表',t:1,ico:'orb:y',hero:'ying',m:{spd:.08,startCharge:.1},f:'表盖内侧刻着：别等天亮，去点灯。'},
  jarflies:{n:'萤火虫罐',t:0,ico:'potion:l',hero:'ying',m:{s1:.15},f:'一罐子光，够照亮一段城墙。'},
  earring:{n:'齿轮耳坠',t:0,ico:'ring:y',hero:'ying',m:{'tag_机':.1,crit:.02},f:'左耳一个，右耳一个，走路会响。'},
  oilcan:{n:'灯油壶',t:2,ico:'potion:N',hero:'ying',m:{s1:.2,spd:.06},f:'每盏灯每晚一勺。七百年，一天没落下。'},
  lampbook:{n:'全城的灯谱',t:3,ico:'book:y',u:1,hero:'ying',m:{dmg:.2,s1:.3},f:'记着晨钟城每一盏灯的位置。七百年来，只熄过一盏。'}
});
HEROES.ying={n:'萤',title:'灯匠学徒',col:'#ffd166',portrait:'p_ying',wall:26,gold:10,start:[['firefly',0,3],['clock',1,4]],
  tag:'擅长小型卡与【机】',desc:'老钟表匠的学徒，守着全城的灯。小卡越多越强，擅长充能与节奏。专属：八音盒、大钟摆。',
  intro:'师父说，只要还有一盏灯亮着，这座城就还没输。我负责让它们一直亮着。'};
TREES.ying=[
  {n:'灯',c:'#ffd166',nodes:[{n:'小灯',m:{s1:.15}},{n:'灯串',m:{left:.2,right:.2}},{n:'万家灯火',m:{s1:.3,full:.2}}]},
  {n:'钟',c:'#c99a6b',nodes:[{n:'上弦',m:{startCharge:.2}},{n:'校准',m:{spd:.1}},{n:'报时',m:{'tag_机':.25,spd:.05}}]},
  {n:'光',c:'#fff4cf',nodes:[{n:'反光',m:{crit:.06}},{n:'聚光',m:{critDmg:.6}},{n:'黎明之前',m:{dmg:.15,crit:.06}}]}
];
TREE_SAY.ying=[
  ['一盏小灯，也能让人看清脚下。','把灯连起来，墙就不会有暗处。','你看——整座城都亮了。'],
  ['先上弦，再开工。师父的规矩。','差一秒都不行。齿轮会记仇的。','当——当——当。现在是守夜时间。'],
  ['光打在盔甲上，会告诉你哪里有缝。','把所有的光，收在一个点上。','天亮之前，是最亮的时候。我一直这么相信。']
];
/* 台词：给现有的按人物区分的文本补上萤 */
const _Y={
  chain:['叮叮当当——全都转起来了！','就像师父的钟，一个带动一个！'],crit:['正中！','这一下，比钟声还响。'],
  hurt:['墙上的灯灭了一盏！','别碰我的灯！'],low:['灯……还剩几盏？不，别数了！','只要还有一盏亮着！'],
  freeze:['齿轮卡住了！'],surge:['好多火把……比城里的灯还多。','所有的灯，全都点起来！'],win:['今晚的灯，一盏都没灭。','收工。明晚还要早点来上油。']
};
for(const k in _Y)if(BARKS[k])BARKS[k].ying=_Y[k];
FOEB.knight.low.ying='小姑娘……你的灯……让我想起……';
FOEB.knight.heroLow.ying='卡尔大叔？你以前每天晚上都来钟楼跟师父下棋的！';
FOEB.eye.low.ying='灯匠的学徒。你的师父出城时，是我收下了他。';
FOEB.eye.heroLow.ying='师父……？那我就把光送进去，把他找回来！';
const _YN=['第一晚？别怕，我把灯都点亮了。','地底下有声音……像生锈的齿轮。','汉斯爷爷……他以前每天帮我扛梯子。','那面盾……卡尔大叔以前总把它擦得锃亮。',
  '灰袍？师父出城那天，就是去学院找他。','它们的投石车……是照着我们的图纸做的！','孩子们在搬砖，我去给每段墙都点上灯。','你吞掉了太阳。那我就从这里，一盏一盏把光点回去。'];
NIGHTS.forEach((N,i)=>{for(const b of N.beats)if(b[1]==='hero'&&typeof b[2]==='object')b[2].ying=_YN[i];});
if(STORY.win)for(const p of STORY.win)if(p.who==='hero'&&typeof p.t==='object')p.t.ying='全城的灯都还亮着。师父，你看得见吗？天亮了。';
if(STORY.lose)for(const p of STORY.lose)if(p.who==='hero'&&typeof p.t==='object')p.t.ying='灯……灭了。可是灯芯还在，下次还能点。';
Object.assign(LORE,{
  firefly:['萤小时候怕黑，师父给她做了一盏会自己飞的灯。后来她把这手艺教给了全城的孩子。','第一盏灯','那盏灯至今挂在钟楼顶上。它是整座城最后熄灭的东西——如果真有那一天的话。'],
  musicbox:['老钟表匠只会做一首曲子。他说曲子不在多，在于每个齿轮都知道自己什么时候该转。','师父的曲子','萤从没听完过这首曲子。最后一小节，要等师父回来才上弦。'],
  pendulum:['钟楼的大钟摆了七百年。钟停的那一夜，萤爬上去把钟摆拆了下来，扛上了城墙。','停摆的那一夜','它每摆一下，城里的钟就好像又走了一秒。']
});
for(const k of['firefly','musicbox','pendulum']){const[l,dn,dl]=LORE[k];Object.assign(ITEMS[k],{lore:l,dn,dl});}
