/* 模组包的结构。一个模组是 mods/<名字>/index.ts 默认导出的一个 ModPack。
 * 数据和文字写在一起（模组只写一种语言就行）；字段含义见 docs/modding.md。
 * The mod pack shape. A mod is a ModPack default-exported from mods/<name>/index.ts. Data and text are written together (a mod only needs one language); field meanings are in docs/modding.md.
 */
import type { ItemDef, RelicDef, TalentDef, EnemyDef, HeroDef, KitDef } from '../data/types';
import type { PathDef } from '../data/heroes';
import type { CardHook, X } from '../sim/hooks';
import type { EventDef } from '../data/types';
import type { WorldDef, Hook, StatHook } from '../game/world';
import type { Enemy } from '../sim/types';
import type { PrepStop } from '../game/state';
import type { prepApi } from '../app/prep/actions';

/** 新人物：基本数据 + 起手套 + 流派 + 剧情 / new heroes: base data + opening sets + archetypes + story */
export interface ModHero {
  def: HeroDef;
  kits: KitDef[];
  paths: PathDef[];
  /** 人物剧情，结构和 src/locales/zh-CN/story/ayla.ts 一样，可以只写一部分 / hero story, same shape as src/locales/zh-CN/story/ayla.ts; partial is fine */
  story?: Record<string, any>;
  /** 天性：一直生效的修正项 m（键可以是自己起的名字，钩子里用 mv('键') 读），n / d 是名字和说明 / nature: always-on modifiers m (keys may be your own, read with mv('key') in hooks); n / d are name and text */
  sig?: { n: string; d: string; m: Record<string, number> };
  /** 觉醒：第 6 夜二选一，各自再加一组修正项 / awakening: a pick of two on night 6, each adding more modifiers */
  awaken?: { id: string; n: string; d: string; m: Record<string, number> }[];
  /** 这个人物的战斗钩子（start、use、hit、kill、wall……、end） / this hero's battle hooks (start, use, hit, kill, wall…, end) */
  hooks?: Record<string, Hook>;
  /** 改这个人物的卡的数值 / adjust this hero's card numbers */
  stat?: StatHook;
}

/** 模组事件：数据 + 出现条件 + 进门之后做什么。api 里是备战界面现成的几种选法 / a mod event: data + when it can appear + what happens on entering. api holds the prep screen's ready-made choice layouts */
export interface ModEvent extends Omit<EventDef, 'd'> {
  d?: string;
  /** 这扇门现在能不能出 / whether this door can appear right now */
  need?: () => boolean;
  enter: (cur: PrepStop, api: typeof prepApi) => void;
}

/** 敌人的代码钩子：出场、每帧、受伤（返回改过的伤害）、倒下、战斗事件 / enemy code hooks: spawn, per frame, on hurt (return the adjusted damage), on death, battle events */
export interface EnemyHook {
  spawn?: (e: Enemy) => void;
  step?: (e: Enemy, dt: number) => void;
  hurt?: (e: Enemy, a: number, x: X) => number;
  die?: (e: Enemy) => void;
  on?: Record<string, (e: Enemy, x: X) => void>;
}

/** 像素图：一组字符串，或者拿已有的图换色 / 镜像 / sprite: rows of letters, or an existing sprite recolored / mirrored */
export type ModSprite = string[] | { from: string; swap?: Record<string, string>; flip?: number };

export interface ModPack {
  /** 模组的唯一名字（英文、数字、短横线） / the mod's unique name (lowercase letters, digits, hyphens) */
  id: string;
  /** 显示在工坊里的名字 / the name shown on the Workshop page */
  name: string;
  author?: string;
  version?: string;
  /** 一句话介绍 / a one-line description */
  desc?: string;
  /** 允许用同名的东西覆盖原版（默认不允许，重名会报错跳过） / allow same-name entries to override the base game (off by default; collisions are reported and skipped) */
  override?: boolean;
  /** 像素图：名字 → 字母矩阵（字母见 src/data/art/palette.ts，'.' 是透明） / sprites: name → letter matrix (letters in src/data/art/palette.ts; '.' is transparent) */
  sprites?: Record<string, ModSprite>;
  cards?: Record<string, ItemDef>;
  relics?: Record<string, RelicDef>;
  talents?: Record<string, TalentDef>;
  /** 敌人和首领；首领写 boss: 1、fixed: 1，再写 final: 1 就会进第九夜的轮换 / enemies and bosses; a boss with boss: 1 and fixed: 1 joins the night-9 rotation if it also sets final: 1 */
  enemies?: Record<string, EnemyDef>;
  heroes?: Record<string, ModHero>;
  /** 剧情里的说话人：头像（像素图名字）、颜色、名字 / story speakers: portrait (sprite name), color, name */
  voices?: Record<string, { img: string; c: string; n: string }>;
  /** 公共剧情的补充（新首领的当夜剧情、台词、黎明第一句……），按 src/locales/zh-CN/story.ts 的结构合并 / additions to the shared story (a new boss's night scene, barks, dawn's first line…), merged in the shape of src/locales/zh-CN/story.ts */
  story?: Record<string, any>;
  /** 自己的修正项：键 → 说明 n（show：0 数值、1 百分比、2 只显示说明（默认）、3 独立乘区；inv：越小越好）。遗物、天赋的 m 里就能写这个键，钩子里用 mv('键') 读 / own modifier keys: key → text n (show: 0 number, 1 percent, 2 text only (default), 3 independent multiplier; inv: lower is better). Relics' and talents' m may then use the key; read it in hooks with mv('key') */
  mods?: Record<string, { n: string; show?: number; inv?: number }>;
  /** 世界：人物写 def.world 就进这个世界（见 src/game/world.ts） / worlds: a hero with def.world plays in it (see src/game/world.ts) */
  worlds?: Record<string, Omit<WorldDef, 'id'>>;
  /** 敌人套：按角色替换小怪，和霜潮一样（world 写了就只在那个世界出） / enemy sets: replace adds by role like Frost Tide (with world, only in that world) */
  foesets?: Record<string, { n: string; map: Record<string, string>; world?: string }>;
  /** 备战事件 / prep events */
  events?: Record<string, ModEvent>;
  /** 新的首领招式（和 src/sim/enemies.ts 的 INTENTS 并列） / new boss moves (alongside INTENTS in src/sim/enemies.ts) */
  intents?: Record<string, (e: Enemy, v: number | undefined, k: string | undefined) => void>;
  /** 写代码的效果（fork 之后可以随便写）：卡牌、遗物、天赋的触发钩子 / code-based effects (anything goes after forking): trigger hooks for cards, relics and talents */
  hooks?: {
    cards?: Record<string, CardHook>;
    relics?: Record<string, Record<string, (n: number, x: X) => void>>;
    talents?: Record<string, Record<string, (x: X) => void>>;
    enemies?: Record<string, EnemyHook>;
  };
}

/** 加载结果：哪些模组生效了、哪些东西有问题被跳过了 / load result: which mods took effect and which entries were skipped as invalid */
export interface ModReport {
  id: string;
  name: string;
  author?: string;
  desc?: string;
  added: Record<string, number>;
  errors: string[];
}
