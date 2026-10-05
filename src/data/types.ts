/* 数据层的类型。文案字段（n/d/f……）在 locales 里，启动时由 i18n/apply.ts 填进同一个对象 */

export type Tag = 'blade' | 'fire' | 'ice' | 'volt' | 'mech' | 'poison';
export type Kind = 'weapon' | 'firearm' | 'potion' | 'gadget' | 'lamp' | 'sky';
export type Fx =
  | 'knife' | 'spark' | 'ice' | 'bolt' | 'rock' | 'none' | 'arrow' | 'axe' | 'shell' | 'quake' | 'flame' | 'bell'
  | 'blizzard' | 'sting' | 'gas' | 'meteor' | 'slash' | 'fslash' | 'firefly' | 'sweep' | 'avalanche' | 'discharge';

export interface ItemDef {
  size: 1 | 2 | 3;
  tag: Tag;
  /** 初始品质 0 铜 / 1 银 / 2 金 */
  t: number;
  up: 'dmg' | 'cd' | 'mix';
  cd: number;
  dmg: number;
  fx: Fx;
  kind?: Kind;
  hero?: string;
  noPool?: number;
  passive?: number;
  snd?: string;
  /* 攻击附带 */
  burn?: number; poison?: number; slow?: number; chain?: number; kb?: number; pierce?: number; pen?: number; aoe?: number;
  freeze?: number; frozenMul?: number; vuln?: [number, number]; exec?: number; multi?: number; ammo?: number;
  critBurn?: number; burnDur?: number; burnMul?: number; poisonDur?: number; stack?: number;
  per?: { tag?: Tag; kind?: Kind; elem?: number; pct: number };
  /* 辅助 */
  charge?: number; chargeKind?: Kind; chargeAll?: number; chargeSmall?: number; buff?: number; buffKind?: { kind: Kind; amt: number };
  horn?: number; prism?: number; detonate?: number; detonateP?: number; fuse?: { tag: Tag; amt: number };
  hasteNb?: number; hasteKind?: { kind: Kind; t: number }; hasteSmall?: number; reload?: number; reloadElse?: number; kindHaste?: number;
  quest?: { n: number; into: string };
  /** 【成长】：永久加基础伤害，跨夜保留 */
  grow?: number;
  /* 【站位】：按所在格子算的独立乘区 */
  /** 占着棋盘正中（第 4、5 格）时 ×(1+值) */
  posMid?: number;
  /** 在棋盘最左或最右时 ×(1+值) */
  posEdge?: number;
  /** 左右两边都是辅助卡（不打伤害）时 ×(1+值) */
  flank?: number;
  /** 辅助：相邻的输出卡伤害 +值（加成区）；自己在正中时翻倍 */
  auraNb?: number;
  /** 每有一张相邻的某类卡，伤害 +pct（加成区） */
  lineKind?: { kind: Kind; pct: number };
  /** 辅助：触发时为 C 位充能 */
  chargeCarry?: number;
  /** 辅助：触发时 C 位下一击 +值 */
  buffCarry?: number;
  /** 触发时给城墙加护盾（品质越高越多） */
  shieldGain?: number;
  /** 伤害额外加上城墙护盾 ×值，和基础伤害一样吃加成与乘区（护盾最多算 TUNE.shieldDmgCap 点） */
  shieldDmg?: number;
  /** 辅助：触发时 C 位【加速】若干秒 */
  hasteCarry?: number;
  /** 辅助：触发时 C 位下一击必定暴击 */
  critCarry?: number;
  /** 辅助：触发时 C 位下一击附带【冻结】若干秒 */
  freezeCarry?: number;
  /** 被其他卡带动出手（连锁、齐鸣、回响）时，伤害 ×(1+值) */
  onChain?: number;
  /** 辅助：相邻的【兵器】卡暴击率 +值 */
  critNb?: number;
  /** 当 C 位时，伤害再 ×(1+值) */
  asCarry?: number;
  /** 辅助：触发时 C 位本场伤害 +值（叠加，打完这夜清零） */
  stackCarry?: number;
  /** 占着正中时，所有【站位】乘区再 +值 */
  posBoost?: number;
  /* 文案 */
  n: string; d: string; f: string; lore?: string; dn?: string; dl?: string;
  /** 任务说明（如「累计闪电弹跳」） */
  questT?: string;
}

export interface UpgradeCurve { d: number[]; c: number[]; t?: string }
export interface AdjDef { r: number; c: string; n: string; ch: string; d: string }

export type Mods = Record<string, number>;

export interface RelicDef {
  /** 品阶 0 普通 / 1 稀有 / 2 史诗 / 3 传说 */
  t: number;
  ico: string;
  m: Mods;
  /** 唯一，不可叠加 */
  u?: number;
  hero?: string;
  /** 只作为「对路」选项出现，不进随机池 */
  fit?: number;
  /** 完整游戏线的宝石（red / blue / green），只在剧情里给 */
  gem?: string;
  n: string; f: string;
}

export interface TalentDef {
  cat: 'atk' | 'def' | 'tech' | 'eco';
  r: number;
  m: Mods;
  hero?: string;
  fit?: number;
  n: string; say: string; d?: string;
}

/** 首领 / 精英的招式：t 是距上一招的秒数，a 是招式（见 sim/enemies.ts 的 INTENTS），n 是招式的参数（数量、秒数、比例），
 * k 是招来的小怪种类（不填用招式默认的）。名字 n 和说明 d 在语言包里 */
export interface Intent { t: number; a: string; n: string; d: string; v?: number; k?: string }

export interface EnemyDef {
  hp: number; spd: number; armor: number; wall: number; spr: string; sc: number; col: string; faction: string;
  boss?: number; elite?: number; fixed?: number; small?: number; big?: number; zig?: number;
  split?: number; splitInto?: string; aura?: number; heal?: number; guard?: number; haste?: number; bomb?: number; phase?: number;
  raise?: number; raiseAs?: string; cargo?: [string, number]; spr2?: string; mimic?: number; rage?: number; stopAt?: number;
  lob?: [number, number]; chill?: number; dive?: number; shell?: number; fbolt?: number;
  /** 第 9 夜首领的候选 */
  final?: number;
  /** 某个守夜人的隐藏首领（完整游戏线第 15 夜） */
  hidden?: string;
  intents?: Intent[];
  n: string; tip?: string; intro?: [string, string] | null;
}

export interface EventDef {
  ico: string;
  cat: 'shop' | 'free' | 'relic' | 'up' | 'misc' | 'rare' | 'fight';
  w: number;
  minR?: number;
  black?: number;
  n: string; d: string; f: string;
}

export interface HeroDef {
  col: string; portrait: string; wall: number; gold: number;
  /** 一开始就能选（模组加的人物默认这样） */
  free?: number;
  /** 跃迁事件用哪个人物的玩法（ayla / mo / ying / jun / li），不填就没有跃迁 */
  jump?: string;
  /** 选人页展示的起手卡 [key, 品质, 格子] */
  start: [string, number, number][];
  n: string; title: string; tag: string; desc: string; intro: string;
}

export interface KitDef { cards: [string, number][]; gold?: number; /** 属于哪个流派（流派没解锁时这套起手也锁着） */ path: string; n: string; d: string }

/** 按人物区分的台词：字符串、随机一句、或 {ayla:'',mo:''} */
export type Line = string | string[] | { [hero: string]: Line } | null | undefined;
