# 做你自己的守夜人（模组教程）

守夜人的内容都是数据：卡牌、遗物、天赋、敌人、首领、人物、剧情。你可以 fork 这个项目，在 `mods/` 里加一个目录写你自己的内容，再部署成只属于你的版本。

你能加的东西：

- 新人物：数值、起手套、流派、专属卡、立绘、整套剧情（夜谈、战斗台词、首领夜、完整游戏线）。
- 新卡牌、新遗物、新天赋。
- 新敌人和新首领；写 `final: 1` 的首领会进第九夜的五选一轮换。
- 新的说话人（剧情里的配角）和像素图。
- 写代码的效果：卡牌、遗物、天赋在战斗里触发的钩子。

暂时不支持在网页里上传模组。

## 快速开始

1. 在 GitHub 上 fork 这个项目，再把你的仓库克隆到本地。
2. 装依赖：`npm install`（要 Node 20.19 以上）。
3. 把示例模组复制一份：`cp -r mods/_example mods/my-mod`。目录名不能以下划线开头，下划线开头的目录不会加载。
4. 改 `mods/my-mod/index.ts` 里的 `id`（小写英文、数字、短横线）和内容，然后 `npm run dev`，打开终端里给的地址。
5. 在标题页点「工坊」，能看到你的模组加了什么、有没有写错的地方。
6. 写完了，提交到你的仓库，点下面的按钮部署：

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fabcdlsj%2Fnightwatch&project-name=nightwatch&repository-name=nightwatch)

   部署时选你 fork 出来的仓库。构建命令和输出目录已经写在 `vercel.json` 里，不用改。

改完文字后跑一次 `npm run check`（类型检查、测试、构建）。如果提示「字体里缺几个字」，跑 `npm run fonts` 把新字收进像素字体（要先 `pip install fonttools brotli`）；不跑也能玩，缺的字会用系统字体显示。

## 模组包

每个模组是 `mods/<目录>/index.ts`，默认导出一个 `ModPack`（类型在 `src/mod/types.ts`，写错了编辑器会提示）：

```ts
import type { ModPack } from '../../src/mod/types';

const pack: ModPack = {
  id: 'my-mod',            // 唯一名字
  name: '我的模组',         // 工坊里显示的名字
  author: '你',
  desc: '一句话介绍',
  sprites: {},            // 像素图
  cards: {},              // 卡牌
  relics: {},             // 遗物
  talents: {},            // 天赋
  enemies: {},            // 敌人和首领
  voices: {},             // 剧情里的说话人
  heroes: {},             // 人物
  story: {},              // 公共剧情的补充（新首领的当夜剧情、台词）
  hooks: {},              // 写代码的效果
};
export default pack;
```

- 所有字段都可以不写。
- 名字（键）和原版或别的模组重名时，这一条会被跳过并报错。要覆盖原版，在包里写 `override: true`。
- 写错的条目会被跳过，别的照常加载；原因写在工坊页和浏览器控制台里。
- 文字直接写在数据旁边（`n` 名字、`d` 说明、`f` 一句闲话），只写一种语言就行。

## 像素图

`sprites` 里每张图是一组字符串，一个字母一个像素，`.` 是透明。卡牌图 16×16，立绘 32×32，首领 32 到 48。每一行长度要一样。

卡牌、立绘、敌人用的图要和它们的名字对上：卡牌 `oar` 用图 `oar`；人物的 `portrait`、敌人的 `spr`、说话人的 `img` 写图的名字。

调色板（`src/data/art/palette.ts`）：

| 字母 | 颜色 |
| --- | --- |
| `f` | #f0c49c |
| `F` | #c98f6a |
| `k` | #1a1c2c |
| `w` | #f4f4f4 |
| `g` | #94b0c2 |
| `s` | #566c86 |
| `d` | #333c57 |
| `r` | #b13e53 |
| `R` | #e43b44 |
| `e` | #6e1b2a |
| `o` | #ef7d57 |
| `y` | #ffcd75 |
| `Y` | #fee761 |
| `l` | #a7f070 |
| `G` | #38b764 |
| `t` | #257179 |
| `b` | #3b5dc9 |
| `c` | #41a6f6 |
| `C` | #73eff7 |
| `p` | #5d275d |
| `P` | #a64ca6 |
| `n` | #7a4a2a |
| `N` | #c28a4d |
| `m` | #4a3326 |
| `a` | #2b2440 |
| `A` | #4a3d6b |
| `i` | #ffe3c8 |
| `u` | #7a2230 |
| `v` | #ffd9a0 |
| `x` | #3d2a1e |

遗物图标可以不画，用「形状:颜色」，比如 `ring:N`、`gem:R`、`potion:c`。形状有 potion、ring、gem、scroll、badge、book、boot、orb、claw、shroom。

想用代码画图，可以参考 `tools/pixelgen.py`（原版所有的图都是它画的），画完把字符串复制进模组。

## 卡牌

```ts
cards: {
  oar: { size: 1, tag: 'blade', t: 0, up: 'cd', cd: 1.1, dmg: 6, fx: 'knife', kind: 'weapon', hero: 'wei', kb: 0.03,
    n: '船桨', d: '一桨拍过去，命中时把敌人推回去一点。', f: '撑了三十年船，手上的力气都在桨上。' },
}
```

必填：

| 字段 | 意思 |
| --- | --- |
| `size` | 占几格：1 小、2 中、3 大 |
| `tag` | 元素：blade 刃、fire 火、ice 冰、volt 电、mech 机、poison 毒 |
| `t` | 初始品质：0 铜、1 银、2 金 |
| `up` | 升品质加什么：dmg 伤害、cd 速度、mix 都加一点 |
| `cd` | 冷却秒数；0 表示没有冷却（配合 `passive: 1`，靠别的事件触发） |
| `dmg` | 基础伤害；0 表示辅助卡 |
| `fx` | 攻击方式，见下表 |
| `n` `d` | 名字和说明 |

可选：`kind`（weapon 兵器、firearm 火器、potion 药剂、gadget 机关、lamp 灯具、sky 天象）、`hero`（写人物名字就是专属卡）、`f`（闲话）、`lore` / `dn` / `dl`（金卡的传闻、钻卡的名字和传闻）、`noPool: 1`（不进店，只能靠任务变出来）、`local: 1`（专属卡不当外乡卡卖给别的人物，适合剧情里点名的卡）。

攻击方式 `fx`：

| fx | 打法 |
| --- | --- |
| knife | 飞向最前面的敌人 |
| arrow | 箭，`pierce` 穿透身后几个 |
| axe | 重击，`pen` 无视几点护甲 |
| rock | 石头，`kb` 击退 |
| spark | 点燃（配 `burn`） |
| ice | 冰（配 `slow` 减速） |
| sting | 毒镖（配 `poison`） |
| bolt | 闪电，`chain` 弹跳几次 |
| shell | 炮弹，`aoe` 爆炸半径 |
| gas | 毒雾，`aoe` 范围 |
| flame | 喷火，`aoe` 范围加灼烧 |
| meteor | 天上砸下来，`aoe` 范围 |
| quake | 震地，`aoe` 范围 |
| slash / fslash | 斩击目标和它身边一个（fslash 带火） |
| sweep | 横扫目标那一排 |
| firefly | 分三只飞向最前面三个 |
| blizzard / bell | 打射程内所有敌人 |
| avalanche / discharge | 打所有被减速或冻住的 |
| none | 不攻击（辅助卡） |

效果字段（都是数字，可以组合）：

| 字段 | 效果 |
| --- | --- |
| `burn` `burnDur` `burnMul` `critBurn` | 灼烧每秒伤害、持续秒数、打烧着的敌人倍率、暴击时灼烧倍率 |
| `poison` `poisonDur` | 中毒每秒伤害（可叠加）、持续秒数 |
| `slow` `freeze` `frozenMul` | 减速比例、冻结秒数、打冻住的敌人倍率 |
| `chain` `pierce` `aoe` `multi` | 弹跳次数、穿透个数、范围半径、一次打几下 |
| `kb` `pen` `exec` `vuln` | 击退距离、穿甲、处决血线（0.2 = 20%）、易伤 `[秒, 比例]` |
| `ammo` | 弹药：每场能打几发 |
| `charge` `chargeKind` | 触发时给左右相邻的卡充能（只给某类卡） |
| `chargeAll` `chargeSmall` `fuse` | 给所有卡 / 所有小卡 / 某元素的卡充能，`fuse: { tag, amt }` |
| `buff` `buffKind` | 左右相邻卡下一击加伤害 |
| `horn` | 触发时左右相邻的卡立即各触发一次（算连锁） |
| `hasteNb` `hasteKind` `hasteSmall` | 加速相邻 / 某类 / 所有小卡几秒 |
| `reload` `reloadElse` | 给相邻弹药卡装填几发，不是弹药卡就充能 |
| `detonate` `detonateP` | 引爆所有敌人身上的灼烧 / 中毒 |
| `shieldGain` `shieldDmg` | 触发时给城墙加护盾 / 伤害加上城墙护盾 |
| `grow` `stack` | 成长关键词（配合钩子永久加伤害） / 本场每触发一次加伤害 |
| `per` | 每有一张某类卡加伤害：`{ kind: 'lamp', pct: 0.15 }` 或 `{ tag }`、`{ elem: 1 }`（元素种数） |
| `posMid` `posEdge` `flank` `lineKind` `auraNb` | 站位：正中、两端、两边都是辅助、相邻同类、给相邻输出卡加伤害 |
| `chargeCarry` `buffCarry` `hasteCarry` `critCarry` `freezeCarry` `stackCarry` | 为 C 位服务 |
| `onChain` `critNb` `asCarry` `posBoost` | 被带动时更狠、给相邻兵器加暴击、当 C 位时更狠、正中时所有站位乘区再加 |
| `quest: { n, into }` | 任务：攒够次数变成另一张卡（计数要写钩子 `questAdd`） |

更复杂的效果写在 `hooks` 里，见最后一节。

## 遗物和天赋

```ts
relics: {
  oldrope: { t: 1, ico: 'ring:N', hero: 'wei', m: { s1: 0.12, slow: 0.2 }, n: '旧缆绳', f: '绑过船，也绑过人。' },
},
talents: {
  steady: { cat: 'def', r: 0, m: { wall: 5 }, n: '稳住', say: '慢慢来，墙跑不了。' },
},
```

- 遗物：`t` 品阶 0 普通、1 稀有、2 史诗、3 传说；`u: 1` 只能拿一件；`hero` 专属。
- 天赋：`cat` 是夜谈回答的倾向（atk / def / tech / eco）；`r` 稀有度 0~2；`say` 是学到时那个人说的话。
- `m` 是修正项，多件叠加：

| 键 | 意思 | 怎么填 |
| --- | --- | --- |
| `rx` | 元素反应效果 | 百分比（0.1 = 10%） |
| `rx_melt` | 融化效果 | 百分比（0.1 = 10%） |
| `rx_shatter` | 碎冰效果 | 百分比（0.1 = 10%） |
| `rx_overload` | 超载效果 | 百分比（0.1 = 10%） |
| `rx_toxic` | 毒爆效果 | 百分比（0.1 = 10%） |
| `rx_super` | 超导效果 | 百分比（0.1 = 10%） |
| `dmg` | 全部伤害 | 百分比（0.1 = 10%） |
| `tag_blade` | 【刃】卡伤害 | 百分比（0.1 = 10%） |
| `tag_fire` | 【火】卡伤害 | 百分比（0.1 = 10%） |
| `tag_volt` | 【电】卡伤害 | 百分比（0.1 = 10%） |
| `tag_ice` | 【冰】卡伤害 | 百分比（0.1 = 10%） |
| `tag_mech` | 【机】卡伤害 | 百分比（0.1 = 10%） |
| `s1` | 小型卡伤害 | 百分比（0.1 = 10%） |
| `s2` | 中型卡伤害 | 百分比（0.1 = 10%） |
| `s3` | 大型卡伤害 | 百分比（0.1 = 10%） |
| `spd` | 攻击速度 | 百分比（0.1 = 10%） |
| `crit` | 暴击率 | 百分比（0.1 = 10%） |
| `critDmg` | 暴击伤害 | 百分比（0.1 = 10%） |
| `burn` | 灼烧伤害 | 百分比（0.1 = 10%） |
| `poison` | 中毒伤害 | 百分比（0.1 = 10%） |
| `chain` | 【电】卡弹跳次数 | 数值 |
| `slow` | 减速效果 | 百分比（0.1 = 10%） |
| `slowVuln` | 被减速的敌人受到伤害 | 百分比（0.1 = 10%） |
| `pen` | 护甲穿透 | 数值 |
| `wall` | 城墙上限 | 数值 |
| `shieldStart` | 开战时城墙护盾 | 数值 |
| `regen` | 每胜一场修复城墙 | 数值 |
| `interest` | 利息上限 | 数值 |
| `winGold` | 每胜一场金币 | 数值 |
| `killGold` | 击杀掉落金币几率 | 百分比（0.1 = 10%） |
| `startCharge` | 开战时所有卡充能 | 百分比（0.1 = 10%） |
| `left` | 最左边的卡伤害 | 百分比（0.1 = 10%） |
| `right` | 最右边的卡伤害 | 百分比（0.1 = 10%） |
| `range` | 射程 | 百分比（0.1 = 10%），越小越好 |
| `aoe` | 爆炸范围 | 百分比（0.1 = 10%） |
| `lonely` | 没有相邻卡的卡伤害 | 百分比（0.1 = 10%） |
| `full` | 棋盘满员时全部伤害 | 百分比（0.1 = 10%） |
| `enemySpd` | 敌人移速 | 百分比（0.1 = 10%），越小越好 |
| `tax` | 店里每样东西贵 | 数值，越小越好 |
| `ammo` | 弹药卡每场弹药 | 数值 |
| `t_alch` | 每有一张【药剂】卡，全部伤害+4% | 开关（填 1） |
| `t_photo` | 【成长】卡的成长速度翻倍 | 开关（填 1） |
| `t_map` | 【任务】条件减半，完成时额外升一个品质 | 开关（填 1） |
| `t_last` | 城墙不到35%时，攻击速度+25% | 开关（填 1） |
| `kspd_weapon` | 【兵器】卡攻击速度 | 百分比（0.1 = 10%） |
| `kspd_lamp` | 【灯具】卡攻击速度 | 百分比（0.1 = 10%） |
| `kspd_firearm` | 【火器】卡攻击速度 | 百分比（0.1 = 10%） |
| `tspd_volt` | 【电】卡攻击速度 | 百分比（0.1 = 10%） |
| `s3spd` | 大型卡攻击速度 | 百分比（0.1 = 10%） |
| `ammoSpd` | 弹药卡攻击速度 | 百分比（0.1 = 10%） |
| `growSpd` | 【成长】卡攻击速度 | 百分比（0.1 = 10%） |
| `t_growspd` | 【成长】卡每攒5点成长，攻击速度+4%（最多+40%） | 开关（填 1） |
| `tag_poison` | 【毒】卡伤害 | 百分比（0.1 = 10%） |
| `xdmg` | 全部伤害 | 独立乘区（0.2 = ×1.2） |
| `xtag_blade` | 【刃】卡伤害 | 独立乘区（0.2 = ×1.2） |
| `xtag_fire` | 【火】卡伤害 | 独立乘区（0.2 = ×1.2） |
| `xtag_ice` | 【冰】卡伤害 | 独立乘区（0.2 = ×1.2） |
| `xtag_volt` | 【电】卡伤害 | 独立乘区（0.2 = ×1.2） |
| `xtag_mech` | 【机】卡伤害 | 独立乘区（0.2 = ×1.2） |
| `xtag_poison` | 【毒】卡伤害 | 独立乘区（0.2 = ×1.2） |
| `xcarry` | C 位伤害 | 独立乘区（0.2 = ×1.2） |

## 敌人和首领

```ts
enemies: {
  reedking: {
    final: 1, boss: 1, fixed: 1, hp: 9000, spd: 0.012, armor: 2, wall: 99, spr: 'b_reed', sc: 1, col: '#38b764', faction: 'swamp',
    n: '芦苇王', tip: '躲在雾里，一边招来成群的虫子，一边让小怪往前冲。',
    intents: [
      { t: 6, a: 'veil', v: 4, n: '起雾', d: '4秒内射程线往城墙压' },
      { t: 8, a: 'brood', v: 5, k: 'bug', n: '分蘖', d: '生出5只裂殖虫' },
    ],
  },
},
```

| 字段 | 意思 |
| --- | --- |
| `hp` `armor` | 血量、护甲（每一下减掉的伤害） |
| `spd` | 移动速度（0.05 是普通小怪） |
| `wall` | 撞到城墙扣多少；首领写 99（撞墙就输） |
| `faction` | swamp / wing / dead / cult / war / abyss / frost |
| `boss` `elite` `fixed` | 首领 / 精英 / 血量不随夜数涨 |
| `final: 1` | 进第九夜首领轮换 |
| `hidden: '人物名'` | 这个人物完整游戏线第十五夜的隐藏首领 |
| 小怪能力 | `split` 死后分裂、`aura` + `heal` / `guard` / `haste` 光环、`bomb` 自爆、`phase` 虚化、`raise` 复活死人、`cargo` 死后放兵、`rage` 越残越快、`lob` 远程砸墙 |

首领招式 `intents`：`t` 是距上一招几秒，`a` 是招式，`v` 是参数，`k` 是招来的小怪（不填用默认），`n` `d` 是招式名和说明。可用的招式（`src/sim/enemies.ts` 的 `INTENTS`）：

| a | 效果（v 的意思） |
| --- | --- |
| shield / molt | 加护盾（最大血量的比例） |
| dash / ram | 冲锋几秒（三倍速） |
| harden | 几秒内护甲 +10 |
| summon / skels / brood | 招小怪（几只；k 换种类） |
| deploy | 放兵（几个骷髅加一个盾卫） |
| gaze / quake | 冻住你几张卡 |
| drain | 吸掉你所有卡的充能（比例） |
| snuff | 你所有卡的充能清零 |
| duel | 你伤害最高的卡动不了几秒 |
| invert | 你最多的那种元素几秒内伤害 -30% |
| eclipse | 几秒内打不出暴击，C 位冻住 |
| hush | 几秒内卡牌之间不再互相带动 |
| roar / lure / wind | 小怪冲锋 / 冲锋几秒 / 几秒内快一半 |
| toll | 最近倒下的几个敌人变成游魂站起来 |
| knell | 全场敌人加护盾（比例） |
| veil | 几秒内射程线往城墙压 |
| pilfer | 偷几金（打倒它还回来再多给 3） |
| barrage / starfall | 往城墙砸几块石头 / 几颗星（还冻卡） |
| rebuild | 回血（比例） |
| gravity | 所有敌人往城墙挪一截（比例） |
| muster | 几个盾卫带双倍骷髅 |

新首领的当夜剧情和台词写在 `story` 里，见模组示例的 `story.bossNights`、`story.foe`、`story.winBy`。

## 人物

```ts
heroes: {
  wei: {
    def: { col: '#7ee8a2', portrait: 'p_wei', wall: 26, gold: 10, jump: 'ayla', start: [],
      n: '苇', title: '摆渡人', tag: '擅长减速与推回', desc: '……', intro: '……' },
    kits: [{ cards: [['oar', 0], ['boatlamp', 0]], path: 'ferry', n: '一桨一灯', d: '船桨推，船灯烧。' }],
    paths: [{ id: 'ferry', mast: 0, cards: ['oar', 'net', 'boatlamp', 'tide', 'buoybell'], n: '摆渡', d: '推回、减速、慢慢烧' }],
    story: { /* 见下一节 */ },
  },
},
```

- `wall` 城墙、`gold` 开局金币、`col` 主题色、`portrait` 立绘图。
- `jump`：第 3、5、7（完整线再加 11）夜之前的跃迁事件，借用哪个人物的玩法：ayla 立 C 位加成长、mo 专攻一个元素、ying 升一张小卡再送一张、jun 立主炮加城墙、li 给 C 位点星。不填就没有跃迁。
- `kits` 起手套，`[卡, 品质]`；`path` 是它属于哪个流派。
- `paths` 流派：`mast` 是要几级熟练才解锁（0 一开始就有），`cards` 是这个流派的专属卡（卡上要写 `hero: '这个人物'`）。用每个流派的起手各守到一次黎明，就会解锁这个人物的完整游戏线。
- 模组人物一开始就能选，不用按顺序解锁。

## 剧情

剧情分两块：公共的（`src/locales/zh-CN/story.ts`，所有人物共用）和人物自己的（`src/locales/zh-CN/story/<人物>.ts`）。人物自己的优先，没写的用公共的。原版五个人物的剧情文件就是最好的例子。

人物剧情（`heroes.<名字>.story`）的结构：

```ts
story: {
  arcs: [                      // 几套夜晚，一局走一套，按顺序轮
    {
      n: '渡口',
      intro: [{ who: 'boatman', t: '……' }],               // 开场后多一两页
      nights: { 1: [[9, 'hero', '……'], [24, 'boatman', '……']] },   // 战斗里的台词 [第几秒, 谁说, 台词]
      talks: { 1: { title, who, lines, q, ans } },          // 夜谈（单数夜）
    },
  ],
  talks: { 9: { … } },          // 不分套的夜谈
  bosses: { eye: { beats: [[4, 'hero', '……']], win: [{ who: 'narr', t: '……' }] } },   // 第九夜每个首领的台词和黎明
  full: {                         // 完整游戏线
    nights: { 10: […], 15: […] }, talks: { 11: { … } },
    noDawn: […], hiddenPre: […], quiet: […], trueWin: […],
    gems: { red: { title, who, lines, q, take: { t, re }, refuse: { t, re } }, blue: …, green: … },
  },
}
```

- 说话人：`hero`（这局的人物）、`narr`（旁白）、`bellman`（老吉）、`soldier`（新兵）、`greyrobe`（灰袍），原版配角（karl、xiaoman、chu、suyan、shen、qin、ahe、douzi、oldshi、guizhi、shitou、hans、popo、lifa），你在 `voices` 里加的人，或者敌人的名字（首领说话）。
- 夜谈：`lines` 是开场几句 `[谁, 台词]`，`q` 是一句提示，`ans` 是三个回答。每个回答有 `cat`（atk 送一张卡 / def 城墙上限 +4 / tech 送一件遗物 / eco 送金币，并决定接下来更容易抽到哪类天赋）、`t`（你说的话）、`re`（对方回的话）。
- 宝石：拿（`take`）得到一颗带代价的宝石，不拿（`refuse`）换一样别的。`re` 是一串 `[谁, 台词]`。

写剧情的建议：别解释设定，让人物在具体的事上说话（一把钥匙、一碗面、一盏灯）；同一个配角在几夜里慢慢露出更多东西。

## 写代码的效果

fork 之后整个游戏都是你的，模组里也可以直接写代码。`hooks` 里给卡牌、遗物、天赋挂战斗事件：

```ts
hooks: {
  cards: {
    buoybell: {
      on: {
        kill: (c) => {
          for (const n of c.nb || []) n.charge = Math.min(1.5, n.charge + 0.06);
        },
      },
    },
  },
},
```

- 事件：start 开战、use 任意卡触发、hit 命中、crit 暴击、burn / poison / freeze 施加状态、bounce 闪电弹跳、kill 击杀、wall 城墙受击、charge 某卡被充能、chain 连锁到 5 的倍数。
- 卡牌钩子收到 `(这张卡, 上下文)`；遗物钩子收到 `(同名遗物件数, 上下文)`；天赋钩子收到 `(上下文)`。上下文里常用的有 `e`（敌人）、`src`（出手的卡）。
- 卡牌还可以写 `onWin(c)`，守住一夜后结算（成长卡就是这么加伤害的）。
- 能用的函数在 `src/sim/hooks.ts` 和 `src/sim/combat.ts`（`chargeCard`、`haste`、`reload`、`hurt`、`trigger`……）。

## 检查和排错

- 标题页「工坊」：列出加载了哪些模组、各加了多少东西、哪些条目写错被跳过。
- 浏览器控制台：每个有错的模组打一条警告。
- `npm run check`：类型检查、测试、构建。`tests/unit/mods.test.ts` 会检查示例模组；可以照着加一条检查你自己的模组。
- 平衡：`npm run bench` 跑原版各流派的成型阵容（见 `docs/balance.md`），可以在 `tests/balance/builds.ts` 里加一套你的人物阵容一起比。
